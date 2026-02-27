/**
 * MERLIN ICON PREVIEW — /icon-preview
 * =====================================
 * Interactive preview of icon variants at all sizes.
 * Pick your favorite → we'll export it as favicon + OG image.
 * Feb 25, 2026
 */

import React, { useState } from "react";

// ─── Icon Variants ─────────────────────────────────────────────────────────────

/** A: M + green energy node at the center valley */
function IconA({ size = 100 }: { size?: number }) {
  const id = `a-${size}`;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id={`glow-${id}`} cx="50%" cy="54%" r="28%">
          <stop offset="0%" stopColor="#3ECF8E" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#3ECF8E" stopOpacity="0" />
        </radialGradient>
        <filter id={`blur-${id}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3.5" />
        </filter>
      </defs>

      {/* Background */}
      <rect width="100" height="100" rx="22" fill="#0D1117" />

      {/* Subtle green glow at center */}
      <circle cx="50" cy="54" r="28" fill={`url(#glow-${id})`} />

      {/* M lettermark — white, bold stroke */}
      <path
        d="M14 76 L14 22 L50 54 L86 22 L86 76"
        stroke="rgba(255,255,255,0.92)"
        strokeWidth="7.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Green energy node at center valley */}
      <circle cx="50" cy="54" r="6.5" fill="#3ECF8E" />
      <circle
        cx="50"
        cy="54"
        r="6.5"
        fill="#3ECF8E"
        filter={`url(#blur-${id})`}
        opacity="0.7"
      />
    </svg>
  );
}

/** B: M + green spark crown floating above */
function IconB({ size = 100 }: { size?: number }) {
  const id = `b-${size}`;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id={`glow-${id}`} cx="50%" cy="22%" r="35%">
          <stop offset="0%" stopColor="#3ECF8E" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#3ECF8E" stopOpacity="0" />
        </radialGradient>
        <filter id={`blur-${id}`} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="4" />
        </filter>
      </defs>

      {/* Background */}
      <rect width="100" height="100" rx="22" fill="#0D1117" />

      {/* Glow at top */}
      <ellipse cx="50" cy="20" rx="38" ry="25" fill={`url(#glow-${id})`} />

      {/* M lettermark */}
      <path
        d="M14 76 L14 30 L50 56 L86 30 L86 76"
        stroke="rgba(255,255,255,0.92)"
        strokeWidth="7.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Green 4-point star / spark at top-center */}
      {/* Main dot */}
      <circle cx="50" cy="18" r="5" fill="#3ECF8E" />
      {/* Cross arms */}
      <line x1="50" y1="10" x2="50" y2="15" stroke="#3ECF8E" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="50" y1="21" x2="50" y2="26" stroke="#3ECF8E" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="42" y1="18" x2="47" y2="18" stroke="#3ECF8E" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="53" y1="18" x2="58" y2="18" stroke="#3ECF8E" strokeWidth="2.5" strokeLinecap="round" />
      {/* Glow */}
      <circle cx="50" cy="18" r="9" fill="#3ECF8E" filter={`url(#blur-${id})`} opacity="0.6" />
    </svg>
  );
}

/** C: M with lightning bolt replacing center valley */
function IconC({ size = 100 }: { size?: number }) {
  const id = `c-${size}`;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id={`glow-${id}`} cx="50%" cy="58%" r="30%">
          <stop offset="0%" stopColor="#3ECF8E" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#3ECF8E" stopOpacity="0" />
        </radialGradient>
        <filter id={`blur-${id}`} x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="4" />
        </filter>
        <linearGradient id={`mgrad-${id}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.75)" />
        </linearGradient>
      </defs>

      {/* Background */}
      <rect width="100" height="100" rx="22" fill="#0D1117" />

      {/* Glow */}
      <circle cx="50" cy="60" r="26" fill={`url(#glow-${id})`} />

      {/* Left leg of M */}
      <path
        d="M14 76 L14 22 L44 51"
        stroke={`url(#mgrad-${id})`}
        strokeWidth="7.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Right leg of M */}
      <path
        d="M86 76 L86 22 L56 51"
        stroke={`url(#mgrad-${id})`}
        strokeWidth="7.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Green lightning bolt at center valley */}
      {/* Bolt: top-right slant → left → bottom-right slant */}
      <path
        d="M55 46 L44 61 L50 61 L43 76 L62 56 L55 56 Z"
        fill="#3ECF8E"
        strokeLinejoin="round"
      />
      {/* Glow on bolt */}
      <path
        d="M55 46 L44 61 L50 61 L43 76 L62 56 L55 56 Z"
        fill="#3ECF8E"
        filter={`url(#blur-${id})`}
        opacity="0.6"
      />
    </svg>
  );
}

/** D: Filled M silhouette — modern solid mark */
function IconD({ size = 100 }: { size?: number }) {
  const id = `d-${size}`;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id={`glow-${id}`} cx="50%" cy="45%" r="50%">
          <stop offset="0%" stopColor="#3ECF8E" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#3ECF8E" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`fill-${id}`} x1="0%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
          <stop offset="50%" stopColor="#3ECF8E" stopOpacity="1" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.85)" />
        </linearGradient>
      </defs>

      {/* Background */}
      <rect width="100" height="100" rx="22" fill="#0D1117" />
      <rect width="100" height="100" rx="22" fill={`url(#glow-${id})`} />

      {/* Solid M shape — filled polygon */}
      {/* Outer shape: left leg, up to left peak, diagonal to valley, diagonal to right peak, right leg, close */}
      <path
        d="
          M8 82
          L8 20
          L18 20
          L50 50
          L82 20
          L92 20
          L92 82
          L80 82
          L80 30
          L50 60
          L20 30
          L20 82
          Z
        "
        fill={`url(#fill-${id})`}
        opacity="0.92"
      />
    </svg>
  );
}

// ─── Size ring ─────────────────────────────────────────────────────────────────
const SIZES = [512, 192, 128, 64, 32, 16] as const;

const ICONS = [
  { id: "A", label: "Node M", desc: "M + green energy node at center valley", component: IconA },
  { id: "B", label: "Crown M", desc: "M + green spark / star floating above", component: IconB },
  { id: "C", label: "Bolt M", desc: "M with ⚡ lightning bolt in the valley", component: IconC },
  { id: "D", label: "Solid M", desc: "Filled M silhouette with green gradient", component: IconD },
];

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function IconPreview() {
  const [selected, setSelected] = useState<string>("A");

  return (
    <div
      className="min-h-screen text-white"
      style={{ background: "#060608", fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-white/[0.06] backdrop-blur-xl"
        style={{ background: "rgba(6,6,8,0.92)" }}>
        <div className="max-w-5xl mx-auto px-5 h-13 flex items-center justify-between">
          <span className="text-sm font-semibold text-white/60">Merlin Icon Lab</span>
          <a href="/home" className="text-xs text-white/30 hover:text-white/60 transition-colors">← Back to site</a>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-5 py-12">
        <h1 className="text-2xl font-black text-white mb-1">Merlin Icon Concepts</h1>
        <p className="text-white/40 text-sm mb-10">
          Click a variant to select, then compare at every size below.
          All icons use <code className="text-[#3ECF8E] text-xs">#0D1117</code> background + <code className="text-[#3ECF8E] text-xs">#3ECF8E</code> accent.
        </p>

        {/* ── Variant selector ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
          {ICONS.map(({ id, label, desc, component: Icon }) => (
            <button
              key={id}
              onClick={() => setSelected(id)}
              className={`flex flex-col items-center gap-3 p-5 rounded-2xl border transition-all text-left ${
                selected === id
                  ? "border-[#3ECF8E]/50 bg-[#3ECF8E]/[0.06]"
                  : "border-white/[0.07] bg-white/[0.02] hover:border-white/[0.14] hover:bg-white/[0.04]"
              }`}
            >
              <Icon size={72} />
              <div>
                <div className={`text-sm font-bold ${selected === id ? "text-[#3ECF8E]" : "text-white"}`}>
                  {id} — {label}
                </div>
                <div className="text-xs text-white/40 mt-0.5 leading-snug">{desc}</div>
              </div>
              {selected === id && (
                <div className="self-end px-2 py-0.5 rounded-full bg-[#3ECF8E]/15 border border-[#3ECF8E]/30 text-[#3ECF8E] text-[10px] font-bold">
                  SELECTED
                </div>
              )}
            </button>
          ))}
        </div>

        {/* ── Size comparison ── */}
        {ICONS.filter(({ id }) => id === selected).map(({ id, label, component: Icon }) => (
          <div key={id}>
            <h2 className="text-base font-bold text-white mb-1">
              Option {id} — {label} · All sizes
            </h2>
            <p className="text-xs text-white/30 mb-6">
              Check it at 16px (browser favicon) and 512px (app store). The icon must read clearly at both extremes.
            </p>

            {/* Large sizes */}
            <div className="flex flex-wrap items-end gap-8 mb-10">
              {SIZES.map((s) => (
                <div key={s} className="flex flex-col items-center gap-2">
                  <Icon size={s} />
                  <span className="text-[10px] text-white/30 font-mono">{s}px</span>
                </div>
              ))}
            </div>

            {/* Context simulations */}
            <h3 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-4">
              Context previews
            </h3>
            <div className="grid sm:grid-cols-3 gap-4 mb-10">

              {/* Browser tab sim */}
              <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
                <div className="bg-[#2a2a2c] px-3 py-1.5 flex items-center gap-2 border-b border-white/[0.08]">
                  <div className="flex gap-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                  </div>
                  <div className="flex-1 bg-[#1a1a1c] rounded px-2 py-1 flex items-center gap-1.5 mx-2">
                    <Icon size={14} />
                    <span className="text-[10px] text-white/50 truncate">merlinenergy.net</span>
                  </div>
                </div>
                <div className="p-4 text-center">
                  <div className="text-[10px] text-white/30">Browser tab (16px favicon)</div>
                </div>
              </div>

              {/* App icon sim */}
              <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-5 flex flex-col items-center justify-center gap-3">
                <div style={{ borderRadius: "22%" }} className="overflow-hidden shadow-2xl">
                  <Icon size={80} />
                </div>
                <span className="text-[10px] text-white/40">Merlin Energy</span>
                <div className="text-[10px] text-white/30">Mobile app icon (80px)</div>
              </div>

              {/* Navbar sim */}
              <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
                <div className="px-4 py-3 bg-[#0D1117] border-b border-white/[0.06] flex items-center gap-2">
                  <Icon size={28} />
                  <span className="text-sm font-bold text-white">Merlin Energy</span>
                </div>
                <div className="p-4 text-center">
                  <div className="text-[10px] text-white/30">Navbar (28px)</div>
                </div>
              </div>

            </div>

            {/* Light background sim */}
            <h3 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-4">
              On light backgrounds (email, docs, press)
            </h3>
            <div className="rounded-xl bg-white p-6 flex items-center gap-8 mb-10">
              {[16, 32, 48, 64, 80].map((s) => (
                <div key={s} className="flex flex-col items-center gap-1.5">
                  <Icon size={s} />
                  <span className="text-[10px] text-slate-400 font-mono">{s}px</span>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* ── Export note ── */}
        <div className="rounded-xl border border-[#3ECF8E]/15 bg-[#3ECF8E]/[0.04] p-5">
          <div className="text-sm font-bold text-[#3ECF8E] mb-1">Ready to ship?</div>
          <p className="text-xs text-white/50 leading-relaxed">
            Tell me which option (A, B, C, or D) you want — I'll set it as the app favicon,
            generate the OG social card, and update the navbar icon. You can also suggest tweaks:
            heavier stroke, different corner radius, more/less glow, etc.
          </p>
        </div>
      </div>
    </div>
  );
}
