import React from "react";

type Props = {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
};

export default function WizardShellVNext({
  title = "Merlin",
  subtitle = "Bloomberg × Arc × HUD",
  children,
}: Props) {
  return (
    <div style={{ minHeight: "100vh", padding: "28px 18px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gap: 16 }}>
        <div
          className="merlin-glass"
          style={{
            padding: "14px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <div style={{ fontWeight: 900, letterSpacing: 0.2 }}>🧙 {title}</div>
            <div className="merlin-muted" style={{ fontSize: 13 }}>
              {subtitle}
            </div>
          </div>
          <div className="merlin-mono merlin-muted" style={{ fontSize: 12 }}>
            ●●○
          </div>
        </div>

        <div className="merlin-glass" style={{ padding: 18 }}>
          {children}
        </div>
      </div>
    </div>
  );
}
