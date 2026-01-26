/**
 * Power Gauge Component
 * 
 * Visual gauge showing peak power demand
 */

import React from 'react';

interface PowerGaugeProps {
  peakKW: number;
}

export default function PowerGauge({ peakKW }: PowerGaugeProps) {
  
  // Normalize to 0-100 scale (assume max 2000 kW for display)
  const maxKW = 2000;
  const percentage = Math.min((peakKW / maxKW) * 100, 100);

  return (
    <div className="relative">
      
      {/* Background Circle */}
      <svg className="w-full h-32" viewBox="0 0 200 100">
        {/* Background Arc */}
        <path
          d="M 20 90 A 80 80 0 0 1 180 90"
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="12"
          strokeLinecap="round"
        />
        
        {/* Foreground Arc (animated) */}
        <path
          d="M 20 90 A 80 80 0 0 1 180 90"
          fill="none"
          stroke="url(#gradient)"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${percentage * 2.51} 251`}
          className="transition-all duration-500"
        />

        {/* Gradient Definition */}
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
      </svg>

      {/* Center Value */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center mb-6">
          <div className="text-3xl font-bold text-gray-900">
            {Math.round(peakKW)}
          </div>
          <div className="text-xs text-gray-500">kW Peak</div>
        </div>
      </div>

    </div>
  );
}
