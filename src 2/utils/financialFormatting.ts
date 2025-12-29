// Financial formatting utilities for professional presentation
export function formatLargeFinancialValue(value: number, context: 'project' | 'annual' | 'general' = 'general'): {
  formatted: string;
  units: 'K' | 'M' | 'B';
  rawValue: number;
} {
  const absValue = Math.abs(value);
  
  // For project costs and large annual savings, prefer millions
  if (context === 'project' || context === 'annual') {
    if (absValue >= 1000000) {
      return {
        formatted: `${(value / 1000000).toFixed(2)}`,
        units: 'M',
        rawValue: value / 1000000
      };
    } else if (absValue >= 1000) {
      return {
        formatted: `${(value / 1000).toFixed(0)}`,
        units: 'K',
        rawValue: value / 1000
      };
    }
  }
  
  // General formatting logic
  if (absValue >= 1000000000) {
    return {
      formatted: `${(value / 1000000000).toFixed(2)}`,
      units: 'B',
      rawValue: value / 1000000000
    };
  } else if (absValue >= 1000000) {
    return {
      formatted: `${(value / 1000000).toFixed(2)}`,
      units: 'M',
      rawValue: value / 1000000
    };
  } else if (absValue >= 1000) {
    return {
      formatted: `${(value / 1000).toFixed(0)}`,
      units: 'K',
      rawValue: value / 1000
    };
  }
  
  return {
    formatted: `${value.toFixed(0)}`,
    units: 'K', // Default for small values
    rawValue: value / 1000
  };
}

export function formatSolarSavings(solarMW: number, electricityRate: number, context: 'display' | 'calculation' = 'display'): {
  annualSavings: number;
  formattedSavings: string;
  displayText: string;
} {
  // Solar generation: 1500 MWh/MW-year (conservative capacity factor ~17%)
  const annualMWhGeneration = solarMW * 1500;
  const annualSavings = annualMWhGeneration * electricityRate * 1000; // Convert to dollars
  
  const financial = formatLargeFinancialValue(annualSavings, 'annual');
  
  const displayText = context === 'display' 
    ? `$${financial.formatted}${financial.units}/year` 
    : `${financial.formatted}${financial.units}`;
    
  return {
    annualSavings,
    formattedSavings: `${financial.formatted}${financial.units}`,
    displayText
  };
}

export function formatTotalProjectSavings(batterySavings: number, solarSavings: number, windSavings: number = 0): {
  totalSavings: number;
  formattedTotal: string;
  breakdown: {
    battery: string;
    solar: string;
    wind: string;
  };
} {
  const totalSavings = batterySavings + solarSavings + windSavings;
  const totalFormatted = formatLargeFinancialValue(totalSavings, 'annual');
  
  const batteryFormatted = formatLargeFinancialValue(batterySavings, 'annual');
  const solarFormatted = formatLargeFinancialValue(solarSavings, 'annual');
  const windFormatted = formatLargeFinancialValue(windSavings, 'annual');
  
  return {
    totalSavings,
    formattedTotal: `$${totalFormatted.formatted}${totalFormatted.units}/year`,
    breakdown: {
      battery: `$${batteryFormatted.formatted}${batteryFormatted.units}`,
      solar: `$${solarFormatted.formatted}${solarFormatted.units}`,
      wind: `$${windFormatted.formatted}${windFormatted.units}`
    }
  };
}

// Smart currency formatting that maintains consistency with project scale
export function formatCurrencyConsistent(value: number, projectScale: 'micro' | 'small' | 'medium' | 'large' | 'utility' = 'medium'): string {
  // Determine project scale context for formatting consistency
  const preferMillions = projectScale === 'large' || projectScale === 'utility';
  const context = preferMillions ? 'project' : 'general';
  
  const financial = formatLargeFinancialValue(value, context);
  return `$${financial.formatted}${financial.units}`;
}

// For backwards compatibility
export function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(2)}M`;
  } else if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${value.toFixed(0)}`;
}