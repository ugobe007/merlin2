import React, { useState, useEffect } from "react";
import type { UseCaseData } from "../UseCaseROI";
// QuoteBuilderLanding moved to legacy - using wizard v5
import RealWorldApplicationModal from "../modals/RealWorldApplicationModal";
import { QuoteEngine } from "@/core/calculations";
import merlinImage from "../../assets/images/new_profile_merlin.png";
import badgeIcon from "../../assets/images/badge_icon.jpg";
import { MethodologyStatement } from "../shared/IndustryComplianceBadges";
import { TrueQuoteModal } from "../shared/TrueQuoteModal";
import { TrueQuoteBadgeCanonical } from "../shared/TrueQuoteBadgeCanonical";

// Marketing constants for display-only calculations (hero stats, not quotes)
import { COST_MULTIPLIERS } from "@/constants/marketing";

// Import use case images
import carWashValet from "../../assets/images/car_wash_valet.jpg";
import carWash1 from "../../assets/images/carwash1.jpg";
import hospitalImage from "../../assets/images/hospital_1.jpg";
import hospital2Image from "../../assets/images/hospital_2.jpg";
import hospital3Image from "../../assets/images/hospital_3.jpg";
import evChargingStationImage from "@/assets/images/ev_charging_station.jpg";
import evChargingHotelImage from "@/assets/images/ev_charging_hotel.jpg";
import airportImage from "../../assets/images/airports_1.jpg";
// Hotel images
import hotelImage from "../../assets/images/hotel_motel_holidayinn_1.jpg";
import hotelHolidayInn1 from "../../assets/images/hotel_motel_holidayinn_1.jpg";
import hotelHolidayInn2 from "../../assets/images/hotel_motel_holidayinn_2.jpg";
import hotelHolidayInn3 from "../../assets/images/hotel_motel_holidayinn_3.jpg";
// Data center images
import dataCenter1 from "../../assets/images/data-center-1.jpg";
import dataCenter2 from "../../assets/images/data-center-2.jpg";
import dataCenter3 from "../../assets/images/data-center-3.jpg";
// Manufacturing images
import manufacturing1 from "../../assets/images/manufacturing_1.jpg";
import manufacturing2 from "../../assets/images/manufacturing_2.jpg";
// Logistics images
import logistics1 from "../../assets/images/logistics_1.jpg";
import logistics2 from "../../assets/images/logistics_2.jpeg";
// Office building images
import officeBuilding1 from "../../assets/images/office_building1.jpg";
// Indoor farm images
import indoorFarm1 from "../../assets/images/indoor_farm1.jpeg";
// Marine image
// Additional airport images
import airport1 from "../../assets/images/airport_1.jpg";
// College/University images
import college1 from "../../assets/images/college_1.jpg";
import college3 from "../../assets/images/college_3.jpg";
// Hero use cases with real financial data - Diverse Industries (Alternating Pattern)
const heroUseCases = [
  {
    id: "hotel-luxury",
    name: "Luxury Hotel",
    image: hotelHolidayInn2,
    savings: "$1.2M",
    payback: "1.1 yrs",
    roi: "920%",
    systemSize: "2.0 MW / 8 MWh",
  },
  {
    id: "data-center-enterprise",
    name: "Enterprise Data Center",
    image: dataCenter1,
    savings: "$2.8M",
    payback: "1.2 yrs",
    roi: "840%",
    systemSize: "5.0 MW / 20 MWh",
  },
  {
    id: "car-wash-tunnel",
    name: "Tunnel Car Wash",
    image: carWashValet,
    savings: "$156K",
    payback: "1.8 yrs",
    roi: "560%",
    systemSize: "0.65 MW / 2.6 MWh",
  },
  {
    id: "ev-charging",
    name: "EV Charging Hub",
    image: evChargingStationImage,
    savings: "$8.7M",
    payback: "6 mo",
    roi: "2,400%",
    systemSize: "5.0 MW / 20 MWh",
  },
  {
    id: "hospital",
    name: "Hospital",
    image: hospital3Image,
    savings: "$890K",
    payback: "1.8 yrs",
    roi: "560%",
    systemSize: "1.5 MW / 6 MWh",
  },
  {
    id: "hotel-resort",
    name: "Resort & Casino",
    image: hotelHolidayInn3,
    savings: "$1.6M",
    payback: "0.9 yrs",
    roi: "1,100%",
    systemSize: "2.5 MW / 10 MWh",
  },
  {
    id: "data-center-colocation",
    name: "Colocation Facility",
    image: dataCenter2,
    savings: "$1.9M",
    payback: "1.4 yrs",
    roi: "720%",
    systemSize: "3.5 MW / 14 MWh",
  },
  {
    id: "car-wash-auto",
    name: "Automated Car Wash",
    image: carWash1,
    savings: "$145K",
    payback: "1.9 yrs",
    roi: "530%",
    systemSize: "0.6 MW / 2.4 MWh",
  },
  {
    id: "airport",
    name: "Regional Airport",
    image: airportImage,
    savings: "$2.1M",
    payback: "1.4 yrs",
    roi: "720%",
    systemSize: "4.0 MW / 16 MWh",
  },
  {
    id: "hotel-boutique",
    name: "Boutique Hotel",
    image: hotelHolidayInn1,
    savings: "$890K",
    payback: "1.3 yrs",
    roi: "780%",
    systemSize: "1.5 MW / 6 MWh",
  },
  {
    id: "data-center-hyperscale",
    name: "Hyperscale Data Center",
    image: dataCenter3,
    savings: "$4.2M",
    payback: "1.1 yrs",
    roi: "930%",
    systemSize: "8.0 MW / 32 MWh",
  },
  {
    id: "ev-hotel",
    name: "Hotel + EV Charging",
    image: evChargingHotelImage,
    savings: "$560K",
    payback: "1.2 yrs",
    roi: "830%",
    systemSize: "1.2 MW / 4.8 MWh",
  },
  {
    id: "hospital-urgent-care",
    name: "Urgent Care Center",
    image: hospitalImage,
    savings: "$420K",
    payback: "2.0 yrs",
    roi: "500%",
    systemSize: "0.8 MW / 3.2 MWh",
  },
  {
    id: "ev-charging-public",
    name: "Public EV Charging Network",
    image: evChargingStationImage,
    savings: "$3.2M",
    payback: "0.8 yrs",
    roi: "1,250%",
    systemSize: "3.0 MW / 12 MWh",
  },
  {
    id: "hospital-medical-center",
    name: "Medical Center",
    image: hospital2Image,
    savings: "$1.1M",
    payback: "1.5 yrs",
    roi: "670%",
    systemSize: "2.0 MW / 8 MWh",
  },
  {
    id: "manufacturing-plant",
    name: "Manufacturing Plant",
    image: manufacturing1,
    savings: "$1.8M",
    payback: "1.3 yrs",
    roi: "770%",
    systemSize: "3.5 MW / 14 MWh",
  },
  {
    id: "logistics-warehouse",
    name: "Logistics Center",
    image: logistics1,
    savings: "$950K",
    payback: "1.4 yrs",
    roi: "720%",
    systemSize: "2.0 MW / 8 MWh",
  },
  {
    id: "office-building",
    name: "Office Building",
    image: officeBuilding1,
    savings: "$680K",
    payback: "1.6 yrs",
    roi: "630%",
    systemSize: "1.2 MW / 4.8 MWh",
  },
  {
    id: "indoor-farm",
    name: "Indoor Farm",
    image: indoorFarm1,
    savings: "$420K",
    payback: "1.9 yrs",
    roi: "530%",
    systemSize: "0.8 MW / 3.2 MWh",
  },
  {
    id: "airport-regional-2",
    name: "Regional Airport",
    image: airport1,
    savings: "$2.1M",
    payback: "1.4 yrs",
    roi: "720%",
    systemSize: "4.0 MW / 16 MWh",
  },
  {
    id: "manufacturing-factory",
    name: "Factory",
    image: manufacturing2,
    savings: "$1.5M",
    payback: "1.5 yrs",
    roi: "670%",
    systemSize: "2.8 MW / 11.2 MWh",
  },
  {
    id: "logistics-distribution",
    name: "Distribution Center",
    image: logistics2,
    savings: "$1.2M",
    payback: "1.3 yrs",
    roi: "770%",
    systemSize: "2.5 MW / 10 MWh",
  },
  {
    id: "college-university",
    name: "College & University",
    image: college1,
    savings: "$1.4M",
    payback: "1.2 yrs",
    roi: "830%",
    systemSize: "2.8 MW / 11.2 MWh",
  },
  {
    id: "college-campus",
    name: "University Campus",
    image: college3,
    savings: "$980K",
    payback: "1.5 yrs",
    roi: "670%",
    systemSize: "2.0 MW / 8 MWh",
  },
];

interface HeroSectionProps {
  setShowAbout: (show: boolean) => void;
  setShowJoinModal: (show: boolean) => void;
  setShowSmartWizard: (show: boolean) => void;
  setShowAdvancedQuoteBuilder: (show: boolean) => void;
  setShowCostSavingsModal: (show: boolean) => void;
  setShowRevenueModal: (show: boolean) => void;
  setShowSustainabilityModal: (show: boolean) => void;
  setCurrentQuote: (quote: unknown) => void;
  setShowQuotePreview: (show: boolean) => void;
  selectedCountry: string;
  bosPercent: number;
  epcPercent: number;
  pcsKw: number;
  // Power adjustment modal props
  setShowPowerAdjustmentModal?: (show: boolean) => void;
  setSelectedUseCaseForAdjustment?: (useCase: UseCaseData) => void;
}

export default function HeroSection({
  setShowAbout,
  setShowJoinModal: _setShowJoinModal,
  setShowSmartWizard,
  setShowAdvancedQuoteBuilder,
  setShowCostSavingsModal: _setShowCostSavingsModal,
  setShowRevenueModal: _setShowRevenueModal,
  setShowSustainabilityModal: _setShowSustainabilityModal,
  setCurrentQuote,
  setShowQuotePreview,
  selectedCountry,
  bosPercent,
  epcPercent,
  pcsKw: _pcsKw,
  setShowPowerAdjustmentModal: _setShowPowerAdjustmentModal,
  setSelectedUseCaseForAdjustment: _setSelectedUseCaseForAdjustment,
}: HeroSectionProps) {
  const [, setShowQuoteBuilderLanding] = useState(false); // Only setter used
  const [selectedUseCaseForQuote, setSelectedUseCaseForQuote] = useState<UseCaseData | null>(null);
  const [showRealWorldModal, setShowRealWorldModal] = useState(false);
  const [selectedApplication] = useState<"hotel" | "data-center" | "ev-charging">("hotel");
  void selectedApplication; // Explicitly mark as intentionally unused if not used later
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showUseCaseDetail, setShowUseCaseDetail] = useState(false);
  const [selectedHeroUseCase, setSelectedHeroUseCase] = useState<(typeof heroUseCases)[0] | null>(
    null
  );

  // Modal and popup states
  const [showMerlinVideo, setShowMerlinVideo] = useState(false);
  const [showTrueQuoteModal, setShowTrueQuoteModal] = useState(false);

  // Auto-rotate through use case images
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % heroUseCases.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const _handleLoadTemplate = (useCase: UseCaseData) => {
    // Set the selected use case and show the QuoteBuilderLanding modal
    setSelectedUseCaseForQuote(useCase);
    setShowQuoteBuilderLanding(true); // Used by handler, even though _showQuoteBuilderLanding is unused
  };

  const _handleGenerateQuote = async () => {
    if (!selectedUseCaseForQuote) return;

    const uc = selectedUseCaseForQuote;

    // ✅ SSOT: Use QuoteEngine.generateQuote() for actual quote generation
    // This ensures quote preview matches what user would get from wizard
    try {
      const quoteResult = await QuoteEngine.generateQuote({
        storageSizeMW: uc.systemSizeMW,
        durationHours: uc.duration,
        location: selectedCountry || "United States",
        electricityRate: 0.15, // Default rate - QuoteEngine handles regional adjustments
        useCase: uc.industry.toLowerCase().replace(/ /g, "-"),
        gridConnection: "on-grid",
        solarMW: 0,
        windMW: 0,
        generatorMW: 0,
      });

      // Create quote object from SSOT result
      // Map equipment breakdown to cost structure expected by QuotePreviewModal
      const generatedQuote = {
        clientName: uc.industry,
        projectName: `${uc.industry} - ${uc.systemSizeMW} MW / ${uc.duration}hr BESS`,
        bessPowerMW: uc.systemSizeMW,
        duration: uc.duration,
        batteryMWh: uc.systemSizeMW * uc.duration,
        solarMW: 0,
        windMW: 0,
        generatorMW: 0,
        gridConnection: "On-grid",
        application: uc.industry,
        location: selectedCountry || "United States",
        warranty: "10 years",
        pcsIncluded: true,
        costs: {
          batterySystem: quoteResult.equipment.batteries.totalCost,
          pcs: quoteResult.equipment.inverters.totalCost,
          transformers: quoteResult.equipment.transformers.totalCost,
          inverters: 0, // PCS field above already covers BESS inverters; solarInverters is separate
          switchgear: quoteResult.equipment.switchgear.totalCost,
          microgridControls: Math.round(quoteResult.costs.installationCost * 0.1), // ~10% of installation
          solar: 0,
          solarInverters: 0,
          wind: 0,
          windConverters: 0,
          generator: 0,
          generatorControls: 0,
          bos: Math.round(quoteResult.costs.equipmentCost * (bosPercent / 100)),
          epc: Math.round(quoteResult.costs.equipmentCost * (epcPercent / 100)),
          tariffs: Math.round(
            quoteResult.costs.totalProjectCost * (COST_MULTIPLIERS.tariffPercent / 100)
          ),
          shipping: Math.round(
            quoteResult.costs.totalProjectCost * (COST_MULTIPLIERS.shippingPercent / 100)
          ),
          grandTotal: quoteResult.costs.netCost,
        },
        annualSavings: quoteResult.financials.annualSavings,
        paybackPeriod: quoteResult.financials.paybackYears,
      };

      // Close landing modal and show quote preview with download option
      setShowQuoteBuilderLanding(false);
      setCurrentQuote(generatedQuote);
      setShowQuotePreview(true);
    } catch (error) {
      console.error("Error generating quote:", error);
      // Fallback: redirect to wizard for proper quote generation
      handleCustomizeSystem();
    }
  };

  const handleCustomizeSystem = () => {
    if (!selectedUseCaseForQuote) return;

    // Store use case data and start from step 1
    const wizardData = {
      selectedTemplate: selectedUseCaseForQuote.industry.toLowerCase().replace(/ /g, "-"),
      storageSizeMW: selectedUseCaseForQuote.systemSizeMW,
      durationHours: selectedUseCaseForQuote.duration,
      location: selectedCountry,
      jumpToStep: 1, // Start from beginning for customization
      useCase: selectedUseCaseForQuote,
    };

    localStorage.setItem("merlin_wizard_quickstart", JSON.stringify(wizardData));
    setShowQuoteBuilderLanding(false);
    setShowSmartWizard(true);
  };

  const _handleCancelQuoteBuilder = () => {
    setShowQuoteBuilderLanding(false);
    setSelectedUseCaseForQuote(null);
  };

  const _handleLoadTemplate_OLD = (useCase: UseCaseData) => {
    // Store use case data in localStorage for wizard to pick up
    const wizardData = {
      selectedTemplate: useCase.industry.toLowerCase().replace(" ", "-"),
      storageSizeMW: useCase.systemSizeMW,
      durationHours: useCase.duration,
      location: selectedCountry,
      jumpToStep: 5, // Go directly to quote summary
      useCase: useCase,
    };

    localStorage.setItem("merlin_wizard_quickstart", JSON.stringify(wizardData));
    setShowSmartWizard(true);
  };

  return (
    <>
      {/* ========== MERLIN HERO - EDGE TO EDGE ========== */}
      <section className="relative">
        <div
          className="relative min-h-[85vh] overflow-hidden"
        >
          {/* Deep dark blue background */}
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(135deg, #060d1f 0%, #0c1631 40%, #091228 70%, #060d1f 100%)",
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

          <div className="relative z-10 min-h-[80vh]">
            {/* ========== HERO - Two Column Grid ========== */}
            <div className="grid min-h-[80vh] lg:grid-cols-[minmax(420px,560px)_1fr] grid-cols-1 lg:grid-rows-none grid-rows-[auto_1fr] items-stretch">
              {/* ========== LEFT PANEL ========== */}
              <div
                className="flex flex-col justify-center lg:px-14 lg:py-16 px-8 py-12 relative z-10 lg:rounded-r-[40px] rounded-b-[40px] lg:rounded-bl-none my-0 lg:h-full"
                style={{
                  background:
                    "linear-gradient(165deg, #081029 0%, #0e1a3a 40%, #132044 70%, #0e1a3a 100%)",
                  boxShadow: "20px 0 80px rgba(0,0,0,0.6)",
                }}
              >
                {/* AI Badge */}
                <div
                  className="inline-flex items-center gap-2 mb-8"
                  style={{
                    background: "transparent",
                    border: "1px solid rgba(255,255,255,0.2)",
                    padding: "8px 16px",
                    borderRadius: "100px",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "rgba(255,255,255,0.7)",
                    width: "fit-content",
                    letterSpacing: "0.02em",
                  }}
                >
                  <span className="font-semibold" style={{ color: "#F1F5F9" }}>TrueQuote™</span>
                  <span
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      background: "radial-gradient(circle at 30% 30%, #FFDFA3, #F2C14F 60%, #B8892F 100%)",
                      boxShadow: "0 0 6px rgba(242, 193, 79, 0.45)",
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ color: "#94A3B8" }}>Verified Energy Quotes</span>
                </div>

                {/* Main Headline */}
                <h1
                  className="mb-8 lg:text-[72px] md:text-[48px] text-[36px]"
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
                  Slash Your
                  <span className="block" style={{ color: "#fbbf24", letterSpacing: "-0.025em" }}>
                    Energy Costs
                  </span>
                </h1>

                {/* Subheadline with TrueQuote badge */}
                <div
                  className="mb-8"
                  style={{
                    fontSize: "20px",
                    color: "rgba(255,255,255,0.85)",
                    lineHeight: 1.7,
                    maxWidth: "480px",
                  }}
                >
                  Get your custom energy savings quote in 5 easy steps. See exactly how much you'll
                  save with battery storage.{" "}
                  <span
                    onClick={() => setShowTrueQuoteModal(true)}
                    style={{
                      verticalAlign: "middle",
                      display: "inline-flex",
                      marginLeft: "4px",
                      cursor: "pointer",
                    }}
                  >
                    <TrueQuoteBadgeCanonical showTooltip={false} />
                  </span>
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
                    fontSize: "20px",
                    letterSpacing: "-0.01em",
                    padding: "18px 42px",
                    maxWidth: "480px",
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
                    fontSize: "18px",
                    letterSpacing: "-0.01em",
                    padding: "16px 42px",
                    width: "100%",
                    maxWidth: "480px",
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
                  <img src={badgeIcon} alt="ProQuote" style={{ width: 24, height: 24, objectFit: 'contain' }} />
                  <span>ProQuote™</span>
                  <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "4px", background: "rgba(255,255,255,0.1)", fontWeight: 600 }}>PRO</span>
                  <span style={{ fontSize: "20px", marginLeft: "4px" }}>→</span>
                </button>

                {/* Merlin Link */}
                <div className="flex justify-center w-full" style={{ maxWidth: "480px" }}>
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
                  <img src={merlinImage} alt="Merlin" className="w-7 h-7 rounded-full" />
                  <span>About Merlin AI →</span>
                </button>
                </div>

                {/* Trust Strip - Data Source Badges */}
                <div className="mt-6 flex flex-wrap items-center gap-2">
                  <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.35)", fontWeight: 500 }}>
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
              <div className="relative overflow-hidden lg:h-full min-h-[500px]">
                <div className="absolute inset-0">
                  {heroUseCases.map((useCase, index) => (
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
                {heroUseCases[currentImageIndex] && (
                  <div
                    className="absolute bottom-8 left-8 right-8 cursor-pointer transition-all hover:scale-[1.02]"
                    onClick={() => {
                      setSelectedHeroUseCase(heroUseCases[currentImageIndex]);
                      setShowUseCaseDetail(true);
                    }}
                    style={{
                      background: "rgba(15, 10, 35, 0.25)",
                      backdropFilter: "blur(24px)",
                      WebkitBackdropFilter: "blur(24px)",
                      border: "2px solid rgba(62,207,142,0.35)",
                      borderRadius: "16px",
                      padding: "28px 36px",
                      boxShadow: "0 8px 40px rgba(0,0,0,0.3), 0 0 20px rgba(62,207,142,0.08), inset 0 1px 0 rgba(255,255,255,0.12)",
                    }}
                  >
                    <div className="flex items-center justify-between mb-5">
                      <span style={{ fontSize: "22px", fontWeight: 700, color: "#fff" }}>
                        {heroUseCases[currentImageIndex].name}
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
                          {heroUseCases[currentImageIndex].systemSize}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 md:gap-6">
                      <div className="text-center">
                        <div
                          className="lg:text-[36px] md:text-[32px] text-[28px]"
                          style={{ fontWeight: 800, marginBottom: "6px", color: "#fbbf24" }}
                        >
                          {heroUseCases[currentImageIndex].savings}
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
                          className="lg:text-[36px] md:text-[32px] text-[28px]"
                          style={{ fontWeight: 800, marginBottom: "6px", color: "#fff" }}
                        >
                          {heroUseCases[currentImageIndex].payback}
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
                          className="lg:text-[36px] md:text-[32px] text-[28px]"
                          style={{ fontWeight: 800, marginBottom: "6px", color: "#4ade80" }}
                        >
                          {heroUseCases[currentImageIndex].roi}
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
                  {heroUseCases.map((uc, index) => (
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
              Get accurate quotes{" "}
              <span style={{ color: "#fbbf24" }}>without the runaround</span>
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
              ASHRAE, CBECS, and Energy Star formulas calculate exactly what your facility needs. Every number is traceable.
            </p>
            <p className="text-lg leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>
              <span className="font-bold text-white text-xl">⚡ Skip the Vendor Calls</span>
              <span style={{ color: "rgba(255,255,255,0.3)" }}>{" — "}</span>
              Get accurate quotes in minutes, not weeks. Real NREL benchmark pricing instead of sales tactics.
            </p>
            <p className="text-lg leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>
              <span className="font-bold text-white text-xl">💰 Maximum Savings</span>
              <span style={{ color: "rgba(255,255,255,0.3)" }}>{" — "}</span>
              AI optimizes peak shaving, demand reduction, and time-of-use arbitrage to maximize your ROI.
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
                <div className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>Industry Templates</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white mb-1">$2M+</div>
                <div className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>Savings Calculated</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white mb-1">5 Steps</div>
                <div className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>Easy Quote Process</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white mb-1">30%</div>
                <div className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>Federal Tax Credit</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== REAL-WORLD SUCCESS STORIES ========== */}
      <section
        className="py-20 px-4 md:px-8 lg:px-12 relative"
        style={{
          background: "linear-gradient(180deg, #071024 0%, #0c1631 50%, #060d1f 100%)",
        }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Real-World <span className="text-[#3ECF8E]">Success Stories</span>
            </h3>
            <p className="text-slate-400 text-lg">
              See how businesses like yours are saving with Merlin
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Data Center */}
            <div
              className="group cursor-pointer"
              onClick={() => {
                console.log("Data Center card clicked");
                setShowSmartWizard(true);
              }}
            >
              <div
                className="relative overflow-hidden rounded-3xl transition-all duration-500 hover:scale-[1.02] hover:-translate-y-2"
                style={{ boxShadow: "0 25px 80px rgba(0,0,0,0.4)" }}
              >
                {/* Image */}
                <div className="relative h-56 overflow-hidden">
                  <img
                    src={carWashValet}
                    alt="Car Wash Success Story"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0f1117] via-[#0f1117]/60 to-transparent" />

                  {/* Savings Badge */}
                  <div className="absolute top-4 right-4 bg-[#3ECF8E] text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg">
                    $127K/yr savings
                  </div>
                </div>

                {/* Content */}
                <div className="p-6" style={{ background: '#0f1117' }}>
                  <h4 className="text-xl font-bold text-white mb-2">Multi-Bay Car Wash</h4>
                  <p className="text-slate-400 text-sm mb-4">
                    500 kW peak demand • 32% energy savings
                  </p>

                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="text-center rounded-xl py-2" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div className="text-lg font-bold text-[#3ECF8E]">1.2yr</div>
                      <div className="text-xs text-slate-500">Payback</div>
                    </div>
                    <div className="text-center rounded-xl py-2" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div className="text-lg font-bold text-[#3ECF8E]">840%</div>
                      <div className="text-xs text-slate-500">ROI</div>
                    </div>
                    <div className="text-center rounded-xl py-2" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div className="text-lg font-bold text-white">20 MWh</div>
                      <div className="text-xs text-slate-500">System</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Click for similar quote</span>
                    <span className="text-[#3ECF8E] group-hover:translate-x-2 transition-transform">
                      →
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Hotel */}
            <div
              className="group cursor-pointer"
              onClick={() => {
                console.log("Hotel card clicked");
                setShowSmartWizard(true);
              }}
            >
              <div
                className="relative overflow-hidden rounded-3xl transition-all duration-500 hover:scale-[1.02] hover:-translate-y-2"
                style={{ boxShadow: "0 25px 80px rgba(0,0,0,0.4)" }}
              >
                <div className="relative h-56 overflow-hidden">
                  <img
                    src={hotelImage}
                    alt="Luxury Hotel"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0f1117] via-[#0f1117]/60 to-transparent" />
                  <div className="absolute top-4 right-4 bg-[#3ECF8E] text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg">
                    $89K/yr savings
                  </div>
                </div>

                <div className="p-6" style={{ background: '#0f1117' }}>
                  <h4 className="text-xl font-bold text-white mb-2">Luxury Hotel</h4>
                  <p className="text-slate-400 text-sm mb-4">350 rooms • High HVAC demand</p>

                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="text-center rounded-xl py-2" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div className="text-lg font-bold text-[#3ECF8E]">3.2yr</div>
                      <div className="text-xs text-slate-500">Payback</div>
                    </div>
                    <div className="text-center rounded-xl py-2" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div className="text-lg font-bold text-[#3ECF8E]">312%</div>
                      <div className="text-xs text-slate-500">ROI</div>
                    </div>
                    <div className="text-center rounded-xl py-2" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div className="text-lg font-bold text-white">1.5 MWh</div>
                      <div className="text-xs text-slate-500">System</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Click for similar quote</span>
                    <span className="text-[#3ECF8E] group-hover:translate-x-2 transition-transform">
                      →
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* EV Charging */}
            <div
              className="group cursor-pointer"
              onClick={() => {
                console.log("EV Charging card clicked");
                setShowSmartWizard(true);
              }}
            >
              <div
                className="relative overflow-hidden rounded-3xl transition-all duration-500 hover:scale-[1.02] hover:-translate-y-2"
                style={{ boxShadow: "0 25px 80px rgba(0,0,0,0.4)" }}
              >
                <div className="relative h-56 overflow-hidden">
                  <img
                    src={evChargingStationImage}
                    alt="EV Charging Hub"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0f1117] via-[#0f1117]/60 to-transparent" />
                  <div className="absolute top-4 right-4 bg-[#3ECF8E] text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg">
                    $215K/yr savings
                  </div>
                </div>

                <div className="p-6" style={{ background: '#0f1117' }}>
                  <h4 className="text-xl font-bold text-white mb-2">EV Charging Hub</h4>
                  <p className="text-slate-400 text-sm mb-4">
                    12 DCFC chargers • High demand spikes
                  </p>

                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="text-center rounded-xl py-2" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div className="text-lg font-bold text-[#3ECF8E]">2.8yr</div>
                      <div className="text-xs text-slate-500">Payback</div>
                    </div>
                    <div className="text-center rounded-xl py-2" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div className="text-lg font-bold text-[#3ECF8E]">428%</div>
                      <div className="text-xs text-slate-500">ROI</div>
                    </div>
                    <div className="text-center rounded-xl py-2" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div className="text-lg font-bold text-white">3 MWh</div>
                      <div className="text-xs text-slate-500">System</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Click for similar quote</span>
                    <span className="text-[#3ECF8E] group-hover:translate-x-2 transition-transform">
                      →
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== HOW MERLIN WORKS POPUP ========== */}
      {showHowItWorks && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowHowItWorks(false)}
        >
          <div
            className="rounded-3xl max-w-2xl w-full p-8 shadow-2xl"
            style={{ background: '#0f1117', border: '1px solid rgba(255,255,255,0.08)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <img src={merlinImage} alt="Merlin" className="w-12 h-12" />
                <h2 className="text-3xl font-bold text-white">How Merlin Works</h2>
              </div>
              <button
                onClick={() => setShowHowItWorks(false)}
                className="text-slate-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-full bg-[#3ECF8E]/20 border border-[#3ECF8E]/30 flex items-center justify-center text-[#3ECF8E] font-bold shrink-0">
                  1
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">Tell Us About Your Business</h3>
                  <p className="text-slate-400">
                    Answer a few quick questions about your facility, energy usage, and goals.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-full bg-[#3ECF8E]/20 border border-[#3ECF8E]/30 flex items-center justify-center text-[#3ECF8E] font-bold shrink-0">
                  2
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">Merlin Analyzes Your Needs</h3>
                  <p className="text-slate-400">
                    Our AI uses NREL ATB 2024 pricing and DOE-aligned methodology to design the
                    optimal energy solution.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-full bg-[#3ECF8E]/20 border border-[#3ECF8E]/30 flex items-center justify-center text-[#3ECF8E] font-bold shrink-0">
                  3
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">Get Your Custom Quote</h3>
                  <p className="text-slate-400">
                    Receive a detailed, bank-ready proposal with ROI projections and equipment
                    specs—all with traceable sources.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-full bg-[#3ECF8E]/20 border border-[#3ECF8E]/30 flex items-center justify-center text-[#3ECF8E] font-bold shrink-0">
                  4
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">Start Saving Money</h3>
                  <p className="text-slate-400">
                    Connect with certified installers and start cutting your energy costs.
                  </p>
                </div>
              </div>
            </div>

            {/* Industry Compliance Statement */}
            <div className="mt-6 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <MethodologyStatement
                variant="compact"
                darkMode={true}
                message="NREL ATB 2024 & DOE StoreFAST aligned"
              />
            </div>

            <button
              onClick={() => {
                setShowHowItWorks(false);
                setShowSmartWizard(true);
              }}
              className="w-full mt-6 py-4 rounded-full font-bold text-lg transition-all"
              style={{ background: 'rgba(62,207,142,0.15)', border: '2px solid rgba(62,207,142,0.3)', color: '#3ECF8E' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(62,207,142,0.25)'; e.currentTarget.style.borderColor = 'rgba(62,207,142,0.5)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(62,207,142,0.15)'; e.currentTarget.style.borderColor = 'rgba(62,207,142,0.3)'; }}
            >
              🪄 Start My Free Quote →
            </button>
          </div>
        </div>
      )}

      {/* ========== MERLIN ANIMATION/VIDEO MODAL - DYNAMIC FLOW ========== */}
      {showMerlinVideo && (
        <div
          className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4"
          onClick={() => setShowMerlinVideo(false)}
        >
          <div
            className="rounded-3xl max-w-5xl w-full overflow-hidden shadow-2xl"
            style={{ background: '#0f1117', border: '1px solid rgba(255,255,255,0.08)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header - More Compact */}
            <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-3">
                <img
                  src={merlinImage}
                  alt="Merlin"
                  className="w-12 h-12 drop-shadow-xl animate-float"
                />
                <div>
                  <h2 className="text-xl font-bold text-white">The Power of Merlin AI</h2>
                  <p className="text-slate-500 text-xs">Your energy savings journey</p>
                </div>
              </div>
              <button
                onClick={() => setShowMerlinVideo(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-lg transition-colors"
                style={{ background: 'rgba(255,255,255,0.06)' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
              >
                ×
              </button>
            </div>

            {/* ANIMATED FLOW - Inputs → Merlin → BIG SAVINGS */}
            <div className="p-6">
              {/* Flow Visualization */}
              <div className="relative mb-8">
                {/* Connection Line - Animated */}
                <div className="absolute top-1/2 left-0 right-0 h-1 -translate-y-1/2 z-0 hidden md:block">
                  <div className="absolute inset-0 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }} />
                  <div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 via-[#3ECF8E] to-emerald-500 rounded-full"
                    style={{
                      animation: "flowLine 3s ease-in-out infinite",
                      width: "100%",
                    }}
                  />
                </div>

                {/* Three Stage Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                  {/* STAGE 1: YOUR INPUTS */}
                  <div
                    className="backdrop-blur-xl rounded-2xl p-5 transform transition-all hover:scale-[1.02]"
                    style={{ animation: "slideInLeft 0.5s ease-out", background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    <div className="text-center mb-4">
                      <div className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-3" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <span className="text-3xl">📊</span>
                      </div>
                      <h3 className="text-lg font-bold text-white">Your Inputs</h3>
                    </div>

                    {/* Animated Input Items */}
                    <div className="space-y-2">
                      <div
                        className="flex items-center gap-2 p-2 rounded-lg"
                        style={{ animation: "fadeSlideIn 0.6s ease-out 0.2s both", background: 'rgba(255,255,255,0.04)' }}
                      >
                        <span className="text-lg">🏢</span>
                        <div>
                          <div className="text-xs text-slate-500">Industry</div>
                          <div className="text-sm text-white font-medium">Hotel • 350 rooms</div>
                        </div>
                      </div>
                      <div
                        className="flex items-center gap-2 p-2 rounded-lg"
                        style={{ animation: "fadeSlideIn 0.6s ease-out 0.4s both", background: 'rgba(255,255,255,0.04)' }}
                      >
                        <span className="text-lg">📍</span>
                        <div>
                          <div className="text-xs text-slate-500">Location</div>
                          <div className="text-sm text-white font-medium">
                            California • $0.24/kWh
                          </div>
                        </div>
                      </div>
                      <div
                        className="flex items-center gap-2 p-2 rounded-lg"
                        style={{ animation: "fadeSlideIn 0.6s ease-out 0.6s both", background: 'rgba(255,255,255,0.04)' }}
                      >
                        <span className="text-lg">🎯</span>
                        <div>
                          <div className="text-xs text-slate-500">Goals</div>
                          <div className="text-sm text-white font-medium">
                            Cost savings + EV charging
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Arrow indicator (mobile) */}
                    <div className="md:hidden flex justify-center mt-4 text-slate-400 animate-bounce">
                      <span className="text-2xl">↓</span>
                    </div>
                  </div>

                  {/* STAGE 2: MERLIN MAGIC - Central, highlighted */}
                  <div
                    className="backdrop-blur-xl rounded-2xl p-5 transform transition-all hover:scale-[1.02] relative"
                    style={{
                      animation: "pulseGlow 2s ease-in-out infinite",
                      background: 'rgba(62,207,142,0.06)',
                      border: '2px solid rgba(62,207,142,0.25)',
                      boxShadow: "0 0 40px rgba(62,207,142,0.1)",
                    }}
                  >
                    {/* Processing Badge */}
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#3ECF8E] text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      AI Processing
                    </div>

                    <div className="text-center mb-4 pt-2">
                      <div className="relative inline-block">
                        <img
                          src={merlinImage}
                          alt="Merlin"
                          className="w-20 h-20 animate-float drop-shadow-2xl"
                        />
                        {/* Sparkles around Merlin */}
                        <div
                          className="absolute -top-2 -left-2 text-lg animate-ping"
                          style={{ animationDuration: "1.5s" }}
                        >
                          ✨
                        </div>
                        <div
                          className="absolute -top-1 -right-3 text-sm animate-ping"
                          style={{ animationDuration: "2s", animationDelay: "0.5s" }}
                        >
                          ⚡
                        </div>
                        <div
                          className="absolute -bottom-1 -left-3 text-sm animate-ping"
                          style={{ animationDuration: "1.8s", animationDelay: "0.3s" }}
                        >
                          🔮
                        </div>
                      </div>
                      <h3 className="text-lg font-bold text-[#3ECF8E] mt-2">Merlin Analyzes</h3>
                    </div>

                    {/* Processing Indicators */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
                        <div className="w-4 h-4 bg-[#3ECF8E] rounded-full animate-pulse" />
                        <span className="text-xs text-white">Industry power profile matched</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
                        <div
                          className="w-4 h-4 bg-[#3ECF8E] rounded-full animate-pulse"
                          style={{ animationDelay: "0.2s" }}
                        />
                        <span className="text-xs text-white">NREL ATB 2024 pricing applied</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
                        <div
                          className="w-4 h-4 bg-[#3ECF8E] rounded-full animate-pulse"
                          style={{ animationDelay: "0.4s" }}
                        />
                        <span className="text-xs text-white">Optimal configuration found!</span>
                      </div>
                    </div>

                    {/* Arrow indicator (mobile) */}
                    <div className="md:hidden flex justify-center mt-4 text-[#3ECF8E] animate-bounce">
                      <span className="text-2xl">↓</span>
                    </div>
                  </div>

                  {/* STAGE 3: BIG SAVINGS - Most emphasized */}
                  <div
                    className="bg-gradient-to-br from-emerald-600/30 via-emerald-700/20 to-green-800/30 backdrop-blur-xl rounded-2xl p-5 border-2 border-emerald-500/60 transform transition-all hover:scale-[1.02] relative overflow-hidden"
                    style={{
                      animation: "slideInRight 0.5s ease-out 0.3s both",
                      boxShadow: "0 0 50px rgba(16,185,129,0.25)",
                    }}
                  >
                    {/* Shimmer effect */}
                    <div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full"
                      style={{ animation: "shimmer 2s ease-in-out infinite" }}
                    />

                    <div className="text-center mb-4 relative z-10">
                      <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-500/40 mb-3">
                        <span className="text-3xl">💰</span>
                      </div>
                      <h3 className="text-lg font-bold text-emerald-400">Your Savings</h3>
                    </div>

                    {/* BIG SAVINGS NUMBERS - Animated counter effect */}
                    <div className="space-y-3 relative z-10">
                      <div className="text-center p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
                        <div
                          className="text-3xl md:text-4xl font-black text-[#3ECF8E]"
                          style={{ textShadow: "0 0 20px rgba(62,207,142,0.3)" }}
                        >
                          $127,500
                        </div>
                        <div className="text-xs text-slate-400">Annual Savings</div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="text-center p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
                          <div className="text-xl font-bold text-white">2.1 yrs</div>
                          <div className="text-xs text-slate-500">Payback</div>
                        </div>
                        <div className="text-center p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
                          <div className="text-xl font-bold text-[#3ECF8E]">485%</div>
                          <div className="text-xs text-slate-500">25-yr ROI</div>
                        </div>
                      </div>

                      {/* Tax Credit Badge */}
                      <div className="flex items-center justify-center gap-2 text-xs text-emerald-300 bg-emerald-500/10 py-2 rounded-full">
                        <span>✓</span> 30% Federal Tax Credit Included
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* System Configuration Preview */}
              <div className="backdrop-blur-sm rounded-2xl p-4 mb-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-2xl mb-1">🔋</div>
                      <div className="text-lg font-bold text-white">2.0 MW</div>
                      <div className="text-xs text-slate-500">Battery</div>
                    </div>
                    <div className="text-slate-600">+</div>
                    <div className="text-center">
                      <div className="text-2xl mb-1">☀️</div>
                      <div className="text-lg font-bold text-white">500 kWp</div>
                      <div className="text-xs text-slate-500">Solar</div>
                    </div>
                    <div className="text-slate-600">+</div>
                    <div className="text-center">
                      <div className="text-2xl mb-1">⚡</div>
                      <div className="text-lg font-bold text-white">8 Ports</div>
                      <div className="text-xs text-slate-500">EV Charging</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-500">Net System Cost</div>
                    <div className="text-xl font-bold text-white">$485,000</div>
                    <div className="text-xs text-[#3ECF8E]">After 30% ITC</div>
                  </div>
                </div>
              </div>

              {/* CTA - Larger, more prominent */}
              <button
                onClick={() => {
                  setShowMerlinVideo(false);
                  setShowSmartWizard(true);
                }}
                className="w-full py-5 rounded-full font-bold text-xl transition-all flex items-center justify-center gap-3 group"
                style={{ background: 'rgba(62,207,142,0.15)', border: '2px solid rgba(62,207,142,0.3)', color: '#3ECF8E' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(62,207,142,0.25)'; e.currentTarget.style.borderColor = 'rgba(62,207,142,0.5)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(62,207,142,0.15)'; e.currentTarget.style.borderColor = 'rgba(62,207,142,0.3)'; }}
              >
                <span className="text-2xl group-hover:animate-bounce">🪄</span>
                <span>Get Your Personalized Quote</span>
                <span className="group-hover:translate-x-2 transition-transform">→</span>
              </button>
              <p className="text-center text-slate-500 text-sm mt-3">
                No signup required • 5 easy steps
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========== USE CASE DETAIL POPUP ========== */}
      {showUseCaseDetail && selectedHeroUseCase && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowUseCaseDetail(false)}
        >
          <div
            className="rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl"
            style={{ background: '#0f1117', border: '1px solid rgba(255,255,255,0.08)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Hero Image */}
            <div className="relative h-48">
              <img
                src={selectedHeroUseCase.image}
                alt={selectedHeroUseCase.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0f1117] to-transparent" />
              <button
                onClick={() => setShowUseCaseDetail(false)}
                className="absolute top-4 right-4 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white text-xl transition-colors"
              >
                ×
              </button>
              <div className="absolute bottom-4 left-6">
                <span className="bg-[#3ECF8E] text-white px-3 py-1 rounded-full text-sm font-bold">
                  {selectedHeroUseCase.systemSize}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="p-8">
              <h2 className="text-3xl font-bold text-white mb-6">{selectedHeroUseCase.name}</h2>

              {/* Financial Metrics */}
              <div className="grid grid-cols-3 gap-6 mb-8">
                <div className="rounded-2xl p-5 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="text-4xl font-black text-[#3ECF8E] mb-1">
                    {selectedHeroUseCase.savings}
                  </div>
                  <div className="text-sm text-slate-500">Annual Savings</div>
                </div>
                <div className="rounded-2xl p-5 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="text-4xl font-black text-white mb-1">
                    {selectedHeroUseCase.payback}
                  </div>
                  <div className="text-sm text-slate-500">Payback Period</div>
                </div>
                <div className="rounded-2xl p-5 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="text-4xl font-black text-[#3ECF8E] mb-1">
                    {selectedHeroUseCase.roi}
                  </div>
                  <div className="text-sm text-slate-500">25-Year ROI</div>
                </div>
              </div>

              {/* Description */}
              <p className="text-slate-400 mb-8 leading-relaxed">
                This {selectedHeroUseCase.name.toLowerCase()} installation demonstrates the power of
                battery storage for energy cost reduction. With a {selectedHeroUseCase.systemSize}{" "}
                system, businesses in this sector typically see dramatic reductions in peak demand
                charges and can take advantage of time-of-use rate arbitrage.
              </p>

              {/* CTA */}
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setShowUseCaseDetail(false);
                    setShowSmartWizard(true);
                  }}
                  className="flex-1 py-4 rounded-full font-bold text-lg transition-all"
                  style={{ background: 'rgba(62,207,142,0.15)', border: '2px solid rgba(62,207,142,0.3)', color: '#3ECF8E' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(62,207,142,0.25)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(62,207,142,0.15)'; }}
                >
                  🪄 Get a Quote Like This
                </button>
                <button
                  onClick={() => setShowUseCaseDetail(false)}
                  className="px-6 py-4 rounded-full font-semibold text-slate-400 transition-all"
                  style={{ border: '1px solid rgba(255,255,255,0.1)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quote Builder Landing Modal - V5 TODO: Replace with WizardV5 modal */}
      {/* showQuoteBuilderLanding && selectedUseCaseForQuote && (
        <WizardV5
          initialUseCase={selectedUseCaseForQuote.slug}
          onComplete={handleGenerateQuote}
          onCancel={handleCancelQuoteBuilder}
        />
      ) */}

      {/* Real World Applications Modal */}
      <RealWorldApplicationModal
        show={showRealWorldModal}
        onClose={() => setShowRealWorldModal(false)}
        application={selectedApplication}
        onStartWizard={() => setShowSmartWizard(true)}
      />

      {/* TrueQuote™ Marketing Modal */}
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
