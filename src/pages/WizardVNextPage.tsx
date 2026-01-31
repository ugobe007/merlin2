import React, { useMemo, useState } from "react";
import WizardShellVNext from "@/wizard/vnext/WizardShellVNext";

export default function WizardVNextPage() {
  const [zip, setZip] = useState("");
  const zipOk = useMemo(() => /^\d{5}$/.test(zip.trim()), [zip]);

  return (
    <WizardShellVNext title="Merlin" subtitle="Bloomberg × Arc × HUD (vNext)">
      <div style={{ display: "grid", gap: 16 }}>
        <div style={{ display: "grid", gap: 10 }}>
          <div style={{ fontSize: 18, fontWeight: 900 }}>Enter your ZIP</div>
          <div className="merlin-muted" style={{ fontSize: 13 }}>
            Infer utility + solar. Then run SSOT contract pipeline.
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <input
              className="merlin-input"
              inputMode="numeric"
              placeholder="90210"
              value={zip}
              onChange={(e) => setZip(e.target.value)}
              style={{ maxWidth: 240 }}
            />
            <button className="merlin-btn merlin-btn-primary" disabled={!zipOk}>
              Identify site
            </button>
          </div>

          {!zipOk && zip.length > 0 && (
            <div style={{ color: "rgba(239,68,68,0.9)", fontSize: 12 }}>ZIP must be 5 digits.</div>
          )}
        </div>

        <div className="merlin-glass" style={{ padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <div style={{ fontWeight: 900 }}>Business Preview</div>
            <div className="merlin-mono merlin-muted" style={{ fontSize: 12 }}>
              confidence: {zipOk ? "0.72" : "—"}
            </div>
          </div>

          <div className="merlin-muted" style={{ marginTop: 6, fontSize: 13 }}>
            {zipOk
              ? "Detected: Car Wash (single bay/tunnel) · Utility: inferred · Solar: inferred"
              : "Waiting for ZIP…"}
          </div>

          <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
              <span className="merlin-muted">Peak Demand</span>
              <span className="merlin-mono">{zipOk ? "420 kW" : "—"}</span>
            </div>
            <div className="merlin-bar">
              <div style={{ width: zipOk ? "62%" : "0%" }} />
            </div>
          </div>
        </div>
      </div>
    </WizardShellVNext>
  );
}
