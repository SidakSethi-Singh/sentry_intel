CREATE TABLE IF NOT EXISTS articles (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  source TEXT NOT NULL,
  url TEXT NOT NULL,
  published_at TIMESTAMPTZ NOT NULL,
  text TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS alerts (
  id TEXT PRIMARY KEY,
  article_id TEXT NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  score INT NOT NULL CHECK (score >= 0 AND score <= 100),
  summary TEXT NOT NULL,
  sources TEXT[] NOT NULL DEFAULT '{}',
  timeline_events TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alerts_created_at_desc ON alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_article_id ON alerts(article_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_alerts_article_id ON alerts(article_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_articles_url ON articles(url);

ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on articles" ON articles FOR SELECT USING (true);
CREATE POLICY "Allow public read on alerts" ON alerts FOR SELECT USING (true);
