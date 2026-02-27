import { GraduationCap, CheckCircle } from 'lucide-react';
import type { VerticalConfig } from '../verticalConfig';
import { registerVertical } from '../verticalConfig';

import college1 from '@/assets/images/college_1.jpg';
import college3 from '@/assets/images/college_3.jpg';
import college4 from '@/assets/images/college_4.jpg';
import college5 from '@/assets/images/college_5.jpg';

export const collegeConfig: VerticalConfig = {
  slug: 'college',
  wizardIndustrySlug: 'college',
  brandName: 'College',
  brandHighlight: 'Energy',
  brandSubtitle: 'Battery Storage Solutions',
  brandIcon: GraduationCap,
  theme: {
    pageBg: 'bg-gradient-to-br from-indigo-900 via-violet-800 to-purple-900',
    accent: 'indigo',
    accentSecondary: 'violet',
    carouselShadow: 'shadow-indigo-500/30',
    carouselBorder: 'border-indigo-400/20',
    headerBg: 'bg-gradient-to-r from-slate-900/90 via-indigo-900/30 to-slate-800/90',
    ctaGradient: 'bg-gradient-to-r from-indigo-500 to-violet-500',
    ctaHoverGradient: 'hover:from-indigo-400 hover:to-violet-400',
  },
  heroBadge: 'Colleges & Universities Save 30-45% on Campus Energy',
  heroBadgeIcon: GraduationCap,
  heroHeadline: 'Power Your Campus ',
  heroHeadlineHighlight: 'Sustainably',
  heroSubtitle: 'Dormitories, labs, and data centers drive massive utility bills. ',
  heroSubtitleHighlight: 'Battery storage cuts costs and helps hit your sustainability goals.',
  valueProps: [
    { text: 'Meet carbon neutrality commitments', icon: CheckCircle },
    { text: '30-50% federal ITC (IRA 2022)', icon: CheckCircle },
    { text: 'Backup power for research and critical labs', icon: CheckCircle },
  ],
  heroCTA: 'Calculate Campus Savings',
  carouselImages: [
    { src: college1, alt: 'University Campus', caption: 'Campus Energy Storage', subcaption: 'Reduce utility costs across all buildings' },
    { src: college3, alt: 'College Buildings', caption: 'Sustainable Campus Power', subcaption: 'Meet your carbon neutrality goals' },
    { src: college4, alt: 'University Grounds', caption: 'Research Lab Protection', subcaption: 'Uninterrupted power for critical research' },
    { src: college5, alt: 'Campus Aerial', caption: 'Campus-Wide Microgrid', subcaption: 'Maximize solar self-consumption' },
  ],
  heroCallout: { label: 'PEAK DEMAND', value: '500-5000 kW', bgClass: 'bg-indigo-500/90', labelClass: 'text-indigo-900' },
  heroStats: [
    { value: '$55K', label: 'Avg Savings/Year' },
    { value: '4.5yr', label: 'Payback Period' },
    { value: '35%', label: 'Demand Reduction' },
  ],
  heroGradientRgba: 'rgba(30,27,75,1)',
  calculator: {
    inputs: [
      { id: 'enrollmentCount', label: 'Student Enrollment', type: 'number', defaultValue: 5000, min: 200, max: 80000, step: 500, suffix: 'students' },
      { id: 'campusSqFt', label: 'Campus Building Area', type: 'number', defaultValue: 500000, min: 50000, max: 10000000, step: 50000, suffix: 'sq ft' },
      { id: 'hasDorms', label: 'Has Dormitories', type: 'toggle', defaultValue: true },
      { id: 'currentMonthlyBill', label: 'Monthly Electric Bill', type: 'number', defaultValue: 35000, min: 5000, max: 2000000, step: 5000, suffix: '$/mo' },
    ],
    ssotSlug: 'college',
    bessRatio: 0.40,
    durationHours: 2,
    leadSourceTag: 'college_vertical',
  },
  quickEstimate: (inputs) => {
    const enrollment = Number(inputs.enrollmentCount) || 5000;
    const savings = Math.round((enrollment / 1000) * 11000);
    return { savings, payback: 4.5, label: `${enrollment.toLocaleString()} students` };
  },
  caseStudies: [],
  howItWorks: [
    { title: 'Tell Us About Your Campus', description: 'Enter enrollment, building square footage, and monthly utility bill. Takes 60 seconds.' },
    { title: 'We Model Your Campus Load', description: 'Merlin uses DOE Higher Education energy benchmarks to model your dorm, lab, and administrative loads.' },
    { title: 'Get a Grant-Ready Proposal', description: 'Full financial model including ITC, DOE grants, and TrueQuote™ verified pricing for CFO review.' },
    { title: 'Hit Your Sustainability Goals', description: 'Battery storage + solar is the fastest path to carbon neutrality. Most campus projects pay back in 4-5 years.' },
  ],
  leadSourceTag: 'college_vertical',
  leadFormCTA: 'Get Your Free Campus Energy Analysis',
  pageTitle: 'College & University Battery Storage | Sustainable Campus Power',
  metaDescription: 'Battery storage for colleges and universities. Cut campus energy costs 30-45%, protect research labs with backup power, and meet carbon neutrality commitments.',
};

registerVertical(collegeConfig);
