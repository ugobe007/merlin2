/**
 * DOCUMENT UPLOAD ZONE
 * ====================
 * 
 * Drag-and-drop file upload component for Path A workflow.
 * Supports PDF, Excel, and CSV files for AI extraction.
 * 
 * Features:
 * - Drag & drop or click to upload
 * - Multiple file support
 * - File type validation
 * - Upload progress indication
 * - AI extraction status
 * 
 * @component DocumentUploadZone
 */

import React, { useState, useCallback, useRef } from 'react';
import { 
  Upload, FileText, FileSpreadsheet, File, X, 
  CheckCircle, AlertCircle, Loader2, Sparkles,
  FileType, Trash2
} from 'lucide-react';
import { parseDocuments, type ParsedDocument } from '@/services/documentParserService';
import { 
  extractSpecsFromDocuments, 
  validateExtractedData,
  type ExtractedSpecsData 
} from '@/services/openAIExtractionService';

// ============================================
// TYPES
// ============================================

interface DocumentUploadZoneProps {
  onExtractionComplete: (data: ExtractedSpecsData, documents: ParsedDocument[]) => void;
  onError?: (error: string) => void;
  maxFiles?: number;
  maxFileSizeMB?: number;
  className?: string;
}

interface UploadedFile {
  id: string;
  file: File;
  status: 'pending' | 'parsing' | 'parsed' | 'error';
  parsedDoc?: ParsedDocument;
  error?: string;
}

type UploadStatus = 'idle' | 'uploading' | 'parsing' | 'extracting' | 'complete' | 'error';

// ============================================
// CONSTANTS
// ============================================

const ACCEPTED_TYPES = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'application/vnd.ms-excel': ['.xls'],
  'text/csv': ['.csv'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/msword': ['.doc'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
};

const ACCEPTED_EXTENSIONS = ['.pdf', '.xlsx', '.xls', '.csv', '.docx', '.doc', '.jpg', '.jpeg', '.png'];

const FILE_TYPE_ICONS: Record<string, React.FC<{ className?: string }>> = {
  pdf: FileText,
  xlsx: FileSpreadsheet,
  xls: FileSpreadsheet,
  csv: FileSpreadsheet,
  docx: FileText,
  doc: FileText,
  jpg: File,
  jpeg: File,
  png: File,
  default: File,
};

// ============================================
// COMPONENT
// ============================================

export function DocumentUploadZone({
  onExtractionComplete,
  onError,
  maxFiles = 5,
  maxFileSizeMB = 10,
  className = '',
}: DocumentUploadZoneProps) {
  // State
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [isDragOver, setIsDragOver] = useState(false);
  const [extractionResult, setExtractionResult] = useState<ExtractedSpecsData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // ============================================
  // HANDLERS
  // ============================================
  
  const validateFile = useCallback((file: File): string | null => {
    // Check file size
    if (file.size > maxFileSizeMB * 1024 * 1024) {
      return `File too large. Maximum size is ${maxFileSizeMB}MB.`;
    }
    
    // Check file type
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ACCEPTED_EXTENSIONS.includes(ext)) {
      return `Unsupported file type. Accepted: ${ACCEPTED_EXTENSIONS.join(', ')}`;
    }
    
    return null;
  }, [maxFileSizeMB]);
  
  const addFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    
    // Check max files limit
    if (uploadedFiles.length + fileArray.length > maxFiles) {
      setErrorMessage(`Maximum ${maxFiles} files allowed.`);
      return;
    }
    
    // Validate and add files
    const newFiles: UploadedFile[] = [];
    
    for (const file of fileArray) {
      const error = validateFile(file);
      
      newFiles.push({
        id: `${file.name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        status: error ? 'error' : 'pending',
        error: error || undefined,
      });
    }
    
    setUploadedFiles(prev => [...prev, ...newFiles]);
    setErrorMessage('');
    
    // Auto-process if all files are valid
    const validFiles = newFiles.filter(f => f.status === 'pending');
    if (validFiles.length > 0) {
      await processFiles([...uploadedFiles, ...newFiles]);
    }
  }, [uploadedFiles, maxFiles, validateFile]);
  
  const processFiles = useCallback(async (files: UploadedFile[]) => {
    const pendingFiles = files.filter(f => f.status === 'pending');
    if (pendingFiles.length === 0) return;
    
    setStatus('parsing');
    
    // Update status to parsing
    setUploadedFiles(prev => 
      prev.map(f => 
        pendingFiles.find(p => p.id === f.id) 
          ? { ...f, status: 'parsing' as const }
          : f
      )
    );
    
    try {
      // Parse documents
      const parsedDocs = await parseDocuments(pendingFiles.map(f => f.file));
      
      // Update files with parsed results
      setUploadedFiles(prev => 
        prev.map((f, idx) => {
          const pendingIdx = pendingFiles.findIndex(p => p.id === f.id);
          if (pendingIdx === -1) return f;
          
          const parsedDoc = parsedDocs[pendingIdx];
          return {
            ...f,
            status: parsedDoc.status === 'failed' ? 'error' : 'parsed',
            parsedDoc,
            error: parsedDoc.errorMessage,
          };
        })
      );
      
      // Run AI extraction on all successfully parsed docs
      const allParsedDocs = files
        .map((f, idx) => pendingFiles.findIndex(p => p.id === f.id) !== -1 ? parsedDocs[pendingFiles.findIndex(p => p.id === f.id)] : f.parsedDoc)
        .filter((d): d is ParsedDocument => d !== undefined && d.status !== 'failed');
      
      if (allParsedDocs.length > 0) {
        setStatus('extracting');
        
        const extracted = await extractSpecsFromDocuments(allParsedDocs);
        setExtractionResult(extracted);
        
        // Notify parent
        onExtractionComplete(extracted, allParsedDocs);
        setStatus('complete');
      } else {
        setStatus('error');
        setErrorMessage('No documents could be processed successfully.');
        onError?.('No documents could be processed successfully.');
      }
      
    } catch (error) {
      setStatus('error');
      const message = error instanceof Error ? error.message : 'Processing failed';
      setErrorMessage(message);
      onError?.(message);
    }
  }, [onExtractionComplete, onError]);
  
  const removeFile = useCallback((id: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
    if (uploadedFiles.length <= 1) {
      setExtractionResult(null);
      setStatus('idle');
    }
  }, [uploadedFiles.length]);
  
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  }, [addFiles]);
  
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);
  
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);
  
  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);
  
  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files);
      e.target.value = ''; // Reset input
    }
  }, [addFiles]);
  
  const clearAll = useCallback(() => {
    setUploadedFiles([]);
    setExtractionResult(null);
    setStatus('idle');
    setErrorMessage('');
  }, []);
  
  // ============================================
  // RENDER HELPERS
  // ============================================
  
  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase() || 'default';
    const Icon = FILE_TYPE_ICONS[ext] || FILE_TYPE_ICONS.default;
    return Icon;
  };
  
  const getStatusIcon = (fileStatus: UploadedFile['status']) => {
    switch (fileStatus) {
      case 'parsing':
        return <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />;
      case 'parsed':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      default:
        return null;
    }
  };
  
  // ============================================
  // RENDER
  // ============================================
  
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Drop Zone */}
      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
          transition-all duration-200
          ${isDragOver 
            ? 'border-purple-400 bg-purple-500/10' 
            : 'border-gray-600 hover:border-purple-400 hover:bg-purple-500/5'
          }
          ${status === 'extracting' ? 'pointer-events-none' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ACCEPTED_EXTENSIONS.join(',')}
          onChange={handleFileInput}
          className="hidden"
        />
        
        {status === 'extracting' ? (
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="w-8 h-8 text-purple-400 animate-pulse" />
              <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
            </div>
            <p className="text-purple-300 font-medium">AI is analyzing your documents...</p>
            <p className="text-gray-500 text-sm">Extracting power requirements, rates, and facility data</p>
          </div>
        ) : status === 'parsing' ? (
          <div className="space-y-3">
            <Loader2 className="w-10 h-10 text-blue-400 mx-auto animate-spin" />
            <p className="text-blue-300 font-medium">Processing files...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* AI-Powered Badge */}
            <div className="flex justify-center mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-500/20 border border-purple-400/30 rounded-full text-xs text-purple-300 font-medium">
                <Sparkles className="w-3 h-3" />
                AI-Powered Extraction
              </span>
            </div>
            
            <Upload className={`w-10 h-10 mx-auto ${isDragOver ? 'text-purple-400' : 'text-gray-500'}`} />
            <div>
              <p className="text-gray-300 font-medium">
                {isDragOver ? 'Drop files here' : 'Drag & drop files here'}
              </p>
              <p className="text-gray-500 text-sm">or click to browse</p>
            </div>
            <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <FileText className="w-3 h-3" /> PDF
              </span>
              <span className="flex items-center gap-1">
                <FileSpreadsheet className="w-3 h-3" /> Excel
              </span>
              <span className="flex items-center gap-1">
                <FileType className="w-3 h-3" /> CSV
              </span>
            </div>
            <p className="text-gray-600 text-xs">
              Max {maxFiles} files, {maxFileSizeMB}MB each
            </p>
          </div>
        )}
      </div>
      
      {/* Error Message */}
      {errorMessage && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-300">{errorMessage}</p>
        </div>
      )}
      
      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">{uploadedFiles.length} file(s) uploaded</p>
            <button
              onClick={clearAll}
              className="text-xs text-gray-500 hover:text-red-400 flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" /> Clear all
            </button>
          </div>
          
          <div className="space-y-2">
            {uploadedFiles.map(file => {
              const Icon = getFileIcon(file.file.name);
              
              return (
                <div
                  key={file.id}
                  className={`
                    flex items-center gap-3 p-3 rounded-lg border
                    ${file.status === 'error' 
                      ? 'bg-red-500/10 border-red-500/30' 
                      : 'bg-gray-800/50 border-gray-700'
                    }
                  `}
                >
                  <Icon className={`w-5 h-5 ${file.status === 'error' ? 'text-red-400' : 'text-gray-400'}`} />
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-300 truncate">{file.file.name}</p>
                    <p className="text-xs text-gray-500">
                      {(file.file.size / 1024).toFixed(1)} KB
                      {file.parsedDoc?.metadata.documentType && (
                        <span className="ml-2 text-purple-400">
                          • {file.parsedDoc.metadata.documentType.replace('-', ' ')}
                        </span>
                      )}
                    </p>
                    {file.error && (
                      <p className="text-xs text-red-400 mt-1">{file.error}</p>
                    )}
                  </div>
                  
                  {getStatusIcon(file.status)}
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(file.id);
                    }}
                    className="p-1 hover:bg-gray-700 rounded"
                  >
                    <X className="w-4 h-4 text-gray-500 hover:text-red-400" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Extraction Results Summary */}
      {extractionResult && status === 'complete' && (
        <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <p className="text-green-300 font-medium">Data Extracted Successfully</p>
            <span className="ml-auto text-xs text-gray-500">
              {extractionResult.confidence}% confidence
            </span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            {extractionResult.powerRequirements?.peakDemandKW && (
              <div className="bg-gray-800/50 rounded-lg p-2">
                <p className="text-xs text-gray-500">Peak Demand</p>
                <p className="text-gray-200 font-medium">
                  {extractionResult.powerRequirements.peakDemandKW.toLocaleString()} kW
                </p>
              </div>
            )}
            {extractionResult.powerRequirements?.monthlyKWh && (
              <div className="bg-gray-800/50 rounded-lg p-2">
                <p className="text-xs text-gray-500">Monthly Usage</p>
                <p className="text-gray-200 font-medium">
                  {extractionResult.powerRequirements.monthlyKWh.toLocaleString()} kWh
                </p>
              </div>
            )}
            {extractionResult.utilityInfo?.electricityRate && (
              <div className="bg-gray-800/50 rounded-lg p-2">
                <p className="text-xs text-gray-500">Electricity Rate</p>
                <p className="text-gray-200 font-medium">
                  ${extractionResult.utilityInfo.electricityRate.toFixed(4)}/kWh
                </p>
              </div>
            )}
            {extractionResult.location?.state && (
              <div className="bg-gray-800/50 rounded-lg p-2">
                <p className="text-xs text-gray-500">Location</p>
                <p className="text-gray-200 font-medium">
                  {extractionResult.location.state}
                </p>
              </div>
            )}
          </div>
          
          {extractionResult.rawInsights && (
            <p className="text-xs text-gray-500 mt-3 italic">
              {extractionResult.rawInsights}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default DocumentUploadZone;
