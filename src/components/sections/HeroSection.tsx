import React, { useState, useEffect } from "react";
import type { ApplicationType } from "../modals/RealWorldApplicationModal";
import RealWorldApplicationModal from "../modals/RealWorldApplicationModal";
import { TrueQuoteModal } from "../shared/TrueQuoteModal";
import { HERO_USE_CASES } from "./heroUseCasesData";
import type { HeroUseCase } from "./heroUseCasesData";
import HeroMainBand from "./HeroMainBand";
import HeroHowItWorksModal from "./HeroHowItWorksModal";
import HeroAnimationModal from "./HeroAnimationModal";
import HeroSuccessStories from "./HeroSuccessStories";
import HeroUseCaseDetailModal from "./HeroUseCaseDetailModal";

interface HeroSectionProps {
  setShowAbout: (show: boolean) => void;
  setShowSmartWizard: (show: boolean) => void;
  setShowAdvancedQuoteBuilder: (show: boolean) => void;
}

export default function HeroSection({
  setShowAbout,
  setShowSmartWizard,
  setShowAdvancedQuoteBuilder,
}: HeroSectionProps) {
  const [showRealWorldModal, setShowRealWorldModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<ApplicationType>("hotel");
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedHeroUseCase, setSelectedHeroUseCase] = useState<HeroUseCase | null>(null);
  const [showMerlinVideo, setShowMerlinVideo] = useState(false);
  const [showTrueQuoteModal, setShowTrueQuoteModal] = useState(false);

  // Auto-rotate carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % HERO_USE_CASES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <HeroMainBand
        useCases={HERO_USE_CASES}
        currentImageIndex={currentImageIndex}
        setCurrentImageIndex={setCurrentImageIndex}
        setShowAbout={setShowAbout}
        setShowSmartWizard={setShowSmartWizard}
        setShowAdvancedQuoteBuilder={setShowAdvancedQuoteBuilder}
        setShowTrueQuoteModal={setShowTrueQuoteModal}
        setSelectedHeroUseCase={setSelectedHeroUseCase}
      />

      {/* ========== VALUE PROPOSITIONS + STATS ========== */}
      <section className="py-20 px-4 md:px-8 lg:px-12 relative overflow-hidden">
        {/* Deep blue professional background */}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(180deg, #060d1f 0%, #0c1631 50%, #071024 100%)",
          }}
        />

        {/* Subtle top border line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        <div className="max-w-5xl mx-auto relative z-10">
          {/* Section Header */}
          <div className="text-center mb-16">
            <p
              className="text-sm font-medium tracking-widest uppercase mb-4"
              style={{ color: "rgba(255,255,255,0.4)", letterSpacing: "0.15em" }}
            >
              Why Merlin
            </p>
            <h2
              className="text-3xl md:text-4xl font-bold mb-4"
              style={{ color: "#fff", letterSpacing: "-0.02em" }}
            >
              Get accurate quotes <span style={{ color: "#fbbf24" }}>without the runaround</span>
            </h2>
            <p
              className="text-base max-w-2xl mx-auto"
              style={{ color: "rgba(255,255,255,0.45)", lineHeight: 1.7 }}
            >
              Our AI analyzes 30+ industry configurations, real utility rates, and NREL-validated
              pricing to design your optimal energy system.
            </p>
          </div>

          {/* Value Props — Clean inline text */}
          <div className="space-y-5 mb-16 max-w-3xl mx-auto">
            <p className="text-lg leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>
              <span className="font-bold text-white text-xl">📐 Zero Guesswork</span>
              <span style={{ color: "rgba(255,255,255,0.3)" }}>{" — "}</span>
              ASHRAE, CBECS, and Energy Star formulas calculate exactly what your facility needs.
              Every number is traceable.
            </p>
            <p className="text-lg leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>
              <span className="font-bold text-white text-xl">⚡ Skip the Vendor Calls</span>
              <span style={{ color: "rgba(255,255,255,0.3)" }}>{" — "}</span>
              Get accurate quotes in minutes, not weeks. Real NREL benchmark pricing instead of
              sales tactics.
            </p>
            <p className="text-lg leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>
              <span className="font-bold text-white text-xl">💰 Maximum Savings</span>
              <span style={{ color: "rgba(255,255,255,0.3)" }}>{" — "}</span>
              AI optimizes peak shaving, demand reduction, and time-of-use arbitrage to maximize
              your ROI.
            </p>
          </div>

          {/* Stats Bar — Minimal horizontal strip */}
          <div
            className="rounded-xl px-8 py-6"
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div>
                <div className="text-2xl font-bold text-white mb-1">30+</div>
                <div className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                  Industry Templates
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white mb-1">$2M+</div>
                <div className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                  Savings Calculated
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white mb-1">5 Steps</div>
                <div className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                  Easy Quote Process
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white mb-1">30%</div>
                <div className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                  Federal Tax Credit
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <HeroSuccessStories
        onOpenStory={(app) => {
          setSelectedApplication(app);
          setShowRealWorldModal(true);
        }}
      />

      <HeroHowItWorksModal
        show={showHowItWorks}
        onClose={() => setShowHowItWorks(false)}
        onStartWizard={() => {
          setShowHowItWorks(false);
          setShowSmartWizard(true);
        }}
      />

      <HeroAnimationModal
        show={showMerlinVideo}
        onClose={() => setShowMerlinVideo(false)}
        onStartWizard={() => {
          setShowMerlinVideo(false);
          setShowSmartWizard(true);
        }}
      />

      <HeroUseCaseDetailModal
        useCase={selectedHeroUseCase}
        onClose={() => setSelectedHeroUseCase(null)}
        onStartWizard={() => {
          setSelectedHeroUseCase(null);
          setShowSmartWizard(true);
        }}
      />

      <RealWorldApplicationModal
        show={showRealWorldModal}
        onClose={() => setShowRealWorldModal(false)}
        application={selectedApplication}
        onStartWizard={() => setShowSmartWizard(true)}
      />

      <TrueQuoteModal
        isOpen={showTrueQuoteModal}
        onClose={() => setShowTrueQuoteModal(false)}
        onGetQuote={() => {
          setShowTrueQuoteModal(false);
          setShowSmartWizard(true);
        }}
      />
    </>
  );
}
