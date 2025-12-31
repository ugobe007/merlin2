/**
 * MERLIN GUIDE - Smart Assistant Component
 * =========================================
 * 
 * An AI assistant that provides contextual guidance throughout the wizard.
 * 
 * BEHAVIOR BY STEP:
 * - Step 1: Always open, explains ticker
 * - Step 2: Open until industry selection made
 * - Step 3: Open 15 seconds, then auto-collapse
 * - Step 4: Minimized, pulse on struggle (10s pause) or key triggers
 * - Step 5: Minimized
 * - Step 6: Minimized, pulse at contact capture
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
    default: "I can autofill your facility details using industry averages - just click '✨ Yes, autofill'. Or enter your specific numbers for a more precise quote.",
    autofillHint: "Tip: Autofill gets you 90% accurate estimates. You can always fine-tune later!"
  },
  step4: {
    intro: "Now let's build your energy system. Make YES/NO decisions for each component - watch the ticker grow as you add value!",
    solarNo: "Since you're skipping solar, your BESS needs another power source. I've enabled the generator - it's required for system reliability.",
    solarYes: "Smart choice! Solar will be your primary power source. The generator becomes optional backup.",
    generatorFuel: "Natural gas is cleaner and preferred for guest-facing properties. Diesel is 10% cheaper but noisier.",
    evYes: "EV charging is a revenue generator, not just a cost. Hotels with charging see 23% higher occupancy from EV drivers!",
    customize: "Use the sliders to dial in exactly what you need. The Recommended tiers are good starting points.",
    struggling: "Need help deciding? I'm here! Click me for guidance on any option.",
    complete: "🎉 Excellent configuration! You're capturing strong value. Ready to see your Magic Fit?"
  },
  step5: {
    default: "Magic Fit optimizes your system based on everything we know. Review the recommendations - or adjust in ProQuote for full control."
  },
  step6: {
    default: "Here's your complete quote! Download or email it to save. Want to adjust? Head to ProQuote for detailed customization.",
    contact: "Enter your email to receive your detailed quote PDF. We'll include incentive deadlines and next steps."
  }
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================
const MerlinGuide: React.FC<MerlinGuideProps> = ({
  currentStep,
  industrySelected = false,
  facilityComplete = false,
  solarDecision = 'undecided',
  generatorDecision = 'undecided',
  evDecision = 'undecided',
  solarMode = 'undecided',
  generatorMode = 'undecided',
  evMode = 'undecided',
  industryName,
  stateName,
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
    // Clear any existing timers on step change
    if (autoCloseTimer.current) clearTimeout(autoCloseTimer.current);
    if (struggleTimer.current) clearTimeout(struggleTimer.current);
    
    // Reset interaction flag on new step
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
        // Auto-close after selection
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

    // Step 4: Minimized by default, context triggers
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
      
      // Auto-close after reading
      autoCloseTimer.current = setTimeout(() => {
        if (!hasUserInteracted) setIsExpanded(false);
      }, 8000);
    }
    lastSolarDecision.current = solarDecision;
  }, [solarDecision, currentStep, hasUserInteracted]);

  // Struggle detection (10 second pause on undecided)
  useEffect(() => {
    if (currentStep !== 4) return;
    
    // Check if any decision is undecided (progressive: check each section in order)
    const solarComplete = solarDecision !== 'undecided' && (solarDecision === 'no' || solarMode !== 'undecided');
    const genComplete = generatorDecision !== 'undecided' && (generatorDecision === 'no' || generatorMode !== 'undecided');
    const evComplete = evDecision !== 'undecided' && (evDecision === 'no' || evMode !== 'undecided');
    
    const hasUndecided = 
      solarDecision === 'undecided' || 
      (solarDecision === 'yes' && solarMode === 'undecided') ||
      (solarComplete && generatorDecision === 'undecided') ||
      (solarComplete && generatorDecision === 'yes' && generatorMode === 'undecided') ||
      (solarComplete && genComplete && evDecision === 'undecided') ||
      (solarComplete && genComplete && evDecision === 'yes' && evMode === 'undecided');

    if (hasUndecided && !isExpanded) {
      // Start struggle timer
      struggleTimer.current = setTimeout(() => {
        setIsPulsing(true);
        setCurrentMessage(MESSAGES.step4.struggling);
      }, 10000);
    } else {
      // Clear timer if decision made
      if (struggleTimer.current) {
        clearTimeout(struggleTimer.current);
        setIsPulsing(false);
      }
    }

    return () => {
      if (struggleTimer.current) clearTimeout(struggleTimer.current);
    };
  }, [currentStep, solarDecision, solarMode, generatorDecision, generatorMode, evDecision, evMode, isExpanded]);

  // Check for Step 4 completion
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

  // ========== FORCE OPEN ==========
  useEffect(() => {
    if (forceOpen) {
      setIsExpanded(true);
    }
  }, [forceOpen]);

  // ========== HANDLERS ==========
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

  // ========== CLEANUP ==========
  useEffect(() => {
    return () => {
      if (autoCloseTimer.current) clearTimeout(autoCloseTimer.current);
      if (struggleTimer.current) clearTimeout(struggleTimer.current);
    };
  }, []);

  // ========== RENDER ==========
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 1000,
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}
    >
      {/* Expanded Panel */}
      {isExpanded && (
        <div
          style={{
            position: 'absolute',
            bottom: 88,
            right: 0,
            width: 320,
            background: 'linear-gradient(135deg, rgba(15,23,42,0.98), rgba(30,41,59,0.98))',
            backdropFilter: 'blur(20px)',
            borderRadius: 20,
            border: '1px solid rgba(251,191,36,0.3)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 60px rgba(251,191,36,0.15)',
            overflow: 'hidden',
            animation: 'slideUp 0.3s ease-out'
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
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 22,
                  boxShadow: '0 2px 10px rgba(251,191,36,0.4)'
                }}
              >
                🧙
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Merlin</div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>Energy Advisor</div>
              </div>
            </div>
            <button
              onClick={handleClose}
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                border: 'none',
                background: 'rgba(255,255,255,0.1)',
                color: '#94a3b8',
                fontSize: 16,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ×
            </button>
          </div>

          {/* Message */}
          <div style={{ padding: '16px 18px' }}>
            <p style={{
              fontSize: 14,
              lineHeight: 1.6,
              color: '#e2e8f0',
              margin: 0
            }}>
              {currentMessage}
            </p>
          </div>

          {/* Quick Actions (contextual) */}
          {currentStep === 4 && (
            <div style={{
              padding: '0 18px 16px',
              display: 'flex',
              gap: 8
            }}>
              <button
                onClick={handleClose}
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  background: 'rgba(16,185,129,0.15)',
                  border: '1px solid rgba(16,185,129,0.3)',
                  borderRadius: 10,
                  color: '#34d399',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer'
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
        className={isPulsing ? 'merlin-pulse' : ''}
        style={{
          width: isPulsing ? 72 : 64,
          height: isPulsing ? 72 : 64,
          borderRadius: '50%',
          border: `3px solid ${isPulsing ? '#fbbf24' : 'rgba(251,191,36,0.5)'}`,
          background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: isPulsing ? 36 : 32,
          cursor: 'pointer',
          boxShadow: isPulsing 
            ? '0 4px 20px rgba(251,191,36,0.5), 0 0 40px rgba(251,191,36,0.3)'
            : '0 4px 16px rgba(251,191,36,0.3)',
          transition: 'all 0.3s ease',
          position: 'relative'
        }}
      >
        🧙
        
        {/* Notification dot when pulsing */}
        {isPulsing && (
          <span
            style={{
              position: 'absolute',
              top: 2,
              right: 2,
              width: 16,
              height: 16,
              borderRadius: '50%',
              background: '#ef4444',
              border: '2px solid #0f172a',
              animation: 'ping 1s infinite'
            }}
          />
        )}
      </button>

      {/* CSS Animations */}
      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes ping {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          75%, 100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }
        
        .merlin-pulse {
          animation: merlinPulse 2s ease-in-out infinite;
        }
        
        @keyframes merlinPulse {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 4px 20px rgba(251,191,36,0.5), 0 0 0 0 rgba(251,191,36,0.4);
          }
          50% {
            transform: scale(1.08);
            box-shadow: 0 4px 20px rgba(251,191,36,0.5), 0 0 0 12px rgba(251,191,36,0);
          }
        }
      `}</style>
    </div>
  );
};

export { MerlinGuide };
export default MerlinGuide;
