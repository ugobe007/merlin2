/**
 * WIZARD HOOKS INDEX - PLACEHOLDER
 * =================================
 * Actual hooks are in v5/hooks/
 */

import { useState, useCallback } from 'react';

// Placeholder hook - actual implementation in v5
// Legacy placeholder - use WizardV5 instead
// This export is kept for backward compatibility only
export const useStreamlinedWizard = () => {
  const [wizardState, setWizardState] = useState({});
  return {
    wizardState,
    setWizardState,
    generateQuote: async () => {},
    isGenerating: false,
  };
};
