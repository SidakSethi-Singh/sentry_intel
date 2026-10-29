import { NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";
import {
  upsertArticle,
  insertAlert,
  alertExists,
  Article,
  Alert,
  DatabaseError,
} from "@/lib/supabase";
import { createAlertFromArticle } from "@/lib/summarize";
import { ingestArticles } from "@/lib/ingest";

export const maxDuration = 120;

function getFallbackArticles(): Article[] {
  const filePath = path.resolve(process.cwd(), "data/sample-articles.json");
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as Article[];
}

async function getArticlesToIngest(): Promise<{ articles: Article[]; source: "live" | "fallback" }> {
  try {
    const articles = await ingestArticles();
    if (articles.length > 0) {
      return { articles, source: "live" };
    }
  } catch {
  }

  return { articles: getFallbackArticles(), source: "fallback" };
}

export async function POST() {
  try {
    const { articles, source } = await getArticlesToIngest();

    let processed = 0;
    let skipped = 0;
    let failed = 0;
    const errors: Array<{ id: string; error: string }> = [];

    for (const article of articles) {
      try {
        const exists = await alertExists(article.id);
        if (exists) {
          skipped++;
          continue;
        }

        const summaryAlert = await createAlertFromArticle(article);

        const mappedSources: string[] = (summaryAlert.sources || []).map((s: unknown) => {
          if (typeof s === "string") return s;
          if (s && typeof s === "object" && "url" in s) return String((s as { url: string }).url);
          if (s && typeof s === "object" && "name" in s) return String((s as { name: string }).name);
          return String(s);
        });

        const mappedTimeline: string[] = (summaryAlert.timeline_events || []).map((e: unknown) => {
          if (typeof e === "string") return e;
          if (e && typeof e === "object" && "time" in e && "event" in e) {
            const ev = e as { time: string; event: string };
            return `${ev.time}: ${ev.event}`;
          }
          return String(e);
        });

        const alertToInsert: Alert = {
          id: summaryAlert.id || `alert-${article.id}`,
          article_id: article.id,
          severity: summaryAlert.severity,
          score: summaryAlert.score,
          summary: summaryAlert.summary,
          sources: mappedSources,
          timeline_events: mappedTimeline,
          created_at: summaryAlert.created_at || new Date().toISOString(),
        };

        await upsertArticle({
          id: article.id,
          title: article.title,
          source: article.source,
          url: article.url,
          published_at: article.published_at,
          text: article.text,
        });

        await insertAlert(alertToInsert, summaryAlert);
        processed++;
      } catch (err) {
        failed++;
        const message = err instanceof Error ? err.message : "Unknown error processing article";
        errors.push({ id: article.id, error: message });
      }
    }

    return NextResponse.json({
      source,
      processed,
      skipped,
      failed,
      errors,
    });
  } catch (err) {
    if (err instanceof DatabaseError) {
      return NextResponse.json(
        { error: { code: err.code, message: err.message } },
        { status: 500 }
      );
    }
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message } },
      { status: 500 }
    );
  }
}
