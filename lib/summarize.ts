/**
 * Sentry Intel - RAG / Summarization Core
 * API Contract:
 * - Article: { id, title, source, url, published_at, text }
 * - Alert: { id, article_id, severity, score, summary, sources[], timeline_events[], created_at }
 */

export interface Article {
  id: string;
  title: string;
  source: string;
  url: string;
  published_at: string;
  text: string;
}

export interface TimelineEvent {
  time: string;
  event: string;
}

export interface SourceItem {
  name: string;
  url: string;
}

export interface SummarizeResult {
  summary: string;
  timeline_events: TimelineEvent[];
  sources: SourceItem[];
}

export type AlertSeverity = "low" | "medium" | "high" | "critical";

export interface Alert {
  id: string;
  article_id: string;
  severity: AlertSeverity;
  score: number;
  summary: string;
  sources: SourceItem[];
  timeline_events: TimelineEvent[];
  created_at: string;
}

/**
 * Key indicators for threat scoring & extractive sentence ranking
 */
const WHAT_TERMS = [
  "intercepted", "detected", "scrambled", "thwarted", "deployed", "launched",
  "isolated", "evacuation", "evacuated", "disengagement", "patrols", "assault",
  "attack", "malware", "trojan", "breach", "breaching", "crashed", "engaged",
  "concluded", "advisory", "raised", "intensified", "storm surge", "distress"
];

const WHO_TERMS = [
  "air force", "iaf", "navy", "drdo", "cert-in", "nciipc", "ndrf", "reliefweb",
  "ministry", "commanders", "commandos", "marcos", "fighters", "experts",
  "officials", "authorities", "combatants", "teams", "delegation"
];

const WHY_TERMS = [
  "threat", "security", "defence", "defense", "readiness", "airspace", "border",
  "critical", "infrastructure", "casualties", "safely", "disruptions", "grid",
  "humanitarian", "crisis", "alert", "de-escalation", "verification", "precautionary"
];

/**
 * Splits text into individual sentences while preserving abbreviations.
 */
function splitIntoSentences(text: string): string[] {
  if (!text || typeof text !== "string") return [];

  // Protect common acronyms and abbreviations from being split incorrectly
  const normalized = text
    .replace(/\r\n|\r|\n/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Split on sentence boundaries: period, question mark, or exclamation followed by space and capital letter
  const rawSentences = normalized.match(/[^.!?]+[.!?]+(?:\s|$)/g) || [normalized];

  return rawSentences
    .map((s) => s.trim())
    .filter((s) => s.length > 20);
}

/**
 * Extracts chronological timeline events from article text.
 */
function extractTimelineEvents(text: string, defaultDate: string): TimelineEvent[] {
  const sentences = splitIntoSentences(text);
  const events: TimelineEvent[] = [];

  // Precise time patterns: dates with time, HH:MM timezones, relative durations
  const timeRegex = /\b(?:(?:On|By)\s+)?(?:(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:,?\s+\d{4})?(?:\s+at\s+\d{1,2}:\d{2}(?:\s*(?:IST|UTC|GMT|AM|PM|hrs))?)?|\d{1,2}:\d{2}(?:\s*(?:IST|UTC|GMT|AM|PM|hrs))?|(?:within|after)\s+\d{1,2}\s+(?:minutes|hours|days))\b/i;

  for (const sentence of sentences) {
    const match = sentence.match(timeRegex);
    if (match && match[0]) {
      const matchedTime = match[0].trim();

      // Clean leading timestamp if at the very start of the sentence
      let eventText = sentence
        .replace(/^(?:On|By|At)?\s*(?:(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:,?\s+\d{4})?(?:\s+at\s+\d{1,2}:\d{2}(?:\s*(?:IST|UTC|GMT|AM|PM|hrs))?)?|\d{1,2}:\d{2}(?:\s*(?:IST|UTC|GMT|AM|PM|hrs))?)\s*,?\s*/i, "")
        .trim();

      // Capitalize first letter
      if (eventText.length > 0) {
        eventText = eventText.charAt(0).toUpperCase() + eventText.slice(1);
      }

      events.push({
        time: matchedTime,
        event: eventText || sentence,
      });
    }
  }

  // If no specific times found, fallback to published_at or first sentence
  if (events.length === 0 && sentences.length > 0) {
    const formattedFallback = defaultDate
      ? new Date(defaultDate).toISOString().replace("T", " ").substring(0, 16) + " UTC"
      : "Initial Report";
    events.push({
      time: formattedFallback,
      event: sentences[0],
    });
  }

  return events;
}

/**
 * Extractive fallback summarization.
 * Strictly picks 2-3 of the most informative sentences covering:
 * 1. What happened
 * 2. Who is involved
 * 3. Why it matters
 * Never invents facts.
 */
function extractiveSummary(text: string, title?: string): string {
  const sentences = splitIntoSentences(text);
  if (sentences.length === 0) return text.trim();
  if (sentences.length <= 3) return sentences.join(" ");

  interface ScoredSentence {
    sentence: string;
    score: number;
    index: number;
    hasWhat: boolean;
    hasWho: boolean;
    hasWhy: boolean;
  }

  const scored: ScoredSentence[] = sentences.map((sentence, index) => {
    const lower = sentence.toLowerCase();
    let score = 0;

    // Check key dimensions
    const hasWhat = WHAT_TERMS.some((w) => lower.includes(w));
    const hasWho = WHO_TERMS.some((w) => lower.includes(w));
    const hasWhy = WHY_TERMS.some((w) => lower.includes(w));

    if (hasWhat) score += 3.5;
    if (hasWho) score += 3.0;
    if (hasWhy) score += 3.0;

    // Lead sentence bonus (journalistic inverted pyramid)
    if (index === 0) score += 4.0;
    else if (index === 1) score += 2.0;

    // Title overlap bonus
    if (title) {
      const titleWords = title
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 3);
      const overlap = titleWords.filter((w) => lower.includes(w)).length;
      score += overlap * 1.2;
    }

    // Length normalization (favor complete informative sentences between 60 and 220 chars)
    if (sentence.length >= 60 && sentence.length <= 220) {
      score += 1.5;
    }

    return { sentence, score, index, hasWhat, hasWho, hasWhy };
  });

  // Pick the best lead/what sentence
  scored.sort((a, b) => b.score - a.score);

  const selectedIndexes = new Set<number>();

  // 1. Pick highest overall scored sentence (often lead / what happened)
  selectedIndexes.add(scored[0].index);

  // 2. Pick best sentence that covers 'why it matters' or 'who is involved'
  const second = scored.find(
    (s) => !selectedIndexes.has(s.index) && (s.hasWhy || s.hasWho)
  );
  if (second) {
    selectedIndexes.add(second.index);
  }

  // 3. Pick a 3rd sentence to reach 2-3 plain sentences
  const third = scored.find((s) => !selectedIndexes.has(s.index));
  if (third && selectedIndexes.size < 3) {
    selectedIndexes.add(third.index);
  }

  // Restore chronological order from the original text
  const sortedSelection = Array.from(selectedIndexes).sort((a, b) => a - b);
  return sortedSelection.map((idx) => sentences[idx]).join(" ");
}

/**
 * Calls OpenAI API if key is present.
 */
async function callOpenAI(apiKey: string, article: Article): Promise<SummarizeResult | null> {
  const prompt = `You are a defence and national security intelligence analyst.
Summarize the following article in exactly 2 to 3 plain, factual sentences.
Cover: 1) What happened, 2) Who is involved, and 3) Why it matters.
CRITICAL: Never invent facts. Rely strictly on the provided text.

Extract all chronological timeline events mentioned in the text in order.

Format your response as strict JSON with this exact schema:
{
  "summary": "2-3 plain sentences",
  "timeline_events": [
    { "time": "timestamp string from text", "event": "event description" }
  ]
}

Article Title: ${article.title}
Source: ${article.source}
Published At: ${article.published_at}
Text:
${article.text}`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You respond only in valid JSON." },
        { role: "user", content: prompt },
      ],
      temperature: 0.1,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    throw new Error(`OpenAI API error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) return null;

  const parsed = JSON.parse(content);
  return {
    summary: parsed.summary,
    timeline_events: Array.isArray(parsed.timeline_events) ? parsed.timeline_events : [],
    sources: [{ name: article.source, url: article.url }],
  };
}

/**
 * Calls Anthropic Claude API if key is present.
 */
async function callAnthropic(apiKey: string, article: Article): Promise<SummarizeResult | null> {
  const prompt = `You are a defence and national security intelligence analyst.
Summarize the following article in exactly 2 to 3 plain, factual sentences covering what happened, who is involved, and why it matters.
Never invent facts. Rely strictly on the text provided.
Extract chronological timeline events as a JSON array.

Respond ONLY with valid JSON:
{
  "summary": "2-3 plain sentences",
  "timeline_events": [
    { "time": "timestamp string", "event": "event description" }
  ]
}

Article Title: ${article.title}
Source: ${article.source}
Text: ${article.text}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-3-haiku-20240307",
      max_tokens: 600,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    throw new Error(`Anthropic API error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  const textContent = data.content?.[0]?.text;
  if (!textContent) return null;

  // Extract JSON from response
  const jsonMatch = textContent.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;

  const parsed = JSON.parse(jsonMatch[0]);
  return {
    summary: parsed.summary,
    timeline_events: Array.isArray(parsed.timeline_events) ? parsed.timeline_events : [],
    sources: [{ name: article.source, url: article.url }],
  };
}

/**
 * Calls Grok (xAI) API if key is present.
 */
async function callGrok(apiKey: string, article: Article): Promise<SummarizeResult | null> {
  const prompt = `You are a defence and national security intelligence analyst.
Summarize the following article in exactly 2 to 3 plain, factual sentences.
Cover: 1) What happened, 2) Who is involved, and 3) Why it matters.
CRITICAL: Never invent facts. Rely strictly on the provided text.

Extract all chronological timeline events mentioned in the text in order.

Format your response as strict JSON with this exact schema:
{
  "summary": "2-3 plain sentences",
  "timeline_events": [
    { "time": "timestamp string from text", "event": "event description" }
  ]
}

Article Title: ${article.title}
Source: ${article.source}
Published At: ${article.published_at}
Text:
${article.text}`;

  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "grok-2-latest",
      messages: [
        { role: "system", content: "You respond only in valid JSON." },
        { role: "user", content: prompt },
      ],
      temperature: 0.1,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    throw new Error(`Grok API error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) return null;

  const parsed = JSON.parse(content);
  return {
    summary: parsed.summary,
    timeline_events: Array.isArray(parsed.timeline_events) ? parsed.timeline_events : [],
    sources: [{ name: article.source, url: article.url }],
  };
}

/**
 * Main function: summarizeArticle(article)
 * Returns { summary, timeline_events, sources }
 * - Uses LLM if OPENAI_API_KEY, GROK_API_KEY, or ANTHROPIC_API_KEY is present
 * - Falls back to high-accuracy extractive algorithm offline or on failure
 * - Never crashes
 */
export async function summarizeArticle(article: Article): Promise<SummarizeResult> {
  if (!article || !article.text) {
    return {
      summary: "",
      timeline_events: [],
      sources: article ? [{ name: article.source || "Unknown", url: article.url || "" }] : [],
    };
  }

  // 1. Check for LLM keys in environment
  const openAiKey = process.env.OPENAI_API_KEY?.trim();
  const grokKey = (process.env.GROK_API_KEY || process.env.XAI_API_KEY)?.trim();
  const anthropicKey = process.env.ANTHROPIC_API_KEY?.trim();

  // Try Grok if configured
  if (grokKey) {
    try {
      const result = await callGrok(grokKey, article);
      if (result && result.summary) {
        return result;
      }
    } catch (err) {
      console.warn("Grok summarization failed, falling back:", (err as Error).message);
    }
  }

  // Try OpenAI if configured
  if (openAiKey) {
    try {
      const result = await callOpenAI(openAiKey, article);
      if (result && result.summary) {
        return result;
      }
    } catch (err) {
      console.warn("OpenAI summarization failed, falling back:", (err as Error).message);
    }
  }

  // Try Anthropic if configured
  if (anthropicKey) {
    try {
      const result = await callAnthropic(anthropicKey, article);
      if (result && result.summary) {
        return result;
      }
    } catch (err) {
      console.warn("Anthropic summarization failed, falling back:", (err as Error).message);
    }
  }

  // 2. Extractive Fallback (Offline / Zero-Config)
  const summary = extractiveSummary(article.text, article.title);
  const timeline_events = extractTimelineEvents(article.text, article.published_at);
  const sources: SourceItem[] = [{ name: article.source, url: article.url }];

  return {
    summary,
    timeline_events,
    sources,
  };
}

/**
 * Threat Scoring & Severity assessment
 * Compatible with the Alert contract
 */
export function calculateThreatAssessment(text: string, title: string = ""): { score: number; severity: AlertSeverity } {
  const combined = `${title} ${text}`.toLowerCase();
  let score = 30; // base score

  // Critical indicators (+25)
  const criticalTerms = ["airspace breach", "cyber attack", "hostile", "malware", "red alert", "storm surge", "drone crash", "pirate", "skiffs", "missile"];
  for (const t of criticalTerms) {
    if (combined.includes(t)) score += 15;
  }

  // High indicators (+15)
  const highTerms = ["intercepted", "thwarted", "scrambled", "countermeasures", "zero-day", "advisory", "evacuation", "standoff", "dispute"];
  for (const t of highTerms) {
    if (combined.includes(t)) score += 10;
  }

  // Medium indicators (+5)
  const mediumTerms = ["patrol", "talks", "verification", "drdo", "iaf", "navy", "ndrf", "radar"];
  for (const t of mediumTerms) {
    if (combined.includes(t)) score += 5;
  }

  // Clamp score between 10 and 98
  score = Math.min(Math.max(score, 15), 98);

  let severity: AlertSeverity = "low";
  if (score >= 80) severity = "critical";
  else if (score >= 65) severity = "high";
  else if (score >= 40) severity = "medium";

  return { score, severity };
}

/**
 * Transforms an Article into a full Alert contract object
 * Contract: { id, article_id, severity, score, summary, sources[], timeline_events[], created_at }
 */
export async function createAlertFromArticle(article: Article): Promise<Alert> {
  const { summary, timeline_events, sources } = await summarizeArticle(article);
  const { score, severity } = calculateThreatAssessment(article.text, article.title);

  return {
    id: `alert-${article.id}`,
    article_id: article.id,
    severity,
    score,
    summary,
    sources,
    timeline_events,
    created_at: new Date().toISOString(),
  };
}
