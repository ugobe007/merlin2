/**
 * STEP 6: Quote Review (Wizard V6)
 * ================================
 * Updated to support nested calculations:
 *   calculations.base    -> SSOT base values from TrueQuote (never overwritten)
 *   calculations.selected-> Tier-specific chosen system + financials
 */

import React, { useState } from "react";
import {
  Battery,
  Sun,
  Zap,
  Fuel,
  DollarSign,
  TrendingUp,
  Calendar,
  MapPin,
  Building2,
  CheckCircle,
  Download,
  Sparkles,
  Shield,
  Info,
} from "lucide-react";

import type { WizardState } from "../types";
import { POWER_LEVELS } from "../types";

import RequestQuoteModal from "@/components/modals/RequestQuoteModal";
import { exportQuoteAsPDF } from "@/utils/quoteExportUtils";
import type { QuoteExportData } from "@/utils/quoteExportUtils";

interface Props {
  state: WizardState;
}

export function Step6Quote({ state }: Props) {
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showPricingSources, setShowPricingSources] = useState(false);

  const calculations = state.calculations;
  const selectedPowerLevel = state.selectedPowerLevel;
  const powerLevel = POWER_LEVELS.find((l) => l.id === selectedPowerLevel);

  if (!calculations || !calculations.base || !calculations.selected || !powerLevel) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">Please complete the previous steps first.</p>
      </div>
    );
  }

  const base = calculations.base;
  const selected = calculations.selected;

  // ITC percentage dynamically (fallback to 30% if not provided)
  const itcPercentage =
    typeof selected.federalITCRate === "number"
      ? Math.round(selected.federalITCRate * 100)
      : selected.federalITC > 0 && selected.totalInvestment > 0
        ? Math.round((selected.federalITC / selected.totalInvestment) * 100)
        : 30;

  const quoteId = selected.quoteId || `MQ-${Date.now().toString(36).toUpperCase()}`;

  const tenYearSavings = (selected.annualSavings || 0) * 10;
  const netTenYearValue = tenYearSavings - (selected.netInvestment || 0);

  const handleRequestQuote = () => setShowRequestModal(true);

  const handleDownloadPDF = async () => {
    try {
      const quoteData: QuoteExportData = {
        projectName: `${state.industryName} - ${powerLevel.name} System`,
        location:
          `${state.city || ""} ${state.state || ""}`.trim() || state.zipCode || "Location TBD",
        applicationType: "Commercial",
        useCase: state.industryName,
        quoteNumber: quoteId,
        quoteDate: new Date().toLocaleDateString(),

        // Convert kW/kWh → MW/MWh
        storageSizeMW: (selected.bessKW || 0) / 1000,
        storageSizeMWh: (selected.bessKWh || 0) / 1000,
        durationHours: powerLevel.durationHours,

        chemistry: "LiFePO4",
        roundTripEfficiency: 85,

        installationType: "Ground Mount",
        gridConnection: "Grid-Tied",

        // Default electrical values (these could be made dynamic later)
        systemVoltage: 480,
        dcVoltage: 800,
        inverterType: "PCS",
        numberOfInverters: Math.ceil((selected.bessKW || 0) / 500),
        inverterRating: selected.bessKW || 0,
        inverterEfficiency: 96,
        switchgearType: "AC Switchgear",
        switchgearRating: (selected.bessKW || 0) * 1.25,
        bmsType: "Distributed",
        transformerRequired: true,
        transformerRating: selected.bessKW || 0,
        transformerVoltage: "480V/13.8kV",

        cyclesPerYear: 365,
        warrantyYears: 15,

        utilityRate: selected.utilityRate ?? base.utilityRate ?? state.electricityRate ?? 0.12,
        demandCharge: selected.demandCharge ?? base.demandCharge ?? 15,

        solarPVIncluded: (selected.solarKW || 0) > 0,
        solarCapacityKW: selected.solarKW || 0,
        solarPanelType: "Monocrystalline",
        solarPanelEfficiency: 21,

        systemCost: selected.totalInvestment || 0,
        showAiNote: false,
      };

      await exportQuoteAsPDF(quoteData);
    } catch (error) {
      console.error("PDF export failed:", error);
      alert("Unable to generate PDF. Please try again.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-6 mb-8">
        <div>
          <div className="flex items-center gap-2 text-slate-300 mb-2">
            <Building2 className="w-5 h-5" />
            <span className="text-sm">{state.industryName}</span>
          </div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-7 h-7 text-purple-300" />
            Your TrueQuote™ Summary
          </h1>
          <div className="flex items-center gap-2 text-slate-400 mt-2">
            <MapPin className="w-4 h-4" />
            <span className="text-sm">
              {`${state.city || ""} ${state.state || ""}`.trim() || state.zipCode}
            </span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleDownloadPDF}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </button>
          <button
            onClick={handleRequestQuote}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white flex items-center gap-2"
          >
            <Shield className="w-4 h-4" />
            Request Quote
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
          <div className="flex items-center gap-2 text-slate-300 mb-2">
            <DollarSign className="w-4 h-4" />
            Annual Savings
          </div>
          <div className="text-3xl font-extrabold text-white">
            ${Math.round(selected.annualSavings || 0).toLocaleString()}
          </div>
          <div className="text-slate-400 text-sm mt-1">
            10-year savings ≈ ${Math.round(tenYearSavings).toLocaleString()}
          </div>
        </div>

        <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
          <div className="flex items-center gap-2 text-slate-300 mb-2">
            <Calendar className="w-4 h-4" />
            Payback
          </div>
          <div className="text-3xl font-extrabold text-white">
            {(selected.paybackYears ?? 0).toFixed(1)} yrs
          </div>
          <div className="text-slate-400 text-sm mt-1">
            Net investment: ${Math.round(selected.netInvestment || 0).toLocaleString()}
          </div>
        </div>

        <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
          <div className="flex items-center gap-2 text-slate-300 mb-2">
            <TrendingUp className="w-4 h-4" />
            10-year ROI
          </div>
          <div className="text-3xl font-extrabold text-white">
            {(selected.tenYearROI ?? 0).toFixed(1)}%
          </div>
          <div className="text-slate-400 text-sm mt-1">
            Net 10-year value ≈ ${Math.round(netTenYearValue).toLocaleString()}
          </div>
        </div>
      </div>

      {/* System Summary */}
      <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-400" />
          Recommended System ({powerLevel.name})
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-slate-200">
              <span className="flex items-center gap-2">
                <Battery className="w-4 h-4 text-purple-300" />
                BESS Size
              </span>
              <span className="font-semibold">
                {Math.round(selected.bessKW || 0).toLocaleString()} kW /{" "}
                {Math.round(selected.bessKWh || 0).toLocaleString()} kWh
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-200">
              <span className="flex items-center gap-2">
                <Sun className="w-4 h-4 text-yellow-300" />
                Solar
              </span>
              <span className="font-semibold">
                {Math.round(selected.solarKW || 0).toLocaleString()} kW
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-200">
              <span className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-cyan-300" />
                EV Chargers
              </span>
              <span className="font-semibold">
                {Math.round(selected.evChargers || 0).toLocaleString()}
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-200">
              <span className="flex items-center gap-2">
                <Fuel className="w-4 h-4 text-orange-300" />
                Generator
              </span>
              <span className="font-semibold">
                {Math.round(selected.generatorKW || 0).toLocaleString()} kW
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-slate-200">
              <span className="flex items-center gap-2">
                <Info className="w-4 h-4 text-slate-400" />
                Annual Consumption
              </span>
              <span className="font-semibold">
                {Math.round(base.annualConsumptionKWh || 0).toLocaleString()} kWh
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-200">
              <span className="flex items-center gap-2">
                <Info className="w-4 h-4 text-slate-400" />
                Peak Demand
              </span>
              <span className="font-semibold">
                {Math.round(base.peakDemandKW || 0).toLocaleString()} kW
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-200">
              <span className="flex items-center gap-2">
                <Info className="w-4 h-4 text-slate-400" />
                Utility Rate
              </span>
              <span className="font-semibold">
                $
                {(
                  selected.utilityRate ??
                  base.utilityRate ??
                  state.electricityRate ??
                  0.12
                ).toFixed(3)}
                /kWh
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-200">
              <span className="flex items-center gap-2">
                <Info className="w-4 h-4 text-slate-400" />
                ITC
              </span>
              <span className="font-semibold">
                {itcPercentage}% (${Math.round(selected.federalITC || 0).toLocaleString()})
              </span>
            </div>
          </div>
        </div>

        {selected.pricingSources?.length ? (
          <div className="mt-6">
            <button
              onClick={() => setShowPricingSources((s) => !s)}
              className="text-sm text-purple-300 hover:text-purple-200"
            >
              {showPricingSources ? "Hide pricing sources" : "Show pricing sources"}
            </button>
            {showPricingSources && (
              <ul className="mt-3 text-sm text-slate-300 list-disc pl-5">
                {selected.pricingSources.map((src) => (
                  <li key={src}>{src}</li>
                ))}
              </ul>
            )}
          </div>
        ) : null}
      </div>

      <RequestQuoteModal isOpen={showRequestModal} onClose={() => setShowRequestModal(false)} />
    </div>
  );
}
