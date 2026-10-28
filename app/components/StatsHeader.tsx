"use client";

import React, { useState, useEffect } from "react";

interface StatItem {
  label: string;
  count: number | string;
}

interface StatsHeaderProps {
  totalAlerts: number;
  alertsLoading: boolean;
}

function formatLabel(key: string): string {
  return key
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function StatsHeader({ totalAlerts, alertsLoading }: StatsHeaderProps) {
  const [stats, setStats] = useState<StatItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    fetch("/api/stats")
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`Stats API responded with status ${res.status}`);
        }
        const data = await res.json();
        if (!data || typeof data !== "object") {
          throw new Error("Invalid stats response");
        }

        const items: StatItem[] = [];
        const sourceObj =
          data.counts && typeof data.counts === "object" ? data.counts : data;

        for (const [key, val] of Object.entries(sourceObj)) {
          if (
            typeof val === "number" ||
            (typeof val === "string" && !isNaN(Number(val)))
          ) {
            items.push({
              label: formatLabel(key),
              count: val,
            });
          }
        }

        if (items.length === 0) {
          throw new Error("No count metrics in response");
        }

        if (isMounted) {
          setStats(items);
          setFailed(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setFailed(true);
          setStats(null);
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const cardStyle: React.CSSProperties = {
    background: "#0f172a",
    border: "1px solid #1e293b",
    borderRadius: "8px",
    padding: "1rem 1.25rem",
    minWidth: "150px",
    flex: "1 1 150px",
    display: "flex",
    flexDirection: "column",
    gap: "0.4rem",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.2)",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: "0.75rem",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    color: "#94a3b8",
  };

  const valueStyle: React.CSSProperties = {
    fontSize: "1.75rem",
    fontWeight: 700,
    color: "#f8fafc",
    lineHeight: 1.1,
  };

  // Loading state
  if (loading) {
    return (
      <header aria-label="Intelligence Statistics" style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ ...cardStyle, opacity: 0.6 }}>
              <div
                style={{
                  height: "12px",
                  width: "60%",
                  background: "#1e293b",
                  borderRadius: "4px",
                  animation: "pulse 1.5s infinite",
                }}
              />
              <div
                style={{
                  height: "28px",
                  width: "40%",
                  background: "#334155",
                  borderRadius: "4px",
                  marginTop: "0.5rem",
                }}
              />
            </div>
          ))}
        </div>
      </header>
    );
  }

  // If failed or no stats returned, show total alert count card instead
  if (failed || !stats || stats.length === 0) {
    return (
      <header aria-label="Intelligence Statistics" style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
          <div style={cardStyle} data-testid="stat-card-total-alerts">
            <span style={labelStyle}>Total Alerts</span>
            <span style={valueStyle}>
              {alertsLoading ? "..." : totalAlerts}
            </span>
          </div>
        </div>
      </header>
    );
  }

  // If stats API succeeded, render every count it returns as a card
  return (
    <header aria-label="Intelligence Statistics" style={{ marginBottom: "2rem" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
        {stats.map((item, idx) => (
          <div key={idx} style={cardStyle} data-testid={`stat-card-${idx}`}>
            <span style={labelStyle}>{item.label}</span>
            <span style={valueStyle}>{item.count}</span>
          </div>
        ))}
      </div>
    </header>
  );
}
