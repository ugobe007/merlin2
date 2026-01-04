/**
 * AboutMerlinModal.tsx
 * 
 * Premium + Magical Merlin theme
 * Gold accents, wizard sparkles, luxury feel
 * 
 * @version 3.0.0
 */

import React, { useState, useEffect } from 'react';
import { X, Zap, Battery, Shield, Target, Calculator, LineChart, PiggyBank, ArrowRight, Sparkles, Globe, Star } from 'lucide-react';

interface AboutMerlinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartQuote?: () => void;
}

export const AboutMerlinModal: React.FC<AboutMerlinModalProps> = ({
  isOpen,
  onClose,
  onStartQuote
}) => {
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setAnimateIn(true), 50);
    } else {
      setAnimateIn(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const capabilities = [
    { icon: Target, title: 'Target IRR Pricing', desc: 'Reverse-engineer to hit your target returns' },
    { icon: Battery, title: 'Capacity Fading Models', desc: 'Professional degradation curves built-in' },
    { icon: LineChart, title: 'Revenue Stream Analysis', desc: 'Arbitrage, demand response, ancillary services' },
    { icon: Calculator, title: 'Break-even & Sensitivity', desc: 'Know your margins before you commit' },
    { icon: Globe, title: 'Regional Cost Estimation', desc: 'Location-specific pricing intelligence' },
    { icon: PiggyBank, title: 'Tax Incentive Calculator', desc: 'ITC, MACRS, state incentives auto-applied' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with blur */}
      <div 
        className={`absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-500 ${animateIn ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose} 
      />
      
      {/* Modal */}
      <div 
        className={`relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl shadow-2xl overflow-hidden transition-all duration-700 ${
          animateIn ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-8'
        }`}
        style={{
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #1a1a2e 100%)',
        }}
      >
        {/* Magical floating particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-amber-400 rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
                opacity: 0.3 + Math.random() * 0.5,
              }}
            />
          ))}
        </div>

        {/* Gold accent line at top */}
        <div className="h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 z-20 p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all group"
        >
          <X className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
        </button>

        {/* ============================================================ */}
        {/* HERO HEADER */}
        {/* ============================================================ */}
        <div className="relative px-10 pt-12 pb-10 text-center">
          {/* Magical glow behind logo */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-[100px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px]" />
          
          <div className="relative">
            {/* Wizard Hat Icon with sparkles */}
            <div className="relative inline-block mb-6">
              {/* Sparkles around the icon */}
              <Sparkles className="absolute -top-2 -left-4 w-5 h-5 text-amber-400 animate-pulse" />
              <Star className="absolute -top-1 -right-3 w-4 h-4 text-amber-300 animate-pulse" style={{ animationDelay: '0.5s' }} />
              <Sparkles className="absolute -bottom-1 -right-4 w-4 h-4 text-amber-400 animate-pulse" style={{ animationDelay: '1s' }} />
              
              {/* Main icon */}
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center shadow-2xl shadow-amber-500/40 border-2 border-amber-300/30">
                <span className="text-5xl">🧙‍♂️</span>
              </div>
            </div>
            
            {/* Title with gradient */}
            <h1 className="text-5xl font-black mb-4">
              <span className="text-white">Meet </span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500">
                Merlin
              </span>
            </h1>
            
            {/* Elegant tagline */}
            <p className="text-xl text-gray-300 font-light tracking-wide max-w-xl mx-auto">
              The wizard behind <span className="text-amber-400 font-medium">investment-grade</span> battery storage analysis
            </p>

            {/* Decorative line */}
            <div className="flex items-center justify-center gap-3 mt-6">
              <div className="w-12 h-px bg-gradient-to-r from-transparent to-amber-500/50" />
              <Star className="w-4 h-4 text-amber-500" />
              <div className="w-12 h-px bg-gradient-to-l from-transparent to-amber-500/50" />
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* STATS BAR - Premium gold styling */}
        {/* ============================================================ */}
        <div className="mx-8 mb-8">
          <div className="flex items-center justify-center gap-0 rounded-2xl overflow-hidden border border-amber-500/20 bg-gradient-to-r from-amber-500/5 via-amber-500/10 to-amber-500/5">
            <div className="flex-1 py-5 text-center border-r border-amber-500/20">
              <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-300 to-amber-500">$400M+</div>
              <div className="text-xs text-gray-400 uppercase tracking-wider mt-1">Projects Quoted</div>
            </div>
            <div className="flex-1 py-5 text-center border-r border-amber-500/20">
              <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-300 to-amber-500">15+</div>
              <div className="text-xs text-gray-400 uppercase tracking-wider mt-1">Industries Served</div>
            </div>
            <div className="flex-1 py-5 text-center border-r border-amber-500/20">
              <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-300 to-amber-500">NREL</div>
              <div className="text-xs text-gray-400 uppercase tracking-wider mt-1">ATB 2024 Data</div>
            </div>
            <div className="flex-1 py-5 text-center">
              <div className="flex items-center justify-center gap-1">
                <Shield className="w-6 h-6 text-amber-400" />
                <span className="text-xl font-bold text-amber-400">TrueQuote™</span>
              </div>
              <div className="text-xs text-gray-400 uppercase tracking-wider mt-1">Certified</div>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* CONTENT - Scrollable */}
        {/* ============================================================ */}
        <div className="flex-1 overflow-y-auto px-10 pb-8">
          
          {/* Mission Statement - Premium card */}
          <div className="relative mb-8 p-6 rounded-2xl border border-amber-500/20 bg-gradient-to-br from-white/5 to-transparent overflow-hidden">
            {/* Corner accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-amber-500/10 to-transparent" />
            
            <div className="relative flex items-start gap-5">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-500/30">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white mb-2">Our Mission</h2>
                <p className="text-gray-300 leading-relaxed">
                  Transform complex energy storage calculations into <span className="text-amber-400 font-semibold">magical simplicity</span>. 
                  We believe every quote should be transparent, every number traceable, and every decision confident. 
                  Merlin makes bank-ready BESS analysis accessible to everyone.
                </p>
              </div>
            </div>
          </div>

          {/* Capabilities Grid */}
          <div className="mb-8">
            <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <Zap className="w-4 h-4 text-amber-400" />
              </div>
              What Merlin Can Do
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {capabilities.map((cap, i) => (
                <div
                  key={i}
                  className="group relative p-5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-amber-500/30 transition-all duration-300 cursor-default"
                >
                  {/* Hover glow effect */}
                  <div className="absolute inset-0 rounded-xl bg-amber-500/0 group-hover:bg-amber-500/5 transition-colors duration-300" />
                  
                  <div className="relative">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/20 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:border-amber-500/40 transition-all duration-300">
                      <cap.icon className="w-5 h-5 text-amber-400" />
                    </div>
                    <h3 className="font-semibold text-white text-sm mb-1 group-hover:text-amber-300 transition-colors">{cap.title}</h3>
                    <p className="text-xs text-gray-400 leading-relaxed">{cap.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Technology Section - Premium styling */}
          <div className="p-6 rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Shield className="w-4 h-4 text-purple-400" />
              </div>
              Built with Excellence
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { emoji: '⚛️', name: 'React', desc: 'TypeScript' },
                { emoji: '🗄️', name: 'Supabase', desc: 'Real-time DB' },
                { emoji: '📊', name: 'NREL ATB', desc: '2024 Data' },
                { emoji: '✨', name: 'TrueQuote™', desc: 'Certified' },
              ].map((tech, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-2xl">{tech.emoji}</span>
                  <div>
                    <div className="font-medium text-white text-sm">{tech.name}</div>
                    <div className="text-xs text-gray-500">{tech.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* FOOTER CTA - Premium gold */}
        {/* ============================================================ */}
        <div className="border-t border-amber-500/10 bg-gradient-to-r from-amber-500/5 via-amber-500/10 to-amber-500/5 px-10 py-6 flex-shrink-0">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-1">
                <Star className="w-5 h-5 text-amber-400" />
                <Star className="w-5 h-5 text-amber-500" />
                <Star className="w-5 h-5 text-amber-600" />
              </div>
              <span className="text-gray-300">Ready to experience the magic?</span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { onClose(); onStartQuote?.(); }}
                className="group relative flex items-center gap-2 px-8 py-4 rounded-full font-bold text-slate-900 overflow-hidden transition-all hover:scale-105 hover:shadow-2xl hover:shadow-amber-500/30"
                style={{
                  background: 'linear-gradient(135deg, #fcd34d 0%, #f59e0b 50%, #d97706 100%)',
                }}
              >
                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                <Zap className="w-5 h-5 relative z-10" />
                <span className="relative z-10">Start Quote Builder</span>
                <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={onClose}
                className="px-6 py-4 rounded-full font-semibold text-gray-400 hover:text-white border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutMerlinModal;
