import React from 'react';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, HeadingLevel, PageBreak } from 'docx';
import { saveAs } from 'file-saver';
import { generateCalculationBreakdown } from '../../utils/calculationFormulas';
import { createCalculationTables } from '../../utils/wordHelpers';

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

  const generateWordDocument = async () => {
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
          // Professional Header with larger Merlin icon
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 70, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({ 
                            text: "BATTERY ENERGY STORAGE", 
                            bold: true, 
                            size: 32, 
                            color: "1E3A8A",
                            font: "Helvetica"
                          }),
                        ],
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({ 
                            text: "SYSTEM", 
                            bold: true, 
                            size: 32, 
                            color: "1E3A8A",
                            font: "Helvetica"
                          }),
                        ],
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({ 
                            text: "COMMERCIAL QUOTE PROPOSAL", 
                            bold: true, 
                            size: 20, 
                            color: "2563EB",
                            font: "Helvetica"
                          }),
                        ],
                        spacing: { before: 100 },
                      }),
                    ],
                  }),
                  new TableCell({
                    width: { size: 30, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({ 
                            text: "🧙‍♂️",
                            bold: true, 
                            size: 72,
                            font: "Helvetica"
                          }),
                        ],
                        alignment: AlignmentType.RIGHT,
                        spacing: { after: 100 },
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({ 
                            text: "MERLIN", 
                            bold: true, 
                            size: 32,
                            color: "9333EA",
                            font: "Helvetica"
                          }),
                        ],
                        alignment: AlignmentType.RIGHT,
                      }),
                      new Paragraph({
                        children: [
                          new TextRun({ 
                            text: "Energy Storage Solutions", 
                            italics: true, 
                            size: 16,
                            color: "6B7280",
                            font: "Helvetica"
                          }),
                        ],
                        alignment: AlignmentType.RIGHT,
                        spacing: { before: 50 },
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
            children: [new TextRun({ text: "PROJECT INFORMATION", bold: true, size: 24 })],
            spacing: { before: 200, after: 200 },
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
            children: [new TextRun({ text: "1. EXECUTIVE SUMMARY", bold: true, size: 24 })],
            spacing: { before: 400, after: 200 },
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
                    children: [new Paragraph({ children: [new TextRun({ text: "METRIC", bold: true, color: "FFFFFF" })] })],
                    shading: { fill: "0000FF" },
                  }),
                  new TableCell({ 
                    children: [new Paragraph({ children: [new TextRun({ text: "VALUE", bold: true, color: "FFFFFF" })] })],
                    shading: { fill: "0000FF" },
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "System Capacity", bold: true })] })] }),
                  new TableCell({ children: [new Paragraph(`${batteryMWh.toFixed(1)} MWh`)] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Power Rating", bold: true })] })] }),
                  new TableCell({ children: [new Paragraph(`${bessPowerMW} MW`)] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Total Investment", bold: true })] })] }),
                  new TableCell({ children: [new Paragraph(`$${costs.grandTotal.toLocaleString()}`)] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Annual Savings", bold: true })] })] }),
                  new TableCell({ children: [new Paragraph(`$${annualSavings.toLocaleString()}`)] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Payback Period", bold: true })] })] }),
                  new TableCell({ children: [new Paragraph(`${paybackPeriod.toFixed(2)} years`)] }),
                ],
              }),
            ],
          }),

          new Paragraph({ text: "", spacing: { after: 400 } }),

          // 2. PROJECT OVERVIEW & VISUALIZATION
          new Paragraph({
            children: [new TextRun({ text: "2. PROJECT OVERVIEW & VISUALIZATION", bold: true, size: 24 })],
            spacing: { before: 400, after: 200 },
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
            children: [new TextRun({ text: "3. TECHNICAL SPECIFICATIONS & PRICING", bold: true, size: 24 })],
            spacing: { before: 400, after: 200 },
          }),

          // Component Table
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ 
                    children: [new Paragraph({ children: [new TextRun({ text: "COMPONENT", bold: true, color: "FFFFFF" })] })],
                    shading: { fill: "0000FF" },
                  }),
                  new TableCell({ 
                    children: [new Paragraph({ children: [new TextRun({ text: "SPECIFICATION", bold: true, color: "FFFFFF" })] })],
                    shading: { fill: "0000FF" },
                  }),
                  new TableCell({ 
                    children: [new Paragraph({ children: [new TextRun({ text: "COST (USD)", bold: true, color: "FFFFFF" })] })],
                    shading: { fill: "0000FF" },
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
                    children: [new Paragraph({ children: [new TextRun({ text: "GRAND TOTAL", bold: true, size: 24 })] })],
                    shading: { fill: "00FF00" },
                  }),
                  new TableCell({ 
                    children: [new Paragraph("")],
                    shading: { fill: "00FF00" },
                  }),
                  new TableCell({ 
                    children: [new Paragraph({ children: [new TextRun({ text: `$${costs.grandTotal.toLocaleString()}`, bold: true, size: 24 })] })],
                    shading: { fill: "00FF00" },
                  }),
                ],
              }),
            ],
          }),

          new Paragraph({ text: "", spacing: { after: 400 } }),

          // 4. FINANCIAL ANALYSIS & ROI
          new Paragraph({
            children: [new TextRun({ text: "4. FINANCIAL ANALYSIS & ROI", bold: true, size: 24 })],
            spacing: { before: 400, after: 200 },
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ 
                    children: [new Paragraph({ children: [new TextRun({ text: "FINANCIAL METRIC", bold: true, color: "FFFFFF" })] })],
                    shading: { fill: "9900FF" },
                  }),
                  new TableCell({ 
                    children: [new Paragraph({ children: [new TextRun({ text: "VALUE", bold: true, color: "FFFFFF" })] })],
                    shading: { fill: "9900FF" },
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Annual Energy Savings", bold: true })] })] }),
                  new TableCell({ children: [new Paragraph(`$${annualSavings.toLocaleString()}`)] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Simple Payback Period", bold: true })] })] }),
                  new TableCell({ children: [new Paragraph(`${paybackPeriod.toFixed(2)} years`)] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Budget Variance", bold: true })] })] }),
                  new TableCell({ 
                    children: [new Paragraph(
                      budget 
                        ? costs.grandTotal <= budget 
                          ? `Under budget by $${(budget - costs.grandTotal).toLocaleString()}`
                          : `Over budget by $${(costs.grandTotal - budget).toLocaleString()}`
                        : "No budget specified"
                    )] 
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "System Utilization", bold: true })] })] }),
                  new TableCell({ children: [new Paragraph("20%")] }),
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
    // For now, create a CSV that can be opened in Excel
    const { costs, bessPowerMW, batteryMWh, solarMW, windMW, generatorMW } = quoteData;
    
    let csv = "BATTERY ENERGY STORAGE SYSTEM - QUOTE\n\n";
    csv += "COMPONENT,SPECIFICATION,COST (USD)\n";
    csv += `Battery System,${batteryMWh.toFixed(1)} MWh LFP,$${costs.batterySystem.toLocaleString()}\n`;
    if (costs.pcs > 0) csv += `Power Conversion System,${bessPowerMW} MW,$${costs.pcs.toLocaleString()}\n`;
    csv += `Transformers,${bessPowerMW} MW,$${costs.transformers.toLocaleString()}\n`;
    csv += `Inverters,${bessPowerMW} MW,$${costs.inverters.toLocaleString()}\n`;
    csv += `Switchgear & Protection,${bessPowerMW} MW,$${costs.switchgear.toLocaleString()}\n`;
    if (costs.microgridControls > 0) csv += `Microgrid Controls,System-wide,$${costs.microgridControls.toLocaleString()}\n`;
    if (solarMW > 0) {
      csv += `Solar Array,${solarMW} MW,$${costs.solar.toLocaleString()}\n`;
      csv += `Solar Inverters,${solarMW} MW,$${costs.solarInverters.toLocaleString()}\n`;
    }
    if (windMW > 0) {
      csv += `Wind Turbines,${windMW} MW,$${costs.wind.toLocaleString()}\n`;
      csv += `Wind Converters,${windMW} MW,$${costs.windConverters.toLocaleString()}\n`;
    }
    if (generatorMW > 0) {
      csv += `Backup Generator,${generatorMW} MW,$${costs.generator.toLocaleString()}\n`;
      csv += `Generator Controls,${generatorMW} MW,$${costs.generatorControls.toLocaleString()}\n`;
    }
    csv += `Balance of System,12% of equipment,$${costs.bos.toLocaleString()}\n`;
    csv += `Engineering & Installation,15% of equipment,$${costs.epc.toLocaleString()}\n`;
    csv += `\nGRAND TOTAL,,$${costs.grandTotal.toLocaleString()}\n`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `BESS_Quote_${quoteData.projectName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-gradient-to-br from-gray-800 via-purple-900/50 to-blue-900/50 rounded-2xl shadow-2xl w-full max-w-4xl border-2 border-purple-500/30 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-purple-500/20 flex justify-between items-center bg-gray-900/50 sticky top-0 z-10">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            📋 Quote Preview & Download
          </h2>
          <button 
            onClick={onClose}
            className="text-purple-300 hover:text-purple-100 hover:bg-purple-500/20 rounded-lg p-2 transition-all text-2xl"
          >
            ✕
          </button>
        </div>

        <div className="p-8 text-white space-y-6">
          {/* Summary */}
          <div className="bg-gradient-to-r from-purple-600/30 to-blue-600/30 p-6 rounded-xl border border-purple-500/30">
            <h3 className="text-2xl font-bold text-purple-300 mb-4">System Configuration</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-purple-200">BESS Capacity:</p>
                <p className="text-white font-bold text-lg">{quoteData.batteryMWh.toFixed(1)} MWh</p>
              </div>
              <div>
                <p className="text-purple-200">Power Rating:</p>
                <p className="text-white font-bold text-lg">{quoteData.bessPowerMW} MW</p>
              </div>
              {quoteData.solarMW > 0 && (
                <div>
                  <p className="text-yellow-200">Solar Capacity:</p>
                  <p className="text-white font-bold text-lg">{quoteData.solarMW} MW</p>
                </div>
              )}
              {quoteData.windMW > 0 && (
                <div>
                  <p className="text-cyan-200">Wind Capacity:</p>
                  <p className="text-white font-bold text-lg">{quoteData.windMW} MW</p>
                </div>
              )}
              {quoteData.generatorMW > 0 && (
                <div>
                  <p className="text-red-200">Generator Backup:</p>
                  <p className="text-white font-bold text-lg">{quoteData.generatorMW} MW</p>
                </div>
              )}
            </div>
          </div>

          {/* Financial Summary */}
          <div className="bg-gradient-to-r from-green-600/30 to-emerald-600/30 p-6 rounded-xl border border-green-500/30">
            <h3 className="text-2xl font-bold text-green-300 mb-4">Financial Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Total Investment:</span>
                <span className="font-bold text-xl">${quoteData.costs.grandTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Annual Savings:</span>
                <span className="font-bold text-xl">${quoteData.annualSavings.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Payback Period:</span>
                <span className="font-bold text-xl">{quoteData.paybackPeriod.toFixed(2)} years</span>
              </div>
            </div>
          </div>

          {/* Download Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={generateWordDocument}
              className="flex-1 px-6 py-4 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-xl font-bold shadow-lg hover:scale-105 transition-all flex items-center justify-center space-x-2"
            >
              <span>📄</span>
              <span>Download Word Document</span>
            </button>
            <button
              onClick={generateExcelData}
              className="flex-1 px-6 py-4 bg-gradient-to-br from-green-600 to-green-700 text-white rounded-xl font-bold shadow-lg hover:scale-105 transition-all flex items-center justify-center space-x-2"
            >
              <span>📊</span>
              <span>Download Excel/CSV</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuotePreviewModal;
