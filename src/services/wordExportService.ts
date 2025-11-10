/**
 * Word Document Export Service
 * 
 * This service handles the generation and export of Word documents
 * for BESS quotes and reports, extracted from BessQuoteBuilder.
 */

import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, HeadingLevel, PageBreak } from 'docx';
import { saveAs } from 'file-saver';
import { italicParagraph, boldParagraph, createHeaderRow, createDataRow, createCalculationTables } from './wordHelpers';
import { generateCalculationBreakdown, exportCalculationsToText } from '../utils/calculationFormulas';
import { formatCurrency, formatLargeNumber } from '../utils/calculationUtils';

export interface QuoteData {
  // Basic project info
  quoteName: string;
  clientName?: string;
  projectName?: string;
  
  // System specifications
  powerMW: number;
  totalMWh: number;
  actualDuration: number;
  gridConnection: string;
  useCase: string;
  location: string;
  
  // Cost breakdown
  batterySubtotal: number;
  pcsSubtotal: number;
  bosAmount: number;
  epcAmount: number;
  bessCapEx: number;
  generatorSubtotal: number;
  solarSubtotal: number;
  windSubtotal: number;
  batteryTariff: number;
  otherTariff: number;
  totalTariffs: number;
  grandCapEx: number;
  
  // ROI data
  annualSavings: number;
  roiYears: number;
  
  // Additional components (optional)
  generatorMW?: number;
  solarMWp?: number;
  windMW?: number;
  warranty?: string;
  projectTimeframe?: string;
  primaryGoal?: string;
}

/**
 * Generate a comprehensive BESS quote document
 */
export async function generateBESSQuoteDocument(quoteData: QuoteData): Promise<void> {
  try {
    const mainContent = generateMainContent(quoteData);
    const appendixContent = generateAppendixContent();

    const doc = new Document({
      styles: {
        default: {
          document: {
            run: {
              font: "Helvetica",
            },
          },
        },
      },
      sections: [{
        properties: {},
        children: [...mainContent, ...appendixContent],
      }],
    });

    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${quoteData.quoteName.replace(/[^a-z0-9]/gi, '_')}_BESS_Quote.docx`;
    link.click();
    URL.revokeObjectURL(url);
    
    return Promise.resolve();
  } catch (error) {
    throw new Error(`Word export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate the main content sections of the document
 */
function generateMainContent(data: QuoteData): Paragraph[] {
  return [
    // Title Page
    new Paragraph({
      children: [new TextRun({ text: "BATTERY ENERGY STORAGE SYSTEM", bold: true, size: 32 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    }),
    new Paragraph({
      children: [new TextRun({ text: "Professional Quote & Technical Analysis", size: 24 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 800 },
    }),
    
    // Project Information
    new Paragraph({
      children: [new TextRun({ text: data.quoteName || "BESS Project", bold: true, size: 20 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [new TextRun({ text: `Generated: ${new Date().toLocaleDateString()}`, size: 14 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 800 },
    }),
    
    new Paragraph({ children: [new TextRun({ text: "", size: 1 })], pageBreakBefore: true }),
    
    // Executive Summary
    new Paragraph({
      children: [new TextRun({ text: "EXECUTIVE SUMMARY", bold: true, size: 16 })],
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 300 },
    }),
    
    new Paragraph({
      children: [
        new TextRun({ text: "System Overview: ", bold: true }),
        new TextRun({ text: `${data.powerMW}MW / ${data.totalMWh}MWh Battery Energy Storage System` }),
      ],
      spacing: { after: 200 },
    }),
    
    new Paragraph({
      children: [
        new TextRun({ text: "Application: ", bold: true }),
        new TextRun({ text: data.useCase }),
      ],
      spacing: { after: 200 },
    }),
    
    new Paragraph({
      children: [
        new TextRun({ text: "Total Investment: ", bold: true }),
        new TextRun({ text: formatCurrency(data.grandCapEx) }),
      ],
      spacing: { after: 200 },
    }),
    
    new Paragraph({
      children: [
        new TextRun({ text: "Annual Savings: ", bold: true }),
        new TextRun({ text: formatCurrency(data.annualSavings) }),
      ],
      spacing: { after: 200 },
    }),
    
    new Paragraph({
      children: [
        new TextRun({ text: "Payback Period: ", bold: true }),
        new TextRun({ text: `${data.roiYears.toFixed(1)} years` }),
      ],
      spacing: { after: 400 },
    }),
    
    // Technical Specifications
    new Paragraph({
      children: [new TextRun({ text: "TECHNICAL SPECIFICATIONS", bold: true, size: 16 })],
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 300 },
    }),
    
    new Paragraph({
      children: [
        new TextRun({ text: "Power Rating: ", bold: true }),
        new TextRun({ text: `${data.powerMW} MW` }),
      ],
      spacing: { after: 150 },
    }),
    
    new Paragraph({
      children: [
        new TextRun({ text: "Energy Capacity: ", bold: true }),
        new TextRun({ text: `${data.totalMWh} MWh` }),
      ],
      spacing: { after: 150 },
    }),
    
    new Paragraph({
      children: [
        new TextRun({ text: "Duration: ", bold: true }),
        new TextRun({ text: `${data.actualDuration.toFixed(1)} hours` }),
      ],
      spacing: { after: 150 },
    }),
    
    new Paragraph({
      children: [
        new TextRun({ text: "Grid Connection: ", bold: true }),
        new TextRun({ text: data.gridConnection }),
      ],
      spacing: { after: 150 },
    }),
    
    new Paragraph({
      children: [
        new TextRun({ text: "Location: ", bold: true }),
        new TextRun({ text: data.location }),
      ],
      spacing: { after: 400 },
    }),
    
    // Cost Breakdown
    new Paragraph({
      children: [new TextRun({ text: "COST BREAKDOWN", bold: true, size: 16 })],
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 300 },
    }),
    
    new Paragraph({
      children: [
        new TextRun({ text: "Battery System: ", bold: true }),
        new TextRun({ text: formatCurrency(data.batterySubtotal) }),
      ],
      spacing: { after: 150 },
    }),
    
    new Paragraph({
      children: [
        new TextRun({ text: "Power Conversion System: ", bold: true }),
        new TextRun({ text: formatCurrency(data.pcsSubtotal) }),
      ],
      spacing: { after: 150 },
    }),
    
    new Paragraph({
      children: [
        new TextRun({ text: "Balance of System: ", bold: true }),
        new TextRun({ text: formatCurrency(data.bosAmount) }),
      ],
      spacing: { after: 150 },
    }),
    
    new Paragraph({
      children: [
        new TextRun({ text: "Engineering & Construction: ", bold: true }),
        new TextRun({ text: formatCurrency(data.epcAmount) }),
      ],
      spacing: { after: 150 },
    }),
    
    new Paragraph({
      children: [
        new TextRun({ text: "Tariffs & Import Duties: ", bold: true }),
        new TextRun({ text: formatCurrency(data.totalTariffs) }),
      ],
      spacing: { after: 150 },
    }),
    
    new Paragraph({
      children: [
        new TextRun({ text: "TOTAL PROJECT COST: ", bold: true, size: 14 }),
        new TextRun({ text: formatCurrency(data.grandCapEx), bold: true, size: 14 }),
      ],
      spacing: { after: 400 },
    }),
    
    // Financial Analysis
    new Paragraph({
      children: [new TextRun({ text: "FINANCIAL ANALYSIS", bold: true, size: 16 })],
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 300 },
    }),
    
    new Paragraph({
      children: [
        new TextRun({ text: "The financial analysis shows strong economic viability for this BESS project:", bold: true }),
      ],
      spacing: { after: 200 },
    }),
    
    new Paragraph({
      children: [
        new TextRun({ text: "• Annual Energy Savings: ", bold: true }),
        new TextRun({ text: formatCurrency(data.annualSavings) }),
      ],
      spacing: { after: 150 },
    }),
    
    new Paragraph({
      children: [
        new TextRun({ text: "• Simple Payback Period: ", bold: true }),
        new TextRun({ text: `${data.roiYears.toFixed(1)} years` }),
      ],
      spacing: { after: 150 },
    }),
    
    new Paragraph({
      children: [
        new TextRun({ text: "• 20-Year NPV: ", bold: true }),
        new TextRun({ text: formatCurrency(data.annualSavings * 20 - data.grandCapEx) }),
      ],
      spacing: { after: 400 },
    }),
    
    // Implementation Timeline
    new Paragraph({
      children: [new TextRun({ text: "IMPLEMENTATION TIMELINE", bold: true, size: 16 })],
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 300 },
    }),
    
    new Paragraph({
      children: [new TextRun({ text: "Typical project timeline:", bold: true })],
      spacing: { after: 200 },
    }),
    
    new Paragraph({
      children: [new TextRun({ text: "• Engineering & Design: 2-4 weeks" })],
      spacing: { after: 100 },
    }),
    
    new Paragraph({
      children: [new TextRun({ text: "• Procurement: 8-12 weeks" })],
      spacing: { after: 100 },
    }),
    
    new Paragraph({
      children: [new TextRun({ text: "• Installation: 4-6 weeks" })],
      spacing: { after: 100 },
    }),
    
    new Paragraph({
      children: [new TextRun({ text: "• Commissioning: 1-2 weeks" })],
      spacing: { after: 100 },
    }),
    
    new Paragraph({
      children: [
        new TextRun({ text: "Total Project Duration: ", bold: true }),
        new TextRun({ text: data.projectTimeframe || "12-18 months" }),
      ],
      spacing: { after: 400 },
    }),
    
    // Standards & Certifications
    new Paragraph({
      children: [new TextRun({ text: "STANDARDS & CERTIFICATIONS", bold: true, size: 16 })],
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 300 },
    }),
    
    new Paragraph({
      children: [new TextRun({ text: "This BESS design complies with all relevant industry standards:", bold: true })],
      spacing: { after: 200 },
    }),
    
    new Paragraph({
      children: [new TextRun({ text: "• UL 9540: Energy Storage Systems and Equipment" })],
      spacing: { after: 100 },
    }),
    
    new Paragraph({
      children: [new TextRun({ text: "• IEEE 1547: Standard for Interconnection" })],
      spacing: { after: 100 },
    }),
    
    new Paragraph({
      children: [new TextRun({ text: "• NFPA 855: Energy Storage System Installation" })],
      spacing: { after: 100 },
    }),
    
    new Paragraph({
      children: [new TextRun({ text: "• IEC 62933: Electrical Energy Storage Systems" })],
      spacing: { after: 400 },
    }),
    
    // Next Steps
    new Paragraph({
      children: [new TextRun({ text: "NEXT STEPS", bold: true, size: 16 })],
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 300 },
    }),
    
    new Paragraph({
      children: [new TextRun({ text: "To proceed with this BESS project:", bold: true })],
      spacing: { after: 200 },
    }),
    
    new Paragraph({
      children: [new TextRun({ text: "1. Review and approve technical specifications" })],
      spacing: { after: 100 },
    }),
    
    new Paragraph({
      children: [new TextRun({ text: "2. Finalize site assessment and permitting requirements" })],
      spacing: { after: 100 },
    }),
    
    new Paragraph({
      children: [new TextRun({ text: "3. Execute project agreement and begin detailed engineering" })],
      spacing: { after: 100 },
    }),
    
    new Paragraph({
      children: [new TextRun({ text: "4. Initiate procurement and fabrication processes" })],
      spacing: { after: 400 },
    }),
    
    // Contact Information
    new Paragraph({
      children: [new TextRun({ text: "CONTACT INFORMATION", bold: true, size: 16 })],
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 300 },
    }),
    
    new Paragraph({
      children: [new TextRun({ text: "For questions or to discuss this proposal further:", bold: true })],
      spacing: { after: 200 },
    }),
    
    new Paragraph({
      children: [
        new TextRun({ text: "Email: ", bold: true }),
        new TextRun({ text: "info@merlinenergy.com" }),
      ],
      spacing: { after: 150 },
    }),
    
    new Paragraph({
      children: [
        new TextRun({ text: "Website: ", bold: true }),
        new TextRun({ text: "https://merlinenergy.com" }),
      ],
      spacing: { after: 400 },
    }),
  ];
}

/**
 * Generate the appendix content with calculation formulas and references
 */
function generateAppendixContent(): Paragraph[] {
  return [
    new Paragraph({ children: [new TextRun({ text: "", size: 1 })], pageBreakBefore: true }),
    
    new Paragraph({
      children: [new TextRun({ text: "APPENDIX A: CALCULATION FORMULAS", bold: true, size: 16 })],
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 300 },
    }),
    
    new Paragraph({
      children: [new TextRun({ text: "Cost Calculation Methodology:", bold: true })],
      spacing: { after: 200 },
    }),
    
    new Paragraph({
      children: [new TextRun({ text: "• Battery Cost = Energy Capacity (kWh) × $/kWh pricing" })],
      spacing: { after: 100 },
    }),
    
    new Paragraph({
      children: [new TextRun({ text: "• PCS Cost = Power Rating (kW) × PCS $/kW pricing" })],
      spacing: { after: 100 },
    }),
    
    new Paragraph({
      children: [new TextRun({ text: "• BOS Cost = (Battery + PCS) × BOS percentage" })],
      spacing: { after: 100 },
    }),
    
    new Paragraph({
      children: [new TextRun({ text: "• EPC Cost = (Equipment + BOS) × EPC percentage" })],
      spacing: { after: 100 },
    }),
    
    new Paragraph({
      children: [new TextRun({ text: "• Tariffs = Battery/PCS × 21% + Other × 6%" })],
      spacing: { after: 400 },
    }),
    
    new Paragraph({
      children: [new TextRun({ text: "ROI Calculation Methodology:", bold: true })],
      spacing: { after: 200 },
    }),
    
    new Paragraph({
      children: [new TextRun({ text: "• Peak Shaving Savings = Energy × (Peak Rate - Off-peak Rate) × Efficiency" })],
      spacing: { after: 100 },
    }),
    
    new Paragraph({
      children: [new TextRun({ text: "• Demand Charge Savings = Power × Demand Charge Rate × 12 months" })],
      spacing: { after: 100 },
    }),
    
    new Paragraph({
      children: [new TextRun({ text: "• Payback Period = Total Cost / Annual Savings" })],
      spacing: { after: 400 },
    }),
    
    // Data Sources
    new Paragraph({
      children: [new TextRun({ text: "DATA SOURCES & REFERENCES", bold: true, size: 14 })],
      heading: HeadingLevel.HEADING_2,
      spacing: { after: 300 },
    }),
    
    new Paragraph({
      children: [
        new TextRun({ text: "• BNEF Energy Storage Market Outlook 2024", bold: true }),
      ],
      spacing: { after: 100 },
    }),
    
    new Paragraph({
      children: [
        new TextRun({ text: "• Wood Mackenzie Global Energy Storage Report", bold: true }),
      ],
      spacing: { after: 100 },
    }),
    
    new Paragraph({
      children: [
        new TextRun({ text: "• NREL Cost and Performance Database", bold: true }),
      ],
      spacing: { after: 100 },
    }),
    
    new Paragraph({
      children: [
        new TextRun({ text: "• EIA Electricity Market Data", bold: true }),
      ],
      spacing: { after: 200 },
    }),
    
    italicParagraph("Last Updated: Q4 2025", {
      spacing: { before: 200 },
    }),
  ];
}

/**
 * Generate a simple project summary document
 */
export async function generateProjectSummary(data: Partial<QuoteData>): Promise<void> {
  try {
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            children: [new TextRun({ text: "BESS PROJECT SUMMARY", bold: true, size: 20 })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),
          
          new Paragraph({
            children: [
              new TextRun({ text: "Project: ", bold: true }),
              new TextRun({ text: data.quoteName || "Unnamed Project" }),
            ],
            spacing: { after: 200 },
          }),
          
          new Paragraph({
            children: [
              new TextRun({ text: "System Size: ", bold: true }),
              new TextRun({ text: `${data.powerMW || 0}MW / ${data.totalMWh || 0}MWh` }),
            ],
            spacing: { after: 200 },
          }),
          
          new Paragraph({
            children: [
              new TextRun({ text: "Estimated Cost: ", bold: true }),
              new TextRun({ text: formatCurrency(data.grandCapEx || 0) }),
            ],
            spacing: { after: 200 },
          }),
          
          new Paragraph({
            children: [
              new TextRun({ text: "Generated: ", bold: true }),
              new TextRun({ text: new Date().toLocaleDateString() }),
            ],
            spacing: { after: 200 },
          }),
        ],
      }],
    });

    const blob = await Packer.toBlob(doc);
    const filename = `${(data.quoteName || 'BESS_Project').replace(/[^a-z0-9]/gi, '_')}_Summary.docx`;
    saveAs(blob, filename);
    
    return Promise.resolve();
  } catch (error) {
    throw new Error(`Summary export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}