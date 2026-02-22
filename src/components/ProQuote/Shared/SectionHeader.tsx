/**
 * SectionHeader - Reusable section header component
 * Standard header for configuration sections
 * Used in: All configuration sections (System, Application, Financial, etc.)
 */

import React from "react";
import type { LucideIcon } from "lucide-react";

interface SectionHeaderProps {
  icon: LucideIcon;
  iconColor: string;
  iconBgColor: string;
  title: string;
  subtitle?: string;
  children?: React.ReactNode; // For MerlinTip or other content below title
}

export const SectionHeader = React.memo(function SectionHeader({
  icon: Icon,
  iconColor,
  iconBgColor,
  title,
  subtitle,
  children,
}: SectionHeaderProps) {
  return (
    <div
      className="px-6 py-4"
      style={{
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(255,255,255,0.02)",
      }}
    >
      <h3 className="text-lg font-semibold text-white flex items-center gap-3">
        <div className="p-2 rounded-lg" style={{ background: iconBgColor }}>
          <Icon className="w-5 h-5" style={{ color: iconColor }} />
        </div>
        {title}
        {subtitle && (
          <span className="text-xs font-normal ml-auto" style={{ color: "rgba(255,255,255,0.35)" }}>
            {subtitle}
          </span>
        )}
      </h3>
      {children}
    </div>
  );
});
