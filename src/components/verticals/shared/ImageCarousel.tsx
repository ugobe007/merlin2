/**
 * SHARED IMAGE CAROUSEL
 * =====================
 * Config-driven carousel for vertical landing pages.
 * Auto-rotates every 4 seconds with dot navigation.
 * 
 * Used by: VerticalHeroSection (mobile), standalone in hero areas
 * Created: Feb 7, 2026 — Phase 2 Vertical Unification
 */

import React, { useState, useEffect } from 'react';
import type { CarouselImage, VerticalTheme } from '@/config/verticalConfig';
import merlinImage from '@/assets/images/new_profile_merlin.png';

interface ImageCarouselProps {
  images: CarouselImage[];
  theme: VerticalTheme;
  /** Optional callout badge (top-right) */
  callout?: { label: string; value: string; bgClass: string; labelClass: string };
  /** Interval in ms (default 4000) */
  interval?: number;
  className?: string;
}

export function ImageCarousel({ images, theme, callout, interval = 4000, className = '' }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, interval);
    return () => clearInterval(timer);
  }, [images.length, interval]);

  const current = images[currentIndex];

  return (
    <div className={`relative w-full max-w-xl mx-auto mb-6 ${className}`}>
      <div className={`relative rounded-3xl overflow-hidden shadow-2xl ${theme.carouselShadow} border ${theme.carouselBorder}`}>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/10 to-transparent z-10" />
        <img
          src={current.src}
          alt={current.alt}
          className="w-full h-80 object-cover transition-opacity duration-500"
        />
        {/* Merlin overlay badge */}
        <div className="absolute bottom-4 left-4 right-4 z-20">
          <div className="flex items-center gap-3 bg-black/50 backdrop-blur-md rounded-xl px-4 py-3 border border-white/20">
            <img src={merlinImage} alt="Merlin" className="w-12 h-12" />
            <div className="flex-1">
              <p className="text-white font-bold">Powered by Merlin</p>
              <p className={`text-${theme.accent}-300 text-sm`}>AI-Optimized Battery Storage</p>
            </div>
            <div className="text-right">
              <p className="text-white font-bold text-sm">{current.caption}</p>
              <p className={`text-${theme.accent}-300 text-xs`}>{current.subcaption}</p>
            </div>
          </div>
        </div>
        {/* Optional callout badge */}
        {callout && (
          <div className="absolute top-4 right-4 z-20">
            <div className={`${callout.bgClass} backdrop-blur-sm rounded-lg px-3 py-2 text-center`}>
              <p className={`text-xs font-bold ${callout.labelClass}`}>{callout.label}</p>
              <p className="text-lg font-black text-white">{callout.value}</p>
            </div>
          </div>
        )}
      </div>

      {/* Dots */}
      <div className="flex justify-center gap-2 mt-4">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? `bg-${theme.accent}-400 w-8`
                : 'bg-white/30 hover:bg-white/50'
            }`}
            aria-label={`Go to image ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Desktop edge-bleeding hero carousel (right half of screen).
 * Fades between images with gradient overlay on left edge.
 */
interface HeroCarouselDesktopProps {
  images: CarouselImage[];
  currentIndex: number;
  gradientFromColor: string;
  callout?: { label: string; value: string; bgClass: string; labelClass: string };
  stats: { value: string; label: string }[];
  theme: VerticalTheme;
}

export function HeroCarouselDesktop({
  images,
  currentIndex,
  gradientFromColor,
  callout,
  stats,
  theme,
}: HeroCarouselDesktopProps) {
  return (
    <div className="hidden lg:block absolute right-0 top-0 bottom-0 w-1/2">
      <div className="relative w-full h-full">
        {images.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentIndex ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <img src={image.src} alt={image.alt} className="w-full h-full object-cover" />
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(to right, ${gradientFromColor} 0%, ${gradientFromColor.replace('1)', '0.8)')} 15%, transparent 40%), linear-gradient(to top, ${gradientFromColor.replace('1)', '0.9)')} 0%, transparent 50%)`,
              }}
            />
          </div>
        ))}

        {/* Financial overlay card */}
        <div className="absolute bottom-8 left-8 right-8">
          <div
            className="backdrop-blur-xl rounded-3xl p-6 border border-white/20"
            style={{ background: 'rgba(255,255,255,0.1)' }}
          >
            <div className="flex items-center gap-3 mb-4">
              <img src={merlinImage} alt="Merlin" className="w-12 h-12" />
              <div>
                <p className="text-white font-bold">Powered by Merlin</p>
                <p className={`text-${theme.accent}-300 text-sm`}>AI-Optimized Battery Storage</p>
              </div>
            </div>

            <div className={`grid grid-cols-${stats.length} gap-4`}>
              {stats.map((stat, i) => (
                <div key={i} className={`text-center ${i > 0 && i < stats.length ? 'border-l border-white/10 pl-2' : ''}`}>
                  <div className={`text-3xl font-black text-${theme.accent}-400`}>{stat.value}</div>
                  <div className={`text-xs text-${theme.accent}-300/70 mt-1`}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Callout badge */}
        {callout && (
          <div className="absolute top-8 right-8">
            <div className={`${callout.bgClass} backdrop-blur-sm rounded-lg px-4 py-3 text-center`}>
              <p className={`text-xs font-bold ${callout.labelClass}`}>{callout.label}</p>
              <p className="text-2xl font-black text-white">{callout.value}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
