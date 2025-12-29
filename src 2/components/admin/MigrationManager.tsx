/**
 * Migration Manager Component
 * 
 * Purpose: Admin UI for managing the migration from useCaseTemplates.ts to database
 * Features: Run migration, validate, rollback, cache management
 */

import React, { useState, useEffect } from 'react';
import {
  migrateTemplatesToDatabase,
  validateMigration,
  rollbackMigration,
  getMigrationStatus,
  type MigrationResult
} from '../../services/templateMigrationService';
import {
  clearExpiredCache,
  clearAllCache,
  getCacheStats
} from '../../services/dataIntegrationService';

interface MigrationStatus {
  templatesInCode: number;
  templatesInDatabase: number;
  equipmentInCode: number;
  equipmentInDatabase: number;
  needsMigration: boolean;
  details: Array<{
    slug: string;
    name: string;
    inDatabase: boolean;
    equipmentInCode: number;
    equipmentInDatabase: number;
  }>;
}

interface CacheStats {
  total: number;
  avgExecutionTimeMs: number;
  oldestEntry: any;
  newestEntry: any;
}

const MigrationManager: React.FC = () => {
  const [status, setStatus] = useState<MigrationStatus | null>(null);
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MigrationResult | null>(null);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStatus();
    loadCacheStats();
  }, []);

  const loadStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const statusData = await getMigrationStatus();
      setStatus(statusData);
    } catch (err: any) {
      setError(err.message || 'Failed to load migration status');
    } finally {
      setLoading(false);
    }
  };

  const loadCacheStats = async () => {
    try {
      const stats = await getCacheStats();
      setCacheStats(stats);
    } catch (err: any) {
      console.error('Failed to load cache stats:', err);
    }
  };

  const handleMigrate = async () => {
    if (!confirm('This will migrate all use case templates and equipment from code to the database. Continue?')) {
      return;
    }

    setError(null);
    setResult(null);
    try {
      const migrationResult = await migrateTemplatesToDatabase();
      setResult(migrationResult);
      await loadStatus();
      await loadCacheStats();
    } catch (err: any) {
      setError(err.message || 'Migration failed');
    }
  };

  const handleValidate = async () => {
    setError(null);
    setValidationResult(null);
    try {
      const validation = await validateMigration();
      setValidationResult(validation);
    } catch (err: any) {
      setError(err.message || 'Validation failed');
    }
  };

  const handleRollback = async () => {
    if (!confirm('⚠️ WARNING: This will DELETE all migrated data from the database and cannot be undone. Are you sure?')) {
      return;
    }

    setError(null);
    try {
      const rollbackResult = await rollbackMigration();
      alert(`Rollback complete. Deleted: ${rollbackResult.templatesDeleted} templates.`);
      await loadStatus();
    } catch (err: any) {
      setError(err.message || 'Rollback failed');
    }
  };

  const handleClearExpiredCache = async () => {
    try {
      const deleted = await clearExpiredCache();
      alert(`Cleared ${deleted} expired cache entries`);
      await loadCacheStats();
    } catch (err: any) {
      setError(err.message || 'Failed to clear expired cache');
    }
  };

  const handleClearAllCache = async () => {
    if (!confirm('Clear ALL cache entries? This will force recalculation for all requests.')) {
      return;
    }

    try {
      const deleted = await clearAllCache();
      alert(`Cleared ${deleted} cache entries`);
      await loadCacheStats();
    } catch (err: any) {
      setError(err.message || 'Failed to clear cache');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">🔄 Data Migration Manager</h2>
        <button
          onClick={loadStatus}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold transition-all disabled:opacity-50"
        >
          ↻ Refresh Status
        </button>
      </div>

      {error && (
        <div className="bg-red-600/20 border border-red-500/50 p-4 rounded-lg">
          <p className="text-red-300">
            <strong>❌ Error:</strong> {error}
          </p>
        </div>
      )}

      {status && (
        <>
          <div className="bg-slate-800/50 p-6 rounded-lg border border-purple-500/30">
            <h3 className="text-xl font-bold text-white mb-4">📊 Migration Status</h3>
            
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-600/20 p-4 rounded-lg border border-blue-500/30">
                <p className="text-blue-300 text-sm mb-1">IN CODE</p>
                <p className="text-white font-bold text-3xl">{status.templatesInCode}</p>
              </div>
              <div className="bg-green-600/20 p-4 rounded-lg border border-green-500/30">
                <p className="text-green-300 text-sm mb-1">IN DATABASE</p>
                <p className="text-white font-bold text-3xl">{status.templatesInDatabase}</p>
              </div>
              <div className="bg-orange-600/20 p-4 rounded-lg border border-orange-500/30">
                <p className="text-orange-300 text-sm mb-1">NEEDS MIGRATION</p>
                <p className="text-white font-bold text-3xl">{status.templatesInCode - status.templatesInDatabase}</p>
              </div>
            </div>

            <div className="bg-slate-900/50 rounded-lg p-4">
              <h4 className="text-white font-semibold mb-3">Template Details</h4>
              <div className="space-y-2">
                {status.details.map((template) => (
                  <div
                    key={template.slug}
                    className="flex items-center justify-between py-2 border-b border-slate-700/50 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{template.inDatabase ? '✅' : '❌'}</span>
                      <div>
                        <p className="text-white font-medium">{template.slug}</p>
                        <p className="text-gray-400 text-sm">
                          Code: {template.equipmentInCode} | DB: {template.equipmentInDatabase} equipment
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 p-6 rounded-lg border border-purple-500/30">
            <h3 className="text-xl font-bold text-white mb-4">⚡ Migration Actions</h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <button
                onClick={handleMigrate}
                disabled={!status || (status.templatesInCode - status.templatesInDatabase) === 0}
                className="bg-gradient-to-br from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 p-6 rounded-lg text-white font-semibold transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="text-3xl mb-2">🚀</div>
                <div className="text-lg mb-1">Run Migration</div>
                <div className="text-sm text-green-100">
                  {status && (status.templatesInCode - status.templatesInDatabase) === 0
                    ? 'All templates already migrated'
                    : `Migrate ${status ? status.templatesInCode - status.templatesInDatabase : 0} templates`
                  }
                </div>
              </button>

              <button
                onClick={handleValidate}
                disabled={!status || status.templatesInDatabase === 0}
                className="bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 p-6 rounded-lg text-white font-semibold transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="text-3xl mb-2">✓</div>
                <div className="text-lg mb-1">Validate Migration</div>
                <div className="text-sm text-blue-100">Check data integrity</div>
              </button>

              <button
                onClick={handleRollback}
                disabled={!status || status.templatesInDatabase === 0}
                className="bg-gradient-to-br from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 p-6 rounded-lg text-white font-semibold transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="text-3xl mb-2">⚠️</div>
                <div className="text-lg mb-1">Rollback Migration</div>
                <div className="text-sm text-red-100">⚠️ Deletes all migrated data</div>
              </button>

              <button
                onClick={loadStatus}
                disabled={loading}
                className="bg-gradient-to-br from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 p-6 rounded-lg text-white font-semibold transition-all shadow-lg disabled:opacity-50"
              >
                <div className="text-3xl mb-2">↻</div>
                <div className="text-lg mb-1">Refresh Status</div>
                <div className="text-sm text-purple-100">Check current state</div>
              </button>
            </div>
          </div>
        </>
      )}

      {result && (
        <div className={`p-6 rounded-lg border ${
          result.success 
            ? 'bg-green-600/20 border-green-500/50' 
            : 'bg-red-600/20 border-red-500/50'
        }`}>
          <h3 className="text-xl font-bold text-white mb-4">
            {result.success ? '✅ Migration Complete' : '❌ Migration Failed'}
          </h3>
          
          <div className="grid md:grid-cols-3 gap-4 mb-4">
            <div>
              <p className="text-white text-sm mb-1">Templates Created</p>
              <p className="text-white font-bold text-2xl">{result.templatesCreated}</p>
            </div>
            <div>
              <p className="text-white text-sm mb-1">Equipment Created</p>
              <p className="text-white font-bold text-2xl">{result.equipmentCreated}</p>
            </div>
            <div>
              <p className="text-white text-sm mb-1">Errors</p>
              <p className="text-white font-bold text-2xl">{result.errors.length}</p>
            </div>
          </div>

          {result.errors.length > 0 && (
            <div className="bg-black/30 rounded p-3 mb-4">
              <p className="text-white font-semibold mb-2">Errors:</p>
              <ul className="text-red-300 text-sm space-y-1">
                {result.errors.map((error: string, i: number) => (
                  <li key={i}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="bg-black/30 rounded p-3">
            <p className="text-white font-semibold mb-2">Details:</p>
            <div className="space-y-2">
              {result.details.map((detail: { templateId: string; name: string; equipmentCount: number }) => (
                <div key={detail.templateId} className="text-sm">
                  <span className="text-green-300">✓</span>
                  <span className="text-white ml-2">{detail.name}</span>
                  <span className="text-gray-400 ml-2">({detail.equipmentCount} equipment)</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {validationResult && (
        <div className={`p-6 rounded-lg border ${
          validationResult.valid 
            ? 'bg-green-600/20 border-green-500/50' 
            : 'bg-orange-600/20 border-orange-500/50'
        }`}>
          <h3 className="text-xl font-bold text-white mb-4">
            {validationResult.valid ? '✅ Validation Passed' : '⚠️ Validation Issues Found'}
          </h3>
          
          {validationResult.issues && validationResult.issues.length > 0 && (
            <div className="bg-black/30 rounded p-3">
              <p className="text-white font-semibold mb-2">Issues:</p>
              <ul className="text-orange-300 text-sm space-y-1">
                {validationResult.issues.map((issue: string, i: number) => (
                  <li key={i}>• {issue}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {cacheStats && (
        <div className="bg-slate-800/50 p-6 rounded-lg border border-purple-500/30">
          <h3 className="text-xl font-bold text-white mb-4">⚡ Cache Statistics</h3>
          
          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <div className="bg-purple-600/20 p-4 rounded-lg border border-purple-500/30">
              <p className="text-purple-300 text-sm mb-1">TOTAL ENTRIES</p>
              <p className="text-white font-bold text-3xl">{cacheStats.total}</p>
            </div>
            <div className="bg-blue-600/20 p-4 rounded-lg border border-blue-500/30">
              <p className="text-blue-300 text-sm mb-1">AVG TIME</p>
              <p className="text-white font-bold text-3xl">{Math.round(cacheStats.avgExecutionTimeMs)}ms</p>
            </div>
            <div className="bg-green-600/20 p-4 rounded-lg border border-green-500/30">
              <p className="text-green-300 text-sm mb-1">OLDEST ENTRY</p>
              <p className="text-white font-bold text-lg">
                {cacheStats.oldestEntry ? new Date(cacheStats.oldestEntry).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            <div className="bg-orange-600/20 p-4 rounded-lg border border-orange-500/30">
              <p className="text-orange-300 text-sm mb-1">NEWEST ENTRY</p>
              <p className="text-white font-bold text-lg">
                {cacheStats.newestEntry ? new Date(cacheStats.newestEntry).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleClearExpiredCache}
              className="bg-yellow-600 hover:bg-yellow-500 text-white px-6 py-3 rounded-lg font-semibold transition-all"
            >
              🧹 Clear Expired Cache
            </button>
            <button
              onClick={handleClearAllCache}
              className="bg-red-600 hover:bg-red-500 text-white px-6 py-3 rounded-lg font-semibold transition-all"
            >
              🗑️ Clear All Cache
            </button>
          </div>
        </div>
      )}

      <div className="bg-blue-600/20 border border-blue-500/50 p-4 rounded-lg">
        <p className="text-blue-300 text-sm">
          <strong>ℹ️ About Migration:</strong> This tool migrates use case templates from <code className="bg-black/30 px-2 py-1 rounded">useCaseTemplates.ts</code> to the database.
          After migration, the system will use the database as the primary source, with static files as a fallback.
        </p>
      </div>
    </div>
  );
};

export default MigrationManager;
