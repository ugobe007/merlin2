/**
 * ApplicationSection - BESS application and use case
 * Application type, primary use case, project name, location
 * Part of Custom Config view
 */

import React from "react";
import { Building2 } from "lucide-react";
import { SectionHeader } from "../../Shared/SectionHeader";

interface ApplicationSectionProps {
  applicationType: string;
  setApplicationType: (value: string) => void;
  useCase: string;
  setUseCase: (value: string) => void;
  projectName: string;
  setProjectName: (value: string) => void;
  location: string;
  setLocation: (value: string) => void;
}

export const ApplicationSection = React.memo(function ApplicationSection({
  applicationType,
  setApplicationType,
  useCase,
  setUseCase,
  projectName,
  setProjectName,
  location,
  setLocation,
}: ApplicationSectionProps) {
  return (
    <div
      data-section="application"
      className="scroll-mt-48 rounded-xl overflow-hidden"
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <SectionHeader
        icon={Building2}
        iconColor="#34d399"
        iconBgColor="rgba(34,197,94,0.1)"
        title="Application & Use Case"
        subtitle="How you'll use the system"
      />

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Application Type */}
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

          {/* Primary Use Case */}
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

          {/* Project Name */}
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

          {/* Location */}
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
});
