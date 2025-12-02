/**
 * POWER PROFILE BADGE COMPONENT
 * =============================
 * 
 * Gamification UI component that displays:
 * - Current level with icon/badge
 * - Points progress bar
 * - Level-up animations
 * - Unlocked features preview
 * 
 * Integrates with powerProfileService.ts
 */

import React, { useState, useEffect } from 'react';
import { 
  Battery, 
  Zap, 
  Sun, 
  Star, 
  Trophy, 
  Crown, 
  Sparkles,
  ChevronRight,
  Lock,
  Unlock,
  Gift,
  Target,
  TrendingUp,
  Building
} from 'lucide-react';
import { 
  calculatePowerProfile, 
  getPowerProfileLevelInfo,
  type PowerProfileScore 
} from '@/services/powerProfileService';

interface PowerProfileBadgeProps {
  // Current wizard state to calculate profile
  wizardData?: {
    selectedTemplate?: string;
    useCaseData?: Record<string, any>;
    storageSizeMW?: number;
    durationHours?: number;
    location?: string;
    electricityRate?: number;
    solarMW?: number;
    windMW?: number;
    generatorMW?: number;
  };
  // Compact mode for header display
  compact?: boolean;
  // Show unlockable features
  showUnlocks?: boolean;
  // Callback when user clicks to see more
  onExpand?: () => void;
}

// Level icons mapping (using level numbers 1-7)
const LEVEL_ICONS: Record<number, React.ReactNode> = {
  1: <Battery className="w-5 h-5" />,
  2: <Zap className="w-5 h-5" />,
  3: <Target className="w-5 h-5" />,
  4: <Building className="w-5 h-5" />,
  5: <TrendingUp className="w-5 h-5" />,
  6: <Trophy className="w-5 h-5" />,
  7: <Crown className="w-5 h-5" />
};

// Level colors (using level numbers 1-7)
const LEVEL_COLORS: Record<number, { bg: string; text: string; border: string; gradient: string }> = {
  1: { 
    bg: 'bg-purple-100', 
    text: 'text-purple-600', 
    border: 'border-purple-300',
    gradient: 'from-purple-400 to-purple-600'
  },
  2: { 
    bg: 'bg-purple-100', 
    text: 'text-purple-700', 
    border: 'border-purple-400',
    gradient: 'from-purple-500 to-purple-700'
  },
  3: { 
    bg: 'bg-violet-100', 
    text: 'text-violet-700', 
    border: 'border-violet-400',
    gradient: 'from-violet-500 to-purple-600'
  },
  4: { 
    bg: 'bg-violet-100', 
    text: 'text-violet-800', 
    border: 'border-violet-500',
    gradient: 'from-violet-600 to-purple-700'
  },
  5: { 
    bg: 'bg-indigo-100', 
    text: 'text-indigo-700', 
    border: 'border-indigo-400',
    gradient: 'from-indigo-500 to-purple-600'
  },
  6: { 
    bg: 'bg-indigo-100', 
    text: 'text-indigo-800', 
    border: 'border-indigo-500',
    gradient: 'from-indigo-600 to-purple-700'
  },
  7: { 
    bg: 'bg-gradient-to-r from-amber-100 via-purple-100 to-blue-100', 
    text: 'text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-purple-600 to-blue-600', 
    border: 'border-amber-400',
    gradient: 'from-amber-400 via-purple-500 to-blue-500'
  }
};

// Level thresholds and names
const LEVEL_THRESHOLDS = [0, 11, 21, 31, 46, 61, 81, 100];

const PowerProfileBadge: React.FC<PowerProfileBadgeProps> = ({
  wizardData = {},
  compact = false,
  showUnlocks = false,
  onExpand
}) => {
  const [profile, setProfile] = useState<PowerProfileScore>(calculatePowerProfile(wizardData));
  const [levelInfo, setLevelInfo] = useState(getPowerProfileLevelInfo(profile.level));
  const [showAnimation, setShowAnimation] = useState(false);
  const [previousLevel, setPreviousLevel] = useState(profile.level);

  // Recalculate when wizard data changes
  useEffect(() => {
    const newProfile = calculatePowerProfile(wizardData);
    const newLevelInfo = getPowerProfileLevelInfo(newProfile.level);
    
    // Detect level up
    if (newProfile.level > previousLevel) {
      setShowAnimation(true);
      setTimeout(() => setShowAnimation(false), 2000);
    }
    
    setPreviousLevel(profile.level);
    setProfile(newProfile);
    setLevelInfo(newLevelInfo);
  }, [wizardData]);

  const colors = LEVEL_COLORS[profile.level] || LEVEL_COLORS[1];
  const progressPercent = Math.min((profile.points / 100) * 100, 100);

  // Find next level threshold
  const nextLevelThreshold = LEVEL_THRESHOLDS[profile.level] || 100;
  const currentLevelThreshold = LEVEL_THRESHOLDS[profile.level - 1] || 0;
  const progressToNextLevel = profile.level < 7 
    ? ((profile.points - currentLevelThreshold) / (nextLevelThreshold - currentLevelThreshold)) * 100
    : 100;

  // Compact mode - just show badge and points
  if (compact) {
    return (
      <button
        onClick={onExpand}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${colors.bg} ${colors.border} border transition-all hover:scale-105 hover:shadow-md`}
      >
        <div className={`${colors.text}`}>
          {LEVEL_ICONS[profile.level]}
        </div>
        <span className={`text-sm font-semibold ${colors.text}`}>
          {profile.points} pts
        </span>
        {showAnimation && (
          <span className="text-lg animate-bounce">🎉</span>
        )}
      </button>
    );
  }

  // Full badge display
  return (
    <div className={`rounded-xl border-2 ${colors.border} ${colors.bg} p-4 relative overflow-hidden ${showAnimation ? 'animate-pulse' : ''}`}>
      {/* Level-up celebration overlay */}
      {showAnimation && (
        <div className="absolute inset-0 bg-gradient-to-r from-amber-400/20 via-purple-400/20 to-blue-400/20 animate-pulse flex items-center justify-center z-10">
          <div className="text-4xl animate-bounce">🎉</div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-gradient-to-br ${colors.gradient} text-white shadow-lg`}>
            {LEVEL_ICONS[profile.level]}
          </div>
          <div>
            <h4 className={`font-bold ${profile.level === 7 ? colors.text : colors.text}`}>
              {levelInfo.icon} {levelInfo.name}
            </h4>
            <p className="text-xs text-gray-500">{levelInfo.description}</p>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-2xl font-bold ${colors.text}`}>
            {profile.points}
          </div>
          <p className="text-xs text-gray-500">/ 100 points</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={`h-full bg-gradient-to-r ${colors.gradient} transition-all duration-500 ease-out`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        {profile.level < 7 && (
          <div className="flex justify-between mt-1">
            <span className="text-xs text-gray-500">
              {profile.points} pts
            </span>
            <span className="text-xs text-gray-500">
              Next level: {nextLevelThreshold} pts
            </span>
          </div>
        )}
      </div>

      {/* Current Benefits */}
      <div className="mb-3">
        <h5 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
          Your Benefits
        </h5>
        <div className="flex flex-wrap gap-1">
          {profile.benefits.slice(0, 3).map((benefit, i) => (
            <span key={i} className="px-2 py-0.5 bg-white rounded-full text-xs border border-gray-200 flex items-center gap-1">
              <Unlock className="w-3 h-3 text-green-500" />
              {benefit}
            </span>
          ))}
          {profile.benefits.length > 3 && (
            <span className="px-2 py-0.5 bg-gray-100 rounded-full text-xs text-gray-500">
              +{profile.benefits.length - 3} more
            </span>
          )}
        </div>
      </div>

      {/* Completed Checks */}
      {profile.completedChecks.length > 0 && (
        <div className="pt-3 border-t border-gray-200">
          <h5 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
            Completed ({profile.completedChecks.length})
          </h5>
          <div className="flex flex-wrap gap-1">
            {profile.completedChecks.slice(0, 5).map((check, i) => (
              <span key={i} className="px-2 py-0.5 bg-green-50 rounded-full text-xs text-green-700 border border-green-200">
                ✓ {check.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Expand Button */}
      {onExpand && (
        <button
          onClick={onExpand}
          className="w-full mt-3 py-2 text-center text-sm text-gray-600 hover:text-purple-600 flex items-center justify-center gap-1 transition-colors"
        >
          View All Progress
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default PowerProfileBadge;

// Mini badge for header/navigation
export const PowerProfileMini: React.FC<{ points: number; level: number }> = ({ points, level }) => {
  const colors = LEVEL_COLORS[level] || LEVEL_COLORS[1];
  const levelInfo = getPowerProfileLevelInfo(level);
  
  return (
    <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${colors.bg} border ${colors.border}`}>
      <div className={`${colors.text}`}>
        {LEVEL_ICONS[level]}
      </div>
      <span className={`text-sm font-semibold ${colors.text}`}>
        {levelInfo.icon} {points}
      </span>
    </div>
  );
};
