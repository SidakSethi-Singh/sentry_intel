import { createHash } from "node:crypto";
import type { Article } from "./supabase";

const GOOGLE_NEWS_URL = "https://news.google.com/rss/search?q=India+defence+security&hl=en-IN&gl=IN&ceid=IN:en";

/** Decode the entities commonly present in RSS and HTML snippets. */
function decodeEntities(value: string): string {
  const named: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
  return value.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (entity, key: string) => {
    if (key[0] !== "#") return named[key.toLowerCase()] ?? entity;
    const code = key[1].toLowerCase() === "x" ? parseInt(key.slice(2), 16) : parseInt(key.slice(1), 10);
    return code > 0 && code <= 0x10ffff && !(code >= 0xd800 && code <= 0xdfff) ? String.fromCodePoint(code) : entity;
  });
}

/** Remove markup and normalize whitespace from public feed text. */
export function cleanText(value: string): string {
  // Feed descriptions can contain HTML encoded inside XML; decode both layers.
  const decoded = decodeEntities(decodeEntities(value));
  return decoded.replace(/<[^>]*>/g, " ").normalize("NFKC").replace(/\s+/g, " ").trim();
}

async function fetchGoogleNews(): Promise<Article[]> {
  const response = await fetch(GOOGLE_NEWS_URL, { signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error(`Google News returned HTTP ${response.status}`);
  const xml = await response.text();
  const articles: Article[] = [];
  const field = (item: string, tag: string) => {
    const match = item.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, "i"));
    return (match?.[1] || "").replace(/^<!\[CDATA\[([\s\S]*)\]\]>$/, "$1").trim();
  };
  for (const match of xml.matchAll(/<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi)) {
    const item = match[1];
    const title = cleanText(field(item, "title"));
    const url = decodeEntities(field(item, "link")).trim();
    const source = cleanText(field(item, "source")) || "Google News";
    const date = new Date(field(item, "pubDate"));
    let parsedUrl: URL;
    try { parsedUrl = new URL(url); } catch { continue; }
    if (!title || !["http:", "https:"].includes(parsedUrl.protocol) || Number.isNaN(date.getTime())) continue;
    // RSS often contains only a headline; do not invent article details.
    const description = cleanText(field(item, "description"));
    articles.push({ id: `gnews-${createHash("sha256").update(url).digest("hex").slice(0, 16)}`, title, source, url, published_at: date.toISOString(), text: description || title });

  }
  return articles;
}

/** Fetch available sources independently; an empty result permits sample fallback. */
export async function ingestArticles(): Promise<Article[]> {
  const results = await Promise.allSettled([fetchGoogleNews()]);
  const urls = new Set<string>();
  const titles = new Set<string>();
  const articles: Article[] = [];
  for (const result of results) {
    if (result.status === "rejected") {
      console.warn("Ingestion source failed:", result.reason);
      continue;
    }
    for (const article of result.value) {
      const url = article.url.trim().replace(/\/$/, "");
      const title = article.title.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
      if (urls.has(url) || titles.has(title)) continue;
      urls.add(url);
      titles.add(title);
      articles.push(article);
      if (articles.length === 10) return articles;
    }
  }
  return articles;
}
