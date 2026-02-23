// Auto-extracted by Op6 — Word document generation for QuotePreviewModal
// Source: src/components/modals/QuotePreviewModal.tsx

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  TableRow,
  TableCell,
  WidthType,
  ImageRun,
  BorderStyle,
} from "docx";
import { saveAs } from "file-saver";
import { generateCalculationBreakdown } from "../../utils/calculationFormulas";
import { createCalculationTables } from "../../utils/wordHelpers";
import merlinImageUrl from "../../assets/images/new_small_profile_.png";
import { preloadAllIcons, getEquipmentEmoji } from "../../utils/equipmentImageLibrary";
import type { EquipmentType } from "../../utils/equipmentImageLibrary";
import { selectEquipmentForQuote, getVendor } from "../../data/vendorEquipment";
import type { VendorProduct, EVChargerProduct } from "../../data/vendorEquipment";

export type QuotePreviewData = {
  clientName: string;
  projectName: string;
  bessPowerMW: number;
  duration: number;
  batteryMWh: number;
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
  pcsIncluded: boolean;
  costs: {
    batterySystem: number;
    pcs: number;
    transformers: number;
    inverters: number;
    switchgear: number;
    microgridControls: number;
    solar: number;
    solarInverters: number;
    wind: number;
    windConverters: number;
    generator: number;
    generatorControls: number;
    bos: number;
    epc: number;
    tariffs: number;
    shipping: number;
    grandTotal: number;
  };
  annualSavings: number;
  paybackPeriod: number;
  budget?: number;
};

// Helper functions for Word document
const boldParagraph = (text: string) =>
  new Paragraph({
    children: [new TextRun({ text, bold: true })],
  });

const createHeaderRow = (headers: string[], bgColor: string = "0C1631") =>
  new TableRow({
    children: headers.map(
      (header) =>
        new TableCell({
          children: [boldParagraph(header)],
          shading: { fill: bgColor },
        })
    ),
  });

const createDataRow = (cells: string[]) =>
  new TableRow({
    children: cells.map(
      (cell) =>
        new TableCell({
          children: [new Paragraph(cell)],
        })
    ),
  });

/**
 * Build "YOUR SYSTEM EQUIPMENT" gallery section for Word export.
 * Shows vendor products with specs and descriptions based on quote configuration.
 */
function buildEquipmentGallery(config: {
  bessKWh?: number;
  solarMW?: number;
  generatorMW?: number;
  evChargers?: { level2Count?: number; dcfcCount?: number; hpcCount?: number };
  preferredVendors?: string[];
}): Paragraph[] {
  const products = selectEquipmentForQuote(config);
  if (products.length === 0) return [];

  const elements: Paragraph[] = [];

  // Section header
  elements.push(
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
          text: "YOUR SYSTEM EQUIPMENT",
          bold: true,
          size: 30,
          color: "FFFFFF",
          font: "Helvetica",
        }),
      ],
      spacing: { before: 100, after: 100 },
      shading: { fill: "1E3350" },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: "The following equipment has been selected for your project. All products are from industry-leading manufacturers with proven track records in energy infrastructure.",
          size: 22,
          font: "Helvetica",
          color: "4B5563",
        }),
      ],
      spacing: { after: 300 },
    })
  );

  // Product cards
  products.forEach((product: VendorProduct, index: number) => {
    const vendor = getVendor(product.vendorId);
    const vendorName = vendor?.name || product.vendorId;
    const isEVCharger = product.category === "ev-charger";

    // Category label mapping
    const categoryLabels: Record<string, string> = {
      "ev-charger": "⚡ EV CHARGER",
      battery: "🔋 BATTERY STORAGE",
      solar: "☀️ SOLAR",
      inverter: "🔄 INVERTER / PCS",
      generator: "🔥 GENERATOR",
      transformer: "⚙️ TRANSFORMER",
      switchgear: "🔀 SWITCHGEAR",
      monitoring: "📊 MONITORING",
      bms: "🔌 BMS",
      enclosure: "📦 ENCLOSURE",
      wind: "🌬️ WIND",
      microgrid: "🏗️ MICROGRID",
    };

    // Category tag
    elements.push(
      new Paragraph({
        children: [
          new TextRun({
            text: categoryLabels[product.category] || product.category.toUpperCase(),
            bold: true,
            size: 18,
            color: "FBBF24",
            font: "Helvetica",
          }),
        ],
        spacing: { before: index > 0 ? 400 : 200, after: 80 },
      })
    );

    // Product name + vendor
    elements.push(
      new Paragraph({
        children: [
          new TextRun({
            text: product.name,
            bold: true,
            size: 28,
            color: "1E3350",
            font: "Helvetica",
          }),
          product.model
            ? new TextRun({
                text: `  (${product.model})`,
                size: 22,
                color: "6B7280",
                font: "Helvetica",
              })
            : new TextRun({ text: "" }),
        ],
        spacing: { after: 40 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: `by ${vendorName}`, size: 20, color: "14B8A6", font: "Helvetica" }),
          vendor?.country
            ? new TextRun({
                text: `  •  ${vendor.country}`,
                size: 18,
                color: "9CA3AF",
                font: "Helvetica",
              })
            : new TextRun({ text: "" }),
          vendor?.website
            ? new TextRun({
                text: `  •  ${vendor.website}`,
                size: 18,
                color: "9CA3AF",
                font: "Helvetica",
              })
            : new TextRun({ text: "" }),
        ],
        spacing: { after: 100 },
      })
    );

    // Description
    elements.push(
      new Paragraph({
        children: [
          new TextRun({ text: product.description, size: 20, font: "Helvetica", color: "374151" }),
        ],
        spacing: { after: 150 },
      })
    );

    // Specs table (2 columns: Spec | Value)
    const specEntries = Object.entries(product.specs);
    if (specEntries.length > 0) {
      // Build spec rows
      const specRows = specEntries.map(
        ([key, value]) =>
          new TableRow({
            children: [
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: key,
                        bold: true,
                        size: 18,
                        color: "1E3350",
                        font: "Helvetica",
                      }),
                    ],
                  }),
                ],
                width: { size: 35, type: WidthType.PERCENTAGE },
                shading: { fill: "F8FAFC" },
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: String(value),
                        size: 18,
                        color: "374151",
                        font: "Helvetica",
                      }),
                    ],
                  }),
                ],
                width: { size: 65, type: WidthType.PERCENTAGE },
              }),
            ],
          })
      );

      // Add EV-specific specs
      if (isEVCharger) {
        const evProduct = product as EVChargerProduct;
        specRows.push(
          new TableRow({
            children: [
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: "Charger Class",
                        bold: true,
                        size: 18,
                        color: "1E3350",
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
                        text:
                          evProduct.chargerLevel === "level-2"
                            ? "Level 2 AC"
                            : evProduct.chargerLevel === "dcfc"
                              ? "DC Fast Charge"
                              : "High Power Charge",
                        size: 18,
                        color: "374151",
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
                        text: "Connectors",
                        bold: true,
                        size: 18,
                        color: "1E3350",
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
                        text: evProduct.connectors.join(", "),
                        size: 18,
                        color: "374151",
                        font: "Helvetica",
                      }),
                    ],
                  }),
                ],
              }),
            ],
          })
        );
      }

      elements.push(
        new Paragraph({
          children: [
            new TextRun({
              text: "SPECIFICATIONS",
              bold: true,
              size: 18,
              color: "6B7280",
              font: "Helvetica",
            }),
          ],
          spacing: { before: 100, after: 60 },
        })
      );

      // We need to create a table but it must be added as a separate element
      // Since we're returning Paragraph[], we'll format specs as compact text instead
      const specLines = specEntries.map(([key, val]) => `${key}: ${val}`);
      if (isEVCharger) {
        const evProduct = product as EVChargerProduct;
        const levelLabel =
          evProduct.chargerLevel === "level-2"
            ? "Level 2 AC"
            : evProduct.chargerLevel === "dcfc"
              ? "DC Fast Charge"
              : "High Power Charge";
        specLines.push(`Charger Class: ${levelLabel}`);
        specLines.push(`Connectors: ${evProduct.connectors.join(", ")}`);
      }

      // Split specs into two columns for cleaner layout
      const mid = Math.ceil(specLines.length / 2);
      const col1 = specLines.slice(0, mid);
      const col2 = specLines.slice(mid);

      col1.forEach((spec, i) => {
        const children: TextRun[] = [
          new TextRun({ text: `  •  ${spec}`, size: 18, color: "374151", font: "Helvetica" }),
        ];
        if (col2[i]) {
          children.push(
            new TextRun({
              text: `      •  ${col2[i]}`,
              size: 18,
              color: "374151",
              font: "Helvetica",
            })
          );
        }
        elements.push(new Paragraph({ children, spacing: { after: 30 } }));
      });
    }

    // Key features
    if (product.features && product.features.length > 0) {
      elements.push(
        new Paragraph({
          children: [
            new TextRun({
              text: "KEY FEATURES",
              bold: true,
              size: 18,
              color: "6B7280",
              font: "Helvetica",
            }),
          ],
          spacing: { before: 120, after: 60 },
        })
      );
      product.features.forEach((feature) => {
        elements.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `  ✓  ${feature}`,
                size: 18,
                color: "065F46",
                font: "Helvetica",
              }),
            ],
            spacing: { after: 20 },
          })
        );
      });
    }

    // Certifications + Warranty (inline)
    const certWarranty: TextRun[] = [];
    if (product.certifications && product.certifications.length > 0) {
      certWarranty.push(
        new TextRun({
          text: "Certifications: ",
          bold: true,
          size: 18,
          color: "6B7280",
          font: "Helvetica",
        }),
        new TextRun({
          text: product.certifications.join(", "),
          size: 18,
          color: "374151",
          font: "Helvetica",
        })
      );
    }
    if (product.warranty) {
      if (certWarranty.length > 0) {
        certWarranty.push(
          new TextRun({ text: "   |   ", size: 18, color: "D1D5DB", font: "Helvetica" })
        );
      }
      certWarranty.push(
        new TextRun({
          text: "Warranty: ",
          bold: true,
          size: 18,
          color: "6B7280",
          font: "Helvetica",
        }),
        new TextRun({ text: product.warranty, size: 18, color: "374151", font: "Helvetica" })
      );
    }
    if (certWarranty.length > 0) {
      elements.push(new Paragraph({ children: certWarranty, spacing: { before: 100, after: 60 } }));
    }

    // Divider between products
    if (index < products.length - 1) {
      elements.push(
        new Paragraph({
          children: [
            new TextRun({
              text: "─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─",
              color: "E5E7EB",
              size: 18,
              font: "Helvetica",
            }),
          ],
          spacing: { before: 200, after: 100 },
        })
      );
    }
  });

  // Footer note
  elements.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "Equipment specifications are based on manufacturer published data. Final configuration may vary based on site-specific engineering requirements. ",
          size: 16,
          italics: true,
          color: "9CA3AF",
          font: "Helvetica",
        }),
        new TextRun({
          text: "Merlin works with authorized distributors to ensure competitive pricing and full manufacturer warranty coverage.",
          size: 16,
          italics: true,
          color: "9CA3AF",
          font: "Helvetica",
        }),
      ],
      spacing: { before: 300, after: 200 },
    })
  );

  return elements;
}

// Type import needed for EVChargerProduct in gallery builder — imported at top

export async function generateWordDocument(quoteData: QuotePreviewData): Promise<void> {
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
  } = quoteData;

  // Generate calculation breakdown for appendix
  const calculations = generateCalculationBreakdown(
    bessPowerMW,
    duration || 4,
    solarMW,
    windMW || 0,
    generatorMW,
    batteryMWh * 1000, // Convert to kWh
    bessPowerMW * 1000, // Convert to kW
    0.12, // BOS percent
    0.15, // EPC percent
    generatorMW * 1000, // Gen kW
    solarMW * 1000, // Solar kWp
    (windMW || 0) * 1000, // Wind kW
    location
  );

  const calcTables = createCalculationTables(calculations);

  // Fetch Merlin image for Word doc embedding
  let merlinImageData: ArrayBuffer | null = null;
  try {
    const resp = await fetch(merlinImageUrl);
    merlinImageData = await resp.arrayBuffer();
  } catch (e) {
    console.warn("Could not load Merlin image for Word doc");
  }

  // Pre-generate equipment icons for the pricing table
  const equipIcons = await preloadAllIcons(36);

  /** Helper: create an ImageRun for an equipment icon, with emoji text fallback */
  const iconOrEmoji = (type: EquipmentType): ImageRun | TextRun => {
    const iconData = equipIcons.get(type);
    if (iconData) {
      return new ImageRun({
        type: "png",
        data: iconData,
        transformation: { width: 22, height: 22 },
      });
    }
    return new TextRun({ text: getEquipmentEmoji(type) + " ", size: 22, font: "Helvetica" });
  };

  // Sales-focused pricing: Equipment-only quote total
  const bmsCost = Math.round(costs.batterySystem * 0.05);
  const essEnclosureCost = Math.round(costs.batterySystem * 0.08);
  const monitoringCost = Math.round(costs.batterySystem * 0.02);
  const coreEquipmentTotal =
    costs.batterySystem +
    (costs.pcs + costs.inverters) +
    costs.transformers +
    costs.switchgear +
    (costs.microgridControls || 0) +
    bmsCost +
    essEnclosureCost +
    monitoringCost;
  const renewablesTotal =
    (solarMW > 0 ? costs.solar + (costs.solarInverters || 0) : 0) +
    (windMW > 0 ? costs.wind + (costs.windConverters || 0) : 0) +
    (generatorMW > 0 ? costs.generator + (costs.generatorControls || 0) : 0);
  const equipmentTotal = coreEquipmentTotal + renewablesTotal;
  const implementationEstimate = costs.bos + costs.epc + costs.tariffs + costs.shipping;
  const batteryPricePerKWh = Math.round(costs.batterySystem / (batteryMWh * 1000));
  const pricePerKWh = batteryPricePerKWh;
  const allInPerKWh = Math.round(equipmentTotal / (batteryMWh * 1000));

  // NPV @ 8% discount rate (10-year horizon)
  const discountRate = 0.08;
  let npv10yr = -equipmentTotal;
  for (let t = 1; t <= 10; t++) {
    npv10yr += annualSavings / Math.pow(1 + discountRate, t);
  }

  // Estimated IRR (Newton-Raphson approximation, 25-year horizon)
  let irr = 0.1;
  for (let iter = 0; iter < 50; iter++) {
    let npvCalc = -equipmentTotal;
    let dNpv = 0;
    for (let t = 1; t <= 25; t++) {
      const pv = annualSavings / Math.pow(1 + irr, t);
      npvCalc += pv;
      dNpv -= (t * pv) / (1 + irr);
    }
    if (Math.abs(dNpv) < 0.01) break;
    const newIrr = irr - npvCalc / dNpv;
    if (Math.abs(newIrr - irr) < 0.0001) break;
    irr = Math.max(0, Math.min(newIrr, 1));
  }
  const irrPercent = Math.max(0, irr * 100);

  // Vendor equipment selection (for gallery and equipment table)
  const equip = selectEquipmentForQuote({
    bessKWh: batteryMWh * 1000,
    solarMW,
    generatorMW,
  });
  const selectedBattery = equip.find((p) => p.category === "battery") ?? null;
  const selectedInverter = equip.find((p) => p.category === "inverter") ?? null;
  const selectedEvCharger = equip.find((p) => p.category === "ev-charger") as
    | import("../../data/vendorEquipment").EVChargerProduct
    | null;

  // Build DocContext for section builders
  const ctx: import("./quoteDocBuilders").DocContext = {
    clientName,
    projectName,
    bessPowerMW,
    batteryMWh,
    duration: duration || 4,
    solarMW,
    windMW: windMW || 0,
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
    bmsCost: Math.round(costs.batterySystem * 0.05),
    essEnclosureCost: Math.round(costs.batterySystem * 0.08),
    monitoringCost: Math.round(costs.batterySystem * 0.02),
    selectedBattery,
    selectedInverter,
    selectedEvCharger,
  };

  // Build all sections using extracted builders
  const {
    buildSalesHeader,
    buildProjectInfo,
    buildExecutiveSummary,
    buildProjectOverview,
    buildEquipmentTable,
    buildImplementationCosts,
    buildROI,
    buildImplementationCert,
    buildSummaryNextSteps,
    buildTrueQuoteVerification,
    buildAppendix,
  } = await import("./quoteDocBuilders");

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          ...buildSalesHeader(ctx),
          ...buildProjectInfo(ctx),
          ...buildExecutiveSummary(ctx),
          ...buildProjectOverview(ctx),
          ...buildEquipmentTable(ctx),
          ...buildImplementationCosts(ctx),
          ...buildROI(ctx),
          ...buildImplementationCert(ctx),
          ...buildSummaryNextSteps(ctx),
          ...buildTrueQuoteVerification(ctx),
          ...buildAppendix(ctx),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(
    blob,
    `BESS_Quote_${projectName.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.docx`
  );
}
