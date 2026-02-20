/**
 * MANUFACTURING VERTICAL CONFIGURATION
 * ======================================
 * 
 * Route: /manufacturing-energy
 * Wizard: WizardV7 with initialIndustry='manufacturing'
 * SSOT Calculator: calculateUseCasePower('manufacturing', ...)
 * 
 * Created: Feb 2026 — Sprint 2
 */

import { Factory, Zap, CheckCircle } from 'lucide-react';
import type { VerticalConfig } from '../verticalConfig';
import { registerVertical } from '../verticalConfig';

import mfg1 from '@/assets/images/manufacturing_1.jpg';
import mfg2 from '@/assets/images/manufacturing_2.jpg';
import mfg3 from '@/assets/images/manufacturing_3.jpg';

export const manufacturingConfig: VerticalConfig = {
  slug: 'manufacturing',
  wizardIndustrySlug: 'manufacturing',

  // ─── Branding ────────────────────────────────────────────────────────
  brandName: 'Manufacturing',
  brandHighlight: 'Energy',
  brandSubtitle: 'Battery Storage Solutions',
  brandIcon: Factory,
  theme: {
    pageBg: 'bg-gradient-to-br from-orange-900 via-amber-800 to-slate-900',
    accent: 'amber',
    accentSecondary: 'green',
    carouselShadow: 'shadow-amber-500/30',
    carouselBorder: 'border-amber-400/20',
    headerBg: 'bg-gradient-to-r from-slate-900/90 via-amber-900/30 to-slate-800/90',
    ctaGradient: 'bg-gradient-to-r from-amber-500 to-green-500',
    ctaHoverGradient: 'hover:from-amber-400 hover:to-green-400',
  },

  // ─── Hero Section ────────────────────────────────────────────────────
  heroBadge: 'Industrial-Grade BESS for Peak Shaving & Load Management',
  heroBadgeIcon: Zap,
  heroHeadline: 'Cut Demand Charges. ',
  heroHeadlineHighlight: 'Protect Production.',
  heroSubtitle: 'Manufacturing facilities pay $15-$30/kW in demand charges. ',
  heroSubtitleHighlight: 'BESS eliminates peak penalties and prevents costly shutdowns.',
  valueProps: [
    { text: '35–50% demand charge reduction', icon: CheckCircle },
    { text: '30% federal tax credit (IRA 2022)', icon: CheckCircle },
    { text: 'Instant backup for critical lines', icon: CheckCircle },
  ],
  heroCTA: 'Calculate My Savings',
  carouselImages: [
    { src: mfg1, alt: 'Manufacturing Facility', caption: 'Industrial Power', subcaption: 'High-demand operations' },
    { src: mfg2, alt: 'Factory Floor', caption: 'Production Lines', subcaption: 'Continuous uptime needed' },
    { src: mfg3, alt: 'Manufacturing Plant', caption: 'Energy-Intensive', subcaption: 'Peak shaving opportunity' },
  ],
  heroCallout: {
    label: 'DEMAND CHARGE',
    value: 'Up to $30/kW',
    bgClass: 'bg-amber-500/90',
    labelClass: 'text-amber-900',
  },
  heroStats: [
    { value: '$250K', label: 'Avg Savings/Year' },
    { value: '3.8yr', label: 'Payback Period' },
    { value: '60%', label: 'Critical Load %' },
  ],
  heroGradientRgba: 'rgba(50,30,10,1)',

  // ─── Calculator ──────────────────────────────────────────────────────
  calculator: {
    inputs: [
      { id: 'squareFootage', label: 'Facility Size', type: 'number', defaultValue: 100000, min: 5000, max: 2000000, step: 5000, suffix: 'sq ft' },
      { id: 'operatingShifts', label: 'Operating Shifts', type: 'select', defaultValue: '2', options: [
        { value: '1', label: '1 Shift (8 hr)' },
        { value: '2', label: '2 Shifts (16 hr)' },
        { value: '3', label: '3 Shifts (24/7)' },
      ] },
      { id: 'hasHeavyMachinery', label: 'Heavy Machinery / CNC', type: 'toggle', defaultValue: true },
      { id: 'currentMonthlyBill', label: 'Monthly Electric Bill', type: 'number', defaultValue: 45000, min: 5000, max: 500000, step: 5000, suffix: '$/mo' },
    ],
    ssotSlug: 'manufacturing',
    bessRatio: 0.40,
    durationHours: 4,
    leadSourceTag: 'manufacturing_vertical',
  },
  quickEstimate: (inputs) => {
    const sqft = Number(inputs.squareFootage) || 100000;
    const shifts = Number(inputs.operatingShifts) || 2;
    const savingsPerSqft = shifts >= 3 ? 3.0 : shifts >= 2 ? 2.5 : 1.8;
    return { savings: Math.round(savingsPerSqft * sqft), payback: 3.8, label: `${(sqft / 1000).toFixed(0)}K sq ft, ${shifts}-shift` };
  },

  // ─── Social Proof ────────────────────────────────────────────────────
  caseStudies: [],
  howItWorks: [
    { title: 'Describe Your Facility', description: 'Enter square footage, shift schedule, and equipment profile. Takes about 60 seconds.' },
    { title: 'Merlin Sizes Your System', description: 'Our AI analyzes load profiles using IEEE 446 industrial standards and ASHRAE benchmarks.' },
    { title: 'Get Your Custom Quote', description: 'Receive a TrueQuote™ proposal with demand charge savings, ROI timeline, and equipment specs.' },
    { title: 'Deploy & Save', description: 'Connect with industrial energy integrators. Start saving on demand charges from day one.' },
  ],

  // ─── Lead Capture ────────────────────────────────────────────────────
  leadSourceTag: 'manufacturing_vertical',
  leadFormCTA: 'Get Your Free Manufacturing Energy Analysis',

  // ─── SEO ─────────────────────────────────────────────────────────────
  pageTitle: 'Manufacturing Battery Storage | Demand Charge Reduction + Backup Power',
  metaDescription: 'BESS solutions for manufacturing. Reduce demand charges 35-50%, protect critical production lines. Free quote in 60 seconds.',
};

registerVertical(manufacturingConfig);
