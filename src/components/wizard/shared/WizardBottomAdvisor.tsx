/**
 * WIZARD BOTTOM ADVISOR
 * =====================
 *
 * Collapsible bottom panel with Merlin guidance that persists across all wizard steps.
 *
 * Features:
 * - Auto-expands on answer/milestone with contextual messages
 * - Shows progressive savings estimate (narrows as confidence improves)
 * - Solar potential visualization
 * - Contextual tips and insights
 * - User controls: expand/collapse, pin, resize
 * - Smooth animations
 *
 * Created: Jan 15, 2026
 * Part of: Vineet's UX redesign
 */

import React, { useState, useEffect, useRef } from "react";
import {
  ChevronUp,
  ChevronDown,
  Pin,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Lightbulb,
  Lock,
  Unlock,
  Award,
} from "lucide-react";

// ============================================
// TYPES
// ============================================

interface DiscoveryClue {
  id: string;
  icon: React.ReactNode;
  title: string;
  secret: string;
  unlocked: boolean;
  unlockedBy: string;
  category: "savings" | "opportunity" | "warning" | "bonus";
  impactValue?: string;
}

interface WizardBottomAdvisorProps {
  currentStep: number;
  totalSteps: number;
  wizardState: Record<string, unknown>;
  estimate: {
    low: number;
    high: number;
    confidence: number;
  };
  solarPotential?: {
    systemSize: number;
    coverage: number;
  };
  discoveryClues?: DiscoveryClue[];
  onExpand?: () => void;
  onCollapse?: () => void;
  onBack?: () => void;
  onContinue?: () => void;
  onGetQuote?: () => void;
  canProceed?: boolean;
  quietMode?: boolean; // NEW: Minimal display during question flow
  hideOnStep?: boolean; // NEW: Completely hide on certain steps
}

interface AdvisorMessage {
  text: string;
  tip?: string;
  celebration?: boolean;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const getConfidenceColor = (confidence: number): string => {
  if (confidence < 40) return "#ef4444"; // Red
  if (confidence < 70) return "#f59e0b"; // Amber
  return "#10b981"; // Green
};

const getAdvisorMessage = (
  step: number,
  wizardState: Record<string, unknown>,
  estimate: { confidence: number }
): AdvisorMessage => {
  // Step-specific messages
  switch (step) {
    case 1: // Location
      if (wizardState.detectedBusiness) {
        return {
          text: `Great! I found your business. Based on ${wizardState.businessType || "similar facilities"} in ${wizardState.state}, you're looking at excellent savings potential.`,
          tip: "High electricity rates and solar potential detected!",
        };
      }
      return {
        text: "Let's start by finding your facility. I'll detect your business type and utility rates automatically.",
        tip: "The more accurate your address, the better my estimate!",
      };

    case 2: // Industry
      if (wizardState.industryDetected) {
        return {
          text: `Perfect! ${wizardState.industry} facilities are ideal for solar + BESS. Consistent loads and high demand charges mean big savings.`,
          tip: `${wizardState.industry}s in your area typically save 60-75% on energy costs.`,
        };
      }
      return {
        text: "Choose your industry so I can provide industry-specific benchmarks and sizing recommendations.",
      };

    case 3: {
      // Details
      const questionsAnswered = Object.keys(wizardState.answers || {}).length;
      const totalQuestions = wizardState.totalQuestions || 15;
      const progress = Math.round((questionsAnswered / totalQuestions) * 100);

      if (progress >= 100) {
        return {
          text: "🎉 Perfect! I have everything I need. Your estimate is highly accurate now.",
          tip: `Confidence: ${estimate.confidence}% - Ready to configure your system!`,
          celebration: true,
        };
      } else if (progress >= 67) {
        return {
          text: `Almost there! ${totalQuestions - questionsAnswered} questions left. Your estimate is getting very precise.`,
          tip: "Pro tip: The more details you provide, the more accurate your savings calculation.",
        };
      } else if (progress >= 34) {
        return {
          text: `Great progress! Each answer helps me refine your savings estimate and system size.`,
          tip: "Your estimate range is narrowing - this means higher confidence!",
        };
      } else {
        return {
          text: "Let's learn about your facility. Each answer helps me calculate your optimal system.",
          tip: "I can pre-fill some answers if I found your business in Step 1!",
        };
      }
    }
    case 4: // Configuration
      return {
        text: "I've recommended the optimal system size based on your facility profile. Feel free to adjust and see the impact!",
        tip: "Bigger systems aren't always better - watch the payback period as you adjust.",
      };

    case 5: // Results
      return {
        text: `🎊 Your custom proposal is ready! This is a TrueQuote™ with every number traceable to authoritative sources.`,
        tip: `You're in the top ${100 - estimate.confidence}% of facilities I've analyzed!`,
        celebration: true,
      };

    default:
      return {
        text: "Let me guide you through building your energy savings proposal.",
      };
  }
};

// ============================================
// COMPONENT (WITH HOOKS-SAFE PATTERN)
// ============================================

/**
 * Outer shell: Handles early returns WITHOUT hooks
 */
export const WizardBottomAdvisor: React.FC<WizardBottomAdvisorProps> = (props) => {
  // Hide early if needed - NO HOOKS HERE
  if (props.hideOnStep) return null;

  // Delegate to inner component that uses hooks
  return <WizardBottomAdvisorInner {...props} />;
};

/**
 * Inner component: ALL hooks live here safely
 */
const WizardBottomAdvisorInner: React.FC<WizardBottomAdvisorProps> = ({
  currentStep,
  totalSteps,
  wizardState,
  estimate,
  solarPotential,
  discoveryClues = [],
  onExpand,
  onCollapse,
  onBack,
  onContinue,
  onGetQuote,
  canProceed = true,
  quietMode = false,
}) => {
  // ✅ DEFAULT: Minimized unless user explicitly opens
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [panelHeight, setPanelHeight] = useState(250);
  const [isResizing, setIsResizing] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [previousUnlockedCount, setPreviousUnlockedCount] = useState(0);
  const resizeStartY = useRef(0);
  const resizeStartHeight = useRef(0);

  // Split discovery clues into unlocked/locked
  const unlockedClues = discoveryClues.filter((c) => c.unlocked);
  const lockedClues = discoveryClues.filter((c) => !c.unlocked);

  const message = getAdvisorMessage(currentStep, wizardState, estimate);
  const confidenceColor = getConfidenceColor(estimate.confidence);
  const _estimateRange = estimate.high - estimate.low;
  const _rangeWidth = estimate.confidence > 0 ? (estimate.confidence / 100) * 100 : 10;

  // Auto-expand when new suggestions unlock (DISABLED in quiet mode)
  useEffect(() => {
    if (quietMode) return; // Don't auto-expand in quiet mode
    if (unlockedClues.length > previousUnlockedCount && previousUnlockedCount > 0) {
      // New suggestion unlocked - auto-expand and show suggestions
      setIsExpanded(true);
      setShowSuggestions(true);
      onExpand?.();

      // Auto-collapse after 8 seconds unless pinned
      if (!isPinned) {
        const timer = setTimeout(() => {
          setIsExpanded(false);
          onCollapse?.();
        }, 8000);
        return () => clearTimeout(timer);
      }
    }
    setPreviousUnlockedCount(unlockedClues.length);
    return undefined;
  }, [unlockedClues.length, previousUnlockedCount, isPinned, onExpand, onCollapse, quietMode]);

  // Auto-expand logic on step change
  useEffect(() => {
    if (!isPinned) {
      // Auto-expand on step change
      setIsExpanded(true);
      onExpand?.();

      // Auto-collapse after 5 seconds unless pinned
      const timer = setTimeout(() => {
        if (!isPinned) {
          setIsExpanded(false);
          onCollapse?.();
        }
      }, 5000);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [currentStep, isPinned, onExpand, onCollapse, quietMode]);

  // Handle manual expand/collapse
  const handleToggle = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    if (newState) {
      onExpand?.();
    } else {
      onCollapse?.();
    }
  };

  // Handle pin toggle
  const handlePin = () => {
    setIsPinned(!isPinned);
    if (!isPinned) {
      setIsExpanded(true);
      onExpand?.();
    }
  };

  // Handle resize
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    resizeStartY.current = e.clientY;
    resizeStartHeight.current = panelHeight;
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const delta = resizeStartY.current - e.clientY;
      const newHeight = Math.max(100, Math.min(400, resizeStartHeight.current + delta));
      setPanelHeight(newHeight);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: quietMode
          ? "linear-gradient(180deg, #1e293b 0%, #0f172a 100%)" // Subtle gray in quiet mode
          : "linear-gradient(180deg, #5b21b6 0%, #4c1d95 100%)", // Purple in normal mode
        borderTop: quietMode ? "1px solid #334155" : "2px solid #7c3aed",
        boxShadow: quietMode
          ? "0 -2px 10px rgba(0, 0, 0, 0.2)" // Subtle shadow in quiet mode
          : "0 -4px 20px rgba(124, 58, 237, 0.3)",
        zIndex: 9999,
        transition: "all 0.3s ease",
        height: quietMode ? "40px" : isExpanded ? `${panelHeight}px` : "50px", // Thinner in quiet mode
        overflow: "hidden",
      }}
    >
      {/* Resize Handle (only visible when expanded) */}
      {isExpanded && (
        <div
          onMouseDown={handleResizeStart}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "8px",
            cursor: "ns-resize",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "transparent",
            transition: "background 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(139, 92, 246, 0.2)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
          }}
        >
          <div
            style={{
              width: "40px",
              height: "4px",
              borderRadius: "2px",
              background: "rgba(255, 255, 255, 0.3)",
            }}
          />
        </div>
      )}

      {/* QUIET MODE: Minimal Progress Bar (40px height) */}
      {quietMode && (
        <div
          style={{
            height: "40px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 24px",
            gap: "12px",
          }}
        >
          <span style={{ fontSize: "12px", color: "#94a3b8" }}>
            Step {currentStep} of {totalSteps}
          </span>
          <div
            style={{
              flex: 1,
              maxWidth: "400px",
              height: "4px",
              background: "#334155",
              borderRadius: "2px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${(currentStep / totalSteps) * 100}%`,
                height: "100%",
                background: "linear-gradient(90deg, #8b5cf6 0%, #a855f7 100%)",
                transition: "width 0.3s ease",
              }}
            />
          </div>
          <span style={{ fontSize: "12px", color: "#64748b" }}>
            {formatCurrency(estimate.low)} - {formatCurrency(estimate.high)}
          </span>
        </div>
      )}

      {/* NORMAL MODE: Collapsed State (50px tab) */}
      {!quietMode && !isExpanded && (
        <div
          style={{
            height: "50px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 24px",
            cursor: "pointer",
          }}
          onClick={handleToggle}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ fontSize: "24px" }}>🧙‍♂️</div>
            <div style={{ fontSize: "14px", fontWeight: "600", color: "#ffffff" }}>
              Merlin Advisor
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
            {/* Quick metrics */}
            <div style={{ fontSize: "14px", fontWeight: "600", color: "#e9d5ff" }}>
              {formatCurrency(estimate.low)} - {formatCurrency(estimate.high)}/year
            </div>
            {solarPotential && (
              <div style={{ fontSize: "14px", color: "#e9d5ff" }}>
                ☀️ {solarPotential.systemSize}kW
              </div>
            )}
            <button
              style={{
                padding: "4px 8px",
                borderRadius: "6px",
                border: "1px solid rgba(255, 255, 255, 0.3)",
                background: "rgba(255, 255, 255, 0.1)",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                cursor: "pointer",
              }}
            >
              <ChevronUp size={16} color="#ffffff" />
              <span style={{ fontSize: "12px" }}>Expand</span>
            </button>
          </div>
        </div>
      )}

      {/* NORMAL MODE: Expanded State */}
      {!quietMode && isExpanded && (
        <div
          style={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
            padding: "16px 24px",
            paddingTop: "24px",
          }}
        >
          {/* Header with controls */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: "16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ fontSize: "28px" }}>🧙‍♂️</div>
              <div>
                <div style={{ fontSize: "16px", fontWeight: "700", color: "#ffffff" }}>
                  Merlin Advisor
                </div>
                <div style={{ fontSize: "12px", color: "#e9d5ff" }}>
                  {message.celebration ? "🎉 " : ""}
                  Step {currentStep} of {totalSteps}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={handlePin}
                style={{
                  padding: "6px",
                  borderRadius: "6px",
                  border: "1px solid rgba(255, 255, 255, 0.3)",
                  background: isPinned ? "#7c3aed" : "rgba(255, 255, 255, 0.1)",
                  color: "#ffffff",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  transition: "all 0.2s",
                }}
                title={isPinned ? "Unpin panel" : "Pin panel open"}
              >
                <Pin size={16} color="#ffffff" />
              </button>
              <button
                onClick={handleToggle}
                style={{
                  padding: "6px",
                  borderRadius: "6px",
                  border: "1px solid rgba(255, 255, 255, 0.3)",
                  background: "rgba(255, 255, 255, 0.1)",
                  color: "#ffffff",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                }}
                title="Collapse panel"
              >
                <ChevronDown size={16} color="#ffffff" />
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div style={{ flex: 1, display: "flex", gap: "24px", overflow: "auto" }}>
            {/* Left: Message & Tip */}
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: "14px",
                  lineHeight: "1.6",
                  color: "#ffffff",
                  marginBottom: "12px",
                }}
              >
                {message.text}
              </div>

              {message.tip && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "8px",
                    padding: "12px",
                    background: "rgba(255, 255, 255, 0.1)",
                    borderRadius: "8px",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                  }}
                >
                  <div style={{ fontSize: "16px" }}>💡</div>
                  <div style={{ fontSize: "13px", color: "#e9d5ff", lineHeight: "1.4" }}>
                    {message.tip}
                  </div>
                </div>
              )}
            </div>

            {/* Right: Metrics */}
            <div
              style={{
                minWidth: "320px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              {/* Estimate Range */}
              <div
                style={{
                  padding: "12px",
                  background: "rgba(0, 0, 0, 0.2)",
                  borderRadius: "8px",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                }}
              >
                <div
                  style={{
                    fontSize: "11px",
                    color: "#e9d5ff",
                    marginBottom: "4px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Your Opportunity
                </div>
                <div style={{ fontSize: "20px", fontWeight: "700", color: "#ffffff" }}>
                  {formatCurrency(estimate.low)} - {formatCurrency(estimate.high)}
                </div>
                <div style={{ fontSize: "12px", color: "#e9d5ff", marginBottom: "8px" }}>
                  per year
                </div>

                {/* Confidence Bar */}
                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "11px",
                      marginBottom: "4px",
                    }}
                  >
                    <span style={{ color: "#e9d5ff" }}>Confidence</span>
                    <span style={{ color: confidenceColor, fontWeight: "600" }}>
                      {estimate.confidence}%
                    </span>
                  </div>
                  <div
                    style={{
                      height: "6px",
                      background: "rgba(255, 255, 255, 0.1)",
                      borderRadius: "3px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${estimate.confidence}%`,
                        height: "100%",
                        background: confidenceColor,
                        transition: "width 0.5s ease",
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Solar Potential */}
              {solarPotential && (
                <div
                  style={{
                    padding: "12px",
                    background: "rgba(0, 0, 0, 0.2)",
                    borderRadius: "8px",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#e9d5ff",
                      marginBottom: "4px",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Solar Potential
                  </div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                    <div style={{ fontSize: "20px", fontWeight: "700", color: "#ffffff" }}>
                      {solarPotential.systemSize} kW
                    </div>
                    <div style={{ fontSize: "14px", color: "#e9d5ff" }}>system</div>
                  </div>
                  <div style={{ fontSize: "12px", color: "#e9d5ff" }}>
                    {solarPotential.coverage}% of your energy
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Suggestions & Tips Section */}
          {discoveryClues.length > 0 && (
            <div
              style={{
                borderTop: "1px solid rgba(255, 255, 255, 0.1)",
                paddingTop: "12px",
                marginTop: "12px",
              }}
            >
              <button
                onClick={() => setShowSuggestions(!showSuggestions)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  background: showSuggestions
                    ? "rgba(139, 92, 246, 0.1)"
                    : "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Lightbulb size={16} color="#a78bfa" />
                  <span style={{ fontSize: "13px", fontWeight: "600", color: "#ffffff" }}>
                    Suggestions & Tips
                  </span>
                  {unlockedClues.length > 0 && (
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: "12px",
                        background: "rgba(251, 191, 36, 0.2)",
                        color: "#fbbf24",
                        fontSize: "11px",
                        fontWeight: "600",
                      }}
                    >
                      {unlockedClues.length} new
                    </span>
                  )}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    color: "#e9d5ff",
                    fontSize: "12px",
                  }}
                >
                  <span>
                    {unlockedClues.length}/{discoveryClues.length}
                  </span>
                  {showSuggestions ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </div>
              </button>

              {showSuggestions && (
                <div
                  style={{
                    marginTop: "12px",
                    maxHeight: "200px",
                    overflowY: "auto",
                  }}
                >
                  {/* Unlocked Suggestions */}
                  {unlockedClues.length > 0 && (
                    <div style={{ marginBottom: "12px" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          marginBottom: "8px",
                        }}
                      >
                        <Unlock size={12} color="#10b981" />
                        <span
                          style={{
                            fontSize: "10px",
                            fontWeight: "600",
                            color: "#10b981",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                          }}
                        >
                          Unlocked ({unlockedClues.length})
                        </span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        {unlockedClues.map((clue) => (
                          <div
                            key={clue.id}
                            style={{
                              padding: "8px",
                              borderRadius: "6px",
                              background: "rgba(16, 185, 129, 0.1)",
                              border: "1px solid rgba(16, 185, 129, 0.2)",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "start", gap: "8px" }}>
                              <div style={{ color: "#10b981", marginTop: "2px" }}>{clue.icon}</div>
                              <div style={{ flex: 1 }}>
                                <div
                                  style={{
                                    fontSize: "11px",
                                    fontWeight: "600",
                                    color: "#ffffff",
                                    marginBottom: "2px",
                                  }}
                                >
                                  {clue.title}
                                </div>
                                <div
                                  style={{ fontSize: "10px", color: "#e9d5ff", lineHeight: "1.4" }}
                                >
                                  {clue.secret}
                                </div>
                                {clue.impactValue && (
                                  <div
                                    style={{
                                      marginTop: "4px",
                                      display: "inline-block",
                                      padding: "2px 6px",
                                      borderRadius: "4px",
                                      background: "rgba(251, 191, 36, 0.2)",
                                      color: "#fbbf24",
                                      fontSize: "9px",
                                      fontWeight: "600",
                                    }}
                                  >
                                    {clue.impactValue}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Locked Suggestions (teasers) */}
                  {lockedClues.length > 0 && (
                    <div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          marginBottom: "8px",
                        }}
                      >
                        <Lock size={12} color="#64748b" />
                        <span
                          style={{
                            fontSize: "10px",
                            fontWeight: "600",
                            color: "#64748b",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                          }}
                        >
                          More to discover ({lockedClues.length})
                        </span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        {lockedClues.slice(0, 3).map((clue) => (
                          <div
                            key={clue.id}
                            style={{
                              padding: "8px",
                              borderRadius: "6px",
                              background: "rgba(0, 0, 0, 0.2)",
                              border: "1px solid rgba(255, 255, 255, 0.1)",
                              opacity: 0.6,
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "start", gap: "8px" }}>
                              <div style={{ color: "#64748b", marginTop: "2px" }}>
                                <Lock size={12} />
                              </div>
                              <div style={{ flex: 1 }}>
                                <div
                                  style={{
                                    fontSize: "11px",
                                    fontWeight: "600",
                                    color: "#94a3b8",
                                    marginBottom: "2px",
                                  }}
                                >
                                  {clue.title}
                                </div>
                                <div
                                  style={{
                                    fontSize: "10px",
                                    color: "#64748b",
                                    lineHeight: "1.4",
                                    fontStyle: "italic",
                                  }}
                                >
                                  {clue.secret}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                        {lockedClues.length > 3 && (
                          <div
                            style={{
                              fontSize: "10px",
                              color: "#64748b",
                              textAlign: "center",
                              marginTop: "4px",
                              fontStyle: "italic",
                            }}
                          >
                            +{lockedClues.length - 3} more to unlock...
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Progress Indicator */}
                  {unlockedClues.length === discoveryClues.length && (
                    <div
                      style={{
                        marginTop: "12px",
                        padding: "8px",
                        borderRadius: "6px",
                        background: "rgba(16, 185, 129, 0.1)",
                        border: "1px solid rgba(16, 185, 129, 0.2)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                      }}
                    >
                      <Award size={14} color="#10b981" />
                      <span style={{ fontSize: "11px", color: "#10b981", fontWeight: "600" }}>
                        All suggestions unlocked!
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "12px 0",
              marginTop: "12px",
              borderTop: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            <button
              onClick={onBack}
              disabled={currentStep === 1}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 16px",
                borderRadius: "8px",
                background: currentStep === 1 ? "rgba(0, 0, 0, 0.2)" : "rgba(255, 255, 255, 0.1)",
                color: currentStep === 1 ? "rgba(255, 255, 255, 0.3)" : "#ffffff",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                cursor: currentStep === 1 ? "not-allowed" : "pointer",
                fontSize: "14px",
                fontWeight: "500",
                transition: "all 0.2s",
              }}
            >
              <ArrowLeft size={16} /> Back
            </button>

            <div style={{ fontSize: "13px", color: "#e9d5ff", fontWeight: "500" }}>
              Step {currentStep} of {totalSteps}
            </div>

            {currentStep < totalSteps ? (
              <button
                onClick={onContinue}
                disabled={!canProceed}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 16px",
                  borderRadius: "8px",
                  background: canProceed
                    ? "linear-gradient(to right, #7c3aed, #06b6d4)"
                    : "rgba(0, 0, 0, 0.2)",
                  color: canProceed ? "#ffffff" : "rgba(255, 255, 255, 0.3)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  cursor: canProceed ? "pointer" : "not-allowed",
                  fontSize: "14px",
                  fontWeight: "500",
                  transition: "all 0.2s",
                  boxShadow: canProceed ? "0 4px 12px rgba(124, 58, 237, 0.3)" : "none",
                }}
              >
                Continue <ArrowRight size={16} />
              </button>
            ) : (
              <button
                onClick={onGetQuote}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 16px",
                  borderRadius: "8px",
                  background: "linear-gradient(to right, #10b981, #06b6d4)",
                  color: "#ffffff",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                  transition: "all 0.2s",
                  boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
                }}
              >
                <Sparkles size={16} /> Get Official Quote
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WizardBottomAdvisor;
