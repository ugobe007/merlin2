/**
 * Resume Progress Banner
 * 
 * Shown when saved progress is detected.
 * User can resume or start fresh.
 */

import React from 'react';
import { Clock, X, ArrowRight, RotateCcw } from 'lucide-react';
import type { SavedProgress } from '@/wizard/v7/hooks/useAutoSave';

interface ResumeProgressBannerProps {
  progress: SavedProgress;
  onResume: () => void;
  onStartFresh: () => void;
  onDismiss: () => void;
}

const STEP_NAMES: Record<string, string> = {
  location: 'Step 1: Location',
  industry: 'Step 2: Industry',
  profile: 'Step 3: Profile',
  options: 'Step 4: Options',
  magicfit: 'Step 5: MagicFit',
  results: 'Step 6: Quote',
};

export function ResumeProgressBanner({
  progress,
  onResume,
  onStartFresh,
  onDismiss,
}: ResumeProgressBannerProps) {
  const timeAgo = getTimeAgo(progress.timestamp);
  const stepName = STEP_NAMES[progress.step] || progress.step;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 animate-in slide-in-from-top duration-300">
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-purple-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Icon + Message */}
            <div className="flex items-center gap-3 flex-1">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold">
                    Welcome back!
                  </h3>
                  <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                    {timeAgo}
                  </span>
                </div>
                <p className="text-sm text-blue-100 mt-0.5">
                  You have saved progress at <span className="font-medium text-white">{stepName}</span>
                  {progress.industry && ` (${progress.industry.replace(/_/g, ' ')})`}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Resume Button */}
              <button
                onClick={onResume}
                className="flex items-center gap-2 px-4 py-2 bg-white text-blue-700 hover:bg-blue-50 font-medium text-sm rounded-lg transition-colors"
              >
                <ArrowRight className="w-4 h-4" />
                Resume Progress
              </button>

              {/* Start Fresh */}
              <button
                onClick={onStartFresh}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-medium text-sm rounded-lg transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Start Fresh
              </button>

              {/* Dismiss */}
              <button
                onClick={onDismiss}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                aria-label="Dismiss"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}
