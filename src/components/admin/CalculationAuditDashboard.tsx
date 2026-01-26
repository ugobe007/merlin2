/**
 * CALCULATION AUDIT DASHBOARD
 * ============================
 * 
 * Admin component to view calculation validation audit logs.
 * Shows SSOT compliance metrics and anomalies.
 * 
 * Created: December 22, 2025
 */

import React, { useState, useEffect } from 'react';
import { 
  Shield, AlertTriangle, CheckCircle, TrendingUp, 
  XCircle, RefreshCw, ChevronDown, ChevronUp,
  Calendar, BarChart3 
} from 'lucide-react';
import { supabase } from '@/services/supabaseClient';

interface AuditLogEntry {
  id: string;
  created_at: string;
  is_valid: boolean;
  score: number;
  warnings_count: number;
  inputs: {
    useCase: string;
    storageSizeMW: number;
    location: string;
  };
  outputs: {
    equipmentCost: number;
    totalProjectCost: number;
    paybackYears: number;
  };
  validation_result: {
    warnings: { message: string; severity: string }[];
  };
}

interface DailySummary {
  date: string;
  total_validations: number;
  valid_count: number;
  invalid_count: number;
  avg_score: number;
  compliance_rate: number;
}

export const CalculationAuditDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<DailySummary[]>([]);
  const [anomalies, setAnomalies] = useState<AuditLogEntry[]>([]);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch daily summary
      const { data: summaryData, error: summaryError } = await supabase
        .from('calculation_validation_summary')
        .select('*')
        .limit(14); // Last 2 weeks
      
      if (summaryError) throw summaryError;
      setSummary((summaryData || []) as DailySummary[]);

      // Fetch anomalies
      const { data: anomalyData, error: anomalyError } = await supabase
        .from('calculation_anomalies')
        .select('*')
        .limit(20);
      
      if (anomalyError) throw anomalyError;
      setAnomalies((anomalyData || []) as AuditLogEntry[]);
      
    } catch (err: any) {
      console.error('Failed to fetch audit data:', err);
      setError(err.message || 'Failed to fetch audit data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Calculate overall stats
  const todayStats = summary[0];
  const overallCompliance = summary.length > 0
    ? (summary.reduce((sum, d) => sum + d.compliance_rate, 0) / summary.length).toFixed(1)
    : '—';
  const totalValidations = summary.reduce((sum, d) => sum + d.total_validations, 0);
  const totalErrors = summary.reduce((sum, d) => sum + d.invalid_count, 0);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Shield className="w-7 h-7 text-purple-400" />
            Calculation Audit Dashboard
          </h1>
          <p className="text-white/60 mt-1">
            SSOT compliance monitoring and validation logs
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-xl text-white transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-400/50 rounded-xl p-4 text-red-300">
          {error}
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700/50">
          <div className="flex items-center justify-between mb-3">
            <BarChart3 className="w-6 h-6 text-blue-400" />
            <span className="text-xs text-slate-400">14 days</span>
          </div>
          <div className="text-3xl font-bold text-white">{totalValidations}</div>
          <div className="text-sm text-slate-400">Total Validations</div>
        </div>

        <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700/50">
          <div className="flex items-center justify-between mb-3">
            <CheckCircle className="w-6 h-6 text-emerald-400" />
            <span className="text-xs text-slate-400">Avg</span>
          </div>
          <div className="text-3xl font-bold text-white">{overallCompliance}%</div>
          <div className="text-sm text-slate-400">Compliance Rate</div>
        </div>

        <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700/50">
          <div className="flex items-center justify-between mb-3">
            <TrendingUp className="w-6 h-6 text-purple-400" />
            <span className="text-xs text-slate-400">Avg</span>
          </div>
          <div className="text-3xl font-bold text-white">
            {summary.length > 0 
              ? (summary.reduce((sum, d) => sum + d.avg_score, 0) / summary.length).toFixed(0)
              : '—'}
          </div>
          <div className="text-sm text-slate-400">Avg Validation Score</div>
        </div>

        <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700/50">
          <div className="flex items-center justify-between mb-3">
            <AlertTriangle className="w-6 h-6 text-amber-400" />
            <span className="text-xs text-slate-400">14 days</span>
          </div>
          <div className="text-3xl font-bold text-white">{totalErrors}</div>
          <div className="text-sm text-slate-400">Failed Validations</div>
        </div>
      </div>

      {/* Daily Trend */}
      <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700/50">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-slate-400" />
          Daily Validation Summary
        </h2>
        
        {summary.length === 0 && !loading && (
          <p className="text-slate-400 text-center py-8">No validation data yet</p>
        )}

        {summary.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-400 border-b border-slate-700">
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium text-right">Validations</th>
                  <th className="pb-3 font-medium text-right">Pass</th>
                  <th className="pb-3 font-medium text-right">Fail</th>
                  <th className="pb-3 font-medium text-right">Avg Score</th>
                  <th className="pb-3 font-medium text-right">Compliance</th>
                </tr>
              </thead>
              <tbody>
                {summary.map((day) => (
                  <tr key={day.date} className="border-b border-slate-700/50">
                    <td className="py-3 text-white">
                      {new Date(day.date).toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </td>
                    <td className="py-3 text-right text-white">{day.total_validations}</td>
                    <td className="py-3 text-right text-emerald-400">{day.valid_count}</td>
                    <td className="py-3 text-right text-red-400">{day.invalid_count}</td>
                    <td className="py-3 text-right text-white">{day.avg_score}</td>
                    <td className="py-3 text-right">
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                        day.compliance_rate >= 95
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : day.compliance_rate >= 80
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {day.compliance_rate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Anomalies */}
      <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700/50">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-400" />
          Recent Anomalies
        </h2>
        
        {anomalies.length === 0 && !loading && (
          <p className="text-slate-400 text-center py-8">
            <CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
            No anomalies detected
          </p>
        )}

        {anomalies.length > 0 && (
          <div className="space-y-2">
            {anomalies.map((entry) => (
              <div 
                key={entry.id}
                className="bg-slate-900/50 rounded-xl border border-slate-700/50 overflow-hidden"
              >
                <button
                  onClick={() => setExpandedRow(expandedRow === entry.id ? null : entry.id)}
                  className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-700/20 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <XCircle className="w-5 h-5 text-red-400" />
                    <div>
                      <div className="text-white font-medium">
                        {entry.inputs?.useCase || 'Unknown'} - {entry.inputs?.location || 'Unknown'}
                      </div>
                      <div className="text-xs text-slate-400">
                        {new Date(entry.created_at).toLocaleString()} • Score: {entry.score}
                      </div>
                    </div>
                  </div>
                  {expandedRow === entry.id ? (
                    <ChevronUp className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  )}
                </button>
                
                {expandedRow === entry.id && (
                  <div className="px-4 pb-4 space-y-3">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div className="bg-slate-800 rounded-lg p-3">
                        <div className="text-slate-400 text-xs">Storage</div>
                        <div className="text-white">{entry.inputs?.storageSizeMW} MW</div>
                      </div>
                      <div className="bg-slate-800 rounded-lg p-3">
                        <div className="text-slate-400 text-xs">Total Cost</div>
                        <div className="text-white">${entry.outputs?.totalProjectCost?.toLocaleString()}</div>
                      </div>
                      <div className="bg-slate-800 rounded-lg p-3">
                        <div className="text-slate-400 text-xs">Payback</div>
                        <div className="text-white">{entry.outputs?.paybackYears} years</div>
                      </div>
                      <div className="bg-slate-800 rounded-lg p-3">
                        <div className="text-slate-400 text-xs">Warnings</div>
                        <div className="text-white">{entry.warnings_count}</div>
                      </div>
                    </div>
                    
                    {entry.validation_result?.warnings?.length > 0 && (
                      <div className="space-y-1">
                        <div className="text-xs text-slate-400 uppercase tracking-wide">Warnings</div>
                        {entry.validation_result.warnings.map((w, i) => (
                          <div 
                            key={i}
                            className={`text-xs px-3 py-2 rounded-lg ${
                              w.severity === 'error' 
                                ? 'bg-red-500/20 text-red-300'
                                : w.severity === 'warning'
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-slate-500/20 text-slate-300'
                            }`}
                          >
                            {w.message}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CalculationAuditDashboard;
