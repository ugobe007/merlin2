import React from "react";
import merlinImage from "../../assets/images/new_profile_merlin.png";
import badgeIcon from "../../assets/images/badge_icon.jpg";
import type { HeroUseCase } from "./heroUseCasesData";

interface HeroMainBandProps {
  useCases: HeroUseCase[];
  currentImageIndex: number;
  setCurrentImageIndex: (idx: number | ((prev: number) => number)) => void;
  setShowAbout: (show: boolean) => void;
  setShowSmartWizard: (show: boolean) => void;
  setShowAdvancedQuoteBuilder: (show: boolean) => void;
  setShowTrueQuoteModal: (show: boolean) => void;
  setSelectedHeroUseCase: (uc: HeroUseCase | null) => void;
}

export default function HeroMainBand({
  useCases,
  currentImageIndex,
  setCurrentImageIndex,
  setShowAbout,
  setShowSmartWizard,
  setShowAdvancedQuoteBuilder,
  setShowTrueQuoteModal,
  setSelectedHeroUseCase,
}: HeroMainBandProps) {
  return (
    <>
      {/* ========== MERLIN HERO - EDGE TO EDGE ========== */}
      <section className="relative">
        <div className="relative min-h-[72vh] overflow-hidden">
          {/* Deep dark blue background */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(135deg, #060d1f 0%, #0c1631 40%, #091228 70%, #060d1f 100%)",
            }}
          />

          {/* Subtle ambient glow */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div
              className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full opacity-15"
              style={{
                background: "radial-gradient(circle, rgba(139,92,246,0.3) 0%, transparent 70%)",
              }}
            />
            <div
              className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full opacity-10"
              style={{
                background: "radial-gradient(circle, rgba(99,102,241,0.3) 0%, transparent 70%)",
              }}
            />
          </div>

          <div className="relative z-10 min-h-[68vh]">
            {/* ========== HERO - Two Column Grid ========== */}
            <div className="grid min-h-[68vh] lg:grid-cols-[minmax(380px,500px)_1fr] grid-cols-1 lg:grid-rows-none grid-rows-[auto_1fr] items-stretch">
              {/* ========== LEFT PANEL ========== */}
              <div
                className="flex flex-col justify-center lg:px-10 lg:py-10 px-6 py-8 relative z-10 lg:rounded-r-[40px] rounded-b-[40px] lg:rounded-bl-none my-0 lg:h-full"
                style={{
                  background:
                    "linear-gradient(165deg, #081029 0%, #0e1a3a 40%, #132044 70%, #0e1a3a 100%)",
                  boxShadow: "20px 0 80px rgba(0,0,0,0.6)",
                }}
              >
                {/* TrueQuote Badge — gold shield + name + verified tag */}
                <div className="flex justify-start w-full" style={{ maxWidth: "480px" }}>
                  <button
                    onClick={() => setShowTrueQuoteModal(true)}
                    className="inline-flex items-center mb-7 transition-all duration-200 cursor-pointer"
                    style={{
                      background: "rgba(242,193,79,0.07)",
                      border: "1px solid rgba(242,193,79,0.3)",
                      padding: "8px 16px 8px 12px",
                      borderRadius: "10px",
                      gap: "0",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(242,193,79,0.13)";
                      e.currentTarget.style.borderColor = "rgba(242,193,79,0.55)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "rgba(242,193,79,0.07)";
                      e.currentTarget.style.borderColor = "rgba(242,193,79,0.3)";
                    }}
                  >
                    {/* Gold shield SVG icon */}
                    <svg
                      width="18"
                      height="20"
                      viewBox="0 0 18 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      style={{ flexShrink: 0, filter: "drop-shadow(0 0 4px rgba(242,193,79,0.5))" }}
                    >
                      <path
                        d="M9 1L2 4V10C2 14.1 5.1 17.9 9 19C12.9 17.9 16 14.1 16 10V4L9 1Z"
                        fill="url(#sg)"
                        stroke="rgba(242,193,79,0.6)"
                        strokeWidth="0.75"
                        strokeLinejoin="round"
                      />
                      <polyline
                        points="6,10 8,12.5 12,7.5"
                        fill="none"
                        stroke="#fff"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <defs>
                        <linearGradient id="sg" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#FFE8A3" />
                          <stop offset="50%" stopColor="#F2C14F" />
                          <stop offset="100%" stopColor="#C8962A" />
                        </linearGradient>
                      </defs>
                    </svg>

                    {/* Spacer */}
                    <span style={{ width: "10px", display: "inline-block" }} />

                    {/* TrueQuote name */}
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: 700,
                        color: "#F1F5F9",
                        letterSpacing: "0.01em",
                      }}
                    >
                      TrueQuote™
                    </span>

                    {/* Divider */}
                    <span
                      style={{
                        width: "1px",
                        height: "14px",
                        background: "rgba(255,255,255,0.15)",
                        margin: "0 10px",
                        display: "inline-block",
                      }}
                    />

                    {/* Verified tag */}
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        color: "#F2C14F",
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                      }}
                    >
                      Verified
                    </span>
                  </button>
                </div>

                {/* Main Headline */}
                <h1
                  className="mb-4 lg:text-[52px] md:text-[38px] text-[28px]"
                  style={{
                    fontWeight: 900,
                    lineHeight: 0.95,
                    letterSpacing: "-0.02em",
                    color: "#fff",
                    fontKerning: "normal",
                    textRendering: "optimizeLegibility",
                    WebkitFontSmoothing: "antialiased",
                    MozOsxFontSmoothing: "grayscale",
                  }}
                >
                  True
                  <span className="block" style={{ color: "#fbbf24", letterSpacing: "-0.025em" }}>
                    Energy Quotes.
                  </span>
                </h1>

                {/* Subheadline */}
                <div
                  className="mb-5"
                  style={{
                    fontSize: "15px",
                    color: "rgba(255,255,255,0.75)",
                    lineHeight: 1.6,
                    maxWidth: "420px",
                  }}
                >
                  Instant, bankable BESS & solar quotes — every number traced to NREL, EIA, and IRA
                  2022. No vendor runaround.
                </div>

                {/* CTA Button - Emerald Ghost */}
                <button
                  onClick={() => {
                    try {
                      localStorage.removeItem("merlin_wizard_buffer");
                      sessionStorage.removeItem("merlin_wizard_buffer");
                      localStorage.removeItem("merlin-wizard-state");
                      sessionStorage.removeItem("merlin-wizard-step");
                      const url = new URL(window.location.href);
                      url.searchParams.set("fresh", "true");
                      window.history.replaceState({}, "", url.toString());
                    } catch (e) {
                      console.error("Failed to clear wizard state:", e);
                    }
                    setShowSmartWizard(true);
                  }}
                  className="inline-flex items-center justify-center gap-2.5 mb-6 transition-all duration-200 cursor-pointer w-full"
                  style={{
                    background: "transparent",
                    border: "2px solid #3ECF8E",
                    color: "#3ECF8E",
                    borderRadius: "14px",
                    fontWeight: 700,
                    fontSize: "16px",
                    letterSpacing: "-0.01em",
                    padding: "13px 32px",
                    maxWidth: "420px",
                  }}
                  aria-label="Start Saving with SmartWizard"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(62,207,142,0.08)";
                    e.currentTarget.style.borderColor = "#5fe0a8";
                    e.currentTarget.style.color = "#fff";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.borderColor = "#3ECF8E";
                    e.currentTarget.style.color = "#3ECF8E";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <span style={{ fontWeight: 700 }}>Get My Free Quote</span>
                  <span style={{ fontSize: "22px", marginLeft: "6px" }}>→</span>
                </button>

                {/* ProQuote - Full-width ghost button matching CTA */}
                <button
                  onClick={() => setShowAdvancedQuoteBuilder(true)}
                  className="inline-flex items-center justify-center gap-2.5 mb-6 transition-all duration-200 cursor-pointer"
                  style={{
                    background: "transparent",
                    border: "1px solid rgba(255,255,255,0.15)",
                    color: "rgba(255,255,255,0.65)",
                    borderRadius: "14px",
                    fontWeight: 700,
                    fontSize: "15px",
                    letterSpacing: "-0.01em",
                    padding: "11px 32px",
                    width: "100%",
                    maxWidth: "420px",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.35)";
                    e.currentTarget.style.color = "#fff";
                    e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
                    e.currentTarget.style.color = "rgba(255,255,255,0.65)";
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <img
                    src={badgeIcon}
                    alt="ProQuote"
                    style={{ width: 24, height: 24, objectFit: "contain" }}
                  />
                  <span>ProQuote™</span>
                  <span
                    style={{
                      fontSize: "11px",
                      padding: "2px 8px",
                      borderRadius: "4px",
                      background: "rgba(255,255,255,0.1)",
                      fontWeight: 600,
                    }}
                  >
                    PRO
                  </span>
                  <span style={{ fontSize: "20px", marginLeft: "4px" }}>→</span>
                </button>

                {/* Links - Merlin + Newsletter */}
                <div
                  className="flex flex-col items-center gap-3 w-full"
                  style={{ maxWidth: "480px" }}
                >
                  <button
                    onClick={() => setShowAbout(true)}
                    className="inline-flex items-center gap-2 transition-all"
                    style={{
                      color: "rgba(255,255,255,0.6)",
                      fontSize: "15px",
                      textDecoration: "none",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "rgba(255,255,255,0.9)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "rgba(255,255,255,0.6)";
                    }}
                  >
                    <img src={merlinImage} alt="TrueQuote" className="w-7 h-7 rounded-full" />
                    <span>About TrueQuote →</span>
                  </button>

                  {/* Newsletter Link */}
                  <a
                    href="/news"
                    className="inline-flex items-center gap-2 transition-all"
                    style={{
                      color: "rgba(255,255,255,0.5)",
                      fontSize: "14px",
                      textDecoration: "none",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "#3ECF8E";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "rgba(255,255,255,0.5)";
                    }}
                  >
                    <span>📰 Energy Newsletter</span>
                  </a>
                </div>

                {/* Trust Strip - Data Source Badges */}
                <div className="mt-6 flex flex-wrap items-center gap-2">
                  <span
                    style={{ fontSize: "12px", color: "rgba(255,255,255,0.35)", fontWeight: 500 }}
                  >
                    Powered by
                  </span>
                  {["NREL", "DOE", "Sandia", "UL", "IEEE", "EIA"].map((src) => (
                    <span
                      key={src}
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        color: "rgba(255,255,255,0.45)",
                        padding: "3px 8px",
                        borderRadius: "4px",
                        border: "1px solid rgba(255,255,255,0.1)",
                        letterSpacing: "0.02em",
                      }}
                    >
                      {src}
                    </span>
                  ))}
                </div>
              </div>

              {/* ========== RIGHT SIDE - Image Carousel with Stats Card ========== */}
              <div className="relative overflow-hidden lg:h-full min-h-[380px]">
                <div className="absolute inset-0">
                  {useCases.map((useCase, index) => (
                    <div
                      key={useCase.id}
                      className={`absolute inset-0 transition-opacity duration-800 ${
                        index === currentImageIndex ? "opacity-100" : "opacity-0"
                      }`}
                    >
                      <img
                        src={useCase.image}
                        alt={useCase.name}
                        className="w-full h-full object-cover"
                      />

                      {/* Color overlay */}
                      <div
                        className="absolute inset-0"
                        style={{
                          background:
                            "linear-gradient(135deg, rgba(139, 92, 246, 0.35) 0%, rgba(99, 102, 241, 0.25) 30%, transparent 60%)",
                        }}
                      />
                    </div>
                  ))}
                </div>

                {/* Stats Card Overlay - Translucent Glassmorphism */}
                {useCases[currentImageIndex] && (
                  <div
                    className="absolute bottom-8 left-8 right-8 cursor-pointer transition-all hover:scale-[1.02]"
                    onClick={() => {
                      setSelectedHeroUseCase(useCases[currentImageIndex]);
                    }}
                    style={{
                      background: "rgba(15, 10, 35, 0.25)",
                      backdropFilter: "blur(24px)",
                      WebkitBackdropFilter: "blur(24px)",
                      border: "2px solid rgba(62,207,142,0.35)",
                      borderRadius: "16px",
                      padding: "18px 24px",
                      boxShadow:
                        "0 8px 40px rgba(0,0,0,0.3), 0 0 20px rgba(62,207,142,0.08), inset 0 1px 0 rgba(255,255,255,0.12)",
                    }}
                  >
                    <div className="flex items-center justify-between mb-5">
                      <span style={{ fontSize: "17px", fontWeight: 700, color: "#fff" }}>
                        {useCases[currentImageIndex].name}
                      </span>
                      <div className="flex items-center gap-4">
                        <span
                          className="text-xs opacity-50 hover:opacity-100 transition-opacity"
                          style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px" }}
                        >
                          Click for details →
                        </span>
                        <span
                          style={{
                            background: "rgba(255,255,255,0.1)",
                            padding: "8px 14px",
                            borderRadius: "8px",
                            fontSize: "13px",
                            color: "rgba(255,255,255,0.8)",
                            fontWeight: 600,
                          }}
                        >
                          {useCases[currentImageIndex].systemSize}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 md:gap-4">
                      <div className="text-center">
                        <div
                          className="lg:text-[26px] md:text-[22px] text-[20px]"
                          style={{ fontWeight: 800, marginBottom: "4px", color: "#fbbf24" }}
                        >
                          {useCases[currentImageIndex].savings}
                        </div>
                        <div
                          style={{
                            fontSize: "13px",
                            color: "rgba(255,255,255,0.5)",
                            textTransform: "uppercase",
                            letterSpacing: "0.03em",
                          }}
                        >
                          Annual Savings
                        </div>
                      </div>
                      <div className="text-center">
                        <div
                          className="lg:text-[26px] md:text-[22px] text-[20px]"
                          style={{ fontWeight: 800, marginBottom: "4px", color: "#fff" }}
                        >
                          {useCases[currentImageIndex].payback}
                        </div>
                        <div
                          style={{
                            fontSize: "13px",
                            color: "rgba(255,255,255,0.5)",
                            textTransform: "uppercase",
                            letterSpacing: "0.03em",
                          }}
                        >
                          Payback
                        </div>
                      </div>
                      <div className="text-center">
                        <div
                          className="lg:text-[26px] md:text-[22px] text-[20px]"
                          style={{ fontWeight: 800, marginBottom: "4px", color: "#4ade80" }}
                        >
                          {useCases[currentImageIndex].roi}
                        </div>
                        <div
                          style={{
                            fontSize: "13px",
                            color: "rgba(255,255,255,0.5)",
                            textTransform: "uppercase",
                            letterSpacing: "0.03em",
                          }}
                        >
                          25-Year ROI
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Carousel Dots */}
                <div className="absolute bottom-3 right-20 flex items-center gap-2 z-20">
                  {useCases.map((uc, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`rounded-full transition-all duration-300 cursor-pointer ${
                        index === currentImageIndex
                          ? "bg-[#fbbf24] w-8 h-2"
                          : "bg-white/30 hover:bg-white/50 w-2 h-2"
                      }`}
                      title={uc.name}
                    />
                  ))}
                </div>

                {/* Settings Button */}
                <button
                  onClick={() => setShowAdvancedQuoteBuilder(true)}
                  className="absolute bottom-3 right-6 w-11 h-11 flex items-center justify-center transition-all hover:rotate-45 cursor-pointer z-20"
                  style={{
                    background: "rgba(139, 92, 246, 0.7)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    borderRadius: "50%",
                    color: "#fff",
                    fontSize: "20px",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(139, 92, 246, 0.9)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(139, 92, 246, 0.7)";
                  }}
                  title="Advanced Settings"
                >
                  ⚙
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
