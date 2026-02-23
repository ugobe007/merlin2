// Auto-extracted by Op6 — CSV/Excel generation for QuotePreviewModal
// Source: src/components/modals/QuotePreviewModal.tsx

import { saveAs } from "file-saver";
import type { QuotePreviewData } from "./quotePreviewWordDoc";

export function generateExcelData(quoteData: QuotePreviewData): void {
  // Enhanced CSV with proper alignment and formatting for Excel
  const {
    costs,
    bessPowerMW,
    batteryMWh,
    solarMW,
    windMW,
    generatorMW,
    annualSavings,
    paybackPeriod,
    budget,
  } = quoteData;

  // Helper function to right-align numbers with padding
  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString()}`.padStart(20);
  };

  const formatValue = (value: string | number) => {
    return String(value).padStart(20);
  };

  // Sales-focused equipment pricing for CSV
  const csvBmsCost = Math.round(costs.batterySystem * 0.05);
  const csvEssCost = Math.round(costs.batterySystem * 0.08);
  const csvMonCost = Math.round(costs.batterySystem * 0.02);
  const csvEquipTotal =
    costs.batterySystem +
    (costs.pcs + costs.inverters) +
    costs.transformers +
    costs.switchgear +
    (costs.microgridControls || 0) +
    csvBmsCost +
    csvEssCost +
    csvMonCost +
    (solarMW > 0 ? costs.solar + (costs.solarInverters || 0) : 0) +
    (windMW > 0 ? costs.wind + (costs.windConverters || 0) : 0) +
    (generatorMW > 0 ? costs.generator + (costs.generatorControls || 0) : 0);
  const csvBatteryPerKWh = Math.round(costs.batterySystem / (batteryMWh * 1000));
  const csvAllInPerKWh = Math.round(csvEquipTotal / (batteryMWh * 1000));
  const csvImplEstimate = costs.bos + costs.epc + costs.tariffs + costs.shipping;

  let csv = '"MERLIN ENERGY SOLUTIONS","BATTERY ENERGY STORAGE SYSTEM - EQUIPMENT QUOTE"\n';
  csv += `\"Generated:\",\"${new Date().toLocaleDateString()}\"\n`;
  csv += `\"Project:\",\"${quoteData.projectName}\"\n`;
  csv += `\"Client:\",\"${quoteData.clientName}\"\n`;
  csv += `\"Battery $/kWh:\",\"$${csvBatteryPerKWh}/kWh\"\n`;
  csv += `\"TrueQuote Verified:\",\"Yes - Source-backed pricing\"\n`;
  csv += "\n";

  csv += '"═══ SYSTEM CONFIGURATION ═══════════════════════════════════"\n';
  csv += '"Metric","Value"\n';
  csv += `\"BESS Capacity\",\"${batteryMWh.toFixed(1)} MWh\"\n`;
  csv += `\"Power Rating\",\"${bessPowerMW} MW\"\n`;
  if (solarMW > 0) csv += `\"Solar Capacity\",\"${solarMW} MW\"\n`;
  if (windMW > 0) csv += `\"Wind Capacity\",\"${windMW} MW\"\n`;
  if (generatorMW > 0) csv += `\"Generator Backup\",\"${generatorMW} MW\"\n`;
  csv += `\"Warranty Period\",\"${quoteData.warranty} Years\"\n`;
  csv += "\n";

  // Equipment Quote (main pricing)
  csv += '"═══ EQUIPMENT & SOFTWARE QUOTE ═════════════════════════════"\n';
  csv += '"Equipment","Specification","Price (USD)"\n';
  csv += `\"Battery Energy Storage (BESS)\",\"${batteryMWh.toFixed(1)} MWh LFP\",${costs.batterySystem}\n`;
  csv += `\"Power Conversion System (PCS)\",\"${bessPowerMW} MW\",${costs.pcs + costs.inverters}\n`;
  csv += `\"Battery Management System (BMS)\",\"Cell balancing & monitoring\",${csvBmsCost}\n`;
  csv += `\"ESS Enclosure & Thermal\",\"NEMA-rated + HVAC cooling\",${csvEssCost}\n`;
  csv += `\"BESS Monitoring & Software (Yr 1)\",\"Cloud monitoring & analytics\",${csvMonCost}\n`;
  csv += `\"Transformers & Switchgear\",\"${bessPowerMW} MW rated\",${costs.transformers + costs.switchgear}\n`;
  if (costs.microgridControls > 0)
    csv += `\"Microgrid Controls\",\"System-wide\",${costs.microgridControls}\n`;

  if (solarMW > 0) {
    csv += `\"Solar Array + Inverters\",\"${solarMW} MW\",${costs.solar + (costs.solarInverters || 0)}\n`;
  }
  if (windMW > 0) {
    csv += `\"Wind Turbines + Converters\",\"${windMW} MW\",${costs.wind + (costs.windConverters || 0)}\n`;
  }
  if (generatorMW > 0) {
    csv += `\"Generator Backup\",\"${generatorMW} MW\",${costs.generator + (costs.generatorControls || 0)}\n`;
  }

  csv += "\n";
  csv += `\"EQUIPMENT TOTAL\",\"$${csvAllInPerKWh}/kWh all-in\",${csvEquipTotal}\n`;
  csv += "\n";

  // Estimated implementation (separate from main quote)
  csv += '"═══ ESTIMATED IMPLEMENTATION (not included in equipment total) ═══"\n';
  csv += '"Service","Description","Est. Range (USD)"\n';
  csv += `\"Balance of System (BoS)\",\"Cabling, racking, site materials\",\"~${costs.bos}\"\n`;
  csv += `\"EPC Services\",\"Engineering, procurement, construction\",\"~${costs.epc}\"\n`;
  csv += `\"Tariffs & Shipping\",\"Regional duties + logistics\",\"~${costs.tariffs + costs.shipping}\"\n`;
  csv += `\"EST. IMPLEMENTATION TOTAL\",\"Subject to EPC provider\",\"~${csvImplEstimate}\"\n`;
  csv += "\n";

  // Financial Analysis
  csv += '"═══ RETURN ON INVESTMENT ═══════════════════════════════════"\n';
  csv += '"Financial Metric","Value"\n';
  csv += `\"Battery $/kWh\",\"$${csvBatteryPerKWh}/kWh\"\n`;
  csv += `\"Annual Energy Savings\",\"$${annualSavings.toLocaleString()}\"\n`;
  csv += `\"Payback Period\",\"${paybackPeriod.toFixed(1)} years\"\n`;
  csv += `\"10-Year Net Savings\",\"$${(annualSavings * 10 - csvEquipTotal).toLocaleString()}\"\n`;
  csv += `\"25-Year Lifetime Savings\",\"$${(annualSavings * 25 - csvEquipTotal).toLocaleString()}\"\n`;

  if (budget) {
    const budgetStatus =
      csvEquipTotal <= budget
        ? `\"Under budget by $${(budget - csvEquipTotal).toLocaleString()}\"`
        : `\"Over budget by $${(csvEquipTotal - budget).toLocaleString()}\"`;
    csv += `\"Budget Status\",${budgetStatus}\n`;
  }

  csv += "\n";
  csv += '"═══════════════════════════════════════════════════════════"\n';
  csv += '"Generated by MERLIN Energy Solutions - TrueQuote Verified"\n';
  csv += `\"Document Date: ${new Date().toISOString().split("T")[0]}\"\n`;

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  saveAs(
    blob,
    `Merlin_BESS_Quote_${quoteData.projectName.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.csv`
  );
}
