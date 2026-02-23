import React from "react";
import {
  Cloud,
  CloudOff,
  AlertTriangle,
  RefreshCw,
  Upload,
  Download,
  Database,
  CheckCircle,
} from "lucide-react";

type DatabaseStatus = "checking" | "connected" | "disconnected" | "error";
type SyncStatus = "idle" | "syncing" | "success" | "error";
type DatabaseSyncResult = { success: boolean; message: string; data?: any; error?: string };

interface PricingDatabaseSectionProps {
  databaseStatus: DatabaseStatus;
  syncStatus: SyncStatus;
  lastSync: string | null;
  databaseStats: Record<string, any>;
  syncResult: DatabaseSyncResult | null;
  syncToDatabase: () => Promise<void>;
  loadFromDatabase: () => Promise<void>;
  runManualSync: () => Promise<void>;
  checkDatabaseStatus: () => Promise<void>;
  canSync: boolean;
}

export default function PricingDatabaseSection({
  databaseStatus,
  syncStatus,
  lastSync,
  databaseStats,
  syncResult,
  syncToDatabase,
  loadFromDatabase,
  runManualSync,
  checkDatabaseStatus,
  canSync,
}: PricingDatabaseSectionProps) {
  const getStatusIcon = () => {
    switch (databaseStatus) {
      case "connected":
        return <Cloud className="w-5 h-5 text-green-600" />;
      case "disconnected":
        return <CloudOff className="w-5 h-5 text-red-600" />;
      case "error":
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      default:
        return <RefreshCw className="w-5 h-5 text-gray-400 animate-spin" />;
    }
  };

  const getStatusColor = () => {
    switch (databaseStatus) {
      case "connected":
        return "bg-green-50 border-green-200";
      case "disconnected":
        return "bg-yellow-50 border-yellow-200";
      case "error":
        return "bg-red-50 border-red-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Supabase Database Integration</h3>
        <button
          onClick={checkDatabaseStatus}
          disabled={databaseStatus === "checking"}
          className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 flex items-center shadow-lg shadow-purple-500/25"
        >
          <RefreshCw
            className={`w-4 h-4 mr-2 ${databaseStatus === "checking" ? "animate-spin" : ""}`}
          />
          Check Status
        </button>
      </div>

      {/* Database Status */}
      <div className={`border rounded-lg p-4 ${getStatusColor()}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getStatusIcon()}
            <div>
              <h4 className="font-semibold">Database Connection</h4>
              <p className="text-sm text-gray-600">
                {databaseStatus === "connected" &&
                  "Connected to Supabase - pricing data is being persisted"}
                {databaseStatus === "disconnected" &&
                  "Database not available - running in local-only mode"}
                {databaseStatus === "error" && "Database connection error - check credentials"}
                {databaseStatus === "checking" && "Checking database connectivity..."}
              </p>
            </div>
          </div>
          {lastSync && (
            <div className="text-right text-sm text-gray-600">
              <p>Last Sync</p>
              <p className="font-mono text-xs">{new Date(lastSync).toLocaleString()}</p>
            </div>
          )}
        </div>
      </div>

      {/* Database Statistics */}
      {databaseStatus === "connected" && Object.keys(databaseStats).length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-2xl font-bold text-blue-600">
              {databaseStats.totalConfigurations || 0}
            </div>
            <div className="text-sm text-gray-600">Total Configurations</div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-2xl font-bold text-green-600">
              {databaseStats.recentDataPoints || 0}
            </div>
            <div className="text-sm text-gray-600">Recent Data Points</div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-2xl font-bold text-orange-600">
              {databaseStats.unresolvedAlerts || 0}
            </div>
            <div className="text-sm text-gray-600">Unresolved Alerts</div>
          </div>
        </div>
      )}

      {/* Sync Actions */}
      <div className="bg-white border rounded-lg p-6">
        <h4 className="font-semibold mb-4">Configuration Synchronization</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={syncToDatabase}
            disabled={syncStatus === "syncing" || databaseStatus !== "connected" || !canSync}
            className="flex items-center justify-center px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/25"
            title={!canSync ? "You do not have permission to sync to database" : ""}
          >
            <Upload className="w-4 h-4 mr-2" />
            {syncStatus === "syncing" ? "Syncing..." : "Sync to Database"}
          </button>

          <button
            onClick={loadFromDatabase}
            disabled={syncStatus === "syncing" || databaseStatus !== "connected"}
            className="flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4 mr-2" />
            Load from Database
          </button>

          <button
            onClick={runManualSync}
            disabled={syncStatus === "syncing" || databaseStatus !== "connected"}
            className="flex items-center justify-center px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Database className="w-4 h-4 mr-2" />
            Run Daily Sync
          </button>
        </div>

        <div className="mt-4 text-sm text-gray-600">
          <p>
            • <strong>Sync to Database:</strong> Upload current local configuration to Supabase
          </p>
          <p>
            • <strong>Load from Database:</strong> Download and apply configuration from Supabase
          </p>
          <p>
            • <strong>Run Daily Sync:</strong> Execute complete daily price validation and sync
            process
          </p>
        </div>
      </div>

      {/* Sync Results */}
      {syncResult && (
        <div
          className={`border rounded-lg p-4 ${syncResult.success ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}
        >
          <div className="flex items-center space-x-2">
            {syncResult.success ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-600" />
            )}
            <h4 className="font-semibold">
              {syncResult.success ? "Sync Successful" : "Sync Failed"}
            </h4>
          </div>
          <p className="text-sm mt-2">{syncResult.message}</p>
          {syncResult.error && (
            <p className="text-sm text-red-600 mt-1">Error: {syncResult.error}</p>
          )}
          {syncResult.data &&
            typeof syncResult.data === "object" &&
            "summary" in syncResult.data && (
              <details className="mt-2">
                <summary className="text-sm cursor-pointer">View Sync Report</summary>
                <pre className="text-xs bg-gray-100 p-2 rounded mt-2 overflow-x-auto">
                  {JSON.stringify(syncResult.data, null, 2)}
                </pre>
              </details>
            )}
        </div>
      )}

      {/* Daily Sync Service Status */}
      <div className="bg-white border rounded-lg p-6">
        <h4 className="font-semibold mb-4">Daily Sync Service</h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Service Status</span>
            <span
              className={`px-2 py-1 rounded text-xs ${databaseStatus === "connected" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}
            >
              {databaseStatus === "connected" ? "Running" : "Offline"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Next Scheduled Sync</span>
            <span className="text-sm font-mono">Daily at 6:00 AM UTC</span>
          </div>
          <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
            <p>The daily sync service automatically:</p>
            <ul className="mt-2 space-y-1 ml-4 list-disc">
              <li>Validates pricing against market sources (NREL, Bloomberg, Wood Mackenzie)</li>
              <li>
                Updates vendor-specific pricing data (Dynapower, Sinexcel, Great Power, Mainspring)
              </li>
              <li>Backs up pricing configurations to Supabase</li>
              <li>Processes and cleans up pricing alerts</li>
              <li>Generates daily pricing reports and statistics</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
