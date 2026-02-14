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
  const roi25Year =
    annualSavings > 0 && data.systemCost > 0
      ? ((annualSavings * 25 - data.systemCost) / data.systemCost) * 100
      : 0;
  const lifetimeSavings = annualSavings * 25;
  const itcRate = data.financialAnalysis ? 0.3 : 0;
  const itcAmount = data.systemCost * itcRate;
  const netCost = data.systemCost - itcAmount;
  const demandChargeSavings =
    data.financialAnalysis?.demandChargeSavings ?? data.demandCharge * storageKW * 0.5 * 12;

  const fmt = (v: number) =>
    `$${v.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  const fmtDec = (v: number) =>
    `$${v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const fmtPct = (v: number) => `${v.toFixed(1)}%`;
  const fmtNum = (v: number) => v.toLocaleString("en-US");

  // ── Professional color palette (Supabase-inspired, WHITE background) ─
  const C = {
    emerald: "1B8F5A", // Dark green — readable on white
    emeraldLight: "3ECF8E", // Light green accent
    emeraldBg: "EDFDF5", // Very light green bg for tables
    navy: "1A1F36", // Primary text
    dark: "2D3748", // Secondary text
    body: "4A5568", // Body text
    muted: "718096", // Muted/caption text
    border: "E2E8F0", // Table borders
    headerBg: "1A1F36", // Dark header bg for tables
    headerText: "FFFFFF", // White text on dark bg
    highlight: "F0FFF4", // Highlight rows
    amber: "D97706",
    red: "DC2626",
    // ── Dark panels (matches Merlin Wizard advisor rail) ──
    panelDark: "0F1420", // Wizard dark background
    panelDarkAlt: "1A1F36", // Slightly lighter dark
    lightGrey: "F1F5F9", // Light grey sub-panel
    lightGreyDark: "E2E8F0", // Slightly darker grey
    gold: "D4A017", // Gold accent for TrueQuote badge
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
  const sectionHeading = (num: string, text: string) =>
    new Paragraph({
      children: [
        new TextRun({ text: `${num}  `, size: 28, bold: true, color: C.emerald }),
        new TextRun({ text: text.toUpperCase(), size: 28, bold: true, color: C.navy }),
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
            children: [new TextRun({ text: " ", size: 16 })],
            spacing: { after: 0 },
          }),
          // Company name + Merlin icon
          new Paragraph({
            shading: { type: ShadingType.SOLID, color: C.panelDark },
            spacing: { after: 120 },
            children: [
              new TextRun({ text: "  ", size: 10 }),
              new ImageRun({
                data: merlinProfileImg,
                transformation: { width: 44, height: 38 },
                type: "png",
              }),
              new TextRun({ text: "  ", size: 10 }),
              new TextRun({ text: "MERLIN", size: 44, bold: true, color: C.headerText }),
              new TextRun({ text: "  ENERGY SOLUTIONS", size: 24, color: "8B9DC3" }),
            ],
          }),
          // Emerald accent line
          new Paragraph({
            shading: { type: ShadingType.SOLID, color: C.panelDark },
            children: [],
            border: {
              bottom: { color: C.emeraldLight, space: 2, style: BorderStyle.SINGLE, size: 10 },
            },
            spacing: { after: 160 },
          }),
          // Title
          new Paragraph({
            shading: { type: ShadingType.SOLID, color: C.panelDark },
            spacing: { after: 80 },
            children: [
              new TextRun({ text: "  ", size: 10 }),
              new TextRun({
                text: "Battery Energy Storage System",
                size: 38,
                bold: true,
                color: C.headerText,
              }),
            ],
          }),
          // Subtitle with TrueQuote badge inline
          new Paragraph({
            shading: { type: ShadingType.SOLID, color: C.panelDark },
            spacing: { after: 100 },
            children: [
              new TextRun({ text: "  ", size: 10 }),
              new TextRun({
                text: "PROFESSIONAL PROPOSAL",
                size: 24,
                bold: true,
                color: C.emeraldLight,
              }),
              new TextRun({ text: "     ", size: 24 }),
              new ImageRun({
                data: truequoteBadgeImg,
                transformation: { width: 28, height: 33 },
                type: "png",
              }),
              new TextRun({ text: " ", size: 10 }),
              new TextRun({ text: "TrueQuote™ Verified", size: 20, bold: true, color: "FFD700" }),
            ],
          }),
          // Bottom padding
          new Paragraph({
            shading: { type: ShadingType.SOLID, color: C.panelDark },
            children: [new TextRun({ text: " ", size: 12 })],
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
          ...(itcAmount > 0 ? [metricBox("Federal ITC Credit (30%)", `– ${fmt(itcAmount)}`)] : []),
          ...(netCost !== data.systemCost
            ? [metricBox("Net Investment After Incentives", fmt(netCost))]
            : []),
          metricBox("Estimated Annual Savings", `${fmt(annualSavings)}/year`),
          ...(paybackYears > 0
            ? [metricBox("Simple Payback Period", `${paybackYears.toFixed(1)} years`)]
            : []),
          ...(roi25Year > 0 ? [metricBox("25-Year Lifetime ROI", fmtPct(roi25Year))] : []),
          ...(lifetimeSavings > 0
            ? [metricBox("Projected 25-Year Savings", fmt(lifetimeSavings))]
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
            ? [
                bodyParagraph(
                  "Your facility's power demand was analyzed using industry-specific load modeling. Each contributor below has been independently sized using authoritative standards."
                ),
                subHeading("Load Breakdown — TrueQuote™ Verified"),
                makeTable(
                  ["Load Component", "Peak Demand (kW)", "Share of Total"],
                  Object.entries(data.trueQuoteValidation.kWContributors)
                    .filter(([, kw]) => kw > 0)
                    .sort(([, a], [, b]) => b - a)
                    .map(([key, kw]) => {
                      const share = data.trueQuoteValidation?.kWContributorShares?.[key];
                      const label = key
                        .replace(/_/g, " ")
                        .replace(/([A-Z])/g, " $1")
                        .replace(/^./, (s) => s.toUpperCase())
                        .trim();
                      return [
                        label,
                        `${fmtNum(Math.round(kw))} kW`,
                        share != null ? fmtPct(share * 100) : "—",
                      ];
                    }),
                  2
                ),
                ...(data.trueQuoteValidation.dutyCycle != null
                  ? [
                      spacer(80),
                      kvRow(
                        "Facility Duty Cycle",
                        fmtPct(data.trueQuoteValidation.dutyCycle * 100),
                        C.emerald
                      ),
                    ]
                  : []),
                spacer(100),
                ...(data.trueQuoteValidation.assumptions?.length
                  ? [
                      subHeading("Sizing Methodology & Sources"),
                      ...data.trueQuoteValidation.assumptions.map((a) => bullet(a)),
                    ]
                  : []),
              ]
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
                ? [["Federal Investment Tax Credit (ITC — 30%)", `– ${fmt(itcAmount)}`]]
                : []),
              ...(netCost !== data.systemCost ? [["Net Cost After Incentives", fmt(netCost)]] : []),
            ],
            1
          ),
          spacer(200),

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
              ...(roi25Year !== 0
                ? [["25-Year Lifetime ROI", fmtPct(roi25Year), "Full system lifespan"]]
                : []),
              ...(lifetimeSavings > 0
                ? [["25-Year Cumulative Savings", fmt(lifetimeSavings), "Undiscounted"]]
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
                text: "solutions@merlin.energy  •  merlin.energy",
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
                color: "8B9DC3",
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
            shading: { type: ShadingType.SOLID, color: C.lightGrey },
            children: [new TextRun({ text: " ", size: 8 })],
            spacing: { after: 0 },
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            shading: { type: ShadingType.SOLID, color: C.lightGrey },
            spacing: { after: 60 },
            children: [
              new ImageRun({
                data: proquoteBadgeImg,
                transformation: { width: 32, height: 40 },
                type: "png",
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            shading: { type: ShadingType.SOLID, color: C.lightGrey },
            spacing: { after: 40 },
            children: [
              new TextRun({ text: "Want more detail?  ", size: 22, color: C.dark }),
              new TextRun({
                text: "Consider ProQuote™",
                size: 22,
                bold: true,
                color: C.panelDarkAlt,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            shading: { type: ShadingType.SOLID, color: C.lightGrey },
            spacing: { after: 40 },
            children: [
              new TextRun({
                text: "For a more detailed quote — including detailed engineering, 8760 hourly analysis, Monte Carlo risk modeling,",
                size: 18,
                color: C.muted,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            shading: { type: ShadingType.SOLID, color: C.lightGrey },
            spacing: { after: 40 },
            children: [
              new TextRun({
                text: "bank-ready financial statements, and project-specific site assessment — upgrade to ",
                size: 18,
                color: C.muted,
              }),
              new TextRun({ text: "ProQuote™", size: 18, bold: true, color: C.panelDarkAlt }),
              new TextRun({ text: ".", size: 18, color: C.muted }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            shading: { type: ShadingType.SOLID, color: C.lightGrey },
            children: [new TextRun({ text: " ", size: 8 })],
            spacing: { after: 100 },
          }),

          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: "— End of Proposal —", size: 18, color: C.muted, italics: true }),
            ],
          }),
        ],
      },
    ],
  });

  // ── Generate and download ────────────────────────────────────────
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
  const roi10Year =
    annualSavings > 0 && data.systemCost > 0
      ? ((annualSavings * 10 - data.systemCost) / data.systemCost) * 100
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
      <div class="section-heading">${data.trueQuoteValidation?.kWContributors ? (data.financialAnalysis ? "5" : "4") : data.financialAnalysis ? "4" : "3"}. TrueQuote™ CONFIDENCE</div>
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
