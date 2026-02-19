/**
 * HOSPITAL VERTICAL CONFIGURATION
 * =================================
 * 
 * Route: /hospital-energy
 * Wizard: WizardV7 with initialIndustry='hospital'
 * SSOT Calculator: calculateUseCasePower('hospital', ...)
 * 
 * Created: Feb 2026 — Sprint 2
 */

import { HeartPulse, Shield, CheckCircle } from 'lucide-react';
import type { VerticalConfig } from '../verticalConfig';
import { registerVertical } from '../verticalConfig';

import hosp1 from '@/assets/images/hospital_1.jpg';
import hosp2 from '@/assets/images/hospital_2.jpg';
import hosp3 from '@/assets/images/hospital_3.jpg';

export const hospitalConfig: VerticalConfig = {
  slug: 'hospital',
  wizardIndustrySlug: 'hospital',

  // ─── Branding ────────────────────────────────────────────────────────
  brandName: 'Hospital',
  brandHighlight: 'Energy',
  brandSubtitle: 'Battery Storage Solutions',
  brandIcon: HeartPulse,
  theme: {
    pageBg: 'bg-gradient-to-br from-red-900 via-rose-800 to-slate-900',
    accent: 'rose',
    accentSecondary: 'emerald',
    carouselShadow: 'shadow-rose-500/30',
    carouselBorder: 'border-rose-400/20',
    headerBg: 'bg-gradient-to-r from-slate-900/90 via-rose-900/30 to-slate-800/90',
    ctaGradient: 'bg-gradient-to-r from-rose-500 to-emerald-500',
    ctaHoverGradient: 'hover:from-rose-400 hover:to-emerald-400',
  },

  // ─── Hero Section ────────────────────────────────────────────────────
  heroBadge: 'NEC 517 / NFPA 99 Compliant BESS Solutions',
  heroBadgeIcon: Shield,
  heroHeadline: 'Lives Depend on ',
  heroHeadlineHighlight: 'Reliable Power.',
  heroSubtitle: 'Hospitals face $7,000-$10,000/hr in lost revenue during outages. ',
  heroSubtitleHighlight: 'BESS provides instant backup + 40% demand charge savings.',
  valueProps: [
    { text: 'Instant transfer (no 10-second gen delay)', icon: CheckCircle },
    { text: '30% federal tax credit (IRA 2022)', icon: CheckCircle },
    { text: 'NEC 517 / NFPA 99 compliant', icon: CheckCircle },
  ],
  heroCTA: 'Calculate My Savings',
  carouselImages: [
    { src: hosp1, alt: 'Modern Hospital', caption: 'Critical Infrastructure', subcaption: 'Always-on power required' },
    { src: hosp2, alt: 'Hospital Power Systems', caption: 'Backup Power', subcaption: 'Seamless failover' },
    { src: hosp3, alt: 'Hospital Exterior', caption: 'Healthcare Facility', subcaption: 'Energy-intensive operations' },
  ],
  heroCallout: {
    label: 'CRITICAL LOAD',
    value: '85% of Peak',
    bgClass: 'bg-rose-500/90',
    labelClass: 'text-rose-900',
  },
  heroStats: [
    { value: '$180K', label: 'Avg Savings/Year' },
    { value: '4.0yr', label: 'Payback Period' },
    { value: '85%', label: 'Critical Load %' },
  ],
  heroGradientRgba: 'rgba(80,20,30,1)',

  // ─── Calculator ──────────────────────────────────────────────────────
  calculator: {
    inputs: [
      { id: 'bedCount', label: 'Number of Beds', type: 'number', defaultValue: 200, min: 25, max: 2000, suffix: 'beds' },
      { id: 'hasDataCenter', label: 'Has Data Center/IT Room', type: 'toggle', defaultValue: true },
      { id: 'hasChillerPlant', label: 'Has Central Chiller Plant', type: 'toggle', defaultValue: true },
      { id: 'currentMonthlyBill', label: 'Monthly Electric Bill', type: 'number', defaultValue: 60000, min: 5000, max: 500000, step: 5000, suffix: '$/mo' },
    ],
    ssotSlug: 'hospital',
    bessRatio: 0.70,
    durationHours: 4,
    leadSourceTag: 'hospital_vertical',
  },
  quickEstimate: (inputs) => {
    const beds = Number(inputs.bedCount) || 200;
    const savingsPerBed = 900;
    return { savings: savingsPerBed * beds, payback: 4.0, label: `${beds} bed facility` };
  },

  // ─── Social Proof ────────────────────────────────────────────────────
  caseStudies: [],
  howItWorks: [
    { title: 'Describe Your Hospital', description: 'Enter bed count, critical systems, and location. Takes about 60 seconds.' },
    { title: 'Merlin Designs Your System', description: 'Our AI sizes BESS per NEC 517/NFPA 99 standards with IEEE 446 critical load percentages.' },
    { title: 'Get Your Custom Quote', description: 'Receive a TrueQuote™ proposal with ROI projections, equipment specs, and compliance documentation.' },
    { title: 'Deploy & Protect', description: 'Connect with certified healthcare power integrators. Instant backup + ongoing demand charge savings.' },
  ],

  // ─── Lead Capture ────────────────────────────────────────────────────
  leadSourceTag: 'hospital_vertical',
  leadFormCTA: 'Get Your Free Hospital Energy Analysis',

  // ─── SEO ─────────────────────────────────────────────────────────────
  pageTitle: 'Hospital Battery Storage | Critical Backup + Demand Savings',
  metaDescription: 'BESS solutions for hospitals. NEC 517/NFPA 99 compliant backup power with 40% demand charge savings. Free quote in 60 seconds.',
};

registerVertical(hospitalConfig);
