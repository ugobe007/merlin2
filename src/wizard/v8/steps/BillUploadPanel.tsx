/**
 * BillUploadPanel — Step 3 utility bill upload
 *
 * Lets a facility owner drop their utility bill (PDF, CSV, Excel) and have
 * Merlin extract real consumption data (peak kW, monthly kWh, $/kWh rate).
 * On success, calls onExtracted so the wizard can replace NREL benchmarks.
 */

import { useCallback, useRef, useState } from "react";
import { parseDocuments } from "@/services/documentParserService";
import {
  extractSpecsFromDocuments,
  type ExtractedSpecsData,
} from "@/services/openAIExtractionService";

// ── Types ─────────────────────────────────────────────────────────────────────

interface BillUploadPanelProps {
  onExtracted: (data: ExtractedSpecsData) => void;
  onCleared: () => void;
  uploadedData: ExtractedSpecsData | null;
}

type UploadStatus = "idle" | "parsing" | "extracting" | "done" | "error";

// ── Component ─────────────────────────────────────────────────────────────────

export function BillUploadPanel({ onExtracted, onCleared, uploadedData }: BillUploadPanelProps) {
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const fileArray = Array.from(files);

      setStatus("parsing");
      setErrorMsg(null);

      try {
        const parsed = await parseDocuments(fileArray);
        setStatus("extracting");

        const extracted = await extractSpecsFromDocuments(parsed, {
          documentTypes: ["utility-bill"],
        });

        setStatus("done");
        onExtracted(extracted);
      } catch (err) {
        setStatus("error");
        setErrorMsg(err instanceof Error ? err.message : "Could not read this file.");
      }
    },
    [onExtracted]
  );

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      void handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      void handleFiles(e.target.files);
    },
    [handleFiles]
  );

  // ── If bill already uploaded, show extracted summary ──────────────────────
  if (uploadedData) {
    const peak = uploadedData.powerRequirements?.peakDemandKW;
    const monthly = uploadedData.powerRequirements?.monthlyKWh;
    const rate = uploadedData.utilityInfo?.electricityRate;
    const provider = uploadedData.utilityInfo?.utilityProvider;
    const confidence = uploadedData.confidence ?? 0;

    return (
      <div
        style={{
          background: "linear-gradient(135deg, rgba(0,210,100,0.08), rgba(0,150,70,0.05))",
          border: "1.5px solid rgba(0,210,100,0.4)",
          borderRadius: 12,
          padding: "16px 20px",
          marginBottom: 24,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 18 }}>📄</span>
            <span
              style={{
                color: "#00d264",
                fontWeight: 700,
                fontSize: 14,
                letterSpacing: "0.02em",
              }}
            >
              Built from your actual bill
            </span>
            <span
              style={{
                background: "rgba(0,210,100,0.15)",
                color: "#00d264",
                fontSize: 11,
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: 20,
                letterSpacing: "0.05em",
              }}
            >
              {confidence}% confidence
            </span>
          </div>
          <button
            onClick={onCleared}
            style={{
              background: "none",
              border: "none",
              color: "rgba(255,255,255,0.4)",
              fontSize: 12,
              cursor: "pointer",
              padding: "4px 8px",
              borderRadius: 6,
              transition: "color 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.8)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}
          >
            Remove ✕
          </button>
        </div>

        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          {peak != null && (
            <BillStat label="Peak Demand" value={`${peak.toLocaleString()} kW`} note="from bill" />
          )}
          {monthly != null && (
            <BillStat
              label="Monthly Usage"
              value={`${Math.round(monthly).toLocaleString()} kWh`}
              note="from bill"
            />
          )}
          {rate != null && (
            <BillStat label="Electricity Rate" value={`$${rate.toFixed(3)}/kWh`} note="from bill" />
          )}
          {provider && <BillStat label="Utility" value={provider} note="from bill" />}
        </div>
      </div>
    );
  }

  // ── Drop zone ─────────────────────────────────────────────────────────────
  const isLoading = status === "parsing" || status === "extracting";
  const loadingLabel = status === "parsing" ? "Reading file…" : "Extracting data…";

  return (
    <div style={{ marginBottom: 24 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 10,
        }}
      >
        <span
          style={{
            color: "rgba(255,255,255,0.5)",
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          Optional — Upload Your Utility Bill
        </span>
        <span
          style={{
            background: "rgba(0,210,100,0.12)",
            color: "#00d264",
            fontSize: 11,
            fontWeight: 600,
            padding: "2px 8px",
            borderRadius: 20,
          }}
        >
          More accurate quote
        </span>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => !isLoading && fileInputRef.current?.click()}
        style={{
          border: `1.5px dashed ${isDragging ? "rgba(0,210,100,0.7)" : "rgba(255,255,255,0.15)"}`,
          borderRadius: 12,
          padding: "20px 24px",
          display: "flex",
          alignItems: "center",
          gap: 16,
          cursor: isLoading ? "default" : "pointer",
          background: isDragging ? "rgba(0,210,100,0.06)" : "rgba(255,255,255,0.02)",
          transition: "all 0.2s",
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.csv,.xlsx,.xls"
          multiple={false}
          onChange={onFileChange}
          style={{ display: "none" }}
        />

        {isLoading ? (
          <>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                border: "2px solid rgba(0,210,100,0.3)",
                borderTopColor: "#00d264",
                animation: "spin 0.8s linear infinite",
                flexShrink: 0,
              }}
            />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <div>
              <div style={{ color: "#00d264", fontWeight: 600, fontSize: 14 }}>{loadingLabel}</div>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 2 }}>
                This only takes a few seconds
              </div>
            </div>
          </>
        ) : (
          <>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: "rgba(0,210,100,0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                flexShrink: 0,
              }}
            >
              📋
            </div>
            <div>
              <div
                style={{
                  color: "rgba(255,255,255,0.85)",
                  fontWeight: 600,
                  fontSize: 14,
                  marginBottom: 2,
                }}
              >
                Drop your utility bill here, or click to browse
              </div>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>
                PDF, CSV, or Excel · Your bill stays on your device, never stored
              </div>
            </div>
          </>
        )}
      </div>

      {status === "error" && errorMsg && (
        <div
          style={{
            marginTop: 8,
            padding: "8px 14px",
            background: "rgba(255,60,60,0.08)",
            border: "1px solid rgba(255,60,60,0.25)",
            borderRadius: 8,
            color: "#ff6b6b",
            fontSize: 13,
          }}
        >
          ⚠ {errorMsg}
        </div>
      )}

      <div style={{ marginTop: 8, color: "rgba(255,255,255,0.3)", fontSize: 11 }}>
        Skip this if you don't have it handy — the wizard works without it.
      </div>
    </div>
  );
}

// ── Helper ────────────────────────────────────────────────────────────────────

function BillStat({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div>
      <div
        style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 600, marginBottom: 2 }}
      >
        {label}
      </div>
      <div style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>{value}</div>
      <div style={{ color: "rgba(0,210,100,0.6)", fontSize: 11 }}>{note}</div>
    </div>
  );
}
