import React, { useState } from "react";
import {
  X,
  MessageCircle,
  Mail,
  Phone,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Zap,
  Shield,
  BarChart3,
  Settings,
  FileText,
  Users,
  BookOpen,
  ExternalLink,
  Sparkles,
  Home,
  ArrowLeft,
} from "lucide-react";

interface SupportFAQProps {
  onClose?: () => void;
  standalone?: boolean;
}

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const FAQ_ITEMS: FAQItem[] = [
  // Getting Started
  {
    category: "Getting Started",
    question: "What is Merlin and how does it work?",
    answer:
      "Merlin is an AI-powered Battery Energy Storage System (BESS) financial analysis and quote generation platform. It helps businesses evaluate the ROI of installing battery storage, solar, and other clean energy systems. Simply enter your facility details, and Merlin generates a professional quote with equipment sizing, cost breakdowns, and financial projections.",
  },
  {
    category: "Getting Started",
    question: "How do I generate my first quote?",
    answer:
      'Click "Get Started" on the homepage or navigate to the Wizard. You\'ll be guided through 4 simple steps: (1) Enter your location, (2) Select your industry, (3) Answer facility-specific questions, and (4) Review your customized quote with equipment recommendations and financial analysis.',
  },
  {
    category: "Getting Started",
    question: "Is Merlin free to use?",
    answer:
      "Merlin offers a free tier with access to 5 basic industry use cases, up to 3 saved quotes, and simple PDF export. Premium users get access to all 21+ industry templates, unlimited saved quotes, Word/Excel export with appendices, and advanced financial modeling including Monte Carlo analysis.",
  },
  {
    category: "Getting Started",
    question: "What industries does Merlin support?",
    answer:
      "Merlin supports 21+ industries including Hotels, Car Washes, EV Charging Stations, Data Centers, Hospitals, Manufacturing, Office Buildings, Warehouses, Retail, Airports, Casinos, Cold Storage, Colleges, Government, and more. Each industry has tailored questions and power calculations specific to that sector.",
  },
  // Quotes & Calculations
  {
    category: "Quotes & Calculations",
    question: "What is TrueQuote™?",
    answer:
      "TrueQuote™ is Merlin's core differentiator — every number in a quote is traceable to an authoritative source. Equipment costs reference NREL ATB 2024, solar pricing uses NREL Cost Benchmark data, and tax credits follow IRA 2022 rules. You can view the complete audit trail of sources for any quote.",
  },
  {
    category: "Quotes & Calculations",
    question: "How accurate are the cost estimates?",
    answer:
      "Merlin uses industry-standard pricing from NREL, BNEF, and verified vendor data. Battery pricing reflects current market rates ($100–125/kWh for utility-scale BESS). Solar pricing uses scale-based rates ($0.65–0.85/W depending on system size). All costs are within typical ±10–15% of actual project quotes.",
  },
  {
    category: "Quotes & Calculations",
    question: "How is the Investment Tax Credit (ITC) calculated?",
    answer:
      "Merlin calculates ITC dynamically per IRA 2022 rules. The base rate is 6%, with bonuses for: Prevailing Wage compliance (+24%), Energy Community location (+10%), Domestic Content (+10%), and Low-Income Community (+10–20%). A typical commercial project with prevailing wage can achieve 40–50% ITC.",
  },
  {
    category: "Quotes & Calculations",
    question: "Can I export my quotes?",
    answer:
      "Yes! Free users can export as PDF. Premium users get additional export options including branded Word documents with appendices, Excel spreadsheets with financial models, and professional presentation-ready formats suitable for board meetings and investor presentations.",
  },
  // Technical
  {
    category: "Technical",
    question: "What battery chemistries does Merlin model?",
    answer:
      "Merlin supports 5 battery chemistries: LFP (Lithium Iron Phosphate) — most common for commercial BESS, NMC (Nickel Manganese Cobalt), NCA (Nickel Cobalt Aluminum), Flow Batteries (VRB), and Sodium-Ion. Each has different degradation curves, cycle life, and cost profiles modeled over 25 years.",
  },
  {
    category: "Technical",
    question: "How does the 8760 hourly analysis work?",
    answer:
      "The 8760 analysis simulates every hour of the year (8,760 hours) to model time-of-use arbitrage, peak shaving, and solar self-consumption. It accounts for load profiles, TOU rate periods, seasonal variations, and battery state of charge to provide accurate annual savings estimates.",
  },
  {
    category: "Technical",
    question: "What is Monte Carlo analysis?",
    answer:
      "Monte Carlo analysis runs 10,000 simulations with randomized variables (electricity rates ±15%, degradation ±20%, equipment costs ±10%) to generate P10/P50/P90 financial outcomes. This gives bankable confidence intervals — for example, 'There is a 90% chance this project achieves positive NPV.'",
  },
  // Account & Billing
  {
    category: "Account & Billing",
    question: "How do I upgrade to Premium?",
    answer:
      "You can upgrade to Premium from any quote results page — look for the 'Upgrade to ProQuote' option. Premium includes all 21+ industry templates, advanced financial modeling (Monte Carlo, 8760 hourly), unlimited saved quotes, and professional export formats.",
  },
  {
    category: "Account & Billing",
    question: "Is my data secure?",
    answer:
      "Absolutely. Merlin uses Supabase (built on PostgreSQL) with enterprise-grade security. All data is encrypted in transit (TLS 1.3) and at rest (AES-256). We follow SOC 2 practices and never share your facility data with third parties. See our Privacy Policy for full details.",
  },
  {
    category: "Account & Billing",
    question: "Can I delete my account and data?",
    answer:
      "Yes. Go to Security & Privacy in the footer, then the 'Your Data' tab. You can export all your data or request complete account deletion. We process deletion requests within 30 days as required by applicable privacy regulations.",
  },
];

const CATEGORIES = [
  { name: "Getting Started", icon: BookOpen, color: "emerald" },
  { name: "Quotes & Calculations", icon: BarChart3, color: "blue" },
  { name: "Technical", icon: Settings, color: "amber" },
  { name: "Account & Billing", icon: Shield, color: "purple" },
];

const SupportFAQ: React.FC<SupportFAQProps> = ({
  onClose,
  standalone = false,
}) => {
  const [activeCategory, setActiveCategory] = useState("Getting Started");
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [formSubmitted, setFormSubmitted] = useState(false);

  const toggleItem = (index: number) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In production, this would send to an API endpoint
    setFormSubmitted(true);
    setTimeout(() => setFormSubmitted(false), 5000);
    setContactForm({ name: "", email: "", subject: "", message: "" });
  };

  const filteredFAQs = FAQ_ITEMS.filter(
    (item) => item.category === activeCategory
  );

  const content = (
    <div
      className={
        standalone
          ? "min-h-screen bg-[#0f1117] text-white"
          : "fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      }
    >
      {/* Standalone Navigation Bar */}
      {standalone && (
        <div className="sticky top-0 z-50 bg-[#0f1117]/90 backdrop-blur-md border-b border-white/[0.06]">
          <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
            <a
              href="/"
              className="flex items-center gap-2 text-white/50 hover:text-emerald-400 transition-colors no-underline text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </a>
            <div className="flex items-center gap-4">
              <a href="/wizard" className="text-white/40 hover:text-white/70 transition-colors no-underline text-sm">Wizard</a>
              <a href="/vendor" className="text-white/40 hover:text-white/70 transition-colors no-underline text-sm">Vendors</a>
              <a
                href="/"
                className="flex items-center gap-1.5 px-3 py-1.5 border border-emerald-500/30 text-emerald-400 rounded-lg text-sm hover:bg-emerald-500/10 transition-colors no-underline"
              >
                <Home className="w-3.5 h-3.5" />
                Home
              </a>
            </div>
          </div>
        </div>
      )}
      <div
        className={
          standalone
            ? "max-w-5xl mx-auto px-6 py-8"
            : "bg-[#0f1117] rounded-2xl shadow-2xl max-w-5xl w-full border border-white/[0.08] max-h-[90vh] overflow-y-auto"
        }
      >
        {/* Header */}
        <div className="px-8 py-6 border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <HelpCircle className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">
                Support & FAQ
              </h2>
              <p className="text-sm text-white/40">
                Get help, find answers, or contact our team
              </p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/[0.06] transition-colors"
            >
              <X className="w-5 h-5 text-white/40" />
            </button>
          )}
        </div>

        <div className="p-8 space-y-10">
          {/* Quick Contact Cards */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-emerald-400" />
              Contact Us
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Email */}
              <a
                href="mailto:support@merlinenergy.net"
                className="group block bg-white/[0.03] border border-white/[0.08] rounded-xl p-5 hover:bg-white/[0.06] hover:border-emerald-500/30 transition-all no-underline"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Email</p>
                    <p className="text-xs text-white/40">
                      Response within 24hrs
                    </p>
                  </div>
                </div>
                <p className="text-sm text-emerald-400 group-hover:text-emerald-300 transition-colors">
                  support@merlinenergy.net
                </p>
              </a>

              {/* Phone */}
              <a
                href="tel:+18005551234"
                className="group block bg-white/[0.03] border border-white/[0.08] rounded-xl p-5 hover:bg-white/[0.06] hover:border-blue-500/30 transition-all no-underline"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                    <Phone className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Phone</p>
                    <p className="text-xs text-white/40">Mon–Fri 9am–6pm ET</p>
                  </div>
                </div>
                <p className="text-sm text-blue-400 group-hover:text-blue-300 transition-colors">
                  1-800-555-1234
                </p>
              </a>

              {/* Live Chat */}
              <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">
                      AI Assistant
                    </p>
                    <p className="text-xs text-white/40">Coming Soon</p>
                  </div>
                </div>
                <p className="text-sm text-white/30">
                  AI-powered support chat — launching Q2 2026
                </p>
              </div>
            </div>
          </div>

          {/* How to Use Merlin - Quick Start Guide */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-emerald-400" />
              Quick Start Guide
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                {
                  step: 1,
                  title: "Enter Location",
                  description:
                    "Start with your address or zip code. We'll look up local utility rates and solar potential.",
                  icon: "📍",
                },
                {
                  step: 2,
                  title: "Select Industry",
                  description:
                    "Choose from 21+ industry templates. Each has tailored questions for your sector.",
                  icon: "🏢",
                },
                {
                  step: 3,
                  title: "Describe Facility",
                  description:
                    "Answer a few questions about your facility size, equipment, and energy goals.",
                  icon: "📋",
                },
                {
                  step: 4,
                  title: "Get Your Quote",
                  description:
                    "Receive a detailed quote with equipment sizing, costs, ROI, and TrueQuote™ sources.",
                  icon: "📊",
                },
              ].map((item) => (
                <div
                  key={item.step}
                  className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5 relative"
                >
                  <div className="absolute -top-3 -left-1 w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                    <span className="text-xs font-bold text-emerald-400">
                      {item.step}
                    </span>
                  </div>
                  <div className="text-2xl mb-3 mt-1">{item.icon}</div>
                  <h4 className="text-sm font-semibold text-white mb-1.5">
                    {item.title}
                  </h4>
                  <p className="text-xs text-white/40 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* FAQ Section */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-400" />
              Frequently Asked Questions
            </h3>

            {/* Category Tabs */}
            <div className="flex flex-wrap gap-2 mb-6">
              {CATEGORIES.map((cat) => {
                const isActive = activeCategory === cat.name;
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.name}
                    onClick={() => setActiveCategory(cat.name)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                        : "bg-white/[0.03] text-white/50 border border-white/[0.06] hover:bg-white/[0.06] hover:text-white/70"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {cat.name}
                  </button>
                );
              })}
            </div>

            {/* FAQ Accordion */}
            <div className="space-y-2">
              {filteredFAQs.map((item, index) => {
                const globalIndex = FAQ_ITEMS.indexOf(item);
                const isExpanded = expandedItems.has(globalIndex);
                return (
                  <div
                    key={globalIndex}
                    className="bg-white/[0.03] border border-white/[0.08] rounded-xl overflow-hidden"
                  >
                    <button
                      onClick={() => toggleItem(globalIndex)}
                      className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/[0.03] transition-colors"
                    >
                      <span className="text-sm font-medium text-white/80 pr-4">
                        {item.question}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-white/30 flex-shrink-0" />
                      )}
                    </button>
                    {isExpanded && (
                      <div className="px-5 pb-4 border-t border-white/[0.06]">
                        <p className="text-sm text-white/50 leading-relaxed pt-3">
                          {item.answer}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Contact Form */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-400" />
              Send Us a Message
            </h3>
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6">
              {formSubmitted ? (
                <div className="text-center py-8">
                  <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
                    <Mail className="w-7 h-7 text-emerald-400" />
                  </div>
                  <h4 className="text-lg font-semibold text-white mb-2">
                    Message Sent!
                  </h4>
                  <p className="text-sm text-white/40">
                    We'll get back to you within 24 hours.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-white/50 mb-1.5">
                        Name
                      </label>
                      <input
                        type="text"
                        value={contactForm.name}
                        onChange={(e) =>
                          setContactForm({ ...contactForm, name: e.target.value })
                        }
                        required
                        className="w-full px-4 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.1] text-white text-sm placeholder-white/20 focus:outline-none focus:border-emerald-500/40 focus:bg-white/[0.06] transition-all"
                        placeholder="Your name"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-white/50 mb-1.5">
                        Email
                      </label>
                      <input
                        type="email"
                        value={contactForm.email}
                        onChange={(e) =>
                          setContactForm({
                            ...contactForm,
                            email: e.target.value,
                          })
                        }
                        required
                        className="w-full px-4 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.1] text-white text-sm placeholder-white/20 focus:outline-none focus:border-emerald-500/40 focus:bg-white/[0.06] transition-all"
                        placeholder="you@company.com"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-white/50 mb-1.5">
                      Subject
                    </label>
                    <select
                      value={contactForm.subject}
                      onChange={(e) =>
                        setContactForm({
                          ...contactForm,
                          subject: e.target.value,
                        })
                      }
                      required
                      className="w-full px-4 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.1] text-white text-sm focus:outline-none focus:border-emerald-500/40 focus:bg-white/[0.06] transition-all appearance-none"
                    >
                      <option value="" className="bg-[#1a1b23] text-white/50">
                        Select a topic...
                      </option>
                      <option
                        value="general"
                        className="bg-[#1a1b23] text-white"
                      >
                        General Inquiry
                      </option>
                      <option
                        value="quote"
                        className="bg-[#1a1b23] text-white"
                      >
                        Quote Question
                      </option>
                      <option
                        value="technical"
                        className="bg-[#1a1b23] text-white"
                      >
                        Technical Support
                      </option>
                      <option
                        value="billing"
                        className="bg-[#1a1b23] text-white"
                      >
                        Billing & Account
                      </option>
                      <option
                        value="partnership"
                        className="bg-[#1a1b23] text-white"
                      >
                        Partnership / Vendor
                      </option>
                      <option
                        value="feedback"
                        className="bg-[#1a1b23] text-white"
                      >
                        Feedback & Suggestions
                      </option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-white/50 mb-1.5">
                      Message
                    </label>
                    <textarea
                      value={contactForm.message}
                      onChange={(e) =>
                        setContactForm({
                          ...contactForm,
                          message: e.target.value,
                        })
                      }
                      required
                      rows={4}
                      className="w-full px-4 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.1] text-white text-sm placeholder-white/20 focus:outline-none focus:border-emerald-500/40 focus:bg-white/[0.06] transition-all resize-none"
                      placeholder="Tell us how we can help..."
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-sm font-medium hover:bg-emerald-500/25 transition-all"
                  >
                    Send Message
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Useful Links */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-6">
            <h4 className="text-sm font-semibold text-white/60 mb-3">
              Useful Resources
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                {
                  label: "NREL ATB 2024",
                  href: "https://atb.nrel.gov/",
                  desc: "Cost benchmarks",
                },
                {
                  label: "IRA 2022 Guide",
                  href: "https://www.energy.gov/clean-energy-tax-provisions",
                  desc: "Tax credits",
                },
                {
                  label: "NREL PVWatts",
                  href: "https://pvwatts.nrel.gov/",
                  desc: "Solar estimates",
                },
                {
                  label: "EIA Data",
                  href: "https://www.eia.gov/electricity/",
                  desc: "Utility rates",
                },
              ].map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-2 px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] hover:border-blue-500/30 hover:bg-white/[0.06] transition-all no-underline"
                >
                  <div className="flex-1">
                    <p className="text-xs font-medium text-white/70 group-hover:text-white transition-colors">
                      {link.label}
                    </p>
                    <p className="text-[10px] text-white/30">{link.desc}</p>
                  </div>
                  <ExternalLink className="w-3 h-3 text-white/20 group-hover:text-blue-400 transition-colors" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        {!standalone && (
          <div className="px-8 py-5 border-t border-white/[0.08] flex items-center justify-between">
            <p className="text-xs text-white/30">
              Merlin Energy Platform — v3.0
            </p>
            {onClose && (
              <button
                onClick={onClose}
                className="px-5 py-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-sm font-medium hover:bg-emerald-500/25 transition-all"
              >
                Close
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return content;
};

export default SupportFAQ;
