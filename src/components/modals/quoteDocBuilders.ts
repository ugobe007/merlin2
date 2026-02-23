/**
 * @fileoverview quoteDocBuilders — Section builder functions for Word document generation
 *
 * Extracted from quotePreviewWordDoc.ts (Op11 - Feb 2026)
 * Each function receives DocContext and returns (Paragraph | Table)[].
 */

import {
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  PageBreak,
  ImageRun,
  BorderStyle,
} from "docx";
import type { QuotePreviewData } from "./quotePreviewWordDoc";
import type { VendorProduct, EVChargerProduct } from "../../data/vendorEquipment";
import type { EquipmentType } from "../../utils/equipmentImageLibrary";

/** Context passed to all section builder functions */
export interface DocContext {
  // Quote data
  clientName: string;
  projectName: string;
  bessPowerMW: number;
  batteryMWh: number;
  duration: number;
  solarMW: number;
  windMW: number;
  generatorMW: number;
  gridConnection: string;
  application: string;
  location: string;
  tariffRegion?: string;
  shippingDestination?: string;
  projectTimeframe?: string;
  primaryGoal?: string;
  warranty: string;
  costs: QuotePreviewData["costs"];
  annualSavings: number;
  paybackPeriod: number;
  budget?: number;
  // Pre-computed values
  coreEquipmentTotal: number;
  renewablesTotal: number;
  equipmentTotal: number;
  implementationEstimate: number;
  batteryPricePerKWh: number;
  pricePerKWh: number;
  allInPerKWh: number;
  npv10yr: number;
  irrPercent: number;
  calcTables: (Paragraph | Table)[];
  bmsCost: number;
  essEnclosureCost: number;
  monitoringCost: number;
  merlinImageData: ArrayBuffer | null;
  iconOrEmoji: (type: EquipmentType) => ImageRun | TextRun;
  // Equipment from vendor selection
  selectedBattery: VendorProduct | null;
  selectedInverter: VendorProduct | null;
  selectedEvCharger: EVChargerProduct | null;
}

export type DocBlock = (Paragraph | Table)[];

/**
 * Build SALES HEADER section
 * Lines 661–800 of original quotePreviewWordDoc.ts
 */

export function buildSalesHeader(ctx: DocContext): DocBlock {
  const {
    clientName,
    projectName,
    bessPowerMW,
    batteryMWh,
    duration,
    solarMW,
    windMW,
    generatorMW,
    gridConnection,
    application,
    location,
    tariffRegion,
    shippingDestination,
    projectTimeframe,
    primaryGoal,
    warranty,
    costs,
    annualSavings,
    paybackPeriod,
    budget,
    coreEquipmentTotal,
    renewablesTotal,
    equipmentTotal,
    implementationEstimate,
    batteryPricePerKWh,
    pricePerKWh,
    allInPerKWh,
    npv10yr,
    irrPercent,
    calcTables,
    merlinImageData,
    iconOrEmoji,
    selectedBattery,
    selectedInverter,
    selectedEvCharger,
  } = ctx;

  void clientName;
  void projectName;
  void bessPowerMW;
  void batteryMWh;
  void duration;
  void solarMW;
  void windMW;
  void generatorMW;
  void gridConnection;
  void application;
  void location;
  void tariffRegion;
  void shippingDestination;
  void projectTimeframe;
  void primaryGoal;
  void warranty;
  void costs;
  void annualSavings;
  void paybackPeriod;
  void budget;
  void coreEquipmentTotal;
  void renewablesTotal;
  void equipmentTotal;
  void implementationEstimate;
  void batteryPricePerKWh;
  void pricePerKWh;
  void allInPerKWh;
  void npv10yr;
  void irrPercent;
  void calcTables;
  void merlinImageData;
  void iconOrEmoji;
  void selectedBattery;
  void selectedInverter;
  void selectedEvCharger;

  return [
    // SALES HEADER — Clean navy panel with Merlin branding
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 65, type: WidthType.PERCENTAGE },
              shading: { fill: "1E3350" },
              borders: {
                top: { style: BorderStyle.NONE, size: 0 },
                bottom: { style: BorderStyle.NONE, size: 0 },
                left: { style: BorderStyle.NONE, size: 0 },
                right: { style: BorderStyle.NONE, size: 0 },
              },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "BESS PROPOSAL",
                      bold: true,
                      size: 52,
                      color: "FFFFFF",
                      font: "Helvetica",
                    }),
                  ],
                  spacing: { before: 300, after: 60 },
                }),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `$${pricePerKWh}/kWh`,
                      bold: true,
                      size: 40,
                      color: "FBBF24",
                      font: "Helvetica",
                    }),
                    new TextRun({
                      text: "  Battery Market Rate",
                      size: 20,
                      color: "94A3B8",
                      font: "Helvetica",
                    }),
                  ],
                  spacing: { after: 80 },
                }),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "✦ TrueQuote™ Verified",
                      bold: true,
                      size: 20,
                      color: "FBBF24",
                      font: "Helvetica",
                    }),
                    new TextRun({
                      text: "  ·  NREL, EIA, IEEE & industry sources",
                      size: 18,
                      color: "94A3B8",
                      font: "Helvetica",
                    }),
                  ],
                  spacing: { after: 300 },
                }),
              ],
            }),
            new TableCell({
              width: { size: 35, type: WidthType.PERCENTAGE },
              shading: { fill: "162844" },
              borders: {
                top: { style: BorderStyle.NONE, size: 0 },
                bottom: { style: BorderStyle.NONE, size: 0 },
                left: { style: BorderStyle.NONE, size: 0 },
                right: { style: BorderStyle.NONE, size: 0 },
              },
              children: [
                ...(merlinImageData
                  ? [
                      new Paragraph({
                        children: [
                          new ImageRun({
                            type: "png",
                            data: merlinImageData,
                            transformation: { width: 110, height: 95 },
                          }),
                        ],
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 200, after: 60 },
                      }),
                    ]
                  : [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: "MERLIN",
                            bold: true,
                            size: 56,
                            font: "Helvetica",
                            color: "3ECF8E",
                          }),
                        ],
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 200, after: 60 },
                      }),
                    ]),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "MERLIN",
                      bold: true,
                      size: 44,
                      color: "FBBF24",
                      font: "Helvetica",
                    }),
                  ],
                  alignment: AlignmentType.CENTER,
                  spacing: { after: 20 },
                }),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Energy Solutions",
                      italics: true,
                      size: 22,
                      color: "CBD5E1",
                      font: "Helvetica",
                    }),
                  ],
                  alignment: AlignmentType.CENTER,
                  spacing: { after: 200 },
                }),
              ],
            }),
          ],
        }),
      ],
    }),

    new Paragraph({ text: "", spacing: { after: 200 } }),
  ];
}

/**
 * Build PROJECT INFORMATION section
 * Lines 801–1058 of original quotePreviewWordDoc.ts
 */

export function buildProjectInfo(ctx: DocContext): DocBlock {
  const {
    clientName,
    projectName,
    bessPowerMW,
    batteryMWh,
    duration,
    solarMW,
    windMW,
    generatorMW,
    gridConnection,
    application,
    location,
    tariffRegion,
    shippingDestination,
    projectTimeframe,
    primaryGoal,
    warranty,
    costs,
    annualSavings,
    paybackPeriod,
    budget,
    coreEquipmentTotal,
    renewablesTotal,
    equipmentTotal,
    implementationEstimate,
    batteryPricePerKWh,
    pricePerKWh,
    allInPerKWh,
    npv10yr,
    irrPercent,
    calcTables,
    merlinImageData,
    iconOrEmoji,
    selectedBattery,
    selectedInverter,
    selectedEvCharger,
  } = ctx;

  void clientName;
  void projectName;
  void bessPowerMW;
  void batteryMWh;
  void duration;
  void solarMW;
  void windMW;
  void generatorMW;
  void gridConnection;
  void application;
  void location;
  void tariffRegion;
  void shippingDestination;
  void projectTimeframe;
  void primaryGoal;
  void warranty;
  void costs;
  void annualSavings;
  void paybackPeriod;
  void budget;
  void coreEquipmentTotal;
  void renewablesTotal;
  void equipmentTotal;
  void implementationEstimate;
  void batteryPricePerKWh;
  void pricePerKWh;
  void allInPerKWh;
  void npv10yr;
  void irrPercent;
  void calcTables;
  void merlinImageData;
  void iconOrEmoji;
  void selectedBattery;
  void selectedInverter;
  void selectedEvCharger;

  return [
    // PROJECT INFORMATION — 4-Column Grid
    new Paragraph({
      children: [
        new TextRun({
          text: "PROJECT INFORMATION",
          bold: true,
          size: 30,
          color: "1E3350",
          font: "Helvetica",
        }),
      ],
      spacing: { before: 100, after: 200 },
      shading: { fill: "F0F2F7" },
    }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 18, type: WidthType.PERCENTAGE },
              shading: { fill: "F0F2F7" },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Client Name",
                      bold: true,
                      size: 20,
                      font: "Helvetica",
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              width: { size: 32, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  children: [new TextRun({ text: clientName || "—", size: 20, font: "Helvetica" })],
                }),
              ],
            }),
            new TableCell({
              width: { size: 18, type: WidthType.PERCENTAGE },
              shading: { fill: "F0F2F7" },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Project Name",
                      bold: true,
                      size: 20,
                      font: "Helvetica",
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              width: { size: 32, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: projectName || "—", size: 20, font: "Helvetica" }),
                  ],
                }),
              ],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              shading: { fill: "F0F2F7" },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Quote Date",
                      bold: true,
                      size: 20,
                      font: "Helvetica",
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: new Date().toLocaleDateString(),
                      size: 20,
                      font: "Helvetica",
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              shading: { fill: "F0F2F7" },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Location",
                      bold: true,
                      size: 20,
                      font: "Helvetica",
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: location || "United States",
                      size: 20,
                      font: "Helvetica",
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              shading: { fill: "F0F2F7" },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "System Size",
                      bold: true,
                      size: 20,
                      font: "Helvetica",
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `${bessPowerMW} MW / ${batteryMWh.toFixed(1)} MWh (${duration}h)`,
                      size: 20,
                      font: "Helvetica",
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              shading: { fill: "F0F2F7" },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Use Case",
                      bold: true,
                      size: 20,
                      font: "Helvetica",
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: (application || primaryGoal || "Peak Shaving")
                        .replace(/-/g, " ")
                        .replace(/\b\w/g, (l: string) => l.toUpperCase()),
                      size: 20,
                      font: "Helvetica",
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              shading: { fill: "F0F2F7" },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Grid Mode",
                      bold: true,
                      size: 20,
                      font: "Helvetica",
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: (gridConnection || "On-Grid")
                        .replace(/-/g, " ")
                        .replace(/\b\w/g, (l: string) => l.toUpperCase()),
                      size: 20,
                      font: "Helvetica",
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              shading: { fill: "F0F2F7" },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Warranty",
                      bold: true,
                      size: 20,
                      font: "Helvetica",
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [new TextRun({ text: `${warranty}`, size: 20, font: "Helvetica" })],
                }),
              ],
            }),
          ],
        }),
      ],
    }),

    new Paragraph({ text: "", spacing: { after: 400 } }),
  ];
}

/**
 * Build EXECUTIVE SUMMARY section
 * Lines 1059–1376 of original quotePreviewWordDoc.ts
 */

export function buildExecutiveSummary(ctx: DocContext): DocBlock {
  const {
    clientName,
    projectName,
    bessPowerMW,
    batteryMWh,
    duration,
    solarMW,
    windMW,
    generatorMW,
    gridConnection,
    application,
    location,
    tariffRegion,
    shippingDestination,
    projectTimeframe,
    primaryGoal,
    warranty,
    costs,
    annualSavings,
    paybackPeriod,
    budget,
    coreEquipmentTotal,
    renewablesTotal,
    equipmentTotal,
    implementationEstimate,
    batteryPricePerKWh,
    pricePerKWh,
    allInPerKWh,
    npv10yr,
    irrPercent,
    calcTables,
    merlinImageData,
    iconOrEmoji,
    selectedBattery,
    selectedInverter,
    selectedEvCharger,
  } = ctx;

  void clientName;
  void projectName;
  void bessPowerMW;
  void batteryMWh;
  void duration;
  void solarMW;
  void windMW;
  void generatorMW;
  void gridConnection;
  void application;
  void location;
  void tariffRegion;
  void shippingDestination;
  void projectTimeframe;
  void primaryGoal;
  void warranty;
  void costs;
  void annualSavings;
  void paybackPeriod;
  void budget;
  void coreEquipmentTotal;
  void renewablesTotal;
  void equipmentTotal;
  void implementationEstimate;
  void batteryPricePerKWh;
  void pricePerKWh;
  void allInPerKWh;
  void npv10yr;
  void irrPercent;
  void calcTables;
  void merlinImageData;
  void iconOrEmoji;
  void selectedBattery;
  void selectedInverter;
  void selectedEvCharger;

  return [
    // 1. EXECUTIVE SUMMARY
    new Paragraph({
      border: {
        top: { color: "E2E8F0", space: 4, style: BorderStyle.SINGLE, size: 6 },
      },
      children: [],
      spacing: { before: 300, after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: "1. EXECUTIVE SUMMARY",
          bold: true,
          size: 30,
          color: "FFFFFF",
          font: "Helvetica",
        }),
      ],
      spacing: { before: 100, after: 200 },
      shading: { fill: "1E3350" },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `This proposal delivers a ${batteryMWh.toFixed(1)} MWh Battery Energy Storage System at $${pricePerKWh}/kWh (battery) — designed to reduce your energy costs by $${annualSavings.toLocaleString()} annually with a ${paybackPeriod.toFixed(1)}-year payback.`,
          size: 24,
          font: "Helvetica",
        }),
      ],
      spacing: { after: 250 },
    }),

    // Executive Summary Metrics Table
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "KEY METRIC",
                      bold: true,
                      size: 24,
                      color: "FFFFFF",
                      font: "Helvetica",
                    }),
                  ],
                }),
              ],
              shading: { fill: "1E3350" },
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "VALUE",
                      bold: true,
                      size: 24,
                      color: "FBBF24",
                      font: "Helvetica",
                    }),
                  ],
                }),
              ],
              shading: { fill: "1E3350" },
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Battery Price ($/kWh)",
                      bold: true,
                      size: 26,
                      font: "Helvetica",
                    }),
                  ],
                }),
              ],
              shading: { fill: "ECFDF5" },
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `$${pricePerKWh}/kWh`,
                      bold: true,
                      size: 26,
                      color: "065F46",
                      font: "Helvetica",
                    }),
                  ],
                }),
              ],
              shading: { fill: "ECFDF5" },
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "System Capacity",
                      bold: true,
                      size: 24,
                      font: "Helvetica",
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `${batteryMWh.toFixed(1)} MWh / ${bessPowerMW} MW`,
                      bold: true,
                      size: 24,
                      color: "1E3350",
                      font: "Helvetica",
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Equipment Investment",
                      bold: true,
                      size: 24,
                      font: "Helvetica",
                    }),
                  ],
                }),
              ],
              shading: { fill: "F0F2F7" },
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `$${equipmentTotal.toLocaleString()}`,
                      bold: true,
                      size: 24,
                      color: "1E3350",
                      font: "Helvetica",
                    }),
                  ],
                }),
              ],
              shading: { fill: "F0F2F7" },
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Annual Energy Savings",
                      bold: true,
                      size: 24,
                      font: "Helvetica",
                    }),
                  ],
                }),
              ],
              shading: { fill: "ECFDF5" },
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `$${annualSavings.toLocaleString()}/year`,
                      bold: true,
                      size: 24,
                      color: "059669",
                      font: "Helvetica",
                    }),
                  ],
                }),
              ],
              shading: { fill: "ECFDF5" },
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Payback Period",
                      bold: true,
                      size: 24,
                      font: "Helvetica",
                    }),
                  ],
                }),
              ],
              shading: { fill: "FEF9E7" },
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `${paybackPeriod.toFixed(1)} years`,
                      bold: true,
                      size: 24,
                      color: "D97706",
                      font: "Helvetica",
                    }),
                  ],
                }),
              ],
              shading: { fill: "FEF9E7" },
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "10-Year Net Savings",
                      bold: true,
                      size: 24,
                      font: "Helvetica",
                    }),
                  ],
                }),
              ],
              shading: { fill: "ECFDF5" },
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `$${(annualSavings * 10 - equipmentTotal).toLocaleString()}`,
                      bold: true,
                      size: 24,
                      color: "059669",
                      font: "Helvetica",
                    }),
                  ],
                }),
              ],
              shading: { fill: "ECFDF5" },
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "System Warranty",
                      bold: true,
                      size: 24,
                      font: "Helvetica",
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `${warranty} Years`,
                      bold: true,
                      size: 24,
                      color: "1E3350",
                      font: "Helvetica",
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    }),

    new Paragraph({ text: "", spacing: { after: 400 } }),
  ];
}

/**
 * Build PROJECT OVERVIEW section
 * Lines 1377–1455 of original quotePreviewWordDoc.ts
 */

export function buildProjectOverview(ctx: DocContext): DocBlock {
  const {
    clientName,
    projectName,
    bessPowerMW,
    batteryMWh,
    duration,
    solarMW,
    windMW,
    generatorMW,
    gridConnection,
    application,
    location,
    tariffRegion,
    shippingDestination,
    projectTimeframe,
    primaryGoal,
    warranty,
    costs,
    annualSavings,
    paybackPeriod,
    budget,
    coreEquipmentTotal,
    renewablesTotal,
    equipmentTotal,
    implementationEstimate,
    batteryPricePerKWh,
    pricePerKWh,
    allInPerKWh,
    npv10yr,
    irrPercent,
    calcTables,
    merlinImageData,
    iconOrEmoji,
    selectedBattery,
    selectedInverter,
    selectedEvCharger,
  } = ctx;

  void clientName;
  void projectName;
  void bessPowerMW;
  void batteryMWh;
  void duration;
  void solarMW;
  void windMW;
  void generatorMW;
  void gridConnection;
  void application;
  void location;
  void tariffRegion;
  void shippingDestination;
  void projectTimeframe;
  void primaryGoal;
  void warranty;
  void costs;
  void annualSavings;
  void paybackPeriod;
  void budget;
  void coreEquipmentTotal;
  void renewablesTotal;
  void equipmentTotal;
  void implementationEstimate;
  void batteryPricePerKWh;
  void pricePerKWh;
  void allInPerKWh;
  void npv10yr;
  void irrPercent;
  void calcTables;
  void merlinImageData;
  void iconOrEmoji;
  void selectedBattery;
  void selectedInverter;
  void selectedEvCharger;

  return [
    // 2. PROJECT OVERVIEW & VISUALIZATION
    new Paragraph({
      border: {
        bottom: { color: "FBBF24", space: 2, style: BorderStyle.SINGLE, size: 6 },
      },
      children: [],
      spacing: { before: 400, after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: "2. PROJECT OVERVIEW & VISUALIZATION",
          bold: true,
          size: 30,
          color: "1E3350",
          font: "Helvetica",
        }),
      ],
      spacing: { before: 100, after: 200 },
      shading: { fill: "F0F2F7" },
    }),
    new Paragraph({
      text: `The proposed system integrates with your existing infrastructure to provide energy storage, peak shaving, and grid stabilization.`,
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [new TextRun({ text: "Project Site Layout & Configuration:", bold: true })],
      spacing: { before: 200, after: 100 },
    }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  children: [new TextRun({ text: "📸 PROJECT SITE PHOTO", bold: true })],
                  alignment: AlignmentType.CENTER,
                }),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "[Insert aerial or ground-level photo of installation site]",
                      italics: true,
                    }),
                  ],
                  alignment: AlignmentType.CENTER,
                  spacing: { before: 100 },
                }),
              ],
            }),
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  children: [new TextRun({ text: "🔧 SYSTEM DIAGRAM", bold: true })],
                  alignment: AlignmentType.CENTER,
                }),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "[Insert technical diagram showing BESS configuration and connections]",
                      italics: true,
                    }),
                  ],
                  alignment: AlignmentType.CENTER,
                  spacing: { before: 100 },
                }),
              ],
            }),
          ],
        }),
      ],
    }),

    new Paragraph({ text: "", spacing: { after: 400 } }),
  ];
}

/**
 * Build EQUIPMENT QUOTE section
 * Lines 1456–2070 of original quotePreviewWordDoc.ts
 */

export function buildEquipmentTable(ctx: DocContext): DocBlock {
  const {
    clientName,
    projectName,
    bessPowerMW,
    batteryMWh,
    duration,
    solarMW,
    windMW,
    generatorMW,
    gridConnection,
    application,
    location,
    tariffRegion,
    shippingDestination,
    projectTimeframe,
    primaryGoal,
    warranty,
    costs,
    annualSavings,
    paybackPeriod,
    budget,
    coreEquipmentTotal,
    renewablesTotal,
    equipmentTotal,
    implementationEstimate,
    batteryPricePerKWh,
    pricePerKWh,
    allInPerKWh,
    npv10yr,
    irrPercent,
    calcTables,
    merlinImageData,
    iconOrEmoji,
    bmsCost,
    essEnclosureCost,
    monitoringCost,
    selectedBattery,
    selectedInverter,
    selectedEvCharger,
  } = ctx;

  void clientName;
  void projectName;
  void bessPowerMW;
  void batteryMWh;
  void duration;
  void solarMW;
  void windMW;
  void generatorMW;
  void gridConnection;
  void application;
  void location;
  void tariffRegion;
  void shippingDestination;
  void projectTimeframe;
  void primaryGoal;
  void warranty;
  void costs;
  void annualSavings;
  void paybackPeriod;
  void budget;
  void coreEquipmentTotal;
  void renewablesTotal;
  void equipmentTotal;
  void implementationEstimate;
  void batteryPricePerKWh;
  void pricePerKWh;
  void allInPerKWh;
  void npv10yr;
  void irrPercent;
  void calcTables;
  void merlinImageData;
  void iconOrEmoji;
  void bmsCost;
  void essEnclosureCost;
  void monitoringCost;
  void selectedBattery;
  void selectedInverter;
  void selectedEvCharger;

  return [
    // 3. EQUIPMENT QUOTE
    new Paragraph({
      border: {
        bottom: { color: "FBBF24", space: 2, style: BorderStyle.SINGLE, size: 6 },
      },
      children: [],
      spacing: { before: 400, after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: "3. EQUIPMENT & SOFTWARE QUOTE",
          bold: true,
          size: 30,
          color: "FFFFFF",
          font: "Helvetica",
        }),
      ],
      spacing: { before: 100, after: 200 },
      shading: { fill: "1E3350" },
    }),

    // Equipment Component Table
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 6, type: WidthType.PERCENTAGE },
              children: [new Paragraph({ children: [new TextRun({ text: "", size: 24 })] })],
              shading: { fill: "1E3350" },
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "EQUIPMENT",
                      bold: true,
                      size: 24,
                      color: "FFFFFF",
                      font: "Helvetica",
                    }),
                  ],
                }),
              ],
              shading: { fill: "1E3350" },
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "SPECIFICATION",
                      bold: true,
                      size: 24,
                      color: "FFFFFF",
                      font: "Helvetica",
                    }),
                  ],
                }),
              ],
              shading: { fill: "1E3350" },
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "PRICE (USD)",
                      bold: true,
                      size: 24,
                      color: "FBBF24",
                      font: "Helvetica",
                    }),
                  ],
                }),
              ],
              shading: { fill: "1E3350" },
            }),
          ],
        }),
        // Battery System
        new TableRow({
          children: [
            new TableCell({
              width: { size: 6, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  children: [iconOrEmoji("battery")],
                  alignment: AlignmentType.CENTER,
                }),
              ],
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Battery Energy Storage (BESS)",
                      bold: true,
                      size: 22,
                      font: "Helvetica",
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `${batteryMWh.toFixed(1)} MWh LFP Chemistry`,
                      size: 22,
                      font: "Helvetica",
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `$${costs.batterySystem.toLocaleString()}`,
                      size: 22,
                      font: "Helvetica",
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
        // Power Conversion System
        new TableRow({
          children: [
            new TableCell({
              width: { size: 6, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  children: [iconOrEmoji("inverter")],
                  alignment: AlignmentType.CENTER,
                }),
              ],
              shading: { fill: "F8FAFC" },
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Power Conversion System (PCS)",
                      bold: true,
                      size: 22,
                      font: "Helvetica",
                    }),
                  ],
                }),
              ],
              shading: { fill: "F8FAFC" },
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `${bessPowerMW} MW Bi-directional Inverter`,
                      size: 22,
                      font: "Helvetica",
                    }),
                  ],
                }),
              ],
              shading: { fill: "F8FAFC" },
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `$${(costs.pcs + costs.inverters).toLocaleString()}`,
                      size: 22,
                      font: "Helvetica",
                    }),
                  ],
                }),
              ],
              shading: { fill: "F8FAFC" },
            }),
          ],
        }),
        // Battery Management System (BMS) - NEW
        new TableRow({
          children: [
            new TableCell({
              width: { size: 6, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  children: [iconOrEmoji("bms")],
                  alignment: AlignmentType.CENTER,
                }),
              ],
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Battery Management System (BMS)",
                      bold: true,
                      size: 22,
                      font: "Helvetica",
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Cell balancing, safety monitoring, SOC tracking",
                      size: 22,
                      font: "Helvetica",
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `$${bmsCost.toLocaleString()}`,
                      size: 22,
                      font: "Helvetica",
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
        // ESS Enclosure & Thermal - NEW
        new TableRow({
          children: [
            new TableCell({
              width: { size: 6, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  children: [iconOrEmoji("enclosure")],
                  alignment: AlignmentType.CENTER,
                }),
              ],
              shading: { fill: "F8FAFC" },
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "ESS Enclosure & Thermal Management",
                      bold: true,
                      size: 22,
                      font: "Helvetica",
                    }),
                  ],
                }),
              ],
              shading: { fill: "F8FAFC" },
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "NEMA-rated enclosure, HVAC cooling system",
                      size: 22,
                      font: "Helvetica",
                    }),
                  ],
                }),
              ],
              shading: { fill: "F8FAFC" },
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `$${essEnclosureCost.toLocaleString()}`,
                      size: 22,
                      font: "Helvetica",
                    }),
                  ],
                }),
              ],
              shading: { fill: "F8FAFC" },
            }),
          ],
        }),
        // BESS Monitoring Service - NEW
        new TableRow({
          children: [
            new TableCell({
              width: { size: 6, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  children: [iconOrEmoji("monitoring")],
                  alignment: AlignmentType.CENTER,
                }),
              ],
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "BESS Monitoring & Software (Yr 1)",
                      bold: true,
                      size: 22,
                      font: "Helvetica",
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Cloud monitoring, alerts, performance analytics",
                      size: 22,
                      font: "Helvetica",
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `$${monitoringCost.toLocaleString()}`,
                      size: 22,
                      font: "Helvetica",
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
        // Transformers & Switchgear
        new TableRow({
          children: [
            new TableCell({
              width: { size: 6, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  children: [iconOrEmoji("transformer")],
                  alignment: AlignmentType.CENTER,
                }),
              ],
              shading: { fill: "F8FAFC" },
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Transformers & Switchgear",
                      bold: true,
                      size: 22,
                      font: "Helvetica",
                    }),
                  ],
                }),
              ],
              shading: { fill: "F8FAFC" },
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `${bessPowerMW} MW rated, protection systems`,
                      size: 22,
                      font: "Helvetica",
                    }),
                  ],
                }),
              ],
              shading: { fill: "F8FAFC" },
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `$${(costs.transformers + costs.switchgear).toLocaleString()}`,
                      size: 22,
                      font: "Helvetica",
                    }),
                  ],
                }),
              ],
              shading: { fill: "F8FAFC" },
            }),
          ],
        }),
        // Solar (conditional)
        ...(solarMW > 0
          ? [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 6, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        children: [iconOrEmoji("solar")],
                        alignment: AlignmentType.CENTER,
                      }),
                    ],
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: "Solar Array + Inverters",
                            bold: true,
                            size: 22,
                            font: "Helvetica",
                          }),
                        ],
                      }),
                    ],
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: `${solarMW} MW PV system`,
                            size: 22,
                            font: "Helvetica",
                          }),
                        ],
                      }),
                    ],
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: `$${(costs.solar + (costs.solarInverters || 0)).toLocaleString()}`,
                            size: 22,
                            font: "Helvetica",
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ]
          : []),
        // Generator (conditional)
        ...(generatorMW > 0
          ? [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 6, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        children: [iconOrEmoji("generator")],
                        alignment: AlignmentType.CENTER,
                      }),
                    ],
                    shading: { fill: "F8FAFC" },
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: "Generator Backup",
                            bold: true,
                            size: 22,
                            font: "Helvetica",
                          }),
                        ],
                      }),
                    ],
                    shading: { fill: "F8FAFC" },
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: `${generatorMW} MW Natural Gas`,
                            size: 22,
                            font: "Helvetica",
                          }),
                        ],
                      }),
                    ],
                    shading: { fill: "F8FAFC" },
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: `$${(costs.generator + (costs.generatorControls || 0)).toLocaleString()}`,
                            size: 22,
                            font: "Helvetica",
                          }),
                        ],
                      }),
                    ],
                    shading: { fill: "F8FAFC" },
                  }),
                ],
              }),
            ]
          : []),
        // EQUIPMENT TOTAL
        new TableRow({
          children: [
            new TableCell({
              width: { size: 6, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "✓",
                      bold: true,
                      size: 28,
                      color: "FFFFFF",
                      font: "Helvetica",
                    }),
                  ],
                  alignment: AlignmentType.CENTER,
                }),
              ],
              shading: { fill: "065F46" },
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "EQUIPMENT TOTAL",
                      bold: true,
                      size: 28,
                      color: "FFFFFF",
                      font: "Helvetica",
                    }),
                  ],
                }),
              ],
              shading: { fill: "065F46" },
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `$${allInPerKWh}/kWh all-in`,
                      bold: true,
                      size: 24,
                      color: "FFFFFF",
                      font: "Helvetica",
                    }),
                  ],
                }),
              ],
              shading: { fill: "065F46" },
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `$${equipmentTotal.toLocaleString()}`,
                      bold: true,
                      size: 28,
                      color: "FBBF24",
                      font: "Helvetica",
                    }),
                  ],
                }),
              ],
              shading: { fill: "065F46" },
            }),
          ],
        }),
      ],
    }),

    new Paragraph({ text: "", spacing: { after: 300 } }),
  ];
}

/**
 * Build IMPLEMENTATION COSTS section
 * Lines 2071–2337 of original quotePreviewWordDoc.ts
 */

export function buildImplementationCosts(ctx: DocContext): DocBlock {
  const {
    clientName,
    projectName,
    bessPowerMW,
    batteryMWh,
    duration,
    solarMW,
    windMW,
    generatorMW,
    gridConnection,
    application,
    location,
    tariffRegion,
    shippingDestination,
    projectTimeframe,
    primaryGoal,
    warranty,
    costs,
    annualSavings,
    paybackPeriod,
    budget,
    coreEquipmentTotal,
    renewablesTotal,
    equipmentTotal,
    implementationEstimate,
    batteryPricePerKWh,
    pricePerKWh,
    allInPerKWh,
    npv10yr,
    irrPercent,
    calcTables,
    merlinImageData,
    iconOrEmoji,
    selectedBattery,
    selectedInverter,
    selectedEvCharger,
  } = ctx;

  void clientName;
  void projectName;
  void bessPowerMW;
  void batteryMWh;
  void duration;
  void solarMW;
  void windMW;
  void generatorMW;
  void gridConnection;
  void application;
  void location;
  void tariffRegion;
  void shippingDestination;
  void projectTimeframe;
  void primaryGoal;
  void warranty;
  void costs;
  void annualSavings;
  void paybackPeriod;
  void budget;
  void coreEquipmentTotal;
  void renewablesTotal;
  void equipmentTotal;
  void implementationEstimate;
  void batteryPricePerKWh;
  void pricePerKWh;
  void allInPerKWh;
  void npv10yr;
  void irrPercent;
  void calcTables;
  void merlinImageData;
  void iconOrEmoji;
  void selectedBattery;
  void selectedInverter;
  void selectedEvCharger;

  return [
    // ESTIMATED IMPLEMENTATION COSTS (separate, not in equipment total)
    new Paragraph({
      children: [
        new TextRun({
          text: "ESTIMATED IMPLEMENTATION COSTS",
          bold: true,
          size: 24,
          color: "6B7280",
          font: "Helvetica",
        }),
        new TextRun({
          text: "  (Not included in equipment total — final costs determined by selected EPC provider)",
          italics: true,
          size: 18,
          color: "9CA3AF",
          font: "Helvetica",
        }),
      ],
      spacing: { before: 200, after: 150 },
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
                    new TextRun({
                      text: "SERVICE",
                      bold: true,
                      size: 20,
                      color: "6B7280",
                      font: "Helvetica",
                    }),
                  ],
                }),
              ],
              shading: { fill: "F3F4F6" },
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "DESCRIPTION",
                      bold: true,
                      size: 20,
                      color: "6B7280",
                      font: "Helvetica",
                    }),
                  ],
                }),
              ],
              shading: { fill: "F3F4F6" },
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "EST. RANGE",
                      bold: true,
                      size: 20,
                      color: "6B7280",
                      font: "Helvetica",
                    }),
                  ],
                }),
              ],
              shading: { fill: "F3F4F6" },
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Balance of System (BoS)",
                      size: 20,
                      font: "Helvetica",
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Cabling, racking, site materials",
                      size: 20,
                      font: "Helvetica",
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `$${Math.round(costs.bos * 0.85).toLocaleString()} – $${Math.round(costs.bos * 1.15).toLocaleString()}`,
                      italics: true,
                      size: 20,
                      color: "6B7280",
                      font: "Helvetica",
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  children: [new TextRun({ text: "EPC Services", size: 20, font: "Helvetica" })],
                }),
              ],
              shading: { fill: "FAFAFA" },
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Engineering, procurement, construction",
                      size: 20,
                      font: "Helvetica",
                    }),
                  ],
                }),
              ],
              shading: { fill: "FAFAFA" },
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `$${Math.round(costs.epc * 0.8).toLocaleString()} – $${Math.round(costs.epc * 1.2).toLocaleString()}`,
                      italics: true,
                      size: 20,
                      color: "6B7280",
                      font: "Helvetica",
                    }),
                  ],
                }),
              ],
              shading: { fill: "FAFAFA" },
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Tariffs & Shipping",
                      size: 20,
                      font: "Helvetica",
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `${tariffRegion || "Regional"} duties + logistics`,
                      size: 20,
                      font: "Helvetica",
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `$${Math.round((costs.tariffs + costs.shipping) * 0.75).toLocaleString()} – $${Math.round((costs.tariffs + costs.shipping) * 1.25).toLocaleString()}`,
                      italics: true,
                      size: 20,
                      color: "6B7280",
                      font: "Helvetica",
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "EST. IMPLEMENTATION TOTAL",
                      bold: true,
                      size: 20,
                      color: "6B7280",
                      font: "Helvetica",
                    }),
                  ],
                }),
              ],
              shading: { fill: "F3F4F6" },
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Subject to EPC provider pricing",
                      italics: true,
                      size: 18,
                      color: "9CA3AF",
                      font: "Helvetica",
                    }),
                  ],
                }),
              ],
              shading: { fill: "F3F4F6" },
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `$${Math.round(implementationEstimate * 0.8).toLocaleString()} – $${Math.round(implementationEstimate * 1.2).toLocaleString()}`,
                      bold: true,
                      italics: true,
                      size: 20,
                      color: "6B7280",
                      font: "Helvetica",
                    }),
                  ],
                }),
              ],
              shading: { fill: "F3F4F6" },
            }),
          ],
        }),
      ],
    }),

    new Paragraph({ text: "", spacing: { after: 400 } }),
  ];
}

/**
 * Build RETURN ON INVESTMENT section
 * Lines 2338–2658 of original quotePreviewWordDoc.ts
 */

export function buildROI(ctx: DocContext): DocBlock {
  const {
    clientName,
    projectName,
    bessPowerMW,
    batteryMWh,
    duration,
    solarMW,
    windMW,
    generatorMW,
    gridConnection,
    application,
    location,
    tariffRegion,
    shippingDestination,
    projectTimeframe,
    primaryGoal,
    warranty,
    costs,
    annualSavings,
    paybackPeriod,
    budget,
    coreEquipmentTotal,
    renewablesTotal,
    equipmentTotal,
    implementationEstimate,
    batteryPricePerKWh,
    pricePerKWh,
    allInPerKWh,
    npv10yr,
    irrPercent,
    calcTables,
    merlinImageData,
    iconOrEmoji,
    selectedBattery,
    selectedInverter,
    selectedEvCharger,
  } = ctx;

  void clientName;
  void projectName;
  void bessPowerMW;
  void batteryMWh;
  void duration;
  void solarMW;
  void windMW;
  void generatorMW;
  void gridConnection;
  void application;
  void location;
  void tariffRegion;
  void shippingDestination;
  void projectTimeframe;
  void primaryGoal;
  void warranty;
  void costs;
  void annualSavings;
  void paybackPeriod;
  void budget;
  void coreEquipmentTotal;
  void renewablesTotal;
  void equipmentTotal;
  void implementationEstimate;
  void batteryPricePerKWh;
  void pricePerKWh;
  void allInPerKWh;
  void npv10yr;
  void irrPercent;
  void calcTables;
  void merlinImageData;
  void iconOrEmoji;
  void selectedBattery;
  void selectedInverter;
  void selectedEvCharger;

  return [
    // 4. RETURN ON INVESTMENT
    new Paragraph({
      border: {
        bottom: { color: "FBBF24", space: 2, style: BorderStyle.SINGLE, size: 6 },
      },
      children: [],
      spacing: { before: 400, after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: "4. RETURN ON INVESTMENT",
          bold: true,
          size: 30,
          color: "FFFFFF",
          font: "Helvetica",
        }),
      ],
      spacing: { before: 100, after: 200 },
      shading: { fill: "1E3350" },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Your BESS investment pays for itself in ${paybackPeriod.toFixed(1)} years, then delivers pure savings for the remaining system life (${warranty}+ year warranty).`,
          size: 24,
          font: "Helvetica",
        }),
      ],
      spacing: { after: 250 },
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
                    new TextRun({
                      text: "FINANCIAL METRIC",
                      bold: true,
                      size: 24,
                      color: "FFFFFF",
                      font: "Helvetica",
                    }),
                  ],
                }),
              ],
              shading: { fill: "1E3350" },
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "VALUE",
                      bold: true,
                      size: 24,
                      color: "FBBF24",
                      font: "Helvetica",
                    }),
                  ],
                }),
              ],
              shading: { fill: "1E3350" },
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Annual Energy Savings",
                      bold: true,
                      size: 24,
                      font: "Helvetica",
                    }),
                  ],
                }),
              ],
              shading: { fill: "ECFDF5" },
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `$${annualSavings.toLocaleString()}/year`,
                      bold: true,
                      size: 24,
                      color: "059669",
                      font: "Helvetica",
                    }),
                  ],
                }),
              ],
              shading: { fill: "ECFDF5" },
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Payback Period",
                      bold: true,
                      size: 24,
                      font: "Helvetica",
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `${paybackPeriod.toFixed(1)} years`,
                      bold: true,
                      size: 24,
                      color: "D97706",
                      font: "Helvetica",
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "NPV @ 8% (10-Year)",
                      bold: true,
                      size: 24,
                      font: "Helvetica",
                    }),
                  ],
                }),
              ],
              shading: { fill: "ECFDF5" },
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `$${Math.round(npv10yr).toLocaleString()}`,
                      bold: true,
                      size: 24,
                      color: npv10yr >= 0 ? "059669" : "DC2626",
                      font: "Helvetica",
                    }),
                  ],
                }),
              ],
              shading: { fill: "ECFDF5" },
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Estimated IRR (25-Year)",
                      bold: true,
                      size: 24,
                      font: "Helvetica",
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `${irrPercent.toFixed(1)}%`,
                      bold: true,
                      size: 24,
                      color: "1E3350",
                      font: "Helvetica",
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "10-Year Net Savings",
                      bold: true,
                      size: 24,
                      font: "Helvetica",
                    }),
                  ],
                }),
              ],
              shading: { fill: "ECFDF5" },
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `$${(annualSavings * 10 - equipmentTotal).toLocaleString()}`,
                      bold: true,
                      size: 24,
                      color: "059669",
                      font: "Helvetica",
                    }),
                  ],
                }),
              ],
              shading: { fill: "ECFDF5" },
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "25-Year Lifetime Savings",
                      bold: true,
                      size: 24,
                      font: "Helvetica",
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `$${(annualSavings * 25 - equipmentTotal).toLocaleString()}`,
                      bold: true,
                      size: 24,
                      color: "059669",
                      font: "Helvetica",
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
        ...(budget
          ? [
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: "Budget Status",
                            bold: true,
                            size: 24,
                            font: "Helvetica",
                          }),
                        ],
                      }),
                    ],
                    shading: { fill: "F0F2F7" },
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text:
                              equipmentTotal <= budget
                                ? `✓ Under budget by $${(budget - equipmentTotal).toLocaleString()}`
                                : `⚠ Over budget by $${(equipmentTotal - budget).toLocaleString()}`,
                            bold: true,
                            size: 22,
                            font: "Helvetica",
                            color: equipmentTotal <= budget ? "059669" : "D97706",
                          }),
                        ],
                      }),
                    ],
                    shading: { fill: "F0F2F7" },
                  }),
                ],
              }),
            ]
          : []),
      ],
    }),

    new Paragraph({ text: "", spacing: { after: 400 } }),
  ];
}

/**
 * Build IMPLEMENTATION & CERTIFICATIONS section
 * Lines 2659–2816 of original quotePreviewWordDoc.ts
 */

export function buildImplementationCert(ctx: DocContext): DocBlock {
  const {
    clientName,
    projectName,
    bessPowerMW,
    batteryMWh,
    duration,
    solarMW,
    windMW,
    generatorMW,
    gridConnection,
    application,
    location,
    tariffRegion,
    shippingDestination,
    projectTimeframe,
    primaryGoal,
    warranty,
    costs,
    annualSavings,
    paybackPeriod,
    budget,
    coreEquipmentTotal,
    renewablesTotal,
    equipmentTotal,
    implementationEstimate,
    batteryPricePerKWh,
    pricePerKWh,
    allInPerKWh,
    npv10yr,
    irrPercent,
    calcTables,
    merlinImageData,
    iconOrEmoji,
    selectedBattery,
    selectedInverter,
    selectedEvCharger,
  } = ctx;

  void clientName;
  void projectName;
  void bessPowerMW;
  void batteryMWh;
  void duration;
  void solarMW;
  void windMW;
  void generatorMW;
  void gridConnection;
  void application;
  void location;
  void tariffRegion;
  void shippingDestination;
  void projectTimeframe;
  void primaryGoal;
  void warranty;
  void costs;
  void annualSavings;
  void paybackPeriod;
  void budget;
  void coreEquipmentTotal;
  void renewablesTotal;
  void equipmentTotal;
  void implementationEstimate;
  void batteryPricePerKWh;
  void pricePerKWh;
  void allInPerKWh;
  void npv10yr;
  void irrPercent;
  void calcTables;
  void merlinImageData;
  void iconOrEmoji;
  void selectedBattery;
  void selectedInverter;
  void selectedEvCharger;

  return [
    // 5. IMPLEMENTATION & CERTIFICATIONS
    new Paragraph({
      border: {
        bottom: { color: "FBBF24", space: 2, style: BorderStyle.SINGLE, size: 6 },
      },
      children: [],
      spacing: { before: 400, after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: "5. IMPLEMENTATION & CERTIFICATIONS",
          bold: true,
          size: 30,
          color: "FFFFFF",
          font: "Helvetica",
        }),
      ],
      spacing: { before: 100, after: 200 },
      shading: { fill: "1E3350" },
    }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 35, type: WidthType.PERCENTAGE },
              shading: { fill: "F0F2F7" },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Project Timeline",
                      bold: true,
                      size: 22,
                      font: "Helvetica",
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "12–16 weeks from contract execution to commissioning",
                      size: 22,
                      font: "Helvetica",
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              shading: { fill: "F0F2F7" },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Required Certifications",
                      bold: true,
                      size: 22,
                      font: "Helvetica",
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "UL 9540A, IEEE 1547, NFPA 855",
                      size: 22,
                      font: "Helvetica",
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              shading: { fill: "F0F2F7" },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Warranty Period",
                      bold: true,
                      size: 22,
                      font: "Helvetica",
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `${warranty} comprehensive system warranty`,
                      size: 22,
                      font: "Helvetica",
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              shading: { fill: "F0F2F7" },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Insurance & Compliance",
                      bold: true,
                      size: 22,
                      font: "Helvetica",
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "All installations include full liability coverage and local code compliance",
                      size: 22,
                      font: "Helvetica",
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    }),

    new Paragraph({ text: "", spacing: { after: 300 } }),
  ];
}

/**
 * Build SUMMARY & NEXT STEPS section
 * Lines 2817–2958 of original quotePreviewWordDoc.ts
 */

export function buildSummaryNextSteps(ctx: DocContext): DocBlock {
  const {
    clientName,
    projectName,
    bessPowerMW,
    batteryMWh,
    duration,
    solarMW,
    windMW,
    generatorMW,
    gridConnection,
    application,
    location,
    tariffRegion,
    shippingDestination,
    projectTimeframe,
    primaryGoal,
    warranty,
    costs,
    annualSavings,
    paybackPeriod,
    budget,
    coreEquipmentTotal,
    renewablesTotal,
    equipmentTotal,
    implementationEstimate,
    batteryPricePerKWh,
    pricePerKWh,
    allInPerKWh,
    npv10yr,
    irrPercent,
    calcTables,
    merlinImageData,
    iconOrEmoji,
    selectedBattery,
    selectedInverter,
    selectedEvCharger,
  } = ctx;

  void clientName;
  void projectName;
  void bessPowerMW;
  void batteryMWh;
  void duration;
  void solarMW;
  void windMW;
  void generatorMW;
  void gridConnection;
  void application;
  void location;
  void tariffRegion;
  void shippingDestination;
  void projectTimeframe;
  void primaryGoal;
  void warranty;
  void costs;
  void annualSavings;
  void paybackPeriod;
  void budget;
  void coreEquipmentTotal;
  void renewablesTotal;
  void equipmentTotal;
  void implementationEstimate;
  void batteryPricePerKWh;
  void pricePerKWh;
  void allInPerKWh;
  void npv10yr;
  void irrPercent;
  void calcTables;
  void merlinImageData;
  void iconOrEmoji;
  void selectedBattery;
  void selectedInverter;
  void selectedEvCharger;

  return [
    // 6. SUMMARY & NEXT STEPS
    new Paragraph({
      border: {
        bottom: { color: "FBBF24", space: 2, style: BorderStyle.SINGLE, size: 6 },
      },
      children: [],
      spacing: { before: 200, after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: "6. SUMMARY & NEXT STEPS",
          bold: true,
          size: 30,
          color: "FFFFFF",
          font: "Helvetica",
        }),
      ],
      spacing: { before: 100, after: 200 },
      shading: { fill: "1E3350" },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `This ${batteryMWh.toFixed(1)} MWh BESS delivers strong financial returns with a ${paybackPeriod.toFixed(1)}-year payback and proven technology. To proceed:`,
          size: 22,
          font: "Helvetica",
        }),
      ],
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: "1. ",
          bold: true,
          size: 22,
          color: "1E3350",
          font: "Helvetica",
        }),
        new TextRun({
          text: "Review this proposal ",
          bold: true,
          size: 22,
          font: "Helvetica",
        }),
        new TextRun({
          text: "and confirm system configuration meets your requirements.",
          size: 22,
          font: "Helvetica",
        }),
      ],
      spacing: { after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: "2. ",
          bold: true,
          size: 22,
          color: "1E3350",
          font: "Helvetica",
        }),
        new TextRun({
          text: "Schedule a site assessment ",
          bold: true,
          size: 22,
          font: "Helvetica",
        }),
        new TextRun({
          text: "for detailed engineering and interconnection review.",
          size: 22,
          font: "Helvetica",
        }),
      ],
      spacing: { after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: "3. ",
          bold: true,
          size: 22,
          color: "1E3350",
          font: "Helvetica",
        }),
        new TextRun({
          text: "Finalize contract ",
          bold: true,
          size: 22,
          font: "Helvetica",
        }),
        new TextRun({
          text: "with selected EPC partner and lock in equipment pricing.",
          size: 22,
          font: "Helvetica",
        }),
      ],
      spacing: { after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: "4. ",
          bold: true,
          size: 22,
          color: "1E3350",
          font: "Helvetica",
        }),
        new TextRun({
          text: "Installation & commissioning ",
          bold: true,
          size: 22,
          font: "Helvetica",
        }),
        new TextRun({
          text: "— system operational within 12–16 weeks.",
          size: 22,
          font: "Helvetica",
        }),
      ],
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: "This proposal is valid for 30 days. ",
          bold: true,
          size: 20,
          color: "6B7280",
          font: "Helvetica",
        }),
        new TextRun({
          text: "Contact us to discuss next steps and begin implementation.",
          size: 20,
          color: "6B7280",
          font: "Helvetica",
        }),
      ],
      spacing: { after: 400 },
    }),
  ];
}

/**
 * Build TRUEQUOTE VERIFICATION section
 * Lines 2959–3023 of original quotePreviewWordDoc.ts
 */

export function buildTrueQuoteVerification(ctx: DocContext): DocBlock {
  const {
    clientName,
    projectName,
    bessPowerMW,
    batteryMWh,
    duration,
    solarMW,
    windMW,
    generatorMW,
    gridConnection,
    application,
    location,
    tariffRegion,
    shippingDestination,
    projectTimeframe,
    primaryGoal,
    warranty,
    costs,
    annualSavings,
    paybackPeriod,
    budget,
    coreEquipmentTotal,
    renewablesTotal,
    equipmentTotal,
    implementationEstimate,
    batteryPricePerKWh,
    pricePerKWh,
    allInPerKWh,
    npv10yr,
    irrPercent,
    calcTables,
    merlinImageData,
    iconOrEmoji,
    selectedBattery,
    selectedInverter,
    selectedEvCharger,
  } = ctx;

  void clientName;
  void projectName;
  void bessPowerMW;
  void batteryMWh;
  void duration;
  void solarMW;
  void windMW;
  void generatorMW;
  void gridConnection;
  void application;
  void location;
  void tariffRegion;
  void shippingDestination;
  void projectTimeframe;
  void primaryGoal;
  void warranty;
  void costs;
  void annualSavings;
  void paybackPeriod;
  void budget;
  void coreEquipmentTotal;
  void renewablesTotal;
  void equipmentTotal;
  void implementationEstimate;
  void batteryPricePerKWh;
  void pricePerKWh;
  void allInPerKWh;
  void npv10yr;
  void irrPercent;
  void calcTables;
  void merlinImageData;
  void iconOrEmoji;
  void selectedBattery;
  void selectedInverter;
  void selectedEvCharger;

  return [
    // TRUEQUOTE™ VERIFICATION
    new Paragraph({
      border: {
        bottom: { color: "FBBF24", space: 2, style: BorderStyle.SINGLE, size: 6 },
      },
      children: [],
      spacing: { before: 400, after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: "TrueQuote™ Verification",
          bold: true,
          size: 30,
          color: "FFFFFF",
          font: "Helvetica",
        }),
      ],
      spacing: { before: 100, after: 200 },
      shading: { fill: "1E3350" },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: "✨ TrueQuote™ Verified",
          bold: true,
          size: 20,
          color: "D97706",
        }),
        new TextRun({
          text: " — Every number in this proposal is traceable to an authoritative source.",
          size: 20,
          color: "374151",
        }),
      ],
      spacing: { after: 150 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: "Source Attribution: ",
          bold: true,
          size: 18,
          color: "0C1631",
        }),
        new TextRun({
          text: "NREL ATB 2024, NREL Cost Benchmark 2024, IRA 2022, IEEE Standards, EIA Database. All pricing validated against Q4 2025 market data.",
          size: 18,
          color: "6B7280",
        }),
      ],
      spacing: { after: 150 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Methodology: ", bold: true, size: 18, color: "0C1631" }),
        new TextRun({
          text: "Equipment costs from NREL Annual Technology Baseline, financial modeling per industry-standard DCF analysis, utility rates from EIA regional data.",
          size: 18,
          color: "6B7280",
        }),
      ],
      spacing: { after: 400 },
    }),
  ];
}

/**
 * Build APPENDIX A section
 * Lines 3024–3454 of original quotePreviewWordDoc.ts
 */

export function buildAppendix(ctx: DocContext): DocBlock {
  const {
    clientName,
    projectName,
    bessPowerMW,
    batteryMWh,
    duration,
    solarMW,
    windMW,
    generatorMW,
    gridConnection,
    application,
    location,
    tariffRegion,
    shippingDestination,
    projectTimeframe,
    primaryGoal,
    warranty,
    costs,
    annualSavings,
    paybackPeriod,
    budget,
    coreEquipmentTotal,
    renewablesTotal,
    equipmentTotal,
    implementationEstimate,
    batteryPricePerKWh,
    pricePerKWh,
    allInPerKWh,
    npv10yr,
    irrPercent,
    calcTables,
    merlinImageData,
    iconOrEmoji,
    selectedBattery,
    selectedInverter,
    selectedEvCharger,
  } = ctx;

  void clientName;
  void projectName;
  void bessPowerMW;
  void batteryMWh;
  void duration;
  void solarMW;
  void windMW;
  void generatorMW;
  void gridConnection;
  void application;
  void location;
  void tariffRegion;
  void shippingDestination;
  void projectTimeframe;
  void primaryGoal;
  void warranty;
  void costs;
  void annualSavings;
  void paybackPeriod;
  void budget;
  void coreEquipmentTotal;
  void renewablesTotal;
  void equipmentTotal;
  void implementationEstimate;
  void batteryPricePerKWh;
  void pricePerKWh;
  void allInPerKWh;
  void npv10yr;
  void irrPercent;
  void calcTables;
  void merlinImageData;
  void iconOrEmoji;
  void selectedBattery;
  void selectedInverter;
  void selectedEvCharger;

  return [
    // APPENDIX A: CALCULATION REFERENCE
    new Paragraph({
      text: "",
      children: [new PageBreak()],
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: "APPENDIX A: CALCULATION REFERENCE",
          bold: true,
          size: 30,
          color: "FFFFFF",
          font: "Helvetica",
        }),
      ],
      spacing: { before: 200, after: 200 },
      shading: { fill: "1E3350" },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: "All calculations use industry-standard methodologies and Q4 2025 market data. Key formulas:",
          size: 20,
          font: "Helvetica",
          color: "4B5563",
        }),
      ],
      spacing: { after: 200 },
    }),

    // Summary formula table
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 30, type: WidthType.PERCENTAGE },
              shading: { fill: "1E3350" },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "METRIC",
                      bold: true,
                      size: 20,
                      color: "FFFFFF",
                      font: "Helvetica",
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              width: { size: 40, type: WidthType.PERCENTAGE },
              shading: { fill: "1E3350" },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "FORMULA",
                      bold: true,
                      size: 20,
                      color: "FFFFFF",
                      font: "Helvetica",
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              width: { size: 30, type: WidthType.PERCENTAGE },
              shading: { fill: "1E3350" },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "THIS QUOTE",
                      bold: true,
                      size: 20,
                      color: "FBBF24",
                      font: "Helvetica",
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              shading: { fill: "F8FAFC" },
              children: [
                new Paragraph({
                  children: [new TextRun({ text: "Battery $/kWh", size: 20, font: "Helvetica" })],
                }),
              ],
            }),
            new TableCell({
              shading: { fill: "F8FAFC" },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Battery Cost ÷ (MWh × 1,000)",
                      size: 20,
                      font: "Helvetica",
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              shading: { fill: "F8FAFC" },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `$${pricePerKWh}/kWh`,
                      bold: true,
                      size: 20,
                      font: "Helvetica",
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  children: [new TextRun({ text: "Payback Period", size: 20, font: "Helvetica" })],
                }),
              ],
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Equipment Total ÷ Annual Savings",
                      size: 20,
                      font: "Helvetica",
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `${paybackPeriod.toFixed(1)} years`,
                      bold: true,
                      size: 20,
                      font: "Helvetica",
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              shading: { fill: "F8FAFC" },
              children: [
                new Paragraph({
                  children: [new TextRun({ text: "NPV @ 8%", size: 20, font: "Helvetica" })],
                }),
              ],
            }),
            new TableCell({
              shading: { fill: "F8FAFC" },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Σ(Savings/(1.08)^t) − Investment, t=1..10",
                      size: 20,
                      font: "Helvetica",
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              shading: { fill: "F8FAFC" },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `$${Math.round(npv10yr).toLocaleString()}`,
                      bold: true,
                      size: 20,
                      font: "Helvetica",
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  children: [new TextRun({ text: "IRR (25-Year)", size: 20, font: "Helvetica" })],
                }),
              ],
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Rate where NPV = 0 over 25 years",
                      size: 20,
                      font: "Helvetica",
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `${irrPercent.toFixed(1)}%`,
                      bold: true,
                      size: 20,
                      font: "Helvetica",
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              shading: { fill: "F8FAFC" },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "10-Year Net Savings",
                      size: 20,
                      font: "Helvetica",
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              shading: { fill: "F8FAFC" },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "(Annual Savings × 10) − Equipment Total",
                      size: 20,
                      font: "Helvetica",
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              shading: { fill: "F8FAFC" },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `$${(annualSavings * 10 - equipmentTotal).toLocaleString()}`,
                      bold: true,
                      size: 20,
                      font: "Helvetica",
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: "25-Year Lifetime", size: 20, font: "Helvetica" }),
                  ],
                }),
              ],
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "(Annual Savings × 25) − Equipment Total",
                      size: 20,
                      font: "Helvetica",
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `$${(annualSavings * 25 - equipmentTotal).toLocaleString()}`,
                      bold: true,
                      size: 20,
                      font: "Helvetica",
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    }),

    new Paragraph({ text: "", spacing: { after: 300 } }),

    // Detailed calculation tables
    ...calcTables,

    // Data Sources (condensed)
    new Paragraph({
      children: [
        new TextRun({
          text: "Data Sources",
          bold: true,
          size: 24,
          font: "Helvetica",
          color: "1E3350",
        }),
      ],
      spacing: { before: 400, after: 150 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "NREL ATB 2024", bold: true, size: 18, font: "Helvetica" }),
        new TextRun({
          text: " (battery storage costs)  •  ",
          size: 18,
          color: "6B7280",
          font: "Helvetica",
        }),
        new TextRun({
          text: "SEIA/Wood Mackenzie Q4 2025",
          bold: true,
          size: 18,
          font: "Helvetica",
        }),
        new TextRun({
          text: " (solar market)  •  ",
          size: 18,
          color: "6B7280",
          font: "Helvetica",
        }),
        new TextRun({ text: "EIA Database", bold: true, size: 18, font: "Helvetica" }),
        new TextRun({
          text: " (generator costs, utility rates)",
          size: 18,
          color: "6B7280",
          font: "Helvetica",
        }),
      ],
      spacing: { after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "IEEE 2450", bold: true, size: 18, font: "Helvetica" }),
        new TextRun({
          text: " (degradation standards)  •  ",
          size: 18,
          color: "6B7280",
          font: "Helvetica",
        }),
        new TextRun({ text: "BloombergNEF 2024", bold: true, size: 18, font: "Helvetica" }),
        new TextRun({
          text: " (Li-ion pack prices)  •  ",
          size: 18,
          color: "6B7280",
          font: "Helvetica",
        }),
        new TextRun({ text: "IRA 2022", bold: true, size: 18, font: "Helvetica" }),
        new TextRun({
          text: " (tax credit guidance)",
          size: 18,
          color: "6B7280",
          font: "Helvetica",
        }),
      ],
      spacing: { after: 300 },
    }),

    new Paragraph({
      children: [
        new TextRun({
          text: "Confidential & Proprietary  •  MERLIN Energy Solutions",
          italics: true,
          size: 18,
          color: "9CA3AF",
          font: "Helvetica",
        }),
      ],
      alignment: AlignmentType.CENTER,
    }),
  ];
}
