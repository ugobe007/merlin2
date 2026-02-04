/**
 * Wizard Health Dashboard V2 - Enhanced with admin alerts and auto-fix tracking
 * 
 * NEW FEATURES (Feb 4, 2026):
 * - Admin alert section (database, API, network issues)
 * - Auto-fix status badges
 * - Clear admin alerts button
 * - Enhanced metrics showing auto-fix count
 */

import React, { useEffect, useState } from 'react';
import { wizardHealthMonitor } from '@/services/wizardHealthMonitor';
import { wizardAIAgent } from '@/services/wizardAIAgentV2';

export default function WizardHealthDashboard() {
  const [report, setReport] = useState<any>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    updateReport();

    let interval: number | null = null;
    if (autoRefresh) {
      interval = window.setInterval(updateReport, 5000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const updateReport = () => {
    const latest = wizardAIAgent.getLatestReport();
    setReport(latest);
  };

  const handleClearHistory = () => {
    wizardHealthMonitor.clear();
    updateReport();
  };

  const handleClearAdminAlert = (alertId: string) => {
    wizardAIAgent.clearAdminAlert(alertId);
    updateReport();
  };

  if (!report) {
    return (
      <div style={{ padding: 20, background: '#1a1a2e', color: '#fff' }}>
        <h2>🤖 Wizard Health Dashboard V2</h2>
        <p>No health data available. Waiting for metrics...</p>
      </div>
    );
  }

  const statusColor = {
    healthy: '#22c55e',
    warning: '#f59e0b',
    critical: '#ef4444',
  }[report.status];

  return (
    <div style={{ padding: 20, background: '#1a1a2e', color: '#fff', fontFamily: 'monospace', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0 }}>🤖 Wizard Health Dashboard V2</h2>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ fontSize: 12, opacity: 0.7 }}>Auto-fixes: {report.autoFixesApplied}</span>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            Auto-refresh (5s)
          </label>
          <button
            onClick={updateReport}
            style={{
              padding: '8px 16px',
              background: '#3b82f6',
              border: 'none',
              borderRadius: 6,
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            Refresh
          </button>
          <button
            onClick={handleClearHistory}
            style={{
              padding: '8px 16px',
              background: '#ef4444',
              border: 'none',
              borderRadius: 6,
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            Clear History
          </button>
        </div>
      </div>

      {/* Status Badge */}
      <div
        style={{
          display: 'inline-block',
          padding: '10px 20px',
          borderRadius: 8,
          background: statusColor,
          color: '#fff',
          fontWeight: 'bold',
          fontSize: 18,
          marginBottom: 30,
        }}
      >
        {report.status === 'healthy' && '✅'} 
        {report.status === 'warning' && '⚠️'} 
        {report.status === 'critical' && '🔴'} 
        Status: {report.status.toUpperCase()}
      </div>

      {/* Admin Alerts Section - HIGHEST PRIORITY */}
      {report.adminAlerts && report.adminAlerts.length > 0 && (
        <div style={{ marginBottom: 30 }}>
          <h3 style={{ marginBottom: 10, color: '#ef4444' }}>🚨 ADMIN ALERTS ({report.adminAlerts.length})</h3>
          <p style={{ fontSize: 12, opacity: 0.8, marginBottom: 15 }}>
            These issues require administrator intervention (database, API, infrastructure problems)
          </p>
          {report.adminAlerts.map((alert: any) => (
            <div
              key={alert.id}
              style={{
                padding: 20,
                background: alert.severity === 'critical' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
                border: `2px solid ${alert.severity === 'critical' ? '#ef4444' : '#f59e0b'}`,
                borderRadius: 8,
                marginBottom: 16,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 10 }}>
                <div>
                  <span
                    style={{
                      padding: '4px 10px',
                      borderRadius: 4,
                      background: alert.severity === 'critical' ? '#ef4444' : '#f59e0b',
                      fontSize: 12,
                      fontWeight: 'bold',
                      marginRight: 10,
                    }}
                  >
                    {alert.severity.toUpperCase()}
                  </span>
                  <span
                    style={{
                      padding: '4px 10px',
                      borderRadius: 4,
                      background: 'rgba(255,255,255,0.1)',
                      fontSize: 12,
                      marginRight: 10,
                    }}
                  >
                    {alert.category}
                  </span>
                  <strong style={{ fontSize: 16 }}>{alert.title}</strong>
                </div>
                <button
                  onClick={() => handleClearAdminAlert(alert.id)}
                  style={{
                    padding: '4px 12px',
                    background: 'rgba(34,197,94,0.2)',
                    border: '1px solid #22c55e',
                    borderRadius: 4,
                    color: '#22c55e',
                    cursor: 'pointer',
                    fontSize: 12,
                  }}
                >
                  Resolved
                </button>
              </div>
              <p style={{ margin: '10px 0', fontSize: 14, lineHeight: 1.6 }}>
                {alert.description}
              </p>
              <div style={{ marginTop: 12, padding: 12, background: 'rgba(234,179,8,0.1)', borderRadius: 6 }}>
                <strong style={{ color: '#fbbf24', fontSize: 13 }}>⚡ ACTION REQUIRED:</strong>
                <pre style={{ margin: '8px 0 0 0', fontSize: 12, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                  {alert.actionRequired}
                </pre>
              </div>
              {alert.affectedUsers && (
                <div style={{ marginTop: 10, fontSize: 12, opacity: 0.8 }}>
                  👥 Affected Users: ~{alert.affectedUsers}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Regular Issues */}
      {report.issues.length > 0 && (
        <div style={{ marginBottom: 30 }}>
          <h3 style={{ marginBottom: 10 }}>🚨 Issues ({report.issues.length})</h3>
          {report.issues.map((issue: any) => {
            const autoFixBadge = issue.autoFixAttempted ? (
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: 4,
                  background: issue.autoFixSuccess ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)',
                  color: issue.autoFixSuccess ? '#22c55e' : '#ef4444',
                  fontSize: 11,
                  marginLeft: 10,
                  border: `1px solid ${issue.autoFixSuccess ? '#22c55e' : '#ef4444'}`,
                }}
              >
                {issue.autoFixSuccess ? '✅ AUTO-FIXED' : '⚠️ AUTO-FIX FAILED'}
              </span>
            ) : issue.autoFixAvailable ? (
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: 4,
                  background: 'rgba(59,130,246,0.2)',
                  color: '#3b82f6',
                  fontSize: 11,
                  marginLeft: 10,
                  border: '1px solid #3b82f6',
                }}
              >
                🤖 AUTO-FIX AVAILABLE
              </span>
            ) : null;

            const adminBadge = issue.requiresAdmin ? (
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: 4,
                  background: 'rgba(239,68,68,0.2)',
                  color: '#ef4444',
                  fontSize: 11,
                  marginLeft: 10,
                  border: '1px solid #ef4444',
                }}
              >
                🔴 REQUIRES ADMIN
              </span>
            ) : null;

            return (
              <div
                key={issue.id}
                style={{
                  padding: 16,
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: 8,
                  marginBottom: 12,
                  borderLeft: `4px solid ${
                    issue.severity === 'critical' ? '#ef4444' :
                    issue.severity === 'high' ? '#f59e0b' :
                    issue.severity === 'medium' ? '#3b82f6' : '#6b7280'
                  }`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div>
                    <strong style={{ fontSize: 16 }}>{issue.title}</strong>
                    {autoFixBadge}
                    {adminBadge}
                  </div>
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: 4,
                      background: 'rgba(255,255,255,0.1)',
                      fontSize: 12,
                    }}
                  >
                    {issue.severity.toUpperCase()}
                  </span>
                </div>
                <p style={{ margin: '8px 0', fontSize: 14, lineHeight: 1.5, opacity: 0.9 }}>
                  {issue.description}
                </p>
                {issue.suggestedFix && (
                  <div style={{ marginTop: 12, padding: 12, background: 'rgba(34,197,94,0.1)', borderRadius: 6 }}>
                    <strong style={{ color: '#22c55e', fontSize: 13 }}>💡 Suggested Fix:</strong>
                    <pre style={{ margin: '8px 0 0 0', fontSize: 12, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                      {issue.suggestedFix}
                    </pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Metrics Snapshot */}
      <div style={{ marginBottom: 30 }}>
        <h3 style={{ marginBottom: 10 }}>📊 Metrics Snapshot</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 15 }}>
          <div style={{ padding: 15, background: 'rgba(255,255,255,0.05)', borderRadius: 8 }}>
            <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 5 }}>Total Sessions</div>
            <div style={{ fontSize: 24, fontWeight: 'bold' }}>{report.metricsSnapshot.totalSessions}</div>
          </div>
          <div style={{ padding: 15, background: 'rgba(255,255,255,0.05)', borderRadius: 8 }}>
            <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 5 }}>Error Rate</div>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: report.metricsSnapshot.errorRate > 0.1 ? '#ef4444' : '#22c55e' }}>
              {(report.metricsSnapshot.errorRate * 100).toFixed(1)}%
            </div>
          </div>
          <div style={{ padding: 15, background: 'rgba(255,255,255,0.05)', borderRadius: 8 }}>
            <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 5 }}>Bottlenecks</div>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: report.metricsSnapshot.bottlenecks.length > 0 ? '#f59e0b' : '#22c55e' }}>
              {report.metricsSnapshot.bottlenecks.length}
            </div>
          </div>
          <div style={{ padding: 15, background: 'rgba(255,255,255,0.05)', borderRadius: 8 }}>
            <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 5 }}>Auto-Fixes</div>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#3b82f6' }}>
              {report.autoFixesApplied}
            </div>
          </div>
        </div>
      </div>

      {/* Bottleneck Table */}
      {report.metricsSnapshot.bottlenecks.length > 0 && (
        <div style={{ marginBottom: 30 }}>
          <h3 style={{ marginBottom: 10 }}>🚦 Step Bottlenecks</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.05)' }}>
                <th style={{ padding: 12, textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Step</th>
                <th style={{ padding: 12, textAlign: 'right', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Exit Rate</th>
                <th style={{ padding: 12, textAlign: 'right', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Gate Failures</th>
                <th style={{ padding: 12, textAlign: 'right', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Avg Time</th>
                <th style={{ padding: 12, textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Common Errors</th>
              </tr>
            </thead>
            <tbody>
              {report.metricsSnapshot.bottlenecks.map((b: any) => (
                <tr key={b.step} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: 12 }}>{b.step}</td>
                  <td style={{ padding: 12, textAlign: 'right', color: b.exitRate > 50 ? '#ef4444' : 'inherit' }}>
                    {Math.round(b.exitRate)}%
                  </td>
                  <td style={{ padding: 12, textAlign: 'right', color: b.gateFailureRate > 30 ? '#f59e0b' : 'inherit' }}>
                    {Math.round(b.gateFailureRate)}%
                  </td>
                  <td style={{ padding: 12, textAlign: 'right' }}>{Math.round(b.avgTimeSpent)}s</td>
                  <td style={{ padding: 12, fontSize: 12, opacity: 0.8 }}>
                    {b.commonErrors.slice(0, 2).join(', ')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Instructions */}
      <div style={{ marginTop: 40, padding: 20, background: 'rgba(59,130,246,0.1)', borderRadius: 8, border: '1px solid #3b82f6' }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#3b82f6' }}>ℹ️ Dashboard Instructions</h4>
        <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, lineHeight: 1.8 }}>
          <li><strong>Admin Alerts:</strong> Red/orange boxes at top - require immediate action (database, API failures)</li>
          <li><strong>Auto-Fixes:</strong> Agent attempts to fix bottlenecks and API retries automatically</li>
          <li><strong>Issues:</strong> Detected problems with severity levels and suggested fixes</li>
          <li><strong>Console Logs:</strong> Check browser console for detailed AI agent activity</li>
          <li><strong>Clear History:</strong> Resets metrics (useful for testing after fixes)</li>
        </ul>
      </div>
    </div>
  );
}
