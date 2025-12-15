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
  Battery, Sun, DollarSign, AlertTriangle
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
  systemSize?: number;      // Power in kW
  systemKWh?: number;       // Total storage capacity in kWh
  durationHours?: number;   // Backup duration in hours
  compact?: boolean;
  onShowExplainer?: () => void;
  onSectionClick?: (sectionIndex: number) => void; // Navigate to section
  
  // Power Gap props - NEW
  neededPowerKW?: number;   // What the facility needs
  neededEnergyKWh?: number; // Energy needed
  neededDurationHours?: number; // Duration needed
  onAcceptRecommendation?: () => void; // Accept Merlin's optimal config
}

// ============================================
// CONSTANTS
// ============================================

export const WIZARD_SECTIONS: WizardSection[] = [
  { id: 'location', title: 'Location', icon: MapPin, description: 'Where is your facility?', pointsAwarded: 20 },
  { id: 'industry', title: 'Industry', icon: Building2, description: 'What type of facility?', pointsAwarded: 15 },
  { id: 'details', title: 'Facility', icon: ClipboardList, description: 'Size & specifications', pointsAwarded: 25 },
  { id: 'preferences', title: 'Preferences', icon: Target, description: 'What matters to you?', pointsAwarded: 15 },
  { id: 'savings', title: 'Savings Options', icon: Settings, description: 'Your Magic Fit results', pointsAwarded: 20 },
  { id: 'quote', title: 'Your Quote', icon: FileText, description: 'Final savings estimate', pointsAwarded: 10 },
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
  systemKWh,
  durationHours,
  compact = false,
  onShowExplainer,
  onSectionClick,
  // PowerGap props
  neededPowerKW,
  neededEnergyKWh,
  neededDurationHours,
  onAcceptRecommendation,
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
          
          {/* PROMINENT kWh/MWh/GWh Display - Mobile */}
          {systemKWh && systemKWh > 0 && (
            <div className="flex items-center gap-2 bg-emerald-500/20 px-3 py-1 rounded-lg border border-emerald-400/30">
              <Battery className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-bold text-emerald-400">
                {systemKWh >= 1000000 
                  ? `${(systemKWh / 1000000).toFixed(1)} GWh`
                  : systemKWh >= 1000 
                    ? `${(systemKWh / 1000).toFixed(1)} MWh`
                    : `${systemKWh.toLocaleString()} kWh`
                }
              </span>
              {durationHours && (
                <span className="text-xs text-purple-300">({durationHours}hr)</span>
              )}
            </div>
          )}
          
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
        
        {/* Power Profile Status - Only show after facility details (Section 2+) */}
        {currentSection >= 2 && systemSize && systemSize > 0 ? (
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl p-3 text-center">
            <div className="text-xs text-white/80 uppercase tracking-wider mb-1">Peak Demand</div>
            <div className="text-2xl font-black text-white">
              {systemSize >= 1000 ? `${(systemSize/1000).toFixed(1)} MW` : `${Math.round(systemSize)} kW`}
            </div>
            {durationHours && (
              <div className="text-white/70 text-sm">{durationHours}hr backup recommended</div>
            )}
          </div>
        ) : currentSection >= 2 ? (
          <div className="bg-gradient-to-r from-slate-600 to-slate-700 rounded-xl p-3 text-center">
            <div className="text-xs text-white/80 uppercase tracking-wider mb-1">Peak Demand</div>
            <div className="text-lg font-bold text-white/60">Calculating...</div>
            <div className="text-white/50 text-xs">Complete facility details</div>
          </div>
        ) : (
          /* Before Section 2: Show welcome message instead */
          <div className="bg-gradient-to-r from-purple-600/50 to-indigo-600/50 rounded-xl p-3 text-center">
            <div className="text-xs text-white/80 uppercase tracking-wider mb-1">Getting Started</div>
            <div className="text-sm font-medium text-white/80">Tell us about your project</div>
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
            const canNavigate = isCompleted || isCurrent || index <= currentSection;
            
            return (
              <button
                key={section.id}
                onClick={() => canNavigate && onSectionClick?.(index)}
                disabled={!canNavigate}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                  isCurrent
                    ? 'bg-purple-500/20 border border-purple-400/50 shadow-lg shadow-purple-500/20'
                    : isCompleted
                      ? 'bg-emerald-500/10 border border-emerald-400/30 hover:bg-emerald-500/20 cursor-pointer'
                      : canNavigate
                        ? 'bg-white/5 border border-transparent hover:bg-white/10 cursor-pointer'
                        : 'bg-white/5 border border-transparent opacity-50 cursor-not-allowed'
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
                
                {/* Edit indicator for completed sections */}
                {isCompleted && (
                  <span className="text-xs text-gray-500">✏️</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Stats Footer */}
      <div className="p-4 border-t border-purple-500/20 bg-slate-900/50">
        {/* POWER GAP INDICATOR - Uses ENERGY (kWh) coverage, not just power */}
        {neededPowerKW && neededPowerKW > 0 && systemSize && systemSize > 0 && (() => {
          // Calculate energy-based coverage (more accurate than power-only)
          // User's energy = systemSize (kW) × durationHours
          // Needed energy = neededPowerKW × neededDurationHours
          const userEnergyKWh = (systemSize || 0) * (durationHours || 4);
          const neededEnergyKWh_calc = (neededPowerKW || 0) * (neededDurationHours || 4);
          
          // Use the larger of power coverage or energy coverage (whichever is the bottleneck)
          const powerCoverage = neededPowerKW > 0 ? (systemSize / neededPowerKW) * 100 : 100;
          const energyCoverage = neededEnergyKWh_calc > 0 ? (userEnergyKWh / neededEnergyKWh_calc) * 100 : 100;
          
          // Overall coverage is the MINIMUM (bottleneck)
          const coverage = Math.min(150, Math.min(powerCoverage, energyCoverage));
          const hasSufficientPower = coverage >= 90; // 90% is close enough
          const isCritical = coverage < 70;
          
          return (
            <div className={`mb-4 rounded-xl p-3 border ${
              hasSufficientPower 
                ? 'bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border-emerald-400/30'
                : isCritical
                  ? 'bg-gradient-to-br from-red-500/20 to-orange-500/20 border-red-400/30'
                  : 'bg-gradient-to-br from-yellow-500/20 to-amber-500/20 border-yellow-400/30'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400 uppercase tracking-wider">Power Gap</span>
                <span className={`text-sm font-bold ${
                  hasSufficientPower ? 'text-emerald-400' : isCritical ? 'text-red-400' : 'text-yellow-400'
                }`}>
                  {Math.round(coverage)}%
                </span>
              </div>
              
              {/* Gauge bar */}
              <div className="relative h-2 bg-black/30 rounded-full overflow-hidden mb-2">
                <div className="absolute left-[60%] top-0 bottom-0 w-0.5 bg-white/20 z-10" />
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    hasSufficientPower 
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                      : isCritical
                        ? 'bg-gradient-to-r from-red-500 to-orange-500'
                        : 'bg-gradient-to-r from-yellow-500 to-amber-500'
                  }`}
                  style={{ width: `${Math.min(100, (coverage / 150) * 100)}%` }}
                />
              </div>
              
              {/* Status message */}
              <div className="flex items-center gap-2">
                {hasSufficientPower ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs text-emerald-400">Power needs met ✓</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className={`w-4 h-4 ${isCritical ? 'text-red-400' : 'text-yellow-400'}`} />
                    <span className={`text-xs ${isCritical ? 'text-red-400' : 'text-yellow-400'}`}>
                      Need {Math.round(100 - coverage)}% more
                    </span>
                    {onAcceptRecommendation && (
                      <button 
                        onClick={onAcceptRecommendation}
                        className="ml-auto text-xs text-purple-400 hover:text-purple-300 underline"
                      >
                        Fix it
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })()}
        
        {/* PROMINENT POWER DISPLAY - THE MAIN POINT! */}
        {systemKWh && systemKWh > 0 && (
          <div className="mb-4 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-xl p-3 border border-emerald-400/30">
            <div className="text-center">
              <div className="text-xs text-emerald-300 uppercase tracking-wider mb-1">Your Energy Storage</div>
              <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
                {systemKWh >= 1000000 
                  ? `${(systemKWh / 1000000).toFixed(1)} GWh`
                  : systemKWh >= 1000 
                    ? `${(systemKWh / 1000).toFixed(1)} MWh`
                    : `${systemKWh.toLocaleString()} kWh`
                }
              </div>
              {durationHours && (
                <div className="text-xs text-gray-400 mt-1">
                  {systemSize && systemSize > 0 && (
                    <span className="text-emerald-400">
                      {systemSize >= 1000000 
                        ? `${(systemSize/1000000).toFixed(1)} GW`
                        : systemSize >= 1000 
                          ? `${(systemSize/1000).toFixed(1)} MW` 
                          : `${systemSize} kW`}
                    </span>
                  )}
                  {systemSize && durationHours && <span className="mx-1">×</span>}
                  <span className="text-purple-400">{durationHours}hr backup</span>
                </div>
              )}
            </div>
          </div>
        )}
        
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
                <span className="text-gray-400">Power:</span>
                <span className="text-emerald-400 font-bold">
                  {systemSize >= 1000000 
                    ? `${(systemSize/1000000).toFixed(1)} GW`
                    : systemSize >= 1000 
                      ? `${(systemSize/1000).toFixed(1)} MW` 
                      : `${systemSize} kW`}
                </span>
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
        
        {/* Overall Progress - with step indicator */}
        <div className="text-center">
          <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
            {progressPercent}%
          </div>
          <div className="text-xs text-gray-500">
            Step {completedSections.length + 1} of {WIZARD_SECTIONS.length}
          </div>
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
