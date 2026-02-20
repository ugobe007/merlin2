/**
 * Buffer Service - Wizard State Persistence
 * 
 * Handles saving/loading wizard state with:
 * - Version control
 * - Migration support
 * - Local + remote storage
 * - Session management
 * 
 * VERSION 1.0.0 - January 2025
 */

import type { WizardState } from '@/components/wizard/v6/types';

// ============================================================================
// TYPES
// ============================================================================

export interface WizardBuffer {
  version: string;
  state: WizardState;
  timestamp: number;
  sessionId: string;
  userId?: string;
  metadata: BufferMetadata;
}

export interface BufferMetadata {
  deviceType: string;
  browser: string;
  completionPercentage: number;
  lastStep: number;
  industry?: string;
}

export interface BufferInfo {
  exists: boolean;
  age: number;
  version: string;
  completionPercentage: number;
}

// ============================================================================
// BUFFER SERVICE CLASS
// ============================================================================

class BufferService {
  private readonly BUFFER_KEY = 'merlin_wizard_buffer';
  private readonly SESSION_KEY = 'merlin_session_id';
  private readonly VERSION = '1.2.0'; // Updated for calculations.base/selected and magicFit support
  private readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  private autoSaveTimeout: NodeJS.Timeout | null = null;

  // ========================================
  // PUBLIC API
  // ========================================

  /**
   * Save wizard state to localStorage and optionally to database
   */
  save(state: WizardState): boolean {
    try {
      const buffer: WizardBuffer = {
        version: this.VERSION,
        state,
        timestamp: Date.now(),
        sessionId: this.getOrCreateSessionId(),
        userId: this.getUserId(),
        metadata: this.generateMetadata(state),
      };

      // Save to localStorage (synchronous, immediate)
      localStorage.setItem(this.BUFFER_KEY, JSON.stringify(buffer));

      // Async backup to Supabase (non-blocking, fire-and-forget)
      this.saveToDatabase(buffer).catch((err) => {
        console.warn('Failed to backup wizard state to database:', err);
      });

      return true;
    } catch (error) {
      console.error('Failed to save wizard state:', error);
      return false;
    }
  }

  /**
   * Load wizard state from localStorage or database
   */
  load(): WizardState | null {
    try {
      // Try localStorage first (fast, synchronous)
      const localBuffer = this.loadFromLocalStorage();
      if (localBuffer && this.isValid(localBuffer)) {
        // Migrate if needed
        const migrated = this.migrate(localBuffer);
        return migrated.state;
      }

      // Try database (async, slower)
      // Note: This would require async/await in real implementation
      // For now, return null if localStorage fails
      return null;
    } catch (error) {
      console.error('Failed to load wizard state:', error);
      return null;
    }
  }

  /**
   * Clear wizard state from localStorage and database
   */
  clear(): void {
    try {
      localStorage.removeItem(this.BUFFER_KEY);
      this.clearFromDatabase().catch((err) => {
        console.warn('Failed to clear wizard state from database:', err);
      });
    } catch (error) {
      console.error('Failed to clear wizard state:', error);
    }
  }

  /**
   * Auto-save with debouncing
   * Prevents excessive saves during rapid state changes
   */
  autoSave(state: WizardState, delayMs: number = 1000): void {
    // Debounce auto-save
    if (this.autoSaveTimeout) {
      clearTimeout(this.autoSaveTimeout);
    }

    this.autoSaveTimeout = setTimeout(() => {
      this.save(state);
    }, delayMs);
  }

  /**
   * Get buffer information without loading full state
   */
  getBufferInfo(): BufferInfo | null {
    const buffer = this.loadFromLocalStorage();
    if (!buffer) return null;

    return {
      exists: true,
      age: Date.now() - buffer.timestamp,
      version: buffer.version,
      completionPercentage: buffer.metadata.completionPercentage,
    };
  }

  /**
   * Check if a valid buffer exists
   */
  hasValidBuffer(): boolean {
    const buffer = this.loadFromLocalStorage();
    return buffer !== null && this.isValid(buffer);
  }

  /**
   * Get current session ID
   */
  getSessionId(): string {
    return this.getOrCreateSessionId();
  }

  // ========================================
  // PRIVATE HELPERS
  // ========================================

  private loadFromLocalStorage(): WizardBuffer | null {
    if (typeof window === 'undefined') return null;

    const stored = localStorage.getItem(this.BUFFER_KEY);
    if (!stored) return null;

    try {
      return JSON.parse(stored) as WizardBuffer;
    } catch {
      return null;
    }
  }

  private isValid(buffer: WizardBuffer): boolean {
    // Check if buffer is not expired
    const age = Date.now() - buffer.timestamp;
    if (age > this.SESSION_TIMEOUT) {
      return false;
    }

    // Check if buffer has required fields
    if (!buffer.state || !buffer.version) {
      return false;
    }

    // Check if state has minimum required fields
    if (!buffer.state.zipCode && !buffer.state.industry) {
      return false;
    }

    return true;
  }

  /**
   * Migrate buffer from older versions to current version
   */
  private migrate(buffer: WizardBuffer): WizardBuffer {
    const currentVersion = this.VERSION;

    // Already current version - but check for schema violations
    if (buffer.version === currentVersion) {
      // ✅ MIGRATION: Remove old derived values from useCaseData (Step 3 no longer computes these)
      // These should only exist in state.calculations (Step 5 SSOT)
      if (buffer.state.useCaseData) {
        const useCaseData = buffer.state.useCaseData as Record<string, unknown>;
        // Remove old Step 3 computed values (they violate the new contract)
        if ('estimatedAnnualKwh' in useCaseData || 'peakDemandKw' in useCaseData) {
          if (import.meta.env.DEV) console.log('🔧 Migrating: Removing old Step 3 derived values from useCaseData');
          const { estimatedAnnualKwh: _e, peakDemandKw: _p, ...cleanUseCaseData } = useCaseData;
          buffer.state.useCaseData = cleanUseCaseData as typeof buffer.state.useCaseData;
          if (import.meta.env.DEV) console.log('✅ Migration complete: Derived values removed (TrueQuote is SSOT)');
        }
      }
      return buffer;
    }

    // Migration: v1.0.0 → v1.1.0 (example)
    // Add migration logic here as versions evolve
    if (buffer.version === '1.0.0') {
      // Add new fields with defaults
      buffer.state = {
        ...buffer.state,
        // Example: Add new optional fields
        // newField: buffer.state.newField || defaultValue,
      };
      buffer.version = currentVersion;
    }

    // Future migrations can be added here
    // if (buffer.version === '1.1.0' && currentVersion === '1.2.0') { ... }

    // Always clean up old derived values regardless of version
    if (buffer.state.useCaseData) {
      const useCaseData = buffer.state.useCaseData as Record<string, unknown>;
      if ('estimatedAnnualKwh' in useCaseData || 'peakDemandKw' in useCaseData) {
        if (import.meta.env.DEV) console.log('🔧 Migrating: Removing old Step 3 derived values from useCaseData');
        const { estimatedAnnualKwh: _e2, peakDemandKw: _p2, ...cleanUseCaseData } = useCaseData;
        buffer.state.useCaseData = cleanUseCaseData as typeof buffer.state.useCaseData;
      }
    }

    return buffer;
  }

  private getOrCreateSessionId(): string {
    if (typeof window === 'undefined') return 'server-session';

    let sessionId = sessionStorage.getItem(this.SESSION_KEY);
    if (!sessionId) {
      sessionId = this.generateSessionId();
      sessionStorage.setItem(this.SESSION_KEY, sessionId);
    }

    return sessionId;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getUserId(): string | undefined {
    // TODO: Get from auth service when implemented
    // For now, return undefined (anonymous sessions)
    return undefined;
  }

  private generateMetadata(state: WizardState): BufferMetadata {
    const totalSteps = 6;
    
    // Calculate current step based on state
    let currentStep = 1;
    if (state.industry) currentStep = 2;
    if (state.useCaseData && Object.keys(state.useCaseData).length > 0) currentStep = 3;
    if (state.selectedOptions && state.selectedOptions.length > 0) currentStep = 4;
    if (state.calculations) currentStep = 5;
    if (state.calculations && state.selectedPowerLevel) currentStep = 6;

    const completionPercentage = Math.round((currentStep / totalSteps) * 100);

    return {
      deviceType: this.getDeviceType(),
      browser: this.getBrowser(),
      completionPercentage,
      lastStep: currentStep,
      industry: state.industry || undefined,
    };
  }

  private getDeviceType(): string {
    if (typeof window === 'undefined') return 'server';
    
    const ua = navigator.userAgent;
    if (/mobile/i.test(ua)) return 'mobile';
    if (/tablet/i.test(ua)) return 'tablet';
    return 'desktop';
  }

  private getBrowser(): string {
    if (typeof window === 'undefined') return 'server';
    
    const ua = navigator.userAgent;
    if (ua.includes('Chrome') && !ua.includes('Edg')) return 'chrome';
    if (ua.includes('Firefox')) return 'firefox';
    if (ua.includes('Safari') && !ua.includes('Chrome')) return 'safari';
    if (ua.includes('Edg')) return 'edge';
    return 'unknown';
  }

  // ========================================
  // DATABASE (ASYNC) - TODO: Implement
  // ========================================

  /**
   * Save buffer to Supabase database (async backup)
   * This is a fire-and-forget operation - failures are logged but don't block
   */
  private async saveToDatabase(_buffer: WizardBuffer): Promise<void> {
    // TODO: Implement Supabase save
    // This would call your Supabase client
    /*
    import { supabase } from '@/services/supabaseClient';
    
    const { error } = await supabase
      .from('wizard_buffers')
      .upsert({
        session_id: buffer.sessionId,
        user_id: buffer.userId,
        state: buffer.state,
        version: buffer.version,
        timestamp: buffer.timestamp,
        metadata: buffer.metadata,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'session_id'
      });
    
    if (error) {
      throw new Error(`Database save failed: ${error.message}`);
    }
    */
    
    // Placeholder - remove when implementing
    return Promise.resolve();
  }

  /**
   * Clear buffer from Supabase database
   */
  private async clearFromDatabase(): Promise<void> {
    // TODO: Implement Supabase clear
    /*
    import { supabase } from '@/services/supabaseClient';
    
    const sessionId = this.getOrCreateSessionId();
    const { error } = await supabase
      .from('wizard_buffers')
      .delete()
      .eq('session_id', sessionId);
    
    if (error) {
      throw new Error(`Database clear failed: ${error.message}`);
    }
    */
    
    // Placeholder - remove when implementing
    return Promise.resolve();
  }
}

// ============================================================================
// EXPORT SINGLETON
// ============================================================================

export const bufferService = new BufferService();
export default bufferService;
