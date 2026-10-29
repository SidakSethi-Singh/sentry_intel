import * as local from "./local-db";
import type { Alert as FullAlert } from "./summarize";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

export interface Article {
  id: string;
  title: string;
  source: string;
  url: string;
  published_at: string;
  text: string;
}

export type AlertSeverity = "low" | "medium" | "high" | "critical";

export interface Alert {
  id: string;
  article_id: string;
  severity: AlertSeverity;
  score: number;
  summary: string;
  sources: string[];
  timeline_events: string[];
  created_at: string;
}

export interface SeverityStats {
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export class DatabaseError extends Error {
  code: string;
  details?: unknown;

  constructor(message: string, code: string = "DB_ERROR", details?: unknown) {
    super(message);
    this.name = "DatabaseError";
    this.code = code;
    this.details = details;
  }
}

export function useLocalStore(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (!!url !== !!key) throw new DatabaseError("Configure both Supabase URL and service-role key, or neither for local storage", "CONFIG_ERROR");
  return !url;
}

let cachedClient: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (cachedClient) {
    return cachedClient;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  if (!url) {
    throw new DatabaseError("Missing environment variable: NEXT_PUBLIC_SUPABASE_URL", "CONFIG_ERROR");
  }

  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (!key) {
    throw new DatabaseError("Missing environment variable: SUPABASE_SERVICE_ROLE_KEY", "CONFIG_ERROR");
  }

  cachedClient = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return cachedClient;
}

export async function listAlerts(): Promise<Alert[]> {
  if (useLocalStore()) return local.listLocalAlerts() as unknown as Alert[];
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("alerts")
    .select("id, article_id, severity, score, summary, sources, timeline_events, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    throw new DatabaseError(error.message, error.code, error.details);
  }

  return (data as Alert[]) || [];
}

export async function getAlertById(id: string): Promise<Alert | null> {
  if (useLocalStore()) return (local.listLocalAlerts().find(a => a.id === id) || null) as unknown as Alert | null;
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("alerts")
    .select("id, article_id, severity, score, summary, sources, timeline_events, created_at")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new DatabaseError(error.message, error.code, error.details);
  }

  return (data as Alert) || null;
}

export async function getAlertStats(): Promise<SeverityStats> {
  if (useLocalStore()) {
    const alerts = local.listLocalAlerts();
    const stats: SeverityStats = { total: alerts.length, critical: 0, high: 0, medium: 0, low: 0 };
    for (const a of alerts) stats[a.severity]++;
    return stats;
  }
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("alerts")
    .select("severity");

  if (error) {
    throw new DatabaseError(error.message, error.code, error.details);
  }

  const stats: SeverityStats = {
    total: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  };

  if (!data) {
    return stats;
  }

  stats.total = data.length;
  for (const item of data) {
    const sev = item.severity as AlertSeverity;
    if (sev in stats) {
      stats[sev]++;
    }
  }

  return stats;
}

export async function articleExists(filter: { id?: string; url?: string }): Promise<boolean> {
  if (useLocalStore()) return local.localArticleExists(filter);
  const supabase = getSupabase();
  let query = supabase.from("articles").select("id", { count: "exact", head: true });

  if (filter.id) {
    query = query.eq("id", filter.id);
  } else if (filter.url) {
    query = query.eq("url", filter.url);
  } else {
    return false;
  }

  const { count, error } = await query;
  if (error) {
    throw new DatabaseError(error.message, error.code, error.details);
  }

  return (count ?? 0) > 0;
}

export async function alertExists(articleId: string): Promise<boolean> {
  if (useLocalStore()) return local.localAlertExists(articleId);
  const supabase = getSupabase();
  const { count, error } = await supabase
    .from("alerts")
    .select("id", { count: "exact", head: true })
    .eq("article_id", articleId);

  if (error) {
    throw new DatabaseError(error.message, error.code, error.details);
  }

  return (count ?? 0) > 0;
}

export async function upsertArticle(article: Article): Promise<Article> {
  if (useLocalStore()) return local.saveLocalArticle(article);
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("articles")
    .upsert(
      {
        id: article.id,
        title: article.title,
        source: article.source,
        url: article.url,
        published_at: article.published_at,
        text: article.text,
      },
      { onConflict: "id" }
    )
    .select("id, title, source, url, published_at, text")
    .single();

  if (error) {
    throw new DatabaseError(error.message, error.code, error.details);
  }

  return data as Article;
}

export async function insertAlert(alert: Alert, fullAlert?: FullAlert): Promise<Alert> {
  if (useLocalStore()) {
    if (!fullAlert) throw new DatabaseError("Full alert required for local storage", "INVALID_ALERT");
    local.saveLocalAlert(fullAlert);
    return alert;
  }
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("alerts")
    .insert({
      id: alert.id,
      article_id: alert.article_id,
      severity: alert.severity,
      score: alert.score,
      summary: alert.summary,
      sources: alert.sources,
      timeline_events: alert.timeline_events,
      created_at: alert.created_at,
    })
    .select("id, article_id, severity, score, summary, sources, timeline_events, created_at")
    .single();

  if (error) {
    throw new DatabaseError(error.message, error.code, error.details);
  }

  return data as Alert;
}
