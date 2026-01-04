/**
 * Step 1 Goals Data
 * Energy goals for users to select
 */

export interface Goal {
  id: string;
  icon: string;
  label: string;
  description: string;
}

export const STEP1_GOALS: Goal[] = [
  {
    id: "costs",
    icon: "✂️",
    label: "Cut Energy Costs",
    description: "Reduce monthly electricity bills",
  },
  { id: "backup", icon: "🔋", label: "Backup Power", description: "Stay powered during outages" },
  {
    id: "sustainability",
    icon: "🌱",
    label: "Sustainability",
    description: "Reduce carbon footprint",
  },
  {
    id: "independence",
    icon: "🏠",
    label: "Grid Independence",
    description: "Less reliance on utilities",
  },
  { id: "peakshaving", icon: "⚡", label: "Peak Shaving", description: "Avoid peak rate charges" },
  { id: "revenue", icon: "💵", label: "Generate Revenue", description: "Sell excess power back" },
];
