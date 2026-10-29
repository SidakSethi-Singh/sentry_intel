/** Local single-process demo storage. Use Supabase for shared/serverless deployments. */
import * as fs from "node:fs";
import * as path from "node:path";
import { randomUUID } from "node:crypto";
import type { Article } from "./supabase";
import type { Alert } from "./summarize";

type Store = { articles: Record<string, Article>; alerts: Record<string, Alert> };
const storePath = () => path.resolve(process.cwd(), "data/local-db.json");

function read(): Store {
  if (fs.existsSync(storePath())) return JSON.parse(fs.readFileSync(storePath(), "utf8")) as Store;
  const articles = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), "data/sample-articles.json"), "utf8")) as Article[];
  const samples = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), "data/sample-summaries.json"), "utf8")) as Record<string, Alert>;
  return { articles: Object.fromEntries(articles.map(a => [a.id, a])), alerts: Object.fromEntries(Object.values(samples).map(a => [a.id, a])) };
}
function write(store: Store): void {
  const target = storePath();
  const temporary = `${target}.${randomUUID()}.tmp`;
  try {
    fs.writeFileSync(temporary, JSON.stringify(store, null, 2), { flag: "wx" });
    fs.renameSync(temporary, target);
  } finally {
    if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
  }
}
export function listLocalAlerts(): Alert[] {
  return Object.values(read().alerts).sort((a, b) => b.created_at.localeCompare(a.created_at));
}
export function localArticleExists(filter: { id?: string; url?: string }): boolean {
  return Object.values(read().articles).some(a => !!((filter.id && a.id === filter.id) || (filter.url && a.url === filter.url)));
}
export function localAlertExists(articleId: string): boolean {
  return Object.values(read().alerts).some(a => a.article_id === articleId || a.related_article_ids?.includes(articleId));
}
export function saveLocalArticle(article: Article): Article {
  const store = read(); store.articles[article.id] = article; write(store); return article;
}
export function saveLocalAlert(alert: Alert): Alert {
  const store = read(); store.alerts[alert.id] = alert; write(store); return alert;
}
