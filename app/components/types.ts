export type AlertSeverity = "critical" | "high" | "medium" | "low" | string;

export interface AlertSource {
  name: string;
  url: string;
}

export interface TimelineEvent {
  time: string;
  event: string;
}

export interface Alert {
  id: string;
  article_id: string;
  severity: AlertSeverity;
  score: number;
  summary: string;
  sources: AlertSource[];
  timeline_events: TimelineEvent[];
  created_at: string;
}
