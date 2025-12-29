/**
 * DOCUMENT PARSER SERVICE
 * =======================
 * 
 * Parses uploaded documents (PDF, Excel, CSV) and extracts text content
 * for AI analysis. This is the first step in Path A: Upload Specs workflow.
 * 
 * Supported formats:
 * - PDF (utility bills, equipment specs)
 * - Excel (.xlsx, .xls) - load profiles, equipment schedules
 * - CSV - load data, meter readings
 * 
 * @module documentParserService
 */

import * as XLSX from 'xlsx';
import Papa from 'papaparse';

// ============================================
// TYPES
// ============================================

export interface ParsedDocument {
  fileName: string;
  fileType: 'pdf' | 'excel' | 'csv' | 'image' | 'unknown';
  fileSize: number;
  parsedAt: Date;
  
  // Extracted content
  textContent: string;
  tables: ParsedTable[];
  metadata: DocumentMetadata;
  
  // Processing status
  status: 'success' | 'partial' | 'failed';
  errorMessage?: string;
}

export interface ParsedTable {
  name: string;
  headers: string[];
  rows: string[][];
  rowCount: number;
}

export interface DocumentMetadata {
  pageCount?: number;
  sheetNames?: string[];
  hasImages?: boolean;
  dateExtracted?: string;
  documentType?: 'utility-bill' | 'equipment-schedule' | 'load-profile' | 'other';
}

export interface ParseOptions {
  maxPages?: number;
  extractTables?: boolean;
  ocrEnabled?: boolean;
}

// ============================================
// PDF PARSING
// ============================================

/**
 * Parse PDF file using browser's built-in PDF support
 * For production, integrate pdf.js or a cloud service
 */
async function parsePDF(file: File): Promise<ParsedDocument> {
  const result: ParsedDocument = {
    fileName: file.name,
    fileType: 'pdf',
    fileSize: file.size,
    parsedAt: new Date(),
    textContent: '',
    tables: [],
    metadata: {},
    status: 'success'
  };

  try {
    // For PDFs, we'll read as text (limited) or use pdf.js
    // In production, you'd want to use pdf.js or a cloud service
    const arrayBuffer = await file.arrayBuffer();
    
    // Simple text extraction attempt (limited for complex PDFs)
    const textDecoder = new TextDecoder('utf-8');
    const rawText = textDecoder.decode(arrayBuffer);
    
    // Extract readable text segments
    const textSegments = rawText.match(/[\x20-\x7E\n\r\t]+/g) || [];
    const cleanText = textSegments
      .filter(seg => seg.length > 3)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    // If we got meaningful text, use it
    if (cleanText.length > 100) {
      result.textContent = cleanText.slice(0, 50000); // Limit for API
      result.metadata.documentType = detectDocumentType(cleanText);
    } else {
      // PDF likely has encoded/image content
      result.textContent = `[PDF Document: ${file.name}]\n` +
        `File size: ${(file.size / 1024).toFixed(1)} KB\n` +
        `Note: This PDF may contain scanned images. ` +
        `For best results, ensure text is selectable in the original document.`;
      result.status = 'partial';
      result.errorMessage = 'PDF may contain images or encoded content. Limited text extracted.';
    }
    
  } catch (error) {
    result.status = 'failed';
    result.errorMessage = error instanceof Error ? error.message : 'Failed to parse PDF';
  }

  return result;
}

// ============================================
// EXCEL PARSING
// ============================================

/**
 * Parse Excel file (.xlsx, .xls) using xlsx library
 */
async function parseExcel(file: File): Promise<ParsedDocument> {
  const result: ParsedDocument = {
    fileName: file.name,
    fileType: 'excel',
    fileSize: file.size,
    parsedAt: new Date(),
    textContent: '',
    tables: [],
    metadata: {},
    status: 'success'
  };

  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    
    result.metadata.sheetNames = workbook.SheetNames;
    
    const allText: string[] = [];
    
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      
      // Convert to JSON for structured data (header: 1 returns array of arrays)
      const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][];
      
      if (jsonData.length > 0) {
        // Extract headers (first row)
        const headers = (jsonData[0] as unknown[] || []).map(h => String(h || ''));
        const rows = jsonData.slice(1).map(row => 
          (row as unknown[]).map(cell => String(cell || ''))
        );
        
        const table: ParsedTable = {
          name: sheetName,
          headers,
          rows,
          rowCount: rows.length
        };
        result.tables.push(table);
        
        // Also convert to text for AI analysis
        const sheetText = XLSX.utils.sheet_to_txt(sheet);
        allText.push(`=== Sheet: ${sheetName} ===\n${sheetText}`);
      }
    }
    
    result.textContent = allText.join('\n\n').slice(0, 50000);
    result.metadata.documentType = detectDocumentType(result.textContent);
    
  } catch (error) {
    result.status = 'failed';
    result.errorMessage = error instanceof Error ? error.message : 'Failed to parse Excel file';
  }

  return result;
}

// ============================================
// CSV PARSING
// ============================================

/**
 * Parse CSV file using PapaParse
 */
async function parseCSV(file: File): Promise<ParsedDocument> {
  const result: ParsedDocument = {
    fileName: file.name,
    fileType: 'csv',
    fileSize: file.size,
    parsedAt: new Date(),
    textContent: '',
    tables: [],
    metadata: {},
    status: 'success'
  };

  try {
    const text = await file.text();
    
    // Parse with PapaParse
    const parseResult = Papa.parse(text, {
      header: false,
      skipEmptyLines: true,
      dynamicTyping: false
    });
    
    if (parseResult.errors.length > 0) {
      if (import.meta.env.DEV) {
        console.warn('CSV parsing warnings:', parseResult.errors);
      }
    }
    
    const data = parseResult.data as string[][];
    
    if (data.length > 0) {
      const headers = data[0] || [];
      const rows = data.slice(1);
      
      result.tables.push({
        name: 'main',
        headers,
        rows,
        rowCount: rows.length
      });
      
      // Convert to readable text
      result.textContent = data
        .slice(0, 500) // Limit rows
        .map(row => row.join('\t'))
        .join('\n')
        .slice(0, 50000);
      
      result.metadata.documentType = detectDocumentType(result.textContent);
    }
    
  } catch (error) {
    result.status = 'failed';
    result.errorMessage = error instanceof Error ? error.message : 'Failed to parse CSV file';
  }

  return result;
}

// ============================================
// DOCUMENT TYPE DETECTION
// ============================================

/**
 * Detect document type based on content keywords
 */
function detectDocumentType(text: string): DocumentMetadata['documentType'] {
  const lowerText = text.toLowerCase();
  
  // Utility bill indicators
  const utilityBillKeywords = [
    'kwh', 'kilowatt', 'electricity', 'utility', 'billing period',
    'meter', 'demand charge', 'peak demand', 'account number',
    'service address', 'energy charge', 'rate schedule'
  ];
  
  // Equipment schedule indicators
  const equipmentKeywords = [
    'equipment', 'schedule', 'connected load', 'nameplate',
    'motor', 'hp', 'horsepower', 'hvac', 'compressor',
    'pump', 'lighting', 'panel schedule', 'breaker'
  ];
  
  // Load profile indicators
  const loadProfileKeywords = [
    'load profile', 'interval data', '15-minute', '15 minute',
    'hourly', 'timestamp', 'demand', 'power factor',
    'kw', 'kvar', 'peak', 'average load'
  ];
  
  const utilityScore = utilityBillKeywords.filter(kw => lowerText.includes(kw)).length;
  const equipmentScore = equipmentKeywords.filter(kw => lowerText.includes(kw)).length;
  const loadProfileScore = loadProfileKeywords.filter(kw => lowerText.includes(kw)).length;
  
  const maxScore = Math.max(utilityScore, equipmentScore, loadProfileScore);
  
  if (maxScore >= 3) {
    if (utilityScore === maxScore) return 'utility-bill';
    if (equipmentScore === maxScore) return 'equipment-schedule';
    if (loadProfileScore === maxScore) return 'load-profile';
  }
  
  return 'other';
}

// ============================================
// MAIN PARSER FUNCTION
// ============================================

/**
 * Parse a document file and extract content
 */
export async function parseDocument(
  file: File,
  options: ParseOptions = {}
): Promise<ParsedDocument> {
  const fileName = file.name.toLowerCase();
  
  if (import.meta.env.DEV) {
    console.log(`📄 [DocumentParser] Parsing: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
  }
  
  // Route to appropriate parser
  if (fileName.endsWith('.pdf')) {
    return parsePDF(file);
  }
  
  if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
    return parseExcel(file);
  }
  
  if (fileName.endsWith('.csv')) {
    return parseCSV(file);
  }
  
  // Image files - can be processed with OCR in future
  if (/\.(jpg|jpeg|png|gif|webp)$/i.test(fileName)) {
    return {
      fileName: file.name,
      fileType: 'image',
      fileSize: file.size,
      parsedAt: new Date(),
      textContent: `[Image File: ${file.name}]\nImage analysis requires OCR processing.`,
      tables: [],
      metadata: { hasImages: true },
      status: 'partial',
      errorMessage: 'Image files require OCR for text extraction'
    };
  }
  
  // Unknown file type
  return {
    fileName: file.name,
    fileType: 'unknown',
    fileSize: file.size,
    parsedAt: new Date(),
    textContent: '',
    tables: [],
    metadata: {},
    status: 'failed',
    errorMessage: `Unsupported file type: ${file.name.split('.').pop()}`
  };
}

/**
 * Parse multiple documents
 */
export async function parseDocuments(
  files: File[],
  options: ParseOptions = {}
): Promise<ParsedDocument[]> {
  const results = await Promise.all(
    files.map(file => parseDocument(file, options))
  );
  
  if (import.meta.env.DEV) {
    const successful = results.filter(r => r.status === 'success').length;
    console.log(`📄 [DocumentParser] Parsed ${successful}/${files.length} documents successfully`);
  }
  
  return results;
}

/**
 * Combine parsed documents into a single text for AI analysis
 */
export function combineDocumentsForAnalysis(documents: ParsedDocument[]): string {
  const sections: string[] = [];
  
  for (const doc of documents) {
    if (doc.status === 'failed') continue;
    
    sections.push(`
=== Document: ${doc.fileName} ===
Type: ${doc.metadata.documentType || doc.fileType}
${doc.textContent}
`);
    
    // Add table summaries
    for (const table of doc.tables) {
      if (table.rowCount > 0) {
        sections.push(`
--- Table: ${table.name} (${table.rowCount} rows) ---
Headers: ${table.headers.join(', ')}
Sample rows:
${table.rows.slice(0, 10).map(row => row.join('\t')).join('\n')}
`);
      }
    }
  }
  
  return sections.join('\n').slice(0, 100000); // Limit total size
}
