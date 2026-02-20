import { Document, Packer, Paragraph, TextRun, AlignmentType, Table, WidthType, HeadingLevel, Header } from "docx";
import { createHeaderRow, createDataRow, createHighlightRow, createCalculationTables } from '../../utils/wordHelpers';

interface WordExportParams {
  // Project data
  quoteName: string;
  powerMW: number;
  standbyHours: number;
  batteryKwh: number;
  pcsKw: number;
  
  // Energy configuration
  energyCapacity: number;
  energyUnit: string;
  powerRating: number;
  powerUnit: string;
  applicationType: 'residential' | 'commercial' | 'utility' | 'ups';
  
  // Financial parameters
  electricityRate: number;
  incentiveRate: number;
  financingCost: number;
  exchangeRate: number;
  selectedCurrency: string;
  
  // Sound effect
  magicPoofSound: string;
}

export class WordExportService {
  static async exportProfessionalQuote(params: WordExportParams): Promise<void> {
    if (import.meta.env.DEV) console.log('🚀 Export to Word button clicked!');
    
    // Play magical sound effect
    try {
      const audio = new Audio(params.magicPoofSound);
      audio.volume = 0.5;
      audio.play().catch(err => { if (import.meta.env.DEV) console.log('Audio play failed:', err); });
    } catch (err) {
      if (import.meta.env.DEV) console.log('Sound file error:', err);
    }
    
    try {
      const totalMWh = params.powerMW * params.standbyHours;
      const pcsKW = params.powerMW * 1000;
      
      // Dynamic pricing based on system size (industry standards)
      let adjustedBatteryPrice = params.batteryKwh;
      let adjustedPcsPrice = params.pcsKw;
      
      // Large scale pricing adjustments (economies of scale)
      if (params.powerMW >= 5) {
        // Large scale (≥5MW): Use utility-scale pricing
        adjustedBatteryPrice = Math.min(params.batteryKwh, 120); // BNEF large scale rate
        adjustedPcsPrice = Math.min(params.pcsKw, 140); // Bulk PCS pricing
      } else if (params.powerMW >= 2) {
        // Commercial scale (2-5MW): Mid-tier pricing
        adjustedBatteryPrice = Math.min(params.batteryKwh, 150); // Commercial pricing
        adjustedPcsPrice = Math.min(params.pcsKw, 180); // Mid-tier PCS
      } else if (params.powerMW >= 0.5) {
        // Small commercial (0.5-2MW): Standard commercial pricing
        adjustedBatteryPrice = Math.min(params.batteryKwh, 200); // Small commercial
        adjustedPcsPrice = Math.min(params.pcsKw, 220); // Standard PCS
      } else {
        // Residential/Small scale (<0.5MW): Premium pricing
        adjustedBatteryPrice = Math.min(params.batteryKwh, 300); // Residential pricing
        adjustedPcsPrice = Math.min(params.pcsKw, 300); // Residential PCS
      }
      
      // Calculate system costs with scale-based pricing
      const batteryCapacityKWh = totalMWh * 1000; // Convert MWh to kWh
      const batteryCostUSD = batteryCapacityKWh * adjustedBatteryPrice;
      const pcsCostUSD = pcsKW * adjustedPcsPrice;
      
      // EPC costs (Engineering, Procurement, Construction) - industry standards
      let epcRatePercent = 25; // Default 25%
      if (params.powerMW >= 10) {
        epcRatePercent = 15; // Large projects have lower EPC rates
      } else if (params.powerMW >= 5) {
        epcRatePercent = 18; // Mid-size projects
      } else if (params.powerMW >= 1) {
        epcRatePercent = 22; // Commercial projects
      }
      
      const equipmentCostUSD = batteryCostUSD + pcsCostUSD;
      const epcCostUSD = equipmentCostUSD * (epcRatePercent / 100);
      const totalSystemCostUSD = equipmentCostUSD + epcCostUSD;
      
      // Convert to selected currency
      const batteryCost = batteryCostUSD / params.exchangeRate;
      const pcsCost = pcsCostUSD / params.exchangeRate;
      const epcCost = epcCostUSD / params.exchangeRate;
      const totalSystemCost = totalSystemCostUSD / params.exchangeRate;
      
      // Calculate cost per kW and kWh
      const costPerKW = totalSystemCost / (params.powerMW * 1000);
      const costPerKWh = totalSystemCost / batteryCapacityKWh;
      
      // Financial calculations
      const annualEnergyThroughput = batteryCapacityKWh * 365 * 0.85; // 85% efficiency assumption
      const grossAnnualRevenue = annualEnergyThroughput * params.electricityRate / params.exchangeRate;
      
      // Calculate incentives
      const totalIncentives = totalSystemCost * (params.incentiveRate / 100);
      const netSystemCost = totalSystemCost - totalIncentives;
      
      // Operating costs (2% of system cost annually - industry standard)
      const annualOperatingCosts = totalSystemCost * 0.02;
      const netAnnualCashFlow = grossAnnualRevenue - annualOperatingCosts;
      
      // Simple payback calculation
      const simplePayback = netSystemCost / netAnnualCashFlow;
      
      // ROI calculations
      const twentyYearCashFlow = netAnnualCashFlow * 20; // 20-year system life
      const totalReturn = twentyYearCashFlow - netSystemCost;
      const roiPercent = (totalReturn / netSystemCost) * 100;
      
      // Create professional tables for the document
      const systemSpecsTable = new Table({
        width: {
          size: 100,
          type: WidthType.PERCENTAGE,
        },
        rows: [
          createHeaderRow(["System Specification", "Value", "Unit"]),
          createDataRow(["Project Name", params.quoteName, ""]),
          createDataRow(["Application Type", params.applicationType.charAt(0).toUpperCase() + params.applicationType.slice(1), ""]),
          createDataRow(["Energy Storage Capacity", batteryCapacityKWh.toLocaleString(), "kWh"]),
          createDataRow(["Power Rating", (params.powerMW * 1000).toLocaleString(), "kW"]),
          createDataRow(["Discharge Duration", (batteryCapacityKWh / (params.powerMW * 1000)).toFixed(1), "hours"]),
          createDataRow(["System Configuration", `${params.powerMW}MW / ${totalMWh}MWh`, "MW/MWh"]),
        ],
      });
      
      const costBreakdownTable = new Table({
        width: {
          size: 100,
          type: WidthType.PERCENTAGE,
        },
        rows: [
          createHeaderRow(["Cost Component", "Amount", "Currency", "Percentage"]),
          createDataRow([
            "Battery Energy Storage System",
            batteryCost.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }),
            params.selectedCurrency,
            `${((batteryCostUSD / totalSystemCostUSD) * 100).toFixed(1)}%`
          ]),
          createDataRow([
            "Power Conversion System (PCS)",
            pcsCost.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }),
            params.selectedCurrency,
            `${((pcsCostUSD / totalSystemCostUSD) * 100).toFixed(1)}%`
          ]),
          createDataRow([
            `EPC & Installation (${epcRatePercent}%)`,
            epcCost.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }),
            params.selectedCurrency,
            `${epcRatePercent}%`
          ]),
          createHighlightRow([
            "Total System Cost",
            totalSystemCost.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }),
            params.selectedCurrency,
            "100%"
          ], "E5E7EB"),
        ],
      });
      
      const financialAnalysisTable = new Table({
        width: {
          size: 100,
          type: WidthType.PERCENTAGE,
        },
        rows: [
          createHeaderRow(["Financial Metric", "Value", "Currency/Unit"]),
          createDataRow([
            "Cost per kW",
            costPerKW.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }),
            `${params.selectedCurrency}/kW`
          ]),
          createDataRow([
            "Cost per kWh",
            costPerKWh.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }),
            `${params.selectedCurrency}/kWh`
          ]),
          createDataRow([
            "Annual Energy Throughput",
            annualEnergyThroughput.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }),
            "kWh/year"
          ]),
          createDataRow([
            "Gross Annual Revenue",
            grossAnnualRevenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }),
            `${params.selectedCurrency}/year`
          ]),
          createDataRow([
            "Annual Operating Costs (2%)",
            annualOperatingCosts.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }),
            `${params.selectedCurrency}/year`
          ]),
          createDataRow([
            "Net Annual Cash Flow",
            netAnnualCashFlow.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }),
            `${params.selectedCurrency}/year`
          ]),
          createDataRow([
            `Total Incentives (${params.incentiveRate}%)`,
            totalIncentives.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }),
            params.selectedCurrency
          ]),
          createDataRow([
            "Net System Cost (After Incentives)",
            netSystemCost.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }),
            params.selectedCurrency
          ]),
          createHighlightRow([
            "Simple Payback Period",
            simplePayback.toFixed(1),
            "years"
          ], "E6F3FF"),
          createHighlightRow([
            "20-Year ROI",
            roiPercent.toFixed(1),
            "%"
          ], "E6F3FF"),
        ],
      });

      // Main document content
      const doc = new Document({
        creator: "Merlin BESS Quote Builder",
        title: `${params.quoteName} - Professional BESS Quote`,
        description: "Comprehensive Battery Energy Storage System analysis and quotation",
        styles: {
          paragraphStyles: [
            {
              id: "heading1",
              name: "Heading 1",
              basedOn: "Normal",
              next: "Normal",
              quickFormat: true,
              run: {
                size: 32,
                bold: true,
                color: "1F4788",
              },
              paragraph: {
                spacing: { after: 240 },
              },
            },
            {
              id: "heading2",
              name: "Heading 2",
              basedOn: "Normal",
              next: "Normal",
              quickFormat: true,
              run: {
                size: 26,
                bold: true,
                color: "2F5496",
              },
              paragraph: {
                spacing: { before: 240, after: 120 },
              },
            },
          ],
        },
        sections: [
          {
            properties: {
              page: {
                margin: {
                  top: 1440,
                  right: 1440,
                  bottom: 1440,
                  left: 1440,
                },
              },
            },
            headers: {
              default: new Header({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: `${params.quoteName} - Professional BESS Quote`,
                        size: 20,
                        color: "666666",
                      }),
                    ],
                    alignment: AlignmentType.RIGHT,
                  }),
                ],
              }),
            },
            children: [
              // Cover Page
              new Paragraph({
                children: [
                  new TextRun({
                    text: "⚡ PROFESSIONAL BESS QUOTE ⚡",
                    bold: true,
                    size: 48,
                    color: "1F4788",
                  }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 480 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: params.quoteName,
                    bold: true,
                    size: 36,
                    color: "2F5496",
                  }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 240 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Battery Energy Storage System",
                    size: 24,
                    color: "5B9BD5",
                  }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 240 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Comprehensive Technical & Financial Analysis",
                    italics: true,
                    size: 20,
                    color: "70AD47",
                  }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 960 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Generated: ${new Date().toLocaleDateString()} | Merlin BESS Quote Builder v2.0`,
                    size: 18,
                    color: "7F7F7F",
                  }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 480 },
              }),
              new Paragraph({
                pageBreakBefore: true,
                text: "",
              }),
              
              // Executive Summary
              new Paragraph({
                text: "EXECUTIVE SUMMARY",
                heading: HeadingLevel.HEADING_1,
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "This comprehensive analysis presents a detailed evaluation of a ",
                    size: 24,
                  }),
                  new TextRun({
                    text: `${(params.powerMW * 1000).toLocaleString()}kW / ${batteryCapacityKWh.toLocaleString()}kWh`,
                    size: 24,
                    bold: true,
                    color: "C5504B",
                  }),
                  new TextRun({
                    text: ` battery energy storage system for ${params.applicationType} application. `,
                    size: 24,
                  }),
                  new TextRun({
                    text: `The system provides ${(batteryCapacityKWh / (params.powerMW * 1000)).toFixed(1)} hours of discharge duration`,
                    size: 24,
                    bold: true,
                  }),
                  new TextRun({
                    text: " and delivers exceptional value through advanced energy management capabilities.",
                    size: 24,
                  }),
                ],
                spacing: { after: 240 },
              }),
              
              // Key highlights box
              new Paragraph({
                children: [
                  new TextRun({
                    text: "🎯 KEY HIGHLIGHTS",
                    bold: true,
                    size: 20,
                    color: "1F4788",
                  }),
                ],
                spacing: { before: 240, after: 120 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `• Total Investment: ${totalSystemCost.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ${params.selectedCurrency}`,
                    size: 18,
                  }),
                ],
                spacing: { after: 60 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `• Cost Efficiency: ${costPerKWh.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ${params.selectedCurrency}/kWh (${costPerKW.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ${params.selectedCurrency}/kW)`,
                    size: 18,
                  }),
                ],
                spacing: { after: 60 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `• Financial Return: ${simplePayback.toFixed(1)} year payback | ${roiPercent.toFixed(1)}% 20-year ROI`,
                    size: 18,
                    bold: true,
                    color: "70AD47",
                  }),
                ],
                spacing: { after: 60 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `• Annual Cash Flow: ${netAnnualCashFlow.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ${params.selectedCurrency}/year`,
                    size: 18,
                  }),
                ],
                spacing: { after: 60 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `• Incentive Benefit: ${totalIncentives.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ${params.selectedCurrency} (${params.incentiveRate}%)`,
                    size: 18,
                  }),
                ],
                spacing: { after: 240 },
              }),
              
              new Paragraph({
                pageBreakBefore: true,
                text: "",
              }),
              
              // Project Overview & Visualization
              new Paragraph({
                text: "PROJECT OVERVIEW & VISUALIZATION",
                heading: HeadingLevel.HEADING_1,
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "System Architecture & Configuration",
                    bold: true,
                    size: 22,
                    color: "2F5496",
                  }),
                ],
                spacing: { after: 120 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "This battery energy storage system is designed for optimal performance in ",
                    size: 20,
                  }),
                  new TextRun({
                    text: `${params.applicationType} applications`,
                    bold: true,
                    size: 20,
                  }),
                  new TextRun({
                    text: ". The system configuration balances power capacity, energy storage duration, and cost-effectiveness to deliver maximum value for your specific use case.",
                    size: 20,
                  }),
                ],
                spacing: { after: 240 },
              }),
              
              // System specifications table
              systemSpecsTable,
              
              new Paragraph({
                children: [
                  new TextRun({
                    text: "💡 SYSTEM BENEFITS & APPLICATIONS",
                    bold: true,
                    size: 20,
                    color: "70AD47",
                  }),
                ],
                spacing: { before: 360, after: 120 },
              }),
              ...this.getApplicationBenefits(params.applicationType),
              
              new Paragraph({
                pageBreakBefore: true,
                text: "",
              }),
              
              // Technical Specifications & Pricing
              new Paragraph({
                text: "TECHNICAL SPECIFICATIONS & PRICING",
                heading: HeadingLevel.HEADING_1,
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Detailed Cost Breakdown",
                    bold: true,
                    size: 22,
                    color: "2F5496",
                  }),
                ],
                spacing: { after: 120 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Our pricing structure reflects current market conditions and includes industry-standard components with scale-based economies. ",
                    size: 18,
                  }),
                  new TextRun({
                    text: "All costs include equipment, engineering, procurement, and construction (EPC) services.",
                    size: 18,
                    bold: true,
                  }),
                ],
                spacing: { after: 240 },
              }),
              
              // Cost breakdown table
              costBreakdownTable,
              
              new Paragraph({
                children: [
                  new TextRun({
                    text: "🔍 PRICING METHODOLOGY",
                    bold: true,
                    size: 18,
                    color: "C5504B",
                  }),
                ],
                spacing: { before: 360, after: 120 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Battery pricing: ${adjustedBatteryPrice} ${params.selectedCurrency}/kWh (${this.getPricingTier(params.powerMW)} pricing tier)`,
                    size: 16,
                  }),
                ],
                spacing: { after: 60 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `PCS pricing: ${adjustedPcsPrice} ${params.selectedCurrency}/kW (includes inverters & controls)`,
                    size: 16,
                  }),
                ],
                spacing: { after: 60 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `EPC rate: ${epcRatePercent}% (varies by project scale)`,
                    size: 16,
                  }),
                ],
                spacing: { after: 240 },
              }),
              
              new Paragraph({
                text: "",
                pageBreakBefore: true,
              }),
              
              // Financial Analysis & ROI
              new Paragraph({
                text: "FINANCIAL ANALYSIS & ROI",
                heading: HeadingLevel.HEADING_1,
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Investment Performance & Returns",
                    bold: true,
                    size: 22,
                    color: "2F5496",
                  }),
                ],
                spacing: { after: 120 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "This financial analysis demonstrates the economic viability of the proposed BESS installation. ",
                    size: 18,
                  }),
                  new TextRun({
                    text: `With a ${simplePayback.toFixed(1)}-year payback period and ${roiPercent.toFixed(1)}% ROI over 20 years`,
                    size: 18,
                    bold: true,
                    color: "70AD47",
                  }),
                  new TextRun({
                    text: ", this investment delivers strong financial returns while providing energy security and grid stability benefits.",
                    size: 18,
                  }),
                ],
                spacing: { after: 240 },
              }),
              
              // Financial analysis table
              financialAnalysisTable,
              
              new Paragraph({
                children: [
                  new TextRun({
                    text: "📊 REVENUE ASSUMPTIONS",
                    bold: true,
                    size: 18,
                    color: "5B9BD5",
                  }),
                ],
                spacing: { before: 360, after: 120 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `• Electricity rate: ${params.electricityRate} ${params.selectedCurrency}/kWh`,
                    size: 16,
                  }),
                ],
                spacing: { after: 60 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "• System efficiency: 85% round-trip",
                    size: 16,
                  }),
                ],
                spacing: { after: 60 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "• Annual cycling: 365 days/year",
                    size: 16,
                  }),
                ],
                spacing: { after: 60 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "• Operating costs: 2% of system cost annually",
                    size: 16,
                  }),
                ],
                spacing: { after: 60 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "• System lifespan: 20 years",
                    size: 16,
                  }),
                ],
                spacing: { after: 240 },
              }),
              
              new Paragraph({
                text: "",
                pageBreakBefore: true,
              }),
              
              // Implementation & Certifications
              new Paragraph({
                text: "IMPLEMENTATION & CERTIFICATIONS",
                heading: HeadingLevel.HEADING_1,
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Project Timeline & Standards",
                    bold: true,
                    size: 22,
                    color: "2F5496",
                  }),
                ],
                spacing: { after: 120 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Implementation Timeline",
                    bold: true,
                    size: 20,
                    color: "C5504B",
                  }),
                ],
                spacing: { after: 120 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "• Design & Engineering: 4-6 weeks",
                    size: 18,
                  }),
                ],
                spacing: { after: 60 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "• Permitting & Approvals: 8-12 weeks",
                    size: 18,
                  }),
                ],
                spacing: { after: 60 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "• Procurement & Manufacturing: 12-20 weeks",
                    size: 18,
                  }),
                ],
                spacing: { after: 60 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "• Installation & Commissioning: 4-8 weeks",
                    size: 18,
                  }),
                ],
                spacing: { after: 60 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Total Project Duration: 28-46 weeks",
                    size: 18,
                    bold: true,
                    color: "70AD47",
                  }),
                ],
                spacing: { after: 240 },
              }),
              
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Certifications & Standards",
                    bold: true,
                    size: 20,
                    color: "C5504B",
                  }),
                ],
                spacing: { after: 120 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "• UL 9540: Energy Storage Systems and Equipment",
                    size: 18,
                  }),
                ],
                spacing: { after: 60 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "• UL 1973: Batteries for Use in Stationary Applications",
                    size: 18,
                  }),
                ],
                spacing: { after: 60 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "• IEEE 1547: Standard for Interconnection",
                    size: 18,
                  }),
                ],
                spacing: { after: 60 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "• NFPA 855: Energy Storage Systems Code",
                    size: 18,
                  }),
                ],
                spacing: { after: 60 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "• IEC 62933: Electrical Energy Storage (EES) Systems",
                    size: 18,
                  }),
                ],
                spacing: { after: 240 },
              }),
              
              new Paragraph({
                text: "",
                pageBreakBefore: true,
              }),
              
              // Summary & Next Steps
              new Paragraph({
                text: "SUMMARY & NEXT STEPS",
                heading: HeadingLevel.HEADING_1,
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Recommendation & Action Plan",
                    bold: true,
                    size: 22,
                    color: "2F5496",
                  }),
                ],
                spacing: { after: 120 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Based on this comprehensive analysis, the proposed ",
                    size: 18,
                  }),
                  new TextRun({
                    text: `${(params.powerMW * 1000).toLocaleString()}kW / ${batteryCapacityKWh.toLocaleString()}kWh BESS`,
                    size: 18,
                    bold: true,
                    color: "C5504B",
                  }),
                  new TextRun({
                    text: ` represents an excellent investment opportunity for ${params.applicationType} applications. `,
                    size: 18,
                  }),
                  new TextRun({
                    text: `The system delivers strong financial returns with a ${simplePayback.toFixed(1)}-year payback period`,
                    size: 18,
                    bold: true,
                  }),
                  new TextRun({
                    text: " while providing significant operational and environmental benefits.",
                    size: 18,
                  }),
                ],
                spacing: { after: 240 },
              }),
              
              new Paragraph({
                children: [
                  new TextRun({
                    text: "🎯 IMMEDIATE NEXT STEPS",
                    bold: true,
                    size: 20,
                    color: "C5504B",
                  }),
                ],
                spacing: { after: 120 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "1. Site Assessment & Engineering Review",
                    size: 18,
                    bold: true,
                  }),
                ],
                spacing: { after: 60 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "   • Electrical infrastructure evaluation",
                    size: 16,
                  }),
                ],
                spacing: { after: 40 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "   • Structural and foundation requirements",
                    size: 16,
                  }),
                ],
                spacing: { after: 60 },
              }),
              
              new Paragraph({
                children: [
                  new TextRun({
                    text: "2. Financial Optimization & Incentive Analysis",
                    size: 18,
                    bold: true,
                  }),
                ],
                spacing: { after: 60 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "   • Local incentive programs research",
                    size: 16,
                  }),
                ],
                spacing: { after: 40 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "   • Financing options evaluation",
                    size: 16,
                  }),
                ],
                spacing: { after: 60 },
              }),
              
              new Paragraph({
                children: [
                  new TextRun({
                    text: "3. Permitting & Regulatory Compliance",
                    size: 18,
                    bold: true,
                  }),
                ],
                spacing: { after: 60 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "   • Local jurisdiction requirements",
                    size: 16,
                  }),
                ],
                spacing: { after: 40 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "   • Utility interconnection agreements",
                    size: 16,
                  }),
                ],
                spacing: { after: 60 },
              }),
              
              new Paragraph({
                children: [
                  new TextRun({
                    text: "4. Detailed Design & Procurement",
                    size: 18,
                    bold: true,
                  }),
                ],
                spacing: { after: 60 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "   • Final system optimization",
                    size: 16,
                  }),
                ],
                spacing: { after: 40 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "   • Vendor selection and contracts",
                    size: 16,
                  }),
                ],
                spacing: { after: 240 },
              }),
              
              new Paragraph({
                children: [
                  new TextRun({
                    text: "📞 CONTACT INFORMATION",
                    bold: true,
                    size: 20,
                    color: "1F4788",
                  }),
                ],
                spacing: { after: 120 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "For questions, additional analysis, or to proceed with implementation:",
                    size: 18,
                  }),
                ],
                spacing: { after: 120 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Email: solutions@merlin-bess.com",
                    size: 18,
                    bold: true,
                  }),
                ],
                spacing: { after: 60 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Phone: +1 (555) 123-BESS",
                    size: 18,
                    bold: true,
                  }),
                ],
                spacing: { after: 60 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Web: www.merlin-bess.com",
                    size: 18,
                    bold: true,
                  }),
                ],
                spacing: { after: 240 },
              }),
              
              new Paragraph({
                text: "",
                pageBreakBefore: true,
              }),
              
              // Appendix A: Calculation Formulas
              new Paragraph({
                text: "APPENDIX A: CALCULATION FORMULAS",
                heading: HeadingLevel.HEADING_1,
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Technical Calculation Reference",
                    bold: true,
                    size: 22,
                    color: "2F5496",
                  }),
                ],
                spacing: { after: 120 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "This appendix provides the detailed formulas and assumptions used in this analysis for transparency and verification purposes.",
                    size: 18,
                  }),
                ],
                spacing: { after: 240 },
              }),
              
              // Create calculation tables
              ...createCalculationTables([]),
              
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Note: All calculations are based on industry-standard methodologies and current market conditions. Actual performance may vary based on specific site conditions, usage patterns, and equipment specifications.",
                    italics: true,
                    size: 16,
                    color: "7F7F7F",
                  }),
                ],
                spacing: { before: 360 },
                alignment: AlignmentType.CENTER,
              }),
            ],
          },
        ],
      });

      const buffer = await Packer.toBlob(doc);
      const link = document.createElement('a');
      link.href = URL.createObjectURL(buffer);
      link.download = `${params.quoteName.replace(/[^a-z0-9]/gi, '_')}_BESS_Quote.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      alert(`✅ Professional BESS Quote generated successfully!\n\n"${params.quoteName}_BESS_Quote.docx"\n\nIncludes:\n• Project Information\n• Executive Summary\n• Project Overview & Visualization\n• Technical Specifications & Pricing\n• Financial Analysis & ROI\n• Implementation & Certifications\n• Summary & Next Steps\n• Appendix A: Calculation Formulas`);
    } catch (error) {
      console.error('❌ Word export error:', error);
      console.error('Error details:', error instanceof Error ? error.message : error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      alert(`❌ Word export failed. Please try again.\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private static getApplicationBenefits(applicationType: string): Paragraph[] {
    const benefits: { [key: string]: string[] } = {
      residential: [
        "Backup power during outages",
        "Solar energy storage & time-shifting",
        "Peak demand reduction",
        "Grid independence & energy security",
        "Increased property value"
      ],
      commercial: [
        "Peak demand charge reduction",
        "Power quality improvement",
        "Backup power for critical loads",
        "Energy arbitrage opportunities",
        "Corporate sustainability goals"
      ],
      utility: [
        "Grid stability & frequency regulation",
        "Peak shaving & load leveling",
        "Renewable energy integration",
        "Transmission & distribution deferral",
        "Ancillary services revenue"
      ],
      ups: [
        "Critical load backup power",
        "Power quality assurance",
        "Uninterruptible power supply",
        "Reduced generator dependency",
        "Enhanced system reliability"
      ]
    };

    const applicationBenefits = benefits[applicationType] || benefits.commercial;
    
    return applicationBenefits.map(benefit => 
      new Paragraph({
        children: [
          new TextRun({
            text: `• ${benefit}`,
            size: 18,
          }),
        ],
        spacing: { after: 60 },
      })
    );
  }

  private static getPricingTier(powerMW: number): string {
    if (powerMW >= 5) return "Utility-scale";
    if (powerMW >= 2) return "Commercial";
    if (powerMW >= 0.5) return "Small commercial";
    return "Residential";
  }
}

export default WordExportService;