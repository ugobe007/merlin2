import { useState } from "react";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  WidthType,
  AlignmentType,
  HeadingLevel,
} from "docx";
import { saveAs } from "file-saver";
import { QuoteEngine } from "@/core/calculations";
import { supabase } from "../services/supabaseClient";
import {
  createLabelValueRow,
  createLabelValueTable,
  createHighlightedLabelValueRow,
} from "@/utils/wordHelpers";

interface ProjectInfo {
  userId?: string;
}

interface QuoteExportConfig {
  // Project Information
  projectInfo: ProjectInfo | null;
  projectName?: string;
  location?: string;
  applicationType: string;
  useCase: string;

  // System Specifications
  storageSizeMW: number;
  durationHours: number;
  chemistry: string;
  roundTripEfficiency: number;

  // Electrical Specifications
  systemVoltage: number;
  dcVoltage: number;
  inverterType: string;
  numberOfInverters: number;
  inverterRating: number;
  gridConnection: string;

  // Renewables & Alternative Power
  solarPVIncluded: boolean;
  solarCapacityKW?: number;
  windTurbineIncluded: boolean;
  windCapacityKW?: number;
  fuelCellIncluded: boolean;
  fuelCellCapacityKW?: number;
  fuelType?: string;
  generatorIncluded: boolean;
  generatorCapacityKW?: number;
  generatorFuelTypeSelected?: string;

  // Utility Rates
  utilityRate: number;
}

export function useQuoteExport(config: QuoteExportConfig) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  const exportQuote = async (format: "word" | "excel" | "pdf") => {
    const {
      projectInfo,
      projectName,
      location,
      applicationType,
      useCase,
      storageSizeMW,
      durationHours,
      chemistry,
      roundTripEfficiency,
      systemVoltage,
      dcVoltage,
      inverterType,
      numberOfInverters,
      inverterRating,
      gridConnection,
      solarPVIncluded,
      solarCapacityKW,
      windTurbineIncluded,
      windCapacityKW,
      fuelCellIncluded,
      fuelCellCapacityKW,
      fuelType,
      generatorIncluded,
      generatorCapacityKW,
      generatorFuelTypeSelected,
      utilityRate,
    } = config;

    // Check authentication - require project info (account creation)
    if (!projectInfo) {
      alert(
        "Please complete the Project Information form at the top of the page to create your account and download quotes."
      );
      return;
    }

    // Double-check Supabase auth
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user && !projectInfo.userId) {
      alert("Account authentication required. Please complete the Project Information form.");
      return;
    }

    setIsExporting(true);
    setExportSuccess(false);

    try {
      if (format === "word") {
        // ✅ SINGLE SOURCE OF TRUTH: Use QuoteEngine for ALL pricing/financials
        const quoteResult = await QuoteEngine.generateQuote({
          storageSizeMW,
          durationHours,
          solarMW: solarPVIncluded ? (solarCapacityKW || 0) / 1000 : 0,
          windMW: windTurbineIncluded ? (windCapacityKW || 0) / 1000 : 0,
          generatorMW: generatorIncluded ? (generatorCapacityKW || 0) / 1000 : 0,
          generatorFuelType:
            generatorFuelTypeSelected === "linear"
              ? "natural-gas"
              : (generatorFuelTypeSelected as "diesel" | "natural-gas" | "dual-fuel"),
          fuelCellMW: fuelCellIncluded ? (fuelCellCapacityKW || 0) / 1000 : 0,
          fuelCellType:
            fuelType === "natural-gas"
              ? "natural-gas-fc"
              : fuelType === "solid-oxide"
                ? "solid-oxide"
                : "hydrogen",
          location: location || "California",
          electricityRate: utilityRate,
          gridConnection:
            gridConnection === "off-grid"
              ? "off-grid"
              : gridConnection === "ac-coupled"
                ? "on-grid"
                : "limited",
          useCase: useCase,
        });

        // Extract values from unified calculator
        const totalMWh = storageSizeMW * durationHours;
        const effectiveBatteryKwh = totalMWh * 1000;
        const bessCapEx = quoteResult.equipment.batteries.totalCost;
        const solarCost = quoteResult.equipment.solar?.totalCost || 0;
        const windCost = quoteResult.equipment.wind?.totalCost || 0;
        const totalProjectCost = quoteResult.costs.totalProjectCost;
        const annualSavings = quoteResult.financials.annualSavings ?? 0;
        const paybackYears = quoteResult.financials.paybackYears ?? 0;
        const roi25Year = quoteResult.financials.roi25Year ?? 0;

        const doc = new Document({
          sections: [
            {
              children: [
                // Header
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "⚡ MERLIN Energy",
                      bold: true,
                      size: 48,
                      color: "7C3AED",
                    }),
                  ],
                  alignment: AlignmentType.CENTER,
                  spacing: { after: 200 },
                }),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Battery Energy Storage System Quote",
                      size: 28,
                      color: "4F46E5",
                    }),
                  ],
                  alignment: AlignmentType.CENTER,
                  spacing: { after: 400 },
                }),

                // Quote Info
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `Quote #MER-${Math.floor(Math.random() * 10000)
                        .toString()
                        .padStart(4, "0")}`,
                      size: 20,
                    }),
                    new TextRun({ text: `  |  ${new Date().toLocaleDateString()}`, size: 20 }),
                  ],
                  alignment: AlignmentType.RIGHT,
                  spacing: { after: 400 },
                }),

                // Project Information Section
                new Paragraph({
                  text: "PROJECT INFORMATION",
                  heading: HeadingLevel.HEADING_1,
                  spacing: { after: 200 },
                }),
                createLabelValueTable(
                  [
                    ["Project Name:", projectName || "BESS Project"],
                    ["Location:", location || "Not specified"],
                    [
                      "Application:",
                      applicationType.charAt(0).toUpperCase() + applicationType.slice(1),
                    ],
                    [
                      "Use Case:",
                      useCase.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase()),
                    ],
                  ],
                  30
                ),

                new Paragraph({ text: "", spacing: { after: 300 } }),

                // System Specifications Section
                new Paragraph({
                  text: "SYSTEM SPECIFICATIONS",
                  heading: HeadingLevel.HEADING_1,
                  spacing: { after: 200 },
                }),
                createLabelValueTable(
                  [
                    ["Power Rating:", `${storageSizeMW.toFixed(2)} MW`],
                    [
                      "Energy Capacity:",
                      `${totalMWh.toFixed(2)} MWh (${effectiveBatteryKwh.toLocaleString()} kWh)`,
                    ],
                    ["Duration:", `${durationHours} hours`],
                    ["Battery Chemistry:", chemistry.toUpperCase()],
                    ["Round-Trip Efficiency:", `${roundTripEfficiency}%`],
                  ],
                  40
                ),

                new Paragraph({ text: "", spacing: { after: 300 } }),

                // Electrical Specifications
                new Paragraph({
                  text: "ELECTRICAL SPECIFICATIONS",
                  heading: HeadingLevel.HEADING_1,
                  spacing: { after: 200 },
                }),
                createLabelValueTable(
                  [
                    ["AC System Voltage:", `${systemVoltage}V`],
                    ["DC Battery Voltage:", `${dcVoltage}V`],
                    [
                      "Inverter Type:",
                      inverterType === "bidirectional" ? "Bidirectional" : "Unidirectional",
                    ],
                    [
                      "Number of Inverters:",
                      `${numberOfInverters} units @ ${inverterRating} kW each`,
                    ],
                  ],
                  40
                ),

                new Paragraph({ text: "", spacing: { after: 300 } }),

                // Pricing Section
                new Paragraph({
                  text: "PRICING & INVESTMENT",
                  heading: HeadingLevel.HEADING_1,
                  spacing: { after: 200 },
                }),
                new Table({
                  width: { size: 100, type: WidthType.PERCENTAGE },
                  rows: [
                    createLabelValueRow("BESS Equipment:", `$${bessCapEx.toLocaleString()}`),
                    createLabelValueRow(
                      "BOS & Installation:",
                      `$${(bessCapEx * 0.25).toLocaleString()}`
                    ),
                    ...(solarPVIncluded
                      ? [createLabelValueRow("Solar PV System:", `$${solarCost.toLocaleString()}`)]
                      : []),
                    ...(windTurbineIncluded
                      ? [createLabelValueRow("Wind System:", `$${windCost.toLocaleString()}`)]
                      : []),
                    // Special formatted total row
                    createHighlightedLabelValueRow(
                      "TOTAL PROJECT COST:",
                      `$${totalProjectCost.toLocaleString()}`
                    ),
                  ],
                }),

                new Paragraph({ text: "", spacing: { after: 300 } }),

                // Financial Analysis
                new Paragraph({
                  text: "FINANCIAL ANALYSIS",
                  heading: HeadingLevel.HEADING_1,
                  spacing: { after: 200 },
                }),
                createLabelValueTable(
                  [
                    [
                      "Estimated Annual Savings:",
                      `$${annualSavings.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
                    ],
                    ["Simple Payback:", `${paybackYears.toFixed(1)} years`],
                    ["25-Year ROI:", `${roi25Year.toFixed(0)}%`],
                    [
                      "Cost per kWh:",
                      `$${(totalProjectCost / effectiveBatteryKwh).toFixed(2)}/kWh`,
                    ],
                  ],
                  40
                ),

                new Paragraph({ text: "", spacing: { after: 400 } }),

                // Footer
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Generated by MERLIN Energy Quote Builder",
                      italics: true,
                      size: 18,
                      color: "9CA3AF",
                    }),
                  ],
                  alignment: AlignmentType.CENTER,
                }),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `© ${new Date().getFullYear()} MERLIN Energy. All rights reserved.`,
                      italics: true,
                      size: 16,
                      color: "9CA3AF",
                    }),
                  ],
                  alignment: AlignmentType.CENTER,
                }),
              ],
            },
          ],
        });

        const blob = await Packer.toBlob(doc);
        const fileName = `${(projectName || "BESS_Quote").replace(/[^a-z0-9]/gi, "_")}_${new Date().toISOString().split("T")[0]}.docx`;
        saveAs(blob, fileName);
        setExportSuccess(true);

        setTimeout(() => {
          setExportSuccess(false);
        }, 3000);
      } else if (format === "excel") {
        alert(
          "📊 Excel Export\n\nExcel export coming soon!\nFor now, use Word export for full quotes."
        );
      } else if (format === "pdf") {
        alert(
          "📄 PDF Export\n\nPDF export coming soon!\nFor now, use Word export and convert to PDF."
        );
      }
    } catch (error) {
      console.error("Export error:", error);
      alert("❌ Export failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return {
    exportQuote,
    isExporting,
    exportSuccess,
  };
}
