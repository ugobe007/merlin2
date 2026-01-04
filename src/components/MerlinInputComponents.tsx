/**
 * MERLIN INPUT COMPONENTS
 * Clean, professional input components for the wizard
 */

import React from "react";

// CleanInput component
interface CleanInputProps {
  label?: string;
  subtitle?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "number" | "email";
  icon?: React.ReactNode;
  optional?: boolean;
  className?: string;
}

export const CleanInput: React.FC<CleanInputProps> = ({
  label,
  subtitle,
  value,
  onChange,
  placeholder,
  type = "text",
  icon,
  optional = false,
  className = "",
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {optional && <span className="text-gray-400 ml-1">(Optional)</span>}
        </label>
      )}
      {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</div>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => {
            // For zip code inputs, limit to 5 digits
            if (
              placeholder?.toLowerCase().includes("zip") ||
              placeholder?.toLowerCase().includes("5-digit")
            ) {
              const numericValue = e.target.value.replace(/\D/g, "").slice(0, 5);
              onChange(numericValue);
            } else {
              onChange(e.target.value);
            }
          }}
          placeholder={placeholder}
          maxLength={
            placeholder?.toLowerCase().includes("zip") ||
            placeholder?.toLowerCase().includes("5-digit")
              ? 5
              : undefined
          }
          className={`
            w-full px-4 py-3 rounded-xl
            bg-white border border-gray-200
            text-gray-900 placeholder-gray-400
            focus:bg-white focus:border-purple-500 focus:outline-none
            focus:ring-2 focus:ring-purple-500/20
            transition-all duration-200
            ${icon ? "pl-10" : ""}
          `}
        />
      </div>
    </div>
  );
};

// SearchableDropdown component
interface SearchableDropdownProps {
  label?: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
  label,
  options,
  value,
  onChange,
  placeholder = "Select...",
  className = "",
  disabled = false,
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-gray-900 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all appearance-none cursor-pointer disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-500"
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default { CleanInput, SearchableDropdown };
