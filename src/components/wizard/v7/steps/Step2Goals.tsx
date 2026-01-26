/**
 * Step 2: Goals & Industry (Vineet's Design) — CLEANED LAYOUT
 *
 * Updates (Jan 23, 2026):
 * - Added industry selection (required to proceed)
 * - User must select at least 1 goal AND an industry
 * - Industry auto-inferred from business shows as pre-selected
 *
 * Fixes:
 * - Unified column gutters (tight + aligned)
 * - Proper flex scrolling with min-h-0 (no funky padding / overlap)
 * - Single scroll per column (predictable)
 * - Advisor panel feels "attached" not detached
 */

import React from "react";
import AdvisorHeader from "../shared/AdvisorHeader";
import BusinessProfileCard from "../shared/BusinessProfileCard";

interface Step2GoalsProps {
  location: any;
  selectedGoals: string[];
  toggleGoal: (goalId: string) => void;
  assessment: any;
  industry: string | null;
  setIndustry: (industry: string | null) => void;
}

// Industry options
const industries = [
  { id: 'car-wash', icon: '🚗', name: 'Car Wash' },
  { id: 'hotel', icon: '🏨', name: 'Hotel / Hospitality' },
  { id: 'office', icon: '🏢', name: 'Office Building' },
  { id: 'hospital', icon: '🏥', name: 'Hospital / Medical' },
  { id: 'data-center', icon: '💾', name: 'Data Center' },
  { id: 'manufacturing', icon: '🏭', name: 'Manufacturing' },
  { id: 'ev-charging', icon: '⚡', name: 'EV Charging' },
  { id: 'retail', icon: '🛒', name: 'Retail Store' },
  { id: 'restaurant', icon: '🍽️', name: 'Restaurant' },
  { id: 'warehouse', icon: '📦', name: 'Warehouse' },
  { id: 'apartment', icon: '🏘️', name: 'Apartment Complex' },
  { id: 'college', icon: '🎓', name: 'College / University' },
];

// Goal Data (Vineet's 6 goals)
const goals = [
  {
    id: 'goal-costs',
    icon: '💰',
    title: 'Reduce Energy Costs',
    description: 'Lower your monthly electricity bills with smart energy management',
    metrics: [
      { label: 'Savings', value: '15-35%' },
      { label: 'ROI', value: '4-7 yrs' },
      { label: 'Priority', value: 'High' },
    ],
  },
  {
    id: 'goal-backup',
    icon: '🔋',
    title: 'Backup Power',
    description: 'Ensure business continuity during grid outages',
    metrics: [
      { label: 'Runtime', value: '2-8 hrs' },
      { label: 'Uptime', value: '99.9%' },
      { label: 'Priority', value: 'Critical' },
    ],
  },
  {
    id: 'goal-sustain',
    icon: '🌱',
    title: 'Sustainability',
    description: 'Reduce carbon footprint with clean renewable energy',
    metrics: [
      { label: 'CO2 Reduction', value: '35-70%' },
      { label: 'Green Score', value: 'A+' },
      { label: 'Impact', value: 'High' },
    ],
  },
  {
    id: 'goal-independence',
    icon: '⚡',
    title: 'Energy Independence',
    description: 'Generate and store your own power, reduce grid reliance',
    metrics: [
      { label: 'Self-Gen', value: '40-80%' },
      { label: 'Grid', value: '-60%' },
      { label: 'Freedom', value: 'High' },
    ],
  },
  {
    id: 'goal-peak',
    icon: '📉',
    title: 'Peak Demand Shaving',
    description: 'Cut demand charges by reducing peak electricity consumption',
    metrics: [
      { label: 'Peak Cut', value: '20-40%' },
      { label: 'Demand $', value: '-50%' },
      { label: 'Value', value: 'Very High' },
    ],
  },
  {
    id: 'goal-revenue',
    icon: '📈',
    title: 'Generate Revenue',
    description: 'Earn income from demand response, energy trading, and grid services',
    metrics: [
      { label: 'Revenue', value: '$5-20k/yr' },
      { label: 'Programs', value: '3-8' },
      { label: 'Bonus', value: 'High' },
    ],
  },
];

export default function Step2Goals({
  location,
  selectedGoals,
  toggleGoal,
  assessment,
  industry,
  setIndustry,
}: Step2GoalsProps) {
  // Defensive fallbacks so the UI never explodes
  const safeAssessment = assessment || {
    compatibility: { label: "—", color: "#94a3b8", bg: "rgba(148,163,184,0.15)" },
    system: { label: "—", color: "#94a3b8", bg: "rgba(148,163,184,0.15)" },
    roi: { label: "—", color: "#94a3b8", bg: "rgba(148,163,184,0.15)" },
    comment: "Select at least one goal to see Merlin's recommendation.",
  };

  return (
    <div className="grid grid-cols-2 h-full min-h-0">
      {/* LEFT COLUMN */}
      <div className="p-6 flex flex-col min-h-0 overflow-hidden">
        {/* Industry Selection */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600/20 to-blue-600/10 border border-blue-600/35 flex items-center justify-center">
              <span className="text-xl">🏢</span>
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Select your Industry</h2>
              <p className="text-xs text-slate-500">Required to continue</p>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {industries.map((ind) => (
              <button
                key={ind.id}
                onClick={() => setIndustry(ind.id)}
                className={[
                  "p-2 rounded-lg border text-center transition-all",
                  industry === ind.id
                    ? "bg-blue-500/20 border-blue-500/50 ring-1 ring-blue-500/30"
                    : "bg-white/5 border-white/10 hover:border-white/20",
                ].join(" ")}
              >
                <div className="text-xl mb-1">{ind.icon}</div>
                <div className="text-[10px] text-white font-medium leading-tight">{ind.name}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Goals Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600/20 to-purple-600/10 border border-purple-600/35 flex items-center justify-center">
            <span className="text-xl">🎯</span>
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">Select your Goals</h2>
            <p className="text-xs text-slate-500">Min. 1, Max 6</p>
          </div>
        </div>

        {/* Scroll area (single scroll, predictable) */}
        <div className="flex-1 min-h-0 overflow-y-auto pr-2">
          <div className="grid grid-cols-3 gap-3">
            {goals.map((goal) => {
              const isSelected = selectedGoals.includes(goal.id);

              return (
                <button
                  key={goal.id}
                  onClick={() => toggleGoal(goal.id)}
                  className={[
                    "relative p-3 rounded-xl border text-left transition-all",
                    "hover:translate-y-[-1px] hover:border-white/20",
                    isSelected
                      ? "bg-gradient-to-br from-green-500/15 to-green-600/10 border-green-500/40"
                      : "bg-white/5 border-white/10",
                  ].join(" ")}
                >
                  {/* Checkbox */}
                  <div className="absolute top-2 right-2">
                    <div
                      className={[
                        "w-4 h-4 rounded border flex items-center justify-center",
                        isSelected
                          ? "bg-green-500 border-green-500"
                          : "bg-transparent border-slate-600",
                      ].join(" ")}
                    >
                      {isSelected && (
                        <svg
                          className="w-2.5 h-2.5 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                  </div>

                  {/* Icon */}
                  <div className="text-2xl mb-2">{goal.icon}</div>

                  {/* Title */}
                  <div className="text-sm font-semibold text-white mb-1 pr-5">{goal.title}</div>

                  {/* Description - hidden to save space */}
                  {/* <p className="text-xs text-slate-400 leading-tight">{goal.description}</p> */}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN */}
      <div className="p-8 flex flex-col min-h-0 overflow-hidden bg-white/[0.02] border-l border-purple-500/20">
        <AdvisorHeader size="small" subtitle="Analyzing your goals..." />

        <div className="flex-1 min-h-0 overflow-y-auto pr-2 mt-4 flex flex-col gap-6">
          {/* Business Profile Card */}
          <BusinessProfileCard
            business={location?.business ? {
              name: location.business.name,
              formattedAddress: location.business.address,
              categoryLabel: location.business.category || "Commercial Energy Consumer",
              rating: location.business.rating,
              userRatingsTotal: location.business.userRatingsTotal,
              website: location.business.website,
              phone: location.business.phone,
              photoUrl: location.business.photoUrl,
              logoUrl: location.business.logoUrl,
              isVerified: true,
            } : null}
            subtitle="Location"
          />

          {/* MerlinAI Assessment */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xl">🧙</span>
              <span className="text-lg font-semibold text-white">Goal Assessment</span>
            </div>

            <div
              className="bg-gradient-to-br from-purple-600/15 to-purple-600/5 border border-purple-600/30 rounded-2xl p-6"
              style={{ animation: "pulsate 2s ease-in-out infinite" }}
            >
              {/* Row */}
              <div className="flex items-center justify-between py-3 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">🎯</span>
                  <span className="text-sm text-white">Goal Compatibility</span>
                </div>
                <span
                  className="text-xs font-semibold px-3 py-1 rounded-md"
                  style={{
                    color: safeAssessment.compatibility.color,
                    background: safeAssessment.compatibility.bg,
                  }}
                >
                  {safeAssessment.compatibility.label}
                </span>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">⚡</span>
                  <span className="text-sm text-white">Recommended System</span>
                </div>
                <span
                  className="text-xs font-semibold px-3 py-1 rounded-md"
                  style={{
                    color: safeAssessment.system.color,
                    background: safeAssessment.system.bg,
                  }}
                >
                  {safeAssessment.system.label}
                </span>
              </div>

              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">💎</span>
                  <span className="text-sm text-white">ROI Potential</span>
                </div>
                <span
                  className="text-xs font-semibold px-3 py-1 rounded-md"
                  style={{
                    color: safeAssessment.roi.color,
                    background: safeAssessment.roi.bg,
                  }}
                >
                  {safeAssessment.roi.label}
                </span>
              </div>

              <div className="pt-4 mt-3 border-t border-white/10">
                <p className="text-sm text-slate-300 leading-relaxed">
                  {safeAssessment.comment}
                </p>
              </div>
            </div>
          </div>

          {/* Optional: add Goals Analysis panel later, but keep spacing consistent */}
        </div>
      </div>
    </div>
  );
}
