/**
 * Step3SystemAssist - Pure UI Component for Defaults Management
 * ==============================================================
 * 
 * Created: February 1, 2026
 * Updated: February 1, 2026 - Locked contract per Vineet's spec
 * 
 * PURE RENDERER CONTRACT:
 * This component is a PURE UI RENDERER. It:
 * - Takes booleans/numbers/callbacks from parent (computed by SSOT)
 * - Renders buttons/chips/toasts based on those values
 * - Calls parent callbacks on user actions
 * - NEVER inspects template, questions, defaults, or SSOT internals
 * 
 * Props (LOCKED CONTRACT - do not add SSOT internals):
 * - partLabel: string (what user sees)
 * - canApply: boolean (from SSOT canApplyDefaults)
 * - canReset: boolean (from SSOT canResetToDefaults)
 * - hasApplied: boolean (from SSOT hasDefaultsApplied)
 * - modifiedFieldCount?: number (computed by parent: count where answer != default)
 * - onApply(): void | Promise<void> (dispatches to SSOT)
 * - onReset(): void | Promise<void> (dispatches to SSOT)
 * 
 * UI/UX Goals:
 * - Make defaults feel like "system assist", not random buttons
 * - Confirm only destructive actions (reset) when modifiedFieldCount > 0
 * - "Suggested defaults" terminology (not "recommended")
 * - Match Merlin's dark + luminous aesthetic
 */

import React, { useState, useCallback } from "react";
import { devError } from '@/wizard/v7/debug/devLog';

// =============================================================================
// TYPES (LOCKED CONTRACT - pure UI props only)
// =============================================================================

interface Step3SystemAssistProps {
  /** Part label for display (e.g., "Profile", "Operations") */
  partLabel: string;
  
  /** SSOT query result: Can apply defaults? (defaults exist + not yet applied) */
  canApply: boolean;
  
  /** SSOT query result: Can reset to defaults? (defaults exist) */
  canReset: boolean;
  
  /** SSOT query result: Have defaults been applied? */
  hasApplied: boolean;
  
  /** SSOT action: Apply defaults for this part */
  onApply: () => void | Promise<void>;
  
  /** SSOT action: Reset to defaults for this part */
  onReset: () => void | Promise<void>;
  
  /**
   * Number of user-modified fields (where current answer != default).
   * Computed by parent from SSOT: count(questions where answer != getDefaultForQuestion(qId))
   * If undefined, treat as "unknown" and confirm reset (safer).
   */
  modifiedFieldCount?: number;
}

// =============================================================================
// RESET CONFIRMATION MODAL
// =============================================================================

interface ResetConfirmModalProps {
  partLabel: string;
  modifiedCount?: number;
  onConfirm: () => void;
  onCancel: () => void;
}

function ResetConfirmModal({ partLabel, modifiedCount, onConfirm, onCancel }: ResetConfirmModalProps) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0, 0, 0, 0.7)",
        backdropFilter: "blur(4px)",
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: "linear-gradient(145deg, rgba(18, 22, 40, 0.98), rgba(10, 14, 28, 0.98))",
          border: "1px solid rgba(255, 100, 100, 0.25)",
          borderRadius: 16,
          padding: 24,
          maxWidth: 400,
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5), 0 0 60px rgba(255, 100, 100, 0.1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Warning Icon */}
        <div style={{ fontSize: 32, marginBottom: 16, textAlign: "center" }}>⚠️</div>
        
        {/* Title */}
        <h3 style={{
          fontSize: 18,
          fontWeight: 700,
          color: "rgba(255, 200, 200, 0.95)",
          marginBottom: 12,
          textAlign: "center",
        }}>
          Reset {partLabel} to defaults?
        </h3>
        
        {/* Body */}
        <p style={{
          fontSize: 14,
          color: "rgba(232, 235, 243, 0.7)",
          lineHeight: 1.5,
          marginBottom: 8,
          textAlign: "center",
        }}>
          This will replace your current answers in <strong>{partLabel}</strong> with suggested defaults.
        </p>
        
        {/* Modified count if available */}
        {modifiedCount !== undefined && modifiedCount > 0 && (
          <p style={{
            fontSize: 13,
            color: "rgba(251, 191, 36, 0.85)",
            textAlign: "center",
            marginBottom: 20,
          }}>
            You've changed {modifiedCount} field{modifiedCount === 1 ? "" : "s"}.
          </p>
        )}
        
        {/* Buttons */}
        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 20 }}>
          <button
            onClick={onCancel}
            style={{
              padding: "10px 20px",
              borderRadius: 10,
              border: "1px solid rgba(255, 255, 255, 0.15)",
              background: "rgba(255, 255, 255, 0.05)",
              color: "rgba(232, 235, 243, 0.8)",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: "10px 20px",
              borderRadius: 10,
              border: "1px solid rgba(255, 100, 100, 0.4)",
              background: "rgba(255, 100, 100, 0.15)",
              color: "rgba(255, 150, 150, 0.95)",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// TOAST COMPONENT
// =============================================================================

interface ToastProps {
  message: string;
  type: "success" | "info";
  onClose: () => void;
}

function Toast({ message, type, onClose }: ToastProps) {
  // Auto-dismiss after 2.5s
  React.useEffect(() => {
    const timer = setTimeout(onClose, 2500);
    return () => clearTimeout(timer);
  }, [onClose]);

  const colors = type === "success" 
    ? { border: "rgba(52, 211, 153, 0.4)", bg: "rgba(52, 211, 153, 0.1)", text: "rgba(52, 211, 153, 0.95)" }
    : { border: "rgba(79, 140, 255, 0.4)", bg: "rgba(79, 140, 255, 0.1)", text: "rgba(79, 140, 255, 0.95)" };

  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 9998,
        padding: "12px 20px",
        borderRadius: 12,
        border: `1px solid ${colors.border}`,
        background: colors.bg,
        color: colors.text,
        fontSize: 14,
        fontWeight: 600,
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
        animation: "slideIn 0.2s ease-out",
      }}
    >
      {type === "success" && "✅ "}
      {message}
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

// Microcopy constant ("suggested" not "recommended" per naming alignment)
const MICROCOPY = "Suggested defaults are industry-standard starting values. You can edit anything.";

export default function Step3SystemAssist({
  partLabel,
  canApply,
  canReset,
  hasApplied,
  onApply,
  onReset,
  modifiedFieldCount,
}: Step3SystemAssistProps) {
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "info" } | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  // Handle apply defaults (may be async, with error handling)
  const handleApply = useCallback(async () => {
    setIsBusy(true);
    try {
      await onApply();
      setToast({ message: `Applied suggested defaults to ${partLabel}.`, type: "success" });
    } catch (err) {
      devError("[Step3SystemAssist] Apply failed:", err);
      setToast({ message: `Couldn't apply defaults to ${partLabel}. Try again.`, type: "info" });
    } finally {
      setIsBusy(false);
    }
  }, [onApply, partLabel]);

  // Handle reset with confirmation
  // RULE: Confirm only when modifiedFieldCount > 0
  // If modifiedFieldCount is undefined, treat as "unknown" and confirm (safer)
  const handleResetClick = useCallback(async () => {
    const shouldConfirm = modifiedFieldCount === undefined || modifiedFieldCount > 0;
    if (shouldConfirm) {
      setShowResetConfirm(true);
    } else {
      // modifiedFieldCount === 0: reset immediately (fast and clean)
      // Still use async pipeline for safety
      setIsBusy(true);
      try {
        await onReset();
        setToast({ message: `Reset ${partLabel} to defaults.`, type: "info" });
      } catch (err) {
        devError("[Step3SystemAssist] Reset failed:", err);
        setToast({ message: `Couldn't reset ${partLabel}. Try again.`, type: "info" });
      } finally {
        setIsBusy(false);
      }
    }
  }, [modifiedFieldCount, onReset, partLabel]);

  const handleResetConfirm = useCallback(async () => {
    setShowResetConfirm(false);
    setIsBusy(true);
    try {
      await onReset();
      setToast({ message: `Reset ${partLabel} to defaults.`, type: "info" });
    } catch (err) {
      devError("[Step3SystemAssist] Reset failed:", err);
      setToast({ message: `Couldn't reset ${partLabel}. Try again.`, type: "info" });
    } finally {
      setIsBusy(false);
    }
  }, [onReset, partLabel]);

  // Don't render if no actions available (avoid dead strip with only microcopy)
  // hasApplied status chip can be shown elsewhere (e.g., part header) if needed
  if (!canApply && !canReset) {
    return null;
  }

  return (
    <>
      {/* System Assist Strip */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 14px",
          borderRadius: 12,
          background: "rgba(10, 14, 28, 0.5)",
          border: "1px solid rgba(79, 140, 255, 0.15)",
          boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.03), 0 0 20px rgba(79, 140, 255, 0.05)",
          marginBottom: 20,
        }}
      >
        {/* Left: Label + Microcopy */}
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: "0.5px",
            textTransform: "uppercase",
            color: "rgba(79, 140, 255, 0.7)",
            marginBottom: 2,
          }}>
            System Assist
          </div>
          <div style={{
            fontSize: 12,
            color: "rgba(232, 235, 243, 0.5)",
            lineHeight: 1.4,
          }}>
            {MICROCOPY}
          </div>
        </div>

        {/* Right: Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginLeft: 16 }}>
          {/* Status chip: Defaults applied */}
          {hasApplied && !canApply && (
            <div style={{
              padding: "4px 10px",
              borderRadius: 999,
              background: "rgba(52, 211, 153, 0.1)",
              border: "1px solid rgba(52, 211, 153, 0.25)",
              fontSize: 11,
              fontWeight: 700,
              color: "rgba(52, 211, 153, 0.85)",
              whiteSpace: "nowrap",
            }}>
              ✓ Defaults applied
            </div>
          )}

          {/* Apply Suggested Defaults button - only render if canApply */}
          {canApply && (
            <button
              onClick={handleApply}
              disabled={isBusy}
              style={{
                padding: "8px 14px",
                borderRadius: 10,
                border: "1px solid rgba(79, 140, 255, 0.4)",
                background: "linear-gradient(145deg, rgba(79, 140, 255, 0.2), rgba(79, 140, 255, 0.1))",
                color: "rgba(79, 140, 255, 0.95)",
                fontSize: 12,
                fontWeight: 700,
                cursor: isBusy ? "not-allowed" : "pointer",
                opacity: isBusy ? 0.5 : 1,
                display: "flex",
                alignItems: "center",
                gap: 6,
                whiteSpace: "nowrap",
                transition: "all 0.2s ease",
                boxShadow: isBusy ? "none" : "0 0 12px rgba(79, 140, 255, 0.15)",
              }}
            >
              {isBusy ? (
                <>
                  <span style={{ animation: "spin 1s linear infinite" }}>⟳</span>
                  Applying...
                </>
              ) : (
                <>
                  <span style={{ fontSize: 14 }}>✨</span>
                  Apply Suggested Defaults
                </>
              )}
            </button>
          )}

          {/* Reset to Defaults button - only render if canReset */}
          {canReset && (
            <button
              onClick={handleResetClick}
              disabled={isBusy}
              style={{
                padding: "8px 14px",
                borderRadius: 10,
                border: "1px solid rgba(255, 150, 100, 0.3)",
                background: "transparent",
                color: "rgba(255, 150, 100, 0.8)",
                fontSize: 12,
                fontWeight: 600,
                cursor: isBusy ? "not-allowed" : "pointer",
                opacity: isBusy ? 0.5 : 1,
                display: "flex",
                alignItems: "center",
                gap: 6,
                whiteSpace: "nowrap",
                transition: "all 0.2s ease",
              }}
            >
              <span style={{ fontSize: 14 }}>↻</span>
              Reset to Defaults
            </button>
          )}
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <ResetConfirmModal
          partLabel={partLabel}
          modifiedCount={modifiedFieldCount}
          onConfirm={handleResetConfirm}
          onCancel={() => setShowResetConfirm(false)}
        />
      )}

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* CSS for animations (inline keyframes) */}
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}

// =============================================================================
// EXPORTS
// =============================================================================

export type { Step3SystemAssistProps };
