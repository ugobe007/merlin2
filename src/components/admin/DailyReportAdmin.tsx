/**
 * Daily Report Admin Panel
 * 
 * Allows admins to:
 * - Preview and send daily reports
 * - Manage subscribers
 * - View report history
 */

import React, { useState } from 'react';
import { 
  generateDailyReport, 
  sendDailyReport, 
  previewReportHTML,
  type DailyReport 
} from '@/services/dailyReportService';

interface DailyReportAdminProps {
  onClose?: () => void;
}

export const DailyReportAdmin: React.FC<DailyReportAdminProps> = ({ onClose }) => {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<DailyReport | null>(null);
  const [testEmail, setTestEmail] = useState('');
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const handleGenerateReport = async () => {
    setLoading(true);
    setStatus({ type: 'info', message: 'Fetching news feeds and generating report...' });
    
    try {
      const generatedReport = await generateDailyReport();
      setReport(generatedReport);
      setStatus({ 
        type: 'success', 
        message: `Report generated! Found ${generatedReport.newsItems.length} articles, ${generatedReport.companyMentions.length} company mentions, ${generatedReport.potentialCustomers.length} potential leads.` 
      });
    } catch (error: any) {
      setStatus({ type: 'error', message: `Failed to generate report: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = () => {
    if (report) {
      previewReportHTML(report);
    }
  };

  const handleSendTest = async () => {
    if (!report || !testEmail) {
      setStatus({ type: 'error', message: 'Please generate a report and enter an email address' });
      return;
    }

    setLoading(true);
    setStatus({ type: 'info', message: 'Sending test email...' });

    try {
      const result = await sendDailyReport(report, [testEmail]);
      if (result.success) {
        setStatus({ type: 'success', message: `Test email sent to ${testEmail}!` });
      } else {
        setStatus({ type: 'error', message: `Failed: ${result.error}` });
      }
    } catch (error: any) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                ⚡ Daily BESS Intelligence Report
              </h2>
              <p className="text-blue-100 mt-1">Generate and send market intelligence reports</p>
            </div>
            {onClose && (
              <button 
                onClick={onClose}
                className="text-white/80 hover:text-white text-2xl"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Status Message */}
          {status && (
            <div className={`mb-4 p-4 rounded-lg ${
              status.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' :
              status.type === 'error' ? 'bg-red-100 text-red-800 border border-red-200' :
              'bg-blue-100 text-blue-800 border border-blue-200'
            }`}>
              {status.type === 'success' && '✅ '}
              {status.type === 'error' && '❌ '}
              {status.type === 'info' && '⏳ '}
              {status.message}
            </div>
          )}

          {/* Step 1: Generate Report */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">1</span>
              Generate Report
            </h3>
            <p className="text-gray-600 mb-3 ml-10">
              Fetch latest news from energy storage RSS feeds, extract company mentions, and identify potential customer leads.
            </p>
            <button
              onClick={handleGenerateReport}
              disabled={loading}
              className="ml-10 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all"
            >
              {loading ? '⏳ Generating...' : '📊 Generate Daily Report'}
            </button>
          </div>

          {/* Report Preview */}
          {report && (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-4 gap-4 mb-6 ml-10">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold text-blue-600">{report.newsItems.length}</div>
                  <div className="text-sm text-blue-800">Articles</div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold text-green-600">{report.companyMentions.length}</div>
                  <div className="text-sm text-green-800">Companies</div>
                </div>
                <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold text-amber-600">{report.potentialCustomers.length}</div>
                  <div className="text-sm text-amber-800">Leads</div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold text-purple-600">
                    {report.newsItems.filter(n => n.category === 'deployment').length}
                  </div>
                  <div className="text-sm text-purple-800">Deployments</div>
                </div>
              </div>

              {/* Top Headlines */}
              <div className="mb-6 ml-10">
                <h4 className="font-semibold text-gray-700 mb-2">📰 Top Headlines:</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto bg-gray-50 rounded-lg p-3">
                  {report.newsItems.slice(0, 5).map((item, i) => (
                    <div key={i} className="text-sm">
                      <a 
                        href={item.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {item.title}
                      </a>
                      <span className="text-gray-400 ml-2">({item.source})</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Companies Mentioned */}
              {report.companyMentions.length > 0 && (
                <div className="mb-6 ml-10">
                  <h4 className="font-semibold text-gray-700 mb-2">🏢 Companies Mentioned:</h4>
                  <div className="flex flex-wrap gap-2">
                    {report.companyMentions.slice(0, 15).map((company, i) => (
                      <span 
                        key={i} 
                        className={`px-3 py-1 rounded-full text-sm ${
                          company.type === 'epc' ? 'bg-green-100 text-green-700' :
                          company.type === 'engineering' ? 'bg-blue-100 text-blue-700' :
                          company.type === 'construction' ? 'bg-orange-100 text-orange-700' :
                          company.type === 'customer' ? 'bg-amber-100 text-amber-700' :
                          'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {company.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2: Preview */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">2</span>
                  Preview Email
                </h3>
                <button
                  onClick={handlePreview}
                  className="ml-10 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-all"
                >
                  👁️ Preview in Browser
                </button>
              </div>

              {/* Step 3: Send Test */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">3</span>
                  Send Test Email
                </h3>
                <div className="ml-10 flex gap-3">
                  <input
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="Enter your email..."
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    onClick={handleSendTest}
                    disabled={loading || !testEmail}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all"
                  >
                    {loading ? '⏳ Sending...' : '📧 Send Test'}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Configuration Info */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-6">
            <h4 className="font-semibold text-amber-800 mb-2">⚙️ Configuration Required</h4>
            <p className="text-amber-700 text-sm mb-2">Add these to your <code className="bg-amber-100 px-1 rounded">.env</code> file:</p>
            <pre className="bg-amber-100 p-3 rounded text-xs text-amber-900 overflow-x-auto">
{`VITE_RESEND_API_KEY=re_xxxxxxxxxxxxx
VITE_OPENAI_API_KEY=sk-xxxxxxxxxxxxx  # Optional, for AI summaries`}
            </pre>
            <p className="text-amber-700 text-sm mt-2">
              Also verify your domain in Resend: <code className="bg-amber-100 px-1 rounded">reports@merlinenergy.net</code>
            </p>
          </div>

          {/* Subscriber Management (Future) */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-4">
            <h4 className="font-semibold text-gray-700 mb-2">📋 Coming Soon: Subscriber Management</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Add/remove email subscribers</li>
              <li>• Customize report preferences per subscriber</li>
              <li>• View send history and analytics</li>
              <li>• Schedule automatic daily sends (7 AM)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyReportAdmin;
