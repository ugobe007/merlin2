/**
 * MERLIN ENERGY DESIGN SYSTEM
 * ============================
 * Version 1.0 - January 2026
 * 
 * "Merlin Energy powered by TrueQuote™"
 * 
 * Strategy:
 * - Unified slate blue foundation across all steps
 * - Purple accents for Merlin guidance (Steps 1-4)
 * - Amber/orange accents for TrueQuote results (Steps 5-6)
 * - Same foundation, different accent = cohesive but distinct
 */

// ============================================================================
// COLOR PALETTE
// ============================================================================

export const colors = {
  // Foundation (All Steps)
  background: {
    primary: '#0f172a',      // slate-900
    secondary: '#1e293b',    // slate-800
    tertiary: '#334155',     // slate-700
    card: 'rgba(30, 41, 59, 0.8)',  // slate-800/80
    cardHover: 'rgba(30, 41, 59, 0.95)',
  },
  
  text: {
    primary: '#ffffff',
    secondary: '#cbd5e1',    // slate-300
    tertiary: '#94a3b8',     // slate-400
    muted: '#64748b',        // slate-500
  },
  
  border: {
    primary: 'rgba(71, 85, 105, 0.5)',    // slate-600/50
    secondary: 'rgba(100, 116, 139, 0.3)', // slate-500/30
    hover: 'rgba(139, 92, 246, 0.5)',     // purple-500/50
  },

  // Merlin Accent (Steps 1-4: The Journey)
  merlin: {
    primary: '#8b5cf6',      // purple-500
    secondary: '#6366f1',    // indigo-500
    light: '#a78bfa',        // purple-400
    dark: '#7c3aed',         // purple-600
    gradient: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
    glow: 'rgba(139, 92, 246, 0.25)',
  },

  // TrueQuote Accent (Steps 5-6: The Results)
  truequote: {
    primary: '#f59e0b',      // amber-500
    secondary: '#f97316',    // orange-500
    light: '#fbbf24',        // amber-400
    dark: '#d97706',         // amber-600
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
    glow: 'rgba(245, 158, 11, 0.25)',
  },

  // Status Colors (All Steps)
  status: {
    success: '#10b981',      // emerald-500
    successLight: '#34d399', // emerald-400
    info: '#06b6d4',         // cyan-500
    infoLight: '#22d3ee',    // cyan-400
    warning: '#f59e0b',      // amber-500
    warningLight: '#fbbf24', // amber-400
    error: '#ef4444',        // red-500
    errorLight: '#f87171',   // red-400
  },
};

// ============================================================================
// TYPOGRAPHY
// ============================================================================

export const typography = {
  fontFamily: {
    primary: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    display: "'Outfit', 'Inter', sans-serif",  // For large headings
    mono: "'JetBrains Mono', 'Fira Code', monospace",
  },
  
  fontSize: {
    xs: '0.75rem',      // 12px
    sm: '0.875rem',     // 14px
    base: '1rem',       // 16px
    lg: '1.125rem',     // 18px
    xl: '1.25rem',      // 20px
    '2xl': '1.5rem',    // 24px
    '3xl': '1.875rem',  // 30px
    '4xl': '2.25rem',   // 36px
    '5xl': '3rem',      // 48px
    '6xl': '3.75rem',   // 60px
  },
  
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },
  
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
};

// ============================================================================
// SPACING
// ============================================================================

export const spacing = {
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '1rem',      // 16px
  lg: '1.5rem',    // 24px
  xl: '2rem',      // 32px
  '2xl': '3rem',   // 48px
  '3xl': '4rem',   // 64px
  '4xl': '6rem',   // 96px
};

// ============================================================================
// BORDER RADIUS
// ============================================================================

export const borderRadius = {
  sm: '0.375rem',  // 6px
  md: '0.5rem',    // 8px
  lg: '0.75rem',   // 12px
  xl: '1rem',      // 16px
  '2xl': '1.5rem', // 24px
  '3xl': '2rem',   // 32px
  full: '9999px',
};

// ============================================================================
// SHADOWS
// ============================================================================

export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  
  // Colored shadows
  merlin: '0 10px 30px -5px rgba(139, 92, 246, 0.3)',
  truequote: '0 10px 30px -5px rgba(245, 158, 11, 0.3)',
  success: '0 10px 30px -5px rgba(16, 185, 129, 0.3)',
};

// ============================================================================
// COMPONENT STYLES
// ============================================================================

export const components = {
  // Button Variants
  button: {
    // Merlin Primary (Steps 1-4)
    merlinPrimary: {
      background: colors.merlin.gradient,
      color: colors.text.primary,
      border: 'none',
      boxShadow: shadows.merlin,
      hover: {
        transform: 'translateY(-2px)',
        boxShadow: '0 15px 35px -5px rgba(139, 92, 246, 0.4)',
      },
    },
    
    // TrueQuote Primary (Steps 5-6)
    truequotePrimary: {
      background: colors.truequote.gradient,
      color: colors.text.primary,
      border: 'none',
      boxShadow: shadows.truequote,
      hover: {
        transform: 'translateY(-2px)',
        boxShadow: '0 15px 35px -5px rgba(245, 158, 11, 0.4)',
      },
    },
    
    // Secondary (All Steps)
    secondary: {
      background: colors.background.card,
      color: colors.text.secondary,
      border: `2px solid ${colors.border.primary}`,
      hover: {
        background: colors.background.cardHover,
        borderColor: colors.border.hover,
      },
    },
    
    // Success (Selected/Completed states)
    success: {
      background: `linear-gradient(135deg, ${colors.status.success} 0%, ${colors.status.successLight} 100%)`,
      color: colors.text.primary,
      border: 'none',
      boxShadow: shadows.success,
    },
  },
  
  // Card Variants
  card: {
    default: {
      background: colors.background.card,
      border: `1px solid ${colors.border.primary}`,
      borderRadius: borderRadius['2xl'],
      backdropFilter: 'blur(12px)',
    },
    
    interactive: {
      background: colors.background.card,
      border: `2px solid ${colors.border.primary}`,
      borderRadius: borderRadius['2xl'],
      transition: 'all 0.3s ease',
      hover: {
        borderColor: colors.merlin.primary,
        boxShadow: shadows.merlin,
        transform: 'translateY(-2px)',
      },
    },
    
    selected: {
      background: colors.background.card,
      border: `2px solid ${colors.merlin.primary}`,
      borderRadius: borderRadius['2xl'],
      boxShadow: shadows.merlin,
    },
  },
  
  // Input Variants
  input: {
    default: {
      background: colors.background.secondary,
      border: `2px solid ${colors.border.primary}`,
      borderRadius: borderRadius.lg,
      color: colors.text.primary,
      fontSize: typography.fontSize.base,
      padding: `${spacing.md} ${spacing.lg}`,
      focus: {
        borderColor: colors.merlin.primary,
        outline: 'none',
        boxShadow: `0 0 0 3px ${colors.merlin.glow}`,
      },
    },
    
    slider: {
      track: {
        background: colors.background.tertiary,
        height: '8px',
        borderRadius: borderRadius.full,
      },
      thumb: {
        background: colors.merlin.gradient,
        width: '24px',
        height: '24px',
        borderRadius: borderRadius.full,
        boxShadow: shadows.lg,
      },
    },
  },
  
  // Progress Bar
  progress: {
    track: {
      background: colors.background.tertiary,
      height: '8px',
      borderRadius: borderRadius.full,
    },
    bar: {
      background: colors.merlin.gradient,
      borderRadius: borderRadius.full,
      transition: 'width 0.4s ease',
    },
  },
  
  // Badge
  badge: {
    merlin: {
      background: `${colors.merlin.primary}20`,
      border: `1px solid ${colors.merlin.primary}50`,
      color: colors.merlin.light,
      borderRadius: borderRadius.full,
      padding: `${spacing.xs} ${spacing.md}`,
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.semibold,
    },
    
    truequote: {
      background: `${colors.truequote.primary}20`,
      border: `1px solid ${colors.truequote.primary}50`,
      color: colors.truequote.light,
      borderRadius: borderRadius.full,
      padding: `${spacing.xs} ${spacing.md}`,
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.semibold,
    },
    
    success: {
      background: `${colors.status.success}20`,
      border: `1px solid ${colors.status.success}50`,
      color: colors.status.successLight,
      borderRadius: borderRadius.full,
      padding: `${spacing.xs} ${spacing.md}`,
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.semibold,
    },
  },
};

// ============================================================================
// STEP-SPECIFIC CONFIGURATIONS
// ============================================================================

export const stepConfigs = {
  // Steps 1-4: Merlin Guidance
  merlinSteps: {
    primaryColor: colors.merlin,
    buttonVariant: 'merlinPrimary',
    accentGradient: colors.merlin.gradient,
    glowColor: colors.merlin.glow,
    badgeVariant: 'merlin',
  },
  
  // Steps 5-6: TrueQuote Results
  truequoteSteps: {
    primaryColor: colors.truequote,
    buttonVariant: 'truequotePrimary',
    accentGradient: colors.truequote.gradient,
    glowColor: colors.truequote.glow,
    badgeVariant: 'truequote',
  },
};

// ============================================================================
// BREAKPOINTS
// ============================================================================

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

// ============================================================================
// ANIMATIONS
// ============================================================================

export const animations = {
  transitions: {
    fast: '150ms ease',
    base: '200ms ease',
    slow: '300ms ease',
    slower: '500ms ease',
  },
  
  easings: {
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
    spring: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
};

// ============================================================================
// USAGE GUIDELINES
// ============================================================================

/**
 * STEPS 1-4 (Merlin Guidance):
 * - Use colors.merlin for primary CTAs
 * - Use stepConfigs.merlinSteps for consistent theming
 * - Merlin avatar visible with purple border
 * - Conversational, helpful tone
 * - "I'm helping you build your quote"
 * 
 * STEPS 5-6 (TrueQuote Results):
 * - Use colors.truequote for primary CTAs
 * - Use stepConfigs.truequoteSteps for consistent theming
 * - TrueQuote badge prominent with amber border
 * - Professional, verified tone
 * - "Here's your verified, transparent quote"
 * 
 * PURPLE vs AMBER:
 * - Purple = Input/Choices (you're building)
 * - Amber = Output/Results (TrueQuote verified)
 * - But keep purple for interactive elements in Step 5-6 (tier selection)
 * 
 * CONSISTENCY:
 * - Same slate foundation everywhere
 * - Same card styles, spacing, typography
 * - Same Merlin avatar asset
 * - Smooth transition from purple → amber accent at Step 5
 */

export default {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  components,
  stepConfigs,
  breakpoints,
  animations,
};
