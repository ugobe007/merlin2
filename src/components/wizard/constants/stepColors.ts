/**
 * STEP COLOR PROGRESSION
 * ======================
 * 
 * Visual feedback as user advances through the wizard.
 * Colors transition from warm welcome → cool analysis → celebratory results.
 * 
 * Design Philosophy:
 * - Each step has a distinct but harmonious color
 * - Progression feels like a journey
 * - Colors communicate stage: warm=welcome, cool=analysis, gold=success
 */

// ============================================
// STEP-BASED COLOR PALETTE
// ============================================

export interface StepColorScheme {
  // Primary panel colors
  panelBg: string;           // Main panel background
  panelBgGradient: string;   // Gradient variant
  panelBorder: string;       // Border color
  
  // Accent colors  
  accentPrimary: string;     // Primary accent (buttons, highlights)
  accentSecondary: string;   // Secondary accent
  
  // Text colors
  textPrimary: string;       // Main text
  textSecondary: string;     // Secondary/muted text
  textAccent: string;        // Accent text (values, highlights)
  
  // Interactive states
  selectedBg: string;        // Selected item background
  selectedBorder: string;    // Selected item border
  hoverBg: string;           // Hover state
  
  // Semantic
  successBg: string;         // Success indicators
  successText: string;       // Success text
}

export const STEP_COLORS: Record<number, StepColorScheme> = {
  // Step 0: Welcome - Light cyan-blue (iOS 18 inspired - fresh, warm)
  0: {
    panelBg: 'bg-[#EFF6FF]',
    panelBgGradient: 'bg-gradient-to-br from-[#EFF6FF] to-[#DBEAFE]',
    panelBorder: 'border-[#93C5FD]',
    accentPrimary: '#6700b6',
    accentSecondary: '#ffa600',
    textPrimary: 'text-gray-800',
    textSecondary: 'text-gray-500',
    textAccent: 'text-[#6700b6]',
    selectedBg: 'bg-gradient-to-br from-[#6700b6] to-[#060F76]',
    selectedBorder: 'border-[#ad42ff]',
    hoverBg: 'hover:bg-[#fffaf0]',
    successBg: 'bg-emerald-50',
    successText: 'text-emerald-700',
  },
  
  // Step 1: Industry - Light sky blue (iOS 18 blue blend)
  1: {
    panelBg: 'bg-[#F0F9FF]',
    panelBgGradient: 'bg-gradient-to-br from-[#F0F9FF] to-[#E0F2FE]',
    panelBorder: 'border-[#7DD3FC]',
    accentPrimary: '#6700b6',
    accentSecondary: '#ffa600',
    textPrimary: 'text-gray-800',
    textSecondary: 'text-gray-500',
    textAccent: 'text-[#6700b6]',
    selectedBg: 'bg-gradient-to-br from-[#6700b6] to-[#060F76]',
    selectedBorder: 'border-[#ad42ff]',
    hoverBg: 'hover:bg-[#EDE5FF]',
    successBg: 'bg-emerald-50',
    successText: 'text-emerald-700',
  },
  
  // Step 2: Facility Details - Cool blue (data gathering)
  2: {
    panelBg: 'bg-[#E8F4FD]',
    panelBgGradient: 'bg-gradient-to-br from-[#E8F4FD] to-[#D6ECFC]',
    panelBorder: 'border-[#B8DCFA]',
    accentPrimary: '#0066CC',
    accentSecondary: '#ffa600',
    textPrimary: 'text-gray-800',
    textSecondary: 'text-gray-500',
    textAccent: 'text-[#0066CC]',
    selectedBg: 'bg-gradient-to-br from-[#0066CC] to-[#004499]',
    selectedBorder: 'border-[#4DA6FF]',
    hoverBg: 'hover:bg-[#DCF0FF]',
    successBg: 'bg-emerald-50',
    successText: 'text-emerald-700',
  },
  
  // Step 3: Configuration - Soft green (building solution)
  3: {
    panelBg: 'bg-[#E8FDF4]',
    panelBgGradient: 'bg-gradient-to-br from-[#E8FDF4] to-[#D4F7E9]',
    panelBorder: 'border-[#A8E8D0]',
    accentPrimary: '#059669',
    accentSecondary: '#ffa600',
    textPrimary: 'text-gray-800',
    textSecondary: 'text-gray-500',
    textAccent: 'text-[#059669]',
    selectedBg: 'bg-gradient-to-br from-[#059669] to-[#047857]',
    selectedBorder: 'border-[#34D399]',
    hoverBg: 'hover:bg-[#DCFCE7]',
    successBg: 'bg-emerald-100',
    successText: 'text-emerald-800',
  },
  
  // Step 4: Quote Results - Deep purple (elegant, professional)
  4: {
    panelBg: 'bg-[#1a1a2e]',
    panelBgGradient: 'bg-gradient-to-br from-[#1a1a2e] via-[#252547] to-[#1e1e3d]',
    panelBorder: 'border-[#5B21B6]',
    accentPrimary: '#8B5CF6',
    accentSecondary: '#ffa600',
    textPrimary: 'text-white',
    textSecondary: 'text-gray-300',
    textAccent: 'text-[#FDE047]',
    selectedBg: 'bg-gradient-to-br from-[#8B5CF6] to-[#5B21B6]',
    selectedBorder: 'border-[#A855F7]',
    hoverBg: 'hover:bg-[#2d1a54]',
    successBg: 'bg-emerald-500/20',
    successText: 'text-emerald-300',
  },
};

// Helper function to get step colors (defaults to step 0 if not found)
export function getStepColors(step: number): StepColorScheme {
  return STEP_COLORS[step] || STEP_COLORS[0];
}

// CSS class helper - returns string of panel classes
export function getStepPanelClasses(step: number): string {
  const colors = getStepColors(step);
  return `${colors.panelBgGradient} ${colors.panelBorder} border-2 rounded-3xl shadow-lg`;
}
