/**
 * VERTICAL CONFIGURATION TYPE SYSTEM
 * ====================================
 * 
 * Single source of truth for vertical landing page configuration.
 * Each vertical (car wash, hotel, EV charging, etc.) provides a config
 * object that drives the shared VerticalLandingPage component.
 * 
 * ARCHITECTURE:
 *   verticalConfig.ts  ← You are here (types + registry)
 *   verticals/carWash.ts   ← Pure data: images, copy, colors
 *   verticals/hotel.ts     ← Pure data: images, copy, colors
 *   verticals/evCharging.ts← Pure data: images, copy, colors
 *   stateRates.ts          ← Shared state utility rates
 * 
 * ADDING A NEW VERTICAL:
 *   1. Create src/config/verticals/yourVertical.ts implementing VerticalConfig
 *   2. Register it in VERTICAL_REGISTRY below
 *   3. Add route in App.tsx: /your-vertical → <VerticalLandingPage config={yourConfig} />
 *   4. Done. No new wizard, calculator, or questionnaire code needed.
 * 
 * Created: Feb 7, 2026
 */

import type { LucideIcon } from 'lucide-react';

// =============================================================================
// CORE TYPES
// =============================================================================

/** Color theme for a vertical's branding */
export interface VerticalTheme {
  /** Tailwind gradient classes for the page background */
  pageBg: string;
  /** Primary accent color name (used in Tailwind classes: text-{accent}-400, bg-{accent}-500, etc.) */
  accent: 'cyan' | 'emerald' | 'indigo' | 'amber' | 'rose' | 'violet' | 'blue' | 'teal';
  /** Secondary accent for gradients */
  accentSecondary: string;
  /** Carousel image shadow color class */
  carouselShadow: string;
  /** Carousel border color class */
  carouselBorder: string;
  /** Header gradient classes */
  headerBg: string;
  /** CTA button gradient classes */
  ctaGradient: string;
  /** CTA button hover gradient classes */
  ctaHoverGradient: string;
}

/** A single carousel image */
export interface CarouselImage {
  src: string;
  alt: string;
  caption: string;
  subcaption: string;
  /** Optional per-image data (hotel uses savings/payback) */
  savings?: number;
  payback?: number;
}

/** Hero section stat card */
export interface HeroStat {
  value: string;
  label: string;
  icon?: string;
}

/** Hero section callout badge (top-right of carousel) */
export interface HeroCallout {
  label: string;
  value: string;
  bgClass: string;
  labelClass: string;
}

/** Value proposition bullet point */
export interface ValueProp {
  text: string;
  icon?: LucideIcon;
}

/** A "How It Works" step */
export interface HowItWorksStep {
  title: string;
  description: string;
}

/** A case study for social proof */
export interface CaseStudy {
  id: string;
  category: string;
  title: string;
  /** Image import reference */
  image: string;
  annualSavings: number;
  paybackYears: number;
  metrics: {
    /** Primary sizing metric (rooms, bays, ports, etc.) */
    primaryLabel: string;
    primaryValue: string;
    batteryKW: number;
    batteryKWh: number;
    solarKW: number;
    peakDemandReduction: string;
    demandChargeSavings: number;
    energyArbitrageSavings: number;
    incentivesReceived: number;
    totalProjectCost: number;
    netCost: number;
    roi25Year: string;
    co2ReductionTons: number;
  };
}

/** Mini-calculator input field definition */
export interface CalculatorInput {
  id: string;
  label: string;
  type: 'number' | 'slider' | 'toggle' | 'select' | 'zip';
  defaultValue: number | string | boolean;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  options?: { value: string; label: string }[];
  /** Help text shown below the input */
  helpText?: string;
}

/** Configuration for the hero mini-calculator */
export interface CalculatorConfig {
  /** Inputs displayed in the hero calculator */
  inputs: CalculatorInput[];
  /** SSOT function slug for power calculation (e.g., 'car-wash', 'hotel', 'ev-charging') */
  ssotSlug: string;
  /** BESS sizing ratio for quick estimate (0.40-1.00) */
  bessRatio: number;
  /** Default duration hours for BESS */
  durationHours: number;
  /** Lead source tag for Supabase */
  leadSourceTag: string;
}

/** Quick savings estimate function type */
export type QuickEstimateFn = (inputs: Record<string, any>) => {
  savings: number;
  payback: number;
  label?: string;
};

// =============================================================================
// MAIN CONFIG INTERFACE
// =============================================================================

export interface VerticalConfig {
  /** URL slug for routing (e.g., 'car-wash', 'hotel', 'ev-charging') */
  slug: string;
  
  /** WizardV7 industry slug (maps to industryMeta.ts canonical slug) */
  wizardIndustrySlug: string;

  // ─── Branding ────────────────────────────────────────────────────────
  /** Brand display name (e.g., 'CarWashEnergy') */
  brandName: string;
  /** Brand name highlight portion (rendered in accent color) */
  brandHighlight: string;
  /** Subtitle under brand name */
  brandSubtitle: string;
  /** Lucide icon component for the brand */
  brandIcon: LucideIcon;
  /** Color theme */
  theme: VerticalTheme;

  // ─── Hero Section ────────────────────────────────────────────────────
  /** Badge text above headline (e.g., 'Car Wash Owners Save 30-50% on Energy') */
  heroBadge: string;
  /** Badge icon */
  heroBadgeIcon: LucideIcon;
  /** Main headline (plain text portion) */
  heroHeadline: string;
  /** Gradient-colored portion of headline */
  heroHeadlineHighlight: string;
  /** Subtitle paragraph below headline */
  heroSubtitle: string;
  /** Highlighted portion within subtitle */
  heroSubtitleHighlight: string;
  /** Value proposition bullet points */
  valueProps: ValueProp[];
  /** CTA button text */
  heroCTA: string;
  /** Carousel images */
  carouselImages: CarouselImage[];
  /** Callout badge on carousel (top-right) */
  heroCallout: HeroCallout;
  /** 3 stats shown in mobile cards + desktop financial overlay */
  heroStats: [HeroStat, HeroStat, HeroStat];
  /** CSS rgba value for edge-bleed gradient fade (matches page background) */
  heroGradientRgba: string;

  // ─── Calculator ──────────────────────────────────────────────────────
  /** Mini-calculator configuration */
  calculator: CalculatorConfig;
  /** Quick estimate function for hero inline preview */
  quickEstimate: QuickEstimateFn;

  // ─── Social Proof ────────────────────────────────────────────────────
  /** Case studies / success stories */
  caseStudies: CaseStudy[];
  /** "How It Works" steps */
  howItWorks: HowItWorksStep[];
  /** Section headline for social proof */
  socialProofHeadline?: string;

  // ─── Lead Capture ────────────────────────────────────────────────────
  /** Supabase lead source tag */
  leadSourceTag: string;
  /** CTA text for lead form */
  leadFormCTA?: string;

  // ─── SEO / Meta ──────────────────────────────────────────────────────
  /** Page title for SEO */
  pageTitle?: string;
  /** Meta description */
  metaDescription?: string;
}

// =============================================================================
// VERTICAL REGISTRY
// =============================================================================

/** Registry of all available vertical configs (populated by individual config files) */
const VERTICAL_REGISTRY = new Map<string, VerticalConfig>();

/** Register a vertical config */
export function registerVertical(config: VerticalConfig): void {
  VERTICAL_REGISTRY.set(config.slug, config);
}

/** Get a vertical config by slug */
export function getVerticalConfig(slug: string): VerticalConfig | undefined {
  return VERTICAL_REGISTRY.get(slug);
}

/** Get all registered vertical slugs */
export function getVerticalSlugs(): string[] {
  return Array.from(VERTICAL_REGISTRY.keys());
}

/** Get all registered vertical configs */
export function getAllVerticals(): VerticalConfig[] {
  return Array.from(VERTICAL_REGISTRY.values());
}
