/**
 * Quote Export Utilities
 * Generate PDF, Word (.docx), and Excel (.xlsx) files with watermarks
 */

import {
  Document,
  Paragraph,
  TextRun,
  AlignmentType,
  Header,
  PageNumber,
  Footer,
  BorderStyle,
} from "docx";
import { saveAs } from "file-saver";
import { loadWatermarkSettings } from "../components/AdminWatermarkSettings";
import { MERLIN_ICON_BASE64 } from "./merlinIconData";

export interface QuoteExportData {
  // Project Information
  projectName: string;
  location: string;
  applicationType: string;
  useCase: string;
  quoteNumber: string;
  quoteDate: string;

  // System Specifications
  storageSizeMW: number;
  storageSizeMWh: number;
  durationHours: number;
  chemistry: string;
  roundTripEfficiency: number;
  installationType: string;
  gridConnection: string;

  // Electrical Specifications
  systemVoltage: number;
  dcVoltage: number;
  inverterType: string;
  numberOfInverters: number;
  inverterRating: number;
  inverterEfficiency: number;
  switchgearType: string;
  switchgearRating: number;
  bmsType: string;
  transformerRequired: boolean;
  transformerRating?: number;
  transformerVoltage?: string;

  // Performance & Operations
  cyclesPerYear: number;
  warrantyYears: number;
  utilityRate: number;
  demandCharge: number;

  // Renewables (optional)
  solarPVIncluded?: boolean;
  solarCapacityKW?: number;
  solarPanelType?: string;
  solarPanelEfficiency?: number;
  windTurbineIncluded?: boolean;
  windCapacityKW?: number;
  windTurbineType?: string;
  fuelCellIncluded?: boolean;
  fuelCellCapacityKW?: number;
  fuelCellType?: string;
  fuelType?: string;
  dieselGenIncluded?: boolean;
  dieselGenCapacityKW?: number;
  naturalGasGenIncluded?: boolean;
  naturalGasCapacityKW?: number;

  // Financial
  systemCost: number;

  // Options
  showAiNote?: boolean;

  // ─── V7 TrueQuote™ Extensions ────────────────────────────────────
  // Load Profile (Layer A)
  loadProfile?: {
    baseLoadKW: number;
    peakLoadKW: number;
    energyKWhPerDay: number;
  };

  // Financial Analysis (Layer B)
  financialAnalysis?: {
    annualSavingsUSD: number;
    paybackYears: number;
    npv?: number;
    irr?: number;
    demandChargeSavings?: number;
  };

  // TrueQuote™ Confidence
  trueQuoteConfidence?: {
    overall: "high" | "medium" | "low";
    location: string;
    industry: "v1" | "fallback";
    profileCompleteness: number;
    userInputs: number;
    defaultsUsed: number;
  };

  // TrueQuote™ Validation (kW contributors breakdown)
  trueQuoteValidation?: {
    version: "v1";
    dutyCycle?: number;
    kWContributors?: Record<string, number>;
    kWContributorShares?: Record<string, number>;
    assumptions?: string[];
  };

  // Pricing Snapshot (audit trail)
  pricingSnapshotId?: string;
}

/**
 * Generate watermark text with current date using admin settings
 */
function getWatermarkText(): string {
  const settings = loadWatermarkSettings();
  if (!settings.enabled) return "";

  const baseText = settings.useCustomText && settings.text ? settings.text : "merlin certified";
  const date = new Date().toLocaleDateString();
  return `${baseText} -- ${date}`;
}

/**
 * Get watermark style settings for UI/exports
 */
export function getWatermarkStyle() {
  const settings = loadWatermarkSettings();
  return {
    enabled: settings.enabled,
    text: getWatermarkText(),
    opacity: settings.opacity / 100,
    color: settings.color,
    fontSize: settings.fontSize,
    rotation: settings.rotation,
  };
}

/**
 * Export quote as Word document (.docx) — Supabase Design System
 * Dark color scheme with emerald #3ECF8E accents matching the PDF export.
 */
export async function exportQuoteAsWord(data: QuoteExportData): Promise<void> {
  const watermarkText = getWatermarkText();

  // Computed values
  const storageMWh = data.storageSizeMWh || data.storageSizeMW * data.durationHours;
  const annualSavings = data.financialAnalysis?.annualSavingsUSD ?? 0;
  const paybackYears = data.financialAnalysis?.paybackYears ?? 0;
  const roi10Year = annualSavings > 0 && data.systemCost > 0
    ? (((annualSavings * 10) - data.systemCost) / data.systemCost * 100)
    : 0;

  const fmtMoney = (v: number) => `$${v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const fmtMoneyShort = (v: number) => `$${Math.round(v).toLocaleString("en-US")}`;

  // Supabase-themed colors
  const C = {
    emerald: "3ECF8E",
    dark: "171717",
    text: "EDEDED",
    muted: "8B8B8B",
    bg: "0D0D0D",
    divider: "2A2A2A",
    green: "3ECF8E",
    amber: "F59E0B",
    red: "EF4444",
  };

  // Helper: section heading with emerald bottom border
  const sectionHeading = (text: string) =>
    new Paragraph({
      children: [
        new TextRun({ text, size: 26, bold: true, color: C.emerald }),
      ],
      spacing: { before: 500, after: 200 },
      border: {
        bottom: { color: C.emerald, space: 1, style: BorderStyle.SINGLE, size: 6 },
      },
    });

  // Helper: label/value row with muted labels and bright values
  const labelValueRow = (label: string, value: string, valueColor?: string) =>
    new Paragraph({
      children: [
        new TextRun({ text: `${label}: `, bold: true, size: 21, color: C.muted }),
        new TextRun({ text: value, size: 21, color: valueColor || C.text, bold: !!valueColor }),
      ],
      spacing: { after: 80 },
    });

  const doc = new Document({
    sections: [
      {
        properties: {},
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: watermarkText?.toUpperCase() || "MERLIN ENERGY", size: 14, color: "444444", bold: true }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: "Page ", size: 18, color: C.muted }),
                  new TextRun({ children: [PageNumber.CURRENT] }),
                  new TextRun({ text: " | Merlin Energy Solutions — TrueQuote™ Verified", size: 16, color: C.muted }),
                ],
              }),
            ],
          }),
        },
        children: [
          // ═══ HEADER ═══
          new Paragraph({
            children: [
              new TextRun({ text: "BATTERY ENERGY STORAGE SYSTEM PROPOSAL", size: 36, bold: true, color: C.dark }),
            ],
            spacing: { after: 120 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Professional Energy Storage Solution", size: 22, color: C.muted }),
            ],
            spacing: { after: 60 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "TrueQuote™ Verified • Source-Backed Pricing", size: 20, color: C.emerald, bold: true }),
            ],
            spacing: { after: 60 },
          }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({ text: "MERLIN", size: 32, bold: true, color: C.dark }),
            ],
            spacing: { after: 40 },
          }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({ text: "Energy Solutions", size: 18, color: C.muted }),
            ],
            spacing: { after: 300 },
          }),

          // ═══ PROJECT INFORMATION ═══
          sectionHeading("PROJECT INFORMATION"),
          labelValueRow("Client Name", data.projectName?.replace(/—.*/, "").trim() || "Custom Configuration"),
          labelValueRow("Project Name", `${data.storageSizeMW.toFixed(0)} MW / ${data.durationHours}hr BESS System`),
          labelValueRow("Quote Date", data.quoteDate),
          labelValueRow("Location", data.location),

          // ═══ 1. EXECUTIVE SUMMARY ═══
          sectionHeading("1. EXECUTIVE SUMMARY"),
          new Paragraph({
            children: [
              new TextRun({ text: "This proposal provides a comprehensive Battery Energy Storage System (BESS) solution designed to meet your specific energy requirements and deliver exceptional return on investment.", size: 21, color: C.muted }),
            ],
            spacing: { after: 200 },
          }),
          // Key Metrics
          labelValueRow("System Capacity", `${storageMWh.toFixed(1)} MWh`),
          labelValueRow("Power Rating", `${data.storageSizeMW.toFixed(0)} MW`),
          labelValueRow("Total Investment", fmtMoney(data.systemCost)),
          labelValueRow("Annual Energy Savings", `${fmtMoneyShort(annualSavings)}/year`, C.emerald),
          labelValueRow("Simple Payback Period", paybackYears > 0 ? `${paybackYears.toFixed(2)} years` : "—"),
          labelValueRow("10-Year ROI", roi10Year !== 0 ? `${roi10Year.toFixed(1)}%` : "—", roi10Year > 0 ? C.emerald : undefined),
          labelValueRow("System Warranty", `${data.warrantyYears} Years`),

          // ═══ 2. PROJECT OVERVIEW ═══
          sectionHeading("2. PROJECT OVERVIEW & VISUALIZATION"),
          new Paragraph({
            children: [
              new TextRun({ text: `The proposed system integrates with your existing infrastructure to provide energy storage, peak shaving, and grid stabilization for your ${data.useCase} application.`, size: 21, color: C.muted }),
            ],
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "[Insert aerial or ground-level photo of installation site]", size: 18, color: "555555", italics: true }),
            ],
            spacing: { after: 80 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "[Insert technical diagram showing BESS configuration and connections]", size: 18, color: "555555", italics: true }),
            ],
            spacing: { after: 300 },
          }),

          // ═══ kW Contributors (TrueQuote™) ═══
          ...(data.trueQuoteValidation?.kWContributors
            ? [
                sectionHeading("3. LOAD BREAKDOWN — TrueQuote™ Verified"),
                ...Object.entries(data.trueQuoteValidation.kWContributors)
                  .filter(([, kw]) => kw > 0)
                  .sort(([, a], [, b]) => b - a)
                  .map(([key, kw]) => {
                    const share = data.trueQuoteValidation?.kWContributorShares?.[key];
                    const label = key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());
                    return labelValueRow(label, `${Math.round(kw).toLocaleString()} kW${share != null ? ` (${(share * 100).toFixed(0)}%)` : ""}`);
                  }),
                ...(data.trueQuoteValidation.dutyCycle != null
                  ? [labelValueRow("Duty Cycle", `${(data.trueQuoteValidation.dutyCycle * 100).toFixed(0)}%`, C.emerald)]
                  : []),
              ]
            : []),

          // ═══ Financial Analysis ═══
          ...(data.financialAnalysis
            ? [
                sectionHeading(`${data.trueQuoteValidation?.kWContributors ? "4" : "3"}. FINANCIAL ANALYSIS`),
                labelValueRow("Total Investment", fmtMoney(data.systemCost)),
                labelValueRow("Annual Energy Savings", `${fmtMoneyShort(annualSavings)}/year`, C.emerald),
                labelValueRow("Simple Payback", paybackYears > 0 ? `${paybackYears.toFixed(1)} years` : "—"),
                ...(data.financialAnalysis.npv != null ? [labelValueRow("NPV (25 yr)", fmtMoneyShort(data.financialAnalysis.npv), C.emerald)] : []),
                ...(data.financialAnalysis.irr != null ? [labelValueRow("IRR", `${(data.financialAnalysis.irr * 100).toFixed(1)}%`)] : []),
                ...(data.financialAnalysis.demandChargeSavings != null ? [labelValueRow("Demand Charge Savings", `${fmtMoneyShort(data.financialAnalysis.demandChargeSavings)}/year`, C.emerald)] : []),
              ]
            : []),

          // ═══ TrueQuote™ Confidence ═══
          ...(data.trueQuoteConfidence
            ? [
                sectionHeading("TrueQuote™ CONFIDENCE"),
                labelValueRow("Overall Confidence",
                  data.trueQuoteConfidence.overall === "high" ? "✓ HIGH" : data.trueQuoteConfidence.overall === "medium" ? "◐ MEDIUM" : "○ LOW",
                  data.trueQuoteConfidence.overall === "high" ? C.emerald : data.trueQuoteConfidence.overall === "medium" ? C.amber : C.red
                ),
                labelValueRow("Profile Completeness", `${data.trueQuoteConfidence.profileCompleteness}% — ${data.trueQuoteConfidence.userInputs} user inputs, ${data.trueQuoteConfidence.defaultsUsed} defaults`),
                labelValueRow("Industry Model", data.trueQuoteConfidence.industry === "v1" ? "Industry-Specific (TrueQuote™)" : "General Facility Estimate"),
                ...(data.pricingSnapshotId ? [labelValueRow("Pricing Snapshot", `#${data.pricingSnapshotId.slice(0, 12)}`)] : []),
                ...(data.trueQuoteValidation?.assumptions?.length
                  ? [
                      new Paragraph({
                        children: [new TextRun({ text: "Methodology & Sources", bold: true, size: 21, color: C.emerald })],
                        spacing: { before: 120, after: 60 },
                      }),
                      ...data.trueQuoteValidation.assumptions.map(
                        (a) => new Paragraph({
                          children: [new TextRun({ text: `• ${a}`, size: 18, color: C.muted })],
                          spacing: { after: 40 },
                        })
                      ),
                    ]
                  : []),
              ]
            : []),

          // ═══ TERMS & CONDITIONS ═══
          sectionHeading("TERMS & CONDITIONS"),
          new Paragraph({ children: [new TextRun({ text: "• This quote is valid for 30 days from the date of issue.", size: 20, color: C.muted })], spacing: { after: 80 } }),
          new Paragraph({ children: [new TextRun({ text: "• Payment Terms: 50% deposit upon contract signing, 50% upon commissioning.", size: 20, color: C.muted })], spacing: { after: 80 } }),
          new Paragraph({ children: [new TextRun({ text: `• Warranty: ${data.warrantyYears} year comprehensive warranty included.`, size: 20, color: C.muted })], spacing: { after: 80 } }),
          new Paragraph({ children: [new TextRun({ text: "• All equipment pricing reflects current market conditions (NREL ATB 2024, IRA 2022).", size: 20, color: C.muted })], spacing: { after: 200 } }),
          new Paragraph({
            children: [new TextRun({ text: "This proposal was generated by Merlin Energy Solutions using TrueQuote™ methodology. All numbers are sourced from NREL, EIA, IEEE, and other authoritative industry standards. Final pricing may vary based on site assessment, permitting, and interconnection requirements.", size: 16, color: "555555", italics: true })],
            spacing: { after: 100 },
          }),
        ],
      },
    ],
  });

  // Generate and download
  const blob = await Packer.toBlob(doc);
  saveAs(blob, `Merlin_BESS_Proposal_${data.quoteNumber}.docx`);
}

/**
 * Export quote as professional PDF proposal — Supabase Design System
 * Dark theme with emerald #3ECF8E accents, real Merlin icon, clean modern typography
 */
export async function exportQuoteAsPDF(data: QuoteExportData): Promise<void> {
  // Compute derived values
  const storageMWh = data.storageSizeMWh || data.storageSizeMW * data.durationHours;
  const annualSavings = data.financialAnalysis?.annualSavingsUSD ?? 0;
  const paybackYears = data.financialAnalysis?.paybackYears ?? 0;
  const roi10Year = annualSavings > 0 && data.systemCost > 0
    ? (((annualSavings * 10) - data.systemCost) / data.systemCost * 100)
    : 0;

  // Format helpers
  const fmtCurrency = (v: number) => {
    if (!v || !Number.isFinite(v)) return "$0";
    return "$" + v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };
  const fmtCurrencyShort = (v: number) => {
    if (!v || !Number.isFinite(v)) return "$0";
    return "$" + v.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>BESS Proposal - ${data.projectName}</title>
      <style>
        @page { size: letter; margin: 0.6in 0.75in; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif;
          font-size: 10.5pt;
          color: #ededed;
          line-height: 1.55;
          background: #0D0D0D;
        }

        /* ── HEADER ─────────────────────────────────────── */
        .proposal-header {
          background: #171717;
          border-bottom: 2px solid #3ECF8E;
          padding: 28px 32px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin: -0.6in -0.75in 0 -0.75in;
          width: calc(100% + 1.5in);
        }
        .proposal-header .left h1 {
          font-size: 20pt;
          font-weight: 700;
          letter-spacing: 0.3px;
          margin-bottom: 8px;
          line-height: 1.2;
          color: #ffffff;
        }
        .proposal-header .left .subtitle {
          font-size: 10pt;
          color: #8B8B8B;
          font-weight: 400;
        }
        .proposal-header .left .truequote-line {
          font-size: 9pt;
          color: #3ECF8E;
          margin-top: 6px;
          font-weight: 600;
          letter-spacing: 0.5px;
        }
        .proposal-header .right {
          text-align: right;
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .proposal-header .right .merlin-icon {
          width: 56px;
          height: 56px;
          border-radius: 12px;
          border: 2px solid #3ECF8E;
        }
        .proposal-header .right .brand-text {
          text-align: right;
        }
        .proposal-header .right .brand-name {
          font-size: 16pt;
          font-weight: 700;
          letter-spacing: 1px;
          color: #ffffff;
        }
        .proposal-header .right .brand-tagline {
          font-size: 8.5pt;
          color: #8B8B8B;
          margin-top: 2px;
        }

        /* ── ACCENT BAR ──────────────────────────────────── */
        .accent-bar {
          height: 3px;
          background: linear-gradient(90deg, #3ECF8E, #2BA86E, #1A7A4E);
          margin: 0 -0.75in;
          width: calc(100% + 1.5in);
        }

        /* ── SECTION HEADERS ────────────────────────────── */
        .section-heading {
          font-size: 12pt;
          font-weight: 700;
          color: #3ECF8E;
          padding: 8px 0;
          border-bottom: 1px solid #2a2a2a;
          margin: 28px 0 14px 0;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }

        /* ── INFO TABLE ─────────────────────────────────── */
        .info-table {
          width: 100%;
          border-collapse: collapse;
          margin: 12px 0 24px 0;
        }
        .info-table td {
          padding: 8px 14px;
          border: 1px solid #2a2a2a;
          font-size: 10pt;
        }
        .info-table .label-cell {
          font-weight: 600;
          background: #1a1a1a;
          width: 35%;
          color: #8B8B8B;
        }
        .info-table .value-cell {
          color: #ededed;
          background: #111111;
        }

        /* ── KEY METRICS TABLE ──────────────────────────── */
        .metrics-table {
          width: 100%;
          border-collapse: collapse;
          margin: 12px 0 24px 0;
        }
        .metrics-table thead th {
          background: #3ECF8E;
          color: #0D0D0D;
          font-weight: 700;
          font-size: 10pt;
          padding: 9px 14px;
          text-align: left;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .metrics-table tbody td {
          padding: 8px 14px;
          border: 1px solid #2a2a2a;
          font-size: 10pt;
          background: #111111;
        }
        .metrics-table tbody tr:nth-child(even) td {
          background: #171717;
        }
        .metrics-table .metric-label {
          font-weight: 600;
          color: #8B8B8B;
        }
        .metrics-table .metric-value {
          font-weight: 600;
          color: #ededed;
        }
        .metrics-table .metric-value.highlight {
          color: #3ECF8E;
          font-weight: 700;
        }

        /* ── OVERVIEW SECTION ───────────────────────────── */
        .overview-text {
          font-size: 10pt;
          color: #8B8B8B;
          margin: 12px 0 20px 0;
          line-height: 1.65;
        }
        .site-layout {
          display: flex;
          gap: 20px;
          margin: 16px 0;
        }
        .site-layout .placeholder-box {
          flex: 1;
          border: 1px dashed #3ECF8E40;
          border-radius: 8px;
          padding: 36px 16px;
          text-align: center;
          color: #555;
          font-size: 9pt;
          background: #171717;
        }
        .site-layout .placeholder-box .icon {
          font-size: 22pt;
          display: block;
          margin-bottom: 8px;
        }
        .site-layout .placeholder-box .box-title {
          font-weight: 700;
          font-size: 9pt;
          color: #3ECF8E;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }

        /* ── LOAD BREAKDOWN ─────────────────────────────── */
        .load-table {
          width: 100%;
          border-collapse: collapse;
          margin: 12px 0 24px 0;
        }
        .load-table thead th {
          background: #1a1a1a;
          color: #3ECF8E;
          font-weight: 700;
          font-size: 9pt;
          padding: 8px 14px;
          text-align: left;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 2px solid #3ECF8E;
        }
        .load-table tbody td {
          padding: 7px 14px;
          border: 1px solid #2a2a2a;
          font-size: 9.5pt;
          background: #111111;
          color: #ededed;
        }
        .load-table tbody tr:nth-child(even) td {
          background: #171717;
        }

        /* ── FINANCIAL DETAILS TABLE ────────────────────── */
        .financial-table {
          width: 100%;
          border-collapse: collapse;
          margin: 12px 0 24px 0;
        }
        .financial-table td {
          padding: 8px 14px;
          border: 1px solid #2a2a2a;
          font-size: 10pt;
        }
        .financial-table .label-cell {
          font-weight: 600;
          background: #1a1a1a;
          width: 50%;
          color: #8B8B8B;
        }
        .financial-table .value-cell {
          font-weight: 600;
          color: #ededed;
          background: #111111;
        }
        .financial-table .value-cell.green {
          color: #3ECF8E;
        }

        /* ── CONFIDENCE BADGE ───────────────────────────── */
        .confidence-badge {
          display: inline-block;
          padding: 3px 10px;
          border-radius: 999px;
          font-size: 9pt;
          font-weight: 700;
          letter-spacing: 0.3px;
        }
        .confidence-badge.high {
          background: #3ECF8E20;
          color: #3ECF8E;
          border: 1px solid #3ECF8E40;
        }
        .confidence-badge.medium {
          background: #F59E0B20;
          color: #F59E0B;
          border: 1px solid #F59E0B40;
        }
        .confidence-badge.low {
          background: #EF444420;
          color: #EF4444;
          border: 1px solid #EF444440;
        }

        /* ── FOOTER ─────────────────────────────────────── */
        .proposal-footer {
          margin-top: 36px;
          padding-top: 16px;
          border-top: 1px solid #2a2a2a;
          font-size: 8.5pt;
          color: #555;
          line-height: 1.7;
        }
        .proposal-footer p {
          margin: 3px 0;
        }
        .proposal-footer strong {
          color: #8B8B8B;
        }
        .proposal-footer .disclaimer {
          font-style: italic;
          margin-top: 12px;
          font-size: 8pt;
          color: #444;
          padding: 10px 12px;
          background: #171717;
          border-radius: 6px;
          border-left: 3px solid #3ECF8E40;
        }

        @media print {
          body { margin: 0; background: #0D0D0D; }
          .proposal-header,
          .metrics-table thead th,
          .load-table thead th,
          .info-table .label-cell,
          .financial-table .label-cell,
          .metrics-table tbody td,
          .load-table tbody td,
          .financial-table td,
          .info-table td,
          .proposal-footer .disclaimer,
          .site-layout .placeholder-box {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      </style>
    </head>
    <body>

      <!-- ═══ HEADER ═══ -->
      <div class="proposal-header">
        <div class="left">
          <h1>BATTERY ENERGY STORAGE<br>SYSTEM PROPOSAL</h1>
          <div class="subtitle">Professional Energy Storage Solution</div>
          <div class="truequote-line">TrueQuote™ Verified &bull; Source-Backed Pricing</div>
        </div>
        <div class="right">
          <div class="brand-text">
            <div class="brand-name">MERLIN</div>
            <div class="brand-tagline">Energy Solutions</div>
          </div>
          <img class="merlin-icon" src="${MERLIN_ICON_BASE64}" alt="Merlin" />
        </div>
      </div>
      <div class="accent-bar"></div>

      <!-- ═══ PROJECT INFORMATION ═══ -->
      <div class="section-heading">PROJECT INFORMATION</div>
      <table class="info-table">
        <tr>
          <td class="label-cell">Client Name</td>
          <td class="value-cell">${data.projectName?.replace(/—.*/, "").trim() || "Custom Configuration"}</td>
        </tr>
        <tr>
          <td class="label-cell">Project Name</td>
          <td class="value-cell">${data.storageSizeMW.toFixed(0)} MW / ${data.durationHours}hr BESS System</td>
        </tr>
        <tr>
          <td class="label-cell">Quote Date</td>
          <td class="value-cell">${data.quoteDate}</td>
        </tr>
        <tr>
          <td class="label-cell">Location</td>
          <td class="value-cell">${data.location}</td>
        </tr>
      </table>

      <!-- ═══ 1. EXECUTIVE SUMMARY ═══ -->
      <div class="section-heading">1. EXECUTIVE SUMMARY</div>
      <p class="overview-text">
        This proposal provides a comprehensive Battery Energy Storage System (BESS) solution designed to meet your
        specific energy requirements and deliver exceptional return on investment.
      </p>
      <table class="metrics-table">
        <thead>
          <tr>
            <th>KEY METRIC</th>
            <th>VALUE</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="metric-label">System Capacity</td>
            <td class="metric-value">${storageMWh.toFixed(1)} MWh</td>
          </tr>
          <tr>
            <td class="metric-label">Power Rating</td>
            <td class="metric-value">${data.storageSizeMW.toFixed(0)} MW</td>
          </tr>
          <tr>
            <td class="metric-label">Total Investment</td>
            <td class="metric-value">${fmtCurrency(data.systemCost)}</td>
          </tr>
          <tr>
            <td class="metric-label">Annual Energy Savings</td>
            <td class="metric-value highlight">${fmtCurrencyShort(annualSavings)}/year</td>
          </tr>
          <tr>
            <td class="metric-label">Simple Payback Period</td>
            <td class="metric-value">${paybackYears > 0 ? paybackYears.toFixed(2) + " years" : "—"}</td>
          </tr>
          <tr>
            <td class="metric-label">10-Year ROI</td>
            <td class="metric-value ${roi10Year > 0 ? "highlight" : ""}">${roi10Year !== 0 ? roi10Year.toFixed(1) + "%" : "—"}</td>
          </tr>
          <tr>
            <td class="metric-label">System Warranty</td>
            <td class="metric-value">${data.warrantyYears} Years</td>
          </tr>
        </tbody>
      </table>

      <!-- ═══ 2. PROJECT OVERVIEW & VISUALIZATION ═══ -->
      <div class="section-heading">2. PROJECT OVERVIEW &amp; VISUALIZATION</div>
      <p class="overview-text">
        The proposed system integrates with your existing infrastructure to provide energy storage, peak shaving, and
        grid stabilization for your <strong style="color:#ededed">${data.useCase}</strong> application.
      </p>
      <p class="overview-text" style="margin-bottom: 8px;"><strong style="color:#ededed">Project Site Layout &amp; Configuration:</strong></p>
      <div class="site-layout">
        <div class="placeholder-box">
          <span class="icon">📷</span>
          <div class="box-title">PROJECT SITE PHOTO</div>
          <em>[Insert aerial or ground-level photo of installation site]</em>
        </div>
        <div class="placeholder-box">
          <span class="icon">🔧</span>
          <div class="box-title">SYSTEM DIAGRAM</div>
          <em>[Insert technical diagram showing BESS configuration and connections]</em>
        </div>
      </div>

      ${
        data.trueQuoteValidation?.kWContributors
          ? `
      <!-- ═══ 3. LOAD BREAKDOWN — TRUEQUOTE™ ═══ -->
      <div class="section-heading">3. LOAD BREAKDOWN — TrueQuote™ Verified</div>
      <table class="load-table">
        <thead>
          <tr>
            <th>Component</th>
            <th>Load (kW)</th>
            <th>Share</th>
          </tr>
        </thead>
        <tbody>
          ${Object.entries(data.trueQuoteValidation.kWContributors)
            .filter(([, kw]) => kw > 0)
            .sort(([, a], [, b]) => b - a)
            .map(([key, kw]) => {
              const share = data.trueQuoteValidation?.kWContributorShares?.[key];
              const label = key
                .replace(/([A-Z])/g, " $1")
                .replace(/^./, (s: string) => s.toUpperCase());
              return `<tr>
                <td style="font-weight:600">${label}</td>
                <td>${Math.round(kw).toLocaleString()} kW</td>
                <td>${share != null ? (share * 100).toFixed(0) + "%" : "—"}</td>
              </tr>`;
            })
            .join("\n          ")}
          ${data.trueQuoteValidation.dutyCycle != null ? `<tr style="border-top: 2px solid #3ECF8E;"><td style="font-weight:700;color:#3ECF8E" colspan="2">Duty Cycle</td><td style="font-weight:700;color:#3ECF8E">${(data.trueQuoteValidation.dutyCycle * 100).toFixed(0)}%</td></tr>` : ""}
        </tbody>
      </table>
      `
          : ""
      }

      ${
        data.financialAnalysis
          ? `
      <!-- ═══ ${data.trueQuoteValidation?.kWContributors ? "4" : "3"}. FINANCIAL ANALYSIS ═══ -->
      <div class="section-heading">${data.trueQuoteValidation?.kWContributors ? "4" : "3"}. FINANCIAL ANALYSIS</div>
      <table class="financial-table">
        <tr>
          <td class="label-cell">Total Investment</td>
          <td class="value-cell">${fmtCurrency(data.systemCost)}</td>
        </tr>
        <tr>
          <td class="label-cell">Annual Energy Savings</td>
          <td class="value-cell green">${fmtCurrencyShort(annualSavings)}/year</td>
        </tr>
        <tr>
          <td class="label-cell">Simple Payback</td>
          <td class="value-cell">${paybackYears > 0 ? paybackYears.toFixed(1) + " years" : "—"}</td>
        </tr>
        ${data.financialAnalysis.npv != null ? `<tr><td class="label-cell">NPV (25 yr)</td><td class="value-cell green">${fmtCurrencyShort(data.financialAnalysis.npv)}</td></tr>` : ""}
        ${data.financialAnalysis.irr != null ? `<tr><td class="label-cell">IRR</td><td class="value-cell">${(data.financialAnalysis.irr * 100).toFixed(1)}%</td></tr>` : ""}
        ${data.financialAnalysis.demandChargeSavings != null ? `<tr><td class="label-cell">Demand Charge Savings</td><td class="value-cell green">${fmtCurrencyShort(data.financialAnalysis.demandChargeSavings)}/year</td></tr>` : ""}
      </table>
      `
          : ""
      }

      ${
        data.trueQuoteConfidence
          ? `
      <!-- ═══ TRUEQUOTE™ CONFIDENCE ═══ -->
      <div class="section-heading">${data.trueQuoteValidation?.kWContributors ? (data.financialAnalysis ? "5" : "4") : (data.financialAnalysis ? "4" : "3")}. TrueQuote™ CONFIDENCE</div>
      <table class="info-table">
        <tr>
          <td class="label-cell">Overall Confidence</td>
          <td class="value-cell">
            <span class="confidence-badge ${data.trueQuoteConfidence.overall}">
              ${data.trueQuoteConfidence.overall === "high" ? "✓ HIGH" : data.trueQuoteConfidence.overall === "medium" ? "◐ MEDIUM" : "○ LOW"}
            </span>
          </td>
        </tr>
        <tr>
          <td class="label-cell">Profile Completeness</td>
          <td class="value-cell">${data.trueQuoteConfidence.profileCompleteness}% — ${data.trueQuoteConfidence.userInputs} user inputs, ${data.trueQuoteConfidence.defaultsUsed} defaults</td>
        </tr>
        <tr>
          <td class="label-cell">Industry Model</td>
          <td class="value-cell">${data.trueQuoteConfidence.industry === "v1" ? "Industry-Specific (TrueQuote™)" : "General Facility Estimate"}</td>
        </tr>
        ${data.pricingSnapshotId ? `<tr><td class="label-cell">Pricing Snapshot</td><td class="value-cell" style="font-family:'SF Mono',monospace; color:#555; font-size:9pt;">#${data.pricingSnapshotId.slice(0, 12)}</td></tr>` : ""}
      </table>
      ${
        data.trueQuoteValidation?.assumptions?.length
          ? `
          <div style="margin-top: 14px;">
            <strong style="font-size: 10pt; color: #3ECF8E;">Methodology &amp; Sources</strong>
            ${data.trueQuoteValidation.assumptions.map((a: string) => `<div style="font-size: 9pt; color: #8B8B8B; margin: 5px 0 5px 14px; padding-left: 8px; border-left: 2px solid #3ECF8E30;">• ${a}</div>`).join("\n")}
          </div>
        `
          : ""
      }
      `
          : ""
      }

      <!-- ═══ FOOTER ═══ -->
      <div class="proposal-footer">
        <p>• This quote is valid for <strong>30 days</strong> from the date of issue.</p>
        <p>• Payment Terms: 50% deposit upon contract signing, 50% upon commissioning.</p>
        <p>• Warranty: <strong>${data.warrantyYears} year</strong> comprehensive warranty included.</p>
        <p>• All equipment pricing reflects current market conditions (NREL ATB 2024, IRA 2022).</p>
        <div class="disclaimer">
          This proposal was generated by Merlin Energy Solutions using TrueQuote™ methodology.
          All numbers are sourced from NREL, EIA, IEEE, and other authoritative industry standards.
          Final pricing may vary based on site assessment, permitting, and interconnection requirements.
        </div>
      </div>

    </body>
    </html>
  `;

  // Create a new window and print to PDF
  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();

    // Wait for content to load, then print
    setTimeout(() => {
      printWindow.print();
      // Note: User will need to "Save as PDF" in print dialog
    }, 500);
  } else {
    alert("Please allow popups to download PDF");
  }
}

/**
 * Export quote as Excel spreadsheet (.xlsx) with watermark
 * Note: We'll use a simple CSV approach since exceljs isn't installed yet
 */
export async function exportQuoteAsExcel(data: QuoteExportData): Promise<void> {
  const watermarkText = getWatermarkText();

  // Create CSV content with watermark in header
  const csvContent = `
⚡ MERLIN Energy - BESS Quote Summary
${watermarkText}
Quote #,${data.quoteNumber}
Date,${data.quoteDate}

PROJECT INFORMATION
Project Name,${data.projectName}
Location,${data.location}
Application,${data.applicationType}
Use Case,${data.useCase}

SYSTEM SPECIFICATIONS
Parameter,Value,Unit
Power Rating,${data.storageSizeMW.toFixed(1)},MW
Energy Capacity,${data.storageSizeMWh.toFixed(1)},MWh
Duration,${data.durationHours.toFixed(1)},hours
Battery Chemistry,${data.chemistry.toUpperCase()},-
Round-Trip Efficiency,${data.roundTripEfficiency},%
Installation Type,${data.installationType},-
Grid Connection,${data.gridConnection.toUpperCase()},-

ELECTRICAL SPECIFICATIONS
System Voltage (AC),${data.systemVoltage},V
DC Voltage,${data.dcVoltage},V
Number of Inverters,${data.numberOfInverters},units
Inverter Rating (each),${data.inverterRating},kW
Inverter Efficiency,${data.inverterEfficiency},%
Inverter Type,${data.inverterType},-
Switchgear Type,${data.switchgearType},-
Switchgear Rating,${data.switchgearRating},A
BMS Type,${data.bmsType},-

FINANCIAL SUMMARY
Total System Cost,$${(data.systemCost / 1000000).toFixed(2)}M,USD
Cost per kW,$${(data.systemCost / (data.storageSizeMW * 1000)).toFixed(0)},$/kW
Cost per kWh,$${(data.systemCost / (data.storageSizeMWh * 1000)).toFixed(0)},$/kWh
Warranty Period,${data.warrantyYears},years
${
  data.loadProfile
    ? `
LOAD PROFILE
Base Load,${Math.round(data.loadProfile.baseLoadKW)},kW
Peak Load,${Math.round(data.loadProfile.peakLoadKW)},kW
Daily Energy,${Math.round(data.loadProfile.energyKWhPerDay)},kWh/day`
    : ""
}
${
  data.financialAnalysis
    ? `
FINANCIAL ANALYSIS
Annual Savings,$${Math.round(data.financialAnalysis.annualSavingsUSD)},USD/yr
Simple Payback,${data.financialAnalysis.paybackYears.toFixed(1)},years${data.financialAnalysis.npv != null ? `\nNPV (25 yr),$${Math.round(data.financialAnalysis.npv)},USD` : ""}${data.financialAnalysis.irr != null ? `\nIRR,${(data.financialAnalysis.irr * 100).toFixed(1)},%` : ""}${data.financialAnalysis.demandChargeSavings != null ? `\nDemand Charge Savings,$${Math.round(data.financialAnalysis.demandChargeSavings)},USD/yr` : ""}`
    : ""
}
${
  data.trueQuoteValidation?.kWContributors
    ? `
LOAD BREAKDOWN (TrueQuote Verified)
Component,Load,Unit${Object.entries(data.trueQuoteValidation.kWContributors)
        .filter(([, kw]) => kw > 0)
        .sort(([, a], [, b]) => b - a)
        .map(
          ([key, kw]) =>
            `\n${key.replace(/([A-Z])/g, " $1").replace(/^./, (s: string) => s.toUpperCase())},${Math.round(kw)},kW`
        )
        .join(
          ""
        )}${data.trueQuoteValidation.dutyCycle != null ? `\nDuty Cycle,${(data.trueQuoteValidation.dutyCycle * 100).toFixed(0)},%` : ""}`
    : ""
}
${
  data.trueQuoteConfidence
    ? `
TRUEQUOTE CONFIDENCE
Overall,${data.trueQuoteConfidence.overall === "high" ? "High" : data.trueQuoteConfidence.overall === "medium" ? "Medium" : "Low"},-
Profile Completeness,${data.trueQuoteConfidence.profileCompleteness},%
User Inputs,${data.trueQuoteConfidence.userInputs},fields
Defaults Used,${data.trueQuoteConfidence.defaultsUsed},fields
Industry Model,${data.trueQuoteConfidence.industry === "v1" ? "Industry-Specific" : "General Estimate"},-${data.pricingSnapshotId ? `\nPricing Snapshot,${data.pricingSnapshotId.slice(0, 12)},-` : ""}`
    : ""
}

Quote Valid: 30 days from issue date
Payment Terms: 50% deposit upon contract signing, 50% upon commissioning
`.trim();

  // Create blob and download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  saveAs(blob, `Merlin_BESS_Quote_${data.quoteNumber}.csv`);
}

// Re-export Packer for Word document generation
import { Packer } from "docx";
export { Packer };
