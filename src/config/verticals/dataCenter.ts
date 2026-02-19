/**
 * DATA CENTER VERTICAL CONFIGURATION
 * ====================================
 * 
 * Route: /data-center-energy
 * Wizard: WizardV7 with initialIndustry='data_center'
 * SSOT Calculator: calculateUseCasePower('data-center', ...)
 * 
 * Created: Feb 2026 — Sprint 2
 */

import { Server, Shield, CheckCircle } from 'lucide-react';
import type { VerticalConfig } from '../verticalConfig';
import { registerVertical } from '../verticalConfig';

import dc1 from '@/assets/images/data-center-1.jpg';
import dc2 from '@/assets/images/data-center-2.jpg';
import dc3 from '@/assets/images/data-center-3.jpg';

export const dataCenterConfig: VerticalConfig = {
  slug: 'data-center',
  wizardIndustrySlug: 'data_center',

  // ─── Branding ────────────────────────────────────────────────────────
  brandName: 'Data Center',
  brandHighlight: 'Energy',
  brandSubtitle: 'Battery Storage Solutions',
  brandIcon: Server,
  theme: {
    pageBg: 'bg-gradient-to-br from-slate-900 via-violet-900 to-indigo-800',
    accent: 'violet',
    accentSecondary: 'cyan',
    carouselShadow: 'shadow-violet-500/30',
    carouselBorder: 'border-violet-400/20',
    headerBg: 'bg-gradient-to-r from-slate-900/90 via-violet-900/30 to-slate-800/90',
    ctaGradient: 'bg-gradient-to-r from-violet-500 to-cyan-500',
    ctaHoverGradient: 'hover:from-violet-400 hover:to-cyan-400',
  },

  // ─── Hero Section ────────────────────────────────────────────────────
  heroBadge: 'Tier III/IV UPS + Peak Shaving in One System',
  heroBadgeIcon: Shield,
  heroHeadline: 'Bulletproof Uptime. ',
  heroHeadlineHighlight: 'Lower Energy Costs.',
  heroSubtitle: 'Data centers can\'t afford downtime. BESS provides UPS-grade backup ',
  heroSubtitleHighlight: 'while cutting demand charges by 40-60%.',
  valueProps: [
    { text: 'UPS-grade backup power', icon: CheckCircle },
    { text: '30% federal tax credit (IRA 2022)', icon: CheckCircle },
    { text: 'Peak shaving + frequency regulation', icon: CheckCircle },
  ],
  heroCTA: 'Calculate My Savings',
  carouselImages: [
    { src: dc1, alt: 'Data Center Server Room', caption: 'Server Infrastructure', subcaption: 'Mission-critical operations' },
    { src: dc2, alt: 'Data Center Cooling', caption: 'Advanced Cooling', subcaption: 'High-density power' },
    { src: dc3, alt: 'Data Center Exterior', caption: 'Modern Facility', subcaption: 'Resilient power architecture' },
  ],
  heroCallout: {
    label: 'PEAK DEMAND',
    value: '500-5,000 kW',
    bgClass: 'bg-violet-500/90',
    labelClass: 'text-violet-900',
  },
  heroStats: [
    { value: '$320K', label: 'Avg Savings/Year' },
    { value: '4.5yr', label: 'Payback Period' },
    { value: '99.99%', label: 'Uptime Target' },
  ],
  heroGradientRgba: 'rgba(30,20,60,1)',

  // ─── Calculator ──────────────────────────────────────────────────────
  calculator: {
    inputs: [
      { id: 'totalITLoadKW', label: 'Total IT Load', type: 'number', defaultValue: 1000, min: 100, max: 50000, suffix: 'kW' },
      { id: 'pueRatio', label: 'PUE Ratio', type: 'number', defaultValue: 1.4, min: 1.0, max: 3.0, step: 0.1, suffix: 'PUE' },
      { id: 'redundancyLevel', label: 'Redundancy Level', type: 'select', defaultValue: 'N+1', options: ['N', 'N+1', '2N', '2N+1'] },
      { id: 'currentMonthlyBill', label: 'Monthly Electric Bill', type: 'number', defaultValue: 80000, min: 5000, max: 1000000, step: 5000, suffix: '$/mo' },
    ],
    ssotSlug: 'data-center',
    bessRatio: 0.50,
    durationHours: 4,
    leadSourceTag: 'datacenter_vertical',
  },
  quickEstimate: (inputs) => {
    const itLoad = Number(inputs.totalITLoadKW) || 1000;
    const pue = Number(inputs.pueRatio) || 1.4;
    const totalKW = itLoad * pue;
    const annualSavings = totalKW * 0.12 * 8760 * 0.08; // ~8% demand charge savings
    return { savings: Math.round(annualSavings), payback: 4.5, label: `${totalKW.toFixed(0)} kW facility` };
  },

  // ─── Social Proof ────────────────────────────────────────────────────
  caseStudies: [],
  howItWorks: [
    { title: 'Describe Your Data Center', description: 'Enter IT load, PUE, and redundancy requirements. Takes about 60 seconds.' },
    { title: 'Merlin Designs Your System', description: 'Our AI sizes BESS for UPS backup + peak shaving using NREL/IEEE standards for Tier III/IV compliance.' },
    { title: 'Get Your Custom Quote', description: 'Receive a TrueQuote™ proposal with ROI projections, equipment specs, and traceable cost sources.' },
    { title: 'Deploy & Save', description: 'Connect with certified integrators. Start cutting demand charges while gaining bulletproof backup power.' },
  ],

  // ─── Lead Capture ────────────────────────────────────────────────────
  leadSourceTag: 'datacenter_vertical',
  leadFormCTA: 'Get Your Free Data Center Energy Analysis',

  // ─── SEO ─────────────────────────────────────────────────────────────
  pageTitle: 'Data Center Battery Storage | UPS + Peak Shaving',
  metaDescription: 'BESS solutions for data centers. UPS-grade backup, peak shaving, and demand charge reduction. Tier III/IV compliant. Free quote in 60 seconds.',
};

registerVertical(dataCenterConfig);
