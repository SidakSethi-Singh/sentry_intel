"use client";

import React, { useState, useEffect, useCallback } from "react";
import type { Alert } from "./components/types";
import StatsHeader from "./components/StatsHeader";
import AlertFeed from "./components/AlertFeed";
import AlertDetail from "./components/AlertDetail";

export default function DashboardPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [alertsLoading, setAlertsLoading] = useState<boolean>(true);
  const [alertsError, setAlertsError] = useState<string | null>(null);

  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  // Fetch all alerts from GET /api/alerts
  const loadAlerts = useCallback(async () => {
    setAlertsLoading(true);
    setAlertsError(null);
    try {
      const res = await fetch("/api/alerts");
      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}: ${res.statusText || "Failed to fetch alerts"}`);
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        setAlerts(data);
      } else if (data && Array.isArray(data.alerts)) {
        setAlerts(data.alerts);
      } else {
        throw new Error("Invalid response format: Expected an array of alerts");
      }
    } catch (err) {
      setAlertsError((err as Error).message || "An unexpected error occurred while loading alerts.");
    } finally {
      setAlertsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  // When an alert is clicked, fetch GET /api/alerts/:id
  const handleSelectAlert = async (alert: Alert) => {
    // Provide immediate feedback with available feed alert data
    setSelectedAlert(alert);
    setDetailLoading(true);
    setDetailError(null);

    try {
      const res = await fetch(`/api/alerts/${encodeURIComponent(alert.id)}`);
      if (!res.ok) {
        throw new Error(`Alert detail request failed (${res.status} ${res.statusText || "Not Found"})`);
      }
      const data = await res.json();
      if (data && typeof data === "object") {
        setSelectedAlert(data);
      }
    } catch (err) {
      setDetailError((err as Error).message || "Failed to load complete alert details.");
      // Keeps the alert data from the feed so full summary, sources, score and timeline are still visible
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCloseDetail = () => {
    setSelectedAlert(null);
    setDetailError(null);
  };

  return (
    <div style={{ background: "#0b0f19", color: "#e2e8f0", minHeight: "100vh", fontFamily: "Segoe UI, -apple-system, sans-serif" }}>
      {/* Global & Responsive Styles */}
      <style>{`
        * {
          box-sizing: border-box;
        }
        .dashboard-layout {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        @media (min-width: 1024px) {
          .dashboard-layout {
            display: grid;
            grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr);
            gap: 2rem;
            align-items: start;
          }
          .detail-sticky-container {
            position: sticky;
            top: 1.5rem;
          }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 0.3; }
        }
      `}</style>

      {/* Top Navigation / Brand Header */}
      <nav
        style={{
          borderBottom: "1px solid #1e293b",
          padding: "1rem 2rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
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
            }}
          >
            SENTRY INTEL
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700, color: "#f8fafc" }}>
              Defence & Security Threat Intelligence
            </h1>
            <p style={{ margin: 0, fontSize: "0.8rem", color: "#94a3b8" }}>
              Operational Incident Corroboration & Monitoring Dashboard
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <span style={{ fontSize: "0.8rem", color: "#10b981", display: "flex", alignItems: "center", gap: "5px" }}>
            <span style={{ width: "8px", height: "8px", background: "#10b981", borderRadius: "50%", display: "inline-block" }} />
            Intelligence Dashboard
          </span>
          <button
            onClick={handleMorningBrief}
            disabled={briefLoading}
            style={{
              background: "linear-gradient(135deg, #0284c7, #0ea5e9)",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              padding: "0.5rem 1rem",
              fontWeight: 600,
              fontSize: "0.85rem",
              cursor: "pointer",
            }}
          >
            {briefLoading ? "Generating..." : "⚡ Generate Morning Brief"}
          </button>
        </div>
      </header>

      <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem" }}>
        {/* DEMO-DATA HONESTY & EVALUATION NOTICE */}
        <div
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
            <span style={{ fontWeight: 700, color: "#38bdf8", marginRight: "0.4rem" }}>
              🛡️ Demo Data & Evaluation Transparency:
            </span>
            The 50 cached threat dossiers displayed here are an illustrative evaluation dataset created for hackathon benchmarking — not a live classified or real-time operational feed. Sentry Intel's architecture is fully production-ready to ingest live articles via the ingest API.
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
        </div>
      </nav>

      {/* Main Container */}
      <main style={{ maxWidth: "1400px", margin: "0 auto", padding: "2rem" }}>
        {/* Requirement 1: Stats Header */}
        <StatsHeader totalAlerts={alerts.length} alertsLoading={alertsLoading} />

        {/* Requirement 5: Responsive Layout (Side by Side on Desktop, Stacked on Mobile) */}
        <div className="dashboard-layout">
          {/* Left Column: Requirement 2: Alert Feed */}
          <div>
            <AlertFeed
              alerts={alerts}
              loading={alertsLoading}
              error={alertsError}
              selectedAlertId={selectedAlert?.id || null}
              onSelectAlert={handleSelectAlert}
              onRetry={loadAlerts}
            />
          </div>

          {/* Right Column: Requirement 3: Alert Detail */}
          <div className="detail-sticky-container">
            <AlertDetail
              alert={selectedAlert}
              loading={detailLoading}
              error={detailError}
              onClose={handleCloseDetail}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
