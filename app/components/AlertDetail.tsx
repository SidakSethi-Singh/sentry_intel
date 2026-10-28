"use client";

import React from "react";
import type { Alert } from "./types";

interface AlertDetailProps {
  alert: Alert | null;
  loading: boolean;
  error: string | null;
  onClose?: () => void;
}

function getSeverityBadgeStyle(severity?: string): { background: string; border: string; color: string } {
  const sev = severity?.toLowerCase();
  switch (sev) {
    case "critical":
      return { background: "#dc2626", border: "#ef4444", color: "#ffffff" }; // Red
    case "high":
      return { background: "#ea580c", border: "#f97316", color: "#ffffff" }; // Orange
    case "medium":
      return { background: "#ca8a04", border: "#eab308", color: "#ffffff" }; // Yellow
    case "low":
      return { background: "#16a34a", border: "#22c55e", color: "#ffffff" }; // Green
    default:
      return { background: "#475569", border: "#64748b", color: "#ffffff" };
  }
}

function isUrl(str?: string): boolean {
  if (!str || typeof str !== "string") return false;
  try {
    const parsed = new URL(str.trim());
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function formatTimestamp(isoString?: string): string {
  if (!isoString) return "Unknown time";
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return isoString;
  }
}

export default function AlertDetail({
  alert,
  loading,
  error,
  onClose,
}: AlertDetailProps) {
  // Empty state: No alert clicked yet
  if (!alert && !loading && !error) {
    return (
      <aside
        aria-label="Alert Detail Dossier"
        style={{
          background: "#0f172a",
          border: "1px dashed #334155",
          borderRadius: "8px",
          padding: "3rem 1.5rem",
          textAlign: "center",
          color: "#94a3b8",
        }}
      >
        <span style={{ fontSize: "2.5rem", display: "block", marginBottom: "0.75rem" }}>🛡️</span>
        <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "1.1rem", fontWeight: 600, color: "#f1f5f9" }}>
          No Alert Selected
        </h3>
        <p style={{ margin: 0, fontSize: "0.875rem", color: "#64748b" }}>
          Click any threat alert from the feed to inspect the full summary, sources, and timeline events.
        </p>
      </aside>
    );
  }

  // Loading state when no alert is yet rendered
  if (loading && !alert) {
    return (
      <aside
        aria-label="Alert Detail Dossier"
        style={{
          background: "#0f172a",
          border: "1px solid #1e293b",
          borderRadius: "8px",
          padding: "2rem",
          textAlign: "center",
          color: "#94a3b8",
        }}
      >
        <div style={{ fontSize: "1.5rem", marginBottom: "0.75rem" }}>⏳</div>
        <p style={{ margin: 0, fontSize: "0.95rem", color: "#e2e8f0" }}>
          Fetching alert dossier...
        </p>
      </aside>
    );
  }

  // Error state when no alert could be loaded
  if (!alert && error) {
    return (
      <aside
        aria-label="Alert Detail Dossier"
        style={{
          background: "rgba(239, 68, 68, 0.1)",
          border: "1px solid #ef4444",
          borderRadius: "8px",
          padding: "1.5rem",
          color: "#fca5a5",
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: "0.5rem" }}>
          ⚠️ Failed to load alert detail
        </div>
        <p style={{ margin: 0, fontSize: "0.875rem", color: "#fecaca" }}>{error}</p>
      </aside>
    );
  }

  if (!alert) return null;

  const badge = getSeverityBadgeStyle(alert.severity);
  const topSources = (alert.sources || []).slice(0, 3);
  const timelineEvents = alert.timeline_events || [];

  return (
    <aside
      aria-label="Alert Detail Dossier"
      style={{
        background: "#0f172a",
        border: "1px solid #334155",
        borderRadius: "8px",
        padding: "1.5rem",
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.4)",
      }}
    >
      {/* Detail Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "1.25rem",
          borderBottom: "1px solid #1e293b",
          paddingBottom: "1rem",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.4rem" }}>
            {/* Severity Badge */}
            <span
              style={{
                background: badge.background,
                border: `1px solid ${badge.border}`,
                color: badge.color,
                padding: "4px 10px",
                borderRadius: "4px",
                fontSize: "0.75rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              {alert.severity || "UNKNOWN"}
            </span>

            {/* Score out of 100 */}
            <span
              style={{
                background: "#1e293b",
                border: "1px solid #334155",
                color: "#38bdf8",
                padding: "4px 10px",
                borderRadius: "4px",
                fontSize: "0.75rem",
                fontWeight: 700,
              }}
            >
              Score: {alert.score} / 100
            </span>
          </div>

          <h3 style={{ margin: "0.25rem 0 0 0", fontSize: "1.15rem", fontWeight: 700, color: "#f8fafc" }}>
            {alert.id}
          </h3>
          <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "2px" }}>
            Article Ref: {alert.article_id} · {formatTimestamp(alert.created_at)}
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close alert details"
            style={{
              background: "transparent",
              border: "none",
              color: "#94a3b8",
              cursor: "pointer",
              fontSize: "1.25rem",
              padding: "4px",
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* API Notice / Error if detail fetch had an issue */}
      {error && (
        <div
          role="alert"
          style={{
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            borderRadius: "6px",
            padding: "0.6rem 0.8rem",
            marginBottom: "1.25rem",
            fontSize: "0.8rem",
            color: "#fca5a5",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Loading indicator when re-fetching in background */}
      {loading && (
        <div
          style={{
            background: "rgba(56, 189, 248, 0.1)",
            border: "1px solid rgba(56, 189, 248, 0.3)",
            borderRadius: "6px",
            padding: "0.5rem 0.8rem",
            marginBottom: "1.25rem",
            fontSize: "0.8rem",
            color: "#38bdf8",
          }}
        >
          Refreshing latest alert details...
        </div>
      )}

      {/* Score Meter Visual */}
      <div style={{ marginBottom: "1.25rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#94a3b8", marginBottom: "0.35rem" }}>
          <span>Threat Score</span>
          <span style={{ fontWeight: 600, color: "#f8fafc" }}>{alert.score} / 100</span>
        </div>
        <div style={{ width: "100%", height: "8px", background: "#1e293b", borderRadius: "4px", overflow: "hidden" }}>
          <div
            style={{
              width: `${Math.min(100, Math.max(0, alert.score))}%`,
              height: "100%",
              background: badge.background,
              transition: "width 0.3s ease",
            }}
          />
        </div>
      </div>

      {/* Full Summary */}
      <section style={{ marginBottom: "1.5rem" }}>
        <h4
          style={{
            margin: "0 0 0.5rem 0",
            fontSize: "0.8rem",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: "#38bdf8",
          }}
        >
          Executive Summary
        </h4>
        <p
          style={{
            margin: 0,
            color: "#e2e8f0",
            fontSize: "0.925rem",
            lineHeight: "1.65",
            whiteSpace: "pre-wrap",
          }}
        >
          {alert.summary}
        </p>
      </section>

      {/* Sources (Top 3, Clickable if URLs) */}
      <section style={{ marginBottom: "1.5rem" }}>
        <h4
          style={{
            margin: "0 0 0.5rem 0",
            fontSize: "0.8rem",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: "#38bdf8",
          }}
        >
          Sources ({topSources.length} of {alert.sources?.length || 0})
        </h4>

        {topSources.length === 0 ? (
          <p style={{ margin: 0, color: "#64748b", fontSize: "0.85rem", fontStyle: "italic" }}>
            No sources available
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            {topSources.map((source, idx) => {
              const name =
                typeof source === "string"
                  ? source
                  : source.name || source.url || `Source ${idx + 1}`;
              const url = typeof source === "string" ? source : source.url;
              const validUrl = isUrl(url);

              if (validUrl) {
                return (
                  <a
                    key={idx}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.35rem",
                      background: "#1e293b",
                      border: "1px solid #334155",
                      color: "#38bdf8",
                      padding: "0.4rem 0.8rem",
                      borderRadius: "6px",
                      fontSize: "0.85rem",
                      textDecoration: "none",
                      fontWeight: 500,
                      wordBreak: "break-all",
                    }}
                  >
                    <span>{name}</span>
                    <span style={{ fontSize: "0.75rem" }}>↗</span>
                  </a>
                );
              }

              return (
                <div
                  key={idx}
                  style={{
                    background: "#1e293b",
                    border: "1px solid #334155",
                    color: "#cbd5e1",
                    padding: "0.4rem 0.8rem",
                    borderRadius: "6px",
                    fontSize: "0.85rem",
                  }}
                >
                  {name}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Timeline Events (as an Ordered List) */}
      <section>
        <h4
          style={{
            margin: "0 0 0.75rem 0",
            fontSize: "0.8rem",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: "#38bdf8",
          }}
        >
          Timeline Events ({timelineEvents.length})
        </h4>

        {timelineEvents.length === 0 ? (
          <p style={{ margin: 0, color: "#64748b", fontSize: "0.85rem", fontStyle: "italic" }}>
            No timeline events recorded
          </p>
        ) : (
          <ol
            style={{
              margin: 0,
              paddingLeft: "1.25rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
            }}
          >
            {timelineEvents.map((ev, idx) => {
              const timeStr = typeof ev === "string" ? "" : ev.time;
              const eventStr = typeof ev === "string" ? ev : ev.event;

              return (
                <li key={idx} style={{ color: "#94a3b8" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                    {timeStr && (
                      <span style={{ fontSize: "0.78rem", color: "#38bdf8", fontWeight: 700 }}>
                        {timeStr}
                      </span>
                    )}
                    <span style={{ fontSize: "0.875rem", color: "#e2e8f0", lineHeight: "1.5" }}>
                      {eventStr}
                    </span>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </aside>
  );
}
