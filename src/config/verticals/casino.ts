import { Dice5, CheckCircle } from 'lucide-react';
import type { VerticalConfig } from '../verticalConfig';
import { registerVertical } from '../verticalConfig';

import casino1 from '@/assets/images/casino_gaming1.jpg';
import casino2 from '@/assets/images/casino_gaming2.jpeg';

export const casinoConfig: VerticalConfig = {
  slug: 'casino',
  wizardIndustrySlug: 'casino',
  brandName: 'Casino',
  brandHighlight: 'Energy',
  brandSubtitle: 'Battery Storage Solutions',
  brandIcon: Dice5,
  theme: {
    pageBg: 'bg-gradient-to-br from-yellow-900 via-amber-900 to-slate-900',
    accent: 'amber',
    accentSecondary: 'violet',
    carouselShadow: 'shadow-amber-500/30',
    carouselBorder: 'border-amber-400/20',
    headerBg: 'bg-gradient-to-r from-slate-900/90 via-amber-900/30 to-slate-800/90',
    ctaGradient: 'bg-gradient-to-r from-amber-500 to-yellow-500',
    ctaHoverGradient: 'hover:from-amber-400 hover:to-yellow-400',
  },
  heroBadge: 'Casinos & Gaming Facilities Save 30-45% on Energy',
  heroBadgeIcon: Dice5,
  heroHeadline: '24/7 Operations Deserve ',
  heroHeadlineHighlight: 'Resilient Power',
  heroSubtitle: 'Slot machines, lighting, HVAC, and hotels never stop running. ',
  heroSubtitleHighlight: 'Battery storage ensures zero downtime and massive savings.',
  valueProps: [
    { text: 'Zero downtime — even during grid events', icon: CheckCircle },
    { text: '30-50% federal tax credit available', icon: CheckCircle },
    { text: 'Revenue stack: DR + peak shaving', icon: CheckCircle },
  ],
  heroCTA: 'Calculate My Savings',
  carouselImages: [
    { src: casino1, alt: 'Casino Gaming Floor', caption: 'Casino Energy Resilience', subcaption: '24/7 uptime guaranteed' },
    { src: casino2, alt: 'Gaming Operations', caption: 'Non-Stop Operations', subcaption: 'Eliminate costly power interruptions' },
  ],
  heroCallout: { label: 'PEAK DEMAND', value: '500-3000 kW', bgClass: 'bg-amber-500/90', labelClass: 'text-amber-900' },
  heroStats: [
    { value: '$120K', label: 'Avg Savings/Year' },
    { value: '3.8yr', label: 'Payback Period' },
    { value: '40%', label: 'Demand Reduction' },
  ],
  heroGradientRgba: 'rgba(69,26,3,1)',
  calculator: {
    inputs: [
      { id: 'gamingFloorSqft', label: 'Gaming Floor', type: 'number', defaultValue: 100000, min: 10000, max: 500000, step: 10000, suffix: 'sq ft' },
      { id: 'numberOfSlotMachines', label: 'Slot Machines', type: 'number', defaultValue: 500, min: 50, max: 5000, step: 50, suffix: 'machines' },
      { id: 'hasHotel', label: 'Attached Hotel', type: 'toggle', defaultValue: false },
      { id: 'currentMonthlyBill', label: 'Monthly Electric Bill', type: 'number', defaultValue: 40000, min: 5000, max: 2000000, step: 5000, suffix: '$/mo' },
    ],
    ssotSlug: 'casino',
    bessRatio: 0.70,
    durationHours: 4,
    leadSourceTag: 'casino_vertical',
  },
  quickEstimate: (inputs) => {
    const sqft = Number(inputs.gamingFloorSqft) || 100000;
    const savings = Math.round((sqft / 10000) * 12000);
    return { savings, payback: 3.8, label: `${Math.round(sqft / 1000)}K sq ft gaming` };
  },
  caseStudies: [],
  howItWorks: [
    { title: 'Tell Us About Your Property', description: 'Enter gaming floor size, machine count, and monthly bill. Takes 60 seconds.' },
    { title: 'We Model Your 24/7 Load', description: 'Merlin calculates your slot machine, HVAC, and lighting loads to find peak reduction opportunities.' },
    { title: 'Get a Bankable Proposal', description: 'Full financial model with demand charge savings, DR revenue, and TrueQuote™ verified pricing.' },
    { title: 'Ensure Zero Downtime', description: 'Battery backup prevents revenue loss from power events. Most casino systems pay back in 4 years.' },
  ],
  leadSourceTag: 'casino_vertical',
  leadFormCTA: 'Get Your Free Casino Energy Analysis',
  pageTitle: 'Casino Battery Storage | Ensure 24/7 Uptime & Save 30-45% on Energy',
  metaDescription: 'Battery energy storage for casinos and gaming facilities. Guarantee 24/7 uptime, cut demand charges 30-45%, and stack revenue from demand response programs.',
};

registerVertical(casinoConfig);
