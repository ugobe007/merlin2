/**
 * HOSPITAL ENERGY — Slim Config-Driven Landing Page
 * ===================================================
 * 
 * Routes: /hospital, /hospital-energy
 * Powered by shared VerticalLandingPage + hospital config.
 * 
 * Created: Feb 2026 — Sprint 2
 */

import React from 'react';
import { VerticalLandingPage } from './shared/VerticalLandingPage';
import '@/config/verticals'; // Side-effect: registers all verticals
import { getVerticalConfig } from '@/config/verticalConfig';

export default function HospitalEnergy() {
  const config = getVerticalConfig('hospital');
  
  if (!config) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <p>Configuration not found. Please check vertical registration.</p>
      </div>
    );
  }
  
  return <VerticalLandingPage config={config} />;
}
