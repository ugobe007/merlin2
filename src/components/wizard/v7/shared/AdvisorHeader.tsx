/**
 * Advisor Header Component
 * 
 * Merlin AI avatar with subtitle
 * Used in right column of all steps
 */

import React from 'react';

interface AdvisorHeaderProps {
  size?: 'large' | 'small';
  subtitle: string | React.ReactNode;
}

export default function AdvisorHeader({ size = 'large', subtitle }: AdvisorHeaderProps) {
  return (
    <div className={`flex items-center ${size === 'large' ? 'gap-5 mb-6' : 'gap-3 mb-4'} shrink-0`}>
      <div className="relative">
        <div 
          className={`
            ${size === 'large' ? 'w-20 h-20' : 'w-12 h-12'} 
            rounded-full overflow-hidden border-2 border-purple-500/30
          `}
        >
          <img src="/images/new_profile_merlin.png" alt="Merlin AI" className="w-full h-full object-cover" />
        </div>
        <div 
          className={`
            absolute ${size === 'large' ? 'bottom-0 right-0 w-5 h-5' : '-bottom-0.5 -right-0.5 w-3 h-3'} 
            bg-green-400 rounded-full border-2 border-[#070a11] shadow-sm
          `} 
        />
      </div>
      <div className="flex-1">
        <div className={`${size === 'large' ? 'text-xl' : 'text-lg'} font-bold text-white tracking-tight`}>
          Merlin AI
        </div>
        <div className={`${size === 'large' ? 'text-sm' : 'text-xs'} text-slate-400 mt-0.5 leading-relaxed`}>
          {subtitle}
        </div>
      </div>
    </div>
  );
}
