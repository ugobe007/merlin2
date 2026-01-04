/**
 * Advanced Builder Utility Functions
 *
 * Helper functions for calculations, formatting, and validations
 * used in Advanced Quote Builder.
 *
 * Extracted from AdvancedQuoteBuilder.tsx (Phase 3.4)
 */

/**
 * Format currency values for display
 */
export function formatCurrency(value: number, decimals: number = 2): string {
  return `$${value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

/**
 * Format large currency values with M/K suffixes
 */
export function formatLargeCurrency(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(2)}M`;
  } else if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return formatCurrency(value, 0);
}

/**
 * Generate a random quote number
 */
export function generateQuoteNumber(): string {
  return `MER-${Math.floor(Math.random() * 10000)}`;
}

/**
 * Format date for display
 */
export function formatDate(date: Date = new Date()): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Capitalize first letter of each word
 */
export function capitalizeWords(str: string): string {
  return str
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Scroll to a section smoothly
 */
export function scrollToSection(sectionId: string, delay: number = 300): void {
  setTimeout(() => {
    const element = document.querySelector(`[data-section="${sectionId}"]`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, delay);
}

/**
 * Validate project name (not empty, reasonable length)
 */
export function validateProjectName(name: string): { valid: boolean; error?: string } {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: "Project name is required" };
  }
  if (name.length > 100) {
    return { valid: false, error: "Project name is too long (max 100 characters)" };
  }
  return { valid: true };
}

/**
 * Validate location (not empty)
 */
export function validateLocation(location: string): { valid: boolean; error?: string } {
  if (!location || location.trim().length === 0) {
    return { valid: false, error: "Location is required" };
  }
  return { valid: true };
}

/**
 * Validate storage size (must be positive)
 */
export function validateStorageSize(sizeMW: number): { valid: boolean; error?: string } {
  if (sizeMW <= 0) {
    return { valid: false, error: "Storage size must be greater than 0" };
  }
  if (sizeMW > 1000) {
    return { valid: false, error: "Storage size exceeds maximum (1000 MW)" };
  }
  return { valid: true };
}

/**
 * Validate duration (must be positive and reasonable)
 */
export function validateDuration(hours: number): { valid: boolean; error?: string } {
  if (hours <= 0) {
    return { valid: false, error: "Duration must be greater than 0" };
  }
  if (hours > 24) {
    return { valid: false, error: "Duration exceeds maximum (24 hours)" };
  }
  return { valid: true };
}

/**
 * Check if configuration is valid for quote generation
 */
export function isConfigurationValid(config: {
  projectName: string;
  location: string;
  storageSizeMW: number;
  durationHours: number;
}): boolean {
  return (
    validateProjectName(config.projectName).valid &&
    validateLocation(config.location).valid &&
    validateStorageSize(config.storageSizeMW).valid &&
    validateDuration(config.durationHours).valid
  );
}
