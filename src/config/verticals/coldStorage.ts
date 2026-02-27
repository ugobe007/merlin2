import { Thermometer, CheckCircle } from 'lucide-react';
import type { VerticalConfig } from '../verticalConfig';
import { registerVertical } from '../verticalConfig';

import coldStorage from '@/assets/images/cold_storage.jpg';
import logistics1 from '@/assets/images/logistics_1.jpg';

export const coldStorageConfig: VerticalConfig = {
  slug: 'cold-storage',
  wizardIndustrySlug: 'cold_storage',
  brandName: 'Cold Storage',
  brandHighlight: 'Energy',
  brandSubtitle: 'Battery Storage Solutions',
  brandIcon: Thermometer,
  theme: {
    pageBg: 'bg-gradient-to-br from-cyan-900 via-blue-800 to-slate-900',
    accent: 'cyan',
    accentSecondary: 'blue',
    carouselShadow: 'shadow-cyan-500/30',
    carouselBorder: 'border-cyan-400/20',
    headerBg: 'bg-gradient-to-r from-slate-900/90 via-cyan-900/30 to-slate-800/90',
    ctaGradient: 'bg-gradient-to-r from-cyan-500 to-blue-500',
    ctaHoverGradient: 'hover:from-cyan-400 hover:to-blue-400',
  },
  heroBadge: 'Cold Storage Facilities Save 40-55% on Energy',
  heroBadgeIcon: Thermometer,
  heroHeadline: 'Protect Your Cold Chain ',
  heroHeadlineHighlight: 'and Cut Energy Costs',
  heroSubtitle: 'Refrigeration compressors create extreme demand spikes. ',
  heroSubtitleHighlight: 'Battery storage saves up to 55% — and protects inventory during outages.',
  valueProps: [
    { text: 'FDA-compliant backup power for cold chain', icon: CheckCircle },
    { text: '30-50% federal tax credit (IRA 2022)', icon: CheckCircle },
    { text: 'Eliminate costly demand spikes', icon: CheckCircle },
  ],
  heroCTA: 'Calculate My Savings',
  carouselImages: [
    { src: coldStorage, alt: 'Cold Storage Warehouse', caption: 'Cold Chain Protection', subcaption: 'Keep inventory safe during outages' },
    { src: logistics1, alt: 'Refrigerated Logistics', caption: 'Refrigerated Distribution', subcaption: 'Cut compressor demand charges by 50%' },
  ],
  heroCallout: { label: 'PEAK DEMAND', value: '150-800 kW', bgClass: 'bg-cyan-500/90', labelClass: 'text-cyan-900' },
  heroStats: [
    { value: '$65K', label: 'Avg Savings/Year' },
    { value: '4.0yr', label: 'Payback Period' },
    { value: '50%', label: 'Demand Reduction' },
  ],
  heroGradientRgba: 'rgba(8,47,73,1)',
  calculator: {
    inputs: [
      { id: 'storageSqFt', label: 'Refrigerated Space', type: 'number', defaultValue: 50000, min: 5000, max: 500000, step: 5000, suffix: 'sq ft' },
      { id: 'temperatureZones', label: 'Temperature Zones', type: 'number', defaultValue: 2, min: 1, max: 10, suffix: 'zones' },
      { id: 'hasFreezer', label: 'Includes Freezer (-20°F)', type: 'toggle', defaultValue: true },
      { id: 'currentMonthlyBill', label: 'Monthly Electric Bill', type: 'number', defaultValue: 15000, min: 2000, max: 500000, step: 1000, suffix: '$/mo' },
    ],
    ssotSlug: 'cold-storage',
    bessRatio: 0.70,
    durationHours: 4,
    leadSourceTag: 'cold_storage_vertical',
  },
  quickEstimate: (inputs) => {
    const sqft = Number(inputs.storageSqFt) || 50000;
    const savings = Math.round((sqft / 10000) * 13000);
    return { savings, payback: 4.0, label: `${Math.round(sqft / 1000)}K sq ft` };
  },
  caseStudies: [],
  howItWorks: [
    { title: 'Describe Your Facility', description: 'Enter your refrigerated square footage, temperature zones, and monthly bill. 60 seconds.' },
    { title: 'We Model Your Compressor Load', description: 'Merlin analyzes your refrigeration cycles and demand spikes using DOE energy benchmarks.' },
    { title: 'Get a Bankable Proposal', description: 'Full financial model: payback, NPV, IRR, and TrueQuote™ verified equipment pricing.' },
    { title: 'Protect Inventory and Save', description: 'Battery backup prevents costly spoilage. Demand savings pay back in 3-5 years.' },
  ],
  leadSourceTag: 'cold_storage_vertical',
  leadFormCTA: 'Get Your Free Cold Storage Energy Analysis',
  pageTitle: 'Cold Storage Battery Backup | Protect Inventory & Cut Energy 40-55%',
  metaDescription: 'Battery storage for cold storage and refrigerated warehouses. Protect inventory during outages, cut demand charges 40-55%, and meet FDA cold chain requirements.',
};

registerVertical(coldStorageConfig);
