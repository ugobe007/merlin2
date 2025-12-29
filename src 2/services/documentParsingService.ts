/**
 * DOCUMENT PARSING SERVICE
 * ========================
 * 
 * Extracts text content from uploaded documents (PDF, Excel, CSV)
 * for AI-powered spec extraction.
 * 
 * Supported formats:
 * - PDF: Uses pdfjs-dist
 * - Excel (.xlsx, .xls): Uses xlsx library
 * - CSV: Native parsing
 * - Text (.txt): Direct read
 * 
 * @module documentParsingService
 */

import * as pdfjsLib from 'pdfjs-dist';
import * as XLSX from 'xlsx';

// Configure PDF.js worker
// In production, use CDN worker for better performance
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export interface ParsedDocument {
  filename: string;
  fileType: 'pdf' | 'excel' | 'csv' | 'text' | 'unknown';
  textContent: string;
  pageCount?: number;
  sheetNames?: string[];
  metadata?: Record<string, string>;
  parseTime: number; // ms
  error?: string;
}

export interface DocumentParseOptions {
  maxPages?: number; // For PDFs, limit pages to parse (default: 50)
  maxFileSize?: number; // Max file size in bytes (default: 10MB)
  includeMetadata?: boolean;
}

const DEFAULT_OPTIONS: DocumentParseOptions = {
  maxPages: 50,
  maxFileSize: 10 * 1024 * 1024, // 10MB
  includeMetadata: true,
};

/**
 * Parse a document file and extract text content
 */
export async function parseDocument(
  file: File,
  options: DocumentParseOptions = {}
): Promise<ParsedDocument> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const startTime = performance.now();
  
  // Validate file size
  if (file.size > (opts.maxFileSize || DEFAULT_OPTIONS.maxFileSize!)) {
    return {
      filename: file.name,
      fileType: 'unknown',
      textContent: '',
      parseTime: performance.now() - startTime,
      error: `File too large. Maximum size is ${Math.round((opts.maxFileSize || DEFAULT_OPTIONS.maxFileSize!) / 1024 / 1024)}MB`,
    };
  }
  
  const fileType = getFileType(file);
  
  try {
    switch (fileType) {
      case 'pdf':
        return await parsePDF(file, opts, startTime);
      case 'excel':
        return await parseExcel(file, startTime);
      case 'csv':
        return await parseCSV(file, startTime);
      case 'text':
        return await parseText(file, startTime);
      default:
        return {
          filename: file.name,
          fileType: 'unknown',
          textContent: '',
          parseTime: performance.now() - startTime,
          error: `Unsupported file type: ${file.type || file.name.split('.').pop()}`,
        };
    }
  } catch (error) {
    return {
      filename: file.name,
      fileType,
      textContent: '',
      parseTime: performance.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown parsing error',
    };
  }
}

/**
 * Determine file type from MIME type or extension
 */
function getFileType(file: File): ParsedDocument['fileType'] {
  const extension = file.name.split('.').pop()?.toLowerCase();
  const mimeType = file.type.toLowerCase();
  
  if (mimeType === 'application/pdf' || extension === 'pdf') {
    return 'pdf';
  }
  
  if (
    mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    mimeType === 'application/vnd.ms-excel' ||
    extension === 'xlsx' ||
    extension === 'xls'
  ) {
    return 'excel';
  }
  
  if (mimeType === 'text/csv' || extension === 'csv') {
    return 'csv';
  }
  
  if (mimeType.startsWith('text/') || extension === 'txt') {
    return 'text';
  }
  
  return 'unknown';
}

/**
 * Parse PDF document using pdf.js
 */
async function parsePDF(
  file: File,
  options: DocumentParseOptions,
  startTime: number
): Promise<ParsedDocument> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  const maxPages = Math.min(pdf.numPages, options.maxPages || 50);
  const textParts: string[] = [];
  const metadata: Record<string, string> = {};
  
  // Extract metadata if available
  if (options.includeMetadata) {
    try {
      const pdfMetadata = await pdf.getMetadata();
      if (pdfMetadata.info) {
        const info = pdfMetadata.info as Record<string, unknown>;
        if (info.Title) metadata.title = String(info.Title);
        if (info.Author) metadata.author = String(info.Author);
        if (info.Subject) metadata.subject = String(info.Subject);
        if (info.Creator) metadata.creator = String(info.Creator);
      }
    } catch {
      // Metadata extraction failed, continue without it
    }
  }
  
  // Extract text from each page
  for (let i = 1; i <= maxPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ');
    textParts.push(pageText);
  }
  
  return {
    filename: file.name,
    fileType: 'pdf',
    textContent: textParts.join('\n\n'),
    pageCount: pdf.numPages,
    metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
    parseTime: performance.now() - startTime,
  };
}

/**
 * Parse Excel document using xlsx library
 */
async function parseExcel(file: File, startTime: number): Promise<ParsedDocument> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  
  const textParts: string[] = [];
  
  // Process each sheet
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    
    // Convert to CSV for text extraction
    const csvContent = XLSX.utils.sheet_to_csv(sheet);
    textParts.push(`=== Sheet: ${sheetName} ===\n${csvContent}`);
  }
  
  return {
    filename: file.name,
    fileType: 'excel',
    textContent: textParts.join('\n\n'),
    sheetNames: workbook.SheetNames,
    parseTime: performance.now() - startTime,
  };
}

/**
 * Parse CSV file
 */
async function parseCSV(file: File, startTime: number): Promise<ParsedDocument> {
  const text = await file.text();
  
  return {
    filename: file.name,
    fileType: 'csv',
    textContent: text,
    parseTime: performance.now() - startTime,
  };
}

/**
 * Parse plain text file
 */
async function parseText(file: File, startTime: number): Promise<ParsedDocument> {
  const text = await file.text();
  
  return {
    filename: file.name,
    fileType: 'text',
    textContent: text,
    parseTime: performance.now() - startTime,
  };
}

/**
 * Parse multiple documents in parallel
 */
export async function parseMultipleDocuments(
  files: File[],
  options: DocumentParseOptions = {}
): Promise<ParsedDocument[]> {
  return Promise.all(files.map(file => parseDocument(file, options)));
}
