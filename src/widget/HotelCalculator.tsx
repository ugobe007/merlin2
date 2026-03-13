/**
 * Merlin Widget - Hotel Calculator Component
 *
 * Standalone hotel savings calculator for embedding on partner sites.
 * Minimal UI, fast loading, calls widget API for calculations.
 */

import React, { useState } from "react";

// ============================================================================
// Types
// ============================================================================

interface HotelCalculatorProps {
  apiKey: string;
  theme: "light" | "dark";
  primaryColor: string;
  logo?: string;
  hideAttribution: boolean;
  onQuoteGenerated?: (quote: QuoteResult) => void;
  onError?: (error: { message: string }) => void;
}

interface QuoteResult {
  bessKWh: number;
  solarKW: number;
  annualSavings: number;
  paybackYears: number;
  totalCost: number;
  afterITC: number;
  npv25Year: number;
}

// ============================================================================
// Hotel Calculator Component
// ============================================================================

export function HotelCalculator(props: HotelCalculatorProps) {
  const { apiKey, theme, primaryColor, logo, hideAttribution, onQuoteGenerated, onError } = props;

  // Form state
  const [rooms, setRooms] = useState<number>(150);
  const [hotelClass, setHotelClass] = useState<string>("midscale");
  const [state, setState] = useState<string>("CA");

  // UI state
  const [loading, setLoading] = useState(false);
  const [quote, setQuote] = useState<QuoteResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Theme colors
  const isDark = theme === "dark";
  const bgColor = isDark ? "#0a0f1e" : "#ffffff";
  const textColor = isDark ? "#e2e8f0" : "#1e293b";
  const borderColor = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)";

  /**
   * Calculate savings
   */
  const calculateSavings = async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      // Call widget API
      const response = await fetch("https://api.merlin.energy/v1/widget/quote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          industry: "hotel",
          location: { state },
          facility: {
            rooms,
            hotelClass,
          },
          options: {
            includeSolar: true,
            includeGenerator: false,
          },
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error?.message || "Quote generation failed");
      }

      // Extract quote data
      const quoteData: QuoteResult = {
        bessKWh: data.quote.bessKWh,
        solarKW: data.quote.solarKW || 0,
        annualSavings: data.quote.savings.annual,
        paybackYears: data.quote.financials.paybackYears,
        totalCost: data.quote.costs.total,
        afterITC: data.quote.costs.afterITC,
        npv25Year: data.quote.financials.npv25Year,
      };

      setQuote(quoteData);

      // Notify parent window
      if (onQuoteGenerated) {
        onQuoteGenerated(data.quote);
      }

      // Post message to parent (for iframe communication)
      window.parent.postMessage(
        {
          type: "quote_generated",
          data: data.quote,
        },
        "*"
      );

      // Auto-resize iframe
      resizeIframe();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      setError(errorMsg);

      if (onError) {
        onError({ message: errorMsg });
      }

      window.parent.postMessage(
        {
          type: "error",
          data: { message: errorMsg },
        },
        "*"
      );
    } finally {
      setLoading(false);
    }
  };

  /**
   * Resize iframe to fit content
   */
  const resizeIframe = () => {
    const height = document.body.scrollHeight;
    window.parent.postMessage(
      {
        type: "resize",
        height,
      },
      "*"
    );
  };

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div
      style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        backgroundColor: bgColor,
        color: textColor,
        padding: "32px",
        borderRadius: "12px",
        maxWidth: "500px",
        margin: "0 auto",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: "24px", textAlign: "center" }}>
        {logo && <img src={logo} alt="Logo" style={{ height: "32px", marginBottom: "12px" }} />}
        <h2 style={{ fontSize: "24px", fontWeight: "700", margin: "0 0 8px 0" }}>
          How much could your hotel save?
        </h2>
        {!hideAttribution && (
          <p style={{ fontSize: "14px", color: isDark ? "#94a3b8" : "#64748b", margin: 0 }}>
            Powered by{" "}
            <a href="https://merlin2.fly.dev" target="_blank" style={{ color: primaryColor }}>
              Merlin TrueQuote™
            </a>
          </p>
        )}
      </div>

      {/* Form */}
      {!quote && (
        <div>
          {/* Number of Rooms */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", fontWeight: "600", marginBottom: "8px" }}>
              Number of Rooms
            </label>
            <input
              type="number"
              value={rooms}
              onChange={(e) => setRooms(Number(e.target.value))}
              style={{
                width: "100%",
                padding: "12px 16px",
                fontSize: "16px",
                border: `2px solid ${borderColor}`,
                borderRadius: "8px",
                backgroundColor: isDark ? "#1e293b" : "#ffffff",
                color: textColor,
                boxSizing: "border-box",
              }}
              min={1}
              max={1000}
            />
          </div>

          {/* Hotel Class */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", fontWeight: "600", marginBottom: "8px" }}>
              Hotel Class
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px" }}>
              {["economy", "midscale", "upscale", "luxury"].map((cls) => (
                <button
                  key={cls}
                  onClick={() => setHotelClass(cls)}
                  style={{
                    padding: "12px",
                    fontSize: "14px",
                    fontWeight: "600",
                    border: `2px solid ${hotelClass === cls ? primaryColor : borderColor}`,
                    borderRadius: "8px",
                    backgroundColor:
                      hotelClass === cls ? `${primaryColor}15` : isDark ? "#1e293b" : "#ffffff",
                    color: hotelClass === cls ? primaryColor : textColor,
                    cursor: "pointer",
                    textTransform: "capitalize",
                    transition: "all 0.2s ease",
                  }}
                >
                  {cls}
                </button>
              ))}
            </div>
          </div>

          {/* State */}
          <div style={{ marginBottom: "24px" }}>
            <label style={{ display: "block", fontWeight: "600", marginBottom: "8px" }}>
              State
            </label>
            <select
              value={state}
              onChange={(e) => setState(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 16px",
                fontSize: "16px",
                border: `2px solid ${borderColor}`,
                borderRadius: "8px",
                backgroundColor: isDark ? "#1e293b" : "#ffffff",
                color: textColor,
                boxSizing: "border-box",
              }}
            >
              <option value="CA">California</option>
              <option value="NY">New York</option>
              <option value="TX">Texas</option>
              <option value="FL">Florida</option>
              <option value="IL">Illinois</option>
              {/* Add more states */}
            </select>
          </div>

          {/* Calculate Button */}
          <button
            onClick={calculateSavings}
            disabled={loading}
            style={{
              width: "100%",
              padding: "16px",
              fontSize: "18px",
              fontWeight: "700",
              color: "#ffffff",
              backgroundColor: primaryColor,
              border: "none",
              borderRadius: "8px",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1,
              transition: "all 0.2s ease",
            }}
          >
            {loading ? "Calculating..." : "Calculate Savings"}
          </button>

          {/* Error */}
          {error && (
            <div
              style={{
                marginTop: "16px",
                padding: "12px",
                backgroundColor: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: "8px",
                color: "#991b1b",
                fontSize: "14px",
              }}
            >
              {error}
            </div>
          )}
        </div>
      )}

      {/* Results */}
      {quote && (
        <div>
          <div
            style={{
              backgroundColor: `${primaryColor}10`,
              border: `2px solid ${primaryColor}`,
              borderRadius: "12px",
              padding: "24px",
              marginBottom: "20px",
            }}
          >
            <div style={{ textAlign: "center", marginBottom: "16px" }}>
              <div
                style={{
                  fontSize: "14px",
                  color: isDark ? "#94a3b8" : "#64748b",
                  marginBottom: "4px",
                }}
              >
                Your {rooms}-room hotel could save:
              </div>
              <div style={{ fontSize: "36px", fontWeight: "800", color: primaryColor }}>
                ${quote.annualSavings.toLocaleString()}/year
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: "12px",
                marginBottom: "16px",
              }}
            >
              <div>
                <div style={{ fontSize: "12px", color: isDark ? "#94a3b8" : "#64748b" }}>
                  Payback
                </div>
                <div style={{ fontSize: "20px", fontWeight: "700" }}>
                  {quote.paybackYears.toFixed(1)} years
                </div>
              </div>
              <div>
                <div style={{ fontSize: "12px", color: isDark ? "#94a3b8" : "#64748b" }}>
                  25-Year Savings
                </div>
                <div style={{ fontSize: "20px", fontWeight: "700" }}>
                  ${(quote.npv25Year / 1000000).toFixed(1)}M
                </div>
              </div>
            </div>

            <div
              style={{
                borderTop: `1px solid ${borderColor}`,
                paddingTop: "12px",
                fontSize: "14px",
              }}
            >
              <div
                style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}
              >
                <span>🔋 Battery:</span>
                <span style={{ fontWeight: "600" }}>{quote.bessKWh.toLocaleString()} kWh</span>
              </div>
              <div
                style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}
              >
                <span>☀️ Solar:</span>
                <span style={{ fontWeight: "600" }}>{quote.solarKW} kW</span>
              </div>
              <div
                style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}
              >
                <span>Total Investment:</span>
                <span style={{ fontWeight: "600" }}>${quote.totalCost.toLocaleString()}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>After Tax Credits:</span>
                <span style={{ fontWeight: "700", color: primaryColor }}>
                  ${quote.afterITC.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Reset Button */}
          <button
            onClick={() => setQuote(null)}
            style={{
              width: "100%",
              padding: "12px",
              fontSize: "16px",
              fontWeight: "600",
              color: primaryColor,
              backgroundColor: "transparent",
              border: `2px solid ${primaryColor}`,
              borderRadius: "8px",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            Calculate Again
          </button>

          {/* Trust Badges */}
          <div
            style={{
              marginTop: "16px",
              padding: "12px",
              backgroundColor: isDark ? "#1e293b" : "#f8fafc",
              borderRadius: "8px",
              fontSize: "12px",
              textAlign: "center",
            }}
          >
            ✓ NREL-verified pricing
            <br />
            ✓ IRA 2022 tax credits included
            <br />✓ Bankable financial model
          </div>
        </div>
      )}
    </div>
  );
}
