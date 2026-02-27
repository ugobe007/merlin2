import { Plane, CheckCircle } from 'lucide-react';
import type { VerticalConfig } from '../verticalConfig';
import { registerVertical } from '../verticalConfig';

import airport1 from '@/assets/images/airport_1.jpg';
import airport2 from '@/assets/images/airport_2.jpg';
import airports1 from '@/assets/images/airports_1.jpg';
import airport11 from '@/assets/images/airport_11.jpeg';

export const airportConfig: VerticalConfig = {
  slug: 'airport',
  wizardIndustrySlug: 'airport',
  brandName: 'Airport',
  brandHighlight: 'Energy',
  brandSubtitle: 'Battery Storage Solutions',
  brandIcon: Plane,
  theme: {
    pageBg: 'bg-gradient-to-br from-blue-900 via-sky-800 to-slate-900',
    accent: 'blue',
    accentSecondary: 'cyan',
    carouselShadow: 'shadow-blue-500/30',
    carouselBorder: 'border-blue-400/20',
    headerBg: 'bg-gradient-to-r from-slate-900/90 via-blue-900/30 to-slate-800/90',
    ctaGradient: 'bg-gradient-to-r from-blue-500 to-sky-500',
    ctaHoverGradient: 'hover:from-blue-400 hover:to-sky-400',
  },
  heroBadge: 'Airports Cut Energy Costs 25-40% with Battery Storage',
  heroBadgeIcon: Plane,
  heroHeadline: 'Mission-Critical Power ',
  heroHeadlineHighlight: 'for Every Flight',
  heroSubtitle: 'Terminal HVAC, lighting, jet bridges, and baggage systems drive enormous demand charges. ',
  heroSubtitleHighlight: 'Battery storage cuts costs while guaranteeing uptime.',
  valueProps: [
    { text: 'FAA-compliant backup power systems', icon: CheckCircle },
    { text: '30-50% federal ITC on all projects', icon: CheckCircle },
    { text: 'Reduce grid dependency for resilience', icon: CheckCircle },
  ],
  heroCTA: 'Calculate My Savings',
  carouselImages: [
    { src: airport1, alt: 'Airport Terminal', caption: 'Airport Energy Storage', subcaption: 'Uninterrupted power for every gate' },
    { src: airport2, alt: 'Airport Operations', caption: 'Terminal Energy Resilience', subcaption: 'Cut demand charges year-round' },
    { src: airports1, alt: 'Airport Exterior', caption: 'Landside Energy Management', subcaption: 'Ground support and parking' },
    { src: airport11, alt: 'Airport Runway', caption: 'Airside Operations', subcaption: 'Reduce grid demand charges' },
  ],
  heroCallout: { label: 'PEAK DEMAND', value: '1-10 MW', bgClass: 'bg-blue-500/90', labelClass: 'text-blue-900' },
  heroStats: [
    { value: '$250K', label: 'Avg Savings/Year' },
    { value: '5.0yr', label: 'Payback Period' },
    { value: '35%', label: 'Demand Reduction' },
  ],
  heroGradientRgba: 'rgba(23,37,84,1)',
  calculator: {
    inputs: [
      { id: 'annualPassengers', label: 'Annual Passengers', type: 'number', defaultValue: 5000000, min: 100000, max: 100000000, step: 500000, suffix: 'PAX/yr' },
      { id: 'numberOfGates', label: 'Number of Gates', type: 'number', defaultValue: 20, min: 5, max: 300, suffix: 'gates' },
      { id: 'hasSolarCanopy', label: 'Has Solar / Canopy', type: 'toggle', defaultValue: false },
      { id: 'currentMonthlyBill', label: 'Monthly Electric Bill', type: 'number', defaultValue: 150000, min: 10000, max: 5000000, step: 10000, suffix: '$/mo' },
    ],
    ssotSlug: 'airport',
    bessRatio: 0.70,
    durationHours: 4,
    leadSourceTag: 'airport_vertical',
  },
  quickEstimate: (inputs) => {
    const gates = Number(inputs.numberOfGates) || 20;
    const savings = Math.round(gates * 12500);
    return { savings, payback: 5.0, label: `${gates} gates` };
  },
  caseStudies: [],
  howItWorks: [
    { title: 'Describe Your Airport', description: 'Enter passenger volume, gate count, and monthly utility bill. Takes 60 seconds.' },
    { title: 'We Model Terminal Energy Demand', description: 'Merlin uses FAA and DOE aviation benchmarks to calculate your HVAC, jet bridge, and lighting loads.' },
    { title: 'Get a Bankable Proposal', description: 'Full financial model with IRR, NPV, and TrueQuote™ verified pricing from NREL ATB 2024.' },
    { title: 'Ensure Grid Resilience', description: 'Battery storage ensures 100% uptime for critical systems. Most airport projects qualify for 40-50% ITC.' },
  ],
  leadSourceTag: 'airport_vertical',
  leadFormCTA: 'Get Your Free Airport Energy Analysis',
  pageTitle: 'Airport Battery Storage | Mission-Critical Power & 25-40% Energy Savings',
  metaDescription: 'Battery energy storage for airports and aviation facilities. FAA-compliant backup power, cut demand charges 25-40%, and reduce grid dependency with TrueQuote™ verified pricing.',
};

registerVertical(airportConfig);
