
"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import type { Alert } from "./components/types";
import StatsHeader from "./components/StatsHeader";
import AlertFeed from "./components/AlertFeed";
import AlertDetail from "./components/AlertDetail";

export default function DashboardPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(true);
  const [alertsError, setAlertsError] = useState<string | null>(null);

  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const [briefLoading, setBriefLoading] = useState(false);
  const [briefError, setBriefError] = useState<string | null>(null);
  const [morningBrief, setMorningBrief] = useState<string | null>(null);

  const detailRequestId = useRef(0);

  // Fetch alerts from GET /api/alerts.
  const loadAlerts = useCallback(async () => {
    setAlertsLoading(true);
    setAlertsError(null);

    try {
      const res = await fetch("/api/alerts");

      if (!res.ok) {
        throw new Error(
          `HTTP ${res.status}: ${res.statusText || "Failed to fetch alerts"}`
        );
      }

      const data: unknown = await res.json();

      let alertList: unknown;

      if (Array.isArray(data)) {
        alertList = data;
      } else if (
        data !== null &&
        typeof data === "object" &&
        "alerts" in data &&
        Array.isArray(data.alerts)
      ) {
        alertList = data.alerts;
      } else {
        throw new Error("Invalid response format: Expected an array of alerts.");
      }

      setAlerts(alertList as Alert[]);
    } catch (err: unknown) {
      setAlertsError(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred while loading alerts."
      );
    } finally {
      setAlertsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAlerts();
  }, [loadAlerts]);

  // Fetch complete details for a selected alert.
  const handleSelectAlert = useCallback(async (alert: Alert) => {
    const requestId = ++detailRequestId.current;

    setSelectedAlert(alert);
    setDetailLoading(true);
    setDetailError(null);

    try {
      const res = await fetch(
        `/api/alerts/${encodeURIComponent(String(alert.id))}`
      );

      if (!res.ok) {
        throw new Error(
          `Alert detail request failed (${res.status}: ${
            res.statusText || "Request failed"
          })`
        );
      }

      const data: unknown = await res.json();

      if (
        data === null ||
        typeof data !== "object" ||
        Array.isArray(data)
      ) {
        throw new Error("Invalid alert detail response.");
      }

      if (requestId === detailRequestId.current) {
        setSelectedAlert(data as Alert);
      }
    } catch (err: unknown) {
      if (requestId === detailRequestId.current) {
        setDetailError(
          err instanceof Error
            ? err.message
            : "Failed to load complete alert details."
        );
      }
    } finally {
      if (requestId === detailRequestId.current) {
        setDetailLoading(false);
      }
    }
  }, []);

  const handleCloseDetail = useCallback(() => {
    detailRequestId.current += 1;
    setSelectedAlert(null);
    setDetailLoading(false);
    setDetailError(null);
  }, []);

  // Requires POST /api/morning-brief on your backend.
  const handleMorningBrief = useCallback(async () => {
    setBriefLoading(true);
    setBriefError(null);
    setMorningBrief(null);

    try {
      const res = await fetch("/api/morning-brief", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ alertCount: alerts.length }),
      });

      if (!res.ok) {
        throw new Error(
          `Morning brief request failed (HTTP ${res.status}).`
        );
      }

      const data: unknown = await res.json();

      if (
        data === null ||
        typeof data !== "object" ||
        Array.isArray(data)
      ) {
        throw new Error("Invalid morning brief response.");
      }

      const result = data as {
        brief?: unknown;
        summary?: unknown;
        message?: unknown;
      };

      const brief =
        typeof result.brief === "string"
          ? result.brief
          : typeof result.summary === "string"
            ? result.summary
            : typeof result.message === "string"
              ? result.message
              : null;

      if (!brief || !brief.trim()) {
        throw new Error("The API did not return a morning brief.");
      }

      setMorningBrief(brief);
    } catch (err: unknown) {
      setBriefError(
        err instanceof Error
          ? err.message
          : "Failed to generate the morning brief."
      );
    } finally {
      setBriefLoading(false);
    }
  }, [alerts.length]);

  return (
    <div
      style={{
        background: "#0b0f19",
        color: "#e2e8f0",
        minHeight: "100vh",
        fontFamily: "Segoe UI, -apple-system, sans-serif",
      }}
    >
      <style>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          background: #0b0f19;
        }

        .dashboard-layout {
          display: grid;
          grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr);
          gap: 2rem;
          align-items: start;
        }

        .detail-sticky-container {
          min-width: 0;
        }

        .brief-panel {
          margin-bottom: 2rem;
          padding: 1.25rem;
          border: 1px solid #334155;
          border-radius: 10px;
          background: #111827;
          overflow-wrap: anywhere;
        }

        .brief-panel h2 {
          margin-top: 0;
          color: #f8fafc;
          font-size: 1.1rem;
        }

        .brief-panel p {
          margin-bottom: 0;
          color: #cbd5e1;
          line-height: 1.7;
          white-space: pre-wrap;
        }

        .brief-error {
          margin-bottom: 1.5rem;
          color: #fca5a5;
          overflow-wrap: anywhere;
        }

        @media (min-width: 1024px) {
          .detail-sticky-container {
            position: sticky;
            top: 1.5rem;
          }
        }

        @media (max-width: 1023px) {
          .dashboard-layout {
            grid-template-columns: minmax(0, 1fr);
            gap: 1.5rem;
          }

          .detail-sticky-container {
            position: static;
          }
        }

        @media (max-width: 700px) {
          .topbar {
            flex-direction: column;
            align-items: flex-start !important;
            gap: 1rem !important;
            padding: 1rem !important;
          }

          .header-actions {
            width: 100%;
            justify-content: space-between !important;
            flex-wrap: wrap;
          }

          .notice {
            flex-direction: column;
            align-items: flex-start !important;
          }

          .dashboard-main {
            padding: 1rem !important;
          }

          .brand-title {
            font-size: 1rem !important;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: 0.01ms !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>

      {/* Navigation */}
      <nav
        className="topbar"
        aria-label="Main navigation"
        style={{
          borderBottom: "1px solid #1e293b",
          padding: "1rem 2rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "1.5rem",
          background: "#0f172a",
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.3)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div
            style={{
              background: "linear-gradient(135deg, #0284c7, #0369a1)",
              color: "#ffffff",
              padding: "0.45rem 0.85rem",
              borderRadius: "6px",
              fontWeight: 800,
              letterSpacing: "0.08em",
              fontSize: "0.95rem",
              flexShrink: 0,
            }}
          >
            SENTRY INTEL
          </div>

          <div>
            <h1
              className="brand-title"
              style={{
                margin: 0,
                fontSize: "1.2rem",
                fontWeight: 700,
                color: "#f8fafc",
              }}
            >
              Defence &amp; Security Threat Intelligence
            </h1>

            <p
              style={{
                margin: 0,
                fontSize: "0.8rem",
                color: "#94a3b8",
              }}
            >
              Operational Incident Corroboration &amp; Monitoring Dashboard
            </p>
          </div>
        </div>

        <div
          className="header-actions"
          style={{ display: "flex", gap: "1rem", alignItems: "center" }}
        >
          <span
            style={{
              fontSize: "0.8rem",
              color: "#10b981",
              display: "flex",
              alignItems: "center",
              gap: "5px",
              whiteSpace: "nowrap",
            }}
          >
            <span
              style={{
                width: "8px",
                height: "8px",
                background: "#10b981",
                borderRadius: "50%",
                display: "inline-block",
              }}
            />
            Intelligence Dashboard
          </span>

          <button
            type="button"
            onClick={handleMorningBrief}
            disabled={briefLoading}
            style={{
              background: "linear-gradient(135deg, #0284c7, #0ea5e9)",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              padding: "0.6rem 1rem",
              fontWeight: 600,
              fontSize: "0.85rem",
              cursor: briefLoading ? "wait" : "pointer",
              opacity: briefLoading ? 0.7 : 1,
            }}
          >
            {briefLoading
              ? "Generating..."
              : "⚡ Generate Morning Brief"}
          </button>
        </div>
      </nav>

      {/* Dashboard content */}
      <main
        className="dashboard-main"
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          padding: "2rem",
        }}
      >
        {/* Data transparency notice */}
        <section
          className="notice"
          aria-label="Data transparency notice"
          style={{
            background: "rgba(30, 41, 59, 0.7)",
            border: "1px solid #334155",
            borderLeft: "4px solid #38bdf8",
            borderRadius: "8px",
            padding: "0.85rem 1.2rem",
            marginBottom: "2rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem",
            fontSize: "0.82rem",
            color: "#cbd5e1",
            lineHeight: "1.5",
          }}
        >
          <div>
            <span
              style={{
                fontWeight: 700,
                color: "#38bdf8",
                marginRight: "0.4rem",
              }}
            >
              🛡️ Demo Data &amp; Evaluation Transparency:
            </span>
            The 50 cached threat dossiers displayed here are an illustrative
            evaluation dataset created for hackathon benchmarking—not a live
            classified or real-time operational feed. Live ingestion requires
            a configured ingestion API.
          </div>

          <span
            style={{
              fontSize: "0.78rem",
              color: "#34d399",
              background: "rgba(16, 185, 129, 0.15)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              padding: "4px 10px",
              borderRadius: "16px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontWeight: 600,
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            <span
              style={{
                width: "8px",
                height: "8px",
                background: "#10b981",
                borderRadius: "50%",
                display: "inline-block",
              }}
            />
            MONITORING ACTIVE
          </span>
        </section>

        {/* Morning Brief result */}
        {briefError && (
          <div className="brief-error" role="alert">
            Morning brief error: {briefError}
          </div>
        )}

        {morningBrief && (
          <section className="brief-panel" aria-live="polite">
            <h2>⚡ Morning Intelligence Brief</h2>
            <p>{morningBrief}</p>
          </section>
        )}

        {/* Statistics */}
        <StatsHeader
          totalAlerts={alerts.length}
          alertsLoading={alertsLoading}
        />

        {/* Alert feed and detail */}
        <div className="dashboard-layout">
          <section aria-label="Alert feed">
            <AlertFeed
              alerts={alerts}
              loading={alertsLoading}
              error={alertsError}
              selectedAlertId={selectedAlert?.id ?? null}
              onSelectAlert={handleSelectAlert}
              onRetry={loadAlerts}
            />
          </section>

          <aside
            className="detail-sticky-container"
            aria-label="Alert details"
          >
            <AlertDetail
              alert={selectedAlert}
              loading={detailLoading}
              error={detailError}
              onClose={handleCloseDetail}
            />
          </aside>
        </div>
      </main>
    </div>
  );
}
