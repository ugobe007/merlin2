// @ts-nocheck — page_views / users / shared_quotes tables not yet in generated
// database.types.ts; suppressing TS errors until migration is run and types regenerated.
/**
 * Analytics Service — Merlin Energy
 * ====================================
 * Tracks page views and queries all key business metrics.
 */

import { supabase } from "@/services/supabaseClient";

const db = supabase as any;

// ── Session ID ────────────────────────────────────────────────────────────────
// localStorage → persists across tabs/refreshes in the same browser.
// A new session starts only after 30 min of inactivity.
const SESSION_TTL_MS = 30 * 60 * 1000;

function getSessionId(): string {
  const key = "merlin_session_id";
  const tsKey = "merlin_session_ts";
  const now = Date.now();
  const lastTs = parseInt(localStorage.getItem(tsKey) ?? "0", 10);
  const existing = localStorage.getItem(key);

  if (!existing || now - lastTs > SESSION_TTL_MS) {
    const id = `${now}-${Math.random().toString(36).slice(2, 9)}`;
    localStorage.setItem(key, id);
    localStorage.setItem(tsKey, String(now));
    return id;
  }

  localStorage.setItem(tsKey, String(now));
  return existing;
}

// ── Track a page view ─────────────────────────────────────────────────────────
export async function trackPageView(path: string): Promise<void> {
  try {
    await db.from("page_views").insert({
      path,
      session_id: getSessionId(),
      referrer: document.referrer || null,
    });
  } catch {
    // Non-blocking — never throw for analytics
  }
}

// ── Types ─────────────────────────────────────────────────────────────────────
export interface DailyCount {
  date: string; // "YYYY-MM-DD"
  count: number;
}

export interface TopItem {
  label: string;
  count: number;
}

export interface DashboardStats {
  // Totals
  totalPageViews30d: number;
  totalPageViewsToday: number;
  uniqueSessions30d: number;
  totalQuotes30d: number;
  totalQuotesToday: number;
  totalSignups30d: number;
  totalSignupsToday: number;
  totalLeads30d: number;
  totalLeadsToday: number;
  totalShares30d: number;
  // Trends (last 30 days, one point per day)
  pageViewsByDay: DailyCount[];
  quotesByDay: DailyCount[];
  signupsByDay: DailyCount[];
  // Breakdowns
  topPages: TopItem[];
  topIndustries: TopItem[];
  // Recent
  recentSignups: { email: string; created_at: string }[];
  recentLeads: { email: string; industry: string | null; created_at: string }[];
}

// ── Helper: build a 30-day date spine ─────────────────────────────────────────
function dateSeries(days = 30): string[] {
  return Array.from({ length: days }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    return d.toISOString().slice(0, 10);
  });
}

function mergeWithSpine(spine: string[], rows: { date: string; count: number }[]): DailyCount[] {
  const map = Object.fromEntries(rows.map((r) => [r.date, r.count]));
  return spine.map((date) => ({ date, count: map[date] ?? 0 }));
}

// ── Safe wrapper: converts any PromiseLike to a real Promise with fallback ────
// Supabase builders are PromiseLike but NOT Promises — they have no .catch().
// Promise.resolve() coerces them into real Promises.
async function q<T>(query: PromiseLike<T>, fallback: T): Promise<T> {
  return Promise.resolve(query).catch(() => fallback);
}

// ── Main dashboard query ───────────────────────────────────────────────────────
export async function getDashboardStats(): Promise<DashboardStats> {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const ago30 = new Date(now.getTime() - 30 * 86400_000).toISOString();
  const spine = dateSeries(30);

  const EMPTY_COUNT = { data: null, count: 0, error: null };
  const EMPTY_DATA = { data: [], count: null, error: null };

  // ── page_views (new table — may not exist yet) ───────────────────────────
  const [pvAll, pvToday, pvSessions, pvRaw] = await Promise.all([
    q(
      db.from("page_views").select("id", { count: "exact", head: true }).gte("created_at", ago30),
      EMPTY_COUNT
    ),
    q(
      db
        .from("page_views")
        .select("id", { count: "exact", head: true })
        .gte("created_at", `${today}T00:00:00`),
      EMPTY_COUNT
    ),
    q(db.from("page_views").select("session_id").gte("created_at", ago30), EMPTY_DATA),
    q(db.from("page_views").select("path, created_at").gte("created_at", ago30), EMPTY_DATA),
  ]);

  const sessionSet = new Set<string>(
    ((pvSessions.data ?? []) as { session_id: string | null }[])
      .map((r) => r.session_id)
      .filter(Boolean) as string[]
  );
  const pvRows = (pvRaw.data ?? []) as { path: string; created_at: string }[];

  // bucket page views by day
  const pvDayMap: Record<string, number> = {};
  for (const r of pvRows) {
    const d = r.created_at.slice(0, 10);
    pvDayMap[d] = (pvDayMap[d] ?? 0) + 1;
  }
  const pageViewsByDay = spine.map((date) => ({ date, count: pvDayMap[date] ?? 0 }));

  // top pages
  const pageCount: Record<string, number> = {};
  for (const r of pvRows) pageCount[r.path] = (pageCount[r.path] ?? 0) + 1;
  const topPages: TopItem[] = Object.entries(pageCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([label, count]) => ({ label, count }));

  // ── saved_quotes ─────────────────────────────────────────────────────────
  const [quotesAll, quotesToday, quotesRaw] = await Promise.all([
    q(
      supabase
        .from("saved_quotes")
        .select("id", { count: "exact", head: true })
        .gte("created_at", ago30),
      EMPTY_COUNT
    ),
    q(
      supabase
        .from("saved_quotes")
        .select("id", { count: "exact", head: true })
        .gte("created_at", `${today}T00:00:00`),
      EMPTY_COUNT
    ),
    q(
      supabase.from("saved_quotes").select("created_at, use_case").gte("created_at", ago30),
      EMPTY_DATA
    ),
  ]);

  const quotesRows = (quotesRaw.data ?? []) as { created_at: string; use_case: string | null }[];
  const qDayMap: Record<string, number> = {};
  for (const r of quotesRows) {
    const d = r.created_at.slice(0, 10);
    qDayMap[d] = (qDayMap[d] ?? 0) + 1;
  }
  const quotesByDay = spine.map((date) => ({ date, count: qDayMap[date] ?? 0 }));

  const industryCount: Record<string, number> = {};
  for (const r of quotesRows) {
    const key = r.use_case ?? "unknown";
    industryCount[key] = (industryCount[key] ?? 0) + 1;
  }
  const topIndustries: TopItem[] = Object.entries(industryCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([label, count]) => ({ label, count }));

  // ── users ────────────────────────────────────────────────────────────────
  const [signupsAll, signupsToday, signupsRaw, recentSignupsRaw] = await Promise.all([
    q(
      db.from("users").select("id", { count: "exact", head: true }).gte("created_at", ago30),
      EMPTY_COUNT
    ),
    q(
      db
        .from("users")
        .select("id", { count: "exact", head: true })
        .gte("created_at", `${today}T00:00:00`),
      EMPTY_COUNT
    ),
    q(db.from("users").select("created_at").gte("created_at", ago30), EMPTY_DATA),
    q(
      db
        .from("users")
        .select("email, created_at")
        .order("created_at", { ascending: false })
        .limit(8),
      EMPTY_DATA
    ),
  ]);

  const sDayMap: Record<string, number> = {};
  for (const r of (signupsRaw.data ?? []) as { created_at: string }[]) {
    const d = r.created_at.slice(0, 10);
    sDayMap[d] = (sDayMap[d] ?? 0) + 1;
  }
  const signupsByDay = spine.map((date) => ({ date, count: sDayMap[date] ?? 0 }));

  // ── leads ────────────────────────────────────────────────────────────────
  const [leadsAll, leadsToday, recentLeadsRaw] = await Promise.all([
    q(
      supabase.from("leads").select("id", { count: "exact", head: true }).gte("created_at", ago30),
      EMPTY_COUNT
    ),
    q(
      supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .gte("created_at", `${today}T00:00:00`),
      EMPTY_COUNT
    ),
    q(
      supabase
        .from("leads")
        .select("email, industry, created_at")
        .order("created_at", { ascending: false })
        .limit(8),
      EMPTY_DATA
    ),
  ]);

  // ── shared_quotes ────────────────────────────────────────────────────────
  const sharesAll = await q(
    db.from("shared_quotes").select("id", { count: "exact", head: true }).gte("created_at", ago30),
    EMPTY_COUNT
  );

  return {
    totalPageViews30d: (pvAll as any).count ?? 0,
    totalPageViewsToday: (pvToday as any).count ?? 0,
    uniqueSessions30d: sessionSet.size,
    totalQuotes30d: (quotesAll as any).count ?? 0,
    totalQuotesToday: (quotesToday as any).count ?? 0,
    totalSignups30d: (signupsAll as any).count ?? 0,
    totalSignupsToday: (signupsToday as any).count ?? 0,
    totalLeads30d: (leadsAll as any).count ?? 0,
    totalLeadsToday: (leadsToday as any).count ?? 0,
    totalShares30d: (sharesAll as any).count ?? 0,
    pageViewsByDay,
    quotesByDay,
    signupsByDay,
    topPages,
    topIndustries,
    recentSignups: (recentSignupsRaw.data ?? []) as { email: string; created_at: string }[],
    recentLeads: (recentLeadsRaw.data ?? []) as {
      email: string;
      industry: string | null;
      created_at: string;
    }[],
  };
}

export const analyticsService = { trackPageView, getDashboardStats };
