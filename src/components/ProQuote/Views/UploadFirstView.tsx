import React from "react";
import { Clock } from "lucide-react";
import merlinImage from "@/assets/images/new_profile_merlin.png";
import { DocumentUploadZone } from "@/components/upload/DocumentUploadZone";
import type { ExtractedSpecsData } from "@/services/openAIExtractionService";
import type { ParsedDocument } from "@/services/documentParserService";

interface UploadFirstViewProps {
  onExtractionComplete: (data: ExtractedSpecsData, documents: ParsedDocument[]) => void;
  onNavigateToConfig: () => void;
  onNavigateToLanding: () => void;
}

/**
 * UPLOAD-FIRST VIEW - SMART UPLOAD™ DEDICATED PAGE
 *
 * Clean, focused upload experience for users who want to start with document extraction.
 * Extracted from AdvancedQuoteBuilder.tsx (Phase 1D, Feb 2026)
 */
export function UploadFirstView({
  onExtractionComplete,
  onNavigateToConfig,
  onNavigateToLanding,
}: UploadFirstViewProps) {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden"
      style={{ background: "#0f1117" }}
    >
      {/* Background gradient */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-3xl w-full relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <img src={merlinImage} alt="Merlin" className="w-12 h-12" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Smart Upload™
            </h1>
          </div>
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
            style={{
              background: "rgba(139, 92, 246, 0.1)",
              border: "1px solid rgba(139, 92, 246, 0.3)",
            }}
          >
            <Clock className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-medium text-purple-300">Saves 10+ minutes!</span>
          </div>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Upload utility bills, equipment schedules, or load profiles and let AI extract the data
            to pre-populate your quote.
          </p>
        </div>

        {/* Upload Zone */}
        <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/30 rounded-2xl p-8 backdrop-blur-xl border border-white/10 shadow-2xl mb-6">
          <DocumentUploadZone
            onExtractionComplete={onExtractionComplete}
            onError={(error) => {
              if (import.meta.env.DEV) {
                console.error("Upload error:", error);
              }
            }}
            maxFiles={5}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={onNavigateToConfig}
            className="px-6 py-3 rounded-xl text-gray-300 hover:text-white transition-colors border border-white/10 hover:border-white/20 font-medium"
          >
            Skip to Manual Configuration
          </button>
          <button
            onClick={onNavigateToLanding}
            className="px-6 py-3 rounded-xl text-gray-400 hover:text-gray-300 transition-colors font-medium"
          >
            Back to Options
          </button>
        </div>
      </div>
    </div>
  );
}
