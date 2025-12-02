/**
 * POWER PROFILE TRACKER
 * ======================
 * 
 * Fixed sidebar widget that shows user's progress through the wizard.
 * Gamification elements: levels, points, achievements
 * Auto-updates as user completes sections
 * 
 * Positioned on the left side of the wizard (desktop) or top (mobile)
 */

import React from 'react';
import { 
  Zap, MapPin, Building2, ClipboardList, Target, Settings, 
  FileText, CheckCircle, Circle, Sparkles, TrendingUp,
  Battery, Sun, DollarSign
} from 'lucide-react';
import merlinImage from '@/assets/images/new_Merlin.png';

// ============================================
// TYPES
// ============================================

export interface WizardSection {
  id: string;
  title: string;
  icon: React.ElementType;
  description: string;
  pointsAwarded: number;
}

export interface PowerProfileTrackerProps {
  currentSection: number;
  completedSections: string[];
  totalPoints: number;
  level: number;
  selectedIndustry?: string;
  selectedLocation?: string;
  estimatedSavings?: number;
  systemSize?: number;
  compact?: boolean;
  onShowExplainer?: () => void;
}

// ============================================
// CONSTANTS
// ============================================

export const WIZARD_SECTIONS: WizardSection[] = [
  { id: 'location', title: 'Location', icon: MapPin, description: 'Where is your project?', pointsAwarded: 10 },
  { id: 'industry', title: 'Industry', icon: Building2, description: 'What type of facility?', pointsAwarded: 15 },
  { id: 'details', title: 'Details', icon: ClipboardList, description: 'Facility specifications', pointsAwarded: 25 },
  { id: 'goals', title: 'Goals', icon: Target, description: 'What do you want to achieve?', pointsAwarded: 15 },
  { id: 'configuration', title: 'System', icon: Settings, description: 'Battery + solar sizing', pointsAwarded: 20 },
  { id: 'quote', title: 'Quote', icon: FileText, description: 'Your custom quote', pointsAwarded: 15 },
];

export const POWER_LEVELS = [
  { level: 1, name: 'Explorer', minPoints: 0, color: 'text-gray-500', gradient: 'from-gray-400 to-gray-500', emoji: '🔋' },
  { level: 2, name: 'Learner', minPoints: 25, color: 'text-blue-500', gradient: 'from-blue-400 to-blue-500', emoji: '⚡' },
  { level: 3, name: 'Analyst', minPoints: 50, color: 'text-purple-500', gradient: 'from-purple-400 to-purple-500', emoji: '📊' },
  { level: 4, name: 'Strategist', minPoints: 75, color: 'text-indigo-500', gradient: 'from-indigo-400 to-indigo-500', emoji: '🎯' },
  { level: 5, name: 'Expert', minPoints: 100, color: 'text-amber-500', gradient: 'from-amber-400 to-amber-500', emoji: '⭐' },
];

function getLevelInfo(points: number) {
  for (let i = POWER_LEVELS.length - 1; i >= 0; i--) {
    if (points >= POWER_LEVELS[i].minPoints) {
      return POWER_LEVELS[i];
    }
  }
  return POWER_LEVELS[0];
}

function getNextLevelPoints(points: number): number {
  const currentLevel = getLevelInfo(points);
  const nextLevel = POWER_LEVELS.find(l => l.minPoints > currentLevel.minPoints);
  return nextLevel?.minPoints || 100;
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function PowerProfileTracker({
  currentSection,
  completedSections,
  totalPoints,
  level,
  selectedIndustry,
  selectedLocation,
  estimatedSavings,
  systemSize,
  compact = false,
  onShowExplainer,
}: PowerProfileTrackerProps) {
  const levelInfo = getLevelInfo(totalPoints);
  const nextLevelPoints = getNextLevelPoints(totalPoints);
  const progressPercent = Math.round((completedSections.length / WIZARD_SECTIONS.length) * 100);
  
  if (compact) {
    // Mobile/compact view - horizontal bar
    return (
      <div className="bg-gradient-to-r from-purple-900 to-purple-950 border-b border-purple-500/30 px-4 py-3">
        <div className="flex items-center justify-between">
          <button 
            onClick={onShowExplainer}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <img src={merlinImage} alt="Merlin" className="w-8 h-8" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">{levelInfo.emoji} {levelInfo.name}</span>
                <span className="text-xs text-purple-300">{totalPoints} pts</span>
                <span className="text-amber-400 text-xs">ⓘ</span>
              </div>
            </div>
          </button>
          
          {/* Progress dots */}
          <div className="flex items-center gap-1.5">
            {WIZARD_SECTIONS.map((section, index) => (
              <div
                key={section.id}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  completedSections.includes(section.id)
                    ? 'bg-emerald-400'
                    : index === currentSection
                      ? 'bg-purple-400 animate-pulse'
                      : 'bg-white/20'
                }`}
              />
            ))}
          </div>
          
          <div className="text-right">
            <span className="text-lg font-bold text-purple-400">{progressPercent}%</span>
          </div>
        </div>
      </div>
    );
  }
  
  // Desktop view - vertical sidebar
  return (
    <div className="w-72 bg-gradient-to-b from-purple-950 via-purple-900 to-purple-950 border-r border-purple-500/30 flex flex-col h-full">
      {/* Header with Merlin */}
      <div className="p-5 border-b border-purple-500/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative">
            <img src={merlinImage} alt="Merlin" className="w-14 h-14" />
            <div className="absolute -bottom-1 -right-1 bg-purple-500 rounded-full p-1">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Power Profile</h3>
            <button 
              onClick={onShowExplainer}
              className="text-xs text-purple-300 hover:text-amber-300 transition-colors flex items-center gap-1"
            >
              <span>Track your journey</span>
              <span className="text-amber-400">ⓘ</span>
            </button>
          </div>
        </div>
        
        {/* Level Badge */}
        <div className={`bg-gradient-to-r ${levelInfo.gradient} rounded-xl p-3 text-center`}>
          <div className="text-2xl mb-1">{levelInfo.emoji}</div>
          <div className="text-white font-bold">{levelInfo.name}</div>
          <div className="text-white/80 text-sm">{totalPoints} points</div>
        </div>
        
        {/* Progress to next level */}
        {totalPoints < 100 && (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Progress</span>
              <span>{nextLevelPoints - totalPoints} pts to next level</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full bg-gradient-to-r ${levelInfo.gradient} transition-all duration-700`}
                style={{ width: `${(totalPoints / nextLevelPoints) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>
      
      {/* Section Checklist */}
      <div className="flex-1 p-4 overflow-y-auto">
        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Your Journey</h4>
        
        <div className="space-y-2">
          {WIZARD_SECTIONS.map((section, index) => {
            const Icon = section.icon;
            const isCompleted = completedSections.includes(section.id);
            const isCurrent = index === currentSection;
            const isUpcoming = index > currentSection && !isCompleted;
            
            return (
              <div
                key={section.id}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                  isCurrent
                    ? 'bg-purple-500/20 border border-purple-400/50 shadow-lg shadow-purple-500/20'
                    : isCompleted
                      ? 'bg-emerald-500/10 border border-emerald-400/30'
                      : 'bg-white/5 border border-transparent'
                }`}
              >
                {/* Status Icon */}
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  isCompleted
                    ? 'bg-emerald-500'
                    : isCurrent
                      ? 'bg-purple-500 animate-pulse'
                      : 'bg-slate-700'
                }`}>
                  {isCompleted ? (
                    <CheckCircle className="w-5 h-5 text-white" />
                  ) : (
                    <Icon className={`w-5 h-5 ${isCurrent ? 'text-white' : 'text-gray-400'}`} />
                  )}
                </div>
                
                {/* Section Info */}
                <div className="flex-1 min-w-0">
                  <div className={`font-medium text-sm ${
                    isCompleted ? 'text-emerald-400' : isCurrent ? 'text-white' : 'text-gray-400'
                  }`}>
                    {section.title}
                  </div>
                  <div className={`text-xs truncate ${
                    isCompleted || isCurrent ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {section.description}
                  </div>
                </div>
                
                {/* Points Badge */}
                {isCompleted && (
                  <div className="text-xs font-bold text-emerald-400">
                    +{section.pointsAwarded}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Stats Footer */}
      <div className="p-4 border-t border-purple-500/20 bg-slate-900/50">
        {/* Quick Stats */}
        {(selectedLocation || selectedIndustry || estimatedSavings) && (
          <div className="space-y-2 mb-4">
            {selectedLocation && (
              <div className="flex items-center gap-2 text-xs">
                <MapPin className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-gray-400">Location:</span>
                <span className="text-white font-medium truncate">{selectedLocation}</span>
              </div>
            )}
            {selectedIndustry && (
              <div className="flex items-center gap-2 text-xs">
                <Building2 className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-gray-400">Industry:</span>
                <span className="text-white font-medium truncate">{selectedIndustry}</span>
              </div>
            )}
            {systemSize && systemSize > 0 && (
              <div className="flex items-center gap-2 text-xs">
                <Battery className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-gray-400">System:</span>
                <span className="text-emerald-400 font-bold">{systemSize} kW</span>
              </div>
            )}
            {estimatedSavings && estimatedSavings > 0 && (
              <div className="flex items-center gap-2 text-xs">
                <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-gray-400">Est. Savings:</span>
                <span className="text-amber-400 font-bold">${estimatedSavings.toLocaleString()}/yr</span>
              </div>
            )}
          </div>
        )}
        
        {/* Overall Progress */}
        <div className="text-center">
          <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
            {progressPercent}%
          </div>
          <div className="text-xs text-gray-500">Complete</div>
        </div>
      </div>
      
      {/* Powered by Merlin */}
      <div className="p-3 border-t border-purple-500/10 text-center">
        <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
          <Zap className="w-3 h-3 text-purple-400" />
          <span>Powered by</span>
          <span className="font-bold text-purple-400">Merlin Energy</span>
        </div>
      </div>
    </div>
  );
}
