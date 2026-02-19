/**
 * DATA CENTER ENERGY — Slim Config-Driven Landing Page
 * =====================================================
 * 
 * Routes: /data-center, /data-center-energy
 * Powered by shared VerticalLandingPage + dataCenter config.
 * 
 * Created: Feb 2026 — Sprint 2
 */

import React from 'react';
import { VerticalLandingPage } from './shared/VerticalLandingPage';
import '@/config/verticals'; // Side-effect: registers all verticals
import { getVerticalConfig } from '@/config/verticalConfig';

export default function DataCenterEnergy() {
  const config = getVerticalConfig('data-center');
  
  if (!config) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <p>Configuration not found. Please check vertical registration.</p>
      </div>
    );
  }
  
  return <VerticalLandingPage config={config} />;
}
