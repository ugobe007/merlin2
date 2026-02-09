/**
 * EV CHARGING VERTICAL CONFIGURATION
 * ====================================
 * 
 * Pure data configuration for the EVChargingEnergy landing page.
 * Extracted from EVChargingEnergy.tsx (1,152 lines) into config-driven format.
 * 
 * Route: /evchargingenergy, /ev-charging
 * Wizard: WizardV7 with initialIndustry='ev_charging'
 * SSOT Calculator: calculateEVChargingPowerSimple()
 * 
 * Created: Feb 7, 2026
 */

import { Zap, Bolt, CheckCircle } from 'lucide-react';
import type { VerticalConfig } from '../verticalConfig';
import { registerVertical } from '../verticalConfig';

// Image imports
import evChargingImage from '@/assets/images/ev_charging_station.jpg';
import evChargingHotelImage from '@/assets/images/ev_charging_hotel.jpg';

export const evChargingConfig: VerticalConfig = {
  slug: 'ev-charging',
  wizardIndustrySlug: 'ev_charging',

  // ─── Branding ────────────────────────────────────────────────────────
  brandName: 'EV Charging',
  brandHighlight: 'Power',
  brandSubtitle: 'Battery Storage for Charging Stations',
  brandIcon: Zap,
  theme: {
    pageBg: 'bg-gradient-to-br from-emerald-900 via-teal-800 to-green-700',
    accent: 'emerald',
    accentSecondary: 'teal',
    carouselShadow: 'shadow-emerald-500/30',
    carouselBorder: 'border-emerald-400/20',
    headerBg: 'bg-gradient-to-r from-slate-900/90 via-emerald-900/30 to-slate-800/90',
    ctaGradient: 'bg-gradient-to-r from-emerald-500 to-teal-500',
    ctaHoverGradient: 'hover:from-emerald-400 hover:to-teal-400',
  },

  // ─── Hero Section ────────────────────────────────────────────────────
  heroBadge: 'EV Charging Stations Save 40-60% on Demand Charges',
  heroBadgeIcon: Bolt,
  heroHeadline: 'Slash Your ',
  heroHeadlineHighlight: 'Demand Charges!',
  heroSubtitle: 'DCFC and HPC chargers create massive demand spikes that crush your margins. ',
  heroSubtitleHighlight: 'Battery storage buffers those peaks and saves $15K+/month.',
  valueProps: [
    { text: '$0 down financing', icon: CheckCircle },
    { text: '30% federal tax credit', icon: CheckCircle },
    { text: 'Avoid $500K+ grid upgrades', icon: CheckCircle },
  ],
  heroCTA: 'Calculate My Savings',
  carouselImages: [
    { src: evChargingImage, alt: 'EV Charging Station', caption: 'DC Fast Charging', subcaption: 'High-power demand spikes' },
    { src: evChargingHotelImage, alt: 'EV Charging at Hotel', caption: 'Destination Charging', subcaption: 'Guest amenity revenue' },
  ],
  heroCallout: {
    label: 'DEMAND SPIKES',
    value: '$15K+/mo',
    bgClass: 'bg-red-500/90',
    labelClass: 'text-red-100',
  },
  heroStats: [
    { value: '$90K', label: 'Avg Savings/Year' },
    { value: '2.8yr', label: 'Payback Period' },
    { value: '60%', label: 'Demand Savings' },
  ],
  heroGradientRgba: 'rgba(6,78,59,1)',

  // ─── Calculator ──────────────────────────────────────────────────────
  calculator: {
    inputs: [
      { id: 'level2Ports', label: 'Level 2 Ports', type: 'number', defaultValue: 4, min: 0, max: 100, suffix: 'ports' },
      { id: 'dcfcPorts', label: 'DC Fast Chargers', type: 'number', defaultValue: 4, min: 0, max: 50, suffix: 'DCFC' },
      { id: 'hpcPorts', label: 'HPC Chargers (250kW)', type: 'number', defaultValue: 2, min: 0, max: 20, suffix: 'HPC' },
      { id: 'utilizationPercent', label: 'Average Utilization', type: 'slider', defaultValue: 40, min: 10, max: 90, step: 5, suffix: '%' },
      { id: 'currentMonthlyBill', label: 'Monthly Electric Bill', type: 'number', defaultValue: 15000, min: 1000, max: 200000, step: 1000, suffix: '$/mo' },
    ],
    ssotSlug: 'ev-charging',
    bessRatio: 0.50,
    durationHours: 2,
    leadSourceTag: 'ev_charging_vertical',
  },
  quickEstimate: (inputs) => {
    const level2 = Number(inputs.level2Ports) || 4;
    const dcfc = Number(inputs.dcfcPorts) || 4;
    const hpc = Number(inputs.hpcPorts) || 2;
    const savingsPerPort: Record<string, number> = { level2: 2000, dcfc: 15000, hpc: 25000 };
    const savings = level2 * savingsPerPort.level2 + dcfc * savingsPerPort.dcfc + hpc * savingsPerPort.hpc;
    const totalPorts = level2 + dcfc + hpc;
    const payback = totalPorts > 10 ? 2.5 : totalPorts > 5 ? 3.0 : 3.5;
    return { savings, payback, label: `${totalPorts} ports` };
  },

  // ─── Social Proof ────────────────────────────────────────────────────
  caseStudies: [], // Phase 2: Add EV charging case studies
  howItWorks: [
    { title: 'Tell Us About Your Charging Station', description: 'Enter your charger types, port counts, and location. Takes about 60 seconds.' },
    { title: 'Merlin Analyzes Your Demand Profile', description: 'Our AI models your charging patterns and demand spikes to size the optimal battery storage system.' },
    { title: 'Get Your Custom Quote', description: 'Receive a detailed proposal with demand charge savings, ROI projections, and equipment specs.' },
    { title: 'Start Saving Money', description: 'Avoid grid upgrade costs, slash demand charges, and increase charger uptime.' },
  ],

  // ─── Lead Capture ────────────────────────────────────────────────────
  leadSourceTag: 'ev_charging_vertical',
  leadFormCTA: 'Get Your Free EV Charging Analysis',

  // ─── SEO ─────────────────────────────────────────────────────────────
  pageTitle: 'EV Charging Battery Storage | Slash Demand Charges 40-60%',
  metaDescription: 'Battery storage for EV charging stations. Eliminate demand spikes, avoid grid upgrades, and increase profitability. Free analysis in 60 seconds.',
};

// Auto-register
registerVertical(evChargingConfig);
