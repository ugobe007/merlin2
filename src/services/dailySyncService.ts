// Daily Sync Service - STUB VERSION
// ⚠️ THIS SERVICE IS DEPRECATED AND NON-FUNCTIONAL
// Original archived at: src/services/ARCHIVE/dailySyncService.ts.old
// TODO: Complete rewrite to use useCaseService and MASTER_SCHEMA.sql structure

// Type definitions for compatibility
type DatabaseSyncResult = { success: boolean; message: string; error?: string };

export interface SyncJob {
  id: string;
  name: string;
  schedule: string;
  lastRun?: string;
  nextRun?: string;
  status: 'idle' | 'running' | 'success' | 'error';
  errorMessage?: string;
}

export interface SyncReport {
  timestamp: string;
  totalJobs: number;
  successfulJobs: number;
  failedJobs: number;
  duration: number;
  jobs: SyncJob[];
  errors: string[];
  warnings: string[];
  summary: string;
}

// Stub implementation for compatibility
export class DailySyncService {
  private isInitialized = false;
  private syncJobs: SyncJob[] = [];

  constructor() {
    console.warn('⚠️ DailySyncService instantiated but is non-functional (deprecated)');
    this.isInitialized = true;
  }

  async startService(): Promise<void> {
    console.warn('⚠️ DailySyncService.startService() called but is non-functional');
    return;
  }

  stopService(): void {
    console.warn('⚠️ DailySyncService.stopService() called but is non-functional');
  }

  async runDailySync(): Promise<SyncReport> {
    console.warn('⚠️ DailySyncService.runDailySync() called but is non-functional');
    return {
      timestamp: new Date().toISOString(),
      totalJobs: 0,
      successfulJobs: 0,
      failedJobs: 0,
      duration: 0,
      jobs: [],
      errors: ['Service deprecated - see MASTER_SCHEMA.sql for new structure'],
      warnings: ['DailySyncService requires rewrite to use useCaseService'],
      summary: 'Service non-functional (deprecated)'
    };
  }

  getSyncJobs(): SyncJob[] {
    return [];
  }

  async runJob(jobId: string): Promise<SyncJob> {
    console.warn(`⚠️ DailySyncService.runJob(${jobId}) called but is non-functional`);
    return {
      id: jobId,
      name: 'Deprecated Job',
      schedule: 'N/A',
      status: 'error',
      errorMessage: 'DailySyncService deprecated'
    };
  }

  getServiceStatus() {
    return {
      isRunning: false,
      nextSync: 'N/A - Service deprecated',
      lastSync: 'N/A - Service deprecated'
    };
  }

  async runManualSync(): Promise<SyncReport> {
    return this.runDailySync();
  }
}

// Export singleton instance for compatibility
export const dailySyncService = new DailySyncService();
