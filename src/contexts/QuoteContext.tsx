/**
 * QuoteContext - Centralized Quote State Management
 * =================================================
 * SINGLE SOURCE OF TRUTH for all quote data.
 * 
 * Benefits:
 * - Eliminates prop drilling through 7+ wizard steps
 * - Ensures consistency across all components
 * - Provides audit trail of all changes
 * - Enables real-time virtual quote viewer
 * - Simplifies testing and debugging
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { 
  QuoteDocument, 
  QuoteDocumentUpdate 
} from '../types/QuoteDocument';
import { 
  createEmptyQuote, 
  calculateQuoteCompleteness,
  validateQuote
} from '../types/QuoteDocument';

interface QuoteContextValue {
  // Current quote document
  quote: QuoteDocument;
  
  // Update methods - type-safe partial updates
  updateUseCase: (data: Partial<QuoteDocument['useCase']>) => void;
  updateConfiguration: (data: Partial<QuoteDocument['configuration']>) => void;
  updateLocation: (data: Partial<QuoteDocument['location']>) => void;
  updateFinancials: (data: Partial<QuoteDocument['financials']>) => void;
  updateAIAnalysis: (data: Partial<QuoteDocument['aiAnalysis']>) => void;
  updateCustomer: (data: Partial<QuoteDocument['customer']>) => void;
  
  // Bulk update (for complex operations)
  updateQuote: (updates: QuoteDocumentUpdate, source?: 'user' | 'ai' | 'system') => void;
  
  // Actions
  resetQuote: () => void;
  loadQuote: (quote: QuoteDocument) => void;
  
  // Computed values
  completionPercentage: number;
  isValid: boolean;
  validationErrors: string[];
  validationWarnings: string[];
  
  // History/Undo (future enhancement)
  canUndo: boolean;
  undo: () => void;
}

const QuoteContext = createContext<QuoteContextValue | null>(null);

/**
 * Custom hook to use quote context
 */
export function useQuote() {
  const context = useContext(QuoteContext);
  if (!context) {
    throw new Error('useQuote must be used within QuoteProvider');
  }
  return context;
}

interface QuoteProviderProps {
  children: React.ReactNode;
  initialQuote?: QuoteDocument;
}

/**
 * QuoteProvider - Wrap your app/wizard with this
 */
export const QuoteProvider: React.FC<QuoteProviderProps> = ({ 
  children, 
  initialQuote 
}) => {
  const [quote, setQuote] = useState<QuoteDocument>(() => 
    initialQuote || createEmptyQuote()
  );
  
  const [history, setHistory] = useState<QuoteDocument[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  /**

  /**
   * Generic update function with audit trail
   */
  const updateQuote = useCallback((
    updates: QuoteDocumentUpdate,
    source: 'user' | 'ai' | 'system' = 'user'
  ) => {
    setQuote(prevQuote => {
      // Start with existing quote
      const newQuote = { ...prevQuote } as QuoteDocument;
      
      // Update metadata
      newQuote.updatedAt = new Date();
      newQuote.version = prevQuote.version + 1;

      // Deep merge nested objects
      if (updates.useCase) {
        newQuote.useCase = { ...prevQuote.useCase, ...updates.useCase };
      }
      if (updates.configuration) {
        newQuote.configuration = {
          ...prevQuote.configuration,
          ...updates.configuration,
          battery: updates.configuration.battery 
            ? { ...prevQuote.configuration.battery, ...updates.configuration.battery }
            : prevQuote.configuration.battery,
          renewables: updates.configuration.renewables
            ? {
                solar: updates.configuration.renewables.solar 
                  ? { ...prevQuote.configuration.renewables.solar, ...updates.configuration.renewables.solar }
                  : prevQuote.configuration.renewables.solar,
                wind: updates.configuration.renewables.wind
                  ? { ...prevQuote.configuration.renewables.wind, ...updates.configuration.renewables.wind }
                  : prevQuote.configuration.renewables.wind,
                generator: updates.configuration.renewables.generator
                  ? { ...prevQuote.configuration.renewables.generator, ...updates.configuration.renewables.generator }
                  : prevQuote.configuration.renewables.generator
              }
            : prevQuote.configuration.renewables
        };
      }
      if (updates.location) {
        newQuote.location = { ...prevQuote.location, ...updates.location };
      }
      if (updates.financials) {
        newQuote.financials = { ...prevQuote.financials, ...updates.financials };
      }

      // Recalculate total system power
      const battery = newQuote.configuration.battery.powerMW;
      const solar = newQuote.configuration.renewables.solar.capacityMW;
      const wind = newQuote.configuration.renewables.wind.capacityMW;
      const generator = newQuote.configuration.renewables.generator.capacityMW;
      newQuote.configuration.totalSystemPowerMW = battery + solar + wind + generator;

      // Recalculate battery capacity
      newQuote.configuration.battery.capacityMWh = 
        newQuote.configuration.battery.powerMW * 
        newQuote.configuration.battery.durationHours;

      // Update completion percentage
      newQuote.completionPercentage = calculateQuoteCompleteness(newQuote);

      // Validate
      const validation = validateQuote(newQuote);
      newQuote.validation = {
        ...validation,
        missingFields: validation.errors.map(e => e.split(' ')[0])
      };

      // Add to change log
      Object.keys(updates).forEach(key => {
        if (key !== 'changeLog' && key !== 'updatedAt' && key !== 'version') {
          newQuote.changeLog = [
            ...prevQuote.changeLog,
            {
              timestamp: new Date(),
              field: key,
              oldValue: prevQuote[key as keyof QuoteDocument],
              newValue: updates[key as keyof QuoteDocument],
              source
            }
          ];
        }
      });

      return newQuote;
    });
  }, []);

  /**
   * Specialized update methods for type safety
   */
  const updateUseCase = useCallback((data: Partial<QuoteDocument['useCase']>) => {
    updateQuote({ useCase: data }, 'user');
  }, [updateQuote]);

  const updateConfiguration = useCallback((data: Partial<QuoteDocument['configuration']>) => {
    updateQuote({ configuration: data }, 'user');
  }, [updateQuote]);

  const updateLocation = useCallback((data: Partial<QuoteDocument['location']>) => {
    updateQuote({ location: data }, 'user');
  }, [updateQuote]);

  const updateFinancials = useCallback((data: Partial<QuoteDocument['financials']>) => {
    updateQuote({ financials: data }, 'system');
  }, [updateQuote]);

  const updateAIAnalysis = useCallback((data: Partial<QuoteDocument['aiAnalysis']>) => {
    updateQuote({ aiAnalysis: data }, 'ai');
  }, [updateQuote]);

  const updateCustomer = useCallback((data: Partial<QuoteDocument['customer']>) => {
    updateQuote({ customer: data }, 'user');
  }, [updateQuote]);

  /**
   * Reset to empty quote
   */
  const resetQuote = useCallback(() => {
    const emptyQuote = createEmptyQuote();
    setQuote(emptyQuote);
    setHistory([]);
    setHistoryIndex(-1);
  }, []);

  /**
   * Load existing quote
   */
  const loadQuote = useCallback((newQuote: QuoteDocument) => {
    setQuote(newQuote);
    setHistory([]);
    setHistoryIndex(-1);
  }, []);

  /**
   * Undo functionality (placeholder for future)
   */
  const undo = useCallback(() => {
    console.warn('⚠️ Undo not yet implemented');
  }, []);

  const value: QuoteContextValue = {
    quote,
    updateUseCase,
    updateConfiguration,
    updateLocation,
    updateFinancials,
    updateAIAnalysis,
    updateCustomer,
    updateQuote,
    resetQuote,
    loadQuote,
    completionPercentage: quote.completionPercentage,
    isValid: quote.validation.isValid,
    validationErrors: quote.validation.errors,
    validationWarnings: quote.validation.warnings,
    canUndo: historyIndex > 0,
    undo
  };

  return (
    <QuoteContext.Provider value={value}>
      {children}
    </QuoteContext.Provider>
  );
};

/**
 * Debug component - shows current quote state
 */
export const QuoteDebugger: React.FC = () => {
  const { quote, completionPercentage, isValid } = useQuote();
  
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 text-white p-4 rounded-lg shadow-lg text-xs max-w-sm z-50">
      <div className="font-bold mb-2">Quote Debug Info</div>
      <div>ID: {quote.id.slice(-8)}</div>
      <div>Version: {quote.version}</div>
      <div>Status: {quote.status}</div>
      <div>Completion: {completionPercentage}%</div>
      <div>Valid: {isValid ? '✅' : '❌'}</div>
      <div>Industry: {quote.useCase.industry || 'none'}</div>
      <div>Battery: {quote.configuration.battery.powerMW}MW × {quote.configuration.battery.durationHours}h</div>
      <div>Total System: {quote.configuration.totalSystemPowerMW.toFixed(2)}MW</div>
      <div className="text-red-400 mt-2">
        {quote.validation.errors.slice(0, 2).join(', ')}
      </div>
    </div>
  );
};
