import { test, after } from "node:test";
import assert from "node:assert/strict";
import { ingestArticles, cleanText } from "../lib/ingest.ts";
import { calculateThreatAssessment } from "../lib/summarize.ts";

const originalFetch = globalThis.fetch;
after(() => { globalThis.fetch = originalFetch; });

test("normalizes feed text", () => {
  assert.equal(cleanText(" <b>Alert</b> &amp; response \n"), "Alert & response");
});

test("parses, deduplicates and skips malformed RSS entries", async () => {
  globalThis.fetch = async () => new Response(`<rss><channel>
    <item><title><![CDATA[Border alert]]></title><link>https://example.org/a</link><pubDate>Wed, 28 Oct 2026 12:00:00 GMT</pubDate><source>Example</source><description>Report details</description></item>
    <item><title>Border alert</title><link>https://example.org/b</link><pubDate>Wed, 28 Oct 2026 12:00:00 GMT</pubDate></item>
    <item><title>Bad date</title><link>https://example.org/c</link><pubDate>bad</pubDate></item>
  </channel></rss>`);
  const articles = await ingestArticles();
  assert.equal(articles.length, 1);
  assert.equal(articles[0].title, "Border alert");
  assert.equal(articles[0].text, "Report details");
  assert.equal(articles[0].published_at, "2026-10-28T12:00:00.000Z");
});

test("returns no live articles when feed fails", async () => {
  globalThis.fetch = async () => new Response("unavailable", { status: 503 });
  assert.deepEqual(await ingestArticles(), []);
});

test("heuristic scores stay bounded and explanations avoid fabricated evacuation counts", () => {
  const base = calculateThreatAssessment("A routine meeting took place.");
  const evacuation = calculateThreatAssessment("An evacuation was announced after a cyclone.");
  assert.equal(base.severity, "low");
  assert.ok(evacuation.score > base.score && evacuation.score <= 100);
  assert.ok(!evacuation.justification.includes("180,000"));
});

test("decodes Google News HTML descriptions, numeric entities and URL query parameters", async () => {
  globalThis.fetch = async () => new Response(`<rss><channel><item>
    <title>India &#x26; defence &#39;news&#39;</title>
    <link>https://news.google.com/rss/articles/Example?x=1&amp;y=2</link>
    <pubDate>Wed, 28 Oct 2026 12:00:00 GMT</pubDate>
    <source url="https://example.com">Example News</source>
    <description>&lt;a href="https://example.com"&gt;India &amp;amp; defence&lt;/a&gt;&lt;font color="#6f6f6f"&gt;Example News&lt;/font&gt;</description>
  </item></channel></rss>`);
  const articles = await ingestArticles();
  assert.equal(articles.length, 1);
  assert.equal(articles[0].title, "India & defence 'news'");
  assert.equal(articles[0].url, "https://news.google.com/rss/articles/Example?x=1&y=2");
  assert.equal(articles[0].text, "India & defence Example News");
  assert.equal(articles[0].source, "Example News");
});

test("applies the limit after deduplication", async () => {
  const item = (i: number) => `<item><title>Story ${i}</title><link>https://example.org/${i}</link><pubDate>Wed, 28 Oct 2026 12:00:00 GMT</pubDate></item>`;
  globalThis.fetch = async () => new Response(`<rss><channel>${item(0).repeat(10)}${Array.from({ length: 10 }, (_, i) => item(i + 1)).join("")}</channel></rss>`);
  assert.equal((await ingestArticles()).length, 10);
});
