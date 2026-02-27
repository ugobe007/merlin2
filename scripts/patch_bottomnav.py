#!/usr/bin/env python3
"""Patch WizardShellV7 bottom nav with enhanced navigation buttons."""
import re

FILEPATH = "src/components/wizard/v7/shared/WizardShellV7.tsx"

with open(FILEPATH, "r") as f:
    content = f.read()

# Find the bottom nav block by start/end markers
start_marker = "        {/* BOTTOM NAV */}\n        <div\n          className=\"merlin-shell-bottomnav\""
end_marker = "        </div>\n      </div>\n    </>\n  );\n}"

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx == -1:
    print("ERROR: Could not find start marker")
    exit(1)
if end_idx == -1:
    print("ERROR: Could not find end marker")
    exit(1)

# Include the end marker in the replacement
end_idx_full = end_idx + len(end_marker)

NEW_NAV = """        {/* BOTTOM NAV */}
        <div
          className="merlin-shell-bottomnav"
          style={{
            padding: "0 28px 28px",
            maxWidth: 1400,
            margin: "0 auto",
            width: "100%",
          }}
        >
          {/* Separator */}
          <div style={{ height: 1, background: "rgba(255,255,255,0.05)", marginBottom: 20 }} />

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            {/* Back */}
            <button
              onClick={onBack}
              disabled={!canGoBack}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "11px 20px",
                borderRadius: 10,
                minHeight: 46,
                background: canGoBack ? "rgba(255, 255, 255, 0.04)" : "transparent",
                border: canGoBack ? "1px solid rgba(255, 255, 255, 0.09)" : "1px solid transparent",
                color: canGoBack ? "rgba(232, 235, 243, 0.65)" : "rgba(232, 235, 243, 0.18)",
                cursor: canGoBack ? "pointer" : "not-allowed",
                fontSize: 14,
                fontWeight: 500,
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                if (canGoBack) {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.07)";
                  e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.14)";
                  e.currentTarget.style.color = "rgba(232, 235, 243, 0.9)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = canGoBack ? "rgba(255, 255, 255, 0.04)" : "transparent";
                e.currentTarget.style.borderColor = canGoBack ? "rgba(255, 255, 255, 0.09)" : "transparent";
                e.currentTarget.style.color = canGoBack ? "rgba(232, 235, 243, 0.65)" : "rgba(232, 235, 243, 0.18)";
              }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
                <path d="M9 11.5L4.5 7L9 2.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Back
            </button>

            {/* Center: hint + step dot pills — hidden on mobile */}
            <div
              className="merlin-nexthint"
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}
            >
              {nextHint && (
                <div style={{ fontSize: 12, color: "rgba(232, 235, 243, 0.35)", letterSpacing: "0.01em" }}>
                  Next: {nextHint}
                </div>
              )}
              <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                {stepLabels.map((_, idx) => {
                  const isActive = idx === safeStep;
                  const isComplete = idx < safeStep;
                  return (
                    <div
                      key={idx}
                      style={{
                        width: isActive ? 20 : 6,
                        height: 6,
                        borderRadius: 3,
                        background: isComplete
                          ? "rgba(62, 207, 142, 0.5)"
                          : isActive
                          ? "#3ECF8E"
                          : "rgba(255, 255, 255, 0.12)",
                        transition: "all 0.25s ease",
                      }}
                    />
                  );
                })}
              </div>
            </div>

            {/* Next — solid fill for steps 4+ (high-intent CTA), outline for early steps */}
            {(() => {
              const isFilled = canGoNext && !isNextLoading && safeStep >= 3;
              const isActive = canGoNext && !isNextLoading;
              return (
                <button
                  onClick={onNext}
                  disabled={!canGoNext || isNextLoading}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "11px 22px",
                    borderRadius: 10,
                    minHeight: 46,
                    background: isFilled ? "#3ECF8E" : isActive ? "transparent" : "rgba(255,255,255,0.03)",
                    border: isFilled ? "2px solid #3ECF8E" : isActive ? "2px solid #3ECF8E" : "2px solid rgba(255, 255, 255, 0.08)",
                    color: isFilled ? "#0a1628" : isActive ? "#3ECF8E" : "rgba(232, 235, 243, 0.28)",
                    cursor: isActive ? "pointer" : "not-allowed",
                    fontSize: 14,
                    fontWeight: 700,
                    letterSpacing: "0.01em",
                    boxShadow: isFilled ? "0 0 20px rgba(62, 207, 142, 0.25)" : "none",
                    transition: "all 0.18s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (isActive) {
                      if (isFilled) {
                        e.currentTarget.style.background = "#4DDBA0";
                        e.currentTarget.style.boxShadow = "0 0 28px rgba(62, 207, 142, 0.40)";
                        e.currentTarget.style.transform = "translateY(-1px)";
                      } else {
                        e.currentTarget.style.background = "rgba(62, 207, 142, 0.10)";
                        e.currentTarget.style.boxShadow = "0 0 16px rgba(62, 207, 142, 0.15)";
                      }
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = isFilled ? "#3ECF8E" : isActive ? "transparent" : "rgba(255,255,255,0.03)";
                    e.currentTarget.style.boxShadow = isFilled ? "0 0 20px rgba(62, 207, 142, 0.25)" : "none";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  {isNextLoading ? (
                    <>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ animation: "merlin-spin 0.8s linear infinite", flexShrink: 0 }}>
                        <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeDasharray="30 10" />
                      </svg>
                      Working\u2026
                    </>
                  ) : (
                    <>
                      {nextLabel || "Next Step"}
                      <svg width="15" height="15" viewBox="0 0 15 15" fill="none" style={{ flexShrink: 0 }}>
                        <path d="M5.5 3L10 7.5L5.5 12" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </>
                  )}
                </button>
              );
            })()}
          </div>
        </div>
      </div>
    </>
  );
}"""

new_content = content[:start_idx] + NEW_NAV
with open(FILEPATH, "w") as f:
    f.write(new_content)

print(f"SUCCESS: Replaced bottom nav (chars {start_idx}..{end_idx_full})")
print(f"New file length: {len(new_content)}")
