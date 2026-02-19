/**
 * MANUFACTURING ENERGY — Slim Config-Driven Landing Page
 * =======================================================
 * 
 * Routes: /manufacturing, /manufacturing-energy
 * Powered by shared VerticalLandingPage + manufacturing config.
 * 
 * Created: Feb 2026 — Sprint 2
 */

import React from 'react';
import { VerticalLandingPage } from './shared/VerticalLandingPage';
import '@/config/verticals'; // Side-effect: registers all verticals
import { getVerticalConfig } from '@/config/verticalConfig';

export default function ManufacturingEnergy() {
  const config = getVerticalConfig('manufacturing');
  
  if (!config) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <p>Configuration not found. Please check vertical registration.</p>
      </div>
    );
  }
  
  return <VerticalLandingPage config={config} />;
}
