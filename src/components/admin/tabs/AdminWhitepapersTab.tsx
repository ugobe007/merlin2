/**
 * Admin Whitepapers Tab
 * =====================
 * Displays all Merlin whitepapers with preview, download (PDF), and
 * share links. Whitepapers are served from /public/ as static HTML.
 */

import { useState } from "react";
import { Download, ExternalLink, FileText, Share2, Eye } from "lucide-react";

interface Whitepaper {
  id: string;
  title: string;
  subtitle: string;
  published: string;
  industries: string[];
  description: string;
  url: string; // path served from /public
  pdfReady: boolean;
  linkedInReady: boolean;
}

const WHITEPAPERS: Whitepaper[] = [
  {
    id: "hidden-energy-tax",
    title: "The Hidden Energy Tax",
    subtitle: "Every Commercial Operator Pays",
    published: "April 2026",
    industries: ["Hotel", "Data Center", "Hospital", "EV Charging"],
    description:
      "How demand charges silently consume 30–50% of your electric bill — and what four industries are doing about it with battery energy storage. Includes live TrueQuote™ financials benchmarked against NREL ATB 2024 data.",
    url: "/whitepaper.html",
    pdfReady: true,
    linkedInReady: true,
  },
  {
    id: "energy-blind-spots",
    title: "Energy Blind Spots",
    subtitle: "What Most Business Owners Don't Know They Don't Know",
    published: "April 2026",
    industries: ["All Industries"],
    description:
      "Demand charges, time-of-use rates, ratchet clauses, power factor penalties — five hidden costs that inflate commercial electric bills and why most businesses never see them coming.",
    url: "/whitepapers/energy-blind-spots.html",
    pdfReady: true,
    linkedInReady: true,
  },
  {
    id: "datacenter-effect",
    title: "The Data Center Effect",
    subtitle: "How Big Tech Is Raising Your Electric Bill",
    published: "April 2026",
    industries: ["Car Wash", "Grocery", "Retail", "Restaurant"],
    description:
      "When Google or Microsoft builds a 500 MW data center in your county, every local business sharing that grid pays for the infrastructure upgrade. Includes the car wash example and the top 5 at-risk corridors.",
    url: "/whitepapers/datacenter-effect.html",
    pdfReady: true,
    linkedInReady: true,
  },
  {
    id: "oil-at-200",
    title: "Oil at $200/Barrel",
    subtitle: "Is Your Business Ready for the Energy Supply Shock?",
    published: "April 2026",
    industries: ["Hospital", "Data Center", "Cold Storage", "Manufacturing"],
    description:
      "Middle East export disruption is no longer a tail risk. At $200/barrel oil, diesel generators cost $0.75/kWh to run. Here's how businesses with diesel-dependent backup power can hedge before the shock hits.",
    url: "/whitepapers/oil-at-200.html",
    pdfReady: true,
    linkedInReady: true,
  },
  {
    id: "bess-explained",
    title: "BESS Systems Explained",
    subtitle: "The Energy Swiss Army Knife Your Business Needs",
    published: "April 2026",
    industries: ["All Industries"],
    description:
      "BESS is not a giant UPS. It's an intelligent optimizer that reduces demand charges, captures TOU arbitrage, integrates solar, and extends generator life — working every hour of every day, not just during outages.",
    url: "/whitepapers/bess-explained.html",
    pdfReady: true,
    linkedInReady: true,
  },
  {
    id: "solar-done-right",
    title: "Solar Done Right",
    subtitle: "Why Rooftop Panels Alone Won't Save Your Business",
    published: "April 2026",
    industries: ["Hotel", "Retail", "Restaurant", "Car Wash"],
    description:
      "Solar panels generate when the sun shines — not when you need electricity. NEM 3.0, curtailment, and TOU misalignment kill most solar-only ROI cases. Here's the framework that actually works.",
    url: "/whitepapers/solar-done-right.html",
    pdfReady: true,
    linkedInReady: true,
  },
  {
    id: "generators-decoded",
    title: "Generators Decoded",
    subtitle: "Diesel, Natural Gas & Turbines — What Businesses Must Know",
    published: "April 2026",
    industries: ["Hospital", "Data Center", "Hotel", "Manufacturing"],
    description:
      "Three generator types, three very different risk profiles. Most commercial generators run at 25–40% load — inefficient and expensive. Here's how BESS transforms generator economics and extends equipment life 2–3×.",
    url: "/whitepapers/generators-decoded.html",
    pdfReady: true,
    linkedInReady: true,
  },
  {
    id: "nuclear-option",
    title: "The Nuclear Option",
    subtitle: "Why Data Centers and Hospitals Should Be Paying Attention to SMRs",
    published: "April 2026",
    industries: ["Data Center", "Hospital", "University"],
    description:
      "Microsoft restarted Three Mile Island. Google signed Kairos Power SMR agreements. Small Modular Reactors are coming — and the organizations that begin planning now will have a 10-year advantage. Who should be in the queue.",
    url: "/whitepapers/nuclear-option.html",
    pdfReady: true,
    linkedInReady: true,
  },
];

const INDUSTRY_COLORS: Record<string, string> = {
  Hotel: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  "Data Center": "bg-purple-500/20 text-purple-300 border-purple-500/30",
  Hospital: "bg-red-500/20 text-red-300 border-red-500/30",
  "EV Charging": "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  "Car Wash": "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  Grocery: "bg-green-500/20 text-green-300 border-green-500/30",
};

function copyToClipboard(text: string, key: string, setCopied: (k: string) => void) {
  void (
    navigator as Navigator & { clipboard: { writeText: (t: string) => Promise<void> } }
  ).clipboard.writeText(text);
  setCopied(key);
  setTimeout(() => setCopied(""), 2000);
}

export default function AdminWhitepapersTab() {
  const [copied, setCopied] = useState("");

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            Whitepapers
          </h2>
          <p className="text-white/50 text-sm mt-1">
            Industry whitepapers powered by live TrueQuote™ data — ready for LinkedIn and direct
            share.
          </p>
        </div>
        <span className="text-xs text-white/30 bg-white/5 border border-white/10 rounded-full px-3 py-1">
          {WHITEPAPERS.length} published
        </span>
      </div>

      {/* Whitepaper cards */}
      {WHITEPAPERS.map((wp) => (
        <div
          key={wp.id}
          className="bg-white/[0.04] border border-white/[0.08] rounded-xl overflow-hidden"
        >
          {/* Card header */}
          <div className="bg-gradient-to-r from-emerald-900/40 to-navy-900/40 px-6 py-5 border-b border-white/[0.06]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                    Merlin TrueQuote™ Whitepaper
                  </span>
                  <span className="text-xs text-white/30">· {wp.published}</span>
                </div>
                <h3 className="text-lg font-bold text-white leading-tight">{wp.title}</h3>
                <p className="text-white/60 text-sm">{wp.subtitle}</p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                {wp.pdfReady && (
                  <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full px-2 py-1 font-medium">
                    PDF Ready
                  </span>
                )}
                {wp.linkedInReady && (
                  <span className="text-xs bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full px-2 py-1 font-medium">
                    LinkedIn Ready
                  </span>
                )}
              </div>
            </div>

            {/* Industry tags */}
            <div className="flex flex-wrap gap-2 mt-3">
              {wp.industries.map((ind) => (
                <span
                  key={ind}
                  className={`text-xs border rounded-full px-2 py-0.5 font-medium ${INDUSTRY_COLORS[ind] ?? "bg-white/10 text-white/60 border-white/20"}`}
                >
                  {ind}
                </span>
              ))}
            </div>
          </div>

          {/* Card body */}
          <div className="px-6 py-5 space-y-5">
            <p className="text-white/60 text-sm leading-relaxed">{wp.description}</p>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3">
              {/* Preview */}
              <a
                href={wp.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-white/[0.06] hover:bg-white/[0.10] border border-white/[0.10] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                <Eye className="w-4 h-4" />
                Preview
              </a>

              {/* Open in new tab (full page) */}
              <a
                href={wp.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-white/[0.06] hover:bg-white/[0.10] border border-white/[0.10] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Open Full Page
              </a>

              {/* Download PDF — browser print dialog */}
              <button
                onClick={() => {
                  const w = window.open(wp.url, "_blank");
                  if (w) setTimeout(() => w.print(), 800);
                }}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                Download PDF
              </button>

              {/* Copy share link */}
              <button
                onClick={() =>
                  copyToClipboard(`${window.location.origin}${wp.url}`, wp.id, setCopied)
                }
                className="flex items-center gap-2 bg-white/[0.06] hover:bg-white/[0.10] border border-white/[0.10] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                <Share2 className="w-4 h-4" />
                {copied === wp.id ? "Link Copied!" : "Copy Link"}
              </button>
            </div>

            {/* LinkedIn post helper */}
            <div className="bg-blue-900/20 border border-blue-500/20 rounded-lg p-4">
              <p className="text-blue-300 text-xs font-semibold uppercase tracking-wider mb-2">
                LinkedIn Post Copy
              </p>
              <p className="text-white/70 text-sm leading-relaxed mb-3">
                {`⚡ We just published a new whitepaper: "${wp.title} — ${wp.subtitle}"\n\nDemand charges silently consume 30–50% of most commercial electric bills. We ran the numbers for 4 industries — Hotels, Data Centers, Hospitals, and EV Charging Hubs — using live NREL benchmark data.\n\nThe results are eye-opening. Download the full whitepaper (free) →\n\n#BESS #EnergyStorage #CleanEnergy #DemandCharges #MerlinEnergy`}
              </p>
              <button
                onClick={() =>
                  copyToClipboard(
                    `⚡ We just published a new whitepaper: "${wp.title} — ${wp.subtitle}"\n\nDemand charges silently consume 30–50% of most commercial electric bills. We ran the numbers for 4 industries — Hotels, Data Centers, Hospitals, and EV Charging Hubs — using live NREL benchmark data.\n\nThe results are eye-opening. Download the full whitepaper (free) → ${window.location.origin}${wp.url}\n\n#BESS #EnergyStorage #CleanEnergy #DemandCharges #MerlinEnergy`,
                    `${wp.id}-li`,
                    setCopied
                  )
                }
                className="text-xs bg-blue-600 hover:bg-blue-500 text-white font-semibold px-3 py-1.5 rounded-lg transition-colors"
              >
                {copied === `${wp.id}-li` ? "✓ Copied!" : "Copy LinkedIn Post"}
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* Coming soon */}
      <div className="border border-dashed border-white/10 rounded-xl px-6 py-8 text-center">
        <FileText className="w-8 h-8 text-white/20 mx-auto mb-3" />
        <p className="text-white/40 text-sm font-medium">More whitepapers coming soon</p>
        <p className="text-white/25 text-xs mt-1">Car Wash · Grocery · Manufacturing · Cannabis</p>
      </div>
    </div>
  );
}
