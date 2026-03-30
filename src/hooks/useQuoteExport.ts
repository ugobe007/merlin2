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
import * as XLSX from "xlsx";
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

    setIsExporting(true);
    setExportSuccess(false);

    try {
      if (format === "word") {
        // Word export requires auth (server-stored document)
        if (!projectInfo) {
          alert(
            "Please complete the Project Information form at the top of the page to create your account and download quotes."
          );
          setIsExporting(false);
          return;
        }
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user && !projectInfo.userId) {
          alert("Account authentication required. Please complete the Project Information form.");
          setIsExporting(false);
          return;
        }
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
        return;
      }

      if (format === "excel") {
        // ✅ Client-side XLSX export using xlsx package (no auth required)
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

        const totalMWh = storageSizeMW * durationHours;
        const totalKWh = totalMWh * 1000;
        const totalProjectCost = quoteResult.costs.totalProjectCost;
        const annualSavings = quoteResult.financials.annualSavings ?? 0;
        const paybackYears = quoteResult.financials.paybackYears ?? 0;
        const roi25Year = quoteResult.financials.roi25Year ?? 0;

        const wb = XLSX.utils.book_new();

        // ── Sheet 1: Project Summary ──────────────────────────────────────
        const summaryData = [
          ["MERLIN Energy — BESS Quote Summary", ""],
          ["Generated", new Date().toLocaleDateString()],
          ["", ""],
          ["PROJECT INFORMATION", ""],
          ["Project Name", projectName || "BESS Project"],
          ["Location", location || "Not specified"],
          ["Application", applicationType],
          ["Use Case", useCase],
          ["", ""],
          ["SYSTEM SPECIFICATIONS", ""],
          ["Power Rating (MW)", storageSizeMW],
          ["Energy Capacity (MWh)", totalMWh],
          ["Energy Capacity (kWh)", totalKWh],
          ["Duration (hours)", durationHours],
          ["Battery Chemistry", chemistry.toUpperCase()],
          ["Round-Trip Efficiency (%)", roundTripEfficiency],
          ["", ""],
          ["PRICING & INVESTMENT", ""],
          ["BESS Equipment ($)", quoteResult.equipment.batteries.totalCost],
          ["BOS & Installation ($)", Math.round(quoteResult.equipment.batteries.totalCost * 0.25)],
          ...(solarPVIncluded
            ? [
                ["Solar PV System ($)", quoteResult.equipment.solar?.totalCost || 0] as [
                  string,
                  number,
                ],
              ]
            : []),
          ...(windTurbineIncluded
            ? [["Wind System ($)", quoteResult.equipment.wind?.totalCost || 0] as [string, number]]
            : []),
          ["TOTAL PROJECT COST ($)", totalProjectCost],
          ["Cost per kWh ($/kWh)", parseFloat((totalProjectCost / totalKWh).toFixed(2))],
          ["", ""],
          ["FINANCIAL ANALYSIS", ""],
          ["Estimated Annual Savings ($)", annualSavings],
          ["Simple Payback (years)", parseFloat(paybackYears.toFixed(1))],
          ["25-Year ROI (%)", parseFloat(roi25Year.toFixed(0))],
        ];

        const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
        wsSummary["!cols"] = [{ wch: 32 }, { wch: 20 }];
        XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

        // ── Sheet 2: 25-Year Cash Flow ────────────────────────────────────
        const cashFlowHeaders = ["Year", "Annual Savings ($)", "Cumulative Net ($)"];
        const cashFlowRows: (string | number)[][] = [cashFlowHeaders];
        for (let yr = 1; yr <= 25; yr++) {
          const escalated = annualSavings * Math.pow(1.025, yr - 1);
          const cumulative =
            Array.from({ length: yr }, (_, j) => annualSavings * Math.pow(1.025, j)).reduce(
              (a, b) => a + b,
              0
            ) - totalProjectCost;
          cashFlowRows.push([yr, Math.round(escalated), Math.round(cumulative)]);
        }
        const wsCashFlow = XLSX.utils.aoa_to_sheet(cashFlowRows);
        wsCashFlow["!cols"] = [{ wch: 8 }, { wch: 20 }, { wch: 22 }];
        XLSX.utils.book_append_sheet(wb, wsCashFlow, "25-Year Cash Flow");

        // ── Sheet 3: Equipment Breakdown ──────────────────────────────────
        const equipHeaders = ["Component", "Cost ($)", "% of Total"];
        const equip = quoteResult.equipment;
        const equipRows: (string | number)[][] = [
          equipHeaders,
          [
            "BESS / Batteries",
            equip.batteries.totalCost,
            parseFloat(((equip.batteries.totalCost / totalProjectCost) * 100).toFixed(1)),
          ],
          [
            "BOS & Installation",
            Math.round(equip.batteries.totalCost * 0.25),
            parseFloat((((equip.batteries.totalCost * 0.25) / totalProjectCost) * 100).toFixed(1)),
          ],
        ];
        if (solarPVIncluded && equip.solar) {
          equipRows.push([
            "Solar PV",
            equip.solar.totalCost,
            parseFloat(((equip.solar.totalCost / totalProjectCost) * 100).toFixed(1)),
          ]);
        }
        if (windTurbineIncluded && equip.wind) {
          equipRows.push([
            "Wind System",
            equip.wind.totalCost,
            parseFloat(((equip.wind.totalCost / totalProjectCost) * 100).toFixed(1)),
          ]);
        }
        equipRows.push(["TOTAL", totalProjectCost, 100]);

        const wsEquip = XLSX.utils.aoa_to_sheet(equipRows);
        wsEquip["!cols"] = [{ wch: 24 }, { wch: 18 }, { wch: 14 }];
        XLSX.utils.book_append_sheet(wb, wsEquip, "Equipment Breakdown");

        const fileName = `${(projectName || "BESS_Quote").replace(/[^a-z0-9]/gi, "_")}_${new Date().toISOString().split("T")[0]}.xlsx`;
        const wbBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
        const blob = new Blob([wbBuffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        saveAs(blob, fileName);
        setExportSuccess(true);
        setTimeout(() => setExportSuccess(false), 3000);
        return;
      }

      if (format === "pdf") {
        // ✅ Client-side PDF via print-to-PDF (no auth, no extra dependency)
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

        const totalMWh = storageSizeMW * durationHours;
        const totalKWh = totalMWh * 1000;
        const totalProjectCost = quoteResult.costs.totalProjectCost;
        const annualSavings = quoteResult.financials.annualSavings ?? 0;
        const paybackYears = quoteResult.financials.paybackYears ?? 0;
        const roi25Year = quoteResult.financials.roi25Year ?? 0;
        const annualSavingsFmt = annualSavings.toLocaleString(undefined, {
          maximumFractionDigits: 0,
        });

        const printId = `merlin-pdf-print-${Date.now()}`;
        const html = `
          <div id="${printId}" style="font-family:Arial,sans-serif;max-width:720px;margin:0 auto;padding:32px;color:#1a1a2e;">
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px;">
              <span style="font-size:28px;font-weight:900;color:#7C3AED;">⚡ MERLIN Energy</span>
            </div>
            <h2 style="font-size:18px;color:#4F46E5;margin-bottom:4px;">Battery Energy Storage System Quote</h2>
            <p style="font-size:12px;color:#666;margin-bottom:24px;">Generated ${new Date().toLocaleDateString()} · Quote #MER-${Math.floor(Math.random() * 9000 + 1000)}</p>

            <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
              <tr><td colspan="2" style="background:#f0ebff;padding:8px 12px;font-weight:700;color:#5B21B6;font-size:13px;">PROJECT INFORMATION</td></tr>
              <tr><td style="padding:6px 12px;width:50%;border-bottom:1px solid #eee;color:#555;font-size:13px;">Project Name</td><td style="padding:6px 12px;border-bottom:1px solid #eee;font-size:13px;">${projectName || "BESS Project"}</td></tr>
              <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;color:#555;font-size:13px;">Location</td><td style="padding:6px 12px;border-bottom:1px solid #eee;font-size:13px;">${location || "Not specified"}</td></tr>
              <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;color:#555;font-size:13px;">Application</td><td style="padding:6px 12px;border-bottom:1px solid #eee;font-size:13px;">${applicationType}</td></tr>
            </table>

            <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
              <tr><td colspan="2" style="background:#f0ebff;padding:8px 12px;font-weight:700;color:#5B21B6;font-size:13px;">SYSTEM SPECIFICATIONS</td></tr>
              <tr><td style="padding:6px 12px;width:50%;border-bottom:1px solid #eee;color:#555;font-size:13px;">Power Rating</td><td style="padding:6px 12px;border-bottom:1px solid #eee;font-size:13px;">${storageSizeMW.toFixed(2)} MW</td></tr>
              <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;color:#555;font-size:13px;">Energy Capacity</td><td style="padding:6px 12px;border-bottom:1px solid #eee;font-size:13px;">${totalMWh.toFixed(2)} MWh (${totalKWh.toLocaleString()} kWh)</td></tr>
              <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;color:#555;font-size:13px;">Duration</td><td style="padding:6px 12px;border-bottom:1px solid #eee;font-size:13px;">${durationHours} hours</td></tr>
              <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;color:#555;font-size:13px;">Battery Chemistry</td><td style="padding:6px 12px;border-bottom:1px solid #eee;font-size:13px;">${chemistry.toUpperCase()}</td></tr>
            </table>

            <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
              <tr><td colspan="2" style="background:#f0ebff;padding:8px 12px;font-weight:700;color:#5B21B6;font-size:13px;">PRICING &amp; INVESTMENT</td></tr>
              <tr><td style="padding:6px 12px;width:50%;border-bottom:1px solid #eee;color:#555;font-size:13px;">BESS Equipment</td><td style="padding:6px 12px;border-bottom:1px solid #eee;font-size:13px;">$${quoteResult.equipment.batteries.totalCost.toLocaleString()}</td></tr>
              <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;color:#555;font-size:13px;">BOS &amp; Installation</td><td style="padding:6px 12px;border-bottom:1px solid #eee;font-size:13px;">$${Math.round(quoteResult.equipment.batteries.totalCost * 0.25).toLocaleString()}</td></tr>
              <tr style="background:#f9f7ff;"><td style="padding:8px 12px;border-bottom:1px solid #eee;font-weight:700;font-size:13px;">TOTAL PROJECT COST</td><td style="padding:8px 12px;border-bottom:1px solid #eee;font-weight:700;font-size:13px;color:#7C3AED;">$${totalProjectCost.toLocaleString()}</td></tr>
            </table>

            <table style="width:100%;border-collapse:collapse;margin-bottom:32px;">
              <tr><td colspan="2" style="background:#f0ebff;padding:8px 12px;font-weight:700;color:#5B21B6;font-size:13px;">FINANCIAL ANALYSIS</td></tr>
              <tr><td style="padding:6px 12px;width:50%;border-bottom:1px solid #eee;color:#555;font-size:13px;">Estimated Annual Savings</td><td style="padding:6px 12px;border-bottom:1px solid #eee;font-size:13px;">$${annualSavingsFmt}</td></tr>
              <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;color:#555;font-size:13px;">Simple Payback</td><td style="padding:6px 12px;border-bottom:1px solid #eee;font-size:13px;">${paybackYears.toFixed(1)} years</td></tr>
              <tr><td style="padding:6px 12px;border-bottom:1px solid #eee;color:#555;font-size:13px;">25-Year ROI</td><td style="padding:6px 12px;border-bottom:1px solid #eee;font-size:13px;">${roi25Year.toFixed(0)}%</td></tr>
            </table>

            <p style="font-size:11px;color:#999;text-align:center;margin-top:24px;">Generated by MERLIN Energy Quote Builder · © ${new Date().getFullYear()} MERLIN Energy. All rights reserved.</p>
          </div>
        `;

        // Inject hidden print frame
        const frame = document.createElement("iframe");
        frame.style.cssText =
          "position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;border:none;";
        document.body.appendChild(frame);
        const doc = frame.contentDocument || frame.contentWindow?.document;
        if (doc) {
          doc.open();
          const printStyle = "<style>@media print { body { margin: 0; } }</style>";
          doc.write(
            "<!DOCTYPE html><html><head><title>MERLIN Energy Quote</title>" +
              printStyle +
              "</head><body>" +
              html +
              "</body></html>"
          );
          doc.close();
          frame.contentWindow?.focus();
          frame.contentWindow?.print();
        }
        // Clean up frame after print dialog closes
        setTimeout(() => document.body.removeChild(frame), 2000);
        setExportSuccess(true);
        setTimeout(() => setExportSuccess(false), 3000);
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
