import React from 'react';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, HeadingLevel, PageBreak } from 'docx';
import { saveAs } from 'file-saver';
import { generateCalculationBreakdown } from '../../utils/calculationFormulas';
import { createCalculationTables } from '../../utils/wordHelpers';
import magicPoofSound from '../../assets/sounds/Magic_Poof.mp3';

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

const createHeaderRow = (headers: string[], bgColor: string = "2563EB") => new TableRow({
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

const QuotePreviewModal: React.FC<QuotePreviewModalProps> = ({ isOpen, onClose, quoteData }) => {
  if (!isOpen) return null;

  const playDownloadSound = () => {
    try {
      const audio = new Audio(magicPoofSound);
      audio.volume = 0.5;
      audio.play().catch(err => console.log('Audio play failed:', err));
    } catch (err) {
      console.log('Sound file not found:', err);
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
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      windMW,
      generatorMW,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
    console.log('📊 SmartWizard: Generated calculations for appendix:', calculations.length, 'items');

    const calcTables = createCalculationTables(calculations);
    console.log('📋 SmartWizard: Created calculation tables:', calcTables.length, 'elements');

    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          // Professional Header with grey and light blue theme
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 70, type: WidthType.PERCENTAGE },
                    shading: { fill: "E5E7EB" }, // Light grey
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({ 
                            text: "BATTERY ENERGY STORAGE", 
                            bold: true, 
                            size: 40, 
                            color: "1F2937", // Dark grey
                            font: "Arial"
                          }),
                        ],
                        spacing: { before: 300 },
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({ 
                            text: "SYSTEM PROPOSAL", 
                            bold: true, 
                            size: 40, 
                            color: "1F2937", // Dark grey
                            font: "Arial"
                          }),
                        ],
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({ 
                            text: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", 
                            size: 16, 
                            color: "60A5FA", // Light blue
                            font: "Arial"
                          }),
                        ],
                        spacing: { before: 100, after: 100 },
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({ 
                            text: "Professional Energy Storage Solution", 
                            bold: true, 
                            size: 20, 
                            color: "3B82F6", // Blue
                            font: "Arial"
                          }),
                        ],
                        spacing: { after: 300 },
                      }),
                    ],
                  }),
                  new TableCell({
                    width: { size: 30, type: WidthType.PERCENTAGE },
                    shading: { fill: "DBEAFE" }, // Light blue background
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({ 
                            text: "🧙‍♂️",
                            bold: true, 
                            size: 120,
                            font: "Arial"
                          }),
                        ],
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 200, after: 100 },
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({ 
                            text: "MERLIN", 
                            bold: true, 
                            size: 44,
                            color: "1E40AF", // Dark blue
                            font: "Arial"
                          }),
                        ],
                        alignment: AlignmentType.CENTER,
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({ 
                            text: "━━━━━━━━━━━━━", 
                            size: 16, 
                            color: "60A5FA", // Light blue
                            font: "Arial"
                          }),
                        ],
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 50, after: 50 },
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({ 
                            text: "Energy Solutions", 
                            italics: true, 
                            size: 18,
                            color: "6B7280", // Grey
                            font: "Arial"
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

          new Paragraph({ text: "", spacing: { after: 400 } }),

          // PROJECT INFORMATION Table
          new Paragraph({
            children: [
              new TextRun({ text: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", color: "60A5FA", size: 20 }),
            ],
            spacing: { before: 300, after: 100 },
          }),
          new Paragraph({
            children: [new TextRun({ text: "PROJECT INFORMATION", bold: true, size: 28, color: "1F2937" })],
            spacing: { before: 100, after: 200 },
            shading: { fill: "F3F4F6" },
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
            children: [
              new TextRun({ text: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", color: "60A5FA", size: 20 }),
            ],
            spacing: { before: 400, after: 100 },
          }),
          new Paragraph({
            children: [new TextRun({ text: "1. EXECUTIVE SUMMARY", bold: true, size: 28, color: "1F2937" })],
            spacing: { before: 100, after: 200 },
            shading: { fill: "DBEAFE" },
          }),
          new Paragraph({
            text: `This proposal provides a comprehensive Battery Energy Storage System (BESS) solution designed to meet your specific energy requirements and deliver exceptional return on investment.`,
            spacing: { after: 200 },
          }),

          // Executive Summary Metrics Table
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ 
                    children: [new Paragraph({ children: [new TextRun({ text: "KEY METRIC", bold: true, size: 24, color: "FFFFFF" })] })],
                    shading: { fill: "9333EA" }, // Merlin purple
                  }),
                  new TableCell({ 
                    children: [new Paragraph({ children: [new TextRun({ text: "VALUE", bold: true, size: 24, color: "FFFFFF" })] })],
                    shading: { fill: "9333EA" }, // Merlin purple
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ 
                    children: [new Paragraph({ children: [new TextRun({ text: "System Capacity", bold: true, size: 22 })] })],
                    shading: { fill: "EEF2FF" },
                  }),
                  new TableCell({ 
                    children: [new Paragraph({ children: [new TextRun({ text: `${batteryMWh.toFixed(1)} MWh`, bold: true, size: 22, color: "3B82F6" })] })],
                    shading: { fill: "EEF2FF" },
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Power Rating", bold: true, size: 22 })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${bessPowerMW} MW`, bold: true, size: 22, color: "3B82F6" })] })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ 
                    children: [new Paragraph({ children: [new TextRun({ text: "Total Investment", bold: true, size: 22 })] })],
                    shading: { fill: "DBEAFE" },
                  }),
                  new TableCell({ 
                    children: [new Paragraph({ children: [new TextRun({ text: `$${costs.grandTotal.toLocaleString()}`, bold: true, size: 22, color: "1E40AF" })] })],
                    shading: { fill: "DBEAFE" },
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Annual Energy Savings", bold: true, size: 22 })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `$${annualSavings.toLocaleString()}/year`, bold: true, size: 22, color: "059669" })] })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ 
                    children: [new Paragraph({ children: [new TextRun({ text: "Simple Payback Period", bold: true, size: 22 })] })],
                    shading: { fill: "FEF3C7" },
                  }),
                  new TableCell({ 
                    children: [new Paragraph({ children: [new TextRun({ text: `${paybackPeriod.toFixed(2)} years`, bold: true, size: 22, color: "D97706" })] })],
                    shading: { fill: "FEF3C7" },
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ 
                    children: [new Paragraph({ children: [new TextRun({ text: "10-Year ROI", bold: true, size: 22 })] })],
                    shading: { fill: "D1FAE5" },
                  }),
                  new TableCell({ 
                    children: [new Paragraph({ children: [new TextRun({ 
                      text: `${((annualSavings * 10 - costs.grandTotal) / costs.grandTotal * 100).toFixed(1)}%`, 
                      bold: true, 
                      size: 22, 
                      color: "059669" 
                    })] })],
                    shading: { fill: "D1FAE5" },
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "System Warranty", bold: true, size: 22 })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${warranty} Years`, bold: true, size: 22, color: "7C3AED" })] })] }),
                ],
              }),
            ],
          }),

          new Paragraph({ text: "", spacing: { after: 400 } }),

          // 2. PROJECT OVERVIEW & VISUALIZATION
          new Paragraph({
            children: [
              new TextRun({ text: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", color: "60A5FA", size: 20 }),
            ],
            spacing: { before: 400, after: 100 },
          }),
          new Paragraph({
            children: [new TextRun({ text: "2. PROJECT OVERVIEW & VISUALIZATION", bold: true, size: 28, color: "1F2937" })],
            spacing: { before: 100, after: 200 },
            shading: { fill: "F3F4F6" },
          }),
          new Paragraph({
            text: `The proposed BESS installation will integrate seamlessly with your existing infrastructure to provide reliable energy storage, peak shaving, and grid stabilization capabilities.`,
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

          // 3. TECHNICAL SPECIFICATIONS & PRICING
          new Paragraph({
            children: [
              new TextRun({ text: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", color: "60A5FA", size: 20 }),
            ],
            spacing: { before: 400, after: 100 },
          }),
          new Paragraph({
            children: [new TextRun({ text: "3. TECHNICAL SPECIFICATIONS & PRICING", bold: true, size: 28, color: "1F2937" })],
            spacing: { before: 100, after: 200 },
            shading: { fill: "DBEAFE" },
          }),

          // Component Table
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ 
                    children: [new Paragraph({ children: [new TextRun({ text: "COMPONENT", bold: true, size: 22, color: "FFFFFF" })] })],
                    shading: { fill: "3B82F6" }, // Merlin blue
                  }),
                  new TableCell({ 
                    children: [new Paragraph({ children: [new TextRun({ text: "SPECIFICATION", bold: true, size: 22, color: "FFFFFF" })] })],
                    shading: { fill: "3B82F6" }, // Merlin blue
                  }),
                  new TableCell({ 
                    children: [new Paragraph({ children: [new TextRun({ text: "COST (USD)", bold: true, size: 22, color: "FFFFFF" })] })],
                    shading: { fill: "3B82F6" }, // Merlin blue
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Battery System", bold: true })] })] }),
                  new TableCell({ children: [new Paragraph(`${batteryMWh.toFixed(1)} MWh LFP Chemistry`)] }),
                  new TableCell({ children: [new Paragraph(`$${costs.batterySystem.toLocaleString()}`)] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Power Conversion", bold: true })] })] }),
                  new TableCell({ children: [new Paragraph(`${bessPowerMW} MW Bi-directional Inverter`)] }),
                  new TableCell({ children: [new Paragraph(`$${(costs.pcs + costs.inverters).toLocaleString()}`)] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Balance of System", bold: true })] })] }),
                  new TableCell({ children: [new Paragraph("Enclosures, Cabling, Protection")] }),
                  new TableCell({ children: [new Paragraph(`$${costs.bos.toLocaleString()}`)] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Engineering & Installation", bold: true })] })] }),
                  new TableCell({ children: [new Paragraph("EPC Services, Commissioning")] }),
                  new TableCell({ children: [new Paragraph(`$${costs.epc.toLocaleString()}`)] }),
                ],
              }),
              ...(solarMW > 0 ? [
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Solar Array", bold: true })] })] }),
                    new TableCell({ children: [new Paragraph(`${solarMW} MW + Inverters`)] }),
                    new TableCell({ children: [new Paragraph(`$${costs.solar.toLocaleString()}`)] }),
                  ],
                }),
              ] : []),
              ...(generatorMW > 0 ? [
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Generator Backup", bold: true })] })] }),
                    new TableCell({ children: [new Paragraph(`${generatorMW} MW Natural Gas/Diesel`)] }),
                    new TableCell({ children: [new Paragraph(`$${costs.generator.toLocaleString()}`)] }),
                  ],
                }),
              ] : []),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "EQUIPMENT SUBTOTAL", bold: true })] })] }),
                  new TableCell({ children: [new Paragraph("")] }),
                  new TableCell({ 
                    children: [new Paragraph({ children: [new TextRun({ text: `$${(costs.grandTotal - costs.epc - costs.bos - costs.tariffs - costs.shipping).toLocaleString()}`, bold: true })] })],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Balance of System (BoS)", bold: true })] })] }),
                  new TableCell({ children: [new Paragraph("Installation materials & labor")] }),
                  new TableCell({ children: [new Paragraph(`$${costs.bos.toLocaleString()}`)] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "EPC Services", bold: true })] })] }),
                  new TableCell({ children: [new Paragraph("Engineering, procurement, construction")] }),
                  new TableCell({ children: [new Paragraph(`$${costs.epc.toLocaleString()}`)] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Import Tariffs & Duties", bold: true })] })] }),
                  new TableCell({ children: [new Paragraph(`${tariffRegion || 'Regional'} tariffs`)] }),
                  new TableCell({ children: [new Paragraph(`$${costs.tariffs.toLocaleString()}`)] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Shipping & Logistics", bold: true })] })] }),
                  new TableCell({ children: [new Paragraph(`To ${shippingDestination || location}`)] }),
                  new TableCell({ children: [new Paragraph(`$${costs.shipping.toLocaleString()}`)] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ 
                    children: [new Paragraph({ children: [new TextRun({ text: "GRAND TOTAL", bold: true, size: 28 })] })],
                    shading: { fill: "10B981" }, // Merlin green
                  }),
                  new TableCell({ 
                    children: [new Paragraph("")],
                    shading: { fill: "10B981" }, // Merlin green
                  }),
                  new TableCell({ 
                    children: [new Paragraph({ children: [new TextRun({ text: `$${costs.grandTotal.toLocaleString()}`, bold: true, size: 28, color: "FFFFFF" })] })],
                    shading: { fill: "10B981" }, // Merlin green
                  }),
                ],
              }),
            ],
          }),

          new Paragraph({ text: "", spacing: { after: 400 } }),

          // 4. FINANCIAL ANALYSIS & ROI
          new Paragraph({
            children: [
              new TextRun({ text: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", color: "60A5FA", size: 20 }),
            ],
            spacing: { before: 400, after: 100 },
          }),
          new Paragraph({
            children: [new TextRun({ text: "4. ENHANCED FINANCIAL ANALYSIS", bold: true, size: 28, color: "1F2937" })],
            spacing: { before: 100, after: 200 },
            shading: { fill: "DBEAFE" },
          }),
          new Paragraph({
            text: `This comprehensive financial analysis demonstrates the strong return on investment and long-term value of this BESS installation.`,
            spacing: { after: 200 },
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ 
                    children: [new Paragraph({ children: [new TextRun({ text: "FINANCIAL METRIC", bold: true, size: 22, color: "FFFFFF" })] })],
                    shading: { fill: "9333EA" }, // Merlin purple
                  }),
                  new TableCell({ 
                    children: [new Paragraph({ children: [new TextRun({ text: "VALUE", bold: true, size: 22, color: "FFFFFF" })] })],
                    shading: { fill: "9333EA" }, // Merlin purple
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ 
                    children: [new Paragraph({ children: [new TextRun({ text: "Annual Energy Savings", bold: true, size: 20 })] })],
                    shading: { fill: "D1FAE5" },
                  }),
                  new TableCell({ 
                    children: [new Paragraph({ children: [new TextRun({ text: `$${annualSavings.toLocaleString()}/year`, bold: true, size: 20, color: "059669" })] })],
                    shading: { fill: "D1FAE5" },
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Simple Payback Period", bold: true, size: 20 })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${paybackPeriod.toFixed(2)} years`, bold: true, size: 20, color: "D97706" })] })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ 
                    children: [new Paragraph({ children: [new TextRun({ text: "5-Year Net Savings", bold: true, size: 20 })] })],
                    shading: { fill: "FEF3C7" },
                  }),
                  new TableCell({ 
                    children: [new Paragraph({ children: [new TextRun({ 
                      text: `$${((annualSavings * 5) - costs.grandTotal).toLocaleString()}`, 
                      bold: true, 
                      size: 20, 
                      color: ((annualSavings * 5) - costs.grandTotal) > 0 ? "059669" : "DC2626" 
                    })] })],
                    shading: { fill: "FEF3C7" },
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "10-Year Net Savings", bold: true, size: 20 })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ 
                    text: `$${((annualSavings * 10) - costs.grandTotal).toLocaleString()}`, 
                    bold: true, 
                    size: 20, 
                    color: "059669" 
                  })] })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ 
                    children: [new Paragraph({ children: [new TextRun({ text: "10-Year ROI", bold: true, size: 20 })] })],
                    shading: { fill: "DBEAFE" },
                  }),
                  new TableCell({ 
                    children: [new Paragraph({ children: [new TextRun({ 
                      text: `${((annualSavings * 10 - costs.grandTotal) / costs.grandTotal * 100).toFixed(1)}%`, 
                      bold: true, 
                      size: 20, 
                      color: "1E40AF" 
                    })] })],
                    shading: { fill: "DBEAFE" },
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "20-Year Net Savings", bold: true, size: 20 })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ 
                    text: `$${((annualSavings * 20) - costs.grandTotal).toLocaleString()}`, 
                    bold: true, 
                    size: 20, 
                    color: "059669" 
                  })] })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ 
                    children: [new Paragraph({ children: [new TextRun({ text: "Budget Status", bold: true, size: 20 })] })],
                    shading: { fill: "EEF2FF" },
                  }),
                  new TableCell({ 
                    children: [new Paragraph({ children: [new TextRun({ 
                      text: budget 
                        ? costs.grandTotal <= budget 
                          ? `✓ Under budget by $${(budget - costs.grandTotal).toLocaleString()}`
                          : `⚠ Over budget by $${(costs.grandTotal - budget).toLocaleString()}`
                        : "No budget specified",
                      bold: true,
                      size: 18,
                      color: budget && costs.grandTotal <= budget ? "059669" : "D97706"
                    })] })],
                    shading: { fill: "EEF2FF" },
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Cost per kWh Storage", bold: true, size: 20 })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ 
                    text: `$${(costs.grandTotal / (batteryMWh * 1000)).toFixed(0)}/kWh`, 
                    bold: true, 
                    size: 20, 
                    color: "6366F1" 
                  })] })] }),
                ],
              }),
            ],
          }),

          new Paragraph({ text: "", spacing: { after: 400 } }),

          // 5. IMPLEMENTATION & CERTIFICATIONS
          new Paragraph({
            children: [new TextRun({ text: "5. IMPLEMENTATION & CERTIFICATIONS", bold: true, size: 24 })],
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
            children: [new TextRun({ text: "6. SUMMARY & NEXT STEPS", bold: true, size: 24 })],
            spacing: { before: 400, after: 200 },
          }),
          new Paragraph({
            text: "This Battery Energy Storage System provides an optimal solution for your energy requirements with strong financial returns and proven technology. The proposed system will deliver reliable energy storage, grid stabilization, and significant cost savings over its operational lifetime.",
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
            text: "• NREL (National Renewable Energy Laboratory) - Energy Storage Cost Data",
            bullet: { level: 0 },
            spacing: { after: 100 },
          }),
          new Paragraph({
            text: "• BloombergNEF - Q4 2025 Battery Pack Pricing Report",
            bullet: { level: 0 },
            spacing: { after: 100 },
          }),
          new Paragraph({
            text: "• Wood Mackenzie - Power & Renewables Market Analysis",
            bullet: { level: 0 },
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
    
    let csv = "\"🧙‍♂️ MERLIN ENERGY\",\"BATTERY ENERGY STORAGE SYSTEM\"\n";
    csv += `\"Generated:\",\"${new Date().toLocaleDateString()}\"\n`;
    csv += `\"Project:\",\"${quoteData.projectName}\"\n`;
    csv += `\"Client:\",\"${quoteData.clientName}\"\n`;
    csv += "\n";
    
    // Section header with color coding (light blue background in Excel)
    csv += "\"═══ SYSTEM CONFIGURATION ═══════════════════════════════════\"\n";
    csv += "\"Metric\",\"Value\"\n";
    csv += `\"BESS Capacity\",\"${batteryMWh.toFixed(1)} MWh\"\n`;
    csv += `\"Power Rating\",\"${bessPowerMW} MW\"\n`;
    if (solarMW > 0) csv += `\"Solar Capacity\",\"${solarMW} MW\"\n`;
    if (windMW > 0) csv += `\"Wind Capacity\",\"${windMW} MW\"\n`;
    if (generatorMW > 0) csv += `\"Generator Backup\",\"${generatorMW} MW\"\n`;
    csv += `\"Warranty Period\",\"${quoteData.warranty} Years\"\n`;
    csv += "\n";
    
    // Component breakdown with aligned numbers
    csv += "\"═══ COMPONENT BREAKDOWN ═══════════════════════════════════\"\n";
    csv += "\"Component\",\"Specification\",\"Cost (USD)\"\n";
    csv += `\"Battery System\",\"${batteryMWh.toFixed(1)} MWh LFP\",${costs.batterySystem}\n`;
    if (costs.pcs > 0) csv += `\"Power Conversion System\",\"${bessPowerMW} MW\",${costs.pcs}\n`;
    csv += `\"Transformers\",\"${bessPowerMW} MW\",${costs.transformers}\n`;
    csv += `\"Inverters\",\"${bessPowerMW} MW\",${costs.inverters}\n`;
    csv += `\"Switchgear & Protection\",\"${bessPowerMW} MW\",${costs.switchgear}\n`;
    if (costs.microgridControls > 0) csv += `\"Microgrid Controls\",\"System-wide\",${costs.microgridControls}\n`;
    
    if (solarMW > 0) {
      csv += `\"Solar Array\",\"${solarMW} MW\",${costs.solar}\n`;
      csv += `\"Solar Inverters\",\"${solarMW} MW\",${costs.solarInverters}\n`;
    }
    if (windMW > 0) {
      csv += `\"Wind Turbines\",\"${windMW} MW\",${costs.wind}\n`;
      csv += `\"Wind Converters\",\"${windMW} MW\",${costs.windConverters}\n`;
    }
    if (generatorMW > 0) {
      csv += `\"Backup Generator\",\"${generatorMW} MW\",${costs.generator}\n`;
      csv += `\"Generator Controls\",\"${generatorMW} MW\",${costs.generatorControls}\n`;
    }
    
    csv += `\"Balance of System\",\"12% of equipment\",${costs.bos}\n`;
    csv += `\"Engineering & Installation\",\"15% of equipment\",${costs.epc}\n`;
    csv += `\"Import Tariffs\",\"${quoteData.tariffRegion || 'Regional'}\",${costs.tariffs}\n`;
    csv += `\"Shipping & Logistics\",\"To ${quoteData.shippingDestination || quoteData.location}\",${costs.shipping}\n`;
    csv += "\n";
    csv += `\"GRAND TOTAL\",\"\",${costs.grandTotal}\n`;
    csv += "\n";

    // Financial Analysis with aligned numbers
    csv += "\"═══ ENHANCED FINANCIAL ANALYSIS ═══════════════════════════\"\n";
    csv += "\"Financial Metric\",\"Value\"\n";
    csv += `\"Annual Energy Savings\",${annualSavings}\n`;
    csv += `\"Simple Payback Period\",\"${paybackPeriod.toFixed(2)} years\"\n`;
    csv += `\"5-Year Net Savings\",${(annualSavings * 5) - costs.grandTotal}\n`;
    csv += `\"10-Year Net Savings\",${(annualSavings * 10) - costs.grandTotal}\n`;
    csv += `\"10-Year ROI\",\"${((annualSavings * 10 - costs.grandTotal) / costs.grandTotal * 100).toFixed(1)}%\"\n`;
    csv += `\"20-Year Net Savings\",${(annualSavings * 20) - costs.grandTotal}\n`;
    csv += `\"Cost per kWh Storage\",\"$${(costs.grandTotal / (batteryMWh * 1000)).toFixed(0)}/kWh\"\n`;
    
    if (budget) {
      const budgetStatus = costs.grandTotal <= budget 
        ? `\"Under budget by $${(budget - costs.grandTotal).toLocaleString()}\"` 
        : `\"Over budget by $${(costs.grandTotal - budget).toLocaleString()}\"`;
      csv += `\"Budget Status\",${budgetStatus}\n`;
    }
    
    csv += "\n";
    csv += "\"═══════════════════════════════════════════════════════════\"\n";
    csv += "\"Generated by MERLIN Energy Solutions\"\n";
    csv += "\"🧙‍♂️ Professional BESS Quote System\"\n";
    csv += `\"Document Date: ${new Date().toISOString().split('T')[0]}\"\n`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `Merlin_BESS_Quote_${quoteData.projectName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl border-2 border-blue-300 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-blue-200 flex justify-between items-center bg-gradient-to-r from-blue-500 to-purple-600 sticky top-0 z-10">
          <h2 className="text-3xl font-bold text-white">
            📋 Quote Preview & Download
          </h2>
          <button 
            onClick={onClose}
            className="text-white hover:text-blue-100 hover:bg-white/20 rounded-lg p-2 transition-all text-2xl"
          >
            ✕
          </button>
        </div>

        <div className="p-8 space-y-6">
          {/* Instruction Header */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-xl shadow-lg text-center">
            <h3 className="text-2xl font-bold mb-2">✨ Your Quote is Ready!</h3>
            <p className="text-lg">Review the details below and download your professional quote documents</p>
          </div>

          {/* Summary */}
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-6 rounded-xl border-2 border-purple-400 shadow-lg">
            <h3 className="text-2xl font-bold text-purple-700 mb-4">System Configuration</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-purple-600 font-medium">BESS Capacity:</p>
                <p className="text-gray-900 font-bold text-lg">{quoteData.batteryMWh.toFixed(1)} MWh</p>
              </div>
              <div>
                <p className="text-purple-600 font-medium">Power Rating:</p>
                <p className="text-gray-900 font-bold text-lg">{quoteData.bessPowerMW} MW</p>
              </div>
              {quoteData.solarMW > 0 && (
                <div>
                  <p className="text-yellow-600 font-medium">Solar Capacity:</p>
                  <p className="text-gray-900 font-bold text-lg">{quoteData.solarMW} MW</p>
                </div>
              )}
              {quoteData.windMW > 0 && (
                <div>
                  <p className="text-cyan-600 font-medium">Wind Capacity:</p>
                  <p className="text-gray-900 font-bold text-lg">{quoteData.windMW} MW</p>
                </div>
              )}
              {quoteData.generatorMW > 0 && (
                <div>
                  <p className="text-red-600 font-medium">Generator Backup:</p>
                  <p className="text-gray-900 font-bold text-lg">{quoteData.generatorMW} MW</p>
                </div>
              )}
            </div>
          </div>

          {/* Financial Summary */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border-2 border-green-400 shadow-lg">
            <h3 className="text-2xl font-bold text-green-700 mb-4">Financial Summary</h3>
            <div className="space-y-2 text-gray-700">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total Investment:</span>
                <span className="font-bold text-xl text-gray-900">${quoteData.costs.grandTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Annual Savings:</span>
                <span className="font-bold text-xl text-green-700">${quoteData.annualSavings.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Payback Period:</span>
                <span className="font-bold text-xl text-blue-700">{quoteData.paybackPeriod.toFixed(2)} years</span>
              </div>
            </div>
          </div>

          {/* Download Buttons */}
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-xl border-2 border-yellow-400">
            <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">📥 Download Your Quote Documents</h3>
            <p className="text-sm text-gray-600 mb-4 text-center">Click below to generate and download your professional quote files</p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={generateWordDocument}
                className="flex-1 px-6 py-5 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-xl font-bold text-lg shadow-xl hover:scale-105 hover:shadow-2xl transition-all flex items-center justify-center space-x-3 border-b-4 border-blue-900"
              >
                <span className="text-2xl">📄</span>
                <span>Download Word Document</span>
              </button>
              <button
                onClick={generateExcelData}
                className="flex-1 px-6 py-5 bg-gradient-to-br from-green-600 to-green-700 text-white rounded-xl font-bold text-lg shadow-xl hover:scale-105 hover:shadow-2xl transition-all flex items-center justify-center space-x-3 border-b-4 border-green-900"
              >
                <span className="text-2xl">📊</span>
                <span>Download Excel/CSV</span>
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-3 text-center">💡 Pro tip: Download both formats for maximum compatibility</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuotePreviewModal;
