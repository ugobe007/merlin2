/**
 * Country Selector Component
 * 
 * Dropdown for selecting country/region for international quotes
 */

import React from 'react';
import { SUPPORTED_COUNTRIES, type Country } from '@/services/internationalService';

interface CountrySelectorProps {
  selectedCountry: string;
  onChange: (countryCode: string) => void;
  label?: string;
  className?: string;
}

export default function CountrySelector({
  selectedCountry,
  onChange,
  label = 'Location',
  className = '',
}: CountrySelectorProps) {
  const selected = SUPPORTED_COUNTRIES.find((c) => c.code === selectedCountry);

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-300">
          {label}
        </label>
      )}
      
      <div className="relative">
        <select
          value={selectedCountry}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white
                     focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent
                     appearance-none cursor-pointer hover:bg-gray-750 transition-colors"
        >
          {SUPPORTED_COUNTRIES.map((country) => (
            <option key={country.code} value={country.code}>
              {country.flag} {country.name} ({country.currencySymbol})
            </option>
          ))}
        </select>
        
        {/* Dropdown arrow */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Helper text showing currency */}
      {selected && (
        <p className="text-sm text-gray-400">
          Prices will be displayed in {selected.currency} ({selected.currencySymbol})
        </p>
      )}
    </div>
  );
}

/**
 * Compact inline version for wizards/forms
 */
export function CountrySelectorCompact({
  selectedCountry,
  onChange,
  className = '',
}: Omit<CountrySelectorProps, 'label'>) {
  const selected = SUPPORTED_COUNTRIES.find((c) => c.code === selectedCountry);

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <span className="text-sm text-gray-400">Location:</span>
      <select
        value={selectedCountry}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-md text-white text-sm
                   focus:outline-none focus:ring-2 focus:ring-emerald-500
                   appearance-none cursor-pointer hover:bg-gray-750"
      >
        {SUPPORTED_COUNTRIES.map((country) => (
          <option key={country.code} value={country.code}>
            {country.flag} {country.name}
          </option>
        ))}
      </select>
      {selected && (
        <span className="text-sm text-gray-500">
          ({selected.currencySymbol})
        </span>
      )}
    </div>
  );
}
