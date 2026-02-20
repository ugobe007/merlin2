/**
 * MOBILE STEP HEADER
 * Compact header for mobile wizard steps
 * Shows step number, title, and optional subtitle
 */

import React from 'react';

interface MobileStepHeaderProps {
  stepNumber: number;
  totalSteps: number;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
}

export function MobileStepHeader({
  stepNumber,
  totalSteps,
  title,
  subtitle,
  icon,
}: MobileStepHeaderProps) {
  return (
    <div className="md:hidden px-4 pt-4 pb-3 bg-slate-950/80 backdrop-blur-lg sticky top-0 z-40 border-b border-white/5">
      {/* Step Badge + Icon */}
      <div className="flex items-center gap-3 mb-2">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#3ECF8E]/10 border border-[#3ECF8E]/20">
          {icon || (
            <span className="text-[#3ECF8E] text-sm font-bold">
              {stepNumber}/{totalSteps}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold text-white truncate">{title}</h2>
        </div>
      </div>

      {/* Subtitle */}
      {subtitle && (
        <p className="text-sm text-slate-400 leading-snug">{subtitle}</p>
      )}
    </div>
  );
}
