/**
 * CAR WASH VERTICAL CONFIGURATION
 * ================================
 * 
 * Pure data configuration for the CarWashEnergy landing page.
 * Extracted from CarWashEnergy.tsx (1,278 lines) into config-driven format.
 * 
 * Route: /carwashenergy, /car-wash
 * Wizard: WizardV7 with initialIndustry='car_wash'
 * SSOT Calculator: calculateCarWashPowerSimple()
 * 
 * Created: Feb 7, 2026
 */

import { Droplets, Car, CheckCircle } from 'lucide-react';
import type { VerticalConfig } from '../verticalConfig';
import { registerVertical } from '../verticalConfig';

// Image imports
import carWashImage from '@/assets/images/car_wash_1.jpg';
import carWashTunnel from '@/assets/images/car_wash_tunnel.jpg';
import carWashRobot from '@/assets/images/car_wash_robot.jpg';
import carWashPitStop from '@/assets/images/Car_Wash_PitStop.jpg';
import carWashPitStop1 from '@/assets/images/Car_Wash_PitStop1.jpg';
import carWashPitStop2 from '@/assets/images/Car_Wash_PitStop2.jpg';
import carWashPitStop3 from '@/assets/images/Car_Wash_PitStop3.jpg';
import carWashPitStop4 from '@/assets/images/Car_Wash_PitStop4.jpg';
import carWashPitStop5 from '@/assets/images/Car_Wash_PitStop5.jpg';
import carWashPreen from '@/assets/images/Car_Wash_Preen.jpg';

export const carWashConfig: VerticalConfig = {
  slug: 'car-wash',
  wizardIndustrySlug: 'car_wash',

  // ─── Branding ────────────────────────────────────────────────────────
  brandName: 'CarWash',
  brandHighlight: 'Energy',
  brandSubtitle: 'Battery Storage Solutions',
  brandIcon: Droplets,
  theme: {
    pageBg: 'bg-gradient-to-br from-blue-900 via-cyan-800 to-teal-700',
    accent: 'cyan',
    accentSecondary: 'emerald',
    carouselShadow: 'shadow-cyan-500/30',
    carouselBorder: 'border-cyan-400/20',
    headerBg: 'bg-gradient-to-r from-slate-900/90 via-purple-900/30 to-slate-800/90',
    ctaGradient: 'bg-gradient-to-r from-emerald-500 to-cyan-500',
    ctaHoverGradient: 'hover:from-emerald-400 hover:to-cyan-400',
  },

  // ─── Hero Section ────────────────────────────────────────────────────
  heroBadge: 'Car Wash Owners Save 30-50% on Energy',
  heroBadgeIcon: Car,
  heroHeadline: 'Stop Overpaying for ',
  heroHeadlineHighlight: 'Electricity!',
  heroSubtitle: 'High-powered dryers, pumps, and vacuums spike your demand charges. ',
  heroSubtitleHighlight: 'Battery storage cuts those peaks by 50%.',
  valueProps: [
    { text: '$0 down financing', icon: CheckCircle },
    { text: '30% federal tax credit', icon: CheckCircle },
    { text: 'Keep washing during outages', icon: CheckCircle },
  ],
  heroCTA: 'Calculate My Savings',
  carouselImages: [
    { src: carWashPitStop, alt: 'PitStop Car Wash', caption: 'Professional Service', subcaption: 'Industry-leading results' },
    { src: carWashPitStop1, alt: 'PitStop Express Bay', caption: 'Express Tunnel', subcaption: 'High-volume efficiency' },
    { src: carWashPitStop2, alt: 'PitStop Premium Service', caption: 'Premium Detailing', subcaption: 'Superior customer experience' },
    { src: carWashPitStop3, alt: 'PitStop Wash System', caption: 'Advanced Equipment', subcaption: 'Energy-intensive operations' },
    { src: carWashPitStop4, alt: 'PitStop Operations', caption: 'Streamlined Process', subcaption: 'Optimized for savings' },
    { src: carWashPitStop5, alt: 'PitStop Full Service', caption: 'Full Service Wash', subcaption: 'Complete car care' },
    { src: carWashPreen, alt: 'Preen Car Wash', caption: 'Modern Facility', subcaption: 'Next-gen technology' },
    { src: carWashTunnel, alt: 'Modern Car Wash Tunnel', caption: 'High-Tech Equipment', subcaption: 'Energy-intensive operations' },
    { src: carWashRobot, alt: 'Car Being Washed', caption: 'Premium Service', subcaption: 'Consistent quality results' },
    { src: carWashImage, alt: 'Car Wash Interior', caption: 'Efficient Operations', subcaption: 'Optimized for savings' },
  ],
  heroCallout: {
    label: 'PEAK DEMAND',
    value: '100-250 kW',
    bgClass: 'bg-amber-500/90',
    labelClass: 'text-amber-900',
  },
  heroStats: [
    { value: '$47K', label: 'Avg Savings/Year' },
    { value: '3.2yr', label: 'Payback Period' },
    { value: '50%', label: 'Demand Savings' },
  ],
  heroGradientRgba: 'rgba(30,58,138,1)',

  // ─── Calculator ──────────────────────────────────────────────────────
  calculator: {
    inputs: [
      { id: 'numberOfBays', label: 'Number of Bays', type: 'number', defaultValue: 4, min: 1, max: 20, suffix: 'bays' },
      { id: 'carsPerDay', label: 'Cars Per Day', type: 'number', defaultValue: 150, min: 10, max: 1000, suffix: 'cars' },
      { id: 'includesVacuums', label: 'Includes Vacuums', type: 'toggle', defaultValue: true },
      { id: 'includesDryers', label: 'Includes Dryers', type: 'toggle', defaultValue: true },
      { id: 'currentMonthlyBill', label: 'Monthly Electric Bill', type: 'number', defaultValue: 5000, min: 500, max: 50000, step: 500, suffix: '$/mo' },
    ],
    ssotSlug: 'car-wash',
    bessRatio: 0.50,
    durationHours: 2,
    leadSourceTag: 'carwash_vertical',
  },
  quickEstimate: (inputs) => {
    const bays = Number(inputs.numberOfBays) || 4;
    const savingsPerBay = 11000;
    return { savings: savingsPerBay * bays, payback: 3.0, label: `${bays} bay` };
  },

  // ─── Social Proof ────────────────────────────────────────────────────
  caseStudies: [], // Car wash currently has no detailed case studies (Phase 2: add them)
  howItWorks: [
    { title: 'Tell Us About Your Car Wash', description: 'Enter your bay count, equipment, and location. Takes about 60 seconds.' },
    { title: 'Merlin Analyzes Your Needs', description: 'Our AI uses NREL ATB 2024 pricing and DOE-aligned methodology to design the optimal battery storage system.' },
    { title: 'Get Your Custom Quote', description: 'Receive a detailed proposal with ROI projections, equipment specs, and traceable cost sources.' },
    { title: 'Start Saving Money', description: 'Connect with certified installers and start cutting your energy costs immediately.' },
  ],

  // ─── Lead Capture ────────────────────────────────────────────────────
  leadSourceTag: 'carwash_vertical',
  leadFormCTA: 'Get Your Free Car Wash Energy Analysis',

  // ─── SEO ─────────────────────────────────────────────────────────────
  pageTitle: 'Car Wash Battery Storage | Reduce Energy Costs 30-50%',
  metaDescription: 'Battery storage solutions for car washes. Cut demand charges, reduce energy costs, and keep washing during outages. Free quote in 60 seconds.',
};

// Auto-register
registerVertical(carWashConfig);
