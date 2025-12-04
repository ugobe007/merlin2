/**
 * USE UTILITY RATES HOOK
 * ======================
 * 
 * React hook for fetching utility rates by ZIP code.
 * Provides automatic caching, loading states, and error handling.
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  getUtilityRatesByZip, 
  getCommercialRateByZip,
  getBESSSavingsOpportunity,
  type ZipCodeUtilityData 
} from '@/services/utilityRateService';

interface UseUtilityRatesResult {
  // Full utility data
  data: ZipCodeUtilityData | null;
  
  // Simplified rate info
  rate: number | null;
  demandCharge: number | null;
  peakRate: number | null;
  utilityName: string | null;
  state: string | null;
  hasTOU: boolean;
  
  // Savings opportunity
  savingsScore: number | null;
  savingsRating: 'excellent' | 'good' | 'fair' | 'poor' | null;
  savingsReasons: string[];
  
  // Status
  loading: boolean;
  error: string | null;
  
  // Actions
  refetch: () => void;
}

export function useUtilityRates(zipCode: string | null): UseUtilityRatesResult {
  const [data, setData] = useState<ZipCodeUtilityData | null>(null);
  const [simpleRate, setSimpleRate] = useState<{
    rate: number;
    demandCharge: number;
    peakRate?: number;
    utilityName: string;
    state: string;
    hasTOU: boolean;
  } | null>(null);
  const [savings, setSavings] = useState<{
    score: number;
    rating: 'excellent' | 'good' | 'fair' | 'poor';
    reasons: string[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fetchRates = useCallback(async () => {
    if (!zipCode || zipCode.length < 5) {
      setData(null);
      setSimpleRate(null);
      setSavings(null);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Fetch all data in parallel
      const [fullData, rateData, savingsData] = await Promise.all([
        getUtilityRatesByZip(zipCode),
        getCommercialRateByZip(zipCode),
        getBESSSavingsOpportunity(zipCode),
      ]);
      
      setData(fullData);
      setSimpleRate(rateData);
      setSavings(savingsData);
    } catch (err) {
      console.error('Error fetching utility rates:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch utility rates');
    } finally {
      setLoading(false);
    }
  }, [zipCode]);
  
  useEffect(() => {
    fetchRates();
  }, [fetchRates]);
  
  return {
    data,
    rate: simpleRate?.rate ?? null,
    demandCharge: simpleRate?.demandCharge ?? null,
    peakRate: simpleRate?.peakRate ?? null,
    utilityName: simpleRate?.utilityName ?? null,
    state: simpleRate?.state ?? null,
    hasTOU: simpleRate?.hasTOU ?? false,
    savingsScore: savings?.score ?? null,
    savingsRating: savings?.rating ?? null,
    savingsReasons: savings?.reasons ?? [],
    loading,
    error,
    refetch: fetchRates,
  };
}

/**
 * Simple hook to just get the commercial rate
 */
export function useCommercialRate(zipCode: string | null): {
  rate: number | null;
  demandCharge: number | null;
  loading: boolean;
} {
  const [rate, setRate] = useState<number | null>(null);
  const [demandCharge, setDemandCharge] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (!zipCode || zipCode.length < 5) {
      setRate(null);
      setDemandCharge(null);
      return;
    }
    
    setLoading(true);
    getCommercialRateByZip(zipCode)
      .then(data => {
        setRate(data?.rate ?? null);
        setDemandCharge(data?.demandCharge ?? null);
      })
      .catch(err => {
        console.error('Error fetching rate:', err);
      })
      .finally(() => setLoading(false));
  }, [zipCode]);
  
  return { rate, demandCharge, loading };
}
