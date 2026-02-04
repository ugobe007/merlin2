/**
 * WizardErrorBoundary.tsx
 * 
 * Catches runtime errors in V7 wizard to prevent blank screen.
 * Shows crash info instead of white screen of death.
 */
import React from "react";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

export default class WizardErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[WizardV7] Crash caught:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            background: "linear-gradient(160deg, #080b14 0%, #0f1420 40%, #0a0d16 100%)",
            color: "#e8ebf3",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 32,
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
          }}
        >
          <div
            style={{
              maxWidth: 600,
              padding: 32,
              borderRadius: 20,
              background: "rgba(239, 68, 68, 0.08)",
              border: "1px solid rgba(239, 68, 68, 0.25)",
              boxShadow: "0 8px 32px rgba(239, 68, 68, 0.15)",
            }}
          >
            <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 12, color: "#f87171" }}>
              ⚠️ Wizard Crashed
            </div>

            <div style={{ fontSize: 14, color: "rgba(232, 235, 243, 0.7)", marginBottom: 20, lineHeight: 1.6 }}>
              Something went wrong loading the wizard. This has been logged for review.
            </div>

            <div
              style={{
                padding: 16,
                borderRadius: 12,
                background: "rgba(0, 0, 0, 0.3)",
                fontSize: 12,
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                color: "rgba(232, 235, 243, 0.8)",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                maxHeight: 200,
                overflow: "auto",
              }}
            >
              {this.state.error?.message ?? "Unknown error"}
              {this.state.error?.stack && (
                <>
                  {"\n\n"}
                  {this.state.error.stack.split("\n").slice(0, 8).join("\n")}
                </>
              )}
            </div>

            <div style={{ marginTop: 20, display: "flex", gap: 12 }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: "12px 24px",
                  borderRadius: 12,
                  border: "none",
                  background: "linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)",
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                🔄 Reload Page
              </button>

              <button
                onClick={() => (window.location.href = "/")}
                style={{
                  padding: "12px 24px",
                  borderRadius: 12,
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  background: "rgba(255, 255, 255, 0.05)",
                  color: "rgba(232, 235, 243, 0.85)",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                ← Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
