/**
 * Analytics Dashboard — Merlin Energy
 * ======================================
 * Accessible at /analytics (password-gated, same as /admin)
 *
 * Shows: page views, sessions, quotes built, sign-ups, leads,
 *        30-day trend sparklines, top pages, top industries,
 *        recent activity, conversion funnel.
 */

import { useState, useEffect, useCallback } from "react";
import { getDashboardStats, type DailyCount, type DashboardStats, type TopItem } from "@/services/analyticsService";

// ── Auth gate ─────────────────────────────────────────────────────────────────
async function checkAuth(email: string, password: string): Promise<boolean> {
  const { adminAuthService } = await import("@/services/adminAuthService");
  return adminAuthService.authenticate(email, password);
}

// ── Sparkline (pure SVG, no library) ─────────────────────────────────────────
function Sparkline({
  data,
  color = "#3ECF8E",
  height = 48,
}: {
  data: DailyCount[];
  color?: string;
  height?: number;
}) {
  if (!data.length) return null;
  const W = 300;
  const H = height;
  const PAD = 4;
  const vals = data.map((d) => d.count);
  const max = Math.max(...vals, 1);
  const pts = vals.map((v, i) => [
    PAD + (i / (vals.length - 1)) * (W - PAD * 2),
    H - PAD - ((v / max) * (H - PAD * 2)),
  ]);
  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const fill =
    pts.length > 1
      ? `${path} L${pts[pts.length - 1][0].toFixed(1)},${H - PAD} L${pts[0][0].toFixed(1)},${H - PAD} Z`
      : "";
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: "100%", height }}>
      <defs>
        <linearGradient id={`sg-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {fill && (
        <path
          d={fill}
          fill={`url(#sg-${color.replace("#", "")})`}
        />
      )}
      <path d={path} stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KpiCard({
  label,
  value,
  sub,
  sparkData,
  color = "#3ECF8E",
  icon,
}: {
  label: string;
  value: number | string;
  sub?: string;
  sparkData?: DailyCount[];
  color?: string;
  icon: string;
}) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 12,
        padding: "20px 24px 14px",
        display: "flex",
        flexDirection: "column",
        gap: 4,
        minWidth: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <span style={{ fontSize: 13, color: "#94a3b8", fontWeight: 500, letterSpacing: "0.02em" }}>{label}</span>
      </div>
      <div style={{ fontSize: 32, fontWeight: 700, color: "#fff", lineHeight: 1 }}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
      {sub && (
        <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{sub}</div>
      )}
      {sparkData && sparkData.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <Sparkline data={sparkData} color={color} height={40} />
        </div>
      )}
    </div>
  );
}

// ── Mini bar ─────────────────────────────────────────────────────────────────
function BarRow({
  label,
  count,
  max,
  color = "#3ECF8E",
  rank,
}: {
  label: string;
  count: number;
  max: number;
  color?: string;
  rank: number;
}) {
  const pct = max > 0 ? (count / max) * 100 : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
      <span style={{ fontSize: 11, color: "#475569", width: 16, textAlign: "right", flexShrink: 0 }}>{rank}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <span
            style={{
              fontSize: 13,
              color: "#cbd5e1",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: "calc(100% - 40px)",
            }}
          >
            {label}
          </span>
          <span style={{ fontSize: 12, color: "#64748b", flexShrink: 0 }}>{count}</span>
        </div>
        <div
          style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}
        >
          <div
            style={{
              height: "100%",
              width: `${pct}%`,
              background: color,
              borderRadius: 2,
              transition: "width 0.6s ease",
            }}
          />
        </div>
      </div>
    </div>
  );
}

// ── Section card wrapper ──────────────────────────────────────────────────────
function Card({
  title,
  children,
  style,
}: {
  title: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 12,
        padding: 20,
        ...style,
      }}
    >
      <h3
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: "#94a3b8",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          marginBottom: 16,
          margin: "0 0 16px",
        }}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}

// ── Funnel bar ────────────────────────────────────────────────────────────────
function FunnelStep({
  label,
  value,
  pct,
  color,
}: {
  label: string;
  value: number;
  pct: number;
  color: string;
}) {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 90,
          height: 80,
          borderRadius: 8,
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          alignItems: "flex-end",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: `${Math.max(pct, 4)}%`,
            background: color,
            opacity: 0.75,
            transition: "height 0.8s ease",
          }}
        />
        <span
          style={{
            position: "relative",
            width: "100%",
            textAlign: "center",
            fontSize: 15,
            fontWeight: 700,
            color: "#fff",
            paddingBottom: 6,
            zIndex: 1,
          }}
        >
          {value.toLocaleString()}
        </span>
      </div>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: 11, color: "#475569" }}>{pct.toFixed(1)}%</div>
      </div>
    </div>
  );
}

// ── Trend chart (multi-series sparklines) ────────────────────────────────────
function TrendChart({
  views,
  quotes,
  signups,
}: {
  views: DailyCount[];
  quotes: DailyCount[];
  signups: DailyCount[];
}) {
  const W = 700;
  const H = 120;
  const PAD_X = 40;
  const PAD_Y = 8;

  const buildPath = (data: DailyCount[], maxVal: number) => {
    if (!data.length || maxVal === 0) return "";
    return data
      .map((d, i) => {
        const x = PAD_X + (i / (data.length - 1)) * (W - PAD_X * 2);
        const y = H - PAD_Y - ((d.count / maxVal) * (H - PAD_Y * 2));
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  };

  const globalMax = Math.max(
    ...views.map((d) => d.count),
    ...quotes.map((d) => d.count),
    ...signups.map((d) => d.count),
    1
  );

  const labelDates = views
    .filter((_, i) => i % 6 === 0)
    .map((d) => ({ date: d.date, x: PAD_X + ((views.indexOf(d)) / (views.length - 1)) * (W - PAD_X * 2) }));

  return (
    <div style={{ width: "100%", overflowX: "auto" }}>
      <svg
        viewBox={`0 0 ${W} ${H + 20}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ width: "100%", minWidth: 320 }}
      >
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
          const y = H - PAD_Y - pct * (H - PAD_Y * 2);
          return (
            <line
              key={pct}
              x1={PAD_X}
              x2={W - PAD_X}
              y1={y}
              y2={y}
              stroke="rgba(255,255,255,0.05)"
              strokeDasharray="4 4"
            />
          );
        })}

        {/* Date labels */}
        {labelDates.map((l) => (
          <text key={l.date} x={l.x} y={H + 14} fontSize="9" fill="#475569" textAnchor="middle">
            {l.date.slice(5)}
          </text>
        ))}

        {/* Area fills */}
        {views.length > 1 && (
          <path
            d={`${buildPath(views, globalMax)} L${(PAD_X + (W - PAD_X * 2)).toFixed(1)},${(H - PAD_Y).toFixed(1)} L${PAD_X},${(H - PAD_Y).toFixed(1)} Z`}
            fill="rgba(62,207,142,0.08)"
          />
        )}

        {/* Series lines */}
        <path d={buildPath(views, globalMax)} stroke="#3ECF8E" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d={buildPath(quotes, globalMax)} stroke="#60a5fa" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d={buildPath(signups, globalMax)} stroke="#F59E0B" strokeWidth="2" fill="none" strokeLinecap="round" />
      </svg>

      {/* Legend */}
      <div style={{ display: "flex", gap: 20, marginTop: 4, paddingLeft: 8 }}>
        {[
          { color: "#3ECF8E", label: "Page Views" },
          { color: "#60a5fa", label: "Quotes" },
          { color: "#F59E0B", label: "Sign-ups" },
        ].map((s) => (
          <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 20, height: 2, background: s.color, borderRadius: 1 }} />
            <span style={{ fontSize: 11, color: "#64748b" }}>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── TopList wrapper ───────────────────────────────────────────────────────────
function TopList({ items, color, emptyMsg }: { items: TopItem[]; color: string; emptyMsg: string }) {
  if (!items.length) {
    return <p style={{ fontSize: 13, color: "#475569" }}>{emptyMsg}</p>;
  }
  const max = items[0].count;
  return (
    <>
      {items.map((item, i) => (
        <BarRow key={item.label} label={item.label} count={item.count} max={max} color={color} rank={i + 1} />
      ))}
    </>
  );
}

// ── Recent list ───────────────────────────────────────────────────────────────
function RecentRow({ icon, primary, secondary, time }: { icon: string; primary: string; secondary?: string; time: string }) {
  const rel = formatRelTime(time);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "8px 0",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
      }}
    >
      <span style={{ fontSize: 16, width: 24, textAlign: "center", flexShrink: 0 }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13,
            color: "#cbd5e1",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {primary}
        </div>
        {secondary && (
          <div style={{ fontSize: 11, color: "#64748b" }}>{secondary}</div>
        )}
      </div>
      <span style={{ fontSize: 11, color: "#475569", flexShrink: 0 }}>{rel}</span>
    </div>
  );
}

function formatRelTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

// ── Password Gate ─────────────────────────────────────────────────────────────
function PasswordGate({ onAuth }: { onAuth: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const ok = await checkAuth(email, password);
      if (ok) {
        onAuth();
      } else {
        setError("Invalid credentials");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#040b18",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      <div
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 16,
          padding: "40px 48px",
          width: "100%",
          maxWidth: 380,
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <img src="/favicon.png" alt="Merlin" width={48} height={48} style={{ borderRadius: 10, marginBottom: 12 }} />
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#fff", margin: "0 0 4px" }}>Analytics</h1>
          <p style={{ fontSize: 14, color: "#64748b", margin: 0 }}>Merlin Energy — internal dashboard</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 8,
              padding: "12px 14px",
              color: "#fff",
              fontSize: 14,
              outline: "none",
            }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 8,
              padding: "12px 14px",
              color: "#fff",
              fontSize: 14,
              outline: "none",
            }}
          />
          {error && <p style={{ fontSize: 13, color: "#f87171", margin: 0 }}>{error}</p>}
          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 4,
              padding: "12px",
              background: "#3ECF8E",
              color: "#040b18",
              fontWeight: 700,
              fontSize: 14,
              border: "none",
              borderRadius: 8,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Verifying…" : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function AnalyticsDashboard() {
  const [authed, setAuthed] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!authed) return;
    setLoading(true);
    setError("");
    try {
      const data = await getDashboardStats();
      setStats(data);
      setLastRefresh(new Date());
    } catch (e) {
      setError(`Failed to load: ${(e as Error).message}`);
    } finally {
      setLoading(false);
    }
  }, [authed]);

  useEffect(() => {
    if (authed) load();
  }, [authed, load]);

  if (!authed) {
    return <PasswordGate onAuth={() => setAuthed(true)} />;
  }

  // ── Layout ────────────────────────────────────────────────────────────────
  const s = stats;

  const funnelMax = Math.max(s?.totalPageViews30d ?? 1, 1);
  const funnelSteps = s
    ? [
        { label: "Page Views", value: s.totalPageViews30d, color: "#3ECF8E", pct: 100 },
        { label: "Quotes Built", value: s.totalQuotes30d, color: "#60a5fa", pct: Math.min(100, (s.totalQuotes30d / funnelMax) * 100) },
        { label: "Leads", value: s.totalLeads30d, color: "#F59E0B", pct: Math.min(100, (s.totalLeads30d / funnelMax) * 100) },
        { label: "Sign-ups", value: s.totalSignups30d, color: "#a78bfa", pct: Math.min(100, (s.totalSignups30d / funnelMax) * 100) },
      ]
    : [];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#040b18",
        color: "#fff",
        fontFamily: "Inter, system-ui, sans-serif",
        padding: "0 0 80px",
      }}
    >
      {/* ── Topbar ── */}
      <div
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          padding: "16px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          background: "rgba(4,11,24,0.95)",
          backdropFilter: "blur(8px)",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img src="/favicon.png" alt="Merlin" width={32} height={32} style={{ borderRadius: 7 }} />
          <div>
            <span style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>Analytics</span>
            <span style={{ fontSize: 14, color: "#475569", marginLeft: 8 }}>Last 30 days</span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {lastRefresh && (
            <span style={{ fontSize: 12, color: "#475569" }}>
              Updated {lastRefresh.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={load}
            disabled={loading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 16px",
              background: "rgba(62,207,142,0.12)",
              border: "1px solid rgba(62,207,142,0.25)",
              borderRadius: 8,
              color: "#3ECF8E",
              fontSize: 13,
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1,
            }}
          >
            <span style={{ display: "inline-block", animation: loading ? "spin 1s linear infinite" : "none" }}>↻</span>
            {loading ? "Loading…" : "Refresh"}
          </button>
          <a
            href="/"
            style={{
              padding: "8px 16px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 8,
              color: "#94a3b8",
              fontSize: 13,
              textDecoration: "none",
            }}
          >
            ← App
          </a>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
        {error && (
          <div
            style={{
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: 8,
              padding: "12px 16px",
              color: "#f87171",
              fontSize: 13,
              marginBottom: 24,
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {/* ── KPI Grid ── */}
        {!s && !loading && (
          <p style={{ color: "#64748b", fontSize: 14 }}>
            No data yet. Make sure the{" "}
            <code style={{ color: "#3ECF8E" }}>page_views</code> table exists in Supabase.
          </p>
        )}

        {loading && !s && (
          <div style={{ display: "flex", justifyContent: "center", paddingTop: 80 }}>
            <div
              style={{
                width: 40,
                height: 40,
                border: "3px solid rgba(62,207,142,0.3)",
                borderTopColor: "#3ECF8E",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
              }}
            />
          </div>
        )}

        {s && (
          <>
            {/* KPI Row */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: 16,
                marginBottom: 28,
              }}
            >
              <KpiCard
                icon="👁️"
                label="Page Views (30d)"
                value={s.totalPageViews30d}
                sub={`${s.totalPageViewsToday.toLocaleString()} today`}
                sparkData={s.pageViewsByDay}
                color="#3ECF8E"
              />
              <KpiCard
                icon="🖥️"
                label="Unique Sessions"
                value={s.uniqueSessions30d}
                sub="30-day window"
                color="#3ECF8E"
              />
              <KpiCard
                icon="⚡"
                label="Quotes Built (30d)"
                value={s.totalQuotes30d}
                sub={`${s.totalQuotesToday.toLocaleString()} today`}
                sparkData={s.quotesByDay}
                color="#60a5fa"
              />
              <KpiCard
                icon="👤"
                label="Sign-ups (30d)"
                value={s.totalSignups30d}
                sub={`${s.totalSignupsToday.toLocaleString()} today`}
                sparkData={s.signupsByDay}
                color="#a78bfa"
              />
              <KpiCard
                icon="📬"
                label="Leads (30d)"
                value={s.totalLeads30d}
                sub={`${s.totalLeadsToday.toLocaleString()} today`}
                color="#F59E0B"
              />
              <KpiCard
                icon="🔗"
                label="Shares (30d)"
                value={s.totalShares30d}
                sub="Shared quotes"
                color="#f472b6"
              />
            </div>

            {/* Trend chart */}
            <Card title="30-Day Trend" style={{ marginBottom: 28 }}>
              <TrendChart
                views={s.pageViewsByDay}
                quotes={s.quotesByDay}
                signups={s.signupsByDay}
              />
            </Card>

            {/* Conversion funnel */}
            <Card title="Conversion Funnel (30d)" style={{ marginBottom: 28 }}>
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  alignItems: "flex-end",
                  justifyContent: "center",
                  flexWrap: "wrap",
                }}
              >
                {funnelSteps.map((step) => (
                  <FunnelStep key={step.label} {...step} />
                ))}
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 24,
                  marginTop: 20,
                  paddingTop: 16,
                  borderTop: "1px solid rgba(255,255,255,0.06)",
                  flexWrap: "wrap",
                }}
              >
                {funnelSteps.slice(1).map((step) => {
                  const prev = funnelSteps[funnelSteps.indexOf(step) - 1];
                  const rate = prev.value > 0 ? ((step.value / prev.value) * 100).toFixed(1) : "0.0";
                  return (
                    <div key={step.label} style={{ fontSize: 12, color: "#64748b" }}>
                      Views → {step.label}:{" "}
                      <span style={{ color: step.color, fontWeight: 600 }}>
                        {((step.value / Math.max(funnelSteps[0].value, 1)) * 100).toFixed(2)}%
                      </span>
                      <span style={{ color: "#334155", marginLeft: 8 }}>
                        (prev step: {rate}%)
                      </span>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Top pages + Top industries */}
            <div
              style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 28 }}
            >
              <Card title="Top Pages (30d)">
                <TopList items={s.topPages} color="#3ECF8E" emptyMsg="No page view data yet." />
              </Card>
              <Card title="Top Industries (quotes)">
                <TopList items={s.topIndustries} color="#60a5fa" emptyMsg="No quote data yet." />
              </Card>
            </div>

            {/* Recent sign-ups + Recent leads */}
            <div
              style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
            >
              <Card title="Recent Sign-ups">
                {s.recentSignups.length === 0 ? (
                  <p style={{ fontSize: 13, color: "#475569" }}>No sign-ups yet.</p>
                ) : (
                  s.recentSignups.map((u) => (
                    <RecentRow
                      key={`${u.email}-${u.created_at}`}
                      icon="👤"
                      primary={u.email}
                      time={u.created_at}
                    />
                  ))
                )}
              </Card>
              <Card title="Recent Leads">
                {s.recentLeads.length === 0 ? (
                  <p style={{ fontSize: 13, color: "#475569" }}>No leads yet.</p>
                ) : (
                  s.recentLeads.map((l) => (
                    <RecentRow
                      key={`${l.email}-${l.created_at}`}
                      icon="📬"
                      primary={l.email}
                      secondary={l.industry ?? undefined}
                      time={l.created_at}
                    />
                  ))
                )}
              </Card>
            </div>
          </>
        )}
      </div>

      {/* Spinner keyframes */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
