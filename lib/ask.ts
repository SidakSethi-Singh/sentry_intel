/**
 * Sentry Intel - Ask Sentry (RAG Q&A Engine)
 * Searches cached intelligence alerts using keyword + entity + location matching with recency boost,
 * and synthesizes factual answers citing exact Alert IDs. Never invents facts.
 */

import * as fs from "fs";
import * as path from "path";
import type { Alert } from "./summarize.ts";
import { useLocalStore } from "./supabase";
import { listLocalAlerts } from "./local-db";

export interface AskSentryResponse {
  question: string;
  answer: string;
  citations: string[];
  retrieved_alerts: Alert[];
}

export interface MorningBriefResponse {
  title: string;
  brief: string;
  top_alerts: Alert[];
  generated_at: string;
}

/**
 * Loads deduplicated alert objects from data/sample-summaries.json
 */
export function getCachedAlerts(): Alert[] {
  try {
    const filePath = path.resolve(process.cwd(), "data/sample-summaries.json");
    if (!fs.existsSync(filePath)) {
      return [];
    }
    const raw = fs.readFileSync(filePath, "utf-8");
    const data: Record<string, Alert> = JSON.parse(raw);

    // Filter to unique alerts by alert.id
    const seen = new Set<string>();
    const alerts: Alert[] = [];
    for (const alert of Object.values(data)) {
      if (alert && alert.id && !seen.has(alert.id)) {
        seen.add(alert.id);
        alerts.push(alert);
      }
    }
    return alerts;
  } catch (err) {
    console.warn("Failed to load cached alerts:", (err as Error).message);
    return [];
  }
}

/**
 * Common English stop words to filter out during retrieval
 */
const STOP_WORDS = new Set([
  "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for", "of",
  "with", "by", "from", "up", "about", "into", "over", "after", "is", "are",
  "was", "were", "be", "been", "being", "have", "has", "had", "do", "does",
  "did", "what", "where", "when", "why", "who", "which", "how", "tell", "me",
  "any", "there", "this", "that", "these", "those", "week", "today", "recent",
  "reported", "happened", "near", "involving"
]);

/**
 * Tokenizes text into search terms
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

/**
 * RAG Retrieval: Ranks alerts using keyword, entity, location, and recency scoring
 */
export function retrieveAlerts(question: string, alerts: Alert[], topK: number = 4): Alert[] {
  if (!question || alerts.length === 0) return [];

  const queryLower = question.toLowerCase();
  const queryTokens = tokenize(question);

  if (queryTokens.length === 0 && queryLower.trim().length === 0) return [];

  const now = Date.now();

  const scoredAlerts = alerts.map((alert) => {
    let score = 0;
    const alertTitle = (alert.id + " " + (alert.sources?.[0]?.name || "")).toLowerCase();
    const alertSummary = (alert.summary || "").toLowerCase();
    const alertLocation = (alert.location || "").toLowerCase();
    const alertEntities = (alert.entities || []).map((e) => e.name.toLowerCase());

    // 1. Exact location match boost (+50 points)
    if (alertLocation && queryLower.includes(alertLocation)) {
      score += 50;
    } else if (alertLocation) {
      for (const locWord of alertLocation.split(/\s+/)) {
        if (locWord.length > 3 && queryLower.includes(locWord)) {
          score += 35;
        }
      }
    }

    // 2. Entity matches (Actor, Asset, Threat) (+30 points per match)
    for (const ent of alertEntities) {
      if (queryLower.includes(ent)) {
        score += 35;
      } else {
        const words = ent.split(/\s+/);
        for (const w of words) {
          if (w.length > 3 && queryLower.includes(w)) {
            score += 15;
          }
        }
      }
    }

    // 3. Keyword token matching across title & summary
    for (const token of queryTokens) {
      if (alertTitle.includes(token)) score += 20;
      if (alertSummary.includes(token)) score += 10;
      if (alert.score_justification?.toLowerCase().includes(token)) score += 8;

      // Check timeline events
      for (const ev of alert.timeline_events || []) {
        if (ev.event.toLowerCase().includes(token)) score += 8;
      }
    }

    // 4. Severity boost (analysts prioritize high-severity events if relevant)
    if (score > 0) {
      if (alert.severity === "critical") score += 10;
      else if (alert.severity === "high") score += 7;
      else if (alert.severity === "medium") score += 4;
    }

    // 5. Recency boost (up to +10 points for recent alerts)
    if (score > 0 && alert.created_at) {
      const alertTime = new Date(alert.created_at).getTime();
      const ageHours = Math.max(0, (now - alertTime) / (1000 * 60 * 60));
      const recencyBoost = Math.max(0, 10 - ageHours * 0.2);
      score += recencyBoost;
    }

    return { alert, score };
  });

  // Filter to alerts with positive score and sort descending
  const matches = scoredAlerts
    .filter((item) => item.score > 12)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.alert);

  return matches.slice(0, Math.min(topK, 5));
}

/**
 * Calls LLM to synthesize answer citing retrieved alert IDs strictly
 */
async function synthesizeWithLLM(
  question: string,
  retrievedAlerts: Alert[],
  apiKey: string,
  provider: "groq" | "openai"
): Promise<string | null> {
  const context = retrievedAlerts
    .map(
      (a, i) =>
        `[ALERT ${i + 1} - ID: ${a.id}]\nTitle/Location: ${a.location || a.id}\nSeverity: ${a.severity.toUpperCase()}\nSummary: ${a.summary}\nCorroboration: ${a.corroboration_badge || "Single Source"}\nTimeline: ${(a.timeline_events || []).map((e) => `${e.time}: ${e.event}`).join("; ")}`
    )
    .join("\n\n");

  const prompt = `You are the Sentry Intel Threat Intelligence Q&A engine.
Answer the user's question using EXCLUSIVELY the facts in the provided alerts below.
CRITICAL RULES:
1. Never invent or extrapolate facts not present in these alerts.
2. Every claim in your answer MUST be cited using the exact alert ID in square brackets, e.g. [${retrievedAlerts[0]?.id}].
3. Keep the answer concise (2-4 plain sentences).
4. If the retrieved alerts do not answer the question, say "No matching alerts found."

USER QUESTION: "${question}"

RETRIEVED ALERTS:
${context}

SYNTHESIZED ANSWER:`;

  try {
    const url =
      provider === "groq"
        ? "https://api.groq.com/openai/v1/chat/completions"
        : "https://api.openai.com/v1/chat/completions";

    const model = provider === "groq" ? "openai/gpt-oss-120b" : "gpt-4o-mini";

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
      }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || null;
  } catch {
    return null;
  }
}

/**
 * Fallback extractive synthesizer when offline or rate-limited.
 * Strict factual citation guarantee.
 */
function synthesizeExtractive(retrievedAlerts: Alert[]): { answer: string; citations: string[] } {
  if (retrievedAlerts.length === 0) {
    return { answer: "No matching alerts found.", citations: [] };
  }

  const citations: string[] = [];
  const sentences: string[] = [];

  for (const alert of retrievedAlerts.slice(0, 3)) {
    citations.push(alert.id);

    // Pick first factual sentence from summary
    const firstSentence = alert.summary.split(/(?<=[.!?])\s+/)[0] || alert.summary;
    const cleanSentence = firstSentence.trim().replace(/\.$/, "");
    sentences.push(`${cleanSentence} [${alert.id}].`);
  }

  return {
    answer: sentences.join(" "),
    citations,
  };
}

/**
 * Main Ask Sentry Function
 * Takes a user question, searches cached intelligence, synthesizes answer citing Alert IDs.
 */
export async function askSentry(question: string, customAlerts?: Alert[]): Promise<AskSentryResponse> {
  const alerts = customAlerts ?? (useLocalStore() ? listLocalAlerts() : getCachedAlerts());

  if (!question || question.trim().length === 0) {
    return {
      question: "",
      answer: "Please enter a threat intelligence query (e.g. 'What happened near Ladakh this week?').",
      citations: [],
      retrieved_alerts: [],
    };
  }

  const retrieved = retrieveAlerts(question, alerts, 4);

  if (retrieved.length === 0) {
    return {
      question,
      answer: "No matching alerts found.",
      citations: [],
      retrieved_alerts: [],
    };
  }

  // Attempt LLM synthesis with citations
  const rawGrok = process.env.GROK_API_KEY?.trim() || "";
  const groqKey = (process.env.GROQ_API_KEY || (rawGrok.startsWith("gsk_") ? rawGrok : ""))?.trim();
  const openAiKey = process.env.OPENAI_API_KEY?.trim();

  let answer: string | null = null;

  if (groqKey) {
    answer = await synthesizeWithLLM(question, retrieved, groqKey, "groq");
  }

  if (!answer && openAiKey) {
    answer = await synthesizeWithLLM(question, retrieved, openAiKey, "openai");
  }

  // Fallback to deterministic extractive synthesis
  if (!answer) {
    const fallback = synthesizeExtractive(retrieved);
    answer = fallback.answer;
  }

  // Extract cited alert IDs from the answer
  const citationMatches = answer.match(/\[(alert-[a-zA-Z0-9_-]+)\]/g) || [];
  const citations = Array.from(
    new Set(citationMatches.map((c) => c.replace(/^\[/, "").replace(/\]$/, "")))
  );

  // If LLM didn't attach brackets, ensure retrieved alert IDs are listed
  if (citations.length === 0) {
    for (const r of retrieved) {
      citations.push(r.id);
    }
  }

  return {
    question,
    answer,
    citations,
    retrieved_alerts: retrieved,
  };
}

/**
 * Morning Brief Generator:
 * Turns the top critical & high alerts into an executive intelligence brief.
 */
export async function generateMorningBrief(customAlerts?: Alert[]): Promise<MorningBriefResponse> {
  const alerts = customAlerts ?? (useLocalStore() ? listLocalAlerts() : getCachedAlerts());

  // Sort by score descending (critical first)
  const topAlerts = [...alerts]
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const bullets = topAlerts.map((a, i) => {
    const badge = a.corroboration_badge ? ` (${a.corroboration_badge})` : "";
    return `${i + 1}. [${a.severity.toUpperCase()}] ${a.summary} [${a.id}]${badge}`;
  });

  const brief = `EXECUTIVE THREAT INTELLIGENCE BRIEF (${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}):\n\n` +
    bullets.join("\n\n");

  return {
    title: "Sentry Intel Daily Executive Threat Briefing",
    brief,
    top_alerts: topAlerts,
    generated_at: new Date().toISOString(),
  };
}
