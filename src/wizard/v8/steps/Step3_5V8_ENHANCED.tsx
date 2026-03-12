/**
 * WIZARD V8 — STEP 3.5: ENERGY PROFILE & INTELLIGENT RECOMMENDATIONS
 * ============================================================================
 * TWO-PANEL LAYOUT:
 * - Left: Energy profile based on Step 3 answers
 * - Right: Intelligent recommendations with WHY + suggested sizes
 * ============================================================================
 */

import React from "react";
import type { WizardState, WizardActions } from "../wizardState";
import { 
  Sun, 
  Fuel, 
  Zap, 
  Info, 
  Check, 
  AlertCircle, 
  TrendingUp, 
  Battery,
  DollarSign,
  Clock,
  Shield
} from "lucide-react";

interface Props {
  state: WizardState;
  actions: WizardActions;
}

const T = {
  accent: "#3ECF8E",
  accentSoft: "rgba(62,207,142,0.10)",
  accentBorder: "rgba(62,207,142,0.28)",
  textPrimary: "rgba(232,235,243,0.98)",
  textSecondary: "rgba(232,235,243,0.64)",
  textMuted: "rgba(232,235,243,0.42)",
  panel: "rgba(255,255,255,0.03)",
  panelBorder: "rgba(255,255,255,0.08)",
  warning: "#f59e0b",
  danger: "#ef4444",
  success: "#10b981",
};

export default function Step3_5V8Enhanced({ state, actions }: Props) {
  const { 
    peakLoadKW, 
    criticalLoadKW, 
    step3Answers, 
    industry
  } = state;

  // Extract key answers from Step 3
  const gridReliability = (step3Answers.gridReliability as string) || "reliable";
  const existingSolar = (step3Answers.existingSolar as string) || "none";
  const existingGenerator = (step3Answers.existingGenerator as string) || "none";
  const evChargers = (step3Answers.evChargers as string) || "none";
  
  // Get electricity rate from location (fallback to average commercial)
  const electricityRate = 0.12; // TODO: Get from actual location data
  const demandCharge = 20; // TODO: Get from location/utility

  // Calculate financial metrics
  const monthlyEnergyKWh = peakLoadKW * 24 * 30 * 0.55; // 55% duty cycle average
  const monthlyEnergyCost = monthlyEnergyKWh * electricityRate;
  const monthlyDemandCost = peakLoadKW * demandCharge;
  const totalMonthlyCost = monthlyEnergyCost + monthlyDemandCost;

  // INTELLIGENT RECOMMENDATIONS LOGIC
  
  // Solar recommendation
  const shouldRecommendSolar = () => {
    if (existingSolar === "existing") return false; // Already has solar
    if (electricityRate < 0.10) return false; // Rates too low
    return true;
  };

  const getSolarRecommendation = () => {
    if (!shouldRecommendSolar()) return null;
    
    // Calculate optimal solar size (30-40% of peak load is industry best practice)
    const optimalSolarKW = Math.round(peakLoadKW * 0.35 / 50) * 50; // Round to nearest 50kW
    const minSolarKW = Math.round(peakLoadKW * 0.25 / 50) * 50;
    const maxSolarKW = Math.round(peakLoadKW * 0.50 / 50) * 50;
    
    // Calculate simple payback
    const solarAnnualProduction = optimalSolarKW * 1500; // kWh/year (conservative)
    const annualSavings = solarAnnualProduction * electricityRate;
    const solarCost = optimalSolarKW * 850; // $850/kW installed
    const paybackYears = (solarCost / annualSavings).toFixed(1);
    
    return {
      size: optimalSolarKW,
      minSize: minSolarKW,
      maxSize: maxSolarKW,
      annualSavings: Math.round(annualSavings),
      payback: paybackYears,
      reason: electricityRate > 0.15 
        ? `High electricity rate ($${electricityRate.toFixed(2)}/kWh) makes solar very attractive`
        : `Electricity rate ($${electricityRate.toFixed(2)}/kWh) + excellent solar potential`,
      coverage: Math.round((solarAnnualProduction / (monthlyEnergyKWh * 12)) * 100),
    };
  };

  // Generator recommendation
  const shouldRecommendGenerator = () => {
    if (existingGenerator === "yes-extensive") return false; // Already has full coverage
    
    // ALWAYS recommend if no backup power exists
    if (existingGenerator === "none") return true;
    
    // Recommend if grid is unreliable (even with partial backup)
    if (gridReliability === "frequent" || gridReliability === "unreliable") return true;
    
    // Critical facilities should always have backup
    const criticalIndustries = ["hospital", "data-center", "cold-storage"];
    if (industry && criticalIndustries.some(ind => industry.toLowerCase().includes(ind))) {
      return true;
    }
    
    // Recommend for any business without full backup and with occasional outages
    if (existingGenerator === "none" || existingGenerator === "yes-partial") {
      if (gridReliability === "occasional") return true;
    }
    
    return false;
  };

  const getGeneratorRecommendation = () => {
    if (!shouldRecommendGenerator()) return null;
    
    // Determine if we need full or critical load coverage
    const isCriticalFacility = industry 
      ? ["hospital", "data-center", "cold-storage"].some(ind => industry.toLowerCase().includes(ind))
      : false;
    
    const targetLoadKW = isCriticalFacility || existingGenerator === "none" 
      ? peakLoadKW 
      : criticalLoadKW || peakLoadKW * 0.7; // 70% for critical loads if not specified
    
    // Add 25% reserve margin (industry standard)
    const recommendedGeneratorKW = Math.round(targetLoadKW * 1.25 / 50) * 50; // Round to 50kW
    
    // Calculate downtime cost (industry-specific)
    const getDowntimeCostPerHour = () => {
      if (industry?.toLowerCase().includes("casino")) return 500000;
      if (industry?.toLowerCase().includes("hospital")) return 100000;
      if (industry?.toLowerCase().includes("data-center")) return 250000;
      if (industry?.toLowerCase().includes("hotel")) return 10000;
      return 5000; // Default for other industries
    };
    
    const downtimeCost = getDowntimeCostPerHour();
    
    return {
      size: recommendedGeneratorKW,
      targetLoad: targetLoadKW,
      coverage: Math.round((targetLoadKW / peakLoadKW) * 100),
      reason: gridReliability === "frequent" || gridReliability === "unreliable"
        ? `Grid has ${gridReliability} outages - backup power critical`
        : isCriticalFacility
        ? `Critical facility requires reliable backup power`
        : `No backup power currently - recommend protection`,
      downtimeCost: downtimeCost.toLocaleString(),
    };
  };

  // EV Charging recommendation
  const shouldRecommendEV = () => {
    if (evChargers !== "none" && evChargers !== "planned") return false; // Already has EV
    
    // Recommend for customer-facing businesses
    const customerFacingIndustries = ["hotel", "retail", "shopping", "restaurant", "casino"];
    return industry 
      ? customerFacingIndustries.some(ind => industry.toLowerCase().includes(ind))
      : false;
  };

  const getEVRecommendation = () => {
    if (!shouldRecommendEV()) return null;
    
    return {
      level2: 12,
      dcfc: 8,
      totalKW: (12 * 7.2) + (8 * 150), // 86.4 + 1200 = 1286 kW
      reason: "Customer-facing business - EV charging attracts customers and generates revenue",
      revenue: "~$45K-120K/year in charging revenue",
    };
  };

  const solarRec = getSolarRecommendation();
  const generatorRec = getGeneratorRecommendation();
  const evRec = getEVRecommendation();

  // Solar option selection (2 choices)
  const [selectedSolarOption, setSelectedSolarOption] = React.useState<'none' | 'standard' | 'extended'>('none');
  
  const handleSolarSelection = (option: 'none' | 'standard' | 'extended') => {
    setSelectedSolarOption(option);
    if (option === 'none') {
      actions.setAddonPreference('solar', false);
      actions.setAddonConfig({ solarKW: 0 });
    } else {
      actions.setAddonPreference('solar', true);
      const size = option === 'standard' ? solarRec!.minSize : solarRec!.size;
      actions.setAddonConfig({ solarKW: size });
    }
  };

  // Generator option selection (2 choices)
  const [selectedGeneratorOption, setSelectedGeneratorOption] = React.useState<'none' | 'critical' | 'full'>('none');
  
  const handleGeneratorSelection = (option: 'none' | 'critical' | 'full') => {
    setSelectedGeneratorOption(option);
    if (option === 'none') {
      actions.setAddonPreference('generator', false);
      actions.setAddonConfig({ generatorKW: 0 });
    } else {
      actions.setAddonPreference('generator', true);
      const size = option === 'critical' ? generatorRec!.targetLoad : generatorRec!.size;
      actions.setAddonConfig({ generatorKW: Math.round(size / 50) * 50 });
    }
  };

  // EV option selection (2 choices)
  const [selectedEVOption, setSelectedEVOption] = React.useState<'none' | 'basic' | 'mixed'>('none');
  
  const handleEVSelection = (option: 'none' | 'basic' | 'mixed') => {
    setSelectedEVOption(option);
    if (option === 'none') {
      actions.setAddonPreference('ev', false);
      actions.setAddonConfig({ level2Chargers: 0, dcfcChargers: 0 });
    } else {
      actions.setAddonPreference('ev', true);
      if (option === 'basic') {
        // Level 2 only (12 chargers)
        actions.setAddonConfig({ level2Chargers: 12, dcfcChargers: 0 });
      } else {
        // Mixed (12 L2 + 8 DCFC)
        actions.setAddonConfig({ level2Chargers: 12, dcfcChargers: 8 });
      }
    }
  };

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto", padding: 20 }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <div style={{ 
          fontSize: 12, 
          fontWeight: 700, 
          letterSpacing: "0.15em", 
          color: T.accent, 
          marginBottom: 12,
          textTransform: "uppercase"
        }}>
          Step 3.5 of 5
        </div>
        <h1 style={{ 
          fontSize: "clamp(32px, 5vw, 48px)", 
          fontWeight: 800, 
          color: T.textPrimary, 
          margin: "0 0 12px",
          lineHeight: 1.1
        }}>
          Your Energy Profile & Recommendations
        </h1>
        <p style={{ fontSize: 16, color: T.textSecondary, maxWidth: 600, margin: "0 auto" }}>
          Based on your facility details, here's what Merlin recommends
        </p>
      </div>

      {/* Two-Panel Layout */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "minmax(320px, 400px) 1fr", 
        gap: 24,
        alignItems: "start"
      }}>
        
        {/* LEFT PANEL: Energy Profile */}
        <div style={{ position: "sticky", top: 20 }}>
          <div style={{
            background: T.panel,
            border: `1px solid ${T.panelBorder}`,
            borderRadius: 16,
            padding: 24,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: T.accentSoft,
                border: `1px solid ${T.accentBorder}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <Battery style={{ width: 24, height: 24, color: T.accent }} />
              </div>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: T.textPrimary, margin: 0 }}>
                  Facility Profile
                </h2>
                <p style={{ fontSize: 13, color: T.textMuted, margin: 0 }}>
                  {industry || "Your business"}
                </p>
              </div>
            </div>

            {/* Key Metrics */}
            <div style={{ 
              display: "grid", 
              gap: 16, 
              padding: 16, 
              background: "rgba(0,0,0,0.2)", 
              borderRadius: 12,
              marginBottom: 20
            }}>
              <div>
                <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Peak Demand
                </div>
                <div style={{ fontSize: 28, fontWeight: 900, color: T.textPrimary }}>
                  {peakLoadKW.toLocaleString()} <span style={{ fontSize: 16, fontWeight: 600, color: T.textSecondary }}>kW</span>
                </div>
              </div>
              
              <div>
                <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Monthly Energy
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: T.textPrimary }}>
                  {Math.round(monthlyEnergyKWh).toLocaleString()} <span style={{ fontSize: 14, fontWeight: 600, color: T.textSecondary }}>kWh</span>
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Estimated Monthly Cost
                </div>
                <div style={{ fontSize: 24, fontWeight: 900, color: T.warning }}>
                  ${Math.round(totalMonthlyCost).toLocaleString()}
                </div>
                <div style={{ fontSize: 12, color: T.textMuted, marginTop: 4 }}>
                  ${Math.round(monthlyEnergyCost).toLocaleString()} energy + ${Math.round(monthlyDemandCost).toLocaleString()} demand
                </div>
              </div>
            </div>

            {/* Risk Factors */}
            {(gridReliability !== "reliable" || existingGenerator === "none") && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ 
                  fontSize: 12, 
                  fontWeight: 700, 
                  color: T.danger, 
                  marginBottom: 12,
                  display: "flex",
                  alignItems: "center",
                  gap: 6
                }}>
                  <AlertCircle style={{ width: 16, height: 16 }} />
                  RISK FACTORS
                </div>
                <div style={{ display: "grid", gap: 8 }}>
                  {gridReliability !== "reliable" && (
                    <div style={{ 
                      padding: 12, 
                      background: "rgba(239,68,68,0.1)", 
                      border: "1px solid rgba(239,68,68,0.2)",
                      borderRadius: 8,
                      fontSize: 13,
                      color: "#fca5a5"
                    }}>
                      • Grid reliability: {gridReliability === "frequent" ? "Frequent outages" : "Occasional issues"}
                    </div>
                  )}
                  {existingGenerator === "none" && (
                    <div style={{ 
                      padding: 12, 
                      background: "rgba(239,68,68,0.1)", 
                      border: "1px solid rgba(239,68,68,0.2)",
                      borderRadius: 8,
                      fontSize: 13,
                      color: "#fca5a5"
                    }}>
                      • No backup power
                    </div>
                  )}
                  <div style={{ 
                    padding: 12, 
                    background: "rgba(251,191,36,0.1)", 
                    border: "1px solid rgba(251,191,36,0.2)",
                    borderRadius: 8,
                    fontSize: 13,
                    color: "#fbbf24"
                  }}>
                    • High demand charges (${demandCharge}/kW)
                  </div>
                </div>
              </div>
            )}

            {/* Opportunities */}
            <div>
              <div style={{ 
                fontSize: 12, 
                fontWeight: 700, 
                color: T.success, 
                marginBottom: 12,
                display: "flex",
                alignItems: "center",
                gap: 6
              }}>
                <TrendingUp style={{ width: 16, height: 16 }} />
                OPPORTUNITIES
              </div>
              <div style={{ display: "grid", gap: 8 }}>
                {solarRec && (
                  <div style={{ 
                    padding: 12, 
                    background: "rgba(16,185,129,0.1)", 
                    border: "1px solid rgba(16,185,129,0.2)",
                    borderRadius: 8,
                    fontSize: 13,
                    color: "#6ee7b7"
                  }}>
                    • Solar: {solarRec.payback}yr payback
                  </div>
                )}
                <div style={{ 
                  padding: 12, 
                  background: "rgba(16,185,129,0.1)", 
                  border: "1px solid rgba(16,185,129,0.2)",
                  borderRadius: 8,
                  fontSize: 13,
                  color: "#6ee7b7"
                }}>
                  • BESS: ${Math.round(monthlyDemandCost * 0.7).toLocaleString()}/mo demand savings
                </div>
                {generatorRec && (
                  <div style={{ 
                    padding: 12, 
                    background: "rgba(16,185,129,0.1)", 
                    border: "1px solid rgba(16,185,129,0.2)",
                    borderRadius: 8,
                    fontSize: 13,
                    color: "#6ee7b7"
                  }}>
                    • Backup: Avoid ${generatorRec.downtimeCost}/hr downtime
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: Recommendations */}
        <div style={{ display: "grid", gap: 20 }}>
          
          {/* Battery Storage (Always Included) */}
          <div style={{
            background: "linear-gradient(135deg, rgba(62,207,142,0.05) 0%, rgba(62,207,142,0.02) 100%)",
            border: `2px solid ${T.accentBorder}`,
            borderRadius: 16,
            padding: 24,
          }}>
            <div style={{ display: "flex", alignItems: "start", justifyContent: "space-between", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 56,
                  height: 56,
                  borderRadius: 14,
                  background: T.accentSoft,
                  border: `2px solid ${T.accentBorder}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  <Battery style={{ width: 28, height: 28, color: T.accent }} />
                </div>
                <div>
                  <h3 style={{ fontSize: 22, fontWeight: 900, color: T.textPrimary, margin: 0 }}>
                    Battery Storage
                  </h3>
                  <p style={{ fontSize: 14, color: T.accent, margin: "4px 0 0", fontWeight: 700 }}>
                    ✓ Included in your quote
                  </p>
                </div>
              </div>
              <div style={{
                padding: "6px 12px",
                background: T.accentSoft,
                border: `1px solid ${T.accentBorder}`,
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 800,
                color: T.accent
              }}>
                REQUIRED
              </div>
            </div>
            <p style={{ fontSize: 14, color: T.textSecondary, lineHeight: 1.6, margin: 0 }}>
              MagicFit will size your battery system based on your peak demand and energy goals in the next step.
            </p>
          </div>

          {/* Solar Recommendation */}
          {solarRec && (
            <div style={{
              background: "rgba(255,255,255,0.02)",
              border: `1px solid ${selectedSolarOption !== 'none' ? "#f59e0b" : T.panelBorder}`,
              borderRadius: 12,
              padding: 20,
              transition: "all 0.2s ease"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <Sun style={{ width: 20, height: 20, color: "#fbbf24" }} />
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: T.textPrimary, margin: 0 }}>
                    Solar PV Array
                  </h3>
                  <p style={{ fontSize: 13, color: T.textMuted, margin: "2px 0 0" }}>
                    {solarRec.reason}
                  </p>
                </div>
              </div>

              {/* 2 Option Selection */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {/* Option 1: Standard */}
                <label style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "12px 14px",
                  border: `1px solid ${selectedSolarOption === 'standard' ? "#f59e0b" : "rgba(255,255,255,0.08)"}`,
                  borderRadius: 8,
                  background: selectedSolarOption === 'standard' ? "rgba(251,191,36,0.08)" : "transparent",
                  cursor: "pointer",
                  transition: "all 0.15s ease"
                }}>
                  <input
                    type="radio"
                    name="solar"
                    checked={selectedSolarOption === 'standard'}
                    onChange={() => handleSolarSelection('standard')}
                    style={{ marginRight: 10, accentColor: "#f59e0b" }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: T.textPrimary }}>
                        Standard
                      </span>
                      <span style={{ fontSize: 13, color: "#fbbf24", fontWeight: 600 }}>
                        {solarRec.minSize.toLocaleString()} kW
                      </span>
                      <span style={{ fontSize: 12, color: T.textMuted }}>•</span>
                      <span style={{ fontSize: 12, color: T.textMuted }}>
                        ${Math.round(solarRec.minSize * 850 / 1000).toLocaleString()}K
                      </span>
                      <span style={{ fontSize: 12, color: T.textMuted }}>•</span>
                      <span style={{ fontSize: 12, color: T.success }}>
                        {((solarRec.minSize * 850) / (solarRec.minSize * 1500 * electricityRate)).toFixed(1)}yr payback
                      </span>
                    </div>
                  </div>
                </label>

                {/* Option 2: Extended */}
                <label style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "12px 14px",
                  border: `1px solid ${selectedSolarOption === 'extended' ? "#f59e0b" : "rgba(255,255,255,0.08)"}`,
                  borderRadius: 8,
                  background: selectedSolarOption === 'extended' ? "rgba(251,191,36,0.08)" : "transparent",
                  cursor: "pointer",
                  transition: "all 0.15s ease"
                }}>
                  <input
                    type="radio"
                    name="solar"
                    checked={selectedSolarOption === 'extended'}
                    onChange={() => handleSolarSelection('extended')}
                    style={{ marginRight: 10, accentColor: "#f59e0b" }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: T.textPrimary }}>
                        Extended
                      </span>
                      <span style={{ fontSize: 13, color: "#fbbf24", fontWeight: 600 }}>
                        {solarRec.size.toLocaleString()} kW
                      </span>
                      <span style={{ fontSize: 12, color: T.textMuted }}>•</span>
                      <span style={{ fontSize: 12, color: T.textMuted }}>
                        ${Math.round(solarRec.size * 850 / 1000).toLocaleString()}K
                      </span>
                      <span style={{ fontSize: 12, color: T.textMuted }}>•</span>
                      <span style={{ fontSize: 12, color: T.success }}>
                        {solarRec.payback} yrs payback
                      </span>
                      <span style={{ fontSize: 12, color: T.textMuted }}>•</span>
                      <span style={{ fontSize: 12, color: "#fbbf24" }}>
                        ⭐ Recommended
                      </span>
                    </div>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Generator Recommendation */}
          {generatorRec && (
            <div style={{
              background: "rgba(255,255,255,0.02)",
              border: `1px solid ${selectedGeneratorOption !== 'none' ? "#f97316" : T.panelBorder}`,
              borderRadius: 12,
              padding: 20,
              transition: "all 0.2s ease"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <Fuel style={{ width: 20, height: 20, color: "#fb923c" }} />
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: T.textPrimary, margin: 0 }}>
                    Backup Generator
                  </h3>
                  <p style={{ fontSize: 13, color: T.textMuted, margin: "2px 0 0" }}>
                    {generatorRec.reason}
                  </p>
                </div>
              </div>

              {/* 2 Option Selection */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {/* Option 1: Critical Load */}
                <label style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "12px 14px",
                  border: `1px solid ${selectedGeneratorOption === 'critical' ? "#f97316" : "rgba(255,255,255,0.08)"}`,
                  borderRadius: 8,
                  background: selectedGeneratorOption === 'critical' ? "rgba(249,115,22,0.08)" : "transparent",
                  cursor: "pointer",
                  transition: "all 0.15s ease"
                }}>
                  <input
                    type="radio"
                    name="generator"
                    checked={selectedGeneratorOption === 'critical'}
                    onChange={() => handleGeneratorSelection('critical')}
                    style={{ marginRight: 10, accentColor: "#f97316" }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: T.textPrimary }}>
                        Critical Load
                      </span>
                      <span style={{ fontSize: 13, color: "#fb923c", fontWeight: 600 }}>
                        {Math.round(generatorRec.targetLoad / 50) * 50} kW
                      </span>
                      <span style={{ fontSize: 12, color: T.textMuted }}>•</span>
                      <span style={{ fontSize: 12, color: T.textMuted }}>
                        ${Math.round((generatorRec.targetLoad * 700) / 1000).toLocaleString()}K
                      </span>
                      <span style={{ fontSize: 12, color: T.textMuted }}>•</span>
                      <span style={{ fontSize: 12, color: T.textSecondary }}>
                        Essential systems
                      </span>
                    </div>
                  </div>
                </label>

                {/* Option 2: Full Coverage */}
                <label style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "12px 14px",
                  border: `1px solid ${selectedGeneratorOption === 'full' ? "#f97316" : "rgba(255,255,255,0.08)"}`,
                  borderRadius: 8,
                  background: selectedGeneratorOption === 'full' ? "rgba(249,115,22,0.08)" : "transparent",
                  cursor: "pointer",
                  transition: "all 0.15s ease"
                }}>
                  <input
                    type="radio"
                    name="generator"
                    checked={selectedGeneratorOption === 'full'}
                    onChange={() => handleGeneratorSelection('full')}
                    style={{ marginRight: 10, accentColor: "#f97316" }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: T.textPrimary }}>
                        Full Coverage
                      </span>
                      <span style={{ fontSize: 13, color: "#fb923c", fontWeight: 600 }}>
                        {generatorRec.size.toLocaleString()} kW
                      </span>
                      <span style={{ fontSize: 12, color: T.textMuted }}>•</span>
                      <span style={{ fontSize: 12, color: T.textMuted }}>
                        ${Math.round((generatorRec.size * 700) / 1000).toLocaleString()}K
                      </span>
                      <span style={{ fontSize: 12, color: T.textMuted }}>•</span>
                      <span style={{ fontSize: 12, color: T.textSecondary }}>
                        {generatorRec.coverage}% facility
                      </span>
                      <span style={{ fontSize: 12, color: T.textMuted }}>•</span>
                      <span style={{ fontSize: 12, color: "#fb923c" }}>
                        ⭐ Recommended
                      </span>
                    </div>
                  </div>
                </label>
              </div>

              <div style={{ 
                marginTop: 12,
                padding: 10, 
                background: "rgba(249,115,22,0.05)", 
                border: "1px solid rgba(249,115,22,0.15)",
                borderRadius: 6,
                fontSize: 12,
                color: "#fb923c",
                display: "flex",
                alignItems: "center",
                gap: 6
              }}>
                <Shield style={{ width: 14, height: 14, flexShrink: 0 }} />
                BESS provides instant transfer (&lt;16ms) • Generator handles extended outages
              </div>
            </div>
          )}

          {/* EV Charging Recommendation */}
          {evRec && (
            <div style={{
              background: "rgba(255,255,255,0.02)",
              border: `1px solid ${selectedEVOption !== 'none' ? "#06b6d4" : T.panelBorder}`,
              borderRadius: 12,
              padding: 20,
              transition: "all 0.2s ease"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <Zap style={{ width: 20, height: 20, color: "#22d3ee" }} />
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: T.textPrimary, margin: 0 }}>
                    EV Charging Hub
                  </h3>
                  <p style={{ fontSize: 13, color: T.textMuted, margin: "2px 0 0" }}>
                    {evRec.reason}
                  </p>
                </div>
              </div>

              {/* 2 Option Selection */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {/* Option 1: Basic (Level 2 Only) */}
                <label style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "12px 14px",
                  border: `1px solid ${selectedEVOption === 'basic' ? "#06b6d4" : "rgba(255,255,255,0.08)"}`,
                  borderRadius: 8,
                  background: selectedEVOption === 'basic' ? "rgba(6,182,212,0.08)" : "transparent",
                  cursor: "pointer",
                  transition: "all 0.15s ease"
                }}>
                  <input
                    type="radio"
                    name="ev"
                    checked={selectedEVOption === 'basic'}
                    onChange={() => handleEVSelection('basic')}
                    style={{ marginRight: 10, accentColor: "#06b6d4" }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: T.textPrimary }}>
                        Level 2 Only
                      </span>
                      <span style={{ fontSize: 13, color: "#22d3ee", fontWeight: 600 }}>
                        12 chargers • 86 kW
                      </span>
                      <span style={{ fontSize: 12, color: T.textMuted }}>•</span>
                      <span style={{ fontSize: 12, color: T.textMuted }}>
                        $48K
                      </span>
                      <span style={{ fontSize: 12, color: T.textMuted }}>•</span>
                      <span style={{ fontSize: 12, color: T.success }}>
                        $35K-60K/yr revenue
                      </span>
                    </div>
                  </div>
                </label>

                {/* Option 2: Mixed (L2 + DCFC) */}
                <label style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "12px 14px",
                  border: `1px solid ${selectedEVOption === 'mixed' ? "#06b6d4" : "rgba(255,255,255,0.08)"}`,
                  borderRadius: 8,
                  background: selectedEVOption === 'mixed' ? "rgba(6,182,212,0.08)" : "transparent",
                  cursor: "pointer",
                  transition: "all 0.15s ease"
                }}>
                  <input
                    type="radio"
                    name="ev"
                    checked={selectedEVOption === 'mixed'}
                    onChange={() => handleEVSelection('mixed')}
                    style={{ marginRight: 10, accentColor: "#06b6d4" }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: T.textPrimary }}>
                        Mixed Fast Charging
                      </span>
                      <span style={{ fontSize: 13, color: "#22d3ee", fontWeight: 600 }}>
                        12 L2 + 8 DCFC • {Math.round(evRec.totalKW).toLocaleString()} kW
                      </span>
                      <span style={{ fontSize: 12, color: T.textMuted }}>•</span>
                      <span style={{ fontSize: 12, color: T.textMuted }}>
                        $1.25M
                      </span>
                      <span style={{ fontSize: 12, color: T.textMuted }}>•</span>
                      <span style={{ fontSize: 12, color: T.success }}>
                        $45K-120K/yr
                      </span>
                      <span style={{ fontSize: 12, color: T.textMuted }}>•</span>
                      <span style={{ fontSize: 12, color: "#22d3ee" }}>
                        ⭐ Recommended
                      </span>
                    </div>
                  </div>
                </label>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Continue Button */}
      <div style={{ 
        marginTop: 40, 
        padding: "24px 0",
        borderTop: `1px solid ${T.panelBorder}`,
        display: "flex",
        justifyContent: "center"
      }}>
        <button
          onClick={() => actions.goToStep(5)}
          style={{
            height: 56,
            padding: "0 48px",
            borderRadius: 14,
            border: "none",
            background: T.accent,
            color: "#000",
            fontSize: 16,
            fontWeight: 900,
            cursor: "pointer",
            boxShadow: "0 4px 20px rgba(62,207,142,0.3)",
            transition: "all 0.2s ease"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 8px 30px rgba(62,207,142,0.4)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 4px 20px rgba(62,207,142,0.3)";
          }}
        >
          Continue to MagicFit Sizing →
        </button>
      </div>
    </div>
  );
}
