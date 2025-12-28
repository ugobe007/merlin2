/**
 * RAVS™ DISPLAY COMPONENT
 * =======================
 * 
 * Visual badge/card for displaying Risk-Adjusted Value Score
 * 
 * Features:
 * - Shield + graph motif design
 * - Traffic-light risk bands (Green/Yellow/Red)
 * - Confidence interval overlays
 * - Expandable detail view with component breakdown
 * - Animated score reveal
 * 
 * "Because the highest IRR isn't always the best decision."
 */

import React, { useState, useEffect } from 'react';
import {
  Shield,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle,
  Info,
  Zap,
  DollarSign,
  Settings,
  BarChart3,
  Target,
  Sparkles,
} from 'lucide-react';
import type { RAVSScore, RAVSFactor } from '@/services/ravsService';
import { getRAVSColor } from '@/services/ravsService';

// ============================================================================
// TYPES
// ============================================================================

export interface RAVSDisplayProps {
  score: RAVSScore;
  variant?: 'badge' | 'card' | 'full';
  animated?: boolean;
  showDetails?: boolean;
  onToggleDetails?: () => void;
  className?: string;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const RAVSDisplay: React.FC<RAVSDisplayProps> = ({
  score,
  variant = 'card',
  animated = true,
  showDetails: showDetailsProp,
  onToggleDetails,
  className = '',
}) => {
  const [displayScore, setDisplayScore] = useState(animated ? 0 : score.totalScore);
  const [showDetails, setShowDetails] = useState(showDetailsProp ?? false);
  const colors = getRAVSColor(score.totalScore);

  // Animate score on mount
  useEffect(() => {
    if (!animated) return;
    
    const duration = 1500;
    const steps = 60;
    const increment = score.totalScore / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= score.totalScore) {
        setDisplayScore(score.totalScore);
        clearInterval(timer);
      } else {
        setDisplayScore(Math.round(current));
      }
    }, duration / steps);
    
    return () => clearInterval(timer);
  }, [score.totalScore, animated]);

  // Sync external showDetails prop
  useEffect(() => {
    if (showDetailsProp !== undefined) {
      setShowDetails(showDetailsProp);
    }
  }, [showDetailsProp]);

  const handleToggle = () => {
    if (onToggleDetails) {
      onToggleDetails();
    } else {
      setShowDetails(!showDetails);
    }
  };

  // Render based on variant
  if (variant === 'badge') {
    return <RAVSBadge score={score} displayScore={displayScore} colors={colors} className={className} />;
  }

  if (variant === 'full') {
    return (
      <RAVSFullCard
        score={score}
        displayScore={displayScore}
        colors={colors}
        showDetails={showDetails}
        onToggle={handleToggle}
        className={className}
      />
    );
  }

  // Default: card variant
  return (
    <RAVSCard
      score={score}
      displayScore={displayScore}
      colors={colors}
      showDetails={showDetails}
      onToggle={handleToggle}
      className={className}
    />
  );
};

// ============================================================================
// BADGE VARIANT - Compact inline display
// ============================================================================

const RAVSBadge: React.FC<{
  score: RAVSScore;
  displayScore: number;
  colors: ReturnType<typeof getRAVSColor>;
  className?: string;
}> = ({ score, displayScore, colors, className }) => {
  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      {/* Shield Icon */}
      <div className={`relative w-10 h-10 bg-gradient-to-br ${colors.gradient} rounded-xl flex items-center justify-center shadow-lg`}>
        <Shield className="w-5 h-5 text-white" />
        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-slate-900 rounded-full flex items-center justify-center border-2 border-current">
          <span className={`text-[10px] font-bold ${colors.text}`}>{score.letterGrade}</span>
        </div>
      </div>
      
      {/* Score */}
      <div className="flex flex-col">
        <div className="flex items-baseline gap-1">
          <span className={`text-xl font-bold ${colors.text}`}>{displayScore}</span>
          <span className="text-white/40 text-xs">/100</span>
        </div>
        <span className="text-[10px] text-white/50 uppercase tracking-wide">RAVS™</span>
      </div>
    </div>
  );
};

// ============================================================================
// CARD VARIANT - Medium display with optional expand
// ============================================================================

const RAVSCard: React.FC<{
  score: RAVSScore;
  displayScore: number;
  colors: ReturnType<typeof getRAVSColor>;
  showDetails: boolean;
  onToggle: () => void;
  className?: string;
}> = ({ score, displayScore, colors, showDetails, onToggle, className }) => {
  return (
    <div className={`${colors.bg} border ${colors.border} rounded-2xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          {/* Left: Shield + Score */}
          <div className="flex items-center gap-4">
            {/* Shield with Grade */}
            <div className="relative">
              <div className={`w-16 h-16 bg-gradient-to-br ${colors.gradient} rounded-2xl flex items-center justify-center shadow-lg shadow-current/20`}>
                <Shield className="w-8 h-8 text-white" />
              </div>
              <div className={`absolute -bottom-1 -right-1 w-7 h-7 ${colors.bg} rounded-full flex items-center justify-center border-2 ${colors.border}`}>
                <span className={`text-sm font-bold ${colors.text}`}>{score.letterGrade}</span>
              </div>
            </div>
            
            {/* Score Display */}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/50 uppercase tracking-wider">RAVS™ Score</span>
                <div className="group relative">
                  <Info className="w-3.5 h-3.5 text-white/30 cursor-help" />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-800 rounded-lg text-xs text-white/70 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    Risk-Adjusted Value Score combines financial returns with execution, market, and operational risks.
                  </div>
                </div>
              </div>
              <div className="flex items-baseline gap-1 mt-1">
                <span className={`text-4xl font-bold ${colors.text}`}>{displayScore}</span>
                <span className="text-white/40 text-lg">/100</span>
              </div>
              
              {/* Risk Level Badge */}
              <div className={`inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 ${colors.bg} rounded-full`}>
                {score.riskLevel === 'low' && <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />}
                {score.riskLevel === 'medium' && <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
                {score.riskLevel === 'high' && <AlertTriangle className="w-3.5 h-3.5 text-red-400" />}
                <span className={`text-xs font-medium ${colors.text}`}>
                  {score.riskLevel.charAt(0).toUpperCase() + score.riskLevel.slice(1)} Risk
                </span>
              </div>
            </div>
          </div>
          
          {/* Right: Confidence Interval */}
          <div className="text-right">
            <div className="text-xs text-white/50 mb-1">Confidence Range</div>
            <ConfidenceBar interval={score.confidenceInterval} colors={colors} />
            <div className="text-xs text-white/40 mt-1">
              {score.confidenceInterval.low} - {score.confidenceInterval.high}
            </div>
          </div>
        </div>
        
        {/* Component Mini Bars */}
        <div className="grid grid-cols-4 gap-2 mt-4">
          <ComponentMiniBar label="Financial" score={score.components.financial.score} icon={DollarSign} />
          <ComponentMiniBar label="Execution" score={score.components.execution.score} icon={Settings} />
          <ComponentMiniBar label="Market" score={score.components.market.score} icon={BarChart3} />
          <ComponentMiniBar label="Operational" score={score.components.operational.score} icon={Zap} />
        </div>
      </div>
      
      {/* Expand Toggle */}
      <button
        onClick={onToggle}
        className="w-full py-2 px-4 bg-white/5 hover:bg-white/10 flex items-center justify-center gap-2 text-white/60 text-sm transition-colors"
      >
        {showDetails ? (
          <>
            <ChevronUp className="w-4 h-4" />
            Hide Details
          </>
        ) : (
          <>
            <ChevronDown className="w-4 h-4" />
            View Details
          </>
        )}
      </button>
      
      {/* Expanded Details */}
      {showDetails && (
        <div className="border-t border-white/10 p-4 space-y-4">
          {/* Strengths & Risks */}
          <div className="grid grid-cols-2 gap-4">
            {/* Strengths */}
            <div>
              <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium mb-2">
                <CheckCircle className="w-4 h-4" />
                Strengths
              </div>
              <ul className="space-y-1">
                {score.strengths.slice(0, 3).map((strength, i) => (
                  <li key={i} className="text-xs text-white/70 flex items-start gap-1.5">
                    <span className="text-emerald-400 mt-0.5">•</span>
                    {strength}
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Risks */}
            <div>
              <div className="flex items-center gap-2 text-amber-400 text-sm font-medium mb-2">
                <AlertTriangle className="w-4 h-4" />
                Considerations
              </div>
              <ul className="space-y-1">
                {score.risks.slice(0, 3).map((risk, i) => (
                  <li key={i} className="text-xs text-white/70 flex items-start gap-1.5">
                    <span className="text-amber-400 mt-0.5">•</span>
                    {risk}
                  </li>
                ))}
                {score.risks.length === 0 && (
                  <li className="text-xs text-white/50 italic">No significant risks identified</li>
                )}
              </ul>
            </div>
          </div>
          
          {/* Recommendations */}
          {score.recommendations.length > 0 && (
            <div className="p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
              <div className="flex items-center gap-2 text-purple-400 text-sm font-medium mb-2">
                <Sparkles className="w-4 h-4" />
                Merlin's Recommendations
              </div>
              <ul className="space-y-1">
                {score.recommendations.map((rec, i) => (
                  <li key={i} className="text-xs text-white/70">{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// FULL CARD VARIANT - Detailed breakdown
// ============================================================================

const RAVSFullCard: React.FC<{
  score: RAVSScore;
  displayScore: number;
  colors: ReturnType<typeof getRAVSColor>;
  showDetails: boolean;
  onToggle: () => void;
  className?: string;
}> = ({ score, displayScore, colors, showDetails, onToggle, className }) => {
  return (
    <div className={`bg-gradient-to-br from-slate-900 via-slate-800/50 to-slate-900 border border-purple-500/30 rounded-2xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900/50 to-indigo-900/50 border-b border-purple-500/20 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Large Shield */}
            <div className="relative">
              <div className={`w-20 h-20 bg-gradient-to-br ${colors.gradient} rounded-2xl flex items-center justify-center shadow-xl shadow-current/30`}>
                <Shield className="w-10 h-10 text-white" />
              </div>
              <div className={`absolute -bottom-2 -right-2 w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center border-2 ${colors.border}`}>
                <span className={`text-lg font-bold ${colors.text}`}>{score.letterGrade}</span>
              </div>
            </div>
            
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-purple-300 text-sm font-medium">RAVS™</span>
                <span className="text-white/40 text-xs">Risk-Adjusted Value Score</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className={`text-5xl font-bold ${colors.text}`}>{displayScore}</span>
                <span className="text-white/40 text-2xl">/100</span>
              </div>
              <p className="text-white/50 text-sm mt-1 italic">
                "Return, adjusted for reality."
              </p>
            </div>
          </div>
          
          {/* Confidence Gauge */}
          <div className="text-center">
            <ConfidenceGauge interval={score.confidenceInterval} colors={colors} />
            <div className="mt-2 text-xs text-white/50">
              {score.confidenceLevel.charAt(0).toUpperCase() + score.confidenceLevel.slice(1)} Confidence
            </div>
          </div>
        </div>
      </div>
      
      {/* Component Breakdown */}
      <div className="p-6 space-y-4">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <Target className="w-4 h-4 text-purple-400" />
          Score Components
        </h3>
        
        <div className="space-y-3">
          <ComponentDetailBar
            label="Financial Performance"
            score={score.components.financial.score}
            weight={score.components.financial.weight}
            factors={score.components.financial.factors}
            icon={DollarSign}
            color="emerald"
          />
          <ComponentDetailBar
            label="Execution Risk"
            score={score.components.execution.score}
            weight={score.components.execution.weight}
            factors={score.components.execution.factors}
            icon={Settings}
            color="blue"
          />
          <ComponentDetailBar
            label="Market Conditions"
            score={score.components.market.score}
            weight={score.components.market.weight}
            factors={score.components.market.factors}
            icon={BarChart3}
            color="purple"
          />
          <ComponentDetailBar
            label="Operational Reliability"
            score={score.components.operational.score}
            weight={score.components.operational.weight}
            factors={score.components.operational.factors}
            icon={Zap}
            color="amber"
          />
        </div>
      </div>
      
      {/* Insights */}
      <div className="border-t border-white/10 p-6">
        <div className="grid grid-cols-2 gap-6">
          {/* Strengths */}
          <div>
            <h4 className="flex items-center gap-2 text-emerald-400 font-medium mb-3">
              <CheckCircle className="w-4 h-4" />
              Key Strengths
            </h4>
            <ul className="space-y-2">
              {score.strengths.map((s, i) => (
                <li key={i} className="text-sm text-white/70 flex items-start gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
          
          {/* Risks & Recommendations */}
          <div>
            <h4 className="flex items-center gap-2 text-amber-400 font-medium mb-3">
              <AlertTriangle className="w-4 h-4" />
              Risk Factors
            </h4>
            <ul className="space-y-2">
              {score.risks.map((r, i) => (
                <li key={i} className="text-sm text-white/70 flex items-start gap-2">
                  <TrendingDown className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  {r}
                </li>
              ))}
              {score.risks.length === 0 && (
                <li className="text-sm text-white/50 italic">No significant risks identified</li>
              )}
            </ul>
          </div>
        </div>
        
        {/* Recommendations */}
        {score.recommendations.length > 0 && (
          <div className="mt-6 p-4 bg-purple-500/10 rounded-xl border border-purple-500/20">
            <h4 className="flex items-center gap-2 text-purple-400 font-medium mb-2">
              <Sparkles className="w-4 h-4" />
              Merlin's Optimization Tips
            </h4>
            <ul className="space-y-1">
              {score.recommendations.map((r, i) => (
                <li key={i} className="text-sm text-white/70">• {r}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

const ConfidenceBar: React.FC<{
  interval: { low: number; mid: number; high: number };
  colors: ReturnType<typeof getRAVSColor>;
}> = ({ interval, colors }) => {
  const range = interval.high - interval.low;
  const leftPos = (interval.low / 100) * 100;
  const width = (range / 100) * 100;
  const midPos = ((interval.mid - interval.low) / range) * 100;
  
  return (
    <div className="w-24 h-2 bg-slate-700 rounded-full relative overflow-hidden">
      {/* Range bar */}
      <div
        className={`absolute h-full bg-gradient-to-r ${colors.gradient} rounded-full opacity-60`}
        style={{ left: `${leftPos}%`, width: `${width}%` }}
      />
      {/* Mid point marker */}
      <div
        className="absolute w-1 h-full bg-white rounded-full"
        style={{ left: `${leftPos + (midPos * width / 100)}%` }}
      />
    </div>
  );
};

const ConfidenceGauge: React.FC<{
  interval: { low: number; mid: number; high: number };
  colors: ReturnType<typeof getRAVSColor>;
}> = ({ interval, colors }) => {
  return (
    <div className="relative w-32 h-16">
      {/* Background arc */}
      <svg viewBox="0 0 100 50" className="w-full h-full">
        {/* Gray background */}
        <path
          d="M 10 50 A 40 40 0 0 1 90 50"
          fill="none"
          stroke="#374151"
          strokeWidth="8"
          strokeLinecap="round"
        />
        {/* Colored range */}
        <path
          d="M 10 50 A 40 40 0 0 1 90 50"
          fill="none"
          stroke="url(#gaugeGradient)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${(interval.high - interval.low) * 1.26} 126`}
          strokeDashoffset={`-${interval.low * 1.26}`}
          className="opacity-70"
        />
        {/* Mid point marker */}
        <circle
          cx={10 + (interval.mid * 0.8)}
          cy={50 - Math.sin(Math.PI * interval.mid / 100) * 40}
          r="4"
          fill="white"
        />
        <defs>
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
        </defs>
      </svg>
      {/* Score label */}
      <div className="absolute inset-x-0 bottom-0 text-center">
        <span className={`text-lg font-bold ${colors.text}`}>{interval.mid}</span>
      </div>
    </div>
  );
};

const ComponentMiniBar: React.FC<{
  label: string;
  score: number;
  icon: React.ComponentType<{ className?: string }>;
}> = ({ label, score, icon: Icon }) => {
  const color = score >= 80 ? 'emerald' : score >= 60 ? 'amber' : 'red';
  
  return (
    <div className="text-center">
      <Icon className={`w-4 h-4 mx-auto mb-1 text-${color}-400`} />
      <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden mb-1">
        <div
          className={`h-full bg-${color}-500 rounded-full transition-all duration-500`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-[10px] text-white/50">{label}</span>
    </div>
  );
};

const ComponentDetailBar: React.FC<{
  label: string;
  score: number;
  weight: number;
  factors: RAVSFactor[];
  icon: React.ComponentType<{ className?: string }>;
  color: 'emerald' | 'blue' | 'purple' | 'amber';
}> = ({ label, score, weight, factors, icon: Icon, color }) => {
  const [expanded, setExpanded] = useState(false);
  
  const colorClasses = {
    emerald: { bg: 'bg-emerald-500', text: 'text-emerald-400', border: 'border-emerald-500/30' },
    blue: { bg: 'bg-blue-500', text: 'text-blue-400', border: 'border-blue-500/30' },
    purple: { bg: 'bg-purple-500', text: 'text-purple-400', border: 'border-purple-500/30' },
    amber: { bg: 'bg-amber-500', text: 'text-amber-400', border: 'border-amber-500/30' },
  }[color];
  
  return (
    <div className={`rounded-xl border ${colorClasses.border} overflow-hidden`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-3 flex items-center gap-3 hover:bg-white/5 transition-colors"
      >
        <Icon className={`w-5 h-5 ${colorClasses.text}`} />
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-white font-medium">{label}</span>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-bold ${colorClasses.text}`}>{score}</span>
              <span className="text-xs text-white/40">({(weight * 100).toFixed(0)}% weight)</span>
            </div>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full ${colorClasses.bg} rounded-full transition-all duration-500`}
              style={{ width: `${score}%` }}
            />
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-white/40" />
        ) : (
          <ChevronDown className="w-4 h-4 text-white/40" />
        )}
      </button>
      
      {expanded && (
        <div className="px-3 pb-3 pt-1 border-t border-white/5">
          <div className="space-y-2">
            {factors.map((factor, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  {factor.impact === 'positive' && <TrendingUp className="w-3 h-3 text-emerald-400" />}
                  {factor.impact === 'neutral' && <span className="w-3 h-3 rounded-full bg-white/20" />}
                  {factor.impact === 'negative' && <TrendingDown className="w-3 h-3 text-red-400" />}
                  <span className="text-white/70">{factor.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-white/50">{factor.description}</span>
                  <span className={`font-medium ${
                    factor.score >= 80 ? 'text-emerald-400' :
                    factor.score >= 60 ? 'text-amber-400' :
                    'text-red-400'
                  }`}>{factor.score}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RAVSDisplay;

