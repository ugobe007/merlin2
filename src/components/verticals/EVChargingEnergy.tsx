/**
 * EV CHARGING ENERGY — Slim Config-Driven Landing Page
 * =====================================================
 * 
 * Routes: /evchargingenergy, /ev-charging
 * Replaces: _deprecated/EVChargingEnergy.legacy.tsx (1,152 lines)
 * 
 * Now powered by shared VerticalLandingPage + evCharging config.
 * 
 * NOTE: The legacy page had a `window.location.href = '/wizard?industry=ev-charging'`
 * redirect on mount. The new version shows the full landing page instead,
 * with a wizard modal accessible via CTA buttons.
 * 
 * Created: Feb 7, 2026 — Phase 2 Vertical Unification
 */

import React from 'react';
import { VerticalLandingPage } from './shared/VerticalLandingPage';
import '@/config/verticals'; // Side-effect: registers all verticals
import { getVerticalConfig } from '@/config/verticalConfig';

export default function EVChargingEnergy() {
  const config = getVerticalConfig('ev-charging');
  
  if (!config) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <p>Configuration not found. Please check vertical registration.</p>
      </div>
    );
  }
  
  return <VerticalLandingPage config={config} />;
}
