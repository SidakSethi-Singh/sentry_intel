import * as fs from "fs";
import * as path from "path";
import type { Article } from "../lib/summarize.ts";
import { processAndClusterArticles } from "../lib/summarize.ts";

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
  console.log(`Clustering and corroborating multi-source incident reports...`);

  const summariesRecord = await processAndClusterArticles(articles);

  for (const [key, alert] of Object.entries(summariesRecord)) {
    if (key.startsWith("alert-")) {
      console.log(`\nIncident Alert: [${alert.id}]`);
      console.log(`  -> Severity: ${alert.severity.toUpperCase()} (Score: ${alert.score})`);
      console.log(`  -> Corroboration: ${alert.corroboration_badge} (${alert.sources.length} sources)`);
      console.log(`  -> Audit Justification: ${alert.score_justification}`);
      console.log(`  -> Timeline Events: ${alert.timeline_events.length}`);
      console.log(`  -> Summary: ${alert.summary.substring(0, 90)}...`);
    }
  }

  fs.writeFileSync(summariesPath, JSON.stringify(summariesRecord, null, 2), "utf-8");
  console.log(`\nSuccessfully saved ${Object.keys(summariesRecord).length} alert entries to ${summariesPath}`);
}

main().catch((err) => {
  console.error("Error generating summaries:", err);
  process.exit(1);
});
