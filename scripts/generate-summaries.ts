import * as fs from "fs";
import * as path from "path";
import type { Article, Alert } from "../lib/summarize.ts";
import { createAlertFromArticle } from "../lib/summarize.ts";

if (fs.existsSync(".env") && typeof (process as any).loadEnvFile === "function") {
  (process as any).loadEnvFile(".env");
}

async function main() {
  const articlesPath = path.resolve(process.cwd(), "data/sample-articles.json");
  const summariesPath = path.resolve(process.cwd(), "data/sample-summaries.json");

  if (!fs.existsSync(articlesPath)) {
    console.error(`Articles file not found at ${articlesPath}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(articlesPath, "utf-8");
  const articles: Article[] = JSON.parse(raw);

  console.log(`Loaded ${articles.length} articles from ${articlesPath}`);
  const summariesRecord: Record<string, Alert> = {};

  for (const article of articles) {
    console.log(`Processing article [${article.id}]: ${article.title}`);
    const alert = await createAlertFromArticle(article);
    summariesRecord[article.id] = alert;
    console.log(`  -> Severity: ${alert.severity}, Score: ${alert.score}`);
    console.log(`  -> Summary: ${alert.summary.substring(0, 80)}...`);
    console.log(`  -> Timeline Events: ${alert.timeline_events.length}`);
  }

  fs.writeFileSync(summariesPath, JSON.stringify(summariesRecord, null, 2), "utf-8");
  console.log(`\nSuccessfully saved ${Object.keys(summariesRecord).length} summaries to ${summariesPath}`);
}

main().catch((err) => {
  console.error("Error generating summaries:", err);
  process.exit(1);
});
