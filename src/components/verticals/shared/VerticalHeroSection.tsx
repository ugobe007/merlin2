/**
 * SHARED VERTICAL HERO SECTION
 * ==============================
 * Config-driven hero section with edge-bleeding carousel design.
 * 
 * Layout:
 *   Desktop: Left copy (badge, headline, value props, CTA) + Right edge-bleed carousel
 *   Mobile:  Copy → Mobile carousel → Stat cards
 * 
 * Created: Feb 7, 2026 — Phase 2 Vertical Unification
 */

import React, { useState, useEffect, useMemo } from 'react';
import { ArrowRight, CheckCircle } from 'lucide-react';
import type { VerticalConfig } from '@/config/verticalConfig';
import { TrueQuoteBadgeCanonical } from '@/components/shared/TrueQuoteBadgeCanonical';
import { ImageCarousel } from './ImageCarousel';
import merlinImage from '@/assets/images/new_profile_merlin.png';

interface VerticalHeroSectionProps {
  config: VerticalConfig;
  /** Calculator input values for inline estimate */
  calculatorInputs: Record<string, any>;
  onGetQuote: () => void;
  onShowTrueQuote: () => void;
}

// Color mappings for stat cards (3 cards with rotating accent colors)
const STAT_CARD_COLORS = [
  { bg: 'from-emerald-500/20 to-emerald-600/10', border: 'border-emerald-400/30', value: 'text-emerald-400', label: 'text-emerald-200' },
  { bg: 'from-cyan-500/20 to-cyan-600/10', border: 'border-cyan-400/30', value: 'text-cyan-400', label: 'text-cyan-200' },
  { bg: 'from-purple-500/20 to-purple-600/10', border: 'border-purple-400/30', value: 'text-purple-400', label: 'text-purple-200' },
];

export function VerticalHeroSection({ config, calculatorInputs, _onGetQuote, onShowTrueQuote }: VerticalHeroSectionProps) {
  const { theme, carouselImages, heroCallout, heroStats } = config;
  const BadgeIcon = config.heroBadgeIcon;
  
  // Hero carousel state for desktop edge-bleed
  const [heroImageIndex, setHeroImageIndex] = useState(0);
  
  useEffect(() => {
    const timer = setInterval(() => {
      setHeroImageIndex((prev) => (prev + 1) % carouselImages.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [carouselImages.length]);
  
  // Inline quick estimate from config
  const estimate = useMemo(
    () => config.quickEstimate(calculatorInputs),
    [config, calculatorInputs]
  );
  
  return (
    <section className="relative min-h-[85vh] lg:min-h-[90vh] overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtNi42MjcgMC0xMiA1LjM3My0xMiAxMnM1LjM3MyAxMiAxMiAxMiAxMi01LjM3MyAxMi0xMi01LjM3My0xMi0xMi0xMnoiIHN0cm9rZT0iIzEwYjk4MSIgc3Ryb2tlLW9wYWNpdHk9Ii4xIi8+PC9nPjwvc3ZnPg==')] opacity-30" />
      
      {/* Left content */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-16 md:py-24 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* ─── Left: Copy ─────────────────────────────────────── */}
          <div>
            {/* Badge */}
            <div className={`inline-flex items-center gap-2 bg-gradient-to-r from-${theme.accent}-500/20 via-${theme.accentSecondary}-500/20 to-${theme.accent}-500/20 border border-${theme.accent}-400/40 rounded-full px-5 py-2 mb-6 shadow-lg`}>
              <BadgeIcon className={`w-5 h-5 text-${theme.accent}-300`} />
              <span className={`text-${theme.accent}-200 text-sm font-semibold`}>{config.heroBadge}</span>
            </div>
            
            {/* Headline */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 leading-[1.1]">
              {config.heroHeadline}
              <span className={`text-transparent bg-clip-text bg-gradient-to-r from-${theme.accent}-300 via-${theme.accentSecondary}-400 to-${theme.accent}-300`}>
                {config.heroHeadlineHighlight}
              </span>
            </h1>
            
            {/* Subtitle */}
            <p className={`text-xl text-${theme.accent}-100/90 mb-8 leading-relaxed`}>
              {config.heroSubtitle}
              <span className={`text-${theme.accent}-300 font-medium`}>{config.heroSubtitleHighlight}</span>
            </p>
            
            {/* Value Props */}
            <div className="flex flex-wrap gap-x-6 gap-y-3 mb-8">
              {config.valueProps.map((prop, i) => (
                <div key={i} className="flex items-center gap-2 text-white">
                  <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  <span className="font-medium">{prop.text}</span>
                </div>
              ))}
            </div>
            
            {/* CTA Button */}
            <button
              onClick={() => document.getElementById('calculator')?.scrollIntoView({ behavior: 'smooth' })}
              className={`inline-flex items-center gap-2 ${theme.ctaGradient} ${theme.ctaHoverGradient} text-white px-8 py-4 rounded-full font-bold text-lg shadow-xl hover:shadow-2xl transition-all hover:scale-105`}
            >
              {config.heroCTA}
              <ArrowRight className="w-5 h-5" />
            </button>
            
            {/* Inline Savings Estimate */}
            {estimate.savings > 0 && (
              <div className={`mt-4 bg-white/10 backdrop-blur-sm rounded-xl px-5 py-3 border border-${theme.accent}-400/30 inline-flex items-center gap-3`}>
                <div className="text-center">
                  <p className={`text-sm text-${theme.accent}-200`}>
                    {estimate.label ? `Based on ${estimate.label}` : 'Estimated'}
                  </p>
                  <p className="text-xl font-bold text-white">
                    ~${estimate.savings.toLocaleString()}<span className={`text-sm text-${theme.accent}-300`}>/year</span>
                  </p>
                </div>
                <div className={`w-px h-10 bg-${theme.accent}-400/30`} />
                <div className="text-center">
                  <p className={`text-sm text-${theme.accent}-200`}>Payback</p>
                  <p className={`text-xl font-bold text-${theme.accent}-300`}>{estimate.payback.toFixed(1)} yrs</p>
                </div>
              </div>
            )}
            
            {/* TrueQuote Badge */}
            <div className="flex items-center gap-2 mt-4">
              <button onClick={onShowTrueQuote} className="hover:scale-105 transition-transform cursor-pointer">
                <TrueQuoteBadgeCanonical />
              </button>
              <button onClick={onShowTrueQuote} className={`text-${theme.accent}-300 text-xs hover:text-white transition-colors cursor-pointer`}>
                Every number sourced →
              </button>
            </div>
            
            {/* Down Arrow */}
            <div className="mt-8 flex flex-col items-center animate-bounce lg:items-start">
              <p className={`text-${theme.accent}-300 text-sm font-medium mb-2`}>See Your Savings Below</p>
              <div className={`w-10 h-10 rounded-full bg-gradient-to-br from-${theme.accent}-500/30 to-${theme.accentSecondary}-500/30 border border-${theme.accent}-400/50 flex items-center justify-center`}>
                <svg className={`w-5 h-5 text-${theme.accent}-300`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </div>
            </div>
          </div>
          
          {/* ─── Right: Mobile carousel + stats ─────────────────── */}
          <div className="lg:hidden">
            <ImageCarousel
              images={carouselImages}
              theme={theme}
            />
            
            {/* Stat cards (mobile) */}
            <div className="grid grid-cols-3 gap-3 mt-6">
              {heroStats.map((stat, i) => {
                const colors = STAT_CARD_COLORS[i % STAT_CARD_COLORS.length];
                return (
                  <div key={i} className={`bg-gradient-to-br ${colors.bg} backdrop-blur-sm rounded-2xl p-4 text-center border ${colors.border} shadow-lg`}>
                    <p className={`text-3xl font-black ${colors.value}`}>{stat.value}</p>
                    <p className={`text-xs ${colors.label} font-medium`}>{stat.label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      
      {/* ─── Desktop: Edge-Bleeding Right Half ──────────────────── */}
      <div className="hidden lg:block absolute right-0 top-0 bottom-0 w-1/2">
        <div className="relative w-full h-full">
          {carouselImages.map((image, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                index === heroImageIndex ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <img src={image.src} alt={image.alt} className="w-full h-full object-cover" />
              {/* Gradient fading into page background */}
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(to right, ${config.heroGradientRgba} 0%, ${config.heroGradientRgba.replace(',1)', ',0.7)')} 15%, transparent 40%), linear-gradient(to top, rgba(15,23,42,0.9) 0%, transparent 50%)`,
                }}
              />
            </div>
          ))}
          
          {/* Financial overlay card */}
          <div className="absolute bottom-8 left-8 right-8">
            <div className="backdrop-blur-xl rounded-3xl p-6 border border-white/20" style={{ background: 'rgba(255,255,255,0.1)' }}>
              <div className="flex items-center gap-3 mb-4">
                <img src={merlinImage} alt="Merlin" className="w-12 h-12" />
                <div>
                  <p className="text-white font-bold">Powered by Merlin</p>
                  <p className={`text-${theme.accent}-300 text-sm`}>AI-Optimized Battery Storage</p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                {heroStats.map((stat, i) => (
                  <div key={i} className={`text-center ${i === 1 ? 'border-x border-white/10 px-2' : ''}`}>
                    <div className={`text-3xl font-black ${STAT_CARD_COLORS[i % STAT_CARD_COLORS.length].value}`}>{stat.value}</div>
                    <div className={`text-xs text-${theme.accent}-300/70 mt-1`}>{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Callout badge (top-right) */}
          <div className="absolute top-8 right-8">
            <div className={`${heroCallout.bgClass} backdrop-blur-sm rounded-lg px-4 py-3 text-center`}>
              <p className={`text-xs font-bold ${heroCallout.labelClass}`}>{heroCallout.label}</p>
              <p className="text-2xl font-black text-white">{heroCallout.value}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
