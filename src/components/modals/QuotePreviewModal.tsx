import React from 'react';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, HeadingLevel, PageBreak, ImageRun, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';
import { generateCalculationBreakdown } from '../../utils/calculationFormulas';
import { createCalculationTables } from '../../utils/wordHelpers';
import magicPoofSound from '../../assets/sounds/Magic_Poof.mp3';
import merlinImageUrl from '../../assets/images/new_small_profile_.png';
import { preloadAllIcons, getEquipmentEmoji } from '../../utils/equipmentImageLibrary';
import type { EquipmentType } from '../../utils/equipmentImageLibrary';
import { selectEquipmentForQuote, getVendor, formatSpecsForExport } from '../../data/vendorEquipment';
import type { VendorProduct, EVChargerProduct } from '../../data/vendorEquipment';

interface QuotePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  quoteData: {
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
}

// Helper functions for Word document
const boldParagraph = (text: string) => new Paragraph({
  children: [new TextRun({ text, bold: true })],
});

const createHeaderRow = (headers: string[], bgColor: string = "0C1631") => new TableRow({
  children: headers.map(header =>
    new TableCell({
      children: [boldParagraph(header)],
      shading: { fill: bgColor },
    })
  ),
});

const createDataRow = (cells: string[]) => new TableRow({
  children: cells.map(cell =>
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
      children: [new TextRun({ text: "YOUR SYSTEM EQUIPMENT", bold: true, size: 30, color: "FFFFFF", font: "Helvetica" })],
      spacing: { before: 100, after: 100 },
      shading: { fill: "1E3350" },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "The following equipment has been selected for your project. All products are from industry-leading manufacturers with proven track records in energy infrastructure.", size: 22, font: "Helvetica", color: "4B5563" }),
      ],
      spacing: { after: 300 },
    }),
  );

  // Product cards
  products.forEach((product: VendorProduct, index: number) => {
    const vendor = getVendor(product.vendorId);
    const vendorName = vendor?.name || product.vendorId;
    const isEVCharger = product.category === 'ev-charger';

    // Category label mapping
    const categoryLabels: Record<string, string> = {
      'ev-charger': '⚡ EV CHARGER',
      'battery': '🔋 BATTERY STORAGE',
      'solar': '☀️ SOLAR',
      'inverter': '🔄 INVERTER / PCS',
      'generator': '🔥 GENERATOR',
      'transformer': '⚙️ TRANSFORMER',
      'switchgear': '🔀 SWITCHGEAR',
      'monitoring': '📊 MONITORING',
      'bms': '🔌 BMS',
      'enclosure': '📦 ENCLOSURE',
      'wind': '🌬️ WIND',
      'microgrid': '🏗️ MICROGRID',
    };

    // Category tag
    elements.push(
      new Paragraph({
        children: [
          new TextRun({
            text: categoryLabels[product.category] || product.category.toUpperCase(),
            bold: true, size: 18, color: "FBBF24", font: "Helvetica",
          }),
        ],
        spacing: { before: index > 0 ? 400 : 200, after: 80 },
      }),
    );

    // Product name + vendor
    elements.push(
      new Paragraph({
        children: [
          new TextRun({ text: product.name, bold: true, size: 28, color: "1E3350", font: "Helvetica" }),
          product.model ? new TextRun({ text: `  (${product.model})`, size: 22, color: "6B7280", font: "Helvetica" }) : new TextRun({ text: "" }),
        ],
        spacing: { after: 40 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: `by ${vendorName}`, size: 20, color: "14B8A6", font: "Helvetica" }),
          vendor?.country ? new TextRun({ text: `  •  ${vendor.country}`, size: 18, color: "9CA3AF", font: "Helvetica" }) : new TextRun({ text: "" }),
          vendor?.website ? new TextRun({ text: `  •  ${vendor.website}`, size: 18, color: "9CA3AF", font: "Helvetica" }) : new TextRun({ text: "" }),
        ],
        spacing: { after: 100 },
      }),
    );

    // Description
    elements.push(
      new Paragraph({
        children: [
          new TextRun({ text: product.description, size: 20, font: "Helvetica", color: "374151" }),
        ],
        spacing: { after: 150 },
      }),
    );

    // Specs table (2 columns: Spec | Value)
    const specEntries = Object.entries(product.specs);
    if (specEntries.length > 0) {
      // Build spec rows
      const specRows = specEntries.map(([key, value]) =>
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: key, bold: true, size: 18, color: "1E3350", font: "Helvetica" })] })],
              width: { size: 35, type: WidthType.PERCENTAGE },
              shading: { fill: "F8FAFC" },
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: String(value), size: 18, color: "374151", font: "Helvetica" })] })],
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
                children: [new Paragraph({ children: [new TextRun({ text: "Charger Class", bold: true, size: 18, color: "1E3350", font: "Helvetica" })] })],
                shading: { fill: "F8FAFC" },
              }),
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: evProduct.chargerLevel === 'level-2' ? 'Level 2 AC' : evProduct.chargerLevel === 'dcfc' ? 'DC Fast Charge' : 'High Power Charge', size: 18, color: "374151", font: "Helvetica" })] })],
              }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: "Connectors", bold: true, size: 18, color: "1E3350", font: "Helvetica" })] })],
                shading: { fill: "F8FAFC" },
              }),
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: evProduct.connectors.join(', '), size: 18, color: "374151", font: "Helvetica" })] })],
              }),
            ],
          }),
        );
      }

      elements.push(
        new Paragraph({
          children: [new TextRun({ text: "SPECIFICATIONS", bold: true, size: 18, color: "6B7280", font: "Helvetica" })],
          spacing: { before: 100, after: 60 },
        }),
      );

      // We need to create a table but it must be added as a separate element
      // Since we're returning Paragraph[], we'll format specs as compact text instead
      const specLines = specEntries.map(([key, val]) => `${key}: ${val}`);
      if (isEVCharger) {
        const evProduct = product as EVChargerProduct;
        const levelLabel = evProduct.chargerLevel === 'level-2' ? 'Level 2 AC' : evProduct.chargerLevel === 'dcfc' ? 'DC Fast Charge' : 'High Power Charge';
        specLines.push(`Charger Class: ${levelLabel}`);
        specLines.push(`Connectors: ${evProduct.connectors.join(', ')}`);
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
          children.push(new TextRun({ text: `      •  ${col2[i]}`, size: 18, color: "374151", font: "Helvetica" }));
        }
        elements.push(new Paragraph({ children, spacing: { after: 30 } }));
      });
    }

    // Key features
    if (product.features && product.features.length > 0) {
      elements.push(
        new Paragraph({
          children: [new TextRun({ text: "KEY FEATURES", bold: true, size: 18, color: "6B7280", font: "Helvetica" })],
          spacing: { before: 120, after: 60 },
        }),
      );
      product.features.forEach(feature => {
        elements.push(
          new Paragraph({
            children: [new TextRun({ text: `  ✓  ${feature}`, size: 18, color: "065F46", font: "Helvetica" })],
            spacing: { after: 20 },
          }),
        );
      });
    }

    // Certifications + Warranty (inline)
    const certWarranty: TextRun[] = [];
    if (product.certifications && product.certifications.length > 0) {
      certWarranty.push(
        new TextRun({ text: "Certifications: ", bold: true, size: 18, color: "6B7280", font: "Helvetica" }),
        new TextRun({ text: product.certifications.join(', '), size: 18, color: "374151", font: "Helvetica" }),
      );
    }
    if (product.warranty) {
      if (certWarranty.length > 0) {
        certWarranty.push(new TextRun({ text: "   |   ", size: 18, color: "D1D5DB", font: "Helvetica" }));
      }
      certWarranty.push(
        new TextRun({ text: "Warranty: ", bold: true, size: 18, color: "6B7280", font: "Helvetica" }),
        new TextRun({ text: product.warranty, size: 18, color: "374151", font: "Helvetica" }),
      );
    }
    if (certWarranty.length > 0) {
      elements.push(
        new Paragraph({ children: certWarranty, spacing: { before: 100, after: 60 } }),
      );
    }

    // Divider between products
    if (index < products.length - 1) {
      elements.push(
        new Paragraph({
          children: [new TextRun({ text: "─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─", color: "E5E7EB", size: 18, font: "Helvetica" })],
          spacing: { before: 200, after: 100 },
        }),
      );
    }
  });

  // Footer note
  elements.push(
    new Paragraph({
      children: [
        new TextRun({ text: "Equipment specifications are based on manufacturer published data. Final configuration may vary based on site-specific engineering requirements. ", size: 16, italics: true, color: "9CA3AF", font: "Helvetica" }),
        new TextRun({ text: "Merlin works with authorized distributors to ensure competitive pricing and full manufacturer warranty coverage.", size: 16, italics: true, color: "9CA3AF", font: "Helvetica" }),
      ],
      spacing: { before: 300, after: 200 },
    }),
  );

  return elements;
}

// Type import needed for EVChargerProduct in gallery builder — imported at top

const QuotePreviewModal: React.FC<QuotePreviewModalProps> = ({ isOpen, onClose, quoteData }) => {
  if (!isOpen) return null;

  const playDownloadSound = () => {
    try {
      const audio = new Audio(magicPoofSound);
      audio.volume = 0.5;
    } catch (err) {
    }
  };

  const generateWordDocument = async () => {
    // Play magical sound effect
    playDownloadSound();
    
    const {
      clientName,
      projectName,
      bessPowerMW,
      batteryMWh,
      duration,
      solarMW,
       
      windMW,
      generatorMW,
       
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
      console.warn('Could not load Merlin image for Word doc');
    }

    // Pre-generate equipment icons for the pricing table
    const equipIcons = await preloadAllIcons(36);
    
    /** Helper: create an ImageRun for an equipment icon, with emoji text fallback */
    const iconOrEmoji = (type: EquipmentType): (ImageRun | TextRun) => {
      const iconData = equipIcons.get(type);
      if (iconData) {
        return new ImageRun({ type: 'png', data: iconData, transformation: { width: 22, height: 22 } });
      }
      return new TextRun({ text: getEquipmentEmoji(type) + ' ', size: 22, font: "Helvetica" });
    };

    // Sales-focused pricing: Equipment-only quote total
    // EPC, BoS, installation shown as separate estimates (outsourced services)
    const bmsCost = Math.round(costs.batterySystem * 0.05);
    const essEnclosureCost = Math.round(costs.batterySystem * 0.08);
    const monitoringCost = Math.round(costs.batterySystem * 0.02);
    const coreEquipmentTotal = costs.batterySystem + (costs.pcs + costs.inverters) +
      costs.transformers + costs.switchgear + (costs.microgridControls || 0) +
      bmsCost + essEnclosureCost + monitoringCost;
    const renewablesTotal = (solarMW > 0 ? costs.solar + (costs.solarInverters || 0) : 0) +
      (windMW > 0 ? costs.wind + (costs.windConverters || 0) : 0) +
      (generatorMW > 0 ? costs.generator + (costs.generatorControls || 0) : 0);
    const equipmentTotal = coreEquipmentTotal + renewablesTotal;
    const implementationEstimate = costs.bos + costs.epc + costs.tariffs + costs.shipping;
    const pricePerKWh = Math.round(equipmentTotal / (batteryMWh * 1000));

    const doc = new Document({
      sections: [{
        properties: {},
        children: [
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
                          new TextRun({ text: "BESS PROPOSAL", bold: true, size: 52, color: "FFFFFF", font: "Helvetica" }),
                        ],
                        spacing: { before: 300, after: 60 },
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({ text: `$${pricePerKWh}/kWh`, bold: true, size: 40, color: "FBBF24", font: "Helvetica" }),
                          new TextRun({ text: "  All-In Equipment", size: 20, color: "94A3B8", font: "Helvetica" }),
                        ],
                        spacing: { after: 80 },
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({ text: "✦ TrueQuote™ Verified", bold: true, size: 20, color: "FBBF24", font: "Helvetica" }),
                          new TextRun({ text: "  ·  NREL, EIA, IEEE & industry sources", size: 18, color: "94A3B8", font: "Helvetica" }),
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
                      ...(merlinImageData ? [
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
                      ] : [
                        new Paragraph({
                          children: [new TextRun({ text: "🧙‍♂️", bold: true, size: 100, font: "Helvetica" })],
                          alignment: AlignmentType.CENTER,
                          spacing: { before: 200, after: 60 },
                        }),
                      ]),
                      new Paragraph({
                        children: [
                          new TextRun({ text: "MERLIN", bold: true, size: 44, color: "FBBF24", font: "Helvetica" }),
                        ],
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 20 },
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({ text: "Energy Solutions", italics: true, size: 22, color: "CBD5E1", font: "Helvetica" }),
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

          // PROJECT INFORMATION Table
          new Paragraph({
            children: [new TextRun({ text: "PROJECT INFORMATION", bold: true, size: 30, color: "1E3350", font: "Helvetica" })],
            spacing: { before: 100, after: 200 },
            shading: { fill: "F0F2F7" },
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Client Name:", bold: true })] })] }),
                  new TableCell({ children: [new Paragraph(clientName || "Client Name")] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Project Name:", bold: true })] })] }),
                  new TableCell({ children: [new Paragraph(projectName || "Untitled Project")] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Quote Date:", bold: true })] })] }),
                  new TableCell({ children: [new Paragraph(new Date().toLocaleDateString())] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Location:", bold: true })] })] }),
                  new TableCell({ children: [new Paragraph(location || "United States")] }),
                ],
              }),
              ...(tariffRegion ? [
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Tariff Region:", bold: true })] })] }),
                    new TableCell({ children: [new Paragraph(tariffRegion)] }),
                  ],
                }),
              ] : []),
              ...(shippingDestination ? [
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Shipping To:", bold: true })] })] }),
                    new TableCell({ children: [new Paragraph(shippingDestination)] }),
                  ],
                }),
              ] : []),
              ...(projectTimeframe ? [
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Project Timeframe:", bold: true })] })] }),
                    new TableCell({ children: [new Paragraph(projectTimeframe)] }),
                  ],
                }),
              ] : []),
              ...(primaryGoal ? [
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Primary Goal:", bold: true })] })] }),
                    new TableCell({ children: [new Paragraph(primaryGoal.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()))] }),
                  ],
                }),
              ] : []),
            ],
          }),

          new Paragraph({ text: "", spacing: { after: 400 } }),

          // 1. EXECUTIVE SUMMARY
          new Paragraph({
            border: {
              top: { color: "E2E8F0", space: 4, style: BorderStyle.SINGLE, size: 6 },
            },
            children: [],
            spacing: { before: 300, after: 100 },
          }),
          new Paragraph({
            children: [new TextRun({ text: "1. EXECUTIVE SUMMARY", bold: true, size: 30, color: "FFFFFF", font: "Helvetica" })],
            spacing: { before: 100, after: 200 },
            shading: { fill: "1E3350" },
          }),
          new Paragraph({
            children: [new TextRun({ text: `This proposal delivers a ${batteryMWh.toFixed(1)} MWh Battery Energy Storage System at $${pricePerKWh}/kWh — designed to reduce your energy costs by $${annualSavings.toLocaleString()} annually with a ${paybackPeriod.toFixed(1)}-year payback.`, size: 24, font: "Helvetica" })],
            spacing: { after: 250 },
          }),

          // Executive Summary Metrics Table
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ 
                    children: [new Paragraph({ children: [new TextRun({ text: "KEY METRIC", bold: true, size: 24, color: "FFFFFF", font: "Helvetica" })] })],
                    shading: { fill: "1E3350" },
                  }),
                  new TableCell({ 
                    children: [new Paragraph({ children: [new TextRun({ text: "VALUE", bold: true, size: 24, color: "FBBF24", font: "Helvetica" })] })],
                    shading: { fill: "1E3350" },
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ 
                    children: [new Paragraph({ children: [new TextRun({ text: "Price per kWh", bold: true, size: 26, font: "Helvetica" })] })],
                    shading: { fill: "ECFDF5" },
                  }),
                  new TableCell({ 
                    children: [new Paragraph({ children: [new TextRun({ text: `$${pricePerKWh}/kWh`, bold: true, size: 26, color: "065F46", font: "Helvetica" })] })],
                    shading: { fill: "ECFDF5" },
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "System Capacity", bold: true, size: 24, font: "Helvetica" })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${batteryMWh.toFixed(1)} MWh / ${bessPowerMW} MW`, bold: true, size: 24, color: "1E3350", font: "Helvetica" })] })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ 
                    children: [new Paragraph({ children: [new TextRun({ text: "Equipment Investment", bold: true, size: 24, font: "Helvetica" })] })],
                    shading: { fill: "F0F2F7" },
                  }),
                  new TableCell({ 
                    children: [new Paragraph({ children: [new TextRun({ text: `$${equipmentTotal.toLocaleString()}`, bold: true, size: 24, color: "1E3350", font: "Helvetica" })] })],
                    shading: { fill: "F0F2F7" },
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ 
                    children: [new Paragraph({ children: [new TextRun({ text: "Annual Energy Savings", bold: true, size: 24, font: "Helvetica" })] })],
                    shading: { fill: "ECFDF5" },
                  }),
                  new TableCell({ 
                    children: [new Paragraph({ children: [new TextRun({ text: `$${annualSavings.toLocaleString()}/year`, bold: true, size: 24, color: "059669", font: "Helvetica" })] })],
                    shading: { fill: "ECFDF5" },
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ 
                    children: [new Paragraph({ children: [new TextRun({ text: "Payback Period", bold: true, size: 24, font: "Helvetica" })] })],
                    shading: { fill: "FEF9E7" },
                  }),
                  new TableCell({ 
                    children: [new Paragraph({ children: [new TextRun({ text: `${paybackPeriod.toFixed(1)} years`, bold: true, size: 24, color: "D97706", font: "Helvetica" })] })],
                    shading: { fill: "FEF9E7" },
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ 
                    children: [new Paragraph({ children: [new TextRun({ text: "10-Year Net Savings", bold: true, size: 24, font: "Helvetica" })] })],
                    shading: { fill: "ECFDF5" },
                  }),
                  new TableCell({ 
                    children: [new Paragraph({ children: [new TextRun({ 
                      text: `$${((annualSavings * 10) - equipmentTotal).toLocaleString()}`, 
                      bold: true, size: 24, color: "059669", font: "Helvetica"
                    })] })],
                    shading: { fill: "ECFDF5" },
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "System Warranty", bold: true, size: 24, font: "Helvetica" })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${warranty} Years`, bold: true, size: 24, color: "1E3350", font: "Helvetica" })] })] }),
                ],
              }),
            ],
          }),

          new Paragraph({ text: "", spacing: { after: 400 } }),

          // 2. PROJECT OVERVIEW & VISUALIZATION
          new Paragraph({
            border: {
              bottom: { color: "FBBF24", space: 2, style: BorderStyle.SINGLE, size: 6 },
            },
            children: [],
            spacing: { before: 400, after: 100 },
          }),
          new Paragraph({
            children: [new TextRun({ text: "2. PROJECT OVERVIEW & VISUALIZATION", bold: true, size: 30, color: "1E3350", font: "Helvetica" })],
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
                        children: [new TextRun({ text: "[Insert aerial or ground-level photo of installation site]", italics: true })],
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
                        children: [new TextRun({ text: "[Insert technical diagram showing BESS configuration and connections]", italics: true })],
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

          // 3. EQUIPMENT QUOTE
          new Paragraph({
            border: {
              bottom: { color: "FBBF24", space: 2, style: BorderStyle.SINGLE, size: 6 },
            },
            children: [],
            spacing: { before: 400, after: 100 },
          }),
          new Paragraph({
            children: [new TextRun({ text: "3. EQUIPMENT & SOFTWARE QUOTE", bold: true, size: 30, color: "FFFFFF", font: "Helvetica" })],
            spacing: { before: 100, after: 200 },
            shading: { fill: "1E3350" },
          }),

          // $/kWh Prominent Callout
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    shading: { fill: "ECFDF5" },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({ text: `  $${pricePerKWh}/kWh  `, bold: true, size: 40, color: "065F46", font: "Helvetica" }),
                          new TextRun({ text: `  |  Equipment Total: $${equipmentTotal.toLocaleString()}`, bold: true, size: 24, color: "1E3350", font: "Helvetica" }),
                          new TextRun({ text: `  |  ${batteryMWh.toFixed(1)} MWh System`, size: 22, color: "6B7280", font: "Helvetica" }),
                        ],
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 200, after: 200 },
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),

          new Paragraph({ text: "", spacing: { after: 200 } }),

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
                    children: [new Paragraph({ children: [new TextRun({ text: "EQUIPMENT", bold: true, size: 24, color: "FFFFFF", font: "Helvetica" })] })],
                    shading: { fill: "1E3350" },
                  }),
                  new TableCell({ 
                    children: [new Paragraph({ children: [new TextRun({ text: "SPECIFICATION", bold: true, size: 24, color: "FFFFFF", font: "Helvetica" })] })],
                    shading: { fill: "1E3350" },
                  }),
                  new TableCell({ 
                    children: [new Paragraph({ children: [new TextRun({ text: "PRICE (USD)", bold: true, size: 24, color: "FBBF24", font: "Helvetica" })] })],
                    shading: { fill: "1E3350" },
                  }),
                ],
              }),
              // Battery System
              new TableRow({
                children: [
                  new TableCell({ width: { size: 6, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [iconOrEmoji('battery')], alignment: AlignmentType.CENTER })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Battery Energy Storage (BESS)", bold: true, size: 22, font: "Helvetica" })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${batteryMWh.toFixed(1)} MWh LFP Chemistry`, size: 22, font: "Helvetica" })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `$${costs.batterySystem.toLocaleString()}`, size: 22, font: "Helvetica" })] })] }),
                ],
              }),
              // Power Conversion System
              new TableRow({
                children: [
                  new TableCell({ width: { size: 6, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [iconOrEmoji('inverter')], alignment: AlignmentType.CENTER })], shading: { fill: "F8FAFC" } }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Power Conversion System (PCS)", bold: true, size: 22, font: "Helvetica" })] })], shading: { fill: "F8FAFC" } }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${bessPowerMW} MW Bi-directional Inverter`, size: 22, font: "Helvetica" })] })], shading: { fill: "F8FAFC" } }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `$${(costs.pcs + costs.inverters).toLocaleString()}`, size: 22, font: "Helvetica" })] })], shading: { fill: "F8FAFC" } }),
                ],
              }),
              // Battery Management System (BMS) - NEW
              new TableRow({
                children: [
                  new TableCell({ width: { size: 6, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [iconOrEmoji('bms')], alignment: AlignmentType.CENTER })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Battery Management System (BMS)", bold: true, size: 22, font: "Helvetica" })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Cell balancing, safety monitoring, SOC tracking", size: 22, font: "Helvetica" })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `$${bmsCost.toLocaleString()}`, size: 22, font: "Helvetica" })] })] }),
                ],
              }),
              // ESS Enclosure & Thermal - NEW
              new TableRow({
                children: [
                  new TableCell({ width: { size: 6, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [iconOrEmoji('enclosure')], alignment: AlignmentType.CENTER })], shading: { fill: "F8FAFC" } }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "ESS Enclosure & Thermal Management", bold: true, size: 22, font: "Helvetica" })] })], shading: { fill: "F8FAFC" } }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "NEMA-rated enclosure, HVAC cooling system", size: 22, font: "Helvetica" })] })], shading: { fill: "F8FAFC" } }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `$${essEnclosureCost.toLocaleString()}`, size: 22, font: "Helvetica" })] })], shading: { fill: "F8FAFC" } }),
                ],
              }),
              // BESS Monitoring Service - NEW
              new TableRow({
                children: [
                  new TableCell({ width: { size: 6, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [iconOrEmoji('monitoring')], alignment: AlignmentType.CENTER })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "BESS Monitoring & Software (Yr 1)", bold: true, size: 22, font: "Helvetica" })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Cloud monitoring, alerts, performance analytics", size: 22, font: "Helvetica" })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `$${monitoringCost.toLocaleString()}`, size: 22, font: "Helvetica" })] })] }),
                ],
              }),
              // Transformers & Switchgear
              new TableRow({
                children: [
                  new TableCell({ width: { size: 6, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [iconOrEmoji('transformer')], alignment: AlignmentType.CENTER })], shading: { fill: "F8FAFC" } }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Transformers & Switchgear", bold: true, size: 22, font: "Helvetica" })] })], shading: { fill: "F8FAFC" } }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${bessPowerMW} MW rated, protection systems`, size: 22, font: "Helvetica" })] })], shading: { fill: "F8FAFC" } }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `$${(costs.transformers + costs.switchgear).toLocaleString()}`, size: 22, font: "Helvetica" })] })], shading: { fill: "F8FAFC" } }),
                ],
              }),
              // Solar (conditional)
              ...(solarMW > 0 ? [
                new TableRow({
                  children: [
                    new TableCell({ width: { size: 6, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [iconOrEmoji('solar')], alignment: AlignmentType.CENTER })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Solar Array + Inverters", bold: true, size: 22, font: "Helvetica" })] })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${solarMW} MW PV system`, size: 22, font: "Helvetica" })] })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `$${(costs.solar + (costs.solarInverters || 0)).toLocaleString()}`, size: 22, font: "Helvetica" })] })] }),
                  ],
                }),
              ] : []),
              // Generator (conditional)
              ...(generatorMW > 0 ? [
                new TableRow({
                  children: [
                    new TableCell({ width: { size: 6, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [iconOrEmoji('generator')], alignment: AlignmentType.CENTER })], shading: { fill: "F8FAFC" } }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Generator Backup", bold: true, size: 22, font: "Helvetica" })] })], shading: { fill: "F8FAFC" } }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${generatorMW} MW Natural Gas`, size: 22, font: "Helvetica" })] })], shading: { fill: "F8FAFC" } }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `$${(costs.generator + (costs.generatorControls || 0)).toLocaleString()}`, size: 22, font: "Helvetica" })] })], shading: { fill: "F8FAFC" } }),
                  ],
                }),
              ] : []),
              // EQUIPMENT TOTAL
              new TableRow({
                children: [
                  new TableCell({ 
                    width: { size: 6, type: WidthType.PERCENTAGE },
                    children: [new Paragraph({ children: [new TextRun({ text: "✓", bold: true, size: 28, color: "FFFFFF", font: "Helvetica" })], alignment: AlignmentType.CENTER })],
                    shading: { fill: "065F46" },
                  }),
                  new TableCell({ 
                    children: [new Paragraph({ children: [new TextRun({ text: "EQUIPMENT TOTAL", bold: true, size: 28, color: "FFFFFF", font: "Helvetica" })] })],
                    shading: { fill: "065F46" },
                  }),
                  new TableCell({ 
                    children: [new Paragraph({ children: [new TextRun({ text: `$${pricePerKWh}/kWh`, bold: true, size: 24, color: "FFFFFF", font: "Helvetica" })] })],
                    shading: { fill: "065F46" },
                  }),
                  new TableCell({ 
                    children: [new Paragraph({ children: [new TextRun({ text: `$${equipmentTotal.toLocaleString()}`, bold: true, size: 28, color: "FBBF24", font: "Helvetica" })] })],
                    shading: { fill: "065F46" },
                  }),
                ],
              }),
            ],
          }),

          new Paragraph({ text: "", spacing: { after: 300 } }),

          // ESTIMATED IMPLEMENTATION COSTS (separate, not in equipment total)
          new Paragraph({
            children: [
              new TextRun({ text: "ESTIMATED IMPLEMENTATION COSTS", bold: true, size: 24, color: "6B7280", font: "Helvetica" }),
              new TextRun({ text: "  (Not included in equipment total — final costs determined by selected EPC provider)", italics: true, size: 18, color: "9CA3AF", font: "Helvetica" }),
            ],
            spacing: { before: 200, after: 150 },
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ 
                    children: [new Paragraph({ children: [new TextRun({ text: "SERVICE", bold: true, size: 20, color: "6B7280", font: "Helvetica" })] })],
                    shading: { fill: "F3F4F6" },
                  }),
                  new TableCell({ 
                    children: [new Paragraph({ children: [new TextRun({ text: "DESCRIPTION", bold: true, size: 20, color: "6B7280", font: "Helvetica" })] })],
                    shading: { fill: "F3F4F6" },
                  }),
                  new TableCell({ 
                    children: [new Paragraph({ children: [new TextRun({ text: "EST. RANGE", bold: true, size: 20, color: "6B7280", font: "Helvetica" })] })],
                    shading: { fill: "F3F4F6" },
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Balance of System (BoS)", size: 20, font: "Helvetica" })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Cabling, racking, site materials", size: 20, font: "Helvetica" })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `~$${costs.bos.toLocaleString()}`, italics: true, size: 20, color: "6B7280", font: "Helvetica" })] })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "EPC Services", size: 20, font: "Helvetica" })] })], shading: { fill: "FAFAFA" } }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Engineering, procurement, construction", size: 20, font: "Helvetica" })] })], shading: { fill: "FAFAFA" } }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `~$${costs.epc.toLocaleString()}`, italics: true, size: 20, color: "6B7280", font: "Helvetica" })] })], shading: { fill: "FAFAFA" } }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Tariffs & Shipping", size: 20, font: "Helvetica" })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${tariffRegion || 'Regional'} duties + logistics`, size: 20, font: "Helvetica" })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `~$${(costs.tariffs + costs.shipping).toLocaleString()}`, italics: true, size: 20, color: "6B7280", font: "Helvetica" })] })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ 
                    children: [new Paragraph({ children: [new TextRun({ text: "EST. IMPLEMENTATION TOTAL", bold: true, size: 20, color: "6B7280", font: "Helvetica" })] })],
                    shading: { fill: "F3F4F6" },
                  }),
                  new TableCell({ 
                    children: [new Paragraph({ children: [new TextRun({ text: "Subject to EPC provider pricing", italics: true, size: 18, color: "9CA3AF", font: "Helvetica" })] })],
                    shading: { fill: "F3F4F6" },
                  }),
                  new TableCell({ 
                    children: [new Paragraph({ children: [new TextRun({ text: `~$${implementationEstimate.toLocaleString()}`, bold: true, italics: true, size: 20, color: "6B7280", font: "Helvetica" })] })],
                    shading: { fill: "F3F4F6" },
                  }),
                ],
              }),
            ],
          }),

          new Paragraph({ text: "", spacing: { after: 400 } }),

          // SYSTEM ARCHITECTURE DIAGRAM
          new Paragraph({
            border: {
              bottom: { color: "FBBF24", space: 2, style: BorderStyle.SINGLE, size: 6 },
            },
            children: [],
            spacing: { before: 200, after: 100 },
          }),
          new Paragraph({
            children: [new TextRun({ text: "SYSTEM ARCHITECTURE", bold: true, size: 30, color: "FFFFFF", font: "Helvetica" })],
            spacing: { before: 100, after: 200 },
            shading: { fill: "1E3350" },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Your ${batteryMWh.toFixed(1)} MWh BESS system includes the following integrated components:`, size: 22, font: "Helvetica" }),
            ],
            spacing: { after: 200 },
          }),
          // Architecture flow: text-based single-line diagram
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    shading: { fill: "F0F9FF" },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({ text: "UTILITY GRID", bold: true, size: 22, color: "1E3350", font: "Helvetica" }),
                          new TextRun({ text: "  ⟶  ", size: 24, color: "FBBF24", font: "Helvetica" }),
                          new TextRun({ text: "SWITCHGEAR", bold: true, size: 22, color: "1E3350", font: "Helvetica" }),
                          new TextRun({ text: "  ⟶  ", size: 24, color: "FBBF24", font: "Helvetica" }),
                          new TextRun({ text: "TRANSFORMER", bold: true, size: 22, color: "1E3350", font: "Helvetica" }),
                          new TextRun({ text: "  ⟶  ", size: 24, color: "FBBF24", font: "Helvetica" }),
                          new TextRun({ text: "PCS / INVERTER", bold: true, size: 22, color: "1E3350", font: "Helvetica" }),
                          new TextRun({ text: "  ⟶  ", size: 24, color: "FBBF24", font: "Helvetica" }),
                          new TextRun({ text: "BATTERY BANK", bold: true, size: 22, color: "065F46", font: "Helvetica" }),
                        ],
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 200, after: 100 },
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({ text: "AC Power", size: 18, color: "6B7280", font: "Helvetica" }),
                          new TextRun({ text: "                    ", size: 18, font: "Helvetica" }),
                          new TextRun({ text: "Protection", size: 18, color: "6B7280", font: "Helvetica" }),
                          new TextRun({ text: "                    ", size: 18, font: "Helvetica" }),
                          new TextRun({ text: "Step-Down", size: 18, color: "6B7280", font: "Helvetica" }),
                          new TextRun({ text: "                    ", size: 18, font: "Helvetica" }),
                          new TextRun({ text: "AC ↔ DC", size: 18, color: "6B7280", font: "Helvetica" }),
                          new TextRun({ text: "                    ", size: 18, font: "Helvetica" }),
                          new TextRun({ text: `${batteryMWh.toFixed(1)} MWh LFP`, size: 18, color: "065F46", font: "Helvetica" }),
                        ],
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 150 },
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({ text: "  BMS ", bold: true, size: 18, color: "14B8A6", font: "Helvetica" }),
                          new TextRun({ text: " monitors all cells  |  ", size: 18, color: "6B7280", font: "Helvetica" }),
                          new TextRun({ text: "SCADA / EMS ", bold: true, size: 18, color: "14B8A6", font: "Helvetica" }),
                          new TextRun({ text: " provides remote monitoring & control", size: 18, color: "6B7280", font: "Helvetica" }),
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
          ...(solarMW > 0 ? [
            new Paragraph({
              children: [
                new TextRun({ text: `Solar Integration: ${solarMW} MW solar array feeds into the AC bus via dedicated solar inverters, `, size: 20, font: "Helvetica", color: "4B5563" }),
                new TextRun({ text: "enabling on-site generation and battery charging during daylight hours.", size: 20, font: "Helvetica", color: "4B5563" }),
              ],
              spacing: { before: 150, after: 100 },
            }),
          ] : []),
          ...(generatorMW > 0 ? [
            new Paragraph({
              children: [
                new TextRun({ text: `Generator Backup: ${generatorMW} MW natural gas generator provides emergency backup power and `, size: 20, font: "Helvetica", color: "4B5563" }),
                new TextRun({ text: "extends system resilience during extended grid outages.", size: 20, font: "Helvetica", color: "4B5563" }),
              ],
              spacing: { before: 100, after: 100 },
            }),
          ] : []),

          new Paragraph({ text: "", spacing: { after: 200 } }),

          // YOUR SYSTEM EQUIPMENT GALLERY
          ...buildEquipmentGallery({
            bessKWh: batteryMWh * 1000,
            solarMW,
            generatorMW,
          }),

          // 4. RETURN ON INVESTMENT
          new Paragraph({
            border: {
              bottom: { color: "FBBF24", space: 2, style: BorderStyle.SINGLE, size: 6 },
            },
            children: [],
            spacing: { before: 400, after: 100 },
          }),
          new Paragraph({
            children: [new TextRun({ text: "4. RETURN ON INVESTMENT", bold: true, size: 30, color: "FFFFFF", font: "Helvetica" })],
            spacing: { before: 100, after: 200 },
            shading: { fill: "1E3350" },
          }),
          new Paragraph({
            children: [new TextRun({ text: `Your BESS investment pays for itself in ${paybackPeriod.toFixed(1)} years, then delivers pure savings for the remaining system life (${warranty}+ year warranty).`, size: 24, font: "Helvetica" })],
            spacing: { after: 250 },
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ 
                    children: [new Paragraph({ children: [new TextRun({ text: "FINANCIAL METRIC", bold: true, size: 24, color: "FFFFFF", font: "Helvetica" })] })],
                    shading: { fill: "1E3350" },
                  }),
                  new TableCell({ 
                    children: [new Paragraph({ children: [new TextRun({ text: "VALUE", bold: true, size: 24, color: "FBBF24", font: "Helvetica" })] })],
                    shading: { fill: "1E3350" },
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ 
                    children: [new Paragraph({ children: [new TextRun({ text: "Annual Energy Savings", bold: true, size: 24, font: "Helvetica" })] })],
                    shading: { fill: "ECFDF5" },
                  }),
                  new TableCell({ 
                    children: [new Paragraph({ children: [new TextRun({ text: `$${annualSavings.toLocaleString()}/year`, bold: true, size: 24, color: "059669", font: "Helvetica" })] })],
                    shading: { fill: "ECFDF5" },
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Payback Period", bold: true, size: 24, font: "Helvetica" })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${paybackPeriod.toFixed(1)} years`, bold: true, size: 24, color: "D97706", font: "Helvetica" })] })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ 
                    children: [new Paragraph({ children: [new TextRun({ text: "10-Year Net Savings", bold: true, size: 24, font: "Helvetica" })] })],
                    shading: { fill: "ECFDF5" },
                  }),
                  new TableCell({ 
                    children: [new Paragraph({ children: [new TextRun({ 
                      text: `$${((annualSavings * 10) - equipmentTotal).toLocaleString()}`, 
                      bold: true, size: 24, color: "059669", font: "Helvetica"
                    })] })],
                    shading: { fill: "ECFDF5" },
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ 
                    children: [new Paragraph({ children: [new TextRun({ text: "25-Year Lifetime Savings", bold: true, size: 24, font: "Helvetica" })] })],
                    shading: { fill: "F0FFF4" },
                  }),
                  new TableCell({ 
                    children: [new Paragraph({ children: [new TextRun({ 
                      text: `$${((annualSavings * 25) - equipmentTotal).toLocaleString()}`, 
                      bold: true, size: 24, color: "059669", font: "Helvetica"
                    })] })],
                    shading: { fill: "F0FFF4" },
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Equipment $/kWh", bold: true, size: 24, font: "Helvetica" })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `$${pricePerKWh}/kWh`, bold: true, size: 24, color: "1E3350", font: "Helvetica" })] })] }),
                ],
              }),
              ...(budget ? [
                new TableRow({
                  children: [
                    new TableCell({ 
                      children: [new Paragraph({ children: [new TextRun({ text: "Budget Status", bold: true, size: 24, font: "Helvetica" })] })],
                      shading: { fill: "F0F2F7" },
                    }),
                    new TableCell({ 
                      children: [new Paragraph({ children: [new TextRun({ 
                        text: equipmentTotal <= budget 
                          ? `✓ Under budget by $${(budget - equipmentTotal).toLocaleString()}`
                          : `⚠ Over budget by $${(equipmentTotal - budget).toLocaleString()}`,
                        bold: true, size: 22, font: "Helvetica",
                        color: equipmentTotal <= budget ? "059669" : "D97706"
                      })] })],
                      shading: { fill: "F0F2F7" },
                    }),
                  ],
                }),
              ] : []),
            ],
          }),

          new Paragraph({ text: "", spacing: { after: 400 } }),

          // 5. IMPLEMENTATION & CERTIFICATIONS
          new Paragraph({
            children: [new TextRun({ text: "5. IMPLEMENTATION & CERTIFICATIONS", bold: true, size: 28, font: "Helvetica" })],
            spacing: { before: 400, after: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Project Timeline: ", bold: true }),
              new TextRun("12-16 weeks from contract execution to commissioning"),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Required Certifications: ", bold: true }),
              new TextRun("UL9540A, IEEE 1547"),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Warranty Period: ", bold: true }),
              new TextRun(`${warranty} comprehensive system warranty`),
            ],
            spacing: { after: 400 },
          }),

          // 6. SUMMARY & NEXT STEPS
          new Paragraph({
            children: [new TextRun({ text: "6. SUMMARY & NEXT STEPS", bold: true, size: 28, font: "Helvetica" })],
            spacing: { before: 400, after: 200 },
          }),
          new Paragraph({
            text: "This Battery Energy Storage System provides an optimal solution with strong financial returns and proven technology. The system delivers reliable storage, grid stabilization, and significant savings.",
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [new TextRun({ text: "Key Benefits:", bold: true })],
            spacing: { before: 200, after: 100 },
          }),
          new Paragraph({
            children: [new TextRun("• Peak demand reduction and energy cost optimization")],
            spacing: { after: 50 },
          }),
          new Paragraph({
            children: [new TextRun("• Grid stabilization and power quality improvement")],
            spacing: { after: 50 },
          }),
          new Paragraph({
            children: [new TextRun("• Backup power capability during outages")],
            spacing: { after: 50 },
          }),
          new Paragraph({
            children: [new TextRun("• Reduced carbon footprint and sustainability goals")],
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "This proposal is valid for 30 days. ", bold: true }),
              new TextRun("Please contact us to discuss next steps and begin the implementation process."),
            ],
            spacing: { after: 400 },
          }),
          
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
              new TextRun({ text: "TrueQuote™ Verification", bold: true, size: 30, color: "FFFFFF", font: "Helvetica" }),
            ],
            spacing: { before: 100, after: 200 },
            shading: { fill: "1E3350" },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "✨ TrueQuote™ Verified", bold: true, size: 20, color: "D97706" }),
              new TextRun({ text: " — Every number in this proposal is traceable to an authoritative source.", size: 20, color: "374151" }),
            ],
            spacing: { after: 150 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Source Attribution: ", bold: true, size: 18, color: "0C1631" }),
              new TextRun({ text: "NREL ATB 2024, NREL Cost Benchmark 2024, IRA 2022, IEEE Standards, EIA Database. All pricing validated against Q4 2025 market data.", size: 18, color: "6B7280" }),
            ],
            spacing: { after: 150 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Methodology: ", bold: true, size: 18, color: "0C1631" }),
              new TextRun({ text: "Equipment costs from NREL Annual Technology Baseline, financial modeling per industry-standard DCF analysis, utility rates from EIA regional data.", size: 18, color: "6B7280" }),
            ],
            spacing: { after: 400 },
          }),

          // APPENDIX: Calculation Reference
          new Paragraph({
            text: "",
            children: [new PageBreak()],
          }),
          new Paragraph({
            text: "APPENDIX A: CALCULATION REFERENCE",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
          }),
          new Paragraph({
            text: "This appendix provides the formulas used in this quote. All calculations are based on industry-standard methodologies and current market data (Q4 2025).",
            spacing: { after: 300 },
          }),
          
          // Add calculation tables
          ...calcTables,
          
          // Data Sources
          new Paragraph({
            text: "Data Sources & References",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "• NREL ATB 2024 - Utility-Scale Battery Storage: ", bold: true }),
              new TextRun({
                text: "https://atb.nrel.gov/electricity/2024/utility-scale_battery_storage",
                style: "Hyperlink",
              }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "• GSL Energy Commercial BESS Pricing 2025: ", bold: true }),
              new TextRun({
                text: "https://www.gslenergy.com/commercial-bess-pricing-2025/",
                style: "Hyperlink",
              }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "• SEIA/Wood Mackenzie Solar Market Insight Q4 2025: ", bold: true }),
              new TextRun({
                text: "https://www.seia.org/research-resources/solar-market-insight-report-2024-q4/",
                style: "Hyperlink",
              }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "• AWEA Wind Power Market Report 2025: ", bold: true }),
              new TextRun({
                text: "https://www.awea.org/wind-power-market-report-2025/",
                style: "Hyperlink",
              }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "• EIA Electric Generator Data System 2025: ", bold: true }),
              new TextRun({
                text: "https://www.eia.gov/electricity/data/eia860/",
                style: "Hyperlink",
              }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "• IEEE 2450 Battery Degradation Standards: ", bold: true }),
              new TextRun({
                text: "https://standards.ieee.org/ieee/2450/7719/",
                style: "Hyperlink",
              }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "• BloombergNEF - Li-ion Battery Pack Prices 2024: ", bold: true }),
              new TextRun({
                text: "https://about.bnef.com/insights/commodities/lithium-ion-battery-pack-prices-see-largest-drop-since-2017-falling-to-115-per-kilowatt-hour-bloombergnef/",
                style: "Hyperlink",
              }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "• HighJoule BESS Cost Guide 2024-2025: ", bold: true }),
              new TextRun({
                text: "https://www.highjoule.com/blog/battery-energy-storage-system-bess-costs-in-2024-2025-the-ultimate-guide-to-lcos-market-trends.html",
                style: "Hyperlink",
              }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "• Catalyst Power - Microgrid Installation Costs: ", bold: true }),
              new TextRun({
                text: "https://blog.catalystpower.com/more-power-to-you/what-are-the-upfront-costs-of-installing-a-microgrid-system",
                style: "Hyperlink",
              }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "• ComEd Hourly Pricing (Real-Time Rates): ", bold: true }),
              new TextRun({
                text: "https://hourlypricing.comed.com/live-prices/",
                style: "Hyperlink",
              }),
            ],
            spacing: { after: 300 },
          }),
          
          new Paragraph({
            children: [new TextRun({ text: "Confidential & Proprietary", italics: true })],
            alignment: AlignmentType.CENTER,
          }),
        ],
      }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `BESS_Quote_${projectName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.docx`);
  };

  const generateExcelData = () => {
    // Play magical sound effect
    playDownloadSound();
    
    // Enhanced CSV with proper alignment and formatting for Excel
    const { costs, bessPowerMW, batteryMWh, solarMW, windMW, generatorMW, annualSavings, paybackPeriod, budget } = quoteData;
    
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
    const csvEquipTotal = costs.batterySystem + (costs.pcs + costs.inverters) +
      costs.transformers + costs.switchgear + (costs.microgridControls || 0) +
      csvBmsCost + csvEssCost + csvMonCost +
      (solarMW > 0 ? costs.solar + (costs.solarInverters || 0) : 0) +
      (windMW > 0 ? costs.wind + (costs.windConverters || 0) : 0) +
      (generatorMW > 0 ? costs.generator + (costs.generatorControls || 0) : 0);
    const csvPricePerKWh = Math.round(csvEquipTotal / (batteryMWh * 1000));
    const csvImplEstimate = costs.bos + costs.epc + costs.tariffs + costs.shipping;
    
    let csv = "\"MERLIN ENERGY SOLUTIONS\",\"BATTERY ENERGY STORAGE SYSTEM - EQUIPMENT QUOTE\"\n";
    csv += `\"Generated:\",\"${new Date().toLocaleDateString()}\"\n`;
    csv += `\"Project:\",\"${quoteData.projectName}\"\n`;
    csv += `\"Client:\",\"${quoteData.clientName}\"\n`;
    csv += `\"Price per kWh:\",\"$${csvPricePerKWh}/kWh\"\n`;
    csv += `\"TrueQuote Verified:\",\"Yes - Source-backed pricing\"\n`;
    csv += "\n";
    
    csv += "\"═══ SYSTEM CONFIGURATION ═══════════════════════════════════\"\n";
    csv += "\"Metric\",\"Value\"\n";
    csv += `\"BESS Capacity\",\"${batteryMWh.toFixed(1)} MWh\"\n`;
    csv += `\"Power Rating\",\"${bessPowerMW} MW\"\n`;
    if (solarMW > 0) csv += `\"Solar Capacity\",\"${solarMW} MW\"\n`;
    if (windMW > 0) csv += `\"Wind Capacity\",\"${windMW} MW\"\n`;
    if (generatorMW > 0) csv += `\"Generator Backup\",\"${generatorMW} MW\"\n`;
    csv += `\"Warranty Period\",\"${quoteData.warranty} Years\"\n`;
    csv += "\n";
    
    // Equipment Quote (main pricing)
    csv += "\"═══ EQUIPMENT & SOFTWARE QUOTE ═════════════════════════════\"\n";
    csv += "\"Equipment\",\"Specification\",\"Price (USD)\"\n";
    csv += `\"Battery Energy Storage (BESS)\",\"${batteryMWh.toFixed(1)} MWh LFP\",${costs.batterySystem}\n`;
    csv += `\"Power Conversion System (PCS)\",\"${bessPowerMW} MW\",${costs.pcs + costs.inverters}\n`;
    csv += `\"Battery Management System (BMS)\",\"Cell balancing & monitoring\",${csvBmsCost}\n`;
    csv += `\"ESS Enclosure & Thermal\",\"NEMA-rated + HVAC cooling\",${csvEssCost}\n`;
    csv += `\"BESS Monitoring & Software (Yr 1)\",\"Cloud monitoring & analytics\",${csvMonCost}\n`;
    csv += `\"Transformers & Switchgear\",\"${bessPowerMW} MW rated\",${costs.transformers + costs.switchgear}\n`;
    if (costs.microgridControls > 0) csv += `\"Microgrid Controls\",\"System-wide\",${costs.microgridControls}\n`;
    
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
    csv += `\"EQUIPMENT TOTAL\",\"$${csvPricePerKWh}/kWh\",${csvEquipTotal}\n`;
    csv += "\n";
    
    // Estimated implementation (separate from main quote)
    csv += "\"═══ ESTIMATED IMPLEMENTATION (not included in equipment total) ═══\"\n";
    csv += "\"Service\",\"Description\",\"Est. Range (USD)\"\n";
    csv += `\"Balance of System (BoS)\",\"Cabling, racking, site materials\",\"~${costs.bos}\"\n`;
    csv += `\"EPC Services\",\"Engineering, procurement, construction\",\"~${costs.epc}\"\n`;
    csv += `\"Tariffs & Shipping\",\"Regional duties + logistics\",\"~${costs.tariffs + costs.shipping}\"\n`;
    csv += `\"EST. IMPLEMENTATION TOTAL\",\"Subject to EPC provider\",\"~${csvImplEstimate}\"\n`;
    csv += "\n";

    // Financial Analysis
    csv += "\"═══ RETURN ON INVESTMENT ═══════════════════════════════════\"\n";
    csv += "\"Financial Metric\",\"Value\"\n";
    csv += `\"Price per kWh\",\"$${csvPricePerKWh}/kWh\"\n`;
    csv += `\"Annual Energy Savings\",\"$${annualSavings.toLocaleString()}\"\n`;
    csv += `\"Payback Period\",\"${paybackPeriod.toFixed(1)} years\"\n`;
    csv += `\"10-Year Net Savings\",\"$${((annualSavings * 10) - csvEquipTotal).toLocaleString()}\"\n`;
    csv += `\"25-Year Lifetime Savings\",\"$${((annualSavings * 25) - csvEquipTotal).toLocaleString()}\"\n`;
    
    if (budget) {
      const budgetStatus = csvEquipTotal <= budget 
        ? `\"Under budget by $${(budget - csvEquipTotal).toLocaleString()}\"` 
        : `\"Over budget by $${(csvEquipTotal - budget).toLocaleString()}\"`;
      csv += `\"Budget Status\",${budgetStatus}\n`;
    }
    
    csv += "\n";
    csv += "\"═══════════════════════════════════════════════════════════\"\n";
    csv += "\"Generated by MERLIN Energy Solutions - TrueQuote Verified\"\n";
    csv += `\"Document Date: ${new Date().toISOString().split('T')[0]}\"\n`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `Merlin_BESS_Quote_${quoteData.projectName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto" style={{ background: '#0c1631', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="p-6 flex justify-between items-center sticky top-0 z-10" style={{ background: '#060d1f', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <h2 className="text-2xl font-bold text-white">
            📋 Quote Preview & Download
          </h2>
          <button 
            onClick={onClose}
            className="text-white/60 hover:text-white hover:bg-white/10 rounded-lg p-2 transition-all text-2xl"
          >
            ✕
          </button>
        </div>

        <div className="p-8 space-y-6">
          {/* Instruction Header */}
          <div className="text-white p-6 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <h3 className="text-xl font-bold mb-2 text-amber-400">✨ Your Quote is Ready!</h3>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>Review the details below and download your professional quote documents</p>
          </div>

          {/* Summary */}
          <div className="p-6 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <h3 className="text-lg font-semibold text-white mb-4">System Configuration</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-blue-400 font-medium text-xs">BESS Capacity:</p>
                <p className="text-white font-bold text-lg">{quoteData.batteryMWh.toFixed(1)} MWh</p>
              </div>
              <div>
                <p className="text-blue-400 font-medium text-xs">Power Rating:</p>
                <p className="text-white font-bold text-lg">{quoteData.bessPowerMW} MW</p>
              </div>
              {quoteData.solarMW > 0 && (
                <div>
                  <p className="text-amber-400 font-medium text-xs">Solar Capacity:</p>
                  <p className="text-white font-bold text-lg">{quoteData.solarMW} MW</p>
                </div>
              )}
              {quoteData.windMW > 0 && (
                <div>
                  <p className="text-cyan-400 font-medium text-xs">Wind Capacity:</p>
                  <p className="text-white font-bold text-lg">{quoteData.windMW} MW</p>
                </div>
              )}
              {quoteData.generatorMW > 0 && (
                <div>
                  <p className="text-orange-400 font-medium text-xs">Generator Backup:</p>
                  <p className="text-white font-bold text-lg">{quoteData.generatorMW} MW</p>
                </div>
              )}
            </div>
          </div>

          {/* Financial Summary */}
          <div className="p-6 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <h3 className="text-lg font-semibold text-white mb-4">Financial Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>Total Investment:</span>
                <span className="font-bold text-xl text-white">${quoteData.costs.grandTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>Annual Savings:</span>
                <span className="font-bold text-xl text-emerald-400">${quoteData.annualSavings.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>Payback Period:</span>
                <span className="font-bold text-xl text-blue-400">{quoteData.paybackPeriod.toFixed(2)} years</span>
              </div>
            </div>
          </div>

          {/* Industry Calculation Standards Reference */}
          <div className="p-6 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <h3 className="text-base font-semibold text-white mb-3 text-center flex items-center justify-center gap-2">
              <span className="text-xl">🔬</span>
              Industry-Standard Calculations
            </h3>
            <p className="text-center mb-4 font-medium text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
              All pricing and calculations in this quote are validated against authoritative industry sources
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span style={{ color: 'rgba(255,255,255,0.6)' }}>
                    <strong className="text-white">NREL ATB 2024:</strong> Battery storage costs & methodology
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span style={{ color: 'rgba(255,255,255,0.6)' }}>
                    <strong className="text-white">GSL Energy 2025:</strong> Commercial BESS pricing ($280-$580/kWh)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span style={{ color: 'rgba(255,255,255,0.6)' }}>
                    <strong className="text-white">SEIA/AWEA 2025:</strong> Solar & wind market rates
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span style={{ color: 'rgba(255,255,255,0.6)' }}>
                    <strong className="text-white">IEEE Standards:</strong> Battery degradation models
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span style={{ color: 'rgba(255,255,255,0.6)' }}>
                    <strong className="text-white">EIA Database:</strong> Generator cost data (Q4 2025)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span style={{ color: 'rgba(255,255,255,0.6)' }}>
                    <strong className="text-white">NPV/IRR Analysis:</strong> Professional financial modeling
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <div className="text-center">
                  <div className="text-xs text-blue-400 font-semibold">CALCULATION TRANSPARENCY</div>
                  <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Every formula documented in Word export</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-blue-400 font-semibold">MARKET VALIDATED</div>
                  <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Q4 2025 current pricing</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-blue-400 font-semibold">PROFESSIONAL GRADE</div>
                  <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Ready for stakeholder review</div>
                </div>
              </div>
            </div>
          </div>

          {/* Download Buttons */}
          <div className="p-6 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <h3 className="text-base font-semibold text-white mb-2 text-center">📥 Download Your Quote Documents</h3>
            <p className="text-xs mb-4 text-center" style={{ color: 'rgba(255,255,255,0.4)' }}>Click below to generate and download your professional quote files</p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={generateWordDocument}
                className="flex-1 px-6 py-4 rounded-xl font-semibold text-base transition-all flex items-center justify-center space-x-3 hover:scale-[1.02]" style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', color: '#93c5fd' }}
              >
                <span className="text-xl">📄</span>
                <span>Download Word Document</span>
              </button>
              <button
                onClick={generateExcelData}
                className="flex-1 px-6 py-4 rounded-xl font-semibold text-base transition-all flex items-center justify-center space-x-3 hover:scale-[1.02]" style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#6ee7b7' }}
              >
                <span className="text-xl">📊</span>
                <span>Download Excel/CSV</span>
              </button>
            </div>
            <p className="text-xs mt-3 text-center" style={{ color: 'rgba(255,255,255,0.35)' }}>💡 Pro tip: Download both formats for maximum compatibility</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuotePreviewModal;
