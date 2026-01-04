/**
 * Utility functions
 */

/**
 * Combines class names, filtering out falsy values
 * Simple version - can be enhanced with clsx if needed
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}
