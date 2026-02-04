/**
 * Expression Components
 * =====================
 * 
 * Created: January 31, 2026
 * 
 * DOCTRINE:
 * "Show me which lifeSignal justifies it."
 * 
 * These components express internal truth through visual properties.
 * They do NOT invent feelings. They do NOT editorialize.
 * 
 * Expression vocabulary:
 * - Weight (font-weight, opacity) → confidence
 * - Borders (sharp/soft/diffuse) → certainty
 * - Silence (absence, negative space) → humility
 * - Presence (glow, pulse) → readiness
 */

import React, { type ReactNode } from "react";
import type {
  FieldCertainty,
  VisualWeight,
  Phase,
} from "./types";
import { certaintyToWeight, confidenceToIntensity, humilityToSoftness } from "./types";

// =============================================================================
// FIELD CERTAINTY INDICATOR
// =============================================================================

interface CertaintyIndicatorProps {
  /** Certainty level from lifeSignals.getFieldCertainty() */
  certainty: FieldCertainty;
  
  /** Optional: show as inline badge vs subtle decoration */
  variant?: "badge" | "decoration";
  
  /** Optional: size */
  size?: "sm" | "md";
}

/**
 * CertaintyIndicator
 * 
 * Visual indicator of field certainty.
 * - certain (user): solid dot
 * - observed (detected): ring with dot
 * - assumed (default): faint ring
 * - unknown: empty
 * 
 * @lifeSignal getFieldCertainty(fieldId)
 */
export function CertaintyIndicator({
  certainty,
  variant = "decoration",
  size = "sm",
}: CertaintyIndicatorProps): JSX.Element {
  const weight = certaintyToWeight(certainty);
  
  const sizeClass = size === "sm" ? "w-2 h-2" : "w-3 h-3";
  
  // Map weight to visual treatment
  const styles: Record<VisualWeight, string> = {
    heavy: "bg-emerald-400 shadow-emerald-400/40 shadow-sm",           // solid green
    medium: "bg-blue-400/60 ring-1 ring-blue-400/40",                  // blue with ring
    light: "bg-transparent ring-1 ring-slate-500/40",                  // faint ring only
    ghost: "bg-transparent",                                            // nothing
  };
  
  if (variant === "badge") {
    const labels: Record<FieldCertainty, string> = {
      certain: "Confirmed",
      observed: "Detected",
      assumed: "Typical",
      unknown: "",
    };
    
    const badgeColors: Record<FieldCertainty, string> = {
      certain: "bg-emerald-500/10 text-emerald-300 ring-emerald-500/30",
      observed: "bg-blue-500/10 text-blue-300 ring-blue-500/30",
      assumed: "bg-slate-500/10 text-slate-400 ring-slate-500/30",
      unknown: "bg-transparent text-slate-600",
    };
    
    if (certainty === "unknown") return <></>;
    
    return (
      <span className={`
        inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium
        ring-1 ${badgeColors[certainty]}
      `}>
        <span className={`rounded-full ${sizeClass} ${styles[weight]}`} />
        {labels[certainty]}
      </span>
    );
  }
  
  // Decoration variant: just the dot
  return (
    <span 
      className={`rounded-full ${sizeClass} ${styles[weight]} transition-all duration-200`}
      aria-hidden="true"
    />
  );
}

// =============================================================================
// ATTRIBUTION TOOLTIP
// =============================================================================

interface AttributionProps {
  /** Attribution text from lifeSignals.getFieldAttribution() */
  attribution: string | null;
  
  /** Child element to wrap */
  children: ReactNode;
  
  /** Position of tooltip */
  position?: "top" | "bottom" | "left" | "right";
}

/**
 * Attribution
 * 
 * Wraps a field with hover tooltip showing source.
 * Only shows tooltip if attribution is non-null.
 * 
 * @lifeSignal getFieldAttribution(fieldId)
 */
export function Attribution({
  attribution,
  children,
  position = "top",
}: AttributionProps): JSX.Element {
  if (!attribution) {
    return <>{children}</>;
  }
  
  const positionClasses: Record<string, string> = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };
  
  return (
    <span className="relative group">
      {children}
      <span 
        className={`
          absolute ${positionClasses[position]} z-50
          px-2 py-1 rounded text-[11px] font-medium
          bg-slate-800 text-slate-300 ring-1 ring-slate-700
          opacity-0 group-hover:opacity-100
          pointer-events-none
          transition-opacity duration-150
          whitespace-nowrap
        `}
        role="tooltip"
      >
        {attribution}
      </span>
    </span>
  );
}

// =============================================================================
// CONFIDENCE BAR
// =============================================================================

interface ConfidenceBarProps {
  /** 0-1 confidence score from lifeSignals.confidence */
  confidence: number;
  
  /** Optional: show numeric value */
  showValue?: boolean;
  
  /** Optional: variant */
  variant?: "bar" | "ring" | "pulse";
}

/**
 * ConfidenceBar
 * 
 * Visual representation of overall confidence.
 * Higher confidence = more solid, more presence.
 * Lower confidence = more translucent, more diffuse.
 * 
 * @lifeSignal confidence (0-1)
 */
export function ConfidenceBar({
  confidence,
  showValue = false,
  variant = "bar",
}: ConfidenceBarProps): JSX.Element {
  const intensity = confidenceToIntensity(confidence);
  const percent = Math.round(confidence * 100);
  
  if (variant === "ring") {
    // SVG ring indicator
    const radius = 16;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference * (1 - confidence);
    
    return (
      <div className="relative inline-flex items-center justify-center">
        <svg width="40" height="40" className="transform -rotate-90">
          {/* Background ring */}
          <circle
            cx="20"
            cy="20"
            r={radius}
            stroke="currentColor"
            strokeWidth="3"
            fill="none"
            className="text-slate-700"
          />
          {/* Confidence ring */}
          <circle
            cx="20"
            cy="20"
            r={radius}
            stroke="currentColor"
            strokeWidth="3"
            fill="none"
            className="text-emerald-400 transition-all duration-500"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
        {showValue && (
          <span className="absolute text-[10px] font-bold text-slate-300">
            {percent}
          </span>
        )}
      </div>
    );
  }
  
  if (variant === "pulse") {
    // Pulsing dot that glows more with higher confidence
    return (
      <span 
        className="relative inline-flex"
        style={{ opacity: intensity / 100 }}
      >
        <span 
          className={`
            w-3 h-3 rounded-full bg-emerald-400
            ${confidence > 0.7 ? "animate-pulse" : ""}
          `}
        />
        {confidence > 0.5 && (
          <span 
            className="absolute inset-0 rounded-full bg-emerald-400 animate-ping"
            style={{ opacity: confidence * 0.3 }}
          />
        )}
      </span>
    );
  }
  
  // Default: bar
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 rounded-full transition-all duration-500"
          style={{ width: `${percent}%`, opacity: intensity / 100 }}
        />
      </div>
      {showValue && (
        <span className="text-[11px] font-mono text-slate-400 tabular-nums">
          {percent}%
        </span>
      )}
    </div>
  );
}

// =============================================================================
// PHASE INDICATOR
// =============================================================================

interface PhaseIndicatorProps {
  /** Current phase from lifeSignals.phase */
  phase: Phase;
  
  /** Is system observing? */
  isObserving: boolean;
  
  /** Is system processing? */
  isProcessing: boolean;
  
  /** Is system complete? */
  isComplete: boolean;
  
  /** Optional: show label */
  showLabel?: boolean;
}

/**
 * PhaseIndicator
 * 
 * Visual indicator of FSM phase.
 * - Observing: breathing animation
 * - Processing: spinning
 * - Complete: solid check
 * - Active: steady glow
 * 
 * @lifeSignal phase, isObserving, isProcessing, isComplete
 */
export function PhaseIndicator({
  phase,
  isObserving,
  isProcessing,
  isComplete,
  showLabel = false,
}: PhaseIndicatorProps): JSX.Element {
  // Phase to icon mapping
  const getIcon = () => {
    if (isComplete) return "✓";
    if (isProcessing) return "⟳";
    if (isObserving) return "◎";
    return "●";
  };
  
  // Phase to animation mapping
  const getAnimation = () => {
    if (isProcessing) return "animate-spin";
    if (isObserving) return "animate-pulse";
    return "";
  };
  
  // Phase to color mapping
  const getColor = () => {
    if (isComplete) return "text-emerald-400";
    if (isProcessing) return "text-blue-400";
    if (isObserving) return "text-amber-400/70";
    return "text-slate-400";
  };
  
  // Phase labels (only for showLabel=true)
  const labels: Record<Phase, string> = {
    idle: "Ready",
    template_loading: "Loading...",
    template_ready: "Ready",
    defaults_applying: "Applying defaults...",
    part_active: "Active",
    validating: "Validating...",
    quote_generating: "Generating quote...",
    complete: "Complete",
    error: "Error",
  };
  
  return (
    <span className={`inline-flex items-center gap-1.5 ${getColor()}`}>
      <span className={`text-sm ${getAnimation()}`}>
        {getIcon()}
      </span>
      {showLabel && (
        <span className="text-[11px] font-medium">
          {labels[phase]}
        </span>
      )}
    </span>
  );
}

// =============================================================================
// READINESS GLOW
// =============================================================================

interface ReadinessGlowProps {
  /** 0-1 readiness score from lifeSignals.readiness */
  readiness: number;
  
  /** Children to wrap with glow effect */
  children: ReactNode;
  
  /** Optional: glow color */
  color?: "emerald" | "blue" | "purple";
}

/**
 * ReadinessGlow
 * 
 * Wraps children with a glow effect proportional to readiness.
 * At readiness=1, full glow. At readiness=0, no glow.
 * 
 * @lifeSignal readiness (0-1)
 */
export function ReadinessGlow({
  readiness,
  children,
  color = "emerald",
}: ReadinessGlowProps): JSX.Element {
  const colors = {
    emerald: "shadow-emerald-500/40",
    blue: "shadow-blue-500/40",
    purple: "shadow-purple-500/40",
  };
  
  const intensity = Math.round(readiness * 30); // 0-30px shadow
  
  return (
    <div 
      className={`transition-shadow duration-500 rounded-xl ${colors[color]}`}
      style={{
        boxShadow: readiness > 0.3 ? `0 0 ${intensity}px var(--tw-shadow-color)` : "none",
      }}
    >
      {children}
    </div>
  );
}

// =============================================================================
// HUMILITY WRAPPER
// =============================================================================

interface HumilityWrapperProps {
  /** 0-1 humility score from lifeSignals.humility */
  humility: number;
  
  /** Children to wrap */
  children: ReactNode;
}

/**
 * HumilityWrapper
 * 
 * Wraps content with visual treatment based on humility.
 * Higher humility = softer borders, lighter opacity.
 * 
 * @lifeSignal humility (0-1)
 */
export function HumilityWrapper({
  humility,
  children,
}: HumilityWrapperProps): JSX.Element {
  const softness = humilityToSoftness(humility);
  
  const softnessClasses = {
    sharp: "border-white/20",
    soft: "border-white/10",
    diffuse: "border-white/5",
  };
  
  const opacityStyle = {
    opacity: 0.7 + (1 - humility) * 0.3, // 0.7-1.0 based on inverse humility
  };
  
  return (
    <div 
      className={`border ${softnessClasses[softness]} rounded-xl transition-all duration-300`}
      style={opacityStyle}
    >
      {children}
    </div>
  );
}

// =============================================================================
// SOURCE LEGEND
// =============================================================================

interface SourceLegendProps {
  /** Source breakdown from lifeSignals.sourceBreakdown */
  sourceBreakdown: {
    user: number;
    location_intel: number;
    business_detection: number;
    template_default: number;
    question_default: number;
  };
  
  /** Optional: compact mode */
  compact?: boolean;
}

/**
 * SourceLegend
 * 
 * Shows a legend of value sources.
 * Visual summary of "where did these numbers come from?"
 * 
 * @lifeSignal sourceBreakdown
 */
export function SourceLegend({
  sourceBreakdown,
  compact = false,
}: SourceLegendProps): JSX.Element {
  const sources = [
    { key: "user", label: "You entered", color: "bg-emerald-400", count: sourceBreakdown.user },
    { key: "location_intel", label: "From your area", color: "bg-blue-400", count: sourceBreakdown.location_intel },
    { key: "business_detection", label: "Detected", color: "bg-cyan-400", count: sourceBreakdown.business_detection },
    { key: "template_default", label: "Industry typical", color: "bg-slate-500", count: sourceBreakdown.template_default },
    { key: "question_default", label: "Standard", color: "bg-slate-600", count: sourceBreakdown.question_default },
  ].filter(s => s.count > 0);
  
  if (sources.length === 0) return <></>;
  
  if (compact) {
    return (
      <div className="flex items-center gap-2 text-[10px]">
        {sources.map(s => (
          <span key={s.key} className="flex items-center gap-1">
            <span className={`w-1.5 h-1.5 rounded-full ${s.color}`} />
            <span className="text-slate-400">{s.count}</span>
          </span>
        ))}
      </div>
    );
  }
  
  return (
    <div className="space-y-1.5">
      {sources.map(s => (
        <div key={s.key} className="flex items-center gap-2 text-[11px]">
          <span className={`w-2 h-2 rounded-full ${s.color}`} />
          <span className="text-slate-400">{s.label}</span>
          <span className="text-slate-500 font-mono">{s.count}</span>
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// FIELD WRAPPER (combines all field-level expression)
// =============================================================================

interface FieldWrapperProps {
  /** Certainty from lifeSignals.getFieldCertainty() */
  certainty: FieldCertainty;
  
  /** Attribution from lifeSignals.getFieldAttribution() */
  attribution: string | null;
  
  /** Children (the actual field input) */
  children: ReactNode;
  
  /** Optional: show certainty badge */
  showCertainty?: boolean;
  
  /** Optional: show attribution on hover */
  showAttribution?: boolean;
}

/**
 * FieldWrapper
 * 
 * Wraps a field with full expression treatment:
 * - Certainty indicator
 * - Attribution tooltip
 * - Visual weight based on certainty
 * 
 * @lifeSignal getFieldCertainty, getFieldAttribution
 */
export function FieldWrapper({
  certainty,
  attribution,
  children,
  showCertainty = true,
  showAttribution = true,
}: FieldWrapperProps): JSX.Element {
  const weight = certaintyToWeight(certainty);
  
  // Weight to opacity mapping
  const opacities: Record<VisualWeight, string> = {
    heavy: "opacity-100",
    medium: "opacity-90",
    light: "opacity-75",
    ghost: "opacity-50",
  };
  
  const content = (
    <div className={`relative ${opacities[weight]} transition-opacity duration-200`}>
      {showCertainty && certainty !== "unknown" && (
        <div className="absolute -left-5 top-1/2 -translate-y-1/2">
          <CertaintyIndicator certainty={certainty} size="sm" />
        </div>
      )}
      {children}
    </div>
  );
  
  if (showAttribution && attribution) {
    return (
      <Attribution attribution={attribution} position="right">
        {content}
      </Attribution>
    );
  }
  
  return content;
}
