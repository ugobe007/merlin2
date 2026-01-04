/**
 * SYSTEM HEALTH DASHBOARD
 * ======================
 * 
 * Comprehensive health monitoring dashboard for all system components.
 * Displays results from systemHealthCheck service.
 * 
 * Created: January 3, 2025
 */

import React, { useState, useEffect } from 'react';
import { Activity, CheckCircle, AlertTriangle, XCircle, RefreshCw, Database, Code, Calculator, Link, Shield, FileText, Zap, TrendingUp, BarChart3 } from 'lucide-react';
import { runSystemHealthCheck, type SystemHealthReport, type HealthCheckResult } from '@/services/systemHealthCheck';

const SystemHealthDashboard: React.FC = () => {
  const [report, setReport] = useState<SystemHealthReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastRun, setLastRun] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  useEffect(() => {
    loadHealthReport();
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        loadHealthReport();
      }, 60000); // Refresh every minute
      return () => clearInterval(interval);
    }
    return undefined;
  }, [autoRefresh]);

  const loadHealthReport = async () => {
    setLoading(true);
    try {
      const healthReport = await runSystemHealthCheck();
      setReport(healthReport);
      setLastRun(new Date().toISOString());
    } catch (error) {
      console.error('Health check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: HealthCheckResult['status']) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'fail':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-800" />;
      default:
        return <Activity className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: HealthCheckResult['status']) => {
    switch (status) {
      case 'pass':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'fail':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'error':
        return 'bg-red-100 border-red-300 text-red-900';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      'Backend Scraper': <Database className="w-4 h-4" />,
      'Parsing Logic': <Code className="w-4 h-4" />,
      'Database Schemas': <Database className="w-4 h-4" />,
      'SSOT Compliance': <Shield className="w-4 h-4" />,
      'Workflow Links': <Link className="w-4 h-4" />,
      'TrueQuote Compliance': <Shield className="w-4 h-4" />,
      'Calculation Logic': <Calculator className="w-4 h-4" />,
      'Template Formats': <FileText className="w-4 h-4" />,
      'Wizard Functionality': <Zap className="w-4 h-4" />,
      'Quote Engine': <TrendingUp className="w-4 h-4" />,
      'Merlin Metrics': <BarChart3 className="w-4 h-4" />,
    };
    return iconMap[category] || <Activity className="w-4 h-4" />;
  };

  if (loading && !report) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Running comprehensive health checks...</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 mb-4">No health report available</p>
        <button
          onClick={loadHealthReport}
          className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700"
        >
          Run Health Check
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Activity className="w-6 h-6 text-purple-600" />
            System Health Dashboard
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Last run: {lastRun ? new Date(lastRun).toLocaleString() : 'Never'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-purple-600"
            />
            <span className="text-sm text-gray-700">Auto-refresh (1 min)</span>
          </label>
          <button
            onClick={loadHealthReport}
            disabled={loading}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-700 to-slate-600 hover:from-purple-800 hover:to-slate-700 text-white px-4 py-2 rounded-lg shadow-lg shadow-purple-700/30 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Overall Status */}
      <div className={`rounded-xl p-6 border-2 ${
        report.overallStatus === 'healthy' ? 'bg-green-50 border-green-300' :
        report.overallStatus === 'degraded' ? 'bg-yellow-50 border-yellow-300' :
        'bg-red-50 border-red-300'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold mb-1">
              Overall System Health: {report.overallStatus.toUpperCase()}
            </h3>
            <p className="text-sm opacity-80">
              Score: {report.overallScore}% • 
              {report.summary.passed} passed • 
              {report.summary.warnings} warnings • 
              {report.summary.failed} failed • 
              {report.summary.errors} errors
            </p>
          </div>
          <div className="text-4xl font-bold">
            {report.overallScore}%
          </div>
        </div>
      </div>

      {/* Health Checks Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {report.checks.map((check) => (
          <div
            key={check.category}
            className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
              getStatusColor(check.status)
            } ${expandedCategory === check.category ? 'ring-2 ring-purple-500' : ''}`}
            onClick={() => setExpandedCategory(expandedCategory === check.category ? null : check.category)}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                {getCategoryIcon(check.category)}
                <h4 className="font-semibold">{check.category}</h4>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(check.status)}
                <span className="text-lg font-bold">{check.score}%</span>
              </div>
            </div>
            
            <p className="text-sm mb-2">{check.message}</p>
            
            {check.duration && (
              <p className="text-xs opacity-70">
                Duration: {check.duration}ms
              </p>
            )}

            {/* Expanded Details */}
            {expandedCategory === check.category && check.details && (
              <div className="mt-3 pt-3 border-t border-current/20">
                <details className="text-sm">
                  <summary className="cursor-pointer font-medium mb-2">View Details</summary>
                  <pre className="bg-black/10 p-2 rounded text-xs overflow-x-auto mt-2">
                    {JSON.stringify(check.details, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Summary Statistics */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-white border border-green-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-600">{report.summary.passed}</div>
          <div className="text-sm text-gray-600">Passed</div>
        </div>
        <div className="bg-white border border-yellow-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-yellow-600">{report.summary.warnings}</div>
          <div className="text-sm text-gray-600">Warnings</div>
        </div>
        <div className="bg-white border border-red-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-red-600">{report.summary.failed}</div>
          <div className="text-sm text-gray-600">Failed</div>
        </div>
        <div className="bg-white border border-red-300 rounded-lg p-4">
          <div className="text-2xl font-bold text-red-800">{report.summary.errors}</div>
          <div className="text-sm text-gray-600">Errors</div>
        </div>
      </div>
    </div>
  );
};

export default SystemHealthDashboard;

