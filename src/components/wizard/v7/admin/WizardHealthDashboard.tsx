/**
 * Wizard Health Dashboard - Admin UI for monitoring wizard health
 * 
 * Purpose: Visual dashboard for developers to see real-time wizard health
 * Access: /wizard?admin=1&health=1 (dev only)
 */

import React, { useEffect, useState } from 'react';
import { wizardHealthMonitor } from '@/services/wizardHealthMonitor';
import { wizardAIAgent, type AgentReport } from '@/services/wizardAIAgent';

export default function WizardHealthDashboard() {
  const [report, setReport] = useState<AgentReport | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    // Get initial report
    updateReport();

    // Auto-refresh every 5 seconds
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

  if (!report) {
    return (
      <div style={{ padding: 20, background: '#1a1a2e', color: '#fff' }}>
        <h2>🤖 Wizard Health Dashboard</h2>
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
    <div style={{ padding: 20, background: '#1a1a2e', color: '#fff', fontFamily: 'monospace' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0 }}>🤖 Wizard Health Dashboard</h2>
        <div style={{ display: 'flex', gap: 10 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
            Refresh Now
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
          padding: '8px 16px',
          borderRadius: 8,
          background: statusColor,
          color: '#fff',
          fontWeight: 'bold',
          fontSize: 18,
          marginBottom: 20,
        }}
      >
        Status: {report.status.toUpperCase()}
      </div>

      {/* Issues */}
      {report.issues.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <h3 style={{ marginBottom: 10 }}>🚨 Issues ({report.issues.length})</h3>
          {report.issues.map((issue) => (
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
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <strong style={{ fontSize: 16 }}>{issue.title}</strong>
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
              <p style={{ margin: '8px 0', fontSize: 14, lineHeight: 1.5 }}>
                {issue.description}
              </p>
              {issue.suggestedFix && (
                <div style={{ marginTop: 12, padding: 12, background: 'rgba(34,197,94,0.1)', borderRadius: 6 }}>
                  <strong style={{ color: '#22c55e' }}>💡 Suggested Fix:</strong>
                  <pre style={{ margin: '8px 0 0', fontSize: 12, whiteSpace: 'pre-wrap' }}>
                    {issue.suggestedFix}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Metrics */}
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ marginBottom: 10 }}>📊 Metrics Snapshot</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          <div style={{ padding: 16, background: 'rgba(255,255,255,0.05)', borderRadius: 8 }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Error Rate</div>
            <div style={{ fontSize: 24, fontWeight: 'bold' }}>{report.metricsSnapshot.errorRate}</div>
          </div>
          <div style={{ padding: 16, background: 'rgba(255,255,255,0.05)', borderRadius: 8 }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Bottlenecks</div>
            <div style={{ fontSize: 24, fontWeight: 'bold' }}>{report.metricsSnapshot.bottlenecks.length}</div>
          </div>
        </div>
      </div>

      {/* Bottlenecks */}
      {report.metricsSnapshot.bottlenecks.length > 0 && (
        <div>
          <h3 style={{ marginBottom: 10 }}>🚦 Step Bottlenecks</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <th style={{ padding: 8, textAlign: 'left' }}>Step</th>
                <th style={{ padding: 8, textAlign: 'left' }}>Exit Rate</th>
                <th style={{ padding: 8, textAlign: 'left' }}>Gate Failure</th>
                <th style={{ padding: 8, textAlign: 'left' }}>Avg Time</th>
              </tr>
            </thead>
            <tbody>
              {report.metricsSnapshot.bottlenecks.map((b) => (
                <tr key={b.step} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: 8 }}>{b.step}</td>
                  <td style={{ padding: 8, color: b.exitRate > 50 ? '#ef4444' : '#22c55e' }}>
                    {b.exitRate}%
                  </td>
                  <td style={{ padding: 8, color: b.gateFailureRate > 30 ? '#f59e0b' : '#22c55e' }}>
                    {b.gateFailureRate}%
                  </td>
                  <td style={{ padding: 8 }}>{b.avgTimeSpent}s</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer */}
      <div style={{ marginTop: 20, padding: 16, background: 'rgba(255,255,255,0.05)', borderRadius: 8 }}>
        <strong>💡 How to use this dashboard:</strong>
        <ul style={{ marginTop: 8, paddingLeft: 20, fontSize: 14, lineHeight: 1.6 }}>
          <li>Monitor this in dev while testing wizard flows</li>
          <li>Critical issues = blocking bugs (fix immediately)</li>
          <li>High issues = user friction (fix soon)</li>
          <li>Check bottlenecks to see where users get stuck</li>
          <li>Clear history between test runs for clean data</li>
        </ul>
      </div>
    </div>
  );
}
