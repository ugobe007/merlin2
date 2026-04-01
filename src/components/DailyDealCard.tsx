/* Merlin Energy — Daily Deal Card
   Shows today's featured industry BESS deal, sourced from Supabase daily_deals table.
   Designed to live between HeroSection and ProductsSection on the homepage.
   Design: matches Cosmic Blueprint — dark navy, cyan/blue accents, Space Grotesk */

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Zap, TrendingUp, DollarSign, Clock, ChevronRight, Sparkles } from "lucide-react";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface DailyDeal {
  id: number;
  deal_date: string;
  industry_id: string;
  industry_label: string;
  system_size_mw: number;
  duration_hours: number;
  zip_code: string;
  gross_cost_dollars: number;
  net_cost_dollars: number;
  annual_savings: number;
  payback_years: number;
  npv_25yr: number;
  irr: number | null;
  tagline: string | null;
  market_hook: string | null;
  discord_message_id: string | null;
}

const INDUSTRY_EMOJI: Record<string, string> = {
  "car-wash": "🚗",
  hotel: "🏨",
  "data-center": "🖥️",
  hospital: "🏥",
  manufacturing: "🏭",
  restaurant: "🍔",
  grocery: "🛒",
  office: "🏢",
  "ev-charging": "⚡",
  warehouse: "📦",
  school: "🎓",
  cannabis: "🌿",
  "fitness-center": "💪",
  "cold-storage": "🧊",
  brewery: "🍺",
  laundry: "👕",
  parking: "🅿️",
  retail: "🛍️",
};

function fmt(n: number, style: "currency" | "decimal" = "currency", decimals = 0) {
  if (style === "currency") {
    if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
    return `$${n.toFixed(decimals)}`;
  }
  return n.toFixed(decimals);
}

function MetricPill({
  icon: Icon,
  label,
  value,
  accent = false,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center gap-1 px-4 py-3 rounded-xl border ${
        accent ? "bg-cyan-500/10 border-cyan-500/30" : "bg-white/[0.04] border-white/[0.08]"
      }`}
    >
      <Icon size={15} className={accent ? "text-cyan-400" : "text-slate-400"} />
      <span
        className="text-[10px] uppercase tracking-widest text-slate-500"
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >
        {label}
      </span>
      <span
        className={`text-sm font-bold ${accent ? "text-cyan-300" : "text-white"}`}
        style={{ fontFamily: "'Outfit', sans-serif" }}
      >
        {value}
      </span>
    </div>
  );
}

export default function DailyDealCard() {
  const [deal, setDeal] = useState<DailyDeal | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDeal() {
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("daily_deals")
        .select("*")
        .eq("deal_date", today)
        .order("id", { ascending: false })
        .limit(1)
        .single();

      if (!error && data) setDeal(data as DailyDeal);
      setLoading(false);
    }
    fetchDeal();
  }, []);

  // Don't render anything if no deal exists yet
  if (loading || !deal) return null;

  const emoji = INDUSTRY_EMOJI[deal.industry_id] ?? "⚡";
  const itcSavings = deal.gross_cost_dollars - deal.net_cost_dollars;

  return (
    <section className="relative py-8 px-4 sm:px-6 lg:px-8 xl:px-12 overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[200px] bg-cyan-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-screen-xl mx-auto">
        {/* Deal card */}
        <div className="rounded-2xl border border-cyan-500/20 bg-[#080F22]/80 backdrop-blur-sm overflow-hidden">
          {/* Top ribbon */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-white/[0.06] bg-cyan-500/5">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-cyan-400" />
              <span
                className="text-xs uppercase tracking-[0.18em] text-cyan-400 font-semibold"
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                Today's Featured Deal ·{" "}
                {new Date(deal.deal_date + "T12:00:00").toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
            <span
              className="text-xs text-slate-600"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              TrueQuote™ powered
            </span>
          </div>

          <div className="px-6 py-6 sm:px-8 sm:py-7 grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6 lg:gap-10 items-center">
            {/* Left — identity + hook */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl" role="img" aria-label={deal.industry_label}>
                  {emoji}
                </span>
                <div>
                  <h3
                    className="text-xl font-bold text-white leading-tight"
                    style={{ fontFamily: "'Outfit', sans-serif" }}
                  >
                    {deal.industry_label}
                  </h3>
                  {deal.tagline && (
                    <p
                      className="text-sm text-cyan-300/80 mt-0.5"
                      style={{ fontFamily: "'DM Sans', sans-serif" }}
                    >
                      {deal.tagline}
                    </p>
                  )}
                </div>
              </div>

              {deal.market_hook && (
                <p
                  className="text-slate-400 text-sm leading-relaxed max-w-xl"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  {deal.market_hook}
                </p>
              )}

              {/* System spec pill row */}
              <div className="flex flex-wrap gap-2 mt-4">
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs text-slate-300"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  <Zap size={11} className="text-cyan-400" />
                  {deal.system_size_mw} MW · {deal.duration_hours}h
                </span>
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs text-slate-300"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  <DollarSign size={11} className="text-cyan-400" />
                  {fmt(itcSavings)} ITC credit
                </span>
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs text-slate-300"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  ZIP {deal.zip_code}
                </span>
              </div>
            </div>

            {/* Right — key metrics grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-3 lg:min-w-[400px]">
              <MetricPill
                icon={DollarSign}
                label="Net Cost"
                value={fmt(deal.net_cost_dollars)}
                accent
              />
              <MetricPill
                icon={TrendingUp}
                label="Annual Savings"
                value={fmt(deal.annual_savings)}
              />
              <MetricPill icon={Clock} label="Payback" value={`${deal.payback_years}yr`} />
              <MetricPill icon={TrendingUp} label="25yr NPV" value={fmt(deal.npv_25yr)} />
            </div>
          </div>

          {/* Bottom CTA bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 sm:px-8 py-4 border-t border-white/[0.06] bg-white/[0.02]">
            <p
              className="text-xs text-slate-500 text-center sm:text-left"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              New industry featured daily. Calculations use live utility rate data via NREL + DOE
              frameworks.
            </p>
            <a
              href="/wizard"
              className="flex-shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-[#060D1F] text-sm font-semibold transition-colors"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              Run your TrueQuote™
              <ChevronRight size={15} />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
