import React, { useEffect, useState } from "react";
import { TrendingUp, Users, FileText, Eye, RefreshCw } from "lucide-react";
import { supabase } from "@/services/supabaseClient";

interface LiveStats {
  totalSignups: number;
  totalLeads: number;
  savedQuotes: number;
  pageViews: number;
  leadsThisMonth: number;
  signupsThisMonth: number;
  lastUpdated: Date | null;
  loading: boolean;
  error: string | null;
}

function StatRow({
  label,
  value,
  loading,
  highlight,
}: {
  label: string;
  value: string | number;
  loading: boolean;
  highlight?: boolean;
}) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-white/60">{label}</span>
      {loading ? (
        <div className="h-4 w-12 bg-white/10 rounded animate-pulse" />
      ) : (
        <span className={`font-bold ${highlight ? "text-emerald-400" : "text-white"}`}>
          {value}
        </span>
      )}
    </div>
  );
}

export default function AdminAnalyticsTab() {
  const [stats, setStats] = useState<LiveStats>({
    totalSignups: 0,
    totalLeads: 0,
    savedQuotes: 0,
    pageViews: 0,
    leadsThisMonth: 0,
    signupsThisMonth: 0,
    lastUpdated: null,
    loading: true,
    error: null,
  });

  const fetchStats = async () => {
    setStats((s) => ({ ...s, loading: true, error: null }));
    try {
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      const monthStartISO = monthStart.toISOString();

      const q = (table: string, extra?: (b: any) => any) => {
        let b = (supabase as any).from(table).select("*", { count: "exact", head: true });
        if (extra) b = extra(b);
        return b as Promise<{ count: number | null }>;
      };

      const [
        { count: totalSignups },
        { count: totalLeads },
        { count: savedQuotes },
        { count: pageViews },
        { count: leadsThisMonth },
        { count: signupsThisMonth },
      ] = await Promise.all([
        q("user_profiles"),
        q("leads"),
        q("saved_quotes"),
        q("page_views"),
        q("leads", (b) => b.gte("created_at", monthStartISO)),
        q("user_profiles", (b) => b.gte("created_at", monthStartISO)),
      ]);

      setStats({
        totalSignups: totalSignups ?? 0,
        totalLeads: totalLeads ?? 0,
        savedQuotes: savedQuotes ?? 0,
        pageViews: pageViews ?? 0,
        leadsThisMonth: leadsThisMonth ?? 0,
        signupsThisMonth: signupsThisMonth ?? 0,
        lastUpdated: new Date(),
        loading: false,
        error: null,
      });
    } catch (err) {
      setStats((s) => ({
        ...s,
        loading: false,
        error: err instanceof Error ? err.message : "Failed to load stats",
      }));
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const conversionRate =
    stats.pageViews > 0 ? ((stats.totalLeads / stats.pageViews) * 100).toFixed(1) + "%" : "—";

  return (
    <>
      <div className="space-y-6">
        {/* Section Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/10">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Site Analytics</h2>
              {stats.lastUpdated && (
                <p className="text-xs text-white/30 mt-0.5">
                  Live · updated {stats.lastUpdated.toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={fetchStats}
            disabled={stats.loading}
            className="flex items-center gap-2 px-3 py-1.5 text-xs text-white/50 hover:text-white/80 border border-white/10 hover:border-white/20 rounded-lg transition-all"
          >
            <RefreshCw className={`w-3 h-3 ${stats.loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {stats.error && (
          <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
            ⚠ {stats.error}
          </div>
        )}

        {/* Live Metrics */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Signups */}
          <div className="bg-white/[0.03] backdrop-blur-sm p-6 rounded-2xl border border-white/[0.08] shadow-lg">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" />
              Signups
            </h3>
            <div className="space-y-3">
              <StatRow
                label="Total Signups"
                value={stats.totalSignups}
                loading={stats.loading}
                highlight
              />
              <StatRow label="This Month" value={stats.signupsThisMonth} loading={stats.loading} />
              <StatRow
                label="Activation Rate"
                value={
                  stats.totalSignups > 0
                    ? Math.round((stats.signupsThisMonth / stats.totalSignups) * 100) + "%"
                    : "—"
                }
                loading={stats.loading}
              />
            </div>
          </div>

          {/* Leads & Quotes */}
          <div className="bg-white/[0.03] backdrop-blur-sm p-6 rounded-2xl border border-emerald-500/20 shadow-lg">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-400" />
              Leads &amp; Quotes
            </h3>
            <div className="space-y-3">
              <StatRow
                label="Total Leads"
                value={stats.totalLeads}
                loading={stats.loading}
                highlight
              />
              <StatRow
                label="Leads This Month"
                value={stats.leadsThisMonth}
                loading={stats.loading}
              />
              <StatRow label="Saved Quotes" value={stats.savedQuotes} loading={stats.loading} />
            </div>
          </div>

          {/* Traffic */}
          <div className="bg-white/[0.03] backdrop-blur-sm p-6 rounded-2xl border border-white/[0.08] shadow-lg">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Eye className="w-5 h-5 text-sky-400" />
              Traffic
            </h3>
            <div className="space-y-3">
              <StatRow
                label="Total Page Views"
                value={stats.pageViews.toLocaleString()}
                loading={stats.loading}
                highlight
              />
              <StatRow label="Lead Conversion" value={conversionRate} loading={stats.loading} />
              <StatRow
                label="Leads per Signup"
                value={
                  stats.totalSignups > 0 ? (stats.totalLeads / stats.totalSignups).toFixed(1) : "—"
                }
                loading={stats.loading}
              />
            </div>
          </div>
        </div>

        {/* Note */}
        <p className="text-xs text-white/20 text-right">
          Data sourced live from Supabase · user_profiles · leads · saved_quotes · page_views
        </p>
      </div>
    </>
  );
}
