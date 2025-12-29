/**
 * SPEC UPLOAD MODAL
 * =================
 * 
 * Professional document upload interface for Path A:
 * Upload specs → Extract data → Review → Generate Quote
 * 
 * Features:
 * - Drag & drop file upload
 * - PDF, Excel, CSV, Text support
 * - AI-powered spec extraction
 * - Editable extracted values
 * - Confidence indicators
 * - Direct flow to quote generation
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  X,
  Upload,
  FileText,
  FileSpreadsheet,
  File,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Sparkles,
  ArrowRight,
  Edit3,
  Zap,
  MapPin,
  Battery,
  Sun,
  Wind,
  Building2,
  DollarSign,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { parseDocument, type ParsedDocument } from '@/services/documentParsingService';
import { extractSpecsFromText, specsToQuoteInput, type ExtractedSpecs, type ExtractionResult } from '@/services/specExtractionService';

interface SpecUploadModalProps {
  onClose: () => void;
  onExtracted: (specs: ReturnType<typeof specsToQuoteInput>) => void;
}

type UploadState = 'idle' | 'uploading' | 'parsing' | 'extracting' | 'review' | 'error';

const SpecUploadModal: React.FC<SpecUploadModalProps> = ({ onClose, onExtracted }) => {
  const [state, setState] = useState<UploadState>('idle');
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parsedDoc, setParsedDoc] = useState<ParsedDocument | null>(null);
  const [extraction, setExtraction] = useState<ExtractionResult | null>(null);
  const [editedSpecs, setEditedSpecs] = useState<ExtractedSpecs | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const processFile = async (uploadedFile: File) => {
    setFile(uploadedFile);
    setError(null);
    
    try {
      // Step 1: Parse document
      setState('parsing');
      const parsed = await parseDocument(uploadedFile);
      setParsedDoc(parsed);
      
      if (parsed.error) {
        throw new Error(parsed.error);
      }
      
      if (!parsed.textContent || parsed.textContent.trim().length < 10) {
        throw new Error('No readable text found in document');
      }
      
      // Step 2: Extract specs
      setState('extracting');
      const result = await extractSpecsFromText(parsed.textContent);
      setExtraction(result);
      setEditedSpecs(result.specs);
      
      // Step 3: Move to review
      setState('review');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process document');
      setState('error');
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const handleGenerateQuote = () => {
    if (editedSpecs) {
      const quoteInput = specsToQuoteInput(editedSpecs);
      onExtracted(quoteInput);
      onClose();
    }
  };

  const handleReset = () => {
    setState('idle');
    setFile(null);
    setParsedDoc(null);
    setExtraction(null);
    setEditedSpecs(null);
    setError(null);
  };

  const updateSpec = (field: keyof ExtractedSpecs, value: any) => {
    if (editedSpecs) {
      setEditedSpecs({ ...editedSpecs, [field]: value });
    }
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'pdf':
        return <FileText className="w-8 h-8 text-red-500" />;
      case 'excel':
        return <FileSpreadsheet className="w-8 h-8 text-green-500" />;
      case 'csv':
        return <FileSpreadsheet className="w-8 h-8 text-blue-500" />;
      default:
        return <File className="w-8 h-8 text-gray-500" />;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600 bg-green-100';
    if (confidence >= 50) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 text-white p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Upload className="w-6 h-6" />
                Upload Project Specs
              </h2>
              <p className="text-purple-100 mt-1">
                Upload your RFP, spec sheet, or requirements document
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          {/* Progress Steps */}
          <div className="flex items-center gap-2 mt-4 text-sm">
            <div className={`flex items-center gap-1 px-3 py-1 rounded-full ${
              state === 'idle' ? 'bg-white/30' : 'bg-white/10'
            }`}>
              <span className="w-5 h-5 flex items-center justify-center bg-white/30 rounded-full text-xs">1</span>
              Upload
            </div>
            <ArrowRight className="w-4 h-4 opacity-50" />
            <div className={`flex items-center gap-1 px-3 py-1 rounded-full ${
              ['parsing', 'extracting'].includes(state) ? 'bg-white/30' : 'bg-white/10'
            }`}>
              <span className="w-5 h-5 flex items-center justify-center bg-white/30 rounded-full text-xs">2</span>
              Extract
            </div>
            <ArrowRight className="w-4 h-4 opacity-50" />
            <div className={`flex items-center gap-1 px-3 py-1 rounded-full ${
              state === 'review' ? 'bg-white/30' : 'bg-white/10'
            }`}>
              <span className="w-5 h-5 flex items-center justify-center bg-white/30 rounded-full text-xs">3</span>
              Review
            </div>
            <ArrowRight className="w-4 h-4 opacity-50" />
            <div className={`flex items-center gap-1 px-3 py-1 rounded-full bg-white/10`}>
              <span className="w-5 h-5 flex items-center justify-center bg-white/30 rounded-full text-xs">4</span>
              Quote
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          
          {/* Upload State */}
          {state === 'idle' && (
            <div
              className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${
                dragActive
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-300 hover:border-purple-400 hover:bg-gray-50'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.xlsx,.xls,.csv,.txt"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              <Upload className={`w-16 h-16 mx-auto mb-4 ${
                dragActive ? 'text-purple-500' : 'text-gray-400'
              }`} />
              
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Drag & drop your document
              </h3>
              <p className="text-gray-600 mb-4">
                or click to browse
              </p>
              
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                Select File
              </button>
              
              <div className="mt-6 flex items-center justify-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <FileText className="w-4 h-4 text-red-500" /> PDF
                </span>
                <span className="flex items-center gap-1">
                  <FileSpreadsheet className="w-4 h-4 text-green-500" /> Excel
                </span>
                <span className="flex items-center gap-1">
                  <FileSpreadsheet className="w-4 h-4 text-blue-500" /> CSV
                </span>
                <span className="flex items-center gap-1">
                  <FileText className="w-4 h-4 text-gray-500" /> Text
                </span>
              </div>
            </div>
          )}

          {/* Processing States */}
          {['parsing', 'extracting'].includes(state) && (
            <div className="text-center py-12">
              <Loader2 className="w-16 h-16 mx-auto mb-4 text-purple-600 animate-spin" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                {state === 'parsing' ? 'Reading Document...' : 'Extracting Specifications...'}
              </h3>
              <p className="text-gray-600">
                {state === 'parsing' 
                  ? `Processing ${file?.name}`
                  : 'AI is analyzing your document for BESS specifications'}
              </p>
              {state === 'extracting' && (
                <div className="flex items-center justify-center gap-2 mt-4 text-purple-600">
                  <Sparkles className="w-5 h-5" />
                  <span className="text-sm">Powered by AI</span>
                </div>
              )}
            </div>
          )}

          {/* Error State */}
          {state === 'error' && (
            <div className="text-center py-12">
              <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-red-500" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Processing Error
              </h3>
              <p className="text-red-600 mb-6">{error}</p>
              <button
                onClick={handleReset}
                className="bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors flex items-center gap-2 mx-auto"
              >
                <RefreshCw className="w-5 h-5" />
                Try Another File
              </button>
            </div>
          )}

          {/* Review State */}
          {state === 'review' && editedSpecs && extraction && (
            <div className="space-y-6">
              {/* File Info */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                {parsedDoc && getFileIcon(parsedDoc.fileType)}
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-800">{file?.name}</h4>
                  <p className="text-sm text-gray-500">
                    {parsedDoc?.pageCount && `${parsedDoc.pageCount} pages • `}
                    Parsed in {parsedDoc?.parseTime.toFixed(0)}ms
                  </p>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${getConfidenceColor(editedSpecs.confidence)}`}>
                  {editedSpecs.confidence}% confidence
                </div>
              </div>

              {/* Summary */}
              <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-200">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-purple-600 mt-1" />
                  <div>
                    <h4 className="font-semibold text-purple-800">AI Summary</h4>
                    <p className="text-purple-700">{extraction.summary}</p>
                  </div>
                </div>
              </div>

              {/* Warnings */}
              {extraction.warnings.length > 0 && (
                <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                  <h4 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Warnings
                  </h4>
                  <ul className="list-disc list-inside text-yellow-700 text-sm space-y-1">
                    {extraction.warnings.map((w, i) => <li key={i}>{w}</li>)}
                  </ul>
                </div>
              )}

              {/* Editable Specs Grid */}
              <div className="grid md:grid-cols-2 gap-4">
                {/* Power */}
                <div className="p-4 border rounded-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="w-5 h-5 text-yellow-600" />
                    <h4 className="font-semibold">Power & Energy</h4>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-gray-600">Power (MW)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={editedSpecs.storageSizeMW || ''}
                        onChange={(e) => updateSpec('storageSizeMW', parseFloat(e.target.value) || undefined)}
                        className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        placeholder="e.g., 2.0"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Duration (hours)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={editedSpecs.durationHours || ''}
                        onChange={(e) => updateSpec('durationHours', parseFloat(e.target.value) || undefined)}
                        className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        placeholder="e.g., 4"
                      />
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div className="p-4 border rounded-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="w-5 h-5 text-red-600" />
                    <h4 className="font-semibold">Location</h4>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-gray-600">State</label>
                      <input
                        type="text"
                        value={editedSpecs.state || ''}
                        onChange={(e) => updateSpec('state', e.target.value.toUpperCase().slice(0, 2))}
                        className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        placeholder="e.g., CA"
                        maxLength={2}
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">ZIP Code</label>
                      <input
                        type="text"
                        value={editedSpecs.zipCode || ''}
                        onChange={(e) => updateSpec('zipCode', e.target.value)}
                        className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        placeholder="e.g., 90210"
                      />
                    </div>
                  </div>
                </div>

                {/* Industry */}
                <div className="p-4 border rounded-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <Building2 className="w-5 h-5 text-blue-600" />
                    <h4 className="font-semibold">Industry</h4>
                  </div>
                  <select
                    value={editedSpecs.industry || ''}
                    onChange={(e) => updateSpec('industry', e.target.value || undefined)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="">Select industry...</option>
                    <option value="hotel">Hotel / Hospitality</option>
                    <option value="hospital">Hospital / Healthcare</option>
                    <option value="data-center">Data Center</option>
                    <option value="ev-charging">EV Charging</option>
                    <option value="manufacturing">Manufacturing</option>
                    <option value="warehouse">Warehouse / Logistics</option>
                    <option value="retail">Retail</option>
                    <option value="office">Office / Commercial</option>
                    <option value="residential">Residential</option>
                    <option value="microgrid">Microgrid</option>
                    <option value="car-wash">Car Wash</option>
                  </select>
                </div>

                {/* Renewables */}
                <div className="p-4 border rounded-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <Sun className="w-5 h-5 text-orange-500" />
                    <h4 className="font-semibold">Renewables</h4>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-gray-600">Solar (MW)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={editedSpecs.solarMW || ''}
                        onChange={(e) => updateSpec('solarMW', parseFloat(e.target.value) || undefined)}
                        className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Wind (MW)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={editedSpecs.windMW || ''}
                        onChange={(e) => updateSpec('windMW', parseFloat(e.target.value) || undefined)}
                        className="w-full mt-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Grid Connection */}
              <div className="p-4 border rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                  <Battery className="w-5 h-5 text-green-600" />
                  <h4 className="font-semibold">Grid Connection</h4>
                </div>
                <div className="flex gap-3">
                  {(['on-grid', 'limited', 'off-grid'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => updateSpec('gridConnection', type)}
                      className={`flex-1 px-4 py-2 rounded-lg border-2 transition-all ${
                        editedSpecs.gridConnection === type
                          ? 'border-purple-500 bg-purple-50 text-purple-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {type === 'on-grid' && 'Grid-Connected'}
                      {type === 'limited' && 'Limited Grid'}
                      {type === 'off-grid' && 'Off-Grid'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Suggestions */}
              {extraction.suggestions.length > 0 && (
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <h4 className="font-semibold text-blue-800 mb-2">💡 Suggestions</h4>
                  <ul className="list-disc list-inside text-blue-700 text-sm space-y-1">
                    {extraction.suggestions.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4 bg-gray-50 flex justify-between items-center">
          {state === 'review' ? (
            <>
              <button
                onClick={handleReset}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Upload Different File
              </button>
              <button
                onClick={handleGenerateQuote}
                disabled={!editedSpecs?.storageSizeMW}
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                Generate Quote
                <ArrowRight className="w-5 h-5" />
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className="ml-auto px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SpecUploadModal;
