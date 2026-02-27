import { Package, CheckCircle } from 'lucide-react';
import type { VerticalConfig } from '../verticalConfig';
import { registerVertical } from '../verticalConfig';

import logistics1 from '@/assets/images/logistics_1.jpg';
import logistics2 from '@/assets/images/logistics_2.jpeg';
import logistics3 from '@/assets/images/logistics_3.jpg';

export const warehouseConfig: VerticalConfig = {
  slug: 'warehouse',
  wizardIndustrySlug: 'warehouse',
  brandName: 'Warehouse',
  brandHighlight: 'Energy',
  brandSubtitle: 'Battery Storage Solutions',
  brandIcon: Package,
  theme: {
    pageBg: 'bg-gradient-to-br from-amber-900 via-orange-800 to-yellow-900',
    accent: 'amber',
    accentSecondary: 'orange',
    carouselShadow: 'shadow-amber-500/30',
    carouselBorder: 'border-amber-400/20',
    headerBg: 'bg-gradient-to-r from-slate-900/90 via-amber-900/30 to-slate-800/90',
    ctaGradient: 'bg-gradient-to-r from-amber-500 to-orange-500',
    ctaHoverGradient: 'hover:from-amber-400 hover:to-orange-400',
  },
  heroBadge: 'Warehouses & Logistics Centers Save 35-50% on Energy',
  heroBadgeIcon: Package,
  heroHeadline: 'Slash Your Warehouse ',
  heroHeadlineHighlight: 'Demand Charges',
  heroSubtitle: 'Dock doors, forklifts, and HVAC cause massive demand spikes. ',
  heroSubtitleHighlight: 'Battery storage cuts those peaks by 45%.',
  valueProps: [
    { text: '$0 down financing available', icon: CheckCircle },
    { text: '30-50% federal tax credit (IRA 2022)', icon: CheckCircle },
    { text: 'Backup power for refrigerated storage', icon: CheckCircle },
  ],
  heroCTA: 'Calculate My Savings',
  carouselImages: [
    { src: logistics1, alt: 'Warehouse Operations', caption: 'Logistics Energy Storage', subcaption: 'Cut peak demand charges' },
    { src: logistics2, alt: 'Distribution Center', caption: 'Distribution Center', subcaption: 'Protect cold chain with backup power' },
    { src: logistics3, alt: 'Warehouse Interior', caption: 'Smart Load Management', subcaption: 'Optimize every shift' },
  ],
  heroCallout: { label: 'PEAK DEMAND', value: '100-500 kW', bgClass: 'bg-amber-500/90', labelClass: 'text-amber-900' },
  heroStats: [
    { value: '$45K', label: 'Avg Savings/Year' },
    { value: '3.8yr', label: 'Payback Period' },
    { value: '45%', label: 'Demand Reduction' },
  ],
  heroGradientRgba: 'rgba(120,53,15,1)',
  calculator: {
    inputs: [
      { id: 'warehouseSqFt', label: 'Warehouse Size', type: 'number', defaultValue: 100000, min: 10000, max: 2000000, step: 10000, suffix: 'sq ft' },
      { id: 'numberOfDockDoors', label: 'Dock Doors', type: 'number', defaultValue: 10, min: 1, max: 100, suffix: 'doors' },
      { id: 'hasRefrigeration', label: 'Refrigerated Storage', type: 'toggle', defaultValue: false },
      { id: 'currentMonthlyBill', label: 'Monthly Electric Bill', type: 'number', defaultValue: 8000, min: 1000, max: 500000, step: 1000, suffix: '$/mo' },
    ],
    ssotSlug: 'warehouse',
    bessRatio: 0.40,
    durationHours: 4,
    leadSourceTag: 'warehouse_vertical',
  },
  quickEstimate: (inputs) => {
    const sqft = Number(inputs.warehouseSqFt) || 100000;
    const savings = Math.round((sqft / 10000) * 4500);
    return { savings, payback: 3.8, label: `${Math.round(sqft / 1000)}K sq ft` };
  },
  caseStudies: [],
  howItWorks: [
    { title: 'Describe Your Facility', description: 'Enter your square footage, dock count, and refrigeration needs. Takes 60 seconds.' },
    { title: 'We Model Your Load Profile', description: 'Merlin uses DOE Commercial Building Energy Data to map your shift patterns and demand spikes.' },
    { title: 'Get Your Storage Quote', description: 'Receive a bankable proposal with payback analysis, equipment specs, and TrueQuote™ verified pricing.' },
    { title: 'Start Cutting Costs', description: 'Most warehouse BESS projects pay back in under 4 years with available incentives.' },
  ],
  leadSourceTag: 'warehouse_vertical',
  leadFormCTA: 'Get Your Free Warehouse Energy Analysis',
  pageTitle: 'Warehouse Battery Storage | Cut Demand Charges 35-50%',
  metaDescription: 'Battery energy storage for warehouses and distribution centers. Slash demand charges 35-50%, protect refrigerated inventory, and reduce energy costs. Free quote.',
};

registerVertical(warehouseConfig);
