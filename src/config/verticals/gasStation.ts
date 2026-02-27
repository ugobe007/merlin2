import { Fuel, CheckCircle } from 'lucide-react';
import type { VerticalConfig } from '../verticalConfig';
import { registerVertical } from '../verticalConfig';

import truckStop from '@/assets/images/truck_stop.jpg';
import lovesTruck from '@/assets/images/loves_truck.png';

export const gasStationConfig: VerticalConfig = {
  slug: 'gas-station',
  wizardIndustrySlug: 'gas_station',
  brandName: 'Gas Station',
  brandHighlight: 'Energy',
  brandSubtitle: 'Battery Storage Solutions',
  brandIcon: Fuel,
  theme: {
    pageBg: 'bg-gradient-to-br from-yellow-900 via-amber-800 to-orange-900',
    accent: 'amber',
    accentSecondary: 'orange',
    carouselShadow: 'shadow-yellow-500/30',
    carouselBorder: 'border-yellow-400/20',
    headerBg: 'bg-gradient-to-r from-slate-900/90 via-yellow-900/30 to-slate-800/90',
    ctaGradient: 'bg-gradient-to-r from-yellow-500 to-amber-500',
    ctaHoverGradient: 'hover:from-yellow-400 hover:to-amber-400',
  },
  heroBadge: 'Gas Stations & Truck Stops Save 30-45% on Energy',
  heroBadgeIcon: Fuel,
  heroHeadline: 'Power Your Forecourt ',
  heroHeadlineHighlight: 'For Less',
  heroSubtitle: 'Canopy lighting, dispensers, C-store HVAC, and EV chargers spike your bills. ',
  heroSubtitleHighlight: 'Battery storage flattens those demand charges.',
  valueProps: [
    { text: 'Stay open during grid outages', icon: CheckCircle },
    { text: '30% ITC + state rebates available', icon: CheckCircle },
    { text: 'Add EV charging without new service', icon: CheckCircle },
  ],
  heroCTA: 'Calculate My Savings',
  carouselImages: [
    { src: truckStop, alt: 'Truck Stop Fuel Station', caption: 'Fuel & Truck Stop Energy', subcaption: 'Keep every pump running' },
    { src: lovesTruck, alt: "Love's Truck Stop", caption: "Travel Center Operations", subcaption: 'Cut demand charges at the pump' },
  ],
  heroCallout: { label: 'PEAK DEMAND', value: '30-150 kW', bgClass: 'bg-yellow-500/90', labelClass: 'text-yellow-900' },
  heroStats: [
    { value: '$18K', label: 'Avg Savings/Year' },
    { value: '3.5yr', label: 'Payback Period' },
    { value: '45%', label: 'Demand Reduction' },
  ],
  heroGradientRgba: 'rgba(113,63,18,1)',
  calculator: {
    inputs: [
      { id: 'numberOfDispensers', label: 'Fuel Dispensers', type: 'number', defaultValue: 8, min: 2, max: 40, suffix: 'dispensers' },
      { id: 'hasConvenienceStore', label: 'Has C-Store', type: 'toggle', defaultValue: true },
      { id: 'hasEVChargers', label: 'Has EV Chargers', type: 'toggle', defaultValue: false },
      { id: 'currentMonthlyBill', label: 'Monthly Electric Bill', type: 'number', defaultValue: 2500, min: 300, max: 50000, step: 300, suffix: '$/mo' },
    ],
    ssotSlug: 'gas-station',
    bessRatio: 0.50,
    durationHours: 2,
    leadSourceTag: 'gas_station_vertical',
  },
  quickEstimate: (inputs) => {
    const dispensers = Number(inputs.numberOfDispensers) || 8;
    const savings = Math.round(dispensers * 2200);
    return { savings, payback: 3.5, label: `${dispensers} dispensers` };
  },
  caseStudies: [],
  howItWorks: [
    { title: 'Tell Us About Your Station', description: 'Enter your dispenser count, C-store size, and location. Takes 60 seconds.' },
    { title: 'We Model Your Demand Spikes', description: 'Merlin analyzes canopy lighting, HVAC, and dispenser loads to find your peak demand window.' },
    { title: 'Get Your Storage Quote', description: 'Receive a full proposal with payback, ITC credit, and TrueQuote™ verified pricing.' },
    { title: 'Stay Open and Save', description: 'Battery backup keeps every pump running during outages. Most systems pay back in 3-4 years.' },
  ],
  leadSourceTag: 'gas_station_vertical',
  leadFormCTA: 'Get Your Free Gas Station Energy Analysis',
  pageTitle: 'Gas Station Battery Storage | Cut Energy & Stay Open During Outages',
  metaDescription: 'Battery storage for gas stations and truck stops. Cut demand charges 30-45%, add EV charging without new service upgrades, and keep pumps running during outages.',
};

registerVertical(gasStationConfig);
