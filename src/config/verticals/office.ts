import { Building2, CheckCircle } from 'lucide-react';
import type { VerticalConfig } from '../verticalConfig';
import { registerVertical } from '../verticalConfig';

import office1 from '@/assets/images/office_building1.jpg';
import office2 from '@/assets/images/office_building2.jpg';
import office3 from '@/assets/images/office_building3.jpg';

export const officeConfig: VerticalConfig = {
  slug: 'office',
  wizardIndustrySlug: 'office',
  brandName: 'Office',
  brandHighlight: 'Energy',
  brandSubtitle: 'Battery Storage Solutions',
  brandIcon: Building2,
  theme: {
    pageBg: 'bg-gradient-to-br from-indigo-900 via-blue-800 to-slate-900',
    accent: 'indigo',
    accentSecondary: 'blue',
    carouselShadow: 'shadow-indigo-500/30',
    carouselBorder: 'border-indigo-400/20',
    headerBg: 'bg-gradient-to-r from-slate-900/90 via-indigo-900/30 to-slate-800/90',
    ctaGradient: 'bg-gradient-to-r from-indigo-500 to-blue-500',
    ctaHoverGradient: 'hover:from-indigo-400 hover:to-blue-400',
  },
  heroBadge: 'Office Buildings Cut Energy Costs 25-40%',
  heroBadgeIcon: Building2,
  heroHeadline: 'Smarter Energy for ',
  heroHeadlineHighlight: 'Your Office Building',
  heroSubtitle: 'HVAC, elevators, and lighting create costly demand spikes. ',
  heroSubtitleHighlight: 'Battery storage reduces those charges by 35%.',
  valueProps: [
    { text: 'Attract ESG-conscious tenants', icon: CheckCircle },
    { text: '30% federal ITC on all projects', icon: CheckCircle },
    { text: 'Uninterrupted power for critical floors', icon: CheckCircle },
  ],
  heroCTA: 'Calculate My Savings',
  carouselImages: [
    { src: office1, alt: 'Office Building', caption: 'Commercial Office Storage', subcaption: 'Reduce operating costs for tenants' },
    { src: office2, alt: 'Modern Office Tower', caption: 'Smart Building Energy', subcaption: 'ESG goals met and exceeded' },
    { src: office3, alt: 'Office Complex', caption: 'Peak Demand Control', subcaption: 'Cut HVAC demand charges' },
  ],
  heroCallout: { label: 'PEAK DEMAND', value: '50-400 kW', bgClass: 'bg-indigo-500/90', labelClass: 'text-indigo-900' },
  heroStats: [
    { value: '$28K', label: 'Avg Savings/Year' },
    { value: '5.2yr', label: 'Payback Period' },
    { value: '35%', label: 'Demand Reduction' },
  ],
  heroGradientRgba: 'rgba(30,27,75,1)',
  calculator: {
    inputs: [
      { id: 'squareFootage', label: 'Building Size', type: 'number', defaultValue: 50000, min: 5000, max: 1000000, step: 5000, suffix: 'sq ft' },
      { id: 'numberOfFloors', label: 'Number of Floors', type: 'number', defaultValue: 5, min: 1, max: 50, suffix: 'floors' },
      { id: 'hasDataRoom', label: 'Has Server/Data Room', type: 'toggle', defaultValue: false },
      { id: 'currentMonthlyBill', label: 'Monthly Electric Bill', type: 'number', defaultValue: 6000, min: 500, max: 500000, step: 500, suffix: '$/mo' },
    ],
    ssotSlug: 'office',
    bessRatio: 0.40,
    durationHours: 2,
    leadSourceTag: 'office_vertical',
  },
  quickEstimate: (inputs) => {
    const sqft = Number(inputs.squareFootage) || 50000;
    const savings = Math.round((sqft / 1000) * 580);
    return { savings, payback: 5.2, label: `${Math.round(sqft / 1000)}K sq ft` };
  },
  caseStudies: [],
  howItWorks: [
    { title: 'Tell Us About Your Building', description: 'Enter square footage, floors, and occupancy. Takes 60 seconds.' },
    { title: 'We Analyze Your Demand Curve', description: 'Merlin models your HVAC, elevator, and lighting loads using ASHRAE 90.1 benchmarks.' },
    { title: 'Get a Bankable Quote', description: 'Receive a detailed proposal with NPV, IRR, and TrueQuote™ verified pricing from NREL ATB 2024.' },
    { title: 'Lower Your Operating Costs', description: 'Attract tenants, hit ESG targets, and cut your NOI impact from energy. Most projects fund themselves.' },
  ],
  leadSourceTag: 'office_vertical',
  leadFormCTA: 'Get Your Free Office Building Energy Analysis',
  pageTitle: 'Office Building Battery Storage | Reduce Energy Costs 25-40%',
  metaDescription: 'Battery storage for office buildings and commercial real estate. Cut demand charges, improve ESG ratings, and reduce energy costs 25-40%. Free TrueQuote™.',
};

registerVertical(officeConfig);
