import React from 'react';
import { VerticalLandingPage } from './shared/VerticalLandingPage';
import '@/config/verticals';
import '@/config/verticals/gasStation';
import { getVerticalConfig } from '@/config/verticalConfig';

export default function GasStationEnergy() {
  const config = getVerticalConfig('gas-station');
  if (!config) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white"><p>Configuration not found.</p></div>;
  return <VerticalLandingPage config={config} />;
}
