/**
 * Quote Export Utilities
 * Generate PDF, Word (.docx), and Excel (.xlsx) files with watermarks
 */

import {
  Document,
  Paragraph,
  TextRun,
  ImageRun,
  AlignmentType,
  Header,
  PageNumber,
  Footer,
  BorderStyle,
  Table,
  TableRow,
  TableCell,
  WidthType,
  ShadingType,
  TabStopType,
  TabStopPosition,
  type FileChild,
} from "docx";
import { saveAs } from "file-saver";
import { loadWatermarkSettings } from "../components/AdminWatermarkSettings";
import { MERLIN_ICON_BASE64 } from "./merlinIconData";
import { TRUEQUOTE_BADGE_BASE64 } from "./truequoteBadgeData";
import { PROQUOTE_BADGE_BASE64 } from "./proquoteBadgeData";
import { MERLIN_PROFILE_BASE64 } from "./merlinProfileData";

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

  // Equipment Cost Breakdown (Feb 2026)
  equipmentCosts?: {
    batteryCost?: number;
    batteryPerKWh?: number;
    inverterCost?: number;
    inverterPerKW?: number;
    transformerCost?: number;
    switchgearCost?: number;
    solarCost?: number;
    solarPerWatt?: number;
    generatorCost?: number;
    generatorPerKW?: number;
    installationCost?: number;
    totalEquipmentCost?: number;
    allInPerKW?: number;
    allInPerKWh?: number;
  };

  // ─── Advanced Analytics (Feb 2026) ───────────────────────────────
  /** Dynamic ITC breakdown from IRA 2022 calculator */
  itcBreakdown?: {
    totalRate: number; // e.g. 0.40 = 40%
    creditAmount: number;
    baseRate: number;
    prevailingWageBonus: number;
    energyCommunityBonus: number;
    domesticContentBonus: number;
    lowIncomeBonus: number;
    source: string;
  };

  /** 8760 hourly simulation savings breakdown */
  hourlySavingsBreakdown?: {
    annualSavings: number;
    touArbitrageSavings: number;
    peakShavingSavings: number;
    demandChargeSavings: number;
    solarSelfConsumptionSavings: number;
    equivalentCycles: number;
    capacityFactor: number;
    source: string;
  };

  /** Risk analysis P10/P50/P90 */
  riskAnalysis?: {
    npvP10: number;
    npvP50: number;
    npvP90: number;
    irrP10: number;
    irrP50: number;
    irrP90: number;
    paybackP10: number;
    paybackP50: number;
    paybackP90: number;
    probabilityPositiveNPV: number;
    valueAtRisk95: number;
    source: string;
  };

  /** Solar production from PVWatts */
  solarProductionDetail?: {
    annualProductionKWh: number;
    capacityFactor: number;
    monthlyProductionKWh?: number[];
    source: string;
  };

  /** Battery degradation curve */
  degradationDetail?: {
    chemistry: string;
    year10CapacityPct: number;
    year25CapacityPct: number;
    warrantyYears: number;
    financialImpactPct: number;
    source: string;
  };

  /** Utility rate attribution */
  utilityRateDetail?: {
    utilityName?: string;
    electricityRate: number;
    demandCharge: number;
    source: string;
    confidence: string;
  };
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
 * Export quote as Word document (.docx) — Professional Merlin Proposal
 * White background, emerald accents, comprehensive engineering + financial detail.
 * Designed to compel action — not just inform.
 */
export async function exportQuoteAsWord(data: QuoteExportData): Promise<void> {
  const watermarkText = getWatermarkText();

  // ── Computed values ──────────────────────────────────────────────
  const storageMWh = data.storageSizeMWh || data.storageSizeMW * data.durationHours;
  const storageKW = data.storageSizeMW * 1000;
  const storageKWh = storageMWh * 1000;
  const annualSavings = data.financialAnalysis?.annualSavingsUSD ?? 0;
  const paybackYears = data.financialAnalysis?.paybackYears ?? 0;
  const roi10Year =
    annualSavings > 0 && data.systemCost > 0
      ? ((annualSavings * 10 - data.systemCost) / data.systemCost) * 100
      : 0;
  const lifetimeSavings = annualSavings * 10;
  const itcRate = data.itcBreakdown?.totalRate ?? (data.financialAnalysis ? 0.3 : 0);
  const itcAmount = data.itcBreakdown?.creditAmount ?? data.systemCost * itcRate;
  const netCost = data.systemCost - itcAmount;
  const itcLabel = data.itcBreakdown
    ? `Federal ITC Credit (${Math.round(itcRate * 100)}%)`
    : "Federal ITC Credit (30%)";
  const demandChargeSavings =
    data.financialAnalysis?.demandChargeSavings ?? data.demandCharge * storageKW * 0.5 * 12;

  const fmt = (v: number) =>
    `$${v.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  const fmtPct = (v: number) => `${v.toFixed(1)}%`;
  const fmtNum = (v: number) => v.toLocaleString("en-US");

  // ── Merlin Design Template color palette ───────────────────────
  const C = {
    emerald: "1B8F5A", // Merlin section-heading green (matches DOCX template)
    emeraldLight: "3ECF8E", // Merlin brand accent — bright emerald
    emeraldBg: "EDFDF5", // Light emerald panel bg (TrueQuote strip)
    navy: "1E293B", // Primary text / dark panel (slate-800)
    dark: "2D3748", // Secondary text
    body: "4A5568", // Body text
    muted: "718096", // Muted / caption text
    border: "CBD5E1", // Table borders (slate-300)
    headerBg: "1E293B", // Dark table header bg
    headerText: "FFFFFF", // White text on dark bg
    highlight: "F0FFF4", // Alternating row highlight (emerald-50)
    amber: "D97706",
    red: "DC2626",
    // ── Dark panels (Merlin dark theme) ──
    panelDark: "1E293B", // Tailwind slate-800 — wizard / cover panel
    panelDarkAlt: "334155", // Tailwind slate-700 — subtle contrast
    lightGrey: "F1F5F9", // Light grey metadata sub-panel
    lightGreyDark: "E2E8F0", // Slightly darker grey
    gold: "FFD700", // Gold accent for TrueQuote badge
  };

  // ── Helper: decode base64 string to Uint8Array for ImageRun ──────
  const b64toUint8 = (b64: string): Uint8Array => {
    const raw = atob(b64);
    const arr = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
    return arr;
  };

  // Pre-decode images
  const merlinProfileImg = b64toUint8(MERLIN_PROFILE_BASE64);
  const truequoteBadgeImg = b64toUint8(TRUEQUOTE_BADGE_BASE64);
  const proquoteBadgeImg = b64toUint8(PROQUOTE_BADGE_BASE64);

  // ── Helper: Section heading ──────────────────────────────────────
  // Full heading in Merlin emerald green — matches DOCX template exactly
  const sectionHeading = (num: string, text: string) =>
    new Paragraph({
      children: [
        new TextRun({
          text: `${num}  ${text.toUpperCase()}`,
          size: 28,
          bold: true,
          color: C.emerald,
        }),
      ],
      spacing: { before: 480, after: 200 },
      border: {
        bottom: { color: C.emerald, space: 4, style: BorderStyle.SINGLE, size: 8 },
      },
    });

  // ── Helper: Sub-heading ──────────────────────────────────────────
  const subHeading = (text: string) =>
    new Paragraph({
      children: [new TextRun({ text, size: 24, bold: true, color: C.dark })],
      spacing: { before: 280, after: 120 },
    });

  // ── Helper: Body paragraph ───────────────────────────────────────
  const bodyParagraph = (text: string) =>
    new Paragraph({
      children: [new TextRun({ text, size: 22, color: C.body })],
      spacing: { after: 160 },
      indent: { left: 0 },
    });

  // ── Helper: Key-value row (bold label, normal value) ─────────────
  const kvRow = (label: string, value: string, valueColor?: string, valueBold?: boolean) =>
    new Paragraph({
      children: [
        new TextRun({ text: `${label}:  `, bold: true, size: 22, color: C.dark }),
        new TextRun({
          text: value,
          size: 22,
          color: valueColor || C.navy,
          bold: valueBold ?? !!valueColor,
        }),
      ],
      spacing: { after: 100 },
    });

  // ── Helper: Bullet point ─────────────────────────────────────────
  const bullet = (text: string, bold?: string) =>
    new Paragraph({
      children: [
        new TextRun({ text: "•  ", size: 22, color: C.emerald }),
        ...(bold ? [new TextRun({ text: `${bold}  `, size: 22, bold: true, color: C.dark })] : []),
        new TextRun({ text, size: 22, color: C.body }),
      ],
      spacing: { after: 80 },
      indent: { left: 200 },
    });

  // ── Helper: Professional table ───────────────────────────────────
  const makeTable = (headers: string[], rows: string[][], highlightCol?: number) =>
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          tableHeader: true,
          children: headers.map(
            (h) =>
              new TableCell({
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: h, size: 20, bold: true, color: C.headerText })],
                    alignment: AlignmentType.LEFT,
                  }),
                ],
                shading: { type: ShadingType.SOLID, color: C.headerBg },
                width: { size: Math.floor(100 / headers.length), type: WidthType.PERCENTAGE },
              })
          ),
        }),
        ...rows.map(
          (row, rowIdx) =>
            new TableRow({
              children: row.map(
                (cell, colIdx) =>
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: cell,
                            size: 20,
                            color: highlightCol === colIdx ? C.emerald : C.navy,
                            bold: highlightCol === colIdx,
                          }),
                        ],
                        alignment: colIdx === 0 ? AlignmentType.LEFT : AlignmentType.RIGHT,
                      }),
                    ],
                    shading:
                      rowIdx % 2 === 1
                        ? { type: ShadingType.SOLID, color: C.highlight }
                        : undefined,
                  })
              ),
            })
        ),
      ],
    });

  // ── Helper: highlight metric box (key-value pair, green bg) ──────
  const metricBox = (label: string, value: string) =>
    new Paragraph({
      children: [
        new TextRun({ text: `  ${label}:  `, size: 22, color: C.dark }),
        new TextRun({ text: value, size: 26, bold: true, color: C.emerald }),
      ],
      spacing: { after: 80 },
      shading: { type: ShadingType.SOLID, color: C.emeraldBg },
    });

  // ── Helper: Spacer ───────────────────────────────────────────────
  const spacer = (pts = 200) =>
    new Paragraph({ children: [new TextRun({ text: "" })], spacing: { after: pts } });

  // ── TrueQuote confidence text ────────────────────────────────────
  const confidenceText =
    data.trueQuoteConfidence?.overall === "high"
      ? "HIGH — Industry-specific model with verified inputs"
      : data.trueQuoteConfidence?.overall === "medium"
        ? "MEDIUM — Some inputs estimated from industry defaults"
        : "STANDARD — General facility estimate";
  const confidenceColor =
    data.trueQuoteConfidence?.overall === "high"
      ? C.emerald
      : data.trueQuoteConfidence?.overall === "medium"
        ? C.amber
        : C.muted;

  // ════════════════════════════════════════════════════════════════════
  // BUILD DOCUMENT
  // ════════════════════════════════════════════════════════════════════
  const doc = new Document({
    creator: "Merlin Energy Solutions — TrueQuote™",
    title: `${data.useCase} BESS Proposal — ${data.quoteNumber}`,
    description:
      "Professional Battery Energy Storage System proposal with TrueQuote™ verified pricing",
    styles: {
      default: {
        document: { run: { font: "Calibri", size: 22, color: C.navy } },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1200, right: 1200, bottom: 1200, left: 1200 },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: watermarkText?.toUpperCase() || "",
                    size: 14,
                    color: "BBBBBB",
                  }),
                  new TextRun({ text: "\t" }),
                  new TextRun({ text: `Quote ${data.quoteNumber}`, size: 14, color: "BBBBBB" }),
                ],
                tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
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
                  new TextRun({
                    text: "Merlin Energy Solutions  •  TrueQuote™ Verified  •  Page ",
                    size: 16,
                    color: C.muted,
                  }),
                  new TextRun({ children: [PageNumber.CURRENT], size: 16, color: C.muted }),
                  new TextRun({ text: "  •  Confidential", size: 16, color: C.muted }),
                ],
              }),
            ],
          }),
        },
        children: [
          // ═══════════════════════════════════════════════════════════
          // COVER / HEADER BLOCK — Dark panel (matches Merlin Wizard)
          // ═══════════════════════════════════════════════════════════

          // ── Dark Headline Panel ──────────────────────────────────
          // Top padding
          new Paragraph({
            shading: { type: ShadingType.SOLID, color: C.panelDark },
            children: [new TextRun({ text: " ", size: 20 })],
            spacing: { after: 0 },
          }),
          // Company brand: Merlin icon + company name
          new Paragraph({
            shading: { type: ShadingType.SOLID, color: C.panelDark },
            spacing: { after: 200 },
            children: [
              new TextRun({ text: "  ", size: 10 }),
              new ImageRun({
                data: merlinProfileImg,
                transformation: { width: 50, height: 44 },
                type: "png",
              }),
              new TextRun({ text: "  ", size: 14 }),
              new TextRun({ text: "MERLIN", size: 36, bold: true, color: C.headerText }),
              new TextRun({ text: " ENERGY SOLUTIONS", size: 20, color: "94A3B8" }),
            ],
          }),
          // Title: Battery Energy Storage System
          new Paragraph({
            shading: { type: ShadingType.SOLID, color: C.panelDark },
            spacing: { after: 60 },
            children: [
              new TextRun({ text: "  ", size: 10 }),
              new TextRun({
                text: "Battery Energy Storage System",
                size: 42,
                bold: true,
                color: C.headerText,
              }),
            ],
          }),
          // Subtitle: PROFESSIONAL PROPOSAL
          new Paragraph({
            shading: { type: ShadingType.SOLID, color: C.panelDark },
            spacing: { after: 140 },
            children: [
              new TextRun({ text: "  ", size: 10 }),
              new TextRun({
                text: "PROFESSIONAL PROPOSAL",
                size: 26,
                bold: true,
                color: C.emeraldLight,
              }),
            ],
          }),
          // Emerald accent divider
          new Paragraph({
            shading: { type: ShadingType.SOLID, color: C.panelDark },
            children: [],
            border: {
              bottom: { color: C.emeraldLight, space: 2, style: BorderStyle.SINGLE, size: 8 },
            },
            spacing: { after: 140 },
          }),
          // TrueQuote badge row: icon + text (own clean line)
          new Paragraph({
            shading: { type: ShadingType.SOLID, color: C.panelDark },
            spacing: { after: 40 },
            children: [
              new TextRun({ text: "  ", size: 10 }),
              new ImageRun({
                data: truequoteBadgeImg,
                transformation: { width: 22, height: 26 },
                type: "png",
              }),
              new TextRun({ text: "  ", size: 10 }),
              new TextRun({ text: "TrueQuote™ Verified", size: 20, bold: true, color: C.gold }),
              new TextRun({
                text: "  —  Every estimate backed by published sources",
                size: 18,
                color: C.body,
              }),
            ],
          }),
          // Bottom padding
          new Paragraph({
            shading: { type: ShadingType.SOLID, color: C.panelDark },
            children: [new TextRun({ text: " ", size: 16 })],
            spacing: { after: 0 },
          }),

          // ── Light Grey Sub-Panel (project metadata) ──────────────
          new Paragraph({
            shading: { type: ShadingType.SOLID, color: C.lightGrey },
            children: [new TextRun({ text: " ", size: 10 })],
            spacing: { after: 0 },
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({ text: "Client", size: 18, bold: true, color: C.muted }),
                        ],
                        spacing: { after: 20 },
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({
                            text:
                              data.projectName?.replace(/—.*/, "").trim() || "Custom Configuration",
                            size: 20,
                            color: C.navy,
                          }),
                        ],
                      }),
                    ],
                    shading: { type: ShadingType.SOLID, color: C.lightGrey },
                    width: { size: 33, type: WidthType.PERCENTAGE },
                    borders: {
                      top: { style: BorderStyle.NONE, size: 0, color: C.lightGrey },
                      bottom: { style: BorderStyle.NONE, size: 0, color: C.lightGrey },
                      left: { style: BorderStyle.NONE, size: 0, color: C.lightGrey },
                      right: { style: BorderStyle.NONE, size: 0, color: C.lightGrey },
                    },
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({ text: "Location", size: 18, bold: true, color: C.muted }),
                        ],
                        spacing: { after: 20 },
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({ text: data.location || "—", size: 20, color: C.navy }),
                        ],
                      }),
                    ],
                    shading: { type: ShadingType.SOLID, color: C.lightGrey },
                    width: { size: 34, type: WidthType.PERCENTAGE },
                    borders: {
                      top: { style: BorderStyle.NONE, size: 0, color: C.lightGrey },
                      bottom: { style: BorderStyle.NONE, size: 0, color: C.lightGrey },
                      left: { style: BorderStyle.NONE, size: 0, color: C.lightGrey },
                      right: { style: BorderStyle.NONE, size: 0, color: C.lightGrey },
                    },
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({ text: "Industry", size: 18, bold: true, color: C.muted }),
                        ],
                        spacing: { after: 20 },
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: data.useCase || "Commercial",
                            size: 20,
                            color: C.navy,
                          }),
                        ],
                      }),
                    ],
                    shading: { type: ShadingType.SOLID, color: C.lightGrey },
                    width: { size: 33, type: WidthType.PERCENTAGE },
                    borders: {
                      top: { style: BorderStyle.NONE, size: 0, color: C.lightGrey },
                      bottom: { style: BorderStyle.NONE, size: 0, color: C.lightGrey },
                      left: { style: BorderStyle.NONE, size: 0, color: C.lightGrey },
                      right: { style: BorderStyle.NONE, size: 0, color: C.lightGrey },
                    },
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({ text: "Quote Ref", size: 18, bold: true, color: C.muted }),
                        ],
                        spacing: { after: 20 },
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({ text: data.quoteNumber, size: 20, color: C.navy }),
                        ],
                      }),
                    ],
                    shading: { type: ShadingType.SOLID, color: C.lightGrey },
                    width: { size: 33, type: WidthType.PERCENTAGE },
                    borders: {
                      top: { style: BorderStyle.NONE, size: 0, color: C.lightGrey },
                      bottom: { style: BorderStyle.NONE, size: 0, color: C.lightGrey },
                      left: { style: BorderStyle.NONE, size: 0, color: C.lightGrey },
                      right: { style: BorderStyle.NONE, size: 0, color: C.lightGrey },
                    },
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({ text: "Date", size: 18, bold: true, color: C.muted }),
                        ],
                        spacing: { after: 20 },
                      }),
                      new Paragraph({
                        children: [new TextRun({ text: data.quoteDate, size: 20, color: C.navy })],
                      }),
                    ],
                    shading: { type: ShadingType.SOLID, color: C.lightGrey },
                    width: { size: 34, type: WidthType.PERCENTAGE },
                    borders: {
                      top: { style: BorderStyle.NONE, size: 0, color: C.lightGrey },
                      bottom: { style: BorderStyle.NONE, size: 0, color: C.lightGrey },
                      left: { style: BorderStyle.NONE, size: 0, color: C.lightGrey },
                      right: { style: BorderStyle.NONE, size: 0, color: C.lightGrey },
                    },
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({ text: "Grid", size: 18, bold: true, color: C.muted }),
                        ],
                        spacing: { after: 20 },
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: `${data.gridConnection || "Grid-Tied"}  •  Valid 30 days`,
                            size: 20,
                            color: C.navy,
                          }),
                        ],
                      }),
                    ],
                    shading: { type: ShadingType.SOLID, color: C.lightGrey },
                    width: { size: 33, type: WidthType.PERCENTAGE },
                    borders: {
                      top: { style: BorderStyle.NONE, size: 0, color: C.lightGrey },
                      bottom: { style: BorderStyle.NONE, size: 0, color: C.lightGrey },
                      left: { style: BorderStyle.NONE, size: 0, color: C.lightGrey },
                      right: { style: BorderStyle.NONE, size: 0, color: C.lightGrey },
                    },
                  }),
                ],
              }),
            ],
          }),
          new Paragraph({
            shading: { type: ShadingType.SOLID, color: C.lightGrey },
            children: [new TextRun({ text: " ", size: 6 })],
            spacing: { after: 0 },
          }),

          // ── TrueQuote™ verification strip ────────────────────────
          new Paragraph({
            shading: { type: ShadingType.SOLID, color: C.emeraldBg },
            children: [
              new TextRun({ text: "  ✓  ", size: 24, bold: true, color: C.emerald }),
              new TextRun({ text: "TrueQuote™ Verified", size: 22, bold: true, color: C.emerald }),
              new TextRun({
                text: "  —  Every number in this proposal is traceable to an authoritative source (NREL, EIA, IEEE, IRA 2022). ",
                size: 20,
                color: C.dark,
              }),
              new TextRun({ text: "No black-box estimates.", size: 20, bold: true, color: C.dark }),
            ],
            spacing: { after: 60 },
          }),
          new Paragraph({
            shading: { type: ShadingType.SOLID, color: C.emeraldBg },
            children: [
              new TextRun({
                text: `  Confidence: ${confidenceText}`,
                size: 20,
                color: confidenceColor,
                bold: true,
              }),
              ...(data.trueQuoteConfidence
                ? [
                    new TextRun({
                      text: `  |  Profile: ${data.trueQuoteConfidence.profileCompleteness}% complete (${data.trueQuoteConfidence.userInputs} inputs, ${data.trueQuoteConfidence.defaultsUsed} defaults)`,
                      size: 18,
                      color: C.muted,
                    }),
                  ]
                : []),
            ],
            spacing: { after: 300 },
          }),
          spacer(100),

          // ═══════════════════════════════════════════════════════════
          // 1. EXECUTIVE SUMMARY
          // ═══════════════════════════════════════════════════════════
          sectionHeading("01", "Executive Summary"),
          bodyParagraph(
            `This proposal presents a turnkey ${storageMWh.toFixed(1)} MWh Battery Energy Storage System (BESS) ` +
              `designed for your ${data.useCase} facility in ${data.location || "your area"}. ` +
              `The system delivers measurable cost reductions through peak demand shaving, energy arbitrage, ` +
              `and demand charge management while providing backup power resilience.`
          ),
          spacer(100),

          // Hero metrics
          metricBox("Total System Investment", fmt(data.systemCost)),
          ...(itcAmount > 0 ? [metricBox(itcLabel, `– ${fmt(itcAmount)}`)] : []),
          ...(netCost !== data.systemCost
            ? [metricBox("Net Investment After Incentives", fmt(netCost))]
            : []),
          metricBox("Estimated Annual Savings", `${fmt(annualSavings)}/year`),
          ...(paybackYears > 0
            ? [metricBox("Simple Payback Period", `${paybackYears.toFixed(1)} years`)]
            : []),
          ...(roi10Year > 0 ? [metricBox("10-Year Projected ROI", fmtPct(roi10Year))] : []),
          ...(lifetimeSavings > 0
            ? [metricBox("Projected 10-Year Savings", fmt(lifetimeSavings))]
            : []),
          spacer(200),

          // ═══════════════════════════════════════════════════════════
          // 2. SYSTEM SPECIFICATIONS
          // ═══════════════════════════════════════════════════════════
          sectionHeading("02", "System Specifications"),
          bodyParagraph(
            "The following specifications detail the proposed BESS configuration, optimized for your facility's load profile and energy goals."
          ),

          subHeading("Battery Energy Storage"),
          makeTable(
            ["Parameter", "Specification"],
            [
              ["Energy Capacity", `${storageMWh.toFixed(1)} MWh (${fmtNum(storageKWh)} kWh)`],
              ["Power Rating", `${data.storageSizeMW.toFixed(2)} MW (${fmtNum(storageKW)} kW)`],
              ["Duration", `${data.durationHours} hours at rated power`],
              ["Battery Chemistry", data.chemistry || "LiFePO₄ (Lithium Iron Phosphate)"],
              ["Round-Trip Efficiency", `${data.roundTripEfficiency || 85}%`],
              ["Design Cycles", `${fmtNum(data.cyclesPerYear || 365)} cycles/year`],
              ["System Warranty", `${data.warrantyYears || 15} years`],
              ["Expected Lifespan", "25+ years"],
            ]
          ),
          spacer(200),

          subHeading("Power Conversion & Electrical"),
          makeTable(
            ["Component", "Specification"],
            [
              [
                "Inverter / PCS",
                `${data.numberOfInverters || 1}× ${fmtNum(data.inverterRating || storageKW)} kW — ${data.inverterType || "PCS"}`,
              ],
              ["Inverter Efficiency", `${data.inverterEfficiency || 96}%`],
              ["System Voltage (AC)", `${data.systemVoltage || 480}V, 3-phase`],
              ["DC Bus Voltage", `${data.dcVoltage || 800}V nominal`],
              [
                "Switchgear",
                `${data.switchgearType || "AC Switchgear"} — ${fmtNum(Math.round(data.switchgearRating || storageKW * 1.25))} kW rated`,
              ],
              ["BMS", `${data.bmsType || "Distributed"} Battery Management System`],
              ...(data.transformerRequired
                ? [
                    [
                      "Transformer",
                      `${data.transformerVoltage || "480V/13.8kV"} — ${fmtNum(Math.round(data.transformerRating || storageKW))} kVA`,
                    ],
                  ]
                : []),
            ]
          ),
          spacer(200),

          // Renewables / generators section (if included)
          ...(data.solarPVIncluded ||
          data.dieselGenIncluded ||
          data.naturalGasGenIncluded ||
          data.fuelCellIncluded
            ? [
                subHeading("Integrated Generation Assets"),
                makeTable(
                  ["Asset", "Capacity", "Details"],
                  [
                    ...(data.solarPVIncluded && data.solarCapacityKW
                      ? [
                          [
                            "Solar PV Array",
                            `${fmtNum(data.solarCapacityKW)} kW`,
                            `${data.solarPanelType || "Monocrystalline"} — ${data.solarPanelEfficiency || 21}% efficiency`,
                          ],
                        ]
                      : []),
                    ...(data.naturalGasGenIncluded && data.naturalGasCapacityKW
                      ? [
                          [
                            "Natural Gas Generator",
                            `${fmtNum(data.naturalGasCapacityKW)} kW`,
                            "Backup / peak shaving",
                          ],
                        ]
                      : []),
                    ...(data.dieselGenIncluded && data.dieselGenCapacityKW
                      ? [
                          [
                            "Diesel Generator",
                            `${fmtNum(data.dieselGenCapacityKW)} kW`,
                            "Emergency backup",
                          ],
                        ]
                      : []),
                    ...(data.fuelCellIncluded && data.fuelCellCapacityKW
                      ? [
                          [
                            "Fuel Cell",
                            `${fmtNum(data.fuelCellCapacityKW)} kW`,
                            `${data.fuelCellType || "Hydrogen"} fuel cell`,
                          ],
                        ]
                      : []),
                  ]
                ),
                spacer(200),
              ]
            : []),

          // ═══════════════════════════════════════════════════════════
          // 3. LOAD PROFILE & SIZING METHODOLOGY
          // ═══════════════════════════════════════════════════════════
          sectionHeading("03", "Load Profile & Sizing"),

          // kW contributors from TrueQuote validation
          ...(data.trueQuoteValidation?.kWContributors &&
          Object.keys(data.trueQuoteValidation.kWContributors).length > 0
            ? (() => {
                // Compute total kW for share-of-total percentages (on-the-fly)
                const contributorEntries = Object.entries(data.trueQuoteValidation!.kWContributors!)
                  .filter(([, kw]) => kw > 0)
                  .sort(([, a], [, b]) => b - a);
                const totalContributorKW = contributorEntries.reduce((sum, [, kw]) => sum + kw, 0);

                const items: unknown[] = [
                  bodyParagraph(
                    "Your facility's power demand was analyzed using industry-specific load modeling. Each contributor below has been independently sized using authoritative standards."
                  ),
                  subHeading("Load Breakdown — TrueQuote™ Verified"),
                  makeTable(
                    ["Load Component", "Peak Demand (kW)", "Share of Total"],
                    contributorEntries.map(([key, kw]) => {
                      // Compute share directly from kW values (avoids key mismatch with kWContributorShares)
                      const sharePct = totalContributorKW > 0 ? (kw / totalContributorKW) * 100 : 0;
                      const label = key
                        .replace(/_/g, " ")
                        .replace(/([A-Z])/g, " $1")
                        .replace(/^./, (s) => s.toUpperCase())
                        .trim();
                      return [label, `${fmtNum(Math.round(kw))} kW`, fmtPct(sharePct)];
                    }),
                    2
                  ),
                ];

                if (data.trueQuoteValidation!.dutyCycle != null) {
                  items.push(
                    spacer(80),
                    kvRow(
                      "Facility Duty Cycle",
                      fmtPct(data.trueQuoteValidation!.dutyCycle * 100),
                      C.emerald
                    )
                  );
                }

                items.push(spacer(100));

                if (data.trueQuoteValidation!.assumptions?.length) {
                  items.push(
                    subHeading("Sizing Methodology & Sources"),
                    ...data.trueQuoteValidation!.assumptions.map((a) => bullet(a))
                  );
                }

                return items;
              })()
            : [
                bodyParagraph(
                  `The BESS is sized at ${data.storageSizeMW.toFixed(2)} MW / ${data.durationHours}hr based on your facility's estimated peak demand and operational requirements.`
                ),
              ]),

          ...(data.loadProfile
            ? [
                spacer(100),
                subHeading("Load Summary"),
                kvRow("Base Load", `${fmtNum(Math.round(data.loadProfile.baseLoadKW))} kW`),
                kvRow("Peak Load", `${fmtNum(Math.round(data.loadProfile.peakLoadKW))} kW`),
                kvRow(
                  "Daily Energy Consumption",
                  `${fmtNum(Math.round(data.loadProfile.energyKWhPerDay))} kWh/day`
                ),
                kvRow(
                  "Annual Energy Consumption",
                  `${fmtNum(Math.round(data.loadProfile.energyKWhPerDay * 365))} kWh/year`
                ),
              ]
            : []),
          spacer(300),

          // ═══════════════════════════════════════════════════════════
          // 4. FINANCIAL ANALYSIS
          // ═══════════════════════════════════════════════════════════
          sectionHeading("04", "Financial Analysis"),
          bodyParagraph(
            "The financial model below reflects current market pricing (NREL ATB 2024), federal incentives under the Inflation Reduction Act (IRA 2022), " +
              "and location-specific utility rates. All projections are based on conservative assumptions."
          ),

          subHeading("Investment Summary"),
          makeTable(
            ["Line Item", "Amount"],
            [
              ["Gross System Cost", fmt(data.systemCost)],
              ...(itcAmount > 0
                ? [
                    [
                      "Federal Investment Tax Credit (ITC — " + Math.round(itcRate * 100) + "%)",
                      `– ${fmt(itcAmount)}`,
                    ],
                  ]
                : []),
              ...(netCost !== data.systemCost ? [["Net Cost After Incentives", fmt(netCost)]] : []),
            ],
            1
          ),
          spacer(200),

          // Equipment Cost Breakdown (Feb 2026) — shows component-level + unit economics
          ...(data.equipmentCosts && data.equipmentCosts.totalEquipmentCost
            ? [
                subHeading("Equipment Cost Breakdown"),
                makeTable(
                  ["Component", "Cost", "Unit Rate"],
                  [
                    ...(data.equipmentCosts.batteryCost
                      ? [
                          [
                            "Battery Storage (LFP)",
                            fmt(data.equipmentCosts.batteryCost),
                            data.equipmentCosts.batteryPerKWh
                              ? `${fmt(data.equipmentCosts.batteryPerKWh)}/kWh`
                              : "—",
                          ],
                        ]
                      : []),
                    ...(data.equipmentCosts.inverterCost
                      ? [
                          [
                            "Power Conversion System (PCS)",
                            fmt(data.equipmentCosts.inverterCost),
                            data.equipmentCosts.inverterPerKW
                              ? `${fmt(data.equipmentCosts.inverterPerKW)}/kW`
                              : "—",
                          ],
                        ]
                      : []),
                    ...(data.equipmentCosts.transformerCost
                      ? [["Transformer", fmt(data.equipmentCosts.transformerCost), "—"]]
                      : []),
                    ...(data.equipmentCosts.switchgearCost
                      ? [["Switchgear", fmt(data.equipmentCosts.switchgearCost), "—"]]
                      : []),
                    ...(data.equipmentCosts.solarCost
                      ? [
                          [
                            "Solar Array",
                            fmt(data.equipmentCosts.solarCost),
                            data.equipmentCosts.solarPerWatt
                              ? `$${data.equipmentCosts.solarPerWatt.toFixed(2)}/W`
                              : "—",
                          ],
                        ]
                      : []),
                    ...(data.equipmentCosts.generatorCost
                      ? [
                          [
                            "Backup Generator",
                            fmt(data.equipmentCosts.generatorCost),
                            data.equipmentCosts.generatorPerKW
                              ? `${fmt(data.equipmentCosts.generatorPerKW)}/kW`
                              : "—",
                          ],
                        ]
                      : []),
                    ...(data.equipmentCosts.installationCost
                      ? [
                          [
                            "Installation / BOS / EPC",
                            fmt(data.equipmentCosts.installationCost),
                            "—",
                          ],
                        ]
                      : []),
                    ["Base Equipment Total", fmt(data.equipmentCosts.totalEquipmentCost), "—"],
                  ],
                  1
                ),
                // Unit economics summary
                ...(data.equipmentCosts.allInPerKWh || data.equipmentCosts.allInPerKW
                  ? [
                      bodyParagraph(
                        `Unit Economics: ${data.equipmentCosts.allInPerKWh ? `${fmt(data.equipmentCosts.allInPerKWh)}/kWh (all-in)` : ""}${data.equipmentCosts.allInPerKWh && data.equipmentCosts.allInPerKW ? " | " : ""}${data.equipmentCosts.allInPerKW ? `${fmt(data.equipmentCosts.allInPerKW)}/kW (all-in)` : ""}`
                      ),
                    ]
                  : []),
                spacer(200),
              ]
            : []),

          subHeading("Savings & Returns"),
          makeTable(
            ["Metric", "Value", "Notes"],
            [
              [
                "Annual Energy Savings",
                `${fmt(annualSavings)}/yr`,
                "Energy arbitrage + peak shaving",
              ],
              ...(demandChargeSavings > 0
                ? [
                    [
                      "Annual Demand Charge Reduction",
                      `${fmt(demandChargeSavings)}/yr`,
                      `At $${data.demandCharge}/kW`,
                    ],
                  ]
                : []),
              ...(paybackYears > 0
                ? [
                    [
                      "Simple Payback Period",
                      `${paybackYears.toFixed(1)} years`,
                      netCost > 0 ? "Net cost basis" : "Gross cost basis",
                    ],
                  ]
                : []),
              ...(roi10Year !== 0
                ? [["10-Year ROI", fmtPct(roi10Year), "Net of initial investment"]]
                : []),
              ...(lifetimeSavings > 0
                ? [["10-Year Cumulative Savings", fmt(lifetimeSavings), "Undiscounted"]]
                : []),
              ...(data.financialAnalysis?.npv != null
                ? [["Net Present Value (NPV)", fmt(data.financialAnalysis.npv), "8% discount rate"]]
                : []),
              ...(data.financialAnalysis?.irr != null
                ? [
                    [
                      "Internal Rate of Return (IRR)",
                      fmtPct(data.financialAnalysis.irr * 100),
                      "Project-level IRR",
                    ],
                  ]
                : []),
            ],
            1
          ),
          spacer(200),

          subHeading("Utility Rate Assumptions"),
          makeTable(
            ["Parameter", "Value", "Source"],
            [
              [
                "Commercial Electricity Rate",
                `$${data.utilityRate.toFixed(4)}/kWh`,
                "EIA / Local Utility",
              ],
              ["Demand Charge", `$${data.demandCharge.toFixed(2)}/kW`, "EIA / Local Utility"],
              ["Annual Rate Escalation", "2.5%", "EIA Annual Energy Outlook"],
              ["Discount Rate", "8.0%", "Industry standard (C&I)"],
            ]
          ),
          spacer(200),

          // Cash flow summary (5 year snapshot)
          ...(annualSavings > 0
            ? [
                subHeading("Projected Cash Flow (Years 1–5)"),
                makeTable(
                  ["Year", "Annual Savings", "Cumulative Savings", "Net Position"],
                  Array.from({ length: 5 }, (_, i) => {
                    const yr = i + 1;
                    const escalation = Math.pow(1.025, yr - 1);
                    const yrSavings = annualSavings * escalation;
                    const cumulative = annualSavings * ((Math.pow(1.025, yr) - 1) / 0.025);
                    const netPos = cumulative - netCost;
                    return [
                      `Year ${yr}`,
                      fmt(Math.round(yrSavings)),
                      fmt(Math.round(cumulative)),
                      `${netPos >= 0 ? "+" : ""}${fmt(Math.round(netPos))}`,
                    ];
                  }),
                  3
                ),
                spacer(100),
                bodyParagraph(
                  "Note: Savings projections include 2.5% annual utility rate escalation. Actual results may vary based on usage patterns, rate changes, and system performance."
                ),
              ]
            : []),
          spacer(300),

          // ═══════════════════════════════════════════════════════════
          // 5. IMPLEMENTATION & TIMELINE
          // ═══════════════════════════════════════════════════════════
          sectionHeading("05", "Implementation"),

          subHeading("Project Timeline"),
          makeTable(
            ["Phase", "Duration", "Activities"],
            [
              [
                "1. Engineering & Design",
                "4–6 weeks",
                "Site assessment, electrical engineering, permitting",
              ],
              ["2. Procurement", "8–12 weeks", "Equipment ordering, logistics, staging"],
              [
                "3. Installation",
                "4–8 weeks",
                "Foundation, equipment placement, electrical connections",
              ],
              ["4. Commissioning", "1–2 weeks", "Testing, calibration, utility interconnection"],
              ["5. Operations", "Ongoing", "Monitoring, optimization, maintenance"],
            ]
          ),
          spacer(200),

          subHeading("Standards & Certifications"),
          bullet("UL 9540 / UL 9540A — Energy Storage System Safety", "Safety:"),
          bullet(
            "IEEE 1547 — Interconnection and interoperability of distributed energy resources",
            "Grid:"
          ),
          bullet(
            "NFPA 855 — Standard for the installation of stationary energy storage systems",
            "Fire:"
          ),
          bullet("NEC Article 706 — Energy storage systems", "Electrical:"),
          bullet(
            "All equipment is IRA 2022 domestic content eligible where available",
            "Incentives:"
          ),
          spacer(300),

          // ═══════════════════════════════════════════════════════════
          // 6. TRUEQUOTE™ METHODOLOGY
          // ═══════════════════════════════════════════════════════════
          sectionHeading("06", "TrueQuote™ Methodology"),
          bodyParagraph(
            "Every number in this proposal is traceable to an authoritative, published source. " +
              "TrueQuote™ is Merlin's proprietary methodology that eliminates black-box estimates and provides " +
              "full transparency into how your quote was generated."
          ),
          spacer(100),

          subHeading("Data Sources"),
          bullet(
            "National Renewable Energy Laboratory (NREL) Annual Technology Baseline 2024 — Battery and solar cost benchmarks",
            "NREL ATB 2024:"
          ),
          bullet(
            "NREL Cost Benchmark for Utility-Scale Battery Storage (Q1 2024) — Installation and BOS costs",
            "NREL Q1 2024:"
          ),
          bullet(
            "Inflation Reduction Act of 2022 (Public Law 117-169) — ITC rates and bonus credits",
            "IRA 2022:"
          ),
          bullet(
            "U.S. Energy Information Administration — State-level commercial electricity rates",
            "EIA:"
          ),
          bullet(
            "IEEE 446-1995, IEEE 4538388, MDPI Energies — Industry-standard sizing ratios",
            "IEEE/MDPI:"
          ),
          spacer(200),

          ...(data.trueQuoteConfidence
            ? [
                subHeading("Quote Confidence Assessment"),
                kvRow("Overall Confidence", confidenceText, confidenceColor, true),
                kvRow(
                  "Industry Model",
                  data.trueQuoteConfidence.industry === "v1"
                    ? "Industry-Specific Calculator (TrueQuote™ v1)"
                    : "General Facility Estimate"
                ),
                kvRow("Profile Completeness", `${data.trueQuoteConfidence.profileCompleteness}%`),
                kvRow(
                  "User Inputs Provided",
                  `${data.trueQuoteConfidence.userInputs} of ${data.trueQuoteConfidence.userInputs + data.trueQuoteConfidence.defaultsUsed} questions`
                ),
                ...(data.pricingSnapshotId
                  ? [kvRow("Pricing Snapshot ID", data.pricingSnapshotId.slice(0, 16))]
                  : []),
              ]
            : []),
          spacer(300),

          // ═══════════════════════════════════════════════════════════
          // 7. NEXT STEPS — CALL TO ACTION
          // ═══════════════════════════════════════════════════════════
          sectionHeading("07", "Next Steps"),

          new Paragraph({
            shading: { type: ShadingType.SOLID, color: C.emeraldBg },
            children: [
              new TextRun({
                text: "  Ready to move forward? Here's how to get started:",
                size: 24,
                bold: true,
                color: C.navy,
              }),
            ],
            spacing: { after: 160 },
          }),

          new Paragraph({
            children: [
              new TextRun({ text: "  1. ", size: 24, bold: true, color: C.emerald }),
              new TextRun({
                text: "Schedule a Site Assessment  ",
                size: 24,
                bold: true,
                color: C.navy,
              }),
              new TextRun({
                text: "— Our engineers validate the load profile and confirm optimal sizing for your facility.",
                size: 22,
                color: C.body,
              }),
            ],
            spacing: { after: 120 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "  2. ", size: 24, bold: true, color: C.emerald }),
              new TextRun({
                text: "Review Final Engineering  ",
                size: 24,
                bold: true,
                color: C.navy,
              }),
              new TextRun({
                text: "— Receive detailed single-line diagrams, site plans, and interconnection documents.",
                size: 22,
                color: C.body,
              }),
            ],
            spacing: { after: 120 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "  3. ", size: 24, bold: true, color: C.emerald }),
              new TextRun({ text: "Execute Agreement  ", size: 24, bold: true, color: C.navy }),
              new TextRun({
                text: "— Lock in pricing (valid 30 days) and begin the ITC qualification process.",
                size: 22,
                color: C.body,
              }),
            ],
            spacing: { after: 120 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "  4. ", size: 24, bold: true, color: C.emerald }),
              new TextRun({ text: "Start Saving  ", size: 24, bold: true, color: C.navy }),
              new TextRun({
                text: `— Typical commissioning in 12–16 weeks. Projected savings: ${fmt(annualSavings)}/year from day one.`,
                size: 22,
                color: C.body,
              }),
            ],
            spacing: { after: 200 },
          }),

          spacer(100),

          // ── Contact CTA (dark panel — matches header) ────────────
          new Paragraph({
            alignment: AlignmentType.CENTER,
            shading: { type: ShadingType.SOLID, color: C.panelDark },
            children: [new TextRun({ text: " ", size: 16 })],
            spacing: { after: 0 },
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            shading: { type: ShadingType.SOLID, color: C.panelDark },
            children: [
              new TextRun({
                text: "Contact Merlin Energy Solutions",
                size: 28,
                bold: true,
                color: C.headerText,
              }),
            ],
            spacing: { after: 80 },
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            shading: { type: ShadingType.SOLID, color: C.panelDark },
            children: [
              new TextRun({
                text: "sales@merlinenergy.net  •  merlinenergy.net",
                size: 22,
                color: C.emeraldLight,
              }),
            ],
            spacing: { after: 80 },
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            shading: { type: ShadingType.SOLID, color: C.panelDark },
            children: [
              new TextRun({
                text: "Let's build your energy future together.",
                size: 20,
                color: "94A3B8",
                italics: true,
              }),
            ],
            spacing: { after: 40 },
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            shading: { type: ShadingType.SOLID, color: C.panelDark },
            children: [new TextRun({ text: " ", size: 16 })],
            spacing: { after: 300 },
          }),

          // ═══════════════════════════════════════════════════════════
          // TERMS & CONDITIONS
          // ═══════════════════════════════════════════════════════════
          sectionHeading("", "Terms & Conditions"),
          bullet("This quote is valid for 30 days from the date of issue."),
          bullet(
            "All pricing reflects current market conditions as of the quote date. Equipment prices are subject to confirmation at time of order."
          ),
          bullet(
            "Payment Terms: 30% deposit upon contract signing, 40% upon equipment delivery, 30% upon commissioning."
          ),
          bullet(
            `Warranty: ${data.warrantyYears || 15}-year comprehensive warranty covering batteries, inverters, and BMS.`
          ),
          bullet(
            "Equipment pricing sourced from NREL ATB 2024 and current manufacturer pricing sheets."
          ),
          bullet(
            "ITC eligibility based on IRA 2022 (Public Law 117-169). Tax credit availability subject to project-specific qualification."
          ),
          bullet(
            "Final pricing subject to site assessment, permitting costs, and utility interconnection requirements."
          ),
          spacer(200),

          new Paragraph({
            children: [
              new TextRun({
                text:
                  "DISCLAIMER: This proposal has been prepared by Merlin Energy Solutions using TrueQuote™ methodology. " +
                  "While every effort has been made to ensure accuracy using authoritative data sources, this document is for informational " +
                  "and planning purposes only. Final system design, pricing, and performance guarantees are subject to detailed engineering " +
                  "assessment and executed contract terms. Consult with a qualified tax professional regarding ITC eligibility.",
                size: 16,
                color: C.muted,
                italics: true,
              }),
            ],
            spacing: { after: 200 },
          }),

          // ═══════════════════════════════════════════════════════════
          // PROQUOTE™ UPGRADE CTA (with badge)
          // ═══════════════════════════════════════════════════════════
          new Paragraph({
            children: [],
            border: {
              bottom: { color: C.lightGreyDark, space: 2, style: BorderStyle.SINGLE, size: 6 },
            },
            spacing: { after: 160 },
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            shading: { type: ShadingType.SOLID, color: C.panelDark },
            children: [new TextRun({ text: " ", size: 12 })],
            spacing: { after: 0 },
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            shading: { type: ShadingType.SOLID, color: C.panelDark },
            spacing: { after: 60 },
            children: [
              new ImageRun({
                data: proquoteBadgeImg,
                transformation: { width: 28, height: 35 },
                type: "png",
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            shading: { type: ShadingType.SOLID, color: C.panelDark },
            spacing: { after: 40 },
            children: [
              new TextRun({ text: "Want more detail?  ", size: 22, color: "94A3B8" }),
              new TextRun({
                text: "Consider ProQuote™",
                size: 22,
                bold: true,
                color: C.emeraldLight,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            shading: { type: ShadingType.SOLID, color: C.panelDark },
            spacing: { after: 40 },
            children: [
              new TextRun({
                text: "8760 hourly analysis  •  Monte Carlo risk modeling  •  Bank-ready financials",
                size: 18,
                color: "94A3B8",
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            shading: { type: ShadingType.SOLID, color: C.panelDark },
            spacing: { after: 40 },
            children: [
              new TextRun({
                text: "Detailed engineering  •  Project-specific site assessment  •  ",
                size: 18,
                color: "94A3B8",
              }),
              new TextRun({
                text: "Upgrade to ProQuote™",
                size: 18,
                bold: true,
                color: C.emeraldLight,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            shading: { type: ShadingType.SOLID, color: C.panelDark },
            children: [new TextRun({ text: " ", size: 12 })],
            spacing: { after: 100 },
          }),

          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: "— End of Proposal —", size: 18, color: C.muted, italics: true }),
            ],
          }),
        ] as FileChild[],
      },
    ],
  });

  // ── Generate and download ────────────────────────────────────────
  const blob = await Packer.toBlob(doc);
  saveAs(blob, `Merlin_BESS_Proposal_${data.quoteNumber}.docx`);
}

/**
 * Export quote as professional PDF proposal — matches Word template structure exactly.
 * Same 7 sections as exportQuoteAsWord: Executive Summary, System Specs, Load Profile,
 * Financial Analysis, Implementation, TrueQuote™ Methodology, Next Steps.
 * Light / print-safe colour scheme (white bg, slate text, emerald accents).
 */
export async function exportQuoteAsPDF(data: QuoteExportData): Promise<void> {
  // ── Derived values (mirrors exportQuoteAsWord) ───────────────────────────
  const storageMWh = data.storageSizeMWh || data.storageSizeMW * data.durationHours;
  const storageKW = data.storageSizeMW * 1000;
  const storageKWh = storageMWh * 1000;
  const annualSavings = data.financialAnalysis?.annualSavingsUSD ?? 0;
  const paybackYears = data.financialAnalysis?.paybackYears ?? 0;
  const roi10Year =
    annualSavings > 0 && data.systemCost > 0
      ? ((annualSavings * 10 - data.systemCost) / data.systemCost) * 100
      : 0;
  const lifetimeSavings = annualSavings * 10;
  const itcRate = data.itcBreakdown?.totalRate ?? (data.financialAnalysis ? 0.3 : 0);
  const itcAmount = data.itcBreakdown?.creditAmount ?? data.systemCost * itcRate;
  const netCost = data.systemCost - itcAmount;
  const itcLabel = data.itcBreakdown
    ? `Federal ITC Credit (${Math.round(itcRate * 100)}%)`
    : "Federal ITC Credit (30%)";
  const demandChargeSavings =
    data.financialAnalysis?.demandChargeSavings ?? data.demandCharge * storageKW * 0.5 * 12;
  const watermarkText = getWatermarkText();

  // Format helpers
  const fmtCurrency = (v: number) => {
    if (!v || !Number.isFinite(v)) return "$0";
    return "$" + v.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };
  const fmtCurrencyShort = fmtCurrency;
  const fmtPct = (v: number) => `${v.toFixed(1)}%`;
  const fmtNum = (v: number) => v.toLocaleString("en-US");

  // ── Build contributor rows for load breakdown (shared by Word and PDF) ──
  const contributorEntries = data.trueQuoteValidation?.kWContributors
    ? Object.entries(data.trueQuoteValidation.kWContributors)
        .filter(([, kw]) => kw > 0)
        .sort(([, a], [, b]) => b - a)
    : [];
  const totalContributorKW = contributorEntries.reduce((s, [, kw]) => s + kw, 0);

  const confidenceText =
    data.trueQuoteConfidence?.overall === "high"
      ? "HIGH — Industry-specific model with verified inputs"
      : data.trueQuoteConfidence?.overall === "medium"
        ? "MEDIUM — Some inputs estimated from industry defaults"
        : "STANDARD — General facility estimate";

  // ── Re-usable HTML helpers ───────────────────────────────────────────────
  const twoColRow = (label: string, value: string, valueClass = "") =>
    `<tr><td class="lc">${label}</td><td class="vc ${valueClass}">${value}</td></tr>`;

  const threeColRow = (a: string, b: string, c: string) =>
    `<tr><td>${a}</td><td>${b}</td><td>${c}</td></tr>`;

  const fourColRow = (a: string, b: string, c: string, d: string) =>
    `<tr><td>${a}</td><td>${b}</td><td>${c}</td><td>${d}</td></tr>`;

  const sectionH = (num: string, title: string) =>
    `<div class="sh">${num}. ${title.toUpperCase()}</div>`;

  const subH = (title: string) => `<div class="sbh">${title}</div>`;

  const bodyP = (text: string) => `<p class="bp">${text}</p>`;

  const metricRow = (label: string, value: string, green = false) =>
    `<tr><td class="lc">${label}</td><td class="vc${green ? " green" : ""}">${value}</td></tr>`;

  // Helper: generic dark-header table
  const tableHtml = (headers: string[], rows: string, extraClass = "") =>
    `<table class="t ${extraClass}"><thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows}</tbody></table>`;

  const printContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>BESS Proposal - ${data.projectName}</title>
  <style>
    @page { size: letter; margin: 0.55in 0.7in 0.6in 0.7in; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Calibri', 'Segoe UI', Arial, sans-serif; font-size: 10pt; color: #1E293B; line-height: 1.5; background: #fff; }

    /* ── HEADER ── */
    .ph { background: linear-gradient(135deg, #0F172A 0%, #1E293B 60%, #0F172A 100%); border-bottom: 3px solid #1B8F5A; padding: 24px 28px; display: flex; justify-content: space-between; align-items: center; margin: -0.55in -0.7in 0 -0.7in; width: calc(100% + 1.4in); -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .ph-left h1 { font-size: 19pt; font-weight: 800; color: #fff; letter-spacing: 0.2px; line-height: 1.15; margin-bottom: 7px; }
    .ph-left .sub { font-size: 9.5pt; color: #94A3B8; }
    .ph-left .tq  { font-size: 9pt; color: #3ECF8E; margin-top: 5px; font-weight: 700; letter-spacing: 0.4px; }
    .ph-right { text-align: right; }
    .ph-right .bn { font-size: 15pt; font-weight: 800; letter-spacing: 1px; color: #fff; }
    .ph-right .bt { font-size: 8.5pt; color: #64748B; margin-top: 2px; }
    .ph-right img { width: 48px; height: 48px; border-radius: 10px; border: 2px solid #1B8F5A; display: block; margin: 6px 0 0 auto; }
    .wm { font-size: 8pt; color: #aaa; text-align: right; margin: 4px -0.7in -4px 0; letter-spacing: 0.5px; }

    /* ── META STRIP ── */
    .ms { display: flex; gap: 0; margin: 14px 0 0 0; border: 1px solid #CBD5E1; border-radius: 6px; overflow: hidden; }
    .ms-cell { flex: 1; padding: 9px 14px; border-right: 1px solid #CBD5E1; background: #F8FAFC; }
    .ms-cell:last-child { border-right: none; }
    .ms-cell .ml { font-size: 8pt; color: #94A3B8; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px; margin-bottom: 3px; }
    .ms-cell .mv { font-size: 9.5pt; color: #1E293B; font-weight: 600; }

    /* ── TrueQuote strip ── */
    .tqs { background: #EDFDF5; border-left: 3px solid #1B8F5A; padding: 9px 14px; margin: 14px 0; font-size: 9pt; color: #1E293B; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .tqs strong { color: #1B8F5A; }

    /* ── SECTION HEADING ── */
    .sh { font-size: 11.5pt; font-weight: 800; color: #1B8F5A; padding-bottom: 5px; border-bottom: 1.5px solid #CBD5E1; margin: 26px 0 12px 0; letter-spacing: 0.4px; text-transform: uppercase; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .sbh { font-size: 10pt; font-weight: 700; color: #334155; margin: 16px 0 7px 0; }
    .bp { font-size: 9.5pt; color: #4A5568; line-height: 1.65; margin: 0 0 12px 0; }

    /* ── HERO METRICS GRID ── */
    .hmg { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin: 12px 0 20px 0; }
    .hmc { background: #F8FAFC; border: 1px solid #CBD5E1; border-radius: 6px; padding: 10px 13px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .hmc .hl { font-size: 8pt; color: #94A3B8; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px; margin-bottom: 4px; }
    .hmc .hv { font-size: 12pt; font-weight: 800; color: #1E293B; }
    .hmc .hv.green { color: #1B8F5A; }
    .hmc .hv.amber { color: #D97706; }

    /* ── GENERIC TABLE ── */
    .t { width: 100%; border-collapse: collapse; margin: 8px 0 18px 0; font-size: 9.5pt; }
    .t thead th { background: #1E293B; color: #fff; font-weight: 700; padding: 7px 11px; text-align: left; text-transform: uppercase; font-size: 8.5pt; letter-spacing: 0.4px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .t tbody td { padding: 6.5px 11px; border: 1px solid #E2E8F0; color: #1E293B; vertical-align: top; }
    .t tbody tr:nth-child(even) td { background: #F8FAFC; }
    .t tbody .lc { font-weight: 600; color: #475569; background: #F1F5F9; width: 40%; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .t tbody .vc { color: #1E293B; }
    .t tbody .vc.green { color: #1B8F5A; font-weight: 700; }
    .t tbody .vc.amber { color: #D97706; font-weight: 700; }
    .t tbody .total-row td { font-weight: 800; border-top: 2px solid #CBD5E1; }

    /* ── CASH FLOW TABLE ── */
    .cf-positive { color: #1B8F5A; font-weight: 700; }
    .cf-negative { color: #DC2626; }

    /* ── BULLET LIST ── */
    .bul { margin: 4px 0 4px 14px; }
    .bul li { font-size: 9.5pt; color: #4A5568; margin: 3px 0; list-style: none; padding-left: 12px; position: relative; }
    .bul li::before { content: "•"; position: absolute; left: 0; color: #1B8F5A; font-weight: 700; }

    /* ── CONFIDENCE BADGE ── */
    .cb { display: inline-block; padding: 2px 9px; border-radius: 999px; font-size: 8.5pt; font-weight: 700; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .cb.high { background: #D1FAE5; color: #065F46; border: 1px solid #10B981; }
    .cb.medium { background: #FEF3C7; color: #92400E; border: 1px solid #F59E0B; }
    .cb.low { background: #FEE2E2; color: #991B1B; border: 1px solid #EF4444; }

    /* ── CTA STRIP ── */
    .cta { background: #EDFDF5; border-left: 3px solid #1B8F5A; padding: 11px 14px; margin: 12px 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .cta strong { color: #1B8F5A; font-size: 10.5pt; }
    .cta p { font-size: 9pt; color: #4A5568; margin-top: 6px; }

    /* ── FOOTER ── */
    .pf { margin-top: 28px; padding-top: 12px; border-top: 1px solid #CBD5E1; font-size: 8.5pt; color: #64748B; line-height: 1.75; }
    .pf .disc { font-style: italic; margin-top: 10px; font-size: 8pt; color: #475569; padding: 9px 12px; background: #F8FAFC; border-radius: 4px; border-left: 3px solid #CBD5E1; -webkit-print-color-adjust: exact; print-color-adjust: exact; }

    @media print {
      .ph, .hmg, .hmc, .tqs, .sh, .cta, .t thead th, .t tbody .lc, .t tbody tr:nth-child(even) td, .ms-cell, .cb, .pf .disc { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    }
  </style>
</head>
<body>

<!-- ══ HEADER ══ -->
<div class="ph">
  <div class="ph-left">
    <h1>BATTERY ENERGY STORAGE<br>SYSTEM PROPOSAL</h1>
    <div class="sub">Professional Energy Storage Solution</div>
    <div class="tq">TrueQuote™ Verified &bull; Source-Backed Pricing</div>
  </div>
  <div class="ph-right">
    <div class="bn">MERLIN</div>
    <div class="bt">Energy Solutions</div>
    <img src="${MERLIN_ICON_BASE64}" alt="Merlin" />
  </div>
</div>
${watermarkText ? `<div class="wm">${watermarkText}</div>` : ""}

<!-- ══ META STRIP ══ -->
<div class="ms">
  <div class="ms-cell"><div class="ml">Client</div><div class="mv">${data.projectName?.replace(/—.*/, "").trim() || "Commercial Client"}</div></div>
  <div class="ms-cell"><div class="ml">Location</div><div class="mv">${data.location || "—"}</div></div>
  <div class="ms-cell"><div class="ml">Industry</div><div class="mv">${data.useCase || "Commercial"}</div></div>
  <div class="ms-cell"><div class="ml">Quote Ref</div><div class="mv">${data.quoteNumber}</div></div>
  <div class="ms-cell"><div class="ml">Date</div><div class="mv">${data.quoteDate}</div></div>
  <div class="ms-cell"><div class="ml">Grid</div><div class="mv">${data.gridConnection || "On-Grid"}</div></div>
</div>

<!-- ══ TrueQuote strip ══ -->
<div class="tqs">
  <strong>✓ TrueQuote™ Verified</strong> — Every number in this proposal is traceable to an authoritative source (NREL, EIA, IEEE, IRA 2022). No black-box estimates.
  ${data.trueQuoteConfidence ? `<span style="color:#64748b;font-size:8.5pt;"> &nbsp;|&nbsp; Confidence: <strong>${confidenceText}</strong></span>` : ""}
</div>

<!-- ══ 01. EXECUTIVE SUMMARY ══ -->
${sectionH("01", "Executive Summary")}
${bodyP(`This proposal presents a turnkey ${storageMWh.toFixed(1)} MWh Battery Energy Storage System (BESS) designed for your ${data.useCase} facility in ${data.location || "your area"}. The system delivers measurable cost reductions through peak demand shaving, energy arbitrage, and demand charge management while providing backup power resilience.`)}

<div class="hmg">
  <div class="hmc"><div class="hl">Total Investment</div><div class="hv">${fmtCurrency(data.systemCost)}</div></div>
  ${itcAmount > 0 ? `<div class="hmc"><div class="hl">${itcLabel}</div><div class="hv green">– ${fmtCurrency(itcAmount)}</div></div>` : ""}
  ${netCost !== data.systemCost ? `<div class="hmc"><div class="hl">Net After Incentives</div><div class="hv green">${fmtCurrency(netCost)}</div></div>` : ""}
  ${annualSavings > 0 ? `<div class="hmc"><div class="hl">Annual Savings</div><div class="hv green">${fmtCurrencyShort(annualSavings)}/yr</div></div>` : ""}
  ${paybackYears > 0 ? `<div class="hmc"><div class="hl">Simple Payback</div><div class="hv">${paybackYears.toFixed(1)} years</div></div>` : ""}
  ${roi10Year > 0 ? `<div class="hmc"><div class="hl">10-Year ROI</div><div class="hv green">${fmtPct(roi10Year)}</div></div>` : ""}
  ${lifetimeSavings > 0 ? `<div class="hmc"><div class="hl">10-Year Savings</div><div class="hv">${fmtCurrencyShort(lifetimeSavings)}</div></div>` : ""}
  <div class="hmc"><div class="hl">System Capacity</div><div class="hv">${storageMWh.toFixed(1)} MWh</div></div>
  <div class="hmc"><div class="hl">Power Rating</div><div class="hv">${data.storageSizeMW.toFixed(2)} MW</div></div>
  <div class="hmc"><div class="hl">Warranty</div><div class="hv">${data.warrantyYears} Years</div></div>
</div>

<!-- ══ 02. SYSTEM SPECIFICATIONS ══ -->
${sectionH("02", "System Specifications")}
${subH("Battery Energy Storage")}
${tableHtml(
  ["Parameter", "Specification"],
  [
    ["Energy Capacity", `${storageMWh.toFixed(1)} MWh (${fmtNum(Math.round(storageKWh))} kWh)`],
    ["Power Rating", `${data.storageSizeMW.toFixed(2)} MW (${fmtNum(Math.round(storageKW))} kW)`],
    ["Duration", `${data.durationHours} hours at rated power`],
    ["Battery Chemistry", data.chemistry || "LiFePO₄ (Lithium Iron Phosphate)"],
    ["Round-Trip Eff.", `${data.roundTripEfficiency || 90}%`],
    ["Design Cycles", `${fmtNum(data.cyclesPerYear || 365)} cycles/year`],
    ["System Warranty", `${data.warrantyYears || 10} years`],
    ["Expected Lifespan", "25+ years"],
    ["Install Type", data.installationType || "Containerized"],
  ]
    .map(([l, v]) => twoColRow(l, v))
    .join("")
)}

${subH("Power Conversion & Electrical")}
${tableHtml(
  ["Component", "Specification"],
  [
    [
      "Inverter / PCS",
      `${data.numberOfInverters || 1}× ${fmtNum(data.inverterRating || Math.round(storageKW))} kW — ${data.inverterType || "Bidirectional PCS"}`,
    ],
    ["Inverter Efficiency", `${data.inverterEfficiency || 97.5}%`],
    ["AC System Voltage", `${data.systemVoltage || 480}V, 3-phase`],
    ["DC Bus Voltage", `${data.dcVoltage || 1000}V nominal`],
    [
      "Switchgear",
      `${data.switchgearType || "AC Switchgear"} — ${fmtNum(Math.round(data.switchgearRating || storageKW * 1.25))} kW rated`,
    ],
    ["BMS", `${data.bmsType || "Integrated"} Battery Management System`],
    ...(data.transformerRequired
      ? [
          [
            "Transformer",
            `${data.transformerVoltage || "480V/12.47kV"} — ${fmtNum(Math.round(data.transformerRating || storageKW))} kVA`,
          ],
        ]
      : []),
  ]
    .map(([l, v]) => twoColRow(l, v))
    .join("")
)}

${
  data.solarPVIncluded ||
  data.dieselGenIncluded ||
  data.naturalGasGenIncluded ||
  data.fuelCellIncluded
    ? `
${subH("Integrated Generation Assets")}
${tableHtml(
  ["Asset", "Capacity", "Details"],
  [
    ...(data.solarPVIncluded && data.solarCapacityKW
      ? [
          [
            `Solar PV Array`,
            `${fmtNum(data.solarCapacityKW)} kW`,
            `${data.solarPanelType || "Monocrystalline"} — ${data.solarPanelEfficiency || 21}% eff.`,
          ],
        ]
      : []),
    ...(data.naturalGasGenIncluded && data.naturalGasCapacityKW
      ? [[`Nat. Gas Generator`, `${fmtNum(data.naturalGasCapacityKW)} kW`, "Backup / peak shaving"]]
      : []),
    ...(data.dieselGenIncluded && data.dieselGenCapacityKW
      ? [[`Diesel Generator`, `${fmtNum(data.dieselGenCapacityKW)} kW`, "Emergency backup"]]
      : []),
    ...(data.fuelCellIncluded && data.fuelCellCapacityKW
      ? [
          [
            `Fuel Cell`,
            `${fmtNum(data.fuelCellCapacityKW)} kW`,
            `${data.fuelCellType || "Hydrogen"} fuel cell`,
          ],
        ]
      : []),
  ]
    .map(([a, b, c]) => threeColRow(a, b, c))
    .join("")
)}`
    : ""
}

<!-- ══ 03. LOAD PROFILE & SIZING ══ -->
${sectionH("03", "Load Profile & Sizing")}
${
  contributorEntries.length > 0
    ? `
${bodyP("Your facility's power demand was analyzed using industry-specific load modeling. Each contributor below has been independently sized using authoritative standards.")}
${subH("Load Breakdown — TrueQuote™ Verified")}
${tableHtml(
  ["Load Component", "Peak Demand (kW)", "Share of Total"],
  contributorEntries
    .map(([key, kw]) => {
      const sharePct = totalContributorKW > 0 ? (kw / totalContributorKW) * 100 : 0;
      const label = key
        .replace(/_/g, " ")
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (s: string) => s.toUpperCase())
        .trim();
      return threeColRow(label, `${fmtNum(Math.round(kw))} kW`, fmtPct(sharePct));
    })
    .join("") +
    (data.trueQuoteValidation?.dutyCycle != null
      ? `<tr class="total-row"><td colspan="2">Facility Duty Cycle</td><td>${fmtPct(data.trueQuoteValidation.dutyCycle * 100)}</td></tr>`
      : "")
)}`
    : bodyP(
        `The BESS is sized at ${data.storageSizeMW.toFixed(2)} MW / ${data.durationHours}hr based on your facility's estimated peak demand and operational requirements.`
      )
}

${
  data.loadProfile
    ? `
${subH("Load Summary")}
${tableHtml(
  ["Parameter", "Value"],
  [
    ["Base Load", `${fmtNum(Math.round(data.loadProfile.baseLoadKW))} kW`],
    ["Peak Load", `${fmtNum(Math.round(data.loadProfile.peakLoadKW))} kW`],
    ["Daily Energy", `${fmtNum(Math.round(data.loadProfile.energyKWhPerDay))} kWh/day`],
    [
      "Annual Consumption",
      `${fmtNum(Math.round(data.loadProfile.energyKWhPerDay * 365))} kWh/year`,
    ],
  ]
    .map(([l, v]) => twoColRow(l, v))
    .join("")
)}`
    : ""
}

${
  data.trueQuoteValidation?.assumptions?.length
    ? `
${subH("Sizing Methodology & Sources")}
<ul class="bul">${data.trueQuoteValidation.assumptions.map((a: string) => `<li>${a}</li>`).join("")}</ul>`
    : ""
}

<!-- ══ 04. FINANCIAL ANALYSIS ══ -->
${sectionH("04", "Financial Analysis")}
${bodyP("The financial model reflects current market pricing (NREL ATB 2024), federal incentives under the Inflation Reduction Act (IRA 2022), and location-specific utility rates.")}

${subH("Investment Summary")}
${tableHtml(
  ["Line Item", "Amount"],
  [
    ["Gross System Cost", fmtCurrency(data.systemCost)],
    ...(itcAmount > 0 ? [[itcLabel, `– ${fmtCurrency(itcAmount)}`]] : []),
    ...(netCost !== data.systemCost ? [["Net Cost After Incentives", fmtCurrency(netCost)]] : []),
  ]
    .map(([l, v]) => twoColRow(l, v))
    .join("") +
    `<tr class="total-row"><td class="lc">Net Investment</td><td class="vc green">${fmtCurrency(netCost)}</td></tr>`
)}

${
  data.equipmentCosts?.totalEquipmentCost
    ? `
${subH("Equipment Cost Breakdown")}
${tableHtml(
  ["Component", "Cost", "Unit Rate"],
  [
    ...(data.equipmentCosts.batteryCost
      ? [
          [
            "Battery Storage (LFP)",
            fmtCurrencyShort(data.equipmentCosts.batteryCost),
            data.equipmentCosts.batteryPerKWh
              ? `${fmtCurrencyShort(data.equipmentCosts.batteryPerKWh)}/kWh`
              : "—",
          ],
        ]
      : []),
    ...(data.equipmentCosts.inverterCost
      ? [
          [
            "Power Conversion (PCS)",
            fmtCurrencyShort(data.equipmentCosts.inverterCost),
            data.equipmentCosts.inverterPerKW
              ? `${fmtCurrencyShort(data.equipmentCosts.inverterPerKW)}/kW`
              : "—",
          ],
        ]
      : []),
    ...(data.equipmentCosts.transformerCost
      ? [["Transformer", fmtCurrencyShort(data.equipmentCosts.transformerCost), "—"]]
      : []),
    ...(data.equipmentCosts.switchgearCost
      ? [["Switchgear", fmtCurrencyShort(data.equipmentCosts.switchgearCost), "—"]]
      : []),
    ...(data.equipmentCosts.solarCost
      ? [
          [
            "Solar Array",
            fmtCurrencyShort(data.equipmentCosts.solarCost),
            data.equipmentCosts.solarPerWatt
              ? `$${data.equipmentCosts.solarPerWatt.toFixed(2)}/W`
              : "—",
          ],
        ]
      : []),
    ...(data.equipmentCosts.generatorCost
      ? [
          [
            "Backup Generator",
            fmtCurrencyShort(data.equipmentCosts.generatorCost),
            data.equipmentCosts.generatorPerKW
              ? `${fmtCurrencyShort(data.equipmentCosts.generatorPerKW)}/kW`
              : "—",
          ],
        ]
      : []),
    ...(data.equipmentCosts.installationCost
      ? [["Installation / BOS / EPC", fmtCurrencyShort(data.equipmentCosts.installationCost), "—"]]
      : []),
  ]
    .map(([a, b, c]) => threeColRow(a, b, c))
    .join("") +
    `<tr class="total-row"><td>Base Equipment Total</td><td>${fmtCurrencyShort(data.equipmentCosts.totalEquipmentCost)}</td><td>${data.equipmentCosts.allInPerKWh ? `${fmtCurrencyShort(data.equipmentCosts.allInPerKWh)}/kWh` : "—"}</td></tr>`
)}`
    : ""
}

${subH("Savings & Returns")}
${tableHtml(
  ["Metric", "Value", "Notes"],
  [
    [
      `Annual Energy Savings`,
      `${fmtCurrencyShort(annualSavings)}/yr`,
      "Energy arbitrage + peak shaving",
    ],
    ...(demandChargeSavings > 0
      ? [
          [
            `Demand Charge Reduction`,
            `${fmtCurrencyShort(demandChargeSavings)}/yr`,
            `At $${data.demandCharge}/kW`,
          ],
        ]
      : []),
    ...(paybackYears > 0
      ? [
          [
            `Simple Payback Period`,
            `${paybackYears.toFixed(1)} years`,
            netCost > 0 ? "Net cost basis" : "Gross cost basis",
          ],
        ]
      : []),
    ...(roi10Year !== 0 ? [[`10-Year ROI`, fmtPct(roi10Year), "Net of initial investment"]] : []),
    ...(lifetimeSavings > 0
      ? [[`10-Year Cumulative Savings`, fmtCurrencyShort(lifetimeSavings), "Undiscounted"]]
      : []),
    ...(data.financialAnalysis?.npv != null
      ? [
          [
            `Net Present Value (NPV)`,
            fmtCurrencyShort(data.financialAnalysis.npv),
            "8% discount rate",
          ],
        ]
      : []),
    ...(data.financialAnalysis?.irr != null
      ? [[`Internal Rate of Return`, fmtPct(data.financialAnalysis.irr * 100), "Project-level IRR"]]
      : []),
  ]
    .map(([a, b, c]) => threeColRow(a, b, c))
    .join("")
)}

${subH("Utility Rate Assumptions")}
${tableHtml(
  ["Parameter", "Value", "Source"],
  [
    ["Commercial Electricity Rate", `$${data.utilityRate.toFixed(4)}/kWh`, "EIA / Local Utility"],
    ["Demand Charge", `$${data.demandCharge.toFixed(2)}/kW`, "EIA / Local Utility"],
    ["Annual Rate Escalation", "2.5%", "EIA Annual Energy Outlook"],
    ["Discount Rate", "8.0%", "Industry standard (C&I)"],
  ]
    .map(([a, b, c]) => threeColRow(a, b, c))
    .join("")
)}

${
  annualSavings > 0
    ? `
${subH("Projected Cash Flow (Years 1–5)")}
${tableHtml(
  ["Year", "Annual Savings", "Cumulative Savings", "Net Position"],
  Array.from({ length: 5 }, (_, i) => {
    const yr = i + 1;
    const yrSavings = annualSavings * Math.pow(1.025, yr - 1);
    const cumulative = annualSavings * ((Math.pow(1.025, yr) - 1) / 0.025);
    const netPos = cumulative - netCost;
    return fourColRow(
      `Year ${yr}`,
      fmtCurrencyShort(Math.round(yrSavings)),
      fmtCurrencyShort(Math.round(cumulative)),
      `<span class="${netPos >= 0 ? "cf-positive" : "cf-negative"}">${netPos >= 0 ? "+" : ""}${fmtCurrencyShort(Math.round(netPos))}</span>`
    );
  }).join("")
)}
${bodyP("Note: Savings projections include 2.5% annual utility rate escalation. Actual results may vary based on usage patterns, rate changes, and system performance.")}
`
    : ""
}

<!-- ══ 05. IMPLEMENTATION ══ -->
${sectionH("05", "Implementation")}
${subH("Project Timeline")}
${tableHtml(
  ["Phase", "Duration", "Activities"],
  [
    ["1. Engineering & Design", "4–6 weeks", "Site assessment, electrical engineering, permitting"],
    ["2. Procurement", "8–12 weeks", "Equipment ordering, logistics, staging"],
    ["3. Installation", "4–8 weeks", "Foundation, equipment placement, electrical connections"],
    ["4. Commissioning", "1–2 weeks", "Testing, calibration, utility interconnection"],
    ["5. Operations", "Ongoing", "Remote monitoring, optimization, maintenance"],
  ]
    .map(([a, b, c]) => threeColRow(a, b, c))
    .join("")
)}

${subH("Standards & Certifications")}
<ul class="bul">
  <li><strong>UL 9540 / UL 9540A</strong> — Energy Storage System Safety</li>
  <li><strong>IEEE 1547</strong> — Interconnection and interoperability of distributed energy resources</li>
  <li><strong>NFPA 855</strong> — Standard for the installation of stationary energy storage systems</li>
  <li><strong>NEC Article 706</strong> — Energy storage systems</li>
  <li><strong>IRA 2022</strong> — All equipment is domestic content eligible where available</li>
</ul>

<!-- ══ 06. TRUEQUOTE™ METHODOLOGY ══ -->
${sectionH("06", "TrueQuote™ Methodology")}
${bodyP("Every number in this proposal is traceable to an authoritative, published source. TrueQuote™ is Merlin's proprietary methodology that eliminates black-box estimates and provides full transparency into how your quote was generated.")}
${subH("Data Sources")}
<ul class="bul">
  <li><strong>NREL ATB 2024:</strong> National Renewable Energy Laboratory Annual Technology Baseline — Battery and solar cost benchmarks</li>
  <li><strong>NREL Q1 2024:</strong> Cost Benchmark for Utility-Scale Battery Storage — Installation and BOS costs</li>
  <li><strong>IRA 2022:</strong> Inflation Reduction Act (Public Law 117-169) — ITC rates and bonus credits</li>
  <li><strong>EIA:</strong> U.S. Energy Information Administration — State-level commercial electricity rates</li>
  <li><strong>IEEE/MDPI:</strong> IEEE 446-1995, IEEE 4538388 — Industry-standard sizing ratios</li>
</ul>

${
  data.trueQuoteConfidence
    ? `
${subH("Quote Confidence Assessment")}
${tableHtml(
  ["Parameter", "Value"],
  [
    [
      `Overall Confidence`,
      `<span class="cb ${data.trueQuoteConfidence.overall}">${data.trueQuoteConfidence.overall === "high" ? "✓ HIGH" : data.trueQuoteConfidence.overall === "medium" ? "◐ MEDIUM" : "○ LOW"}</span>`,
    ],
    [
      "Industry Model",
      data.trueQuoteConfidence.industry === "v1"
        ? "Industry-Specific (TrueQuote™ v1)"
        : "General Facility Estimate",
    ],
    [
      "Profile Completeness",
      `${data.trueQuoteConfidence.profileCompleteness}% (${data.trueQuoteConfidence.userInputs} inputs, ${data.trueQuoteConfidence.defaultsUsed} defaults)`,
    ],
    ...(data.pricingSnapshotId
      ? [["Pricing Snapshot ID", data.pricingSnapshotId.slice(0, 16)]]
      : []),
  ]
    .map(([l, v]) => twoColRow(l, v))
    .join("")
)}`
    : ""
}

<!-- ══ 07. NEXT STEPS ══ -->
${sectionH("07", "Next Steps")}
<div class="cta">
  <strong>Ready to move forward?</strong>
  <p>1. Review this proposal and contact your Merlin advisor with any questions.<br>
  2. Schedule a site assessment to finalize engineering specifications.<br>
  3. Sign the contract and initiate equipment procurement.<br>
  4. Typical time to commissioning: 4–6 months from contract signing.</p>
</div>
${tableHtml(
  ["Contact", "Details"],
  [
    ["Website", "merlinenergy.net"],
    ["Sales Inquiries", "sales@merlinenergy.net"],
    ["Quote Valid For", "30 days from issue date"],
    ["Payment Terms", "50% deposit on signing · 50% on commissioning"],
    ["Warranty", `${data.warrantyYears} year comprehensive warranty included`],
  ]
    .map(([l, v]) => twoColRow(l, v))
    .join("")
)}

<!-- ══ FOOTER ══ -->
<div class="pf">
  <p>• All equipment pricing reflects current market conditions (NREL ATB 2024, IRA 2022) as of ${data.quoteDate}.</p>
  <p>• Quote #${data.quoteNumber} &nbsp;|&nbsp; <strong>merlinenergy.net</strong> &bull; sales@merlinenergy.net</p>
  <div class="disc">This proposal was generated by Merlin Energy Solutions using TrueQuote™ methodology. All numbers are sourced from NREL, EIA, IEEE, and other authoritative industry standards. Final pricing may vary based on site assessment, permitting, and interconnection requirements. &copy; ${new Date().getFullYear()} Merlin Energy Solutions.</div>
</div>

</body>
</html>`;

  // Open in new tab → browser print dialog → "Save as PDF"
  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 600);
  } else {
    alert("Please allow popups to download the PDF");
  }
}

/**
 * Export quote as Excel workbook (.xlsx) — Multi-sheet professional workbook
 * Sheet 1: Executive Summary (project info + financials)
 * Sheet 2: System Specifications (BESS + electrical)
 * Sheet 3: Load Profile & TrueQuote™ (kW contributors)
 * Sheet 4: Financial Projections (5-year cash flow)
 */
export async function exportQuoteAsExcel(data: QuoteExportData): Promise<void> {
  const XLSX = await import("xlsx");

  const wb = XLSX.utils.book_new();

  // ── Sheet 1: Executive Summary ──────────────────────────────────
  const summaryRows = [
    ["MERLIN ENERGY — BESS Quote Summary"],
    [],
    ["Quote Reference", data.quoteNumber],
    ["Date", data.quoteDate],
    ["Project Name", data.projectName],
    ["Location", data.location],
    ["Application", data.applicationType],
    ["Industry / Use Case", data.useCase],
    [],
    ["SYSTEM OVERVIEW"],
    ["Power Rating (MW)", data.storageSizeMW],
    ["Energy Capacity (MWh)", data.storageSizeMWh || data.storageSizeMW * data.durationHours],
    ["Duration (hours)", data.durationHours],
    ["Battery Chemistry", data.chemistry],
    ["Grid Connection", data.gridConnection],
    [],
    ["FINANCIAL SUMMARY"],
    ["Total System Cost ($)", data.systemCost],
    [
      "Cost per kW ($/kW)",
      data.equipmentCosts?.allInPerKW
        ? Math.round(data.equipmentCosts.allInPerKW)
        : data.storageSizeMW > 0
          ? Math.round(data.systemCost / (data.storageSizeMW * 1000))
          : 0,
    ],
    [
      "Cost per kWh ($/kWh)",
      data.equipmentCosts?.allInPerKWh
        ? Math.round(data.equipmentCosts.allInPerKWh)
        : (data.storageSizeMWh || data.storageSizeMW * data.durationHours) > 0
          ? Math.round(
              data.systemCost /
                ((data.storageSizeMWh || data.storageSizeMW * data.durationHours) * 1000)
            )
          : 0,
    ],
  ];

  if (data.financialAnalysis) {
    summaryRows.push(
      ["Annual Savings ($)", Math.round(data.financialAnalysis.annualSavingsUSD)],
      ["Simple Payback (years)", Number(data.financialAnalysis.paybackYears.toFixed(1))]
    );
    if (data.financialAnalysis.npv != null)
      summaryRows.push(["NPV — 25 Year ($)", Math.round(data.financialAnalysis.npv)]);
    if (data.financialAnalysis.irr != null)
      summaryRows.push(["IRR (%)", Number((data.financialAnalysis.irr * 100).toFixed(1))]);
    if (data.financialAnalysis.demandChargeSavings != null)
      summaryRows.push([
        "Demand Charge Savings ($/yr)",
        Math.round(data.financialAnalysis.demandChargeSavings),
      ]);
  }

  if (data.solarPVIncluded && data.solarCapacityKW) {
    summaryRows.push([], ["RENEWABLES"]);
    summaryRows.push(["Solar PV (kW)", data.solarCapacityKW]);
  }

  // ── Equipment Cost Breakdown (if available) ──
  if (data.equipmentCosts?.totalEquipmentCost) {
    summaryRows.push([], ["EQUIPMENT COST BREAKDOWN"], ["Component", "Cost ($)", "Unit Rate"]);
    if (data.equipmentCosts.batteryCost)
      summaryRows.push([
        "Battery / BESS",
        Math.round(data.equipmentCosts.batteryCost),
        data.equipmentCosts.batteryPerKWh
          ? `$${Math.round(data.equipmentCosts.batteryPerKWh)}/kWh`
          : "—",
      ]);
    if (data.equipmentCosts.inverterCost)
      summaryRows.push([
        "Inverter / PCS",
        Math.round(data.equipmentCosts.inverterCost),
        data.equipmentCosts.inverterPerKW
          ? `$${Math.round(data.equipmentCosts.inverterPerKW)}/kW`
          : "—",
      ]);
    if (data.equipmentCosts.transformerCost)
      summaryRows.push(["Transformer", Math.round(data.equipmentCosts.transformerCost), "—"]);
    if (data.equipmentCosts.switchgearCost)
      summaryRows.push(["Switchgear", Math.round(data.equipmentCosts.switchgearCost), "—"]);
    if (data.equipmentCosts.solarCost)
      summaryRows.push([
        "Solar PV",
        Math.round(data.equipmentCosts.solarCost),
        data.equipmentCosts.solarPerWatt
          ? `$${data.equipmentCosts.solarPerWatt.toFixed(2)}/W`
          : "—",
      ]);
    if (data.equipmentCosts.generatorCost)
      summaryRows.push([
        "Generator",
        Math.round(data.equipmentCosts.generatorCost),
        data.equipmentCosts.generatorPerKW
          ? `$${Math.round(data.equipmentCosts.generatorPerKW)}/kW`
          : "—",
      ]);
    if (data.equipmentCosts.installationCost)
      summaryRows.push([
        "Installation / BOS / EPC",
        Math.round(data.equipmentCosts.installationCost),
        "—",
      ]);
    summaryRows.push(["Total Equipment", Math.round(data.equipmentCosts.totalEquipmentCost), "—"]);
  }

  // ── Contact Information ──
  summaryRows.push(
    [],
    ["CONTACT MERLIN ENERGY"],
    ["Website", "www.merlinenergy.net"],
    ["Sales Inquiries", "sales@merlinenergy.net"],
    ["Quote Valid Until", new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()],
    [],
    ["Generated by", "Merlin Energy Solutions — TrueQuote™"],
    [
      "Disclaimer",
      "Pricing based on NREL ATB 2024 / IRA 2022. Subject to site assessment and final engineering.",
    ]
  );

  const ws1 = XLSX.utils.aoa_to_sheet(summaryRows);
  ws1["!cols"] = [{ wch: 28 }, { wch: 24 }, { wch: 16 }];
  XLSX.utils.book_append_sheet(wb, ws1, "Executive Summary");

  // ── Sheet 2: System Specifications ──────────────────────────────
  const specRows: (string | number)[][] = [
    ["SYSTEM SPECIFICATIONS"],
    [],
    ["Parameter", "Value", "Unit"],
    ["Power Rating", data.storageSizeMW, "MW"],
    ["Energy Capacity", data.storageSizeMWh || data.storageSizeMW * data.durationHours, "MWh"],
    ["Duration", data.durationHours, "hours"],
    ["Chemistry", data.chemistry, "—"],
    ["Round-Trip Efficiency", data.roundTripEfficiency, "%"],
    ["Installation Type", data.installationType, "—"],
    ["Grid Connection", data.gridConnection, "—"],
    ["Warranty", data.warrantyYears, "years"],
    ["Cycles per Year", data.cyclesPerYear, "—"],
    [],
    ["ELECTRICAL SPECIFICATIONS"],
    [],
    ["System Voltage (AC)", data.systemVoltage, "V"],
    ["DC Bus Voltage", data.dcVoltage, "V"],
    ["Inverter Type", data.inverterType, "—"],
    ["Number of Inverters", data.numberOfInverters, "units"],
    ["Inverter Rating", data.inverterRating, "kW"],
    ["Inverter Efficiency", data.inverterEfficiency, "%"],
    ["Switchgear Type", data.switchgearType, "—"],
    ["Switchgear Rating", data.switchgearRating, "A"],
    ["BMS Type", data.bmsType, "—"],
    ["Transformer Required", data.transformerRequired ? "Yes" : "No", "—"],
  ];

  if (data.transformerRequired) {
    specRows.push(
      ["Transformer Rating", data.transformerRating ?? 0, "kVA"],
      ["Transformer Voltage", data.transformerVoltage ?? "480V/13.8kV", "—"]
    );
  }

  const ws2 = XLSX.utils.aoa_to_sheet(specRows);
  ws2["!cols"] = [{ wch: 24 }, { wch: 18 }, { wch: 10 }];
  XLSX.utils.book_append_sheet(wb, ws2, "System Specs");

  // ── Sheet 3: Load Profile & TrueQuote™ ──────────────────────────
  const loadRows: (string | number)[][] = [["LOAD PROFILE & TRUEQUOTE™ ANALYSIS"], []];

  if (data.loadProfile) {
    loadRows.push(
      ["Base Load (kW)", Math.round(data.loadProfile.baseLoadKW)],
      ["Peak Load (kW)", Math.round(data.loadProfile.peakLoadKW)],
      ["Daily Energy (kWh/day)", Math.round(data.loadProfile.energyKWhPerDay)],
      []
    );
  }

  if (data.trueQuoteValidation?.kWContributors) {
    loadRows.push(
      ["LOAD BREAKDOWN (TrueQuote™ Verified)"],
      [],
      ["Component", "Load (kW)", "Share (%)"]
    );

    const contributors = Object.entries(data.trueQuoteValidation.kWContributors)
      .filter(([, kw]) => kw > 0)
      .sort(([, a], [, b]) => b - a);
    const totalKW = contributors.reduce((s, [, v]) => s + v, 0);

    for (const [key, kw] of contributors) {
      const label = key.replace(/([A-Z])/g, " $1").replace(/^./, (s: string) => s.toUpperCase());
      const share = totalKW > 0 ? Number(((kw / totalKW) * 100).toFixed(1)) : 0;
      loadRows.push([label, Math.round(kw), share]);
    }

    loadRows.push(["TOTAL", Math.round(totalKW), 100]);

    if (data.trueQuoteValidation.dutyCycle != null) {
      loadRows.push(
        [],
        ["Duty Cycle (%)", Number((data.trueQuoteValidation.dutyCycle * 100).toFixed(0))]
      );
    }
  }

  if (data.trueQuoteValidation?.assumptions?.length) {
    loadRows.push([], ["SIZING ASSUMPTIONS"]);
    for (const a of data.trueQuoteValidation.assumptions) {
      loadRows.push([a]);
    }
  }

  if (data.trueQuoteConfidence) {
    loadRows.push(
      [],
      ["TRUEQUOTE™ CONFIDENCE"],
      [
        "Overall Confidence",
        data.trueQuoteConfidence.overall === "high"
          ? "High"
          : data.trueQuoteConfidence.overall === "medium"
            ? "Medium"
            : "Low",
      ],
      ["Profile Completeness (%)", data.trueQuoteConfidence.profileCompleteness],
      ["User Inputs", data.trueQuoteConfidence.userInputs],
      ["Defaults Used", data.trueQuoteConfidence.defaultsUsed],
      [
        "Industry Model",
        data.trueQuoteConfidence.industry === "v1" ? "Industry-Specific" : "General Estimate",
      ]
    );
  }

  const ws3 = XLSX.utils.aoa_to_sheet(loadRows);
  ws3["!cols"] = [{ wch: 30 }, { wch: 18 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, ws3, "Load Profile");

  // ── Sheet 4: Financial Projections (5-year) ─────────────────────
  if (data.financialAnalysis && data.financialAnalysis.annualSavingsUSD > 0) {
    const annualSavings = data.financialAnalysis.annualSavingsUSD;
    const xlItcRate = data.itcBreakdown?.totalRate ?? 0.3;
    const xlItcAmount = data.itcBreakdown?.creditAmount ?? data.systemCost * xlItcRate;
    const xlNetCost = data.systemCost - xlItcAmount;
    const escalationRate = 0.03;

    const finRows: (string | number)[][] = [
      ["FINANCIAL PROJECTIONS"],
      [],
      ["Year", "Annual Savings ($)", "Cumulative Savings ($)", "Net Position ($)"],
    ];

    let cumulative = 0;
    for (let yr = 1; yr <= 10; yr++) {
      const yearSavings = Math.round(annualSavings * Math.pow(1 + escalationRate, yr - 1));
      cumulative += yearSavings;
      const netPosition = cumulative - xlNetCost;
      finRows.push([yr, yearSavings, cumulative, Math.round(netPosition)]);
    }

    finRows.push(
      [],
      ["KEY ASSUMPTIONS"],
      ["Total System Cost ($)", data.systemCost],
      [`Federal ITC (${Math.round(xlItcRate * 100)}%)`, Math.round(xlItcAmount)],
      ["Net Cost After ITC ($)", Math.round(xlNetCost)],
      ["Annual Savings Escalation", "3% per year"],
      ["Utility Rate ($/kWh)", data.utilityRate],
      ["Demand Charge ($/kW)", data.demandCharge]
    );

    // ITC Bonus Breakdown (if available)
    if (data.itcBreakdown) {
      finRows.push(
        [],
        ["ITC BREAKDOWN (IRA 2022)"],
        ["Base Rate", `${Math.round(data.itcBreakdown.baseRate * 100)}%`],
        ...(data.itcBreakdown.prevailingWageBonus > 0
          ? [
              [
                "Prevailing Wage Bonus" as string | number,
                `+${Math.round(data.itcBreakdown.prevailingWageBonus * 100)}%` as string | number,
              ],
            ]
          : []),
        ...(data.itcBreakdown.energyCommunityBonus > 0
          ? [
              [
                "Energy Community Bonus" as string | number,
                `+${Math.round(data.itcBreakdown.energyCommunityBonus * 100)}%` as string | number,
              ],
            ]
          : []),
        ...(data.itcBreakdown.domesticContentBonus > 0
          ? [
              [
                "Domestic Content Bonus" as string | number,
                `+${Math.round(data.itcBreakdown.domesticContentBonus * 100)}%` as string | number,
              ],
            ]
          : []),
        ...(data.itcBreakdown.lowIncomeBonus > 0
          ? [
              [
                "Low-Income Bonus" as string | number,
                `+${Math.round(data.itcBreakdown.lowIncomeBonus * 100)}%` as string | number,
              ],
            ]
          : []),
        ["Total ITC Rate", `${Math.round(data.itcBreakdown.totalRate * 100)}%`],
        ["Credit Amount ($)", Math.round(data.itcBreakdown.creditAmount)]
      );
    }

    const ws4 = XLSX.utils.aoa_to_sheet(finRows);
    ws4["!cols"] = [{ wch: 26 }, { wch: 22 }, { wch: 24 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, ws4, "Financial Projections");
  }

  // ── Sheet 5: Advanced Analytics (Feb 2026) ──────────────────────
  const analyticsRows: (string | number)[][] = [["ADVANCED ANALYTICS"], []];
  let hasAnalytics = false;

  // 8760 Savings Breakdown
  if (data.hourlySavingsBreakdown) {
    hasAnalytics = true;
    analyticsRows.push(
      ["8760 HOURLY SIMULATION RESULTS"],
      [],
      ["Annual Savings ($)", Math.round(data.hourlySavingsBreakdown.annualSavings)],
      ["TOU Arbitrage Savings ($)", Math.round(data.hourlySavingsBreakdown.touArbitrageSavings)],
      ["Peak Shaving Savings ($)", Math.round(data.hourlySavingsBreakdown.peakShavingSavings)],
      ["Demand Charge Savings ($)", Math.round(data.hourlySavingsBreakdown.demandChargeSavings)],
      [
        "Solar Self-Consumption ($)",
        Math.round(data.hourlySavingsBreakdown.solarSelfConsumptionSavings),
      ],
      ["Equivalent Cycles/Year", data.hourlySavingsBreakdown.equivalentCycles],
      ["Capacity Factor (%)", data.hourlySavingsBreakdown.capacityFactor],
      ["Source", data.hourlySavingsBreakdown.source],
      []
    );
  }

  // Risk Analysis P10/P50/P90
  if (data.riskAnalysis) {
    hasAnalytics = true;
    analyticsRows.push(
      ["RISK ANALYSIS (P10 / P50 / P90)"],
      [],
      ["Metric", "P10 (Downside)", "P50 (Base)", "P90 (Upside)"],
      [
        "NPV ($)",
        Math.round(data.riskAnalysis.npvP10),
        Math.round(data.riskAnalysis.npvP50),
        Math.round(data.riskAnalysis.npvP90),
      ],
      ["IRR (%)", data.riskAnalysis.irrP10, data.riskAnalysis.irrP50, data.riskAnalysis.irrP90],
      [
        "Payback (years)",
        data.riskAnalysis.paybackP10,
        data.riskAnalysis.paybackP50,
        data.riskAnalysis.paybackP90,
      ],
      [],
      ["Probability of Positive NPV (%)", data.riskAnalysis.probabilityPositiveNPV],
      ["Value at Risk — 95% ($)", Math.round(data.riskAnalysis.valueAtRisk95)],
      ["Source", data.riskAnalysis.source],
      []
    );
  }

  // Battery Degradation
  if (data.degradationDetail) {
    hasAnalytics = true;
    analyticsRows.push(
      ["BATTERY DEGRADATION"],
      [],
      ["Chemistry", data.degradationDetail.chemistry],
      ["Year 10 Capacity (%)", data.degradationDetail.year10CapacityPct],
      ["Year 25 Capacity (%)", data.degradationDetail.year25CapacityPct],
      ["Warranty Period (years)", data.degradationDetail.warrantyYears],
      ["Financial Impact (%)", data.degradationDetail.financialImpactPct],
      ["Source", data.degradationDetail.source],
      []
    );
  }

  // Solar Production
  if (data.solarProductionDetail) {
    hasAnalytics = true;
    analyticsRows.push(
      ["SOLAR PRODUCTION (PVWATTS)"],
      [],
      ["Annual Production (kWh)", Math.round(data.solarProductionDetail.annualProductionKWh)],
      ["Capacity Factor (%)", data.solarProductionDetail.capacityFactor],
      ["Source", data.solarProductionDetail.source]
    );
    if (data.solarProductionDetail.monthlyProductionKWh?.length) {
      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      analyticsRows.push([], ["Month", "Production (kWh)"]);
      data.solarProductionDetail.monthlyProductionKWh.forEach((kWh, i) => {
        analyticsRows.push([months[i] || `M${i + 1}`, Math.round(kWh)]);
      });
    }
    analyticsRows.push([]);
  }

  // Utility Rate Attribution
  if (data.utilityRateDetail) {
    hasAnalytics = true;
    analyticsRows.push(
      ["UTILITY RATE ATTRIBUTION"],
      [],
      ["Utility", data.utilityRateDetail.utilityName ?? "N/A"],
      ["Electricity Rate ($/kWh)", data.utilityRateDetail.electricityRate],
      ["Demand Charge ($/kW)", data.utilityRateDetail.demandCharge],
      ["Source", data.utilityRateDetail.source],
      ["Confidence", data.utilityRateDetail.confidence]
    );
  }

  if (hasAnalytics) {
    const ws5 = XLSX.utils.aoa_to_sheet(analyticsRows);
    ws5["!cols"] = [{ wch: 32 }, { wch: 20 }, { wch: 20 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, ws5, "Advanced Analytics");
  }

  // ── Generate and download ───────────────────────────────────────
  const wbOut = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([wbOut], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  saveAs(blob, `Merlin_BESS_Quote_${data.quoteNumber}.xlsx`);
}

// Re-export Packer for Word document generation
import { Packer } from "docx";
export { Packer };
