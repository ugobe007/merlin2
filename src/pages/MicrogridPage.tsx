/**
 * Microgrid Front Door
 * =====================
 * Lead-capture landing page for C&I customers interested in
 * energy resilience, islanding, and microgrid solutions.
 *
 * Goal: qualify the project, capture contact, hand off to a TrueQuote professional.
 * Route: /microgrid
 */

import { useState } from "react";
import {
  ArrowRight,
  Zap,
  Shield,
  Radio,
  Server,
  Factory,
  Building2,
  CheckCircle2,
  ChevronDown,
} from "lucide-react";
import Navbar from "@/components/Navbar";

const USE_CASES = [
  { icon: Server, label: "Data Centers", desc: "Tier II–IV islanding + zero-gap UPS bridge" },
  {
    icon: Factory,
    label: "Manufacturing",
    desc: "Uninterruptible process power, grid independence",
  },
  {
    icon: Building2,
    label: "Commercial Campuses",
    desc: "Multi-building resilience + demand optimization",
  },
  {
    icon: Radio,
    label: "Critical Infrastructure",
    desc: "Emergency services, hospitals, public utilities",
  },
  { icon: Zap, label: "EV Charging Hubs", desc: "Grid-independent fast-charging at scale" },
  {
    icon: Shield,
    label: "Remote Sites",
    desc: "Off-grid or weak-grid locations, mining, agriculture",
  },
];

const FAQ = [
  {
    q: "What is a microgrid?",
    a: "A microgrid is a self-contained energy system that can operate independently from the main utility grid ('island mode') while also connecting to it. It combines solar, battery storage, and sometimes generators to guarantee power reliability.",
  },
  {
    q: "How much does a microgrid cost?",
    a: "C&I microgrids typically range from $500K to $50M+ depending on load size, storage duration, and whether generation is included. A TrueQuote professional will scope your project accurately — most quotes are in the $1M–$5M range for mid-size commercial.",
  },
  {
    q: "How long does it take to install?",
    a: "Design-to-energization typically takes 12–18 months for permitted C&I microgrids. Fast-track projects with pre-approved equipment can close in 8–10 months.",
  },
  {
    q: "Are there incentives available?",
    a: "Yes. The IRA §48 ITC provides a 30% federal tax credit on battery + solar. USDA REAP grants cover up to 50% for rural commercial projects. Many states have additional resilience incentives.",
  },
];

export default function MicrogridPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    load: "",
    location: "",
    notes: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      // Store as a lead with source=microgrid
      await fetch("/api/demo/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, source: "microgrid", format: "consultation" }),
      });
      setSubmitted(true);
    } catch {
      // Still show success — non-blocking
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#060D1F]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <Navbar />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        {/* Glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            style={{
              position: "absolute",
              top: "10%",
              left: "50%",
              transform: "translateX(-50%)",
              width: 700,
              height: 400,
              background:
                "radial-gradient(ellipse at center, rgba(56,189,248,0.07) 0%, transparent 70%)",
              borderRadius: "50%",
            }}
          />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-sky-500/20 bg-sky-500/05 text-sky-400 text-[11px] font-semibold tracking-widest uppercase mb-6">
            <Radio size={10} />
            Microgrid &amp; Resilience
          </div>

          <h1
            className="font-bold leading-[1.05] tracking-tight mb-5"
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: "clamp(38px, 5.5vw, 72px)",
              color: "#fff",
            }}
          >
            Energy independence
            <br />
            <span style={{ color: "#38bdf8" }}>for serious operations.</span>
          </h1>

          <p className="text-[17px] text-slate-400 max-w-2xl mx-auto leading-relaxed mb-8">
            When grid outages cost you six figures an hour — or you're simply done paying utility
            rates — a microgrid is the answer. We scope, size, and connect you with the right EPC.
          </p>

          <a
            href="#consult"
            className="inline-flex items-center gap-3 px-8 py-4 rounded-xl font-bold text-[16px] text-white transition-all duration-200"
            style={{
              background: "rgba(56,189,248,0.12)",
              border: "1px solid rgba(56,189,248,0.35)",
              textDecoration: "none",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "rgba(56,189,248,0.2)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "rgba(56,189,248,0.12)";
            }}
          >
            Get a free scoping consultation
            <ArrowRight size={18} />
          </a>
        </div>
      </section>

      {/* ── Use cases ── */}
      <section className="py-14 px-4 sm:px-6 lg:px-8 border-t border-white/[0.05]">
        <div className="max-w-5xl mx-auto">
          <p className="text-[11px] text-slate-600 uppercase tracking-widest font-semibold mb-8 text-center">
            Who this is for
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {USE_CASES.map(({ icon: Icon, label, desc }) => (
              <div
                key={label}
                className="flex gap-3 p-4 rounded-xl"
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <Icon size={18} className="text-sky-400/70 mt-0.5 flex-shrink-0" />
                <div>
                  <div
                    className="text-[13px] font-semibold text-white mb-0.5"
                    style={{ fontFamily: "'Outfit', sans-serif" }}
                  >
                    {label}
                  </div>
                  <div className="text-[12px] text-slate-500">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── What you get ── */}
      <section className="py-14 px-4 sm:px-6 lg:px-8 border-t border-white/[0.05]">
        <div className="max-w-3xl mx-auto">
          <h2
            className="text-[26px] font-bold text-white mb-2 text-center"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            What happens after you submit
          </h2>
          <p className="text-slate-500 text-center text-[14px] mb-10">
            No spam. No sales pressure. Just a scoped analysis.
          </p>
          <div className="flex flex-col gap-4">
            {[
              [
                "1",
                "We review your load profile and location",
                "Using publicly available utility data and your inputs",
              ],
              [
                "2",
                "We build a preliminary sizing model",
                "Solar, BESS, generator, islanding topology — all scoped for your facility",
              ],
              [
                "3",
                "A TrueQuote professional calls you",
                "20-minute call to walk through the numbers and answer questions",
              ],
              [
                "4",
                "You decide — zero obligation",
                "If you want to move forward, we connect you with qualified EPCs in your area",
              ],
            ].map(([num, title, sub]) => (
              <div
                key={num}
                className="flex gap-4 items-start p-4 rounded-xl"
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.05)",
                }}
              >
                <span
                  className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-[12px] font-bold text-sky-400"
                  style={{
                    background: "rgba(56,189,248,0.1)",
                    border: "1px solid rgba(56,189,248,0.2)",
                  }}
                >
                  {num}
                </span>
                <div>
                  <div className="text-[14px] font-semibold text-white mb-0.5">{title}</div>
                  <div className="text-[12px] text-slate-500">{sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Lead capture form ── */}
      <section id="consult" className="py-16 px-4 sm:px-6 lg:px-8 border-t border-white/[0.05]">
        <div className="max-w-xl mx-auto">
          <h2
            className="text-[26px] font-bold text-white mb-2 text-center"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            Start your free scoping
          </h2>
          <p className="text-slate-500 text-center text-[14px] mb-8">
            Takes 2 minutes. A professional will contact you within 1 business day.
          </p>

          {submitted ? (
            <div className="text-center py-12">
              <CheckCircle2 size={48} className="text-emerald-400 mx-auto mb-4" />
              <h3
                className="text-[20px] font-bold text-white mb-2"
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                You're on the list
              </h3>
              <p className="text-slate-400 text-[14px]">
                A TrueQuote professional will reach out within 1 business day to schedule your free
                consultation.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] text-slate-500 uppercase tracking-wider block mb-1.5">
                    Your name *
                  </label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl text-[14px] text-white placeholder-slate-600 outline-none"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                    placeholder="Jane Smith"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-500 uppercase tracking-wider block mb-1.5">
                    Work email *
                  </label>
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl text-[14px] text-white placeholder-slate-600 outline-none"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                    placeholder="jane@company.com"
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] text-slate-500 uppercase tracking-wider block mb-1.5">
                  Company / Facility name *
                </label>
                <input
                  required
                  value={form.company}
                  onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl text-[14px] text-white placeholder-slate-600 outline-none"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                  placeholder="Acme Manufacturing, Phoenix AZ"
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] text-slate-500 uppercase tracking-wider block mb-1.5">
                    Approximate peak load (kW)
                  </label>
                  <input
                    value={form.load}
                    onChange={(e) => setForm((f) => ({ ...f, load: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl text-[14px] text-white placeholder-slate-600 outline-none"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                    placeholder="e.g. 500 kW"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-500 uppercase tracking-wider block mb-1.5">
                    Location
                  </label>
                  <input
                    value={form.location}
                    onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl text-[14px] text-white placeholder-slate-600 outline-none"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                    placeholder="City, State"
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] text-slate-500 uppercase tracking-wider block mb-1.5">
                  What's driving this project?
                </label>
                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl text-[14px] text-white placeholder-slate-600 outline-none resize-none"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                  placeholder="Outage risk, demand charges, sustainability goals, new facility build-out…"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-4 rounded-xl font-bold text-[16px] transition-all duration-200"
                style={{
                  background: loading ? "rgba(56,189,248,0.08)" : "rgba(56,189,248,0.14)",
                  border: "1px solid rgba(56,189,248,0.35)",
                  color: "#38bdf8",
                  cursor: loading ? "wait" : "pointer",
                }}
              >
                {loading ? (
                  "Submitting…"
                ) : (
                  <>
                    Request free consultation <ArrowRight size={18} />
                  </>
                )}
              </button>
              <p className="text-[11px] text-slate-600 text-center">
                No spam · No obligation · We reply within 1 business day
              </p>
            </form>
          )}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-14 px-4 sm:px-6 lg:px-8 border-t border-white/[0.05]">
        <div className="max-w-2xl mx-auto">
          <h2
            className="text-[22px] font-bold text-white mb-8 text-center"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            Common questions
          </h2>
          <div className="flex flex-col gap-3">
            {FAQ.map(({ q, a }, i) => (
              <div
                key={i}
                className="rounded-xl overflow-hidden"
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left"
                >
                  <span className="text-[14px] font-semibold text-white">{q}</span>
                  <ChevronDown
                    size={15}
                    className={`text-slate-500 flex-shrink-0 transition-transform ${openFaq === i ? "rotate-180" : ""}`}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4">
                    <p className="text-[13px] text-slate-400 leading-relaxed">{a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
