/**
 * Application & Use Case Section
 * Phase 1G Part 2c Operation 3 (Feb 2026)
 * 
 * Application type and use case configuration
 * Extracted from AdvancedQuoteBuilder.tsx (~126 lines)
 * 
 * Features:
 * - Application type selector (Residential, C&I, Utility, Microgrid)
 * - Primary use case selector (Peak Shaving, Arbitrage, Backup, etc.)
 * - Project name input with placeholder
 * - Location input (City, State)
 */

import { Building2 } from "lucide-react";

export interface ApplicationUseCaseSectionProps {
  applicationType: string;
  useCase: string;
  projectName: string;
  location: string;
  setApplicationType: (value: string) => void;
  setUseCase: (value: string) => void;
  setProjectName: (value: string) => void;
  setLocation: (value: string) => void;
}

export default function ApplicationUseCaseSection({
  applicationType,
  useCase,
  projectName,
  location,
  setApplicationType,
  setUseCase,
  setProjectName,
  setLocation,
}: ApplicationUseCaseSectionProps) {
  return (
    <div
      data-section="application"
      className="scroll-mt-48 rounded-xl overflow-hidden"
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div
        className="px-6 py-4"
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(255,255,255,0.02)",
        }}
      >
        <h3 className="text-lg font-semibold text-white flex items-center gap-3">
          <div
            className="p-2 rounded-lg"
            style={{ background: "rgba(34,197,94,0.1)" }}
          >
            <Building2 className="w-5 h-5 text-emerald-400" />
          </div>
          Application & Use Case
          <span
            className="text-xs font-normal ml-auto"
            style={{ color: "rgba(255,255,255,0.35)" }}
          >
            How you'll use the system
          </span>
        </h3>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label
              className="block text-sm font-semibold mb-2"
              style={{ color: "rgba(255,255,255,0.6)" }}
            >
              Application Type
            </label>
            <select
              value={applicationType}
              onChange={(e) => setApplicationType(e.target.value)}
              className="w-full px-4 py-3 text-white rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <option value="residential">Residential</option>
              <option value="commercial">Commercial & Industrial</option>
              <option value="utility">Utility Scale</option>
              <option value="microgrid">Microgrid</option>
            </select>
          </div>

          <div>
            <label
              className="block text-sm font-semibold mb-2"
              style={{ color: "rgba(255,255,255,0.6)" }}
            >
              Primary Use Case
            </label>
            <select
              value={useCase}
              onChange={(e) => setUseCase(e.target.value)}
              className="w-full px-4 py-3 text-white rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <option value="peak-shaving">Peak Shaving / Demand Reduction</option>
              <option value="arbitrage">Energy Arbitrage / TOU</option>
              <option value="backup">Backup Power / UPS</option>
              <option value="solar-shifting">Solar + Storage</option>
              <option value="frequency-regulation">Frequency Regulation</option>
              <option value="renewable-smoothing">Renewable Smoothing</option>
            </select>
          </div>

          <div>
            <label
              className="block text-sm font-semibold mb-2"
              style={{ color: "rgba(255,255,255,0.6)" }}
            >
              Project Name
            </label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="e.g., Downtown Hotel BESS"
              className="w-full px-4 py-3 text-white rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none placeholder-white/20"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            />
          </div>

          <div>
            <label
              className="block text-sm font-semibold mb-2"
              style={{ color: "rgba(255,255,255,0.6)" }}
            >
              Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="City, State"
              className="w-full px-4 py-3 text-white rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none placeholder-white/20"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
