/**
 * Advisor Avatar Component
 * 
 * Animated avatar for Merlin AI Energy Advisor
 * Uses Lucide icons for simple, scalable design
 */

import React from 'react';
import { Bot } from 'lucide-react';

interface AdvisorAvatarProps {
  size?: 'sm' | 'md' | 'lg';
  animate?: boolean;
}

export default function AdvisorAvatar({ 
  size = 'md',
  animate = true 
}: AdvisorAvatarProps) {
  
  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
  };

  const iconSizes = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div 
      className={`
        ${sizeClasses[size]}
        rounded-full 
        bg-gradient-to-br from-blue-500 to-purple-600
        flex items-center justify-center
        ${animate ? 'animate-pulse' : ''}
      `}
    >
      <Bot className={`${iconSizes[size]} text-white`} />
    </div>
  );
}
