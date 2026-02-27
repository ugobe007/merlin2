import React from 'react';
import { VerticalLandingPage } from './shared/VerticalLandingPage';
import '@/config/verticals';
import '@/config/verticals/airport';
import { getVerticalConfig } from '@/config/verticalConfig';

export default function AirportEnergy() {
  const config = getVerticalConfig('airport');
  if (!config) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white"><p>Configuration not found.</p></div>;
  return <VerticalLandingPage config={config} />;
}
