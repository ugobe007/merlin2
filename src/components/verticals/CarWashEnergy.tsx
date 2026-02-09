/**
 * CAR WASH ENERGY — Slim Config-Driven Landing Page
 * ===================================================
 * 
 * Routes: /carwashenergy, /car-wash
 * Replaces: _deprecated/CarWashEnergy.legacy.tsx (1,278 lines)
 * 
 * Now powered by shared VerticalLandingPage + carWash config.
 * All sections (header, hero, calculator, how-it-works, social proof,
 * footer, lead capture, wizard) are config-driven.
 * 
 * Created: Feb 7, 2026 — Phase 2 Vertical Unification
 */

import React from 'react';
import { VerticalLandingPage } from './shared/VerticalLandingPage';
import '@/config/verticals'; // Side-effect: registers all verticals
import { getVerticalConfig } from '@/config/verticalConfig';

export default function CarWashEnergy() {
  const config = getVerticalConfig('car-wash');
  
  if (!config) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <p>Configuration not found. Please check vertical registration.</p>
      </div>
    );
  }
  
  return <VerticalLandingPage config={config} />;
}
