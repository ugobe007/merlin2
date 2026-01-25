// ============================================
// MERLIN STEP 3 INPUT REGISTRY
// File: src/components/wizard/v6/step3/inputs/registry.ts
// Non-component exports (fixes react-refresh warning)
// ============================================

// ============================================
// COLOR SCHEME SYSTEM
// ============================================

export interface ColorScheme {
  primary: string;
  primaryGradient: string;
  border: string;
  borderSelected: string;
  focusBorder: string;
  bgSelected: string;
  bgHover: string;
  text: string;
  textSelected: string;
  ring: string;
  iconBg: string;
  iconBgSelected: string;
}

const COLOR_SCHEMES: ColorScheme[] = [
  // Section 0: Purple
  {
    primary: "violet-500",
    primaryGradient: "from-violet-500 to-purple-500",
    border: "border-violet-300",
    borderSelected: "border-violet-500",
    focusBorder: "focus:border-violet-500",
    bgSelected: "bg-gradient-to-br from-violet-500/10 to-purple-500/5",
    bgHover: "hover:bg-violet-50 hover:border-violet-400",
    text: "text-violet-700",
    textSelected: "text-violet-700",
    ring: "ring-violet-200",
    iconBg: "bg-violet-100 text-violet-600",
    iconBgSelected: "bg-violet-500 text-white",
  },
  // Section 1: Gradient Purple
  {
    primary: "purple-500",
    primaryGradient: "from-purple-500 via-indigo-500 to-purple-600",
    border: "border-purple-300",
    borderSelected: "border-purple-500",
    focusBorder: "focus:border-amber-400/40",
    bgSelected: "bg-gradient-to-br from-purple-500/15 via-indigo-500/10 to-purple-600/5",
    bgHover: "hover:bg-purple-50 hover:border-purple-400",
    text: "text-purple-700",
    textSelected: "text-purple-700",
    ring: "ring-purple-200",
    iconBg: "bg-purple-100 text-purple-600",
    iconBgSelected: "bg-gradient-to-br from-purple-500 to-indigo-500 text-white",
  },
  // Section 2: Light Blue
  {
    primary: "sky-500",
    primaryGradient: "from-sky-400 to-cyan-500",
    border: "border-sky-300",
    borderSelected: "border-sky-500",
    focusBorder: "focus:border-sky-500",
    bgSelected: "bg-gradient-to-br from-sky-500/10 to-cyan-500/5",
    bgHover: "hover:bg-sky-50 hover:border-sky-400",
    text: "text-sky-700",
    textSelected: "text-sky-700",
    ring: "ring-sky-200",
    iconBg: "bg-sky-100 text-sky-600",
    iconBgSelected: "bg-sky-500 text-white",
  },
  // Section 3: Amber
  {
    primary: "amber-500",
    primaryGradient: "from-amber-400 to-orange-500",
    border: "border-amber-300",
    borderSelected: "border-amber-500",
    focusBorder: "focus:border-amber-500",
    bgSelected: "bg-gradient-to-br from-amber-500/10 to-orange-500/5",
    bgHover: "hover:bg-amber-50 hover:border-amber-400",
    text: "text-amber-700",
    textSelected: "text-amber-700",
    ring: "ring-amber-200",
    iconBg: "bg-amber-100 text-amber-600",
    iconBgSelected: "bg-amber-500 text-white",
  },
  // Section 4: Emerald (cycle repeats)
  {
    primary: "emerald-500",
    primaryGradient: "from-emerald-400 to-teal-500",
    border: "border-emerald-300",
    borderSelected: "border-emerald-500",
    focusBorder: "focus:border-emerald-500",
    bgSelected: "bg-gradient-to-br from-emerald-500/10 to-teal-500/5",
    bgHover: "hover:bg-emerald-50 hover:border-emerald-400",
    text: "text-emerald-700",
    textSelected: "text-emerald-700",
    ring: "ring-emerald-200",
    iconBg: "bg-emerald-100 text-emerald-600",
    iconBgSelected: "bg-emerald-500 text-white",
  },
  // Section 5: Pink
  {
    primary: "pink-500",
    primaryGradient: "from-pink-400 to-rose-500",
    border: "border-pink-300",
    borderSelected: "border-pink-500",
    focusBorder: "focus:border-pink-500",
    bgSelected: "bg-gradient-to-br from-pink-500/10 to-rose-500/5",
    bgHover: "hover:bg-pink-50 hover:border-pink-400",
    text: "text-pink-700",
    textSelected: "text-pink-700",
    ring: "ring-pink-200",
    iconBg: "bg-pink-100 text-pink-600",
    iconBgSelected: "bg-pink-500 text-white",
  },
];

export const getColorScheme = (sectionIndex: number): ColorScheme => {
  return COLOR_SCHEMES[sectionIndex % COLOR_SCHEMES.length];
};
