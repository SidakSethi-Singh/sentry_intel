"use client";

import React, { useMemo } from "react";
import type { Alert } from "./types";

interface AlertFeedProps {
  alerts: Alert[];
  loading: boolean;
  error: string | null;
  selectedAlertId: string | null;
  onSelectAlert: (alert: Alert) => void;
  onRetry: () => void;
}

const SEVERITY_RANK: Record<string, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

export function sortAlerts(list: Alert[]): Alert[] {
  return [...list].sort((a, b) => {
    const sevA = SEVERITY_RANK[a.severity?.toLowerCase()] || 0;
    const sevB = SEVERITY_RANK[b.severity?.toLowerCase()] || 0;
    if (sevB !== sevA) {
      return sevB - sevA; // Most severe first
    }
    const timeA = new Date(a.created_at).getTime() || 0;
    const timeB = new Date(b.created_at).getTime() || 0;
    return timeB - timeA; // Newest first
  });
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

export default function AlertFeed({
  alerts,
  loading,
  error,
  selectedAlertId,
  onSelectAlert,
  onRetry,
}: AlertFeedProps) {
  const sortedAlerts = useMemo(() => sortAlerts(alerts), [alerts]);

  return (
    <section aria-label="Alert Feed" style={{ width: "100%" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1rem",
        }}
      >
        <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700, color: "#f8fafc" }}>
          Threat Intelligence Feed
        </h2>
        <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
          {sortedAlerts.length} alert{sortedAlerts.length === 1 ? "" : "s"}
        </span>
      </div>

      {/* Loading State */}
      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                background: "#0f172a",
                border: "1px solid #1e293b",
                borderRadius: "8px",
                padding: "1.25rem",
                opacity: 0.7,
              }}
            >
              <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem" }}>
                <div style={{ width: "70px", height: "20px", background: "#1e293b", borderRadius: "4px" }} />
                <div style={{ width: "80px", height: "20px", background: "#1e293b", borderRadius: "4px" }} />
              </div>
              <div style={{ height: "14px", width: "100%", background: "#1e293b", borderRadius: "4px", marginBottom: "0.5rem" }} />
              <div style={{ height: "14px", width: "90%", background: "#1e293b", borderRadius: "4px", marginBottom: "0.5rem" }} />
              <div style={{ height: "14px", width: "60%", background: "#1e293b", borderRadius: "4px" }} />
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div
          role="alert"
          style={{
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid #ef4444",
            borderRadius: "8px",
            padding: "1.25rem",
            color: "#fca5a5",
            marginBottom: "1rem",
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span>⚠️</span>
            <span>Failed to load alert feed:</span>
          </div>
          <p style={{ margin: "0 0 1rem 0", fontSize: "0.875rem", color: "#fecaca" }}>{error}</p>
          <button
            onClick={onRetry}
            style={{
              background: "#ef4444",
              color: "#ffffff",
              border: "none",
              borderRadius: "6px",
              padding: "0.4rem 0.9rem",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty Database State */}
      {!loading && !error && sortedAlerts.length === 0 && (
        <div
          style={{
            background: "#0f172a",
            border: "1px dashed #334155",
            borderRadius: "8px",
            padding: "3rem 1.5rem",
            textAlign: "center",
            color: "#94a3b8",
          }}
          data-testid="no-alerts-message"
        >
          <span style={{ fontSize: "2rem", display: "block", marginBottom: "0.5rem" }}>📭</span>
          <p style={{ margin: 0, fontSize: "1.1rem", fontWeight: 600, color: "#f1f5f9" }}>
            No alerts yet
          </p>
          <p style={{ margin: "0.4rem 0 0 0", fontSize: "0.85rem", color: "#64748b" }}>
            Intelligence database currently contains 0 records.
          </p>
        </div>
      )}

      {/* Alert Feed Cards */}
      {!loading && !error && sortedAlerts.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {sortedAlerts.map((alert) => {
            const badge = getSeverityBadgeStyle(alert.severity);
            const isSelected = selectedAlertId === alert.id;

            return (
              <article
                key={alert.id}
                onClick={() => onSelectAlert(alert)}
                tabIndex={0}
                role="button"
                aria-pressed={isSelected}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelectAlert(alert);
                  }
                }}
                style={{
                  background: isSelected ? "#1e293b" : "#0f172a",
                  border: isSelected ? "2px solid #38bdf8" : "1px solid #1e293b",
                  borderRadius: "8px",
                  padding: "1.25rem",
                  cursor: "pointer",
                  transition: "all 0.15s ease-in-out",
                  boxShadow: isSelected
                    ? "0 0 15px rgba(56, 189, 248, 0.25)"
                    : "0 2px 4px rgba(0, 0, 0, 0.2)",
                  outline: "none",
                }}
              >
                {/* Meta Row: Severity Badge, Score, Created At */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "0.5rem",
                    marginBottom: "0.6rem",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    {/* Color-coded severity badge */}
                    <span
                      style={{
                        background: badge.background,
                        border: `1px solid ${badge.border}`,
                        color: badge.color,
                        padding: "3px 8px",
                        borderRadius: "4px",
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      {alert.severity || "UNKNOWN"}
                    </span>

                    {/* Score */}
                    <span
                      style={{
                        background: "#1e293b",
                        color: "#f1f5f9",
                        border: "1px solid #334155",
                        padding: "3px 8px",
                        borderRadius: "4px",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                      }}
                    >
                      Score: {alert.score}
                    </span>
                  </div>

                  {/* Created At Time */}
                  <time
                    dateTime={alert.created_at}
                    style={{ fontSize: "0.75rem", color: "#94a3b8" }}
                  >
                    {formatTimestamp(alert.created_at)}
                  </time>
                </div>

                {/* 3-line Summary Preview */}
                <p
                  style={{
                    margin: "0.5rem 0",
                    color: "#e2e8f0",
                    fontSize: "0.875rem",
                    lineHeight: "1.5",
                    display: "-webkit-box",
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {alert.summary}
                </p>

                {/* Footer info: ID & Source count */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: "0.75rem",
                    fontSize: "0.75rem",
                    color: "#64748b",
                  }}
                >
                  <span style={{ fontFamily: "monospace" }}>{alert.id}</span>
                  <span>{alert.sources?.length || 0} source{(alert.sources?.length || 0) === 1 ? "" : "s"}</span>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
