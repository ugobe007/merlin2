/**
 * BessSpecSheet
 * =============
 * Renders a full technical specification sheet for a BESS installation,
 * derived entirely from wizard/quote output — no manual entry.
 *
 * Sections:
 *   01 — Battery Energy Storage (module, rack, chemistry, cycles, warranty)
 *   02 — Power Conversion & Electrical (PCS, inverters, AC/DC panels, BMS)
 *   03 — Integrated Generation Assets (solar, generator — conditional)
 *   04 — Load Profile & Sizing (base/peak/daily/annual — conditional)
 *
 * Usage:
 *   <BessSpecSheet {...props} />
 *   <BessSpecSheet compact {...props} />   // Step5 inline panel
 *
 * Design: Merlin dark — rgba card system, #3ECF8E accent, no Tailwind backgrounds.
 */

import React from "react";
import { Battery, Zap, Sun, BarChart2, ChevronRight } from "lucide-react";

// ─── Props ────────────────────────────────────────────────────────────────────

export interface BessSpecInput {
  // BESS core
  bessKW: number; // rated power  kW
  bessKWh: number; // energy capacity  kWh
  durationHours: number; // C2 spec duration

  // Hardware detail (from selectedBESS)
  chemistry?: string; // "LFP"
  manufacturer?: string; // "CATL", "BYD", etc.
  model?: string;
  moduleKwh?: number; // per-module kWh
  roundtripEfficiencyPct?: number; // default 90
  warrantyYears?: number; // standard: 10, extended: 20 (adds modules)
  warrantyExtension?: boolean; // true = 20yr extended warranty selected (adds modules)
  cycleLife?: number; // default 6000

  // Generation assets
  solarKW?: number;
  solarEfficiencyPct?: number; // default 21.5
  generatorKW?: number;

  // Load profile
  baseLoadKW?: number;
  peakLoadKW?: number;

  // Display
  compact?: boolean; // condensed for wizard sidebar / inline expand
  className?: string;
}

// ─── Design tokens ────────────────────────────────────────────────────────────

const T = {
  primary: "#e8ebf3",
  muted: "rgba(232,235,243,0.50)",
  dim: "rgba(232,235,243,0.25)",
  accent: "#3ECF8E",
  accentDim: "rgba(62,207,142,0.08)",
  accentBorder: "rgba(62,207,142,0.22)",
  cardBg: "rgba(255,255,255,0.025)",
  cardBorder: "rgba(255,255,255,0.06)",
  rowAlt: "rgba(255,255,255,0.015)",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Derive module kWh from system size if not supplied */
function deriveModuleKwh(bessKWh: number, provided?: number): number {
  if (provided && provided > 0) return provided;
  if (bessKWh <= 100) return 25;
  if (bessKWh <= 500) return 50;
  return 100;
}

/** Round to at most 2 decimal places, drop trailing zeros */
function fmt(n: number, unit: string): string {
  const s = n % 1 === 0 ? n.toFixed(0) : n.toFixed(2).replace(/\.?0+$/, "");
  return `${Number(s).toLocaleString()} ${unit}`;
}

function fmtNum(n: number): string {
  return n % 1 === 0 ? n.toLocaleString() : n.toFixed(1);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({
  number,
  title,
  icon,
  compact,
}: {
  number: string;
  title: string;
  icon: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: compact ? "10px 14px" : "12px 16px",
        borderBottom: `1px solid ${T.cardBorder}`,
        background: T.accentDim,
      }}
    >
      <span
        style={{
          fontFamily: "'JetBrains Mono','Courier New',monospace",
          fontSize: 10,
          color: T.accent,
          opacity: 0.7,
          fontWeight: 700,
          letterSpacing: "0.05em",
          flexShrink: 0,
          minWidth: 22,
        }}
      >
        {number}
      </span>
      <span style={{ color: T.dim, flexShrink: 0 }}>{icon}</span>
      <span
        style={{
          fontSize: compact ? 11 : 12,
          fontWeight: 700,
          color: T.primary,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
        }}
      >
        {title}
      </span>
    </div>
  );
}

function SpecRow({
  label,
  value,
  alt,
  accent,
  compact,
}: {
  label: string;
  value: React.ReactNode;
  alt?: boolean;
  accent?: boolean;
  compact?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: compact ? "5px 14px" : "7px 16px",
        background: alt ? T.rowAlt : "transparent",
        gap: 12,
      }}
    >
      <span
        style={{
          fontSize: compact ? 11 : 12,
          color: T.muted,
          flexShrink: 0,
          minWidth: 0,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: compact ? 11 : 12,
          fontWeight: 500,
          color: accent ? T.accent : T.primary,
          textAlign: "right",
          wordBreak: "break-word",
        }}
      >
        {value}
      </span>
    </div>
  );
}

function SpecSubheader({ children, compact }: { children: React.ReactNode; compact?: boolean }) {
  return (
    <div
      style={{
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: "0.10em",
        textTransform: "uppercase",
        color: T.dim,
        padding: compact ? "8px 14px 3px" : "10px 16px 4px",
        borderTop: `1px solid ${T.cardBorder}`,
      }}
    >
      {children}
    </div>
  );
}

function SpecTable({ children, compact }: { children: React.ReactNode; compact?: boolean }) {
  return <div style={{ padding: compact ? "4px 0" : "6px 0" }}>{children}</div>;
}

// ─── Asset row for generation table ──────────────────────────────────────────

function AssetRow({
  asset,
  capacity,
  detail,
  compact,
  alt,
}: {
  asset: string;
  capacity: string;
  detail: string;
  compact?: boolean;
  alt?: boolean;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 80px 1fr",
        alignItems: "center",
        gap: 8,
        padding: compact ? "5px 14px" : "7px 16px",
        background: alt ? T.rowAlt : "transparent",
      }}
    >
      <span style={{ fontSize: compact ? 11 : 12, color: T.muted }}>{asset}</span>
      <span
        style={{
          fontSize: compact ? 11 : 12,
          fontWeight: 600,
          color: T.primary,
          textAlign: "center",
        }}
      >
        {capacity}
      </span>
      <span style={{ fontSize: compact ? 10 : 11, color: T.dim, textAlign: "right" }}>
        {detail}
      </span>
    </div>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function SpecSection({ children, compact }: { children: React.ReactNode; compact?: boolean }) {
  return (
    <div
      style={{
        background: T.cardBg,
        border: `1px solid ${T.cardBorder}`,
        borderRadius: compact ? 8 : 10,
        overflow: "hidden",
      }}
    >
      {children}
    </div>
  );
}

// ─── Main Export ─────────────────────────────────────────────────────────────

export default function BessSpecSheet({
  bessKW,
  bessKWh,
  durationHours,
  chemistry = "LFP",
  manufacturer,
  model,
  moduleKwh: moduleKwhProp,
  roundtripEfficiencyPct = 90,
  warrantyYears = 10,
  warrantyExtension = false,
  cycleLife = 6000,
  solarKW = 0,
  solarEfficiencyPct = 21.5,
  generatorKW = 0,
  baseLoadKW,
  peakLoadKW,
  compact = false,
  className,
}: BessSpecInput) {
  // ── Derived values ────────────────────────────────────────────────────
  const bessMW = bessKW / 1000;
  const bessMWh = bessKWh / 1000;

  // Warranty: 10yr standard, 20yr extended (extra modules required)
  const isExtendedWarranty = warrantyExtension || warrantyYears >= 20;

  // Module / Rack sizing
  const moduleKwh = deriveModuleKwh(bessKWh, moduleKwhProp);
  const modulesNeeded = Math.ceil(bessKWh / moduleKwh);
  const modulesPerRack = 2; // industry standard for most LFP systems
  const racksNeeded = Math.ceil(modulesNeeded / modulesPerRack);
  const rackKwh = moduleKwh * modulesPerRack;

  // PCS / Inverter
  const maxInverterKW = 500; // single-unit ceiling
  const numInverters = Math.max(1, Math.ceil(bessKW / maxInverterKW));
  const inverterKW = Math.round(bessKW / numInverters);

  // Electrical
  const acVoltage = 480;
  const dcVoltage = 1000;
  const acAmps = Math.round((bessKW * 1000) / (acVoltage * 1.732));
  const dcAmps = Math.round((bessKW * 1000) / dcVoltage);

  // Load profile
  const hasLoad = typeof baseLoadKW === "number" || typeof peakLoadKW === "number";
  const dailyKWh = peakLoadKW ? peakLoadKW * 24 * 0.4 : undefined;
  const annualKWh = dailyKWh ? dailyKWh * 365 : undefined;

  const hasGeneration = solarKW > 0 || generatorKW > 0;

  const gap = compact ? 8 : 12;

  return (
    <div
      className={className}
      style={{
        display: "flex",
        flexDirection: "column",
        gap,
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* ── 01 Battery Energy Storage ── */}
      <SpecSection compact={compact}>
        <SectionHeader
          number="01"
          title="Battery Energy Storage"
          icon={<Battery size={compact ? 11 : 13} color={T.accent} />}
          compact={compact}
        />
        <SpecTable compact={compact}>
          <SpecRow
            label="Energy Capacity"
            value={`${fmtNum(bessMWh)} MWh  (${fmtNum(bessKWh)} kWh)`}
            alt
            compact={compact}
            accent
          />
          <SpecRow
            label="Power Rating"
            value={`${fmtNum(bessMW)} MW  (${fmtNum(bessKW)} kW)`}
            compact={compact}
          />
          <SpecRow
            label="Duration"
            value={`${durationHours}h at rated power`}
            alt
            compact={compact}
          />
          <SpecRow label="Battery Chemistry" value={chemistry} compact={compact} accent />
        </SpecTable>

        <SpecSubheader compact={compact}>Module &amp; Rack Configuration</SpecSubheader>
        <SpecTable compact={compact}>
          <SpecRow
            label="Module Capacity"
            value={fmt(moduleKwh, "kWh / module")}
            alt
            compact={compact}
          />
          <SpecRow label="Module Count" value={`${modulesNeeded} modules`} compact={compact} />
          <SpecRow label="Rack Capacity" value={fmt(rackKwh, "kWh / rack")} alt compact={compact} />
          <SpecRow
            label="Racks Required"
            value={`${racksNeeded} rack${racksNeeded !== 1 ? "s" : ""}  (${modulesPerRack} modules each)`}
            compact={compact}
          />
          {manufacturer && (
            <SpecRow
              label="Manufacturer"
              value={[manufacturer, model].filter(Boolean).join(" — ")}
              alt
              compact={compact}
            />
          )}
        </SpecTable>

        <SpecSubheader compact={compact}>Performance &amp; Longevity</SpecSubheader>
        <SpecTable compact={compact}>
          <SpecRow
            label="Round-Trip Efficiency"
            value={`${roundtripEfficiencyPct}%`}
            alt
            compact={compact}
            accent
          />
          <SpecRow label="Design Cycles" value={`365 cycles/year`} compact={compact} />
          <SpecRow
            label="Cycle Life"
            value={`${cycleLife.toLocaleString()} total cycles`}
            alt
            compact={compact}
          />
          <SpecRow
            label="System Warranty"
            value={
              isExtendedWarranty
                ? "20 years (extended — additional modules included)"
                : "10 years standard"
            }
            compact={compact}
          />
          {!isExtendedWarranty && (
            <SpecRow
              label="Warranty Extension"
              value="+10 yr available — requires additional battery modules"
              alt
              compact={compact}
            />
          )}
        </SpecTable>
      </SpecSection>

      {/* ── 02 Power Conversion & Electrical ── */}
      <SpecSection compact={compact}>
        <SectionHeader
          number="02"
          title="Power Conversion &amp; Electrical"
          icon={<Zap size={compact ? 11 : 13} color={T.accent} />}
          compact={compact}
        />
        <SpecTable compact={compact}>
          <SpecRow
            label="Inverter / PCS"
            value={`${numInverters}× ${fmtNum(inverterKW)} kW — Bidirectional`}
            alt
            compact={compact}
            accent
          />
          <SpecRow label="Inverter Efficiency" value="97.5%" compact={compact} />
          <SpecRow label="System Voltage (AC)" value="480V, 3-phase" alt compact={compact} />
          <SpecRow label="DC Bus Voltage" value="1000V nominal" compact={compact} />
          <SpecRow label="AC Current (FLA)" value={fmt(acAmps, "A @ 480V")} alt compact={compact} />
          <SpecRow label="DC Current (FLA)" value={fmt(dcAmps, "A @ 1000V")} compact={compact} />
        </SpecTable>

        <SpecSubheader compact={compact}>Distribution &amp; Protection</SpecSubheader>
        <SpecTable compact={compact}>
          <SpecRow
            label="AC Distribution"
            value={`${fmtNum(bessKW)} kW — 3-phase bus bar`}
            alt
            compact={compact}
          />
          <SpecRow
            label="DC Combiner Box"
            value="1000V DC max — fused per string"
            compact={compact}
          />
          <SpecRow
            label="Switchgear"
            value={
              bessKW > 500
                ? `Medium Voltage — ${fmtNum(bessKW)} kW rated`
                : `Low Voltage — ${fmtNum(bessKW)} kW rated`
            }
            alt
            compact={compact}
          />
          <SpecRow label="Disconnect" value="AC &amp; DC interlocked isolation" compact={compact} />
          <SpecRow
            label="Protection Relay"
            value="Ground fault · arc flash · overcurrent"
            alt
            compact={compact}
          />
          <SpecRow label="BMS" value="Integrated Battery Management System" compact={compact} />
        </SpecTable>
      </SpecSection>

      {/* ── 03 Integrated Generation Assets (conditional) ── */}
      {hasGeneration && (
        <SpecSection compact={compact}>
          <SectionHeader
            number="03"
            title="Integrated Generation Assets"
            icon={<Sun size={compact ? 11 : 13} color={T.accent} />}
            compact={compact}
          />
          {/* Column headers */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 80px 1fr",
              gap: 8,
              padding: compact ? "5px 14px 2px" : "7px 16px 3px",
            }}
          >
            <span
              style={{
                fontSize: 9,
                color: T.dim,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Asset
            </span>
            <span
              style={{
                fontSize: 9,
                color: T.dim,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                textAlign: "center",
              }}
            >
              Capacity
            </span>
            <span
              style={{
                fontSize: 9,
                color: T.dim,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                textAlign: "right",
              }}
            >
              Details
            </span>
          </div>
          {solarKW > 0 && (
            <AssetRow
              asset="Solar PV Array"
              capacity={`${fmtNum(solarKW)} kW`}
              detail={`Monocrystalline — ${solarEfficiencyPct}% efficiency`}
              compact={compact}
              alt
            />
          )}
          {generatorKW > 0 && (
            <AssetRow
              asset="Diesel Generator"
              capacity={`${fmtNum(generatorKW)} kW`}
              detail="Emergency backup"
              compact={compact}
            />
          )}
          <div style={{ padding: compact ? "6px 14px" : "8px 16px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: T.accentDim,
                border: `1px solid ${T.accentBorder}`,
                borderRadius: 6,
                padding: "6px 10px",
              }}
            >
              <ChevronRight size={10} color={T.accent} />
              <span style={{ fontSize: 10, color: T.muted, lineHeight: 1.5 }}>
                {solarKW > 0 && generatorKW > 0
                  ? "Solar reduces daily grid draw. Generator provides blackout backup beyond BESS window."
                  : solarKW > 0
                    ? "Solar array charges BESS during the day, extending effective discharge window."
                    : "Generator activates automatically when BESS state-of-charge falls below 10%."}
              </span>
            </div>
          </div>
        </SpecSection>
      )}

      {/* ── 04 Load Profile & Sizing ── */}
      {hasLoad && (
        <SpecSection compact={compact}>
          <SectionHeader
            number={hasGeneration ? "04" : "03"}
            title="Load Profile &amp; Sizing"
            icon={<BarChart2 size={compact ? 11 : 13} color={T.accent} />}
            compact={compact}
          />
          <div style={{ padding: compact ? "6px 14px 8px" : "8px 16px 10px" }}>
            <p
              style={{
                fontSize: compact ? 10 : 11,
                color: T.muted,
                lineHeight: 1.65,
                marginBottom: compact ? 6 : 8,
              }}
            >
              The BESS is sized at {fmtNum(bessMW)} MW / {durationHours}hr based on your facility's
              estimated peak demand and operational requirements.
            </p>
          </div>
          <SpecSubheader compact={compact}>Load Summary</SpecSubheader>
          <SpecTable compact={compact}>
            {baseLoadKW !== undefined && (
              <SpecRow label="Base Load" value={fmt(baseLoadKW, "kW")} alt compact={compact} />
            )}
            {peakLoadKW !== undefined && (
              <SpecRow label="Peak Load" value={fmt(peakLoadKW, "kW")} compact={compact} accent />
            )}
            {dailyKWh !== undefined && (
              <SpecRow
                label="Daily Energy Consumption"
                value={`${Math.round(dailyKWh).toLocaleString()} kWh/day`}
                alt
                compact={compact}
              />
            )}
            {annualKWh !== undefined && (
              <SpecRow
                label="Annual Energy Consumption"
                value={`${Math.round(annualKWh).toLocaleString()} kWh/year`}
                compact={compact}
              />
            )}
          </SpecTable>
        </SpecSection>
      )}
    </div>
  );
}
