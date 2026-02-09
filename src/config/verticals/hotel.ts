/**
 * HOTEL VERTICAL CONFIGURATION
 * ==============================
 * 
 * Pure data configuration for the HotelEnergy landing page.
 * Extracted from HotelEnergy.tsx (1,812 lines) into config-driven format.
 * 
 * Route: /hotelenergy, /hotel
 * Wizard: WizardV7 with initialIndustry='hotel'
 * SSOT Calculator: calculateHotelPowerSimple()
 * 
 * Created: Feb 7, 2026
 */

import { Building2, CheckCircle } from 'lucide-react';
import type { VerticalConfig, CaseStudy } from '../verticalConfig';
import { registerVertical } from '../verticalConfig';

// Image imports
import hotelImage from '@/assets/images/hotel_motel_holidayinn_1.jpg';
import hotelImage3 from '@/assets/images/hotel_motel_holidayinn_2.jpg';
import hotelImage4 from '@/assets/images/hotel_motel_holidayinn_3.jpg';
import hotelImage5 from '@/assets/images/hotel_motel_holidayinn_4.jpg';
import evChargingHotelImage from '@/assets/images/ev_charging_hotel.jpg';

// ─── Case Studies (rich data unique to hotel vertical) ─────────────────
const HOTEL_CASE_STUDIES: CaseStudy[] = [
  {
    id: 'luxury-resort',
    category: 'Premium Hospitality',
    title: 'Luxury Hotel & Resort',
    image: hotelImage,
    annualSavings: 47000,
    paybackYears: 4.2,
    metrics: {
      primaryLabel: 'Property Size',
      primaryValue: '250 rooms',
      batteryKW: 400,
      batteryKWh: 1600,
      solarKW: 300,
      peakDemandReduction: '35%',
      demandChargeSavings: 28000,
      energyArbitrageSavings: 12000,
      incentivesReceived: 85000,
      totalProjectCost: 420000,
      netCost: 335000,
      roi25Year: '625%',
      co2ReductionTons: 180,
    },
  },
  {
    id: 'boutique',
    category: 'Mid-Scale Hotels',
    title: 'Boutique Hotel',
    image: hotelImage,
    annualSavings: 28000,
    paybackYears: 3.8,
    metrics: {
      primaryLabel: 'Property Size',
      primaryValue: '75 rooms',
      batteryKW: 150,
      batteryKWh: 600,
      solarKW: 100,
      peakDemandReduction: '40%',
      demandChargeSavings: 16000,
      energyArbitrageSavings: 8000,
      incentivesReceived: 45000,
      totalProjectCost: 180000,
      netCost: 135000,
      roi25Year: '720%',
      co2ReductionTons: 85,
    },
  },
  {
    id: 'business',
    category: 'Conference Centers',
    title: 'Business Hotel',
    image: hotelImage3,
    annualSavings: 62000,
    paybackYears: 4.5,
    metrics: {
      primaryLabel: 'Property Size',
      primaryValue: '300 rooms',
      batteryKW: 500,
      batteryKWh: 2000,
      solarKW: 400,
      peakDemandReduction: '32%',
      demandChargeSavings: 38000,
      energyArbitrageSavings: 15000,
      incentivesReceived: 120000,
      totalProjectCost: 580000,
      netCost: 460000,
      roi25Year: '580%',
      co2ReductionTons: 240,
    },
  },
  {
    id: 'resort-spa',
    category: 'Resort Properties',
    title: 'Resort & Spa',
    image: hotelImage4,
    annualSavings: 85000,
    paybackYears: 5.2,
    metrics: {
      primaryLabel: 'Property Size',
      primaryValue: '400 rooms',
      batteryKW: 650,
      batteryKWh: 2600,
      solarKW: 550,
      peakDemandReduction: '30%',
      demandChargeSavings: 52000,
      energyArbitrageSavings: 22000,
      incentivesReceived: 175000,
      totalProjectCost: 850000,
      netCost: 675000,
      roi25Year: '550%',
      co2ReductionTons: 320,
    },
  },
  {
    id: 'extended-stay',
    category: 'Long-Term Stays',
    title: 'Extended Stay Hotel',
    image: hotelImage5,
    annualSavings: 35000,
    paybackYears: 3.5,
    metrics: {
      primaryLabel: 'Property Size',
      primaryValue: '120 rooms',
      batteryKW: 200,
      batteryKWh: 800,
      solarKW: 175,
      peakDemandReduction: '38%',
      demandChargeSavings: 22000,
      energyArbitrageSavings: 9000,
      incentivesReceived: 55000,
      totalProjectCost: 220000,
      netCost: 165000,
      roi25Year: '680%',
      co2ReductionTons: 110,
    },
  },
  {
    id: 'ev-amenity',
    category: 'Guest Amenities',
    title: 'Hotel with EV Charging',
    image: evChargingHotelImage,
    annualSavings: 52000,
    paybackYears: 4.0,
    metrics: {
      primaryLabel: 'Property Size',
      primaryValue: '180 rooms',
      batteryKW: 350,
      batteryKWh: 1400,
      solarKW: 250,
      peakDemandReduction: '42%',
      demandChargeSavings: 32000,
      energyArbitrageSavings: 14000,
      incentivesReceived: 95000,
      totalProjectCost: 380000,
      netCost: 285000,
      roi25Year: '650%',
      co2ReductionTons: 165,
    },
  },
];

export const hotelConfig: VerticalConfig = {
  slug: 'hotel',
  wizardIndustrySlug: 'hotel',

  // ─── Branding ────────────────────────────────────────────────────────
  brandName: 'Hotel',
  brandHighlight: 'Energy Partners',
  brandSubtitle: 'Battery Storage for Hospitality',
  brandIcon: Building2,
  theme: {
    pageBg: 'bg-gradient-to-br from-indigo-900 via-purple-800 to-violet-700',
    accent: 'indigo',
    accentSecondary: 'purple',
    carouselShadow: 'shadow-indigo-500/30',
    carouselBorder: 'border-indigo-400/20',
    headerBg: 'bg-gradient-to-r from-slate-900/90 via-purple-900/30 to-slate-800/90',
    ctaGradient: 'bg-gradient-to-r from-purple-600 to-indigo-600',
    ctaHoverGradient: 'hover:from-purple-500 hover:to-indigo-500',
  },

  // ─── Hero Section ────────────────────────────────────────────────────
  heroBadge: 'Hotels Save $35K-85K/year on Energy',
  heroBadgeIcon: Building2,
  heroHeadline: 'Cut Your Hotel\'s ',
  heroHeadlineHighlight: 'Energy Costs by 40%',
  heroSubtitle: 'Pools, HVAC, kitchens, and laundry drive massive demand charges. ',
  heroSubtitleHighlight: 'Battery storage shaves those peaks and pays for itself.',
  valueProps: [
    { text: '$0 down financing', icon: CheckCircle },
    { text: '30% federal tax credit (IRA 2022)', icon: CheckCircle },
    { text: 'Backup power during outages', icon: CheckCircle },
  ],
  heroCTA: 'Calculate My Savings',
  carouselImages: [
    { src: hotelImage, alt: 'Luxury Hotel & Resort', caption: 'Premium Hospitality', subcaption: 'Save $47K+/year', savings: 47000, payback: 4.2 },
    { src: hotelImage, alt: 'Boutique Hotel', caption: 'Mid-Scale Hotels', subcaption: 'Save $28K+/year', savings: 28000, payback: 3.8 },
    { src: hotelImage3, alt: 'Business Hotel', caption: 'Conference Centers', subcaption: 'Save $62K+/year', savings: 62000, payback: 4.5 },
    { src: hotelImage4, alt: 'Resort & Spa', caption: 'Resort Properties', subcaption: 'Save $85K+/year', savings: 85000, payback: 5.2 },
    { src: hotelImage5, alt: 'Extended Stay', caption: 'Long-Term Stays', subcaption: 'Save $35K+/year', savings: 35000, payback: 3.5 },
    { src: evChargingHotelImage, alt: 'Hotel EV Charging', caption: 'Guest Amenities', subcaption: 'EV attracts guests', savings: 52000, payback: 4.0 },
  ],
  heroCallout: {
    label: 'ENERGY COSTS',
    value: '6-8% Revenue',
    bgClass: 'bg-pink-500/90',
    labelClass: 'text-pink-100',
  },
  heroStats: [
    { value: '$52K', label: 'Avg Savings/Year' },
    { value: '3.5yr', label: 'Payback Period' },
    { value: '40%', label: 'Demand Savings' },
  ],
  heroGradientRgba: 'rgba(49,46,129,1)',

  // ─── Calculator ──────────────────────────────────────────────────────
  calculator: {
    inputs: [
      { id: 'numberOfRooms', label: 'Number of Rooms', type: 'number', defaultValue: 150, min: 10, max: 2000, suffix: 'rooms' },
      {
        id: 'hotelClass', label: 'Hotel Class', type: 'select', defaultValue: 'commercial-chain',
        options: [
          { value: 'luxury', label: 'Luxury / Resort' },
          { value: 'economy', label: 'Economy / Budget' },
          { value: 'commercial-chain', label: 'Commercial Chain' },
          { value: 'brand-hotel', label: 'Brand Hotel (Marriott, Hilton)' },
          { value: 'boutique', label: 'Small / Boutique Hotel' },
        ],
      },
      { id: 'currentMonthlyBill', label: 'Monthly Electric Bill', type: 'number', defaultValue: 25000, min: 1000, max: 200000, step: 1000, suffix: '$/mo' },
    ],
    ssotSlug: 'hotel',
    bessRatio: 0.50,
    durationHours: 4,
    leadSourceTag: 'hotel_vertical',
  },
  quickEstimate: (inputs) => {
    const rooms = Number(inputs.numberOfRooms) || 150;
    const hotelClass = String(inputs.hotelClass || 'commercial-chain');
    const savingsPerRoom: Record<string, number> = {
      'luxury': 450, 'brand-hotel': 400, 'commercial-chain': 350,
      'boutique': 350, 'economy': 250,
    };
    const savings = (savingsPerRoom[hotelClass] || 350) * rooms;
    const payback = rooms > 300 ? 4.5 : rooms > 150 ? 3.8 : 3.5;
    return { savings, payback, label: `${rooms} room ${hotelClass}` };
  },

  // ─── Social Proof ────────────────────────────────────────────────────
  caseStudies: HOTEL_CASE_STUDIES,
  socialProofHeadline: 'Hotels Already Saving with Merlin',
  howItWorks: [
    { title: 'Tell Us About Your Hotel', description: 'Enter your hotel\'s room count, amenities, and location. Takes about 60 seconds.' },
    { title: 'Merlin Analyzes Your Needs', description: 'Our AI uses NREL ATB 2024 pricing and DOE-aligned methodology to design the optimal energy solution for your property.' },
    { title: 'Get Your Custom Quote', description: 'Receive a detailed, bank-ready proposal with ROI projections and equipment specs—all with traceable sources.' },
    { title: 'Start Saving Money', description: 'Connect with certified installers and start cutting your hotel\'s energy costs immediately.' },
  ],

  // ─── Lead Capture ────────────────────────────────────────────────────
  leadSourceTag: 'hotel_vertical',
  leadFormCTA: 'Get Your Free Hotel Energy Analysis',

  // ─── SEO ─────────────────────────────────────────────────────────────
  pageTitle: 'Hotel Battery Storage | Save $35K-85K/year on Energy',
  metaDescription: 'Battery storage for hotels and resorts. Reduce demand charges, cut energy costs 40%, and provide backup power. Free analysis in 60 seconds.',
};

// Auto-register
registerVertical(hotelConfig);
