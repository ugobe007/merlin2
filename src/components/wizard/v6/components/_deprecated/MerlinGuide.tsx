/**
 * MERLIN GUIDE - Fixed Position Bottom Right
 * ===========================================
 * 
 * CRITICAL: Uses position: fixed with !important to ensure it floats
 * in the bottom-right corner regardless of parent containers.
 * 
 * BEHAVIOR BY STEP:
 * - Step 1: Always open, explains ticker
 * - Step 2: Open until industry selection made
 * - Step 3: Open 15 seconds, then auto-collapse
 * - Step 4: Minimized, pulse on struggle (10s pause) or key triggers
 * - Step 5-6: Minimized
 * 
 * Created: December 31, 2025
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';

// ============================================================================
// TYPES
// ============================================================================
interface MerlinGuideProps {
  currentStep: number;
  
  // Step completion flags
  industrySelected?: boolean;
  facilityComplete?: boolean;
  
  // Step 4 state for triggers
  solarDecision?: 'undecided' | 'yes' | 'no';
  generatorDecision?: 'undecided' | 'yes' | 'no';
  evDecision?: 'undecided' | 'yes' | 'no';
  solarMode?: 'undecided' | 'recommended' | 'customize';
  generatorMode?: 'undecided' | 'recommended' | 'customize';
  evMode?: 'undecided' | 'recommended' | 'customize';
  
  // For contextual messages
  industryName?: string;
  stateName?: string;
  
  // External control
  forceOpen?: boolean;
  onClose?: () => void;
}

// ============================================================================
// MESSAGES BY CONTEXT
// ============================================================================
const MESSAGES = {
  step1: {
    default: "Welcome! 👋 I'm Merlin, your energy advisor. See that ticker at the top? As you build your system, watch your savings grow in real-time. Let's start with your location!"
  },
  step2: {
    default: "Different industries have unique energy profiles. Select yours and I'll customize everything - usage estimates, peak demands, and equipment recommendations.",
    afterSelect: "Great choice! I've loaded industry-specific data. Let's configure your facility..."
  },
  step3: {
    default: "I can autofill your facility details using industry averages - just click '✨ Yes, autofill'. Or enter your specific numbers for a more precise quote."
  },
  step4: {
    intro: "Now let's build your energy system. Make YES/NO decisions for each component - watch the ticker grow as you add value!",
    solarNo: "Since you're skipping solar, your BESS needs another power source. I've enabled the generator - it's required for system reliability.",
    struggling: "Need help deciding? I'm here! Click me for guidance on any option.",
    complete: "🎉 Excellent configuration! You're capturing strong value. Ready to see your Magic Fit?"
  },
  step5: {
    default: "Magic Fit optimizes your system based on everything we know. Review the recommendations - or adjust in ProQuote for full control."
  },
  step6: {
    default: "Here's your complete quote! Download or email it to save. Want to adjust? Head to ProQuote for detailed customization."
  }
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================
const MerlinGuide: React.FC<MerlinGuideProps> = ({
  currentStep,
  industrySelected = false,
  solarDecision = 'undecided',
  generatorDecision = 'undecided',
  evDecision = 'undecided',
  solarMode = 'undecided',
  generatorMode = 'undecided',
  evMode = 'undecided',
  forceOpen = false,
  onClose
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);
  const [currentMessage, setCurrentMessage] = useState('');
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  
  const autoCloseTimer = useRef<NodeJS.Timeout | null>(null);
  const struggleTimer = useRef<NodeJS.Timeout | null>(null);
  const lastStep = useRef(currentStep);
  const lastSolarDecision = useRef(solarDecision);

  // ========== AUTO-OPEN LOGIC ==========
  useEffect(() => {
    if (autoCloseTimer.current) clearTimeout(autoCloseTimer.current);
    if (struggleTimer.current) clearTimeout(struggleTimer.current);
    
    if (currentStep !== lastStep.current) {
      setHasUserInteracted(false);
      lastStep.current = currentStep;
    }

    // Step 1: Always open
    if (currentStep === 1) {
      setIsExpanded(true);
      setCurrentMessage(MESSAGES.step1.default);
      return;
    }

    // Step 2: Open until selection
    if (currentStep === 2) {
      if (!industrySelected) {
        setIsExpanded(true);
        setCurrentMessage(MESSAGES.step2.default);
      } else {
        setCurrentMessage(MESSAGES.step2.afterSelect);
        autoCloseTimer.current = setTimeout(() => {
          if (!hasUserInteracted) setIsExpanded(false);
        }, 3000);
      }
      return;
    }

    // Step 3: Open 15 seconds then close
    if (currentStep === 3) {
      setIsExpanded(true);
      setCurrentMessage(MESSAGES.step3.default);
      autoCloseTimer.current = setTimeout(() => {
        if (!hasUserInteracted) setIsExpanded(false);
      }, 15000);
      return;
    }

    // Step 4: Minimized by default
    if (currentStep === 4) {
      setIsExpanded(false);
      setCurrentMessage(MESSAGES.step4.intro);
      return;
    }

    // Step 5-6: Minimized
    if (currentStep === 5) {
      setIsExpanded(false);
      setCurrentMessage(MESSAGES.step5.default);
      return;
    }

    if (currentStep === 6) {
      setIsExpanded(false);
      setCurrentMessage(MESSAGES.step6.default);
      return;
    }
  }, [currentStep, industrySelected, hasUserInteracted]);

  // ========== STEP 4 TRIGGERS ==========
  
  // Solar NO trigger
  useEffect(() => {
    if (currentStep === 4 && solarDecision === 'no' && lastSolarDecision.current !== 'no') {
      setCurrentMessage(MESSAGES.step4.solarNo);
      setIsExpanded(true);
      setIsPulsing(false);
      
      autoCloseTimer.current = setTimeout(() => {
        if (!hasUserInteracted) setIsExpanded(false);
      }, 8000);
    }
    lastSolarDecision.current = solarDecision;
  }, [solarDecision, currentStep, hasUserInteracted]);

  // Struggle detection (10 second pause)
  useEffect(() => {
    if (currentStep !== 4) return;
    
    // Check if any decision is undecided (progressive: check each section in order)
    const solarComplete = solarDecision !== 'undecided' && (solarDecision === 'no' || solarMode !== 'undecided');
    const genComplete = generatorDecision !== 'undecided' && (generatorDecision === 'no' || generatorMode !== 'undecided');
    
    const hasUndecided = 
      solarDecision === 'undecided' || 
      (solarDecision === 'yes' && solarMode === 'undecided') ||
      (solarComplete && generatorDecision === 'undecided') ||
      (solarComplete && generatorDecision === 'yes' && generatorMode !== 'undecided') ||
      (solarComplete && genComplete && evDecision === 'undecided') ||
      (solarComplete && genComplete && evDecision === 'yes' && evMode === 'undecided');

    if (hasUndecided && !isExpanded) {
      struggleTimer.current = setTimeout(() => {
        setIsPulsing(true);
        setCurrentMessage(MESSAGES.step4.struggling);
      }, 10000);
    } else {
      if (struggleTimer.current) {
        clearTimeout(struggleTimer.current);
        setIsPulsing(false);
      }
    }

    return () => {
      if (struggleTimer.current) clearTimeout(struggleTimer.current);
    };
  }, [currentStep, solarDecision, solarMode, generatorDecision, generatorMode, evDecision, evMode, isExpanded]);

  // Step 4 completion
  useEffect(() => {
    if (currentStep !== 4) return;
    
    const solarComplete = solarDecision === 'no' || (solarDecision === 'yes' && solarMode !== 'undecided');
    const genComplete = generatorDecision === 'no' || (generatorDecision === 'yes' && generatorMode !== 'undecided');
    const evComplete = evDecision === 'no' || (evDecision === 'yes' && evMode !== 'undecided');
    
    if (solarComplete && genComplete && evComplete) {
      setCurrentMessage(MESSAGES.step4.complete);
      setIsExpanded(true);
      autoCloseTimer.current = setTimeout(() => {
        setIsExpanded(false);
      }, 5000);
    }
  }, [currentStep, solarDecision, solarMode, generatorDecision, generatorMode, evDecision, evMode]);

  // Force open
  useEffect(() => {
    if (forceOpen) setIsExpanded(true);
  }, [forceOpen]);

  // Handlers
  const handleToggle = useCallback(() => {
    setHasUserInteracted(true);
    setIsExpanded(prev => !prev);
    setIsPulsing(false);
    if (onClose && isExpanded) onClose();
  }, [isExpanded, onClose]);

  const handleClose = useCallback(() => {
    setHasUserInteracted(true);
    setIsExpanded(false);
    setIsPulsing(false);
    if (onClose) onClose();
  }, [onClose]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (autoCloseTimer.current) clearTimeout(autoCloseTimer.current);
      if (struggleTimer.current) clearTimeout(struggleTimer.current);
    };
  }, []);

  // ========== RENDER ==========
  return (
    <>
      {/* CRITICAL: Portal-like fixed positioning */}
      <div
        id="merlin-guide-container"
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 99999,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          // Force override any parent transforms
          transform: 'none',
          contain: 'layout'
        }}
      >
        {/* Expanded Panel */}
        {isExpanded && (
          <div
            style={{
              position: 'absolute',
              bottom: 80,
              right: 0,
              width: 320,
              background: 'linear-gradient(135deg, rgba(15,23,42,0.98), rgba(30,41,59,0.98))',
              backdropFilter: 'blur(20px)',
              borderRadius: 20,
              border: '1px solid rgba(251,191,36,0.3)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 60px rgba(251,191,36,0.2)',
              overflow: 'hidden',
              animation: 'merlinSlideUp 0.3s ease-out'
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 16px',
                background: 'rgba(251,191,36,0.1)',
                borderBottom: '1px solid rgba(251,191,36,0.2)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 24,
                    boxShadow: '0 2px 12px rgba(251,191,36,0.5)'
                  }}
                >
                  🧙
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>Merlin</div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>Energy Advisor</div>
                </div>
              </div>
              <button
                onClick={handleClose}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  border: 'none',
                  background: 'rgba(255,255,255,0.1)',
                  color: '#94a3b8',
                  fontSize: 18,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                  e.currentTarget.style.color = '#fff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                  e.currentTarget.style.color = '#94a3b8';
                }}
              >
                ×
              </button>
            </div>

            {/* Message */}
            <div style={{ padding: '18px 20px' }}>
              <p style={{
                fontSize: 14,
                lineHeight: 1.7,
                color: '#e2e8f0',
                margin: 0
              }}>
                {currentMessage}
              </p>
            </div>

            {/* Quick Action */}
            {currentStep >= 3 && (
              <div style={{ padding: '0 20px 18px' }}>
                <button
                  onClick={handleClose}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.1))',
                    border: '1px solid rgba(16,185,129,0.4)',
                    borderRadius: 12,
                    color: '#34d399',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16,185,129,0.3), rgba(16,185,129,0.2))';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.1))';
                  }}
                >
                  ✓ Got it
                </button>
              </div>
            )}
          </div>
        )}

        {/* Minimized Avatar Button */}
        <button
          onClick={handleToggle}
          style={{
            width: isPulsing ? 72 : 64,
            height: isPulsing ? 72 : 64,
            borderRadius: '50%',
            border: `3px solid ${isPulsing ? '#fbbf24' : 'rgba(251,191,36,0.6)'}`,
            background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: isPulsing ? 36 : 32,
            cursor: 'pointer',
            boxShadow: isPulsing 
              ? '0 4px 24px rgba(251,191,36,0.6), 0 0 50px rgba(251,191,36,0.4)'
              : '0 4px 20px rgba(251,191,36,0.4)',
            transition: 'all 0.3s ease',
            position: 'relative',
            animation: isPulsing ? 'merlinPulse 2s ease-in-out infinite' : 'none'
          }}
        >
          🧙
          
          {/* Notification dot */}
          {isPulsing && (
            <span
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: 18,
                height: 18,
                borderRadius: '50%',
                background: '#ef4444',
                border: '3px solid #0f172a',
                animation: 'merlinPing 1s infinite'
              }}
            />
          )}
        </button>
      </div>

      {/* CSS Animations - inject globally */}
      <style>{`
        @keyframes merlinSlideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes merlinPing {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          75%, 100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }
        
        @keyframes merlinPulse {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 4px 24px rgba(251,191,36,0.6), 0 0 0 0 rgba(251,191,36,0.4);
          }
          50% {
            transform: scale(1.08);
            box-shadow: 0 4px 24px rgba(251,191,36,0.6), 0 0 0 15px rgba(251,191,36,0);
          }
        }
      `}</style>
    </>
  );
};

export { MerlinGuide };
export default MerlinGuide;
