/**
 * Power Profile Level Indicator
 * Shows user's current Power Profile level in the wizard navigation
 */

import React from 'react';
import { Zap } from 'lucide-react';
import { getPowerProfileLevelInfo } from '@/services/powerProfileService';

interface PowerProfileIndicatorProps {
  level: number;
  points: number;
  nextLevelPoints: number;
  compact?: boolean;
}

export default function PowerProfileIndicator({
  level,
  points,
  nextLevelPoints,
  compact = false
}: PowerProfileIndicatorProps) {
  const levelInfo = getPowerProfileLevelInfo(level);
  
  // Generate star visual for current level
  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 7; i++) {
      if (i <= level) {
        // Filled star
        stars.push(
          <Zap
            key={i}
            size={compact ? 14 : 16}
            className={`fill-current ${levelInfo.color}`}
          />
        );
      } else {
        // Empty star
        stars.push(
          <Zap
            key={i}
            size={compact ? 14 : 16}
            className="text-gray-300"
          />
        );
      }
    }
    return stars;
  };

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        {renderStars()}
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-3 border border-purple-200">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`font-bold text-sm ${levelInfo.color}`}>
            Power Profile Level {level}
          </div>
          <div className="text-xs text-gray-600">
            {levelInfo.name}
          </div>
        </div>
        <div className="flex items-center gap-0.5">
          {renderStars()}
        </div>
      </div>
      
      {level < 7 && (
        <div className="mt-2">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>{points} points</span>
            <span>{nextLevelPoints - points} to next level</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full bg-gradient-to-r ${levelInfo.gradient} transition-all duration-500`}
              style={{ width: `${(points / nextLevelPoints) * 100}%` }}
            />
          </div>
        </div>
      )}
      
      {level === 7 && (
        <div className="text-xs text-center text-purple-600 font-bold mt-1">
          🎉 Maximum Level Achieved!
        </div>
      )}
    </div>
  );
}
