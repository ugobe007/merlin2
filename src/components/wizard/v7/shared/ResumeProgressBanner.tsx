/**
 * Resume Progress Banner
 *
 * Shown when saved progress is detected.
 * User can resume or start fresh.
 */

import React from "react";
import { Clock, X, ArrowRight, RotateCcw } from "lucide-react";
import type { SavedProgress } from "@/wizard/v7/hooks/useAutoSave";

interface ResumeProgressBannerProps {
  progress: SavedProgress;
  onResume: () => void;
  onStartFresh: () => void;
  onDismiss: () => void;
}

const STEP_NAMES: Record<string, string> = {
  location: "Step 1: Location",
  industry: "Step 2: Industry",
  profile: "Step 3: Profile",
  options: "Step 4: Options",
  magicfit: "Step 5: MagicFit",
  results: "Step 6: Quote",
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
      {/* Supabase-style: near-black panel, hairline border, no gradient fill */}
      <div
        style={{
          background: "rgba(10, 10, 14, 0.97)",
          borderBottom: "1px solid rgba(52,211,153,0.18)",
          boxShadow: "0 1px 0 rgba(52,211,153,0.06), 0 4px 24px rgba(0,0,0,0.5)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Icon + Message */}
            <div className="flex items-center gap-3 flex-1">
              <div
                className="flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center"
                style={{
                  background: "rgba(52,211,153,0.07)",
                  border: "1px solid rgba(52,211,153,0.30)",
                  boxShadow: "0 0 8px rgba(52,211,153,0.12)",
                }}
              >
                <Clock className="w-4 h-4" style={{ color: "#34d399" }} />
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-white">Welcome back!</h3>
                  <span
                    className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                    style={{
                      background: "rgba(52,211,153,0.06)",
                      border: "1px solid rgba(52,211,153,0.25)",
                      color: "#6ee7b7",
                    }}
                  >
                    {timeAgo}
                  </span>
                </div>
                <p className="text-[13px] mt-0.5" style={{ color: "rgba(255,255,255,0.38)" }}>
                  You have saved progress at <span style={{ color: "#67e8f9" }}>{stepName}</span>
                  {progress.industry && (
                    <span style={{ color: "#34d399" }}>
                      {" "}
                      ({progress.industry.replace(/_/g, " ")})
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Resume — cyan primary ghost */}
              <button
                onClick={onResume}
                className="flex items-center gap-2 px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-150"
                style={{
                  background: "transparent",
                  border: "1px solid rgba(34,211,238,0.65)",
                  color: "#67e8f9",
                  boxShadow: "0 0 10px rgba(34,211,238,0.18), inset 0 0 6px rgba(34,211,238,0.04)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(34,211,238,0.07)";
                  e.currentTarget.style.borderColor = "rgba(34,211,238,0.9)";
                  e.currentTarget.style.boxShadow =
                    "0 0 16px rgba(34,211,238,0.28), inset 0 0 8px rgba(34,211,238,0.06)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.borderColor = "rgba(34,211,238,0.65)";
                  e.currentTarget.style.boxShadow =
                    "0 0 10px rgba(34,211,238,0.18), inset 0 0 6px rgba(34,211,238,0.04)";
                }}
              >
                <ArrowRight className="w-3.5 h-3.5" />
                Resume Progress
              </button>

              {/* Start Fresh — emerald ghost */}
              <button
                onClick={onStartFresh}
                className="flex items-center gap-2 px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-150"
                style={{
                  background: "transparent",
                  border: "1px solid rgba(52,211,153,0.35)",
                  color: "#6ee7b7",
                  boxShadow: "0 0 8px rgba(52,211,153,0.10), inset 0 0 4px rgba(52,211,153,0.04)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(52,211,153,0.05)";
                  e.currentTarget.style.borderColor = "rgba(52,211,153,0.6)";
                  e.currentTarget.style.boxShadow =
                    "0 0 14px rgba(52,211,153,0.18), inset 0 0 6px rgba(52,211,153,0.06)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.borderColor = "rgba(52,211,153,0.35)";
                  e.currentTarget.style.boxShadow =
                    "0 0 8px rgba(52,211,153,0.10), inset 0 0 4px rgba(52,211,153,0.04)";
                }}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Start Fresh
              </button>

              {/* Dismiss */}
              <button
                onClick={onDismiss}
                className="p-1.5 rounded-md transition-all duration-150"
                style={{ color: "rgba(255,255,255,0.28)" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                  e.currentTarget.style.color = "rgba(255,255,255,0.55)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "rgba(255,255,255,0.28)";
                }}
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" />
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

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}
