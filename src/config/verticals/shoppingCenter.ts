import { ShoppingCart, CheckCircle } from 'lucide-react';
import type { VerticalConfig } from '../verticalConfig';
import { registerVertical } from '../verticalConfig';

import shoppingCenter from '@/assets/images/shopping_center.jpg';
import shoppingCenter1 from '@/assets/images/shopping_center1.jpg';

export const shoppingCenterConfig: VerticalConfig = {
  slug: 'shopping-center',
  wizardIndustrySlug: 'shopping_center',
  brandName: 'Shopping Center',
  brandHighlight: 'Energy',
  brandSubtitle: 'Battery Storage Solutions',
  brandIcon: ShoppingCart,
  theme: {
    pageBg: 'bg-gradient-to-br from-violet-900 via-purple-800 to-indigo-900',
    accent: 'violet',
    accentSecondary: 'indigo',
    carouselShadow: 'shadow-violet-500/30',
    carouselBorder: 'border-violet-400/20',
    headerBg: 'bg-gradient-to-r from-slate-900/90 via-violet-900/30 to-slate-800/90',
    ctaGradient: 'bg-gradient-to-r from-violet-500 to-purple-500',
    ctaHoverGradient: 'hover:from-violet-400 hover:to-purple-400',
  },
  heroBadge: 'Shopping Centers & Malls Save 35-50% on Energy',
  heroBadgeIcon: ShoppingCart,
  heroHeadline: 'Reduce Your Mall\'s ',
  heroHeadlineHighlight: 'Energy Overhead',
  heroSubtitle: 'Common area lighting, HVAC, and escalators drive massive demand charges. ',
  heroSubtitleHighlight: 'Battery storage cuts those costs by 45%.',
  valueProps: [
    { text: 'Lower CAM charges attract tenants', icon: CheckCircle },
    { text: '30-50% federal ITC available', icon: CheckCircle },
    { text: 'Emergency lighting and safety backup', icon: CheckCircle },
  ],
  heroCTA: 'Calculate My Savings',
  carouselImages: [
    { src: shoppingCenter, alt: 'Shopping Center', caption: 'Retail Center Energy Storage', subcaption: 'Cut common area energy costs' },
    { src: shoppingCenter1, alt: 'Shopping Mall', caption: 'Mall Energy Management', subcaption: 'Reduce CAM charges for tenants' },
  ],
  heroCallout: { label: 'PEAK DEMAND', value: '200-1000 kW', bgClass: 'bg-violet-500/90', labelClass: 'text-violet-900' },
  heroStats: [
    { value: '$85K', label: 'Avg Savings/Year' },
    { value: '4.2yr', label: 'Payback Period' },
    { value: '45%', label: 'Demand Reduction' },
  ],
  heroGradientRgba: 'rgba(46,16,101,1)',
  calculator: {
    inputs: [
      { id: 'squareFootage', label: 'Total GLA', type: 'number', defaultValue: 300000, min: 50000, max: 2000000, step: 10000, suffix: 'sq ft' },
      { id: 'numberOfTenants', label: 'Number of Tenants', type: 'number', defaultValue: 50, min: 5, max: 500, suffix: 'tenants' },
      { id: 'hasAnchorStore', label: 'Has Anchor Store', type: 'toggle', defaultValue: true },
      { id: 'currentMonthlyBill', label: 'Monthly Electric Bill', type: 'number', defaultValue: 25000, min: 5000, max: 1000000, step: 2500, suffix: '$/mo' },
    ],
    ssotSlug: 'shopping-center',
    bessRatio: 0.40,
    durationHours: 2,
    leadSourceTag: 'shopping_center_vertical',
  },
  quickEstimate: (inputs) => {
    const sqft = Number(inputs.squareFootage) || 300000;
    const savings = Math.round((sqft / 100000) * 28000);
    return { savings, payback: 4.2, label: `${Math.round(sqft / 1000)}K sq ft GLA` };
  },
  caseStudies: [],
  howItWorks: [
    { title: 'Tell Us About Your Property', description: 'Enter GLA, tenant count, and anchor store info. Takes 60 seconds.' },
    { title: 'We Model Your Common Area Load', description: 'Merlin maps your HVAC, lighting, and escalator loads to find peak demand reduction opportunities.' },
    { title: 'Get a Landlord-Ready Proposal', description: 'Full financial model with CAM savings breakdown, ITC credit, and TrueQuote™ verified pricing.' },
    { title: 'Reduce CAM, Attract Tenants', description: 'Lower common area costs improve tenant retention and NOI. Most projects pay back in 4 years.' },
  ],
  leadSourceTag: 'shopping_center_vertical',
  leadFormCTA: 'Get Your Free Shopping Center Energy Analysis',
  pageTitle: 'Shopping Center Battery Storage | Reduce Energy & CAM Costs 35-50%',
  metaDescription: 'Battery storage for shopping centers and malls. Cut common area energy costs 35-50%, reduce CAM charges, attract tenants, and protect against outages.',
};

registerVertical(shoppingCenterConfig);
