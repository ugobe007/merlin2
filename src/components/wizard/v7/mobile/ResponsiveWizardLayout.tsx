/**
 * RESPONSIVE WIZARD LAYOUT
 * Adaptive layout wrapper that switches between desktop and mobile UX
 * - Desktop (≥768px): Sidebar + content area
 * - Mobile (<768px): Full-screen with bottom nav
 */

import React, { type ReactNode } from "react";
import { MobileBottomNav } from "./MobileBottomNav";

interface ResponsiveWizardLayoutProps {
  children: ReactNode;
  currentStep: number;
  totalSteps: number;
  canGoBack: boolean;
  canContinue: boolean;
  onBack: () => void;
  onNext: () => void;
  isLastStep?: boolean;
  nextLabel?: string;
  sidebar?: ReactNode;
  showMobileNav?: boolean;
}

export function ResponsiveWizardLayout({
  children,
  currentStep,
  totalSteps,
  canGoBack,
  canContinue,
  onBack,
  onNext,
  isLastStep = false,
  nextLabel = "Continue",
  sidebar,
  showMobileNav = true,
}: ResponsiveWizardLayoutProps) {
  return (
    <>
      {/* Desktop Layout */}
      <div className="hidden md:flex md:h-screen md:overflow-hidden">
        {/* Sidebar (if provided) */}
        {sidebar && (
          <aside className="w-80 flex-shrink-0 border-r border-white/10 bg-slate-900/50 overflow-y-auto">
            {sidebar}
          </aside>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden min-h-screen pb-24">
        {/* Mobile Content */}
        <main className="px-0">{children}</main>

        {/* Mobile Bottom Navigation */}
        {showMobileNav && (
          <MobileBottomNav
            currentStep={currentStep}
            totalSteps={totalSteps}
            canGoBack={canGoBack}
            canContinue={canContinue}
            onBack={onBack}
            onNext={onNext}
            isLastStep={isLastStep}
            nextLabel={nextLabel}
          />
        )}
      </div>
    </>
  );
}
