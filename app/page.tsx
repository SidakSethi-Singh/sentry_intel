"use client";

import React, { useState, useEffect } from "react";
import type { Alert } from "@/lib/summarize";

export default function HomePage() {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [answerData, setAnswerData] = useState<{
    answer: string;
    citations: string[];
    retrieved_alerts: Alert[];
  } | null>(null);

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [morningBrief, setMorningBrief] = useState<string | null>(null);
  const [briefLoading, setBriefLoading] = useState(false);

  // Load sample alerts for feed
  useEffect(() => {
    fetch("/api/alerts")
      .then((res) => (res.ok ? res.json() : null))
      .catch(() => null)
      .then((data) => {
        if (data && Array.isArray(data)) {
          setAlerts(data);
        } else {
          // Fallback fetch from cached summaries
          import("@/data/sample-summaries.json").then((mod) => {
            const raw = mod.default as Record<string, Alert>;
            const unique = new Map<string, Alert>();
            for (const a of Object.values(raw)) {
              if (a?.id && !unique.has(a.id)) unique.set(a.id, a);
            }
            setAlerts(Array.from(unique.values()));
          });
        }
      });
  }, []);

  const handleAsk = async (queryText?: string) => {
    const q = (queryText || question).trim();
    if (!q) return;

    if (queryText) setQuestion(queryText);
    setLoading(true);
    setAnswerData(null);

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      const data = await res.json();
      setAnswerData(data);
    } catch (err) {
      setAnswerData({
        answer: "Failed to connect to Ask Sentry RAG engine. Check network or server status.",
        citations: [],
        retrieved_alerts: [],
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMorningBrief = async () => {
    setBriefLoading(true);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "morning_brief" }),
      });
      const data = await res.json();
      setMorningBrief(data.brief);
    } catch {
      setMorningBrief("Failed to generate morning brief.");
    } finally {
      setBriefLoading(false);
    }
  };

  const openAlertById = (alertId: string) => {
    // Look up in retrieved alerts or full alerts list
    const found =
      answerData?.retrieved_alerts.find((a) => a.id === alertId) ||
      alerts.find((a) => a.id === alertId);
    if (found) {
      setSelectedAlert(found);
    }
  };

  const renderAnswerWithCitations = (text: string) => {
    const parts = text.split(/(\[alert-[a-zA-Z0-9_-]+\])/g);
    return parts.map((part, index) => {
      const match = part.match(/^\[(alert-[a-zA-Z0-9_-]+)\]$/);
      if (match) {
        const id = match[1];
        return (
          <button
            key={index}
            onClick={() => openAlertById(id)}
            style={{
              display: "inline-block",
              background: "rgba(0, 210, 255, 0.15)",
              color: "#00d2ff",
              border: "1px solid rgba(0, 210, 255, 0.4)",
              borderRadius: "4px",
              padding: "2px 6px",
              margin: "0 3px",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            title={`Click to inspect ${id}`}
          >
            🔍 {id}
          </button>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div style={{ background: "#0b0f19", color: "#e2e8f0", minHeight: "100vh", fontFamily: "Segoe UI, sans-serif" }}>
      {/* Top Header */}
      <header
        style={{
          borderBottom: "1px solid #1e293b",
          padding: "1rem 2rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "#0f172a",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div
            style={{
              background: "linear-gradient(135deg, #0284c7, #0369a1)",
              color: "#fff",
              padding: "0.4rem 0.8rem",
              borderRadius: "6px",
              fontWeight: 800,
              letterSpacing: "1px",
              fontSize: "0.9rem",
            }}
          >
            SENTRY INTEL
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700, color: "#f8fafc" }}>
              Defence & National Security Threat Intelligence
            </h1>
            <p style={{ margin: 0, fontSize: "0.8rem", color: "#94a3b8" }}>
              Automated Open-Source Corroboration & RAG Q&A System
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <span style={{ fontSize: "0.8rem", color: "#10b981", display: "flex", alignItems: "center", gap: "5px" }}>
            <span style={{ width: "8px", height: "8px", background: "#10b981", borderRadius: "50%", display: "inline-block" }} />
            Live Pipeline Active
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
              whiteSpace: "nowrap",
              background: "#0f172a",
              border: "1px solid #475569",
              padding: "3px 8px",
              borderRadius: "4px",
              fontSize: "0.72rem",
              fontWeight: 600,
              color: "#94a3b8",
            }}
          >
            Evaluation Dataset
          </span>
        </div>

        {/* Morning Brief Card */}
        {morningBrief && (
          <section
            style={{
              background: "#1e293b",
              border: "1px solid #38bdf8",
              borderRadius: "8px",
              padding: "1.5rem",
              marginBottom: "2rem",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.8rem" }}>
              <h2 style={{ margin: 0, fontSize: "1.1rem", color: "#38bdf8", display: "flex", alignItems: "center", gap: "8px" }}>
                📋 Executive Morning Intelligence Brief (2-Minute Audio/Readout)
              </h2>
              <button
                onClick={() => setMorningBrief(null)}
                style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "1rem" }}
              >
                ✕ Close
              </button>
            </div>
            <pre
              style={{
                background: "#0f172a",
                padding: "1rem",
                borderRadius: "6px",
                whiteSpace: "pre-wrap",
                color: "#e2e8f0",
                fontSize: "0.9rem",
                lineHeight: "1.6",
                margin: 0,
              }}
            >
              {morningBrief}
            </pre>
          </section>
        )}

        {/* ASK SENTRY RAG Q&A SECTION */}
        <section
          style={{
            background: "#111827",
            border: "1px solid #1f2937",
            borderRadius: "10px",
            padding: "1.8rem",
            marginBottom: "2.5rem",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.4)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", marginBottom: "0.6rem" }}>
            <span style={{ fontSize: "1.4rem" }}>🎯</span>
            <h2 style={{ margin: 0, fontSize: "1.3rem", fontWeight: 700, color: "#38bdf8" }}>
              Ask Sentry — Intelligence RAG Q&A
            </h2>
            <span
              style={{
                background: "rgba(16, 185, 129, 0.2)",
                color: "#34d399",
                fontSize: "0.75rem",
                padding: "2px 8px",
                borderRadius: "12px",
                fontWeight: 600,
              }}
            >
              Auditable & Cited
            </span>
          </div>

          <p style={{ margin: "0 0 1rem 0", color: "#94a3b8", fontSize: "0.9rem" }}>
            Query cached military, aerospace, and border threat intelligence. The RAG engine retrieves matching alerts and synthesizes an answer citing exact alert IDs.
          </p>

          {/* Quick Query Chips */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1rem" }}>
            {[
              "What happened near Ladakh this week?",
              "Any drone incursions in Punjab?",
              "Cyber attacks on critical infrastructure?",
              "What naval operations occurred in Gulf of Aden?",
              "Cyclone Dana disaster alerts?",
            ].map((sample, i) => (
              <button
                key={i}
                onClick={() => handleAsk(sample)}
                style={{
                  background: "#1f2937",
                  color: "#cbd5e1",
                  border: "1px solid #374151",
                  borderRadius: "20px",
                  padding: "4px 12px",
                  fontSize: "0.8rem",
                  cursor: "pointer",
                  transition: "background 0.2s",
                }}
              >
                {sample}
              </button>
            ))}
          </div>

          {/* Input & Search Box */}
          <div style={{ display: "flex", gap: "0.8rem" }}>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAsk()}
              placeholder="Ask Sentry (e.g. 'What happened near Ladakh this week?')"
              style={{
                flex: 1,
                padding: "0.85rem 1.2rem",
                borderRadius: "8px",
                border: "1px solid #374151",
                background: "#0f172a",
                color: "#f8fafc",
                fontSize: "0.95rem",
                outline: "none",
              }}
            />
            <button
              onClick={() => handleAsk()}
              disabled={loading}
              style={{
                background: "linear-gradient(135deg, #0284c7, #0ea5e9)",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                padding: "0 1.8rem",
                fontWeight: 700,
                fontSize: "0.95rem",
                cursor: "pointer",
                transition: "opacity 0.2s",
              }}
            >
              {loading ? "Searching..." : "Ask Sentry"}
            </button>
          </div>

          {/* Answer Area */}
          {answerData && (
            <div
              style={{
                marginTop: "1.5rem",
                background: "#0f172a",
                border: "1px solid #1e293b",
                borderRadius: "8px",
                padding: "1.4rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" }}>
                <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#38bdf8", textTransform: "uppercase" }}>
                  Synthesized Threat Answer
                </span>
                <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                  {answerData.citations.length} cited alert(s)
                </span>
              </div>

              <div style={{ fontSize: "1rem", lineHeight: "1.6", color: "#f1f5f9", marginBottom: "1.2rem" }}>
                {renderAnswerWithCitations(answerData.answer)}
              </div>

              {/* Retrieved Sources Section */}
              {answerData.retrieved_alerts.length > 0 && (
                <div>
                  <h4 style={{ margin: "0.8rem 0 0.5rem 0", fontSize: "0.85rem", color: "#94a3b8", textTransform: "uppercase" }}>
                    Retrieved Intelligence Alerts ({answerData.retrieved_alerts.length}):
                  </h4>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "0.8rem" }}>
                    {answerData.retrieved_alerts.map((alert) => (
                      <div
                        key={alert.id}
                        onClick={() => setSelectedAlert(alert)}
                        style={{
                          background: "#1e293b",
                          border: "1px solid #334155",
                          borderRadius: "6px",
                          padding: "0.8rem",
                          cursor: "pointer",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                          <span
                            style={{
                              background:
                                alert.severity === "critical"
                                  ? "#dc2626"
                                  : alert.severity === "high"
                                  ? "#ea580c"
                                  : "#ca8a04",
                              color: "#fff",
                              padding: "2px 6px",
                              borderRadius: "4px",
                              fontSize: "0.7rem",
                              fontWeight: 700,
                              textTransform: "uppercase",
                            }}
                          >
                            {alert.severity} ({alert.score})
                          </span>
                          {alert.corroboration_badge && (
                            <span style={{ fontSize: "0.7rem", color: "#38bdf8" }}>
                              🛡️ {alert.corroboration_badge}
                            </span>
                          )}
                        </div>
                        <p style={{ margin: 0, fontSize: "0.8rem", color: "#cbd5e1", lineHeight: "1.4" }}>
                          {alert.summary.substring(0, 110)}...
                        </p>
                        {alert.score_justification && (
                          <div style={{ marginTop: "0.5rem", fontSize: "0.72rem", color: "#94a3b8", fontStyle: "italic" }}>
                            {alert.score_justification}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* FEED: ALL ACTIVE INTELLIGENCE ALERTS */}
        <section>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h2 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700, color: "#f8fafc" }}>
              Active Threat Alerts Feed ({alerts.length})
            </h2>
            <span style={{ fontSize: "0.8rem", color: "#64748b" }}>Newest and highest severity first</span>
          </div>

          <div style={{ display: "grid", gap: "1rem" }}>
            {alerts.map((alert) => (
              <div
                key={alert.id}
                onClick={() => setSelectedAlert(alert)}
                style={{
                  background: "#111827",
                  border: "1px solid #1f2937",
                  borderRadius: "8px",
                  padding: "1.2rem",
                  cursor: "pointer",
                  transition: "border 0.2s",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    <span
                      style={{
                        background:
                          alert.severity === "critical"
                            ? "#dc2626"
                            : alert.severity === "high"
                            ? "#ea580c"
                            : alert.severity === "medium"
                            ? "#ca8a04"
                            : "#16a34a",
                        color: "#fff",
                        padding: "3px 8px",
                        borderRadius: "4px",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        textTransform: "uppercase",
                      }}
                    >
                      {alert.severity} · {alert.score}
                    </span>
                    <span style={{ fontWeight: 600, color: "#f8fafc", fontSize: "0.95rem" }}>
                      {alert.location || alert.id}
                    </span>
                  </div>

                  {alert.corroboration_badge && (
                    <span
                      style={{
                        background: "rgba(56, 189, 248, 0.15)",
                        color: "#38bdf8",
                        border: "1px solid rgba(56, 189, 248, 0.3)",
                        padding: "2px 8px",
                        borderRadius: "12px",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                      }}
                    >
                      🛡️ {alert.corroboration_badge}
                    </span>
                  )}
                  {alert.confidence && (
                    <span
                      style={{
                        background:
                          alert.confidence === "high"
                            ? "rgba(16, 185, 129, 0.15)"
                            : alert.confidence === "medium"
                            ? "rgba(245, 158, 11, 0.15)"
                            : "rgba(148, 163, 184, 0.15)",
                        color:
                          alert.confidence === "high"
                            ? "#34d399"
                            : alert.confidence === "medium"
                            ? "#fbbf24"
                            : "#94a3b8",
                        border: `1px solid ${
                          alert.confidence === "high"
                            ? "rgba(16, 185, 129, 0.3)"
                            : alert.confidence === "medium"
                            ? "rgba(245, 158, 11, 0.3)"
                            : "rgba(148, 163, 184, 0.3)"
                        }`,
                        padding: "2px 8px",
                        borderRadius: "12px",
                        fontSize: "0.72rem",
                        fontWeight: 600,
                      }}
                    >
                      {alert.confidence === "high"
                        ? "● High Confidence"
                        : alert.confidence === "medium"
                        ? "◐ Med Confidence"
                        : "○ Low Confidence"}
                    </span>
                  )}
                  {alert.recommended_actions && alert.recommended_actions.length > 0 && (
                    <span
                      style={{
                        background: "rgba(168, 85, 247, 0.15)",
                        color: "#c084fc",
                        border: "1px solid rgba(168, 85, 247, 0.3)",
                        padding: "2px 8px",
                        borderRadius: "12px",
                        fontSize: "0.72rem",
                        fontWeight: 600,
                      }}
                    >
                      ⚡ Response Playbook
                    </span>
                  )}
                </div>

                <p style={{ margin: "0 0 0.6rem 0", color: "#cbd5e1", fontSize: "0.9rem", lineHeight: "1.5" }}>
                  {alert.summary}
                </p>

                {alert.score_justification && (
                  <div style={{ fontSize: "0.8rem", color: "#94a3b8", background: "#0f172a", padding: "6px 10px", borderRadius: "4px", marginBottom: "0.6rem" }}>
                    <strong>Why this score:</strong> {alert.score_justification}
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#64748b" }}>
                  <span>Sources: {alert.sources?.map((s) => s.name).join(", ")}</span>
                  <span>{alert.timeline_events?.length || 0} timeline events</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ALERT DETAIL MODAL */}
        {selectedAlert && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0, 0, 0, 0.75)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "1rem",
              zIndex: 1000,
            }}
          >
            <div
              style={{
                background: "#0f172a",
                border: "1px solid #38bdf8",
                borderRadius: "10px",
                maxWidth: "750px",
                width: "100%",
                maxHeight: "90vh",
                overflowY: "auto",
                padding: "2rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                <div>
                  <span
                    style={{
                      background:
                        selectedAlert.severity === "critical"
                          ? "#dc2626"
                          : selectedAlert.severity === "high"
                          ? "#ea580c"
                          : "#ca8a04",
                      color: "#fff",
                      padding: "3px 8px",
                      borderRadius: "4px",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      marginRight: "0.5rem",
                    }}
                  >
                    {selectedAlert.severity} (Score {selectedAlert.score}/100)
                  </span>
                  {selectedAlert.corroboration_badge && (
                    <span style={{ color: "#38bdf8", fontSize: "0.85rem", fontWeight: 600, marginRight: "0.5rem" }}>
                      🛡️ {selectedAlert.corroboration_badge}
                    </span>
                  )}
                  {selectedAlert.confidence && (
                    <span
                      style={{
                        background:
                          selectedAlert.confidence === "high"
                            ? "rgba(16, 185, 129, 0.15)"
                            : selectedAlert.confidence === "medium"
                            ? "rgba(245, 158, 11, 0.15)"
                            : "rgba(148, 163, 184, 0.15)",
                        color:
                          selectedAlert.confidence === "high"
                            ? "#34d399"
                            : selectedAlert.confidence === "medium"
                            ? "#fbbf24"
                            : "#94a3b8",
                        border: `1px solid ${
                          selectedAlert.confidence === "high"
                            ? "rgba(16, 185, 129, 0.3)"
                            : selectedAlert.confidence === "medium"
                            ? "rgba(245, 158, 11, 0.3)"
                            : "rgba(148, 163, 184, 0.3)"
                        }`,
                        padding: "2px 8px",
                        borderRadius: "12px",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                      }}
                    >
                      {selectedAlert.confidence === "high"
                        ? "● High Confidence (Corroborated)"
                        : selectedAlert.confidence === "medium"
                        ? "◐ Medium Confidence (Credible Source)"
                        : "○ Low Confidence (Unconfirmed)"}
                    </span>
                  )}
                  <h3 style={{ margin: "0.5rem 0 0 0", color: "#f8fafc", fontSize: "1.2rem" }}>
                    {selectedAlert.id}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedAlert(null)}
                  style={{ background: "transparent", border: "none", color: "#94a3b8", fontSize: "1.4rem", cursor: "pointer" }}
                >
                  ✕
                </button>
              </div>

              {/* CRITICAL ALERT TOP HIGHLIGHT: If severity is critical, render Playbook right at the top */}
              {selectedAlert.severity === "critical" &&
                ((selectedAlert.recommended_actions && selectedAlert.recommended_actions.length > 0) ||
                  (selectedAlert.official_links && selectedAlert.official_links.length > 0)) && (
                  <div
                    style={{
                      marginBottom: "1.5rem",
                      background: "rgba(220, 38, 38, 0.08)",
                      border: "2px solid #ef4444",
                      borderRadius: "8px",
                      padding: "1.2rem",
                      boxShadow: "0 0 24px rgba(239, 68, 68, 0.25)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        background: "#dc2626",
                        color: "#fff",
                        padding: "6px 12px",
                        borderRadius: "6px",
                        fontSize: "0.8rem",
                        fontWeight: 800,
                        letterSpacing: "0.05em",
                        marginBottom: "1rem",
                      }}
                    >
                      <span>🚨 CRITICAL INCIDENT RESPONSE PROTOCOL — IMMEDIATE ATTENTION</span>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.8rem" }}>
                      <h4 style={{ color: "#f87171", margin: 0, fontSize: "1rem", fontWeight: 700 }}>
                        🛡️ What To Do — Operational Response Playbook
                      </h4>
                      {selectedAlert.category && (
                        <span
                          style={{
                            fontSize: "0.72rem",
                            background: "#1e293b",
                            color: "#94a3b8",
                            padding: "2px 8px",
                            borderRadius: "4px",
                            textTransform: "uppercase",
                            fontWeight: 600,
                          }}
                        >
                          {selectedAlert.category.replace("_", " ")}
                        </span>
                      )}
                    </div>

                    {/* Analyst Actions */}
                    {selectedAlert.recommended_actions &&
                      selectedAlert.recommended_actions.filter((a) => a.audience === "analyst").length > 0 && (
                        <div style={{ marginBottom: "1rem" }}>
                          <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#93c5fd", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>
                            🎯 Intelligence & Security Analyst Actions
                          </div>
                          <div style={{ display: "grid", gap: "0.5rem" }}>
                            {selectedAlert.recommended_actions
                              .filter((a) => a.audience === "analyst")
                              .map((item, idx) => (
                                <div
                                  key={idx}
                                  style={{
                                    display: "flex",
                                    alignItems: "flex-start",
                                    gap: "0.6rem",
                                    background: "#0f172a",
                                    border: "1px solid #1e293b",
                                    padding: "0.6rem 0.8rem",
                                    borderRadius: "6px",
                                  }}
                                >
                                  <span
                                    style={{
                                      background:
                                        item.priority === "immediate"
                                          ? "#dc2626"
                                          : item.priority === "high"
                                          ? "#ea580c"
                                          : "#0284c7",
                                      color: "#fff",
                                      fontSize: "0.65rem",
                                      fontWeight: 700,
                                      padding: "2px 6px",
                                      borderRadius: "3px",
                                      textTransform: "uppercase",
                                      whiteSpace: "nowrap",
                                      marginTop: "2px",
                                    }}
                                  >
                                    {item.priority}
                                  </span>
                                  <span style={{ fontSize: "0.85rem", color: "#e2e8f0", lineHeight: "1.4" }}>
                                    {item.action}
                                  </span>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}

                    {/* Civilian Safety Steps (ONLY if present) */}
                    {selectedAlert.recommended_actions &&
                      selectedAlert.recommended_actions.filter((a) => a.audience === "civilian").length > 0 && (
                        <div
                          style={{
                            marginBottom: "1rem",
                            background: "rgba(245, 158, 11, 0.08)",
                            border: "1px solid rgba(245, 158, 11, 0.3)",
                            borderRadius: "6px",
                            padding: "0.8rem",
                          }}
                        >
                          <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#fbbf24", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>
                            ⚠️ Civilian Public Safety Steps
                          </div>
                          <div style={{ display: "grid", gap: "0.4rem" }}>
                            {selectedAlert.recommended_actions
                              .filter((a) => a.audience === "civilian")
                              .map((item, idx) => (
                                <div
                                  key={idx}
                                  style={{
                                    display: "flex",
                                    alignItems: "flex-start",
                                    gap: "0.6rem",
                                    background: "#0f172a",
                                    border: "1px solid rgba(245, 158, 11, 0.2)",
                                    padding: "0.5rem 0.7rem",
                                    borderRadius: "4px",
                                  }}
                                >
                                  <span
                                    style={{
                                      background: item.priority === "immediate" ? "#dc2626" : "#f59e0b",
                                      color: "#fff",
                                      fontSize: "0.65rem",
                                      fontWeight: 700,
                                      padding: "2px 6px",
                                      borderRadius: "3px",
                                      textTransform: "uppercase",
                                      whiteSpace: "nowrap",
                                      marginTop: "2px",
                                    }}
                                  >
                                    {item.priority}
                                  </span>
                                  <span style={{ fontSize: "0.85rem", color: "#fef3c7", lineHeight: "1.4" }}>
                                    {item.action}
                                  </span>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}

                    {/* Official Verified Links */}
                    {selectedAlert.official_links && selectedAlert.official_links.length > 0 && (
                      <div style={{ marginBottom: "0.8rem" }}>
                        <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#38bdf8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.4rem" }}>
                          🏛️ Verified Official Authority Portals
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                          {selectedAlert.official_links.map((link, idx) => (
                            <a
                              key={idx}
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.3rem",
                                background: "#1e293b",
                                border: "1px solid #334155",
                                color: "#38bdf8",
                                padding: "4px 10px",
                                borderRadius: "4px",
                                fontSize: "0.8rem",
                                textDecoration: "none",
                                fontWeight: 500,
                              }}
                            >
                              <span>{link.name}</span>
                              <span style={{ fontSize: "0.75rem" }}>↗</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Safety Disclaimer */}
                    <div
                      style={{
                        marginTop: "0.8rem",
                        padding: "0.6rem 0.8rem",
                        background: "rgba(100, 116, 139, 0.15)",
                        borderLeft: "3px solid #94a3b8",
                        borderRadius: "4px",
                        fontSize: "0.75rem",
                        color: "#94a3b8",
                        fontStyle: "italic",
                      }}
                    >
                      ⚠️ <strong>Notice:</strong> Guidance only — always follow your local authorities' instructions.
                    </div>
                  </div>
                )}

              {/* Summary */}
              <div style={{ marginBottom: "1.2rem" }}>
                <h4 style={{ color: "#38bdf8", margin: "0 0 0.4rem 0", fontSize: "0.9rem" }}>AI Executive Summary</h4>
                <p style={{ margin: 0, color: "#e2e8f0", lineHeight: "1.6", fontSize: "0.95rem" }}>
                  {selectedAlert.summary}
                </p>
              </div>

              {/* Why This Score */}
              {selectedAlert.score_justification && (
                <div style={{ background: "#1e293b", padding: "0.8rem", borderRadius: "6px", marginBottom: "1.2rem" }}>
                  <h4 style={{ color: "#f59e0b", margin: "0 0 0.3rem 0", fontSize: "0.85rem" }}>
                    ⚖️ "Why This Score" Audit Justification
                  </h4>
                  <p style={{ margin: 0, color: "#cbd5e1", fontSize: "0.85rem" }}>
                    {selectedAlert.score_justification}
                  </p>
                </div>
              )}

              {/* STANDARD PLAYBOOK (For Non-Critical Alerts) */}
              {selectedAlert.severity !== "critical" &&
                ((selectedAlert.recommended_actions && selectedAlert.recommended_actions.length > 0) ||
                  (selectedAlert.official_links && selectedAlert.official_links.length > 0)) && (
                  <div
                    style={{
                      marginBottom: "1.5rem",
                      background: "#131c31",
                      border: "1px solid #3b82f6",
                      borderRadius: "8px",
                      padding: "1.2rem",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.8rem" }}>
                      <h4 style={{ color: "#38bdf8", margin: 0, fontSize: "1rem", fontWeight: 700 }}>
                        🛡️ What To Do — Tactical Response Playbook
                      </h4>
                      {selectedAlert.category && (
                        <span
                          style={{
                            fontSize: "0.72rem",
                            background: "#1e293b",
                            color: "#94a3b8",
                            padding: "2px 8px",
                            borderRadius: "4px",
                            textTransform: "uppercase",
                            fontWeight: 600,
                          }}
                        >
                          {selectedAlert.category.replace("_", " ")}
                        </span>
                      )}
                    </div>

                    {/* Analyst Actions */}
                    {selectedAlert.recommended_actions &&
                      selectedAlert.recommended_actions.filter((a) => a.audience === "analyst").length > 0 && (
                        <div style={{ marginBottom: "1rem" }}>
                          <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#93c5fd", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>
                            🎯 Intelligence & Security Analyst Actions
                          </div>
                          <div style={{ display: "grid", gap: "0.5rem" }}>
                            {selectedAlert.recommended_actions
                              .filter((a) => a.audience === "analyst")
                              .map((item, idx) => (
                                <div
                                  key={idx}
                                  style={{
                                    display: "flex",
                                    alignItems: "flex-start",
                                    gap: "0.6rem",
                                    background: "#0f172a",
                                    border: "1px solid #1e293b",
                                    padding: "0.6rem 0.8rem",
                                    borderRadius: "6px",
                                  }}
                                >
                                  <span
                                    style={{
                                      background:
                                        item.priority === "immediate"
                                          ? "#dc2626"
                                          : item.priority === "high"
                                          ? "#ea580c"
                                          : "#0284c7",
                                      color: "#fff",
                                      fontSize: "0.65rem",
                                      fontWeight: 700,
                                      padding: "2px 6px",
                                      borderRadius: "3px",
                                      textTransform: "uppercase",
                                      whiteSpace: "nowrap",
                                      marginTop: "2px",
                                    }}
                                  >
                                    {item.priority}
                                  </span>
                                  <span style={{ fontSize: "0.85rem", color: "#e2e8f0", lineHeight: "1.4" }}>
                                    {item.action}
                                  </span>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}

                    {/* Civilian Safety Steps (ONLY if present) */}
                    {selectedAlert.recommended_actions &&
                      selectedAlert.recommended_actions.filter((a) => a.audience === "civilian").length > 0 && (
                        <div
                          style={{
                            marginBottom: "1rem",
                            background: "rgba(245, 158, 11, 0.08)",
                            border: "1px solid rgba(245, 158, 11, 0.3)",
                            borderRadius: "6px",
                            padding: "0.8rem",
                          }}
                        >
                          <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#fbbf24", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>
                            ⚠️ Civilian Public Safety Steps
                          </div>
                          <div style={{ display: "grid", gap: "0.4rem" }}>
                            {selectedAlert.recommended_actions
                              .filter((a) => a.audience === "civilian")
                              .map((item, idx) => (
                                <div
                                  key={idx}
                                  style={{
                                    display: "flex",
                                    alignItems: "flex-start",
                                    gap: "0.6rem",
                                    background: "#0f172a",
                                    border: "1px solid rgba(245, 158, 11, 0.2)",
                                    padding: "0.5rem 0.7rem",
                                    borderRadius: "4px",
                                  }}
                                >
                                  <span
                                    style={{
                                      background: item.priority === "immediate" ? "#dc2626" : "#f59e0b",
                                      color: "#fff",
                                      fontSize: "0.65rem",
                                      fontWeight: 700,
                                      padding: "2px 6px",
                                      borderRadius: "3px",
                                      textTransform: "uppercase",
                                      whiteSpace: "nowrap",
                                      marginTop: "2px",
                                    }}
                                  >
                                    {item.priority}
                                  </span>
                                  <span style={{ fontSize: "0.85rem", color: "#fef3c7", lineHeight: "1.4" }}>
                                    {item.action}
                                  </span>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}

                    {/* Official Verified Links */}
                    {selectedAlert.official_links && selectedAlert.official_links.length > 0 && (
                      <div style={{ marginBottom: "0.8rem" }}>
                        <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#38bdf8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.4rem" }}>
                          🏛️ Verified Official Authority Portals
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                          {selectedAlert.official_links.map((link, idx) => (
                            <a
                              key={idx}
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.3rem",
                                background: "#1e293b",
                                border: "1px solid #334155",
                                color: "#38bdf8",
                                padding: "4px 10px",
                                borderRadius: "4px",
                                fontSize: "0.8rem",
                                textDecoration: "none",
                                fontWeight: 500,
                              }}
                            >
                              <span>{link.name}</span>
                              <span style={{ fontSize: "0.75rem" }}>↗</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Safety Disclaimer */}
                    <div
                      style={{
                        marginTop: "0.8rem",
                        padding: "0.6rem 0.8rem",
                        background: "rgba(100, 116, 139, 0.15)",
                        borderLeft: "3px solid #94a3b8",
                        borderRadius: "4px",
                        fontSize: "0.75rem",
                        color: "#94a3b8",
                        fontStyle: "italic",
                      }}
                    >
                      ⚠️ <strong>Notice:</strong> Guidance only — always follow your local authorities' instructions.
                    </div>
                  </div>
                )}

              {/* Timeline Events */}
              {selectedAlert.timeline_events && selectedAlert.timeline_events.length > 0 && (
                <div style={{ marginBottom: "1.2rem" }}>
                  <h4 style={{ color: "#38bdf8", margin: "0 0 0.6rem 0", fontSize: "0.9rem" }}>
                    ⏱️ Chronological Event Timeline
                  </h4>
                  <div style={{ borderLeft: "2px solid #38bdf8", paddingLeft: "1rem", display: "grid", gap: "0.6rem" }}>
                    {selectedAlert.timeline_events.map((ev, i) => (
                      <div key={i}>
                        <span style={{ fontSize: "0.8rem", color: "#38bdf8", fontWeight: 700 }}>{ev.time}</span>
                        <p style={{ margin: "2px 0 0 0", fontSize: "0.85rem", color: "#cbd5e1" }}>{ev.event}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Verified Sources */}
              {selectedAlert.sources && selectedAlert.sources.length > 0 && (
                <div>
                  <h4 style={{ color: "#38bdf8", margin: "0 0 0.4rem 0", fontSize: "0.9rem" }}>
                    🔗 Corroborating Cited Sources
                  </h4>
                  <ul style={{ margin: 0, paddingLeft: "1.2rem", fontSize: "0.85rem", color: "#94a3b8" }}>
                    {selectedAlert.sources.map((s, i) => (
                      <li key={i} style={{ marginBottom: "4px" }}>
                        <a href={s.url} target="_blank" rel="noopener noreferrer" style={{ color: "#38bdf8", textDecoration: "none" }}>
                          {s.name} ↗
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
