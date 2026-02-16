/**
 * PRICING PAGE — Standalone route-accessible pricing page
 * ========================================================
 * Route: /pricing
 * 
 * Supabase dark theme, 4 tiers, billing toggle, Stripe-ready.
 * Created: Feb 16, 2026
 */

import React, { useState } from 'react';
import {
  Check, ArrowLeft, Zap, Crown, Building2, Rocket,
  Shield, Users, FileText, BarChart3, Globe, Code,
  Star, Sparkles, ChevronRight, Battery, Sun, Wind,
  Cpu, Settings, Plug, Atom, Wrench, TrendingUp,
  Award, CircleDollarSign, Package,
} from 'lucide-react';
import merlinIcon from '@/assets/images/new_small_profile_.png';

// Tailwind safelist: static class maps prevent dynamic class purging
const COLOR_CLASSES: Record<string, { iconBg: string; iconBorder: string; iconText: string; checkText: string }> = {
  slate:   { iconBg: 'bg-slate-500/10',   iconBorder: 'border-slate-500/20',   iconText: 'text-slate-400',   checkText: 'text-slate-400' },
  emerald: { iconBg: 'bg-emerald-500/10', iconBorder: 'border-emerald-500/20', iconText: 'text-emerald-400', checkText: 'text-emerald-400' },
  cyan:    { iconBg: 'bg-cyan-500/10',    iconBorder: 'border-cyan-500/20',    iconText: 'text-cyan-400',    checkText: 'text-cyan-400' },
  blue:    { iconBg: 'bg-blue-500/10',    iconBorder: 'border-blue-500/20',    iconText: 'text-blue-400',    checkText: 'text-blue-400' },
};

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    icon: Zap,
    monthlyPrice: 29,
    annualPrice: 290,
    badge: null,
    description: 'Everything you need to build professional BESS quotes and win projects.',
    color: 'slate',
    borderColor: 'border-white/[0.08]',
    badgeBg: '',
    ctaText: 'Start 14-Day Trial',
    ctaStyle: 'border border-white/20 text-white hover:bg-white/[0.06]',
    features: [
      '10 quotes per month',
      'BESS sizing & configuration',
      'ROI & simple payback analysis',
      'TrueQuote™ verified calculations',
      'PDF export (Merlin branded)',
      '10 saved projects',
      'Equipment comparison tool',
      'Email support',
    ],
    limits: { quotes: 10, projects: 10, team: 1, api: 0 },
  },
  {
    id: 'pro',
    name: 'Pro',
    icon: Crown,
    monthlyPrice: 49,
    annualPrice: 490,
    badge: 'Most Popular',
    description: 'Advanced analytics and professional deliverables for consultants and developers.',
    color: 'emerald',
    borderColor: 'border-emerald-500/30',
    badgeBg: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    ctaText: 'Start Pro Trial',
    ctaStyle: 'border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/50',
    features: [
      'Unlimited quotes',
      'NPV, IRR & DCF analysis',
      'TrueQuote™ source attribution',
      'AI-powered recommendations',
      'Export to Word, Excel, PDF',
      '50 saved projects',
      'Custom logo on quotes',
      'Sensitivity analysis',
      'Financing calculator',
      'Priority email support',
    ],
    limits: { quotes: -1, projects: 50, team: 1, api: 100 },
  },
  {
    id: 'advanced',
    name: 'Advanced',
    icon: Building2,
    monthlyPrice: 99,
    annualPrice: 990,
    badge: 'Best Value',
    description: 'Full platform with bank-ready models, team collaboration, and market intelligence.',
    color: 'cyan',
    borderColor: 'border-cyan-500/30',
    badgeBg: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20',
    ctaText: 'Start Advanced Trial',
    ctaStyle: 'border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-500/50',
    features: [
      'Everything in Pro',
      'Monte Carlo risk analysis',
      '8760 hourly dispatch simulation',
      'Battery degradation modeling',
      'Dynamic ITC calculator (IRA 2022)',
      'Real-time market intelligence',
      'Team workspace (5 members)',
      'Unlimited projects',
      'White-label branding',
      'Bank-ready financial models',
      'API access (1,000 calls/mo)',
      'Phone + priority support',
    ],
    limits: { quotes: -1, projects: -1, team: 5, api: 1000 },
  },
  {
    id: 'business',
    name: 'Business',
    icon: Rocket,
    monthlyPrice: -1, // Custom
    annualPrice: -1,
    badge: null,
    description: 'Enterprise-grade solution with dedicated support, full API, and custom integrations.',
    color: 'blue',
    borderColor: 'border-blue-500/20',
    badgeBg: '',
    ctaText: 'Contact Sales',
    ctaStyle: 'border border-blue-500/30 text-blue-400 hover:bg-blue-500/10',
    features: [
      'Everything in Advanced',
      'Unlimited team members',
      'Full API access (unlimited)',
      'Vendor API integration',
      'Custom use case templates',
      'Dedicated account manager',
      'Custom integrations',
      '99.9% SLA',
      'Quarterly business reviews',
    ],
    limits: { quotes: -1, projects: -1, team: -1, api: -1 },
  },
];

const VENDOR_API_FEATURES = [
  {
    icon: Code,
    title: 'RESTful Pricing API',
    description: 'Submit and update product pricing programmatically. JSON/CSV/XML feed support.',
  },
  {
    icon: Globe,
    title: 'Webhook Notifications',
    description: 'Get notified when RFQs match your products, quotes are generated, or pricing is requested.',
  },
  {
    icon: BarChart3,
    title: 'Market Intelligence',
    description: 'Access aggregated market data, pricing trends, and demand forecasts via API.',
  },
  {
    icon: Shield,
    title: 'Scoped API Keys',
    description: 'Fine-grained permissions: pricing:read, products:write, rfq:respond, and more.',
  },
  {
    icon: FileText,
    title: 'Product Catalog Sync',
    description: 'Automatically sync your product catalog — specs, pricing, lead times, warranties.',
  },
  {
    icon: Users,
    title: 'RFQ Auto-Response',
    description: 'Configure automatic responses to matching RFQs based on your pricing rules.',
  },
];

const EQUIPMENT_CATEGORIES = [
  { icon: Battery, label: 'Batteries', desc: 'LFP, NMC, NCA, Flow, Sodium-Ion — all chemistries' },
  { icon: Cpu, label: 'Inverters & PCS', desc: 'String, central, and hybrid inverters' },
  { icon: Settings, label: 'Transformers', desc: 'Step-up, step-down, pad-mount, dry-type' },
  { icon: Wrench, label: 'BOS Equipment', desc: 'Patch panels, AC/DC switchgear, breakers, combiner boxes' },
  { icon: Sun, label: 'Solar + Equipment', desc: 'Panels, trackers, racking, optimizers, microinverters' },
  { icon: Wind, label: 'Wind + Equipment', desc: 'Turbines, towers, controllers, grid-tie systems' },
  { icon: Zap, label: 'Power Generators', desc: 'Natural gas, diesel, dual-fuel, fuel cells, Mainspring' },
  { icon: Plug, label: 'EV Chargers', desc: 'Level 2, DCFC, HPC — hardware, make-ready, install' },
  { icon: Atom, label: 'Nuclear / SMR', desc: 'Small modular reactors, micro-reactors, fusion pilot units' },
];

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [activeSection, setActiveSection] = useState<'plans' | 'vendor-api'>('plans');

  const getPrice = (plan: typeof PLANS[0]) => {
    if (plan.monthlyPrice === -1) return null;
    if (plan.monthlyPrice === 0) return 0;
    return billingCycle === 'annual'
      ? Math.round(plan.annualPrice / 12)
      : plan.monthlyPrice;
  };

  const getAnnualSavings = (plan: typeof PLANS[0]) => {
    if (plan.monthlyPrice <= 0) return 0;
    return plan.monthlyPrice * 12 - plan.annualPrice;
  };

  const handleSelectPlan = (planId: string) => {
    if (planId === 'business') {
      window.location.href = 'mailto:sales@merlin.energy?subject=Business Plan Inquiry';
      return;
    }
    // Future: Stripe checkout session
    const planNames: Record<string, string> = { starter: 'Starter', pro: 'Pro', advanced: 'Advanced' };
    localStorage.setItem('pending_upgrade', JSON.stringify({ tier: planId, billing: billingCycle }));
    alert(`🚀 ${planNames[planId] || planId} Plan\n\nStripe checkout integration launching soon!\nWe'll notify you when payments go live.`);
  };

  return (
    <div className="min-h-screen bg-[#0f1117] text-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-[#0f1117]/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/" className="flex items-center gap-2 text-white/60 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <img src={merlinIcon} alt="Merlin" className="w-8 h-8 rounded-lg" />
              <span className="font-bold text-lg">Merlin</span>
            </a>
          </div>
          <div className="flex items-center gap-6">
            <a href="/wizard" className="text-sm text-white/50 hover:text-white transition-colors">Wizard</a>
            <a href="/vendor" className="text-sm text-white/50 hover:text-white transition-colors">Vendors</a>
            <a href="/support" className="text-sm text-white/50 hover:text-white transition-colors">Support</a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="relative overflow-hidden">
        {/* Subtle glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-emerald-500/[0.04] rounded-full blur-[100px]" />

        <div className="relative max-w-7xl mx-auto px-6 pt-16 pb-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-sm font-medium mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            14-day free trial on all paid plans
          </div>
          <h1 className="text-5xl font-black tracking-tight mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-xl text-white/50 max-w-2xl mx-auto mb-8">
            Professional BESS analysis starting at $29/mo.
            Every plan includes TrueQuote™ verified calculations.
          </p>

          {/* Section Toggle */}
          <div className="flex justify-center gap-2 mb-8">
            <button
              onClick={() => setActiveSection('plans')}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeSection === 'plans'
                  ? 'bg-white/[0.08] text-white border border-white/[0.12]'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              User Plans
            </button>
            <button
              onClick={() => setActiveSection('vendor-api')}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeSection === 'vendor-api'
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Code className="w-3.5 h-3.5" />
                Vendor API
              </span>
            </button>
          </div>

          {/* Billing Toggle (for plans section) */}
          {activeSection === 'plans' && (
            <div className="flex justify-center">
              <div className="bg-white/[0.04] rounded-xl p-1 inline-flex border border-white/[0.08]">
                <button
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                    billingCycle === 'monthly'
                      ? 'border border-emerald-500/40 text-emerald-400'
                      : 'text-white/50 hover:text-white border border-transparent'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingCycle('annual')}
                  className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all relative ${
                    billingCycle === 'annual'
                      ? 'border border-emerald-500/40 text-emerald-400'
                      : 'text-white/50 hover:text-white border border-transparent'
                  }`}
                  >
                  Annual
                  <span className="absolute -top-2 -right-2 px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded-full border border-emerald-500/30">
                    -17%
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* PLANS SECTION */}
      {activeSection === 'plans' && (
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {PLANS.map((plan) => {
              const price = getPrice(plan);
              const savings = getAnnualSavings(plan);
              const Icon = plan.icon;

              return (
                <div
                  key={plan.id}
                  className={`relative bg-white/[0.03] rounded-2xl border ${plan.borderColor} p-6 flex flex-col transition-all duration-300 hover:bg-white/[0.05] hover:border-white/[0.15] group`}
                >
                  {/* Badge */}
                  {plan.badge && (
                    <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold ${plan.badgeBg}`}>
                      {plan.badge}
                    </div>
                  )}

                  {/* Header */}
                  <div className="mb-5">
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`w-9 h-9 rounded-lg ${COLOR_CLASSES[plan.color]?.iconBg} flex items-center justify-center border ${COLOR_CLASSES[plan.color]?.iconBorder}`}>
                        <Icon className={`w-4.5 h-4.5 ${COLOR_CLASSES[plan.color]?.iconText}`} />
                      </div>
                      <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                    </div>
                    <p className="text-sm text-white/40 leading-relaxed">{plan.description}</p>
                  </div>

                  {/* Price */}
                  <div className="mb-5">
                    {price === null ? (
                      <div>
                        <span className="text-3xl font-black text-white">Custom</span>
                        <p className="text-xs text-white/40 mt-1">Tailored to your needs</p>
                      </div>
                    ) : price === 0 ? (
                      <div>
                        <span className="text-3xl font-black text-white">$0</span>
                        <span className="text-sm text-white/40 ml-1">/ forever</span>
                      </div>
                    ) : (
                      <div>
                        <span className="text-3xl font-black text-white">${price}</span>
                        <span className="text-sm text-white/40 ml-1">/ mo</span>
                        {billingCycle === 'annual' && savings > 0 && (
                          <p className="text-xs text-emerald-400 mt-1">
                            Save ${savings}/year
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* CTA */}
                  <button
                    onClick={() => handleSelectPlan(plan.id)}
                    className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-all mb-5 ${plan.ctaStyle}`}
                  >
                    {plan.ctaText}
                  </button>

                  {/* Features */}
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-3">
                      {plan.id === 'free' ? 'Includes' : plan.id === 'business' ? 'Everything in Enterprise, plus' : 'Key features'}
                    </p>
                    <ul className="space-y-2">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-white/60">
                          <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${COLOR_CLASSES[plan.color]?.checkText}`} />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Comparison note */}
          <div className="text-center mt-12">
            <p className="text-sm text-white/30">
              All plans include NREL ATB 2024 benchmarks · IRA 2022 ITC calculations · TrueQuote™ audit trails · 14-day free trial
            </p>
          </div>
        </div>
      )}

      {/* VENDOR API SECTION */}
      {activeSection === 'vendor-api' && (
        <div className="max-w-6xl mx-auto px-6 py-12">
          {/* API Hero */}
          <div className="bg-gradient-to-br from-cyan-500/[0.06] to-blue-500/[0.04] rounded-2xl border border-cyan-500/20 p-8 mb-10">
            <div className="flex flex-col lg:flex-row items-start gap-8">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                    <Code className="w-5 h-5 text-cyan-400" />
                  </div>
                  <h2 className="text-2xl font-black text-white">Vendor API</h2>
                  <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-bold border border-cyan-500/20">
                    Beta
                  </span>
                </div>
                <p className="text-white/50 text-lg mb-4 max-w-xl">
                  Stop chasing vendor quotes manually. Merlin automates pricing collection, product configurations, 
                  and bid management across <span className="text-cyan-400 font-semibold">every equipment category</span> — batteries, solar, wind, 
                  generators, EV chargers, and more. Test configurations in ProQuote™ with TrueQuote™ verification.
                </p>
                <div className="flex flex-wrap gap-3">
                  <a
                    href="/vendor"
                    className="inline-flex items-center gap-2 px-5 py-2.5 border border-cyan-500/30 text-cyan-400 rounded-lg font-semibold text-sm hover:bg-cyan-500/10 hover:border-cyan-500/50 transition-all"
                  >
                    <Rocket className="w-4 h-4" />
                    Get API Access
                    <ChevronRight className="w-3.5 h-3.5" />
                  </a>
                  <a
                    href="/vendor"
                    className="inline-flex items-center gap-2 px-5 py-2.5 border border-cyan-500/30 text-cyan-400 rounded-lg font-semibold text-sm hover:bg-cyan-500/10 transition-all"
                  >
                    <FileText className="w-4 h-4" />
                    View API Docs
                  </a>
                </div>
              </div>

              {/* Code Preview */}
              <div className="w-full lg:w-[400px] bg-[#0a0a14] rounded-xl border border-white/[0.06] overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2 border-b border-white/[0.06] bg-white/[0.02]">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                  <span className="text-[10px] text-white/30 ml-2 font-mono">pricing-feed.sh</span>
                </div>
                <pre className="p-4 text-xs font-mono leading-relaxed overflow-x-auto">
                  <code>
                    <span className="text-cyan-400">curl</span>{' '}
                    <span className="text-white/60">-X POST</span>{' \\\n  '}
                    <span className="text-emerald-400">https://api.merlin.energy/v1/pricing</span>{' \\\n  '}
                    <span className="text-white/60">-H</span>{' '}
                    <span className="text-amber-400">"Authorization: Bearer mk_live_..."</span>{' \\\n  '}
                    <span className="text-white/60">-d</span>{' '}
                    <span className="text-blue-300">{'\'{"product":"BESS-LFP-4h",'}</span>{'\n   '}
                    <span className="text-blue-300">{'     "price_kwh": 118.50,'}</span>{'\n   '}
                    <span className="text-blue-300">{'     "lead_weeks": 12}\''}</span>
                  </code>
                </pre>
              </div>
            </div>
          </div>

          {/* Equipment Categories */}
          <h3 className="text-xl font-bold text-white mb-2">Equipment Categories</h3>
          <p className="text-white/40 mb-6 text-sm">Manage pricing and configurations for every product type — all from one platform.</p>
          <div className="grid grid-cols-3 lg:grid-cols-9 gap-3 mb-12">
            {EQUIPMENT_CATEGORIES.map((cat, i) => {
              const CatIcon = cat.icon;
              return (
                <div key={i} className="bg-white/[0.03] rounded-xl border border-white/[0.08] p-3 text-center hover:bg-white/[0.05] hover:border-cyan-500/20 transition-all group" title={cat.desc}>
                  <div className="w-9 h-9 mx-auto rounded-lg bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 mb-2 group-hover:bg-cyan-500/20 transition-colors">
                    <CatIcon className="w-4.5 h-4.5 text-cyan-400" />
                  </div>
                  <p className="text-[11px] font-semibold text-white/60 leading-tight">{cat.label}</p>
                </div>
              );
            })}
          </div>

          {/* Why Vendors Love Merlin */}
          <div className="bg-gradient-to-br from-emerald-500/[0.04] to-cyan-500/[0.03] rounded-2xl border border-emerald-500/20 p-8 mb-12">
            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              Why Vendors Choose Merlin
            </h3>
            <p className="text-white/40 mb-5 max-w-3xl">
              Normally, vendors spend weeks collecting pricing sheets, product specs, and configuration data from dozens of 3rd-party suppliers.
              Merlin automates <span className="text-white/70 font-medium">all of it</span> — then lets you validate every configuration with ProQuote™ and the TrueQuote™ stamp of approval.
            </p>
            <div className="grid md:grid-cols-3 gap-5">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 flex-shrink-0 mt-0.5">
                  <Package className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-white text-sm">Automated Price Collection</h4>
                  <p className="text-xs text-white/40 mt-0.5">Pull pricing from batteries, solar, wind, generators, EV chargers, and nuclear — no spreadsheets needed.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 flex-shrink-0 mt-0.5">
                  <Award className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-white text-sm">TrueQuote™ Verified</h4>
                  <p className="text-xs text-white/40 mt-0.5">Test your product configurations in ProQuote™. Every number traced to NREL, IEEE, and IRA sources.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 flex-shrink-0 mt-0.5">
                  <CircleDollarSign className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-white text-sm">Right-to-Bid Positioning</h4>
                  <p className="text-xs text-white/40 mt-0.5">Get positioned in front of active buyers. Priority placement when your products match RFQ requirements.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Integration Capabilities */}
          <h3 className="text-xl font-bold text-white mb-6">Integration Capabilities</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
            {VENDOR_API_FEATURES.map((feature, i) => {
              const FeatureIcon = feature.icon;
              return (
                <div
                  key={i}
                  className="bg-white/[0.03] rounded-xl border border-white/[0.08] p-5 hover:bg-white/[0.05] hover:border-cyan-500/20 transition-all group"
                >
                  <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 mb-3 group-hover:bg-cyan-500/20 transition-colors">
                    <FeatureIcon className="w-5 h-5 text-cyan-400" />
                  </div>
                  <h4 className="font-bold text-white mb-1">{feature.title}</h4>
                  <p className="text-sm text-white/40 leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>

          {/* API Pricing */}
          <div className="bg-white/[0.03] rounded-2xl border border-white/[0.08] p-8">
            <h3 className="text-xl font-bold text-white mb-2">Vendor Plans</h3>
            <p className="text-white/40 mb-6">
              Everything you need to manage pricing, products, and bids across all energy equipment categories.
            </p>

            <div className="grid md:grid-cols-3 gap-5">
              {/* Starter $29/mo */}
              <div className="bg-emerald-500/[0.04] rounded-xl border border-emerald-500/20 p-5 relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Most Popular
                </div>
                <h4 className="font-bold text-white mb-1">Starter</h4>
                <p className="text-2xl font-black text-emerald-400 mb-1">$29<span className="text-sm text-white/40">/mo</span></p>
                <p className="text-xs text-white/40 mb-4">Full platform access for vendors</p>
                <ul className="space-y-2 text-sm text-white/50">
                  <li className="flex items-start gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />API access (1,000 calls/mo)</li>
                  <li className="flex items-start gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />Right-to-bid positioning</li>
                  <li className="flex items-start gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />ProQuote™ quote building</li>
                  <li className="flex items-start gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />Product & price management</li>
                  <li className="flex items-start gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" /><span>Config tools: <span className="text-white/70">batteries, inverters, transformers, switchgear, panels</span></span></li>
                  <li className="flex items-start gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" /><span>Config tools: <span className="text-white/70">solar, wind, generators, EV chargers, nuclear</span></span></li>
                  <li className="flex items-start gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />TrueQuote™ verified configurations</li>
                  <li className="flex items-start gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />RFQ notifications & matching</li>
                </ul>
                <a href="/vendor" className="block w-full mt-5 py-2.5 rounded-lg text-sm font-semibold text-center border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/50 transition-all">Get Started</a>
              </div>

              {/* Pro API $99/mo */}
              <div className="bg-cyan-500/[0.04] rounded-xl border border-cyan-500/20 p-5">
                <h4 className="font-bold text-white mb-1">Pro</h4>
                <p className="text-2xl font-black text-cyan-400 mb-1">$99<span className="text-sm text-white/40">/mo</span></p>
                <p className="text-xs text-white/40 mb-4">For high-volume vendor partners</p>
                <ul className="space-y-2 text-sm text-white/50">
                  <li className="flex items-start gap-2"><Check className="w-3.5 h-3.5 text-cyan-400 mt-0.5 flex-shrink-0" />Everything in Starter</li>
                  <li className="flex items-start gap-2"><Check className="w-3.5 h-3.5 text-cyan-400 mt-0.5 flex-shrink-0" />10,000 API calls/month</li>
                  <li className="flex items-start gap-2"><Check className="w-3.5 h-3.5 text-cyan-400 mt-0.5 flex-shrink-0" />Automated pricing feeds</li>
                  <li className="flex items-start gap-2"><Check className="w-3.5 h-3.5 text-cyan-400 mt-0.5 flex-shrink-0" />Webhook notifications</li>
                  <li className="flex items-start gap-2"><Check className="w-3.5 h-3.5 text-cyan-400 mt-0.5 flex-shrink-0" />Market intelligence API</li>
                  <li className="flex items-start gap-2"><Check className="w-3.5 h-3.5 text-cyan-400 mt-0.5 flex-shrink-0" />Priority bid placement</li>
                  <li className="flex items-start gap-2"><Check className="w-3.5 h-3.5 text-cyan-400 mt-0.5 flex-shrink-0" />Bulk product catalog sync</li>
                  <li className="flex items-start gap-2"><Check className="w-3.5 h-3.5 text-cyan-400 mt-0.5 flex-shrink-0" />Priority support</li>
                </ul>
                <a href="/vendor" className="block w-full mt-5 py-2.5 rounded-lg text-sm font-semibold text-center border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-500/50 transition-all">Upgrade to Pro</a>
              </div>

              {/* Enterprise API */}
              <div className="bg-white/[0.02] rounded-xl border border-white/[0.06] p-5">
                <h4 className="font-bold text-white mb-1">Enterprise</h4>
                <p className="text-2xl font-black text-white mb-1">Custom</p>
                <p className="text-xs text-white/40 mb-4">Unlimited + dedicated support</p>
                <ul className="space-y-2 text-sm text-white/50">
                  <li className="flex items-start gap-2"><Check className="w-3.5 h-3.5 text-blue-400 mt-0.5 flex-shrink-0" />Everything in Pro</li>
                  <li className="flex items-start gap-2"><Check className="w-3.5 h-3.5 text-blue-400 mt-0.5 flex-shrink-0" />Unlimited API calls</li>
                  <li className="flex items-start gap-2"><Check className="w-3.5 h-3.5 text-blue-400 mt-0.5 flex-shrink-0" />Custom integrations</li>
                  <li className="flex items-start gap-2"><Check className="w-3.5 h-3.5 text-blue-400 mt-0.5 flex-shrink-0" />Dedicated endpoint</li>
                  <li className="flex items-start gap-2"><Check className="w-3.5 h-3.5 text-blue-400 mt-0.5 flex-shrink-0" />SLA guarantee</li>
                  <li className="flex items-start gap-2"><Check className="w-3.5 h-3.5 text-blue-400 mt-0.5 flex-shrink-0" />Dedicated account manager</li>
                  <li className="flex items-start gap-2"><Check className="w-3.5 h-3.5 text-blue-400 mt-0.5 flex-shrink-0" />White-label API</li>
                </ul>
                <a href="mailto:sales@merlin.energy?subject=Enterprise Vendor API" className="block w-full mt-5 py-2.5 rounded-lg text-sm font-semibold text-center border border-blue-500/30 text-blue-400 hover:bg-blue-500/10 hover:border-blue-500/50 transition-all">Contact Sales</a>
              </div>
            </div>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap justify-center gap-6 mt-10">
            {[
              { icon: Shield, label: 'SOC 2 Type II' },
              { icon: Globe, label: 'RESTful API' },
              { icon: Star, label: 'NREL Compliant' },
              { icon: Code, label: 'OpenAPI 3.0' },
            ].map((badge, i) => {
              const BadgeIcon = badge.icon;
              return (
                <div key={i} className="flex items-center gap-2 text-white/30 text-sm">
                  <BadgeIcon className="w-4 h-4" />
                  {badge.label}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-white/[0.06] mt-12">
        <div className="max-w-7xl mx-auto px-6 py-8 text-center">
          <p className="text-sm text-white/30">
            Questions? <a href="mailto:sales@merlin.energy" className="text-emerald-400/70 hover:text-emerald-400">Contact sales</a> or visit <a href="/support" className="text-emerald-400/70 hover:text-emerald-400">Support</a>
          </p>
          <p className="text-xs text-white/20 mt-2">
            © 2026 Merlin Energy. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
