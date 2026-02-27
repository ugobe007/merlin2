import { ShoppingBag, CheckCircle } from 'lucide-react';
import type { VerticalConfig } from '../verticalConfig';
import { registerVertical } from '../verticalConfig';

import retail1 from '@/assets/images/retail_1.jpg';
import retail2 from '@/assets/images/retail_2.jpg';

export const retailConfig: VerticalConfig = {
  slug: 'retail',
  wizardIndustrySlug: 'retail',
  brandName: 'Retail',
  brandHighlight: 'Energy',
  brandSubtitle: 'Battery Storage Solutions',
  brandIcon: ShoppingBag,
  theme: {
    pageBg: 'bg-gradient-to-br from-emerald-900 via-teal-800 to-cyan-900',
    accent: 'emerald',
    accentSecondary: 'teal',
    carouselShadow: 'shadow-emerald-500/30',
    carouselBorder: 'border-emerald-400/20',
    headerBg: 'bg-gradient-to-r from-slate-900/90 via-emerald-900/30 to-slate-800/90',
    ctaGradient: 'bg-gradient-to-r from-emerald-500 to-teal-500',
    ctaHoverGradient: 'hover:from-emerald-400 hover:to-teal-400',
  },
  heroBadge: 'Retail Stores Save 30-45% on Energy Bills',
  heroBadgeIcon: ShoppingBag,
  heroHeadline: 'Cut Your Store\'s ',
  heroHeadlineHighlight: 'Energy Costs Now',
  heroSubtitle: 'Lighting, HVAC, and refrigeration drive massive demand charges. ',
  heroSubtitleHighlight: 'Battery storage slashes those peaks by 40%.',
  valueProps: [
    { text: '$0 down financing available', icon: CheckCircle },
    { text: '30% federal ITC tax credit', icon: CheckCircle },
    { text: 'Keep selling during outages', icon: CheckCircle },
  ],
  heroCTA: 'Calculate My Savings',
  carouselImages: [
    { src: retail1, alt: 'Retail Store', caption: 'Retail Energy Storage', subcaption: 'Cut demand charges year-round' },
    { src: retail2, alt: 'Retail Operations', caption: 'Smart Energy Management', subcaption: 'Stay open during outages' },
  ],
  heroCallout: { label: 'PEAK DEMAND', value: '50-200 kW', bgClass: 'bg-emerald-500/90', labelClass: 'text-emerald-900' },
  heroStats: [
    { value: '$35K', label: 'Avg Savings/Year' },
    { value: '4.5yr', label: 'Payback Period' },
    { value: '40%', label: 'Demand Reduction' },
  ],
  heroGradientRgba: 'rgba(6,78,59,1)',
  calculator: {
    inputs: [
      { id: 'squareFootage', label: 'Store Size', type: 'number', defaultValue: 15000, min: 1000, max: 200000, step: 1000, suffix: 'sq ft' },
      { id: 'operatingHours', label: 'Hours Open Per Day', type: 'number', defaultValue: 12, min: 6, max: 24, suffix: 'hrs' },
      { id: 'hasRefrigeration', label: 'Has Refrigeration', type: 'toggle', defaultValue: true },
      { id: 'currentMonthlyBill', label: 'Monthly Electric Bill', type: 'number', defaultValue: 4500, min: 500, max: 100000, step: 500, suffix: '$/mo' },
    ],
    ssotSlug: 'retail',
    bessRatio: 0.40,
    durationHours: 2,
    leadSourceTag: 'retail_vertical',
  },
  quickEstimate: (inputs) => {
    const sqft = Number(inputs.squareFootage) || 15000;
    const savings = Math.round((sqft / 1000) * 2400);
    return { savings, payback: 4.5, label: `${Math.round(sqft / 1000)}K sq ft` };
  },
  caseStudies: [],
  howItWorks: [
    { title: 'Tell Us About Your Store', description: 'Enter your square footage, operating hours, and location. Takes 60 seconds.' },
    { title: 'Merlin Analyzes Your Demand Profile', description: 'Our AI models your lighting, HVAC, and refrigeration loads using ASHRAE and NREL benchmarks.' },
    { title: 'Get Your Custom BESS Quote', description: 'Receive a detailed proposal with ROI, equipment specs, and TrueQuote™ verified cost sources.' },
    { title: 'Start Saving on Day One', description: 'Connect with certified installers. Most systems qualify for $0-down financing.' },
  ],
  leadSourceTag: 'retail_vertical',
  leadFormCTA: 'Get Your Free Retail Energy Analysis',
  pageTitle: 'Retail Battery Storage | Cut Energy Costs 30-45%',
  metaDescription: 'Battery energy storage for retail stores. Slash demand charges, reduce energy bills 30-45%, and stay open during outages. Free TrueQuote™ in 60 seconds.',
};

registerVertical(retailConfig);
