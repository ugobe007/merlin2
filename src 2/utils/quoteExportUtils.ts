/**
 * Quote Export Utilities
 * Generate PDF, Word (.docx), and Excel (.xlsx) files with watermarks
 */

import { Document, Paragraph, TextRun, AlignmentType, Header, PageNumber, Footer, Table, TableRow, TableCell, WidthType, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';
import { loadWatermarkSettings } from '../components/AdminWatermarkSettings';

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
}

/**
 * Generate watermark text with current date using admin settings
 */
function getWatermarkText(): string {
  const settings = loadWatermarkSettings();
  if (!settings.enabled) return '';
  
  const baseText = settings.useCustomText && settings.text ? settings.text : 'merlin certified';
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
    rotation: settings.rotation
  };
}

/**
 * Export quote as Word document (.docx) with watermark
 */
export async function exportQuoteAsWord(data: QuoteExportData): Promise<void> {
  const watermarkText = getWatermarkText();
  if (!watermarkText) {
    // Watermark disabled, proceed without it
  }

  // Create Word document
  const doc = new Document({
    sections: [{
      properties: {
        page: {
          // Add watermark as background text
          // Note: docx library doesn't support true diagonal watermarks, but we can add footer text
        }
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: watermarkText.toUpperCase(),
                  size: 16,
                  color: "CCCCCC",
                  bold: true
                })
              ]
            })
          ]
        })
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: `Page `,
                  size: 20
                }),
                new TextRun({
                  children: [PageNumber.CURRENT]
                }),
                new TextRun({
                  text: ` | ${watermarkText}`,
                  size: 18,
                  color: "999999"
                })
              ]
            }),
            new Paragraph({
              alignment: AlignmentType.LEFT,
              children: [
                new TextRun({
                  text: "NOTE: The AI Assistant is not working for [grid connection capacity].",
                  size: 18,
                  color: "CC0000",
                  italics: true
                })
              ]
            })
          ]
        })
      },
      children: [
        // Title
        new Paragraph({
          children: [
            new TextRun({
              text: "⚡ MERLIN Energy",
              size: 48,
              bold: true,
              color: "1E40AF"
            })
          ],
          spacing: { after: 200 }
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: "Battery Energy Storage System Quote",
              size: 32,
              color: "475569"
            })
          ],
          spacing: { after: 400 }
        }),

        // Quote Info
        new Paragraph({
          children: [
            new TextRun({
              text: `Quote #${data.quoteNumber} | ${data.quoteDate}`,
              size: 24,
              bold: true
            })
          ],
          spacing: { after: 400 }
        }),

        // Project Information Section
        new Paragraph({
          children: [
            new TextRun({
              text: "Project Information",
              size: 32,
              bold: true,
              color: "1E40AF"
            })
          ],
          spacing: { before: 400, after: 200 },
          border: {
            bottom: {
              color: "1E40AF",
              space: 1,
              style: BorderStyle.SINGLE,
              size: 6
            }
          }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: "Project Name: ", bold: true }),
            new TextRun({ text: data.projectName })
          ],
          spacing: { after: 100 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Location: ", bold: true }),
            new TextRun({ text: data.location })
          ],
          spacing: { after: 100 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Application Type: ", bold: true }),
            new TextRun({ text: data.applicationType })
          ],
          spacing: { after: 100 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Use Case: ", bold: true }),
            new TextRun({ text: data.useCase })
          ],
          spacing: { after: 400 }
        }),

        // System Specifications
        new Paragraph({
          children: [
            new TextRun({
              text: "System Specifications",
              size: 32,
              bold: true,
              color: "1E40AF"
            })
          ],
          spacing: { before: 400, after: 200 },
          border: {
            bottom: {
              color: "1E40AF",
              space: 1,
              style: BorderStyle.SINGLE,
              size: 6
            }
          }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: "Power Rating: ", bold: true }),
            new TextRun({ text: `${data.storageSizeMW.toFixed(1)} MW` })
          ],
          spacing: { after: 100 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Energy Capacity: ", bold: true }),
            new TextRun({ text: `${data.storageSizeMWh.toFixed(1)} MWh` })
          ],
          spacing: { after: 100 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Duration: ", bold: true }),
            new TextRun({ text: `${data.durationHours.toFixed(1)} hours` })
          ],
          spacing: { after: 100 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Battery Chemistry: ", bold: true }),
            new TextRun({ text: data.chemistry.toUpperCase() })
          ],
          spacing: { after: 100 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Round-Trip Efficiency: ", bold: true }),
            new TextRun({ text: `${data.roundTripEfficiency}%` })
          ],
          spacing: { after: 400 }
        }),

        // Financial Summary
        new Paragraph({
          children: [
            new TextRun({
              text: "Investment Summary",
              size: 32,
              bold: true,
              color: "1E40AF"
            })
          ],
          spacing: { before: 400, after: 200 },
          border: {
            bottom: {
              color: "1E40AF",
              space: 1,
              style: BorderStyle.SINGLE,
              size: 6
            }
          }
        }),

        new Paragraph({
          children: [
            new TextRun({ text: "Total System Cost: ", bold: true, size: 28 }),
            new TextRun({
              text: `$${(data.systemCost / 1000000).toFixed(2)}M`,
              size: 28,
              bold: true,
              color: "059669"
            })
          ],
          spacing: { after: 100 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Cost per kW: ", bold: true }),
            new TextRun({ text: `$${(data.systemCost / (data.storageSizeMW * 1000)).toFixed(0)}/kW` })
          ],
          spacing: { after: 100 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Cost per kWh: ", bold: true }),
            new TextRun({ text: `$${(data.systemCost / (data.storageSizeMWh * 1000)).toFixed(0)}/kWh` })
          ],
          spacing: { after: 400 }
        }),

        // Footer Notes
        new Paragraph({
          children: [
            new TextRun({
              text: "Terms & Conditions",
              size: 24,
              bold: true
            })
          ],
          spacing: { before: 600, after: 200 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "• This quote is valid for 30 days from the date of issue.", size: 20 })
          ],
          spacing: { after: 100 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "• Payment Terms: 50% deposit upon contract signing, 50% upon commissioning.", size: 20 })
          ],
          spacing: { after: 100 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `• Warranty: ${data.warrantyYears} year comprehensive warranty included.`, size: 20 })
          ],
          spacing: { after: 100 }
        })
      ]
    }]
  });

  // Generate and download
  const blob = await Packer.toBlob(doc);
  saveAs(blob, `Merlin_BESS_Quote_${data.quoteNumber}.docx`);
}

/**
 * Export quote as PDF with watermark
 * Uses html2pdf.js approach - we'll create a printable HTML and convert
 */
export async function exportQuoteAsPDF(data: QuoteExportData): Promise<void> {
  const watermarkText = getWatermarkText();

  // Create printable HTML content
  const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>MERLIN BESS Quote ${data.quoteNumber}</title>
      <style>
        @page { size: letter; margin: 1in; }
        body {
          font-family: 'Calibri', Arial, sans-serif;
          font-size: 11pt;
          color: #1e293b;
          position: relative;
        }
        .watermark {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-30deg);
          font-size: 72px;
          color: rgba(59, 130, 246, 0.1);
          font-weight: bold;
          white-space: nowrap;
          z-index: -1;
          pointer-events: none;
        }
        .header {
          border-bottom: 4px solid #1e40af;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        h1 { font-size: 36pt; color: #1e40af; margin: 0; }
        h2 { font-size: 24pt; color: #475569; margin: 10px 0 0 0; }
        .section { margin: 30px 0; }
        .section-title {
          font-size: 18pt;
          font-weight: bold;
          color: #1e40af;
          border-bottom: 2px solid #cbd5e1;
          padding-bottom: 10px;
          margin-bottom: 15px;
        }
        .row { display: flex; margin: 8px 0; }
        .label { font-weight: bold; width: 200px; }
        .value { flex: 1; }
        .financial {
          background: #f0f9ff;
          border: 2px solid #3b82f6;
          border-radius: 8px;
          padding: 20px;
          margin: 30px 0;
        }
        .total-cost {
          font-size: 24pt;
          font-weight: bold;
          color: #059669;
        }
        .footer {
          margin-top: 50px;
          padding-top: 20px;
          border-top: 1px solid #cbd5e1;
          font-size: 9pt;
          color: #64748b;
        }
        .ai-note {
          color: #dc2626;
          font-style: italic;
          font-weight: bold;
          margin-top: 15px;
        }
        @media print {
          body { margin: 0; }
          .watermark { display: block !important; }
        }
      </style>
    </head>
    <body>
      <div class="watermark">${watermarkText.toUpperCase()}</div>

      <div class="header">
        <h1>⚡ MERLIN Energy</h1>
        <h2>Battery Energy Storage System Quote</h2>
        <p style="margin-top: 20px; font-weight: bold;">Quote #${data.quoteNumber} | ${data.quoteDate}</p>
      </div>

      <div class="section">
        <div class="section-title">Project Information</div>
        <div class="row"><div class="label">Project Name:</div><div class="value">${data.projectName}</div></div>
        <div class="row"><div class="label">Location:</div><div class="value">${data.location}</div></div>
        <div class="row"><div class="label">Application Type:</div><div class="value">${data.applicationType}</div></div>
        <div class="row"><div class="label">Use Case:</div><div class="value">${data.useCase}</div></div>
      </div>

      <div class="section">
        <div class="section-title">System Specifications</div>
        <div class="row"><div class="label">Power Rating:</div><div class="value">${data.storageSizeMW.toFixed(1)} MW</div></div>
        <div class="row"><div class="label">Energy Capacity:</div><div class="value">${data.storageSizeMWh.toFixed(1)} MWh</div></div>
        <div class="row"><div class="label">Duration:</div><div class="value">${data.durationHours.toFixed(1)} hours</div></div>
        <div class="row"><div class="label">Battery Chemistry:</div><div class="value">${data.chemistry.toUpperCase()}</div></div>
        <div class="row"><div class="label">Round-Trip Efficiency:</div><div class="value">${data.roundTripEfficiency}%</div></div>
      </div>

      <div class="financial">
        <div class="section-title" style="border: none;">Investment Summary</div>
        <div class="row">
          <div class="label">Total System Cost:</div>
          <div class="value total-cost">$${(data.systemCost / 1000000).toFixed(2)}M</div>
        </div>
        <div class="row"><div class="label">Cost per kW:</div><div class="value">$${(data.systemCost / (data.storageSizeMW * 1000)).toFixed(0)}/kW</div></div>
        <div class="row"><div class="label">Cost per kWh:</div><div class="value">$${(data.systemCost / (data.storageSizeMWh * 1000)).toFixed(0)}/kWh</div></div>
      </div>

      <div class="footer">
        <p>• This quote is valid for 30 days from the date of issue.</p>
        <p>• Payment Terms: 50% deposit upon contract signing, 50% upon commissioning.</p>
        <p>• Warranty: ${data.warrantyYears} year comprehensive warranty included.</p>
        <p class="ai-note">NOTE: The AI Assistant is not working for [grid connection capacity].</p>
      </div>
    </body>
    </html>
  `;

  // Create a new window and print to PDF
  const printWindow = window.open('', '_blank');
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
    alert('Please allow popups to download PDF');
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

NOTE: The AI Assistant is not working for [grid connection capacity].
Quote Valid: 30 days from issue date
Payment Terms: 50% deposit upon contract signing, 50% upon commissioning
`.trim();

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, `Merlin_BESS_Quote_${data.quoteNumber}.csv`);
}

// Re-export Packer for Word document generation
import { Packer } from 'docx';
export { Packer };
