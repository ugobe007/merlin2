/**
 * Recommended Code Fixes for BESS Quote Builder
 * Based on issues identified in console logs
 */

// ==========================================
// FIX 1: Prevent Duplicate BaselineService Calls
// ==========================================

/**
 * ISSUE: BaselineService.fetchConfiguration called 6 times with identical parameters
 * FILE: baselineService.ts
 * SOLUTION: Implement request deduplication and better caching
 */

// BEFORE (Problematic)
class BaselineService {
  async fetchConfiguration(useCase: string, useCaseData: any) {
    console.log('🔍 [BaselineService] Fetching configuration for:', useCase);
    // Makes API call every time
    const response = await api.getConfiguration(useCase, useCaseData);
    return response;
  }
}

// AFTER (Fixed)
class BaselineServiceFixed {
  private cache = new Map<string, any>();
  private pendingRequests = new Map<string, Promise<any>>();
  
  private getCacheKey(useCase: string, useCaseData: any): string {
    // Create stable cache key from sorted data
    const sortedData = Object.keys(useCaseData)
      .sort()
      .map(key => `${key}:${useCaseData[key]}`)
      .join('|');
    return `baseline_${useCase}_${sortedData}`;
  }
  
  async fetchConfiguration(useCase: string, useCaseData: any) {
    const cacheKey = this.getCacheKey(useCase, useCaseData);
    
    console.log('🔍 [BaselineService] Fetching configuration for:', useCase);
    console.log('🔍 [BaselineService] Cache key:', cacheKey);
    
    // Check for pending request (prevents duplicate in-flight requests)
    if (this.pendingRequests.has(cacheKey)) {
      console.log('⏳ [BaselineService] Request already in progress, waiting...');
      return this.pendingRequests.get(cacheKey);
    }
    
    // Check cache
    if (this.cache.has(cacheKey)) {
      console.log('✅ [BaselineService] Returning cached result');
      return this.cache.get(cacheKey);
    }
    
    // Make new request
    console.log('🌐 [BaselineService] Making new API request');
    const promise = this.makeApiRequest(useCase, useCaseData);
    this.pendingRequests.set(cacheKey, promise);
    
    try {
      const result = await promise;
      this.cache.set(cacheKey, result);
      console.log('💾 [BaselineService] Result cached');
      return result;
    } finally {
      this.pendingRequests.delete(cacheKey);
    }
  }
  
  private async makeApiRequest(useCase: string, useCaseData: any) {
    // Actual API call implementation
    const response = await fetch('/api/baseline', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ useCase, useCaseData })
    });
    return response.json();
  }
  
  clearCache() {
    console.log('🗑️ [BaselineService] Clearing cache');
    this.cache.clear();
    this.pendingRequests.clear();
  }
}

// ==========================================
// FIX 2: Prevent Multiple Supabase Clients
// ==========================================

/**
 * ISSUE: Multiple GoTrueClient instances detected
 * FILE: Supabase initialization
 * SOLUTION: Implement singleton pattern
 */

// BEFORE (Problematic)
// Multiple files creating their own clients
import { createClient } from '@supabase/supabase-js';

const supabase1 = createClient(url, key); // In file 1
const supabase2 = createClient(url, key); // In file 2
// ⚠️ Creates multiple clients!

// AFTER (Fixed)
// supabaseClient.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseInstance) {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables');
    }
    
    supabaseInstance = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
    
    console.log('✅ Supabase client initialized');
  }
  
  return supabaseInstance;
}

// Reset for testing
export function resetSupabaseClient() {
  supabaseInstance = null;
}

// Usage in other files
import { getSupabaseClient } from './supabaseClient';
const supabase = getSupabaseClient(); // Always returns same instance

// ==========================================
// FIX 3: Optimize Component Re-renders
// ==========================================

/**
 * ISSUE: AdvancedQuoteBuilder rendering multiple times
 * FILE: BessQuoteBuilder.tsx
 * SOLUTION: Use React.memo, useMemo, and useCallback
 */

// BEFORE (Problematic)
function AdvancedQuoteBuilder({ 
  showAdvancedQuoteBuilderModal, 
  onClose,
  data 
}) {
  console.log('🏗️ Rendering AdvancedQuoteBuilder with showAdvancedQuoteBuilderModal:', showAdvancedQuoteBuilderModal);
  
  const handleSubmit = () => {
    // Handler logic
  };
  
  const processedData = data.map(item => ({
    ...item,
    calculated: item.value * 2
  }));
  
  return (
    <Modal open={showAdvancedQuoteBuilderModal} onClose={onClose}>
      {/* Component content */}
    </Modal>
  );
}

// AFTER (Fixed)
import React, { useMemo, useCallback } from 'react';

const AdvancedQuoteBuilder = React.memo(function AdvancedQuoteBuilder({ 
  showAdvancedQuoteBuilderModal, 
  onClose,
  data 
}: AdvancedQuoteBuilderProps) {
  // Only log on actual prop changes
  console.log('🏗️ Rendering AdvancedQuoteBuilder with showAdvancedQuoteBuilderModal:', showAdvancedQuoteBuilderModal);
  
  // Memoize expensive calculations
  const processedData = useMemo(() => {
    return data.map(item => ({
      ...item,
      calculated: item.value * 2
    }));
  }, [data]); // Only recalculate when data changes
  
  // Memoize callbacks
  const handleSubmit = useCallback(() => {
    // Handler logic
    onClose();
  }, [onClose]);
  
  // Early return if not showing
  if (!showAdvancedQuoteBuilderModal) {
    return null;
  }
  
  return (
    <Modal open={showAdvancedQuoteBuilderModal} onClose={onClose}>
      {/* Component content */}
    </Modal>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function
  return (
    prevProps.showAdvancedQuoteBuilderModal === nextProps.showAdvancedQuoteBuilderModal &&
    prevProps.data === nextProps.data
  );
});

export default AdvancedQuoteBuilder;

// Parent component optimization
function ParentComponent() {
  const [showModal, setShowModal] = useState(false);
  
  // Memoize callback to prevent re-creating on every render
  const handleClose = useCallback(() => {
    setShowModal(false);
  }, []);
  
  // Memoize data to prevent unnecessary child re-renders
  const data = useMemo(() => fetchData(), [/* dependencies */]);
  
  return (
    <AdvancedQuoteBuilder
      showAdvancedQuoteBuilderModal={showModal}
      onClose={handleClose}
      data={data}
    />
  );
}

// ==========================================
// FIX 4: Optimize Smart Wizard State Management
// ==========================================

/**
 * ISSUE: Excessive logging and potential performance impact
 * FILE: useBessQuoteBuilder.ts
 * SOLUTION: Conditional logging and state optimization
 */

// BEFORE (Problematic)
function useBessQuoteBuilder() {
  const [showSmartWizard, setShowSmartWizardState] = useState(false);
  const pageLoadTime = useRef(Date.now());
  
  const setShowSmartWizard = (value: boolean) => {
    console.log('🔔 [useBessQuoteBuilder] setShowSmartWizard called:', value);
    console.log('   pageLoadTime:', pageLoadTime.current);
    console.log('   timeSincePageLoad:', Date.now() - pageLoadTime.current, 'ms');
    console.trace('📍 Call stack:');
    setShowSmartWizardState(value);
  };
  
  return { showSmartWizard, setShowSmartWizard };
}

// AFTER (Fixed)
function useBessQuoteBuilderFixed() {
  const [showSmartWizard, setShowSmartWizardState] = useState(false);
  const pageLoadTime = useRef(Date.now());
  const isDevelopment = import.meta.env.DEV;
  
  const setShowSmartWizard = useCallback((value: boolean) => {
    // Only log in development or if value actually changes
    if (isDevelopment && showSmartWizard !== value) {
      const timeSincePageLoad = Date.now() - pageLoadTime.current;
      console.log('🔔 [useBessQuoteBuilder] setShowSmartWizard:', value);
      
      // Only show detailed timing if it's been more than 1 second
      if (timeSincePageLoad > 1000) {
        console.log('   timeSincePageLoad:', timeSincePageLoad, 'ms');
      }
      
      // Only trace stack on demand (e.g., when debugging specific issues)
      if (window.__DEBUG_WIZARD_STATE__) {
        console.trace('📍 Call stack:');
      }
    }
    
    setShowSmartWizardState(value);
  }, [showSmartWizard, isDevelopment]);
  
  return { showSmartWizard, setShowSmartWizard };
}

// ==========================================
// FIX 5: Optimize AI Data Collection
// ==========================================

/**
 * ISSUE: Potential for parallel operations to block each other
 * FILE: aiDataCollectionService.ts
 * SOLUTION: Better error handling and timeout management
 */

// AFTER (Improved)
class AIDataCollectionServiceFixed {
  private updateInProgress = false;
  
  async runDailyUpdate(): Promise<CollectionResult> {
    if (this.updateInProgress) {
      console.log('⏳ [AI Data Collection] Update already in progress, skipping...');
      return { success: false, reason: 'already_running' };
    }
    
    this.updateInProgress = true;
    console.log('🤖 [AI Data Collection] Starting daily update...');
    
    const startTime = Date.now();
    const timeout = 5000; // 5 second timeout
    
    try {
      // Fetch all data with individual timeouts
      const results = await Promise.allSettled([
        this.fetchWithTimeout(this.fetchBatteryPricing(), timeout, 'pricing'),
        this.fetchWithTimeout(this.fetchProductData(), timeout, 'products'),
        this.fetchWithTimeout(this.fetchIncentiveData(), timeout, 'incentives'),
        this.fetchWithTimeout(this.fetchFinancingData(), timeout, 'financing'),
        this.fetchWithTimeout(this.fetchIndustryNews(), timeout, 'news')
      ]);
      
      // Process results
      const collected = this.processResults(results);
      const duration = (Date.now() - startTime) / 1000;
      
      // Log results
      Object.entries(collected).forEach(([key, items]) => {
        if (items.error) {
          console.error(`❌ ${key}: ${items.error}`);
        } else {
          console.log(`✅ ${key}: ${items.count} items collected`);
        }
      });
      
      console.log(`✅ [AI Data Collection] Daily update complete in ${duration.toFixed(2)}s`);
      
      return { success: true, collected, duration };
      
    } catch (error) {
      console.error('❌ [AI Data Collection] Update failed:', error);
      return { success: false, error: error.message };
    } finally {
      this.updateInProgress = false;
    }
  }
  
  private async fetchWithTimeout<T>(
    promise: Promise<T>, 
    timeout: number, 
    name: string
  ): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) => 
        setTimeout(() => reject(new Error(`${name} timeout`)), timeout)
      )
    ]);
  }
  
  private processResults(results: PromiseSettledResult<any>[]) {
    const labels = ['pricing', 'products', 'incentives', 'financing', 'news'];
    
    return labels.reduce((acc, label, index) => {
      const result = results[index];
      if (result.status === 'fulfilled') {
        acc[label] = { count: result.value.length, data: result.value };
      } else {
        acc[label] = { error: result.reason.message };
      }
      return acc;
    }, {} as Record<string, any>);
  }
}

// ==========================================
// FIX 6: Cache Service Improvements
// ==========================================

/**
 * Enhanced cache service with TTL and automatic cleanup
 */

interface CacheEntry<T> {
  value: T;
  expiry: number;
}

class CacheServiceFixed<T = any> {
  private cache = new Map<string, CacheEntry<T>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes
  private cleanupInterval: NodeJS.Timeout;
  
  constructor(ttl?: number) {
    if (ttl) this.defaultTTL = ttl;
    
    // Auto-cleanup expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000);
  }
  
  set(key: string, value: T, ttl?: number): void {
    const expiry = Date.now() + (ttl || this.defaultTTL);
    this.cache.set(key, { value, expiry });
  }
  
  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    
    if (!entry) return undefined;
    
    // Check if expired
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return undefined;
    }
    
    return entry.value;
  }
  
  has(key: string): boolean {
    const value = this.get(key);
    return value !== undefined;
  }
  
  clear(): void {
    console.log('🗑️ Cache cleared');
    this.cache.clear();
  }
  
  private cleanup(): void {
    const now = Date.now();
    let removed = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiry) {
        this.cache.delete(key);
        removed++;
      }
    }
    
    if (removed > 0) {
      console.log(`🧹 Cleaned up ${removed} expired cache entries`);
    }
  }
  
  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.clear();
  }
}

export {
  BaselineServiceFixed,
  getSupabaseClient,
  AdvancedQuoteBuilder,
  useBessQuoteBuilderFixed,
  AIDataCollectionServiceFixed,
  CacheServiceFixed
};
