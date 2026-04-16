/* Merlin Energy — Two-Sided Market Section
   Answers the question every first-time visitor asks: "Who is this for?"
   Two clear paths: Energy Buyers (free TrueQuote) + EPCs / Vendors (lead gen + ProQuote).
   Placement: between StatusQuoSection and IndustriesSection. */

import { ArrowRight, Building2, HardHat, CheckCircle2 } from "lucide-react";

const BUYER_ITEMS = [
  "Free, no account required",
  "Understand your project before talking to any vendor",
  "Live utility rates + NREL solar data for your location",
  "EPC-ready project model you can actually act on",
];

const EPC_ITEMS = [
  "Receive pre-scoped, qualified project leads",
  "Build branded proposals in minutes, not weeks",
  "Respond to RFPs with your own product specs and pricing",
  "Lower customer acquisition cost — buyers come ready",
];

export default function TwoSidedSection() {
  return (
    <section className="bg-[#060D1F] py-16 border-b border-white/[0.05]">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        {/* Eyebrow */}
        <div className="flex items-center gap-3 mb-10">
          <div className="w-5 h-px bg-emerald-500/40" />
          <span
            className="text-[10px] text-emerald-400/60 uppercase tracking-[0.25em] font-semibold"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            Who Merlin is for
          </span>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* ── Card 1: Energy Buyers ── */}
          <div className="rounded-2xl border border-emerald-500/20 bg-[#080F1E] overflow-hidden">
            <div className="h-[3px] w-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-transparent" />
            <div className="p-8">
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6 text-xs font-semibold"
                style={{
                  background: "rgba(62,207,142,0.08)",
                  border: "1px solid rgba(62,207,142,0.20)",
                  color: "#3ECF8E",
                }}
              >
                <Building2 size={13} />
                For Facility Owners &amp; Operators
              </div>

              <h3
                className="text-2xl font-extrabold text-white mb-3 leading-tight"
                style={{ fontFamily: "'Nunito', sans-serif" }}
              >
                Understand your project before you call a single vendor.
              </h3>
              <p
                className="text-slate-400 text-sm leading-relaxed mb-6"
                style={{ fontFamily: "'Nunito Sans', sans-serif" }}
              >
                TrueQuote™ gives facility operators, CFOs, and project managers a complete,
                independent energy project model — solar, storage, generators, EV charging — sized
                to your actual location, load profile, and utility rate. Free. No signup. In about
                90 seconds.
              </p>

              <ul className="space-y-2.5 mb-8">
                {BUYER_ITEMS.map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <CheckCircle2 size={14} className="text-emerald-400/70 mt-0.5 flex-shrink-0" />
                    <span
                      className="text-slate-300 text-sm"
                      style={{ fontFamily: "'Nunito Sans', sans-serif" }}
                    >
                      {item}
                    </span>
                  </li>
                ))}
              </ul>

              <a
                href="/wizard"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all duration-200 hover:scale-[1.02]"
                style={{
                  background: "rgba(62,207,142,0.12)",
                  border: "1px solid rgba(62,207,142,0.30)",
                  color: "#3ECF8E",
                }}
              >
                Get your free TrueQuote™
                <ArrowRight size={15} />
              </a>
            </div>
          </div>

          {/* ── Card 2: EPCs & Vendors ── */}
          <div className="rounded-2xl border border-sky-500/20 bg-[#080F1E] overflow-hidden">
            <div className="h-[3px] w-full bg-gradient-to-r from-sky-500 via-sky-400 to-transparent" />
            <div className="p-8">
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6 text-xs font-semibold"
                style={{
                  background: "rgba(56,189,248,0.08)",
                  border: "1px solid rgba(56,189,248,0.20)",
                  color: "#38bdf8",
                }}
              >
                <HardHat size={13} />
                For EPCs, Developers &amp; Vendors
              </div>

              <h3
                className="text-2xl font-extrabold text-white mb-3 leading-tight"
                style={{ fontFamily: "'Nunito', sans-serif" }}
              >
                Receive pre-scoped leads. Build proposals in minutes, not weeks.
              </h3>
              <p
                className="text-slate-400 text-sm leading-relaxed mb-6"
                style={{ fontFamily: "'Nunito Sans', sans-serif" }}
              >
                Every buyer who completes a TrueQuote™ generates a structured project brief —
                location, industry, load profile, preferred scope, and budget range. Merlin routes
                those briefs to matched EPC partners. You respond with your specs, pricing, and
                timeline — directly inside the platform.
              </p>

              <ul className="space-y-2.5 mb-8">
                {EPC_ITEMS.map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <CheckCircle2 size={14} className="text-sky-400/70 mt-0.5 flex-shrink-0" />
                    <span
                      className="text-slate-300 text-sm"
                      style={{ fontFamily: "'Nunito Sans', sans-serif" }}
                    >
                      {item}
                    </span>
                  </li>
                ))}
              </ul>

              <a
                href="/vendor"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all duration-200 hover:scale-[1.02]"
                style={{
                  background: "rgba(56,189,248,0.08)",
                  border: "1px solid rgba(56,189,248,0.25)",
                  color: "#38bdf8",
                }}
              >
                EPC &amp; Vendor Portal
                <ArrowRight size={15} />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom note: honest about the AI enrollment approach */}
        <div className="mt-6 flex items-start gap-3 px-5 py-4 rounded-xl border border-white/[0.05] bg-white/[0.02]">
          <span
            className="text-[10px] font-bold uppercase tracking-widest text-slate-600 flex-shrink-0 mt-0.5"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            How it works
          </span>
          <p
            className="text-slate-500 text-xs leading-relaxed"
            style={{ fontFamily: "'Nunito Sans', sans-serif" }}
          >
            Merlin is free for buyers — always. EPC and vendor partners pay a subscription for
            access to the lead pipeline and ProQuote tooling. The model only works if the buyer side
            is genuinely useful and unbiased, so we keep TrueQuote™ completely independent of which
            vendors are in the network.
          </p>
        </div>
      </div>
    </section>
  );
}
