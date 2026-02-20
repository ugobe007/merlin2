/**
 * Share Quote Modal
 * 
 * Generate shareable public URLs for quotes.
 * Features:
 * - Copy link to clipboard
 * - QR code for mobile sharing
 * - Optional password protection
 * - Expiration settings
 * - View analytics
 */

import React, { useState } from 'react';
import { X, Link2, Copy, Check, Lock, Calendar, Eye, QrCode } from 'lucide-react';
import { supabase } from '@/services/supabaseClient';
import { nanoid } from 'nanoid';

interface ShareQuoteModalProps {
  quote: {
    peakLoadKW: number;
    bessKW: number;
    bessKWh: number;
    capexUSD: number;
    annualSavingsUSD: number;
    paybackYears: number;
    npv?: number;
    irr?: number;
    [key: string]: unknown;
  };
  onClose: () => void;
}

export function ShareQuoteModal({ quote, onClose }: ShareQuoteModalProps) {
  const [shareUrl, setShareUrl] = useState<string>('');
  const [shortCode, setShortCode] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expiryDays, setExpiryDays] = useState(30);
  const [requirePassword, setRequirePassword] = useState(false);
  const [password, setPassword] = useState('');

  const generateShareLink = async () => {
    setIsGenerating(true);
    try {
      // Generate short code
      const code = nanoid(8);
      
      // Calculate expiry
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiryDays);

      // Prepare quote data
      const quoteData = {
        ...quote,
        sharedAt: new Date().toISOString(),
        version: 'v7.1',
      };

      // Insert into database
      const { error } = await supabase
        .from('shared_quotes')
        .insert({
          short_code: code,
          quote_data: quoteData,
          expires_at: expiresAt.toISOString(),
          is_public: true,
          password_hash: requirePassword && password ? await hashPassword(password) : null,
        });

      if (error) throw error;

      // Generate URL
      const baseUrl = import.meta.env.VITE_PUBLIC_URL || window.location.origin;
      const url = `${baseUrl}/q/${code}`;

      setShareUrl(url);
      setShortCode(code);
    } catch (error) {
      console.error('[ShareQuote] Failed to generate link:', error);
      alert('Failed to generate share link. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('[ShareQuote] Failed to copy:', error);
    }
  };

  const isGenerated = !!shareUrl;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <Link2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                Share Quote
              </h2>
              <p className="text-sm text-slate-600">
                Generate a public link to share your quote
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {!isGenerated ? (
            <>
              {/* Quote Summary */}
              <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                <h3 className="text-sm font-medium text-slate-900">
                  Quote Summary
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-600">System Size:</span>
                    <span className="ml-2 font-medium text-slate-900">
                      {quote.bessKW.toFixed(0)} kW / {quote.bessKWh.toFixed(0)} kWh
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-600">Investment:</span>
                    <span className="ml-2 font-medium text-slate-900">
                      ${quote.capexUSD.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-600">Annual Savings:</span>
                    <span className="ml-2 font-medium text-slate-900">
                      ${quote.annualSavingsUSD.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-600">Payback:</span>
                    <span className="ml-2 font-medium text-slate-900">
                      {quote.paybackYears.toFixed(1)} years
                    </span>
                  </div>
                </div>
              </div>

              {/* Settings */}
              <div className="space-y-4">
                {/* Expiration */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-900 mb-2">
                    <Calendar className="w-4 h-4 text-slate-500" />
                    Link Expiration
                  </label>
                  <select
                    value={expiryDays}
                    onChange={(e) => setExpiryDays(Number(e.target.value))}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value={7}>7 days</option>
                    <option value={14}>14 days</option>
                    <option value={30}>30 days</option>
                    <option value={90}>90 days</option>
                    <option value={365}>1 year</option>
                  </select>
                </div>

                {/* Password Protection */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-900 mb-2">
                    <input
                      type="checkbox"
                      checked={requirePassword}
                      onChange={(e) => setRequirePassword(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <Lock className="w-4 h-4 text-slate-500" />
                    Password protect this link
                  </label>
                  {requirePassword && (
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  )}
                </div>
              </div>

              {/* Generate Button */}
              <button
                onClick={generateShareLink}
                disabled={isGenerating || (requirePassword && !password)}
                className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Link2 className="w-4 h-4" />
                    Generate Share Link
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              {/* Generated Link */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-800 font-medium mb-2">
                  <Check className="w-5 h-5" />
                  Share link generated!
                </div>
                <p className="text-sm text-green-700">
                  Anyone with this link can view your quote (expires in {expiryDays} days)
                </p>
              </div>

              {/* Copy Link */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-900">
                  Share Link
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    className="flex-1 px-4 py-3 border border-slate-300 rounded-lg bg-slate-50 text-slate-900 font-mono text-sm"
                  />
                  <button
                    onClick={copyToClipboard}
                    className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg flex items-center gap-2 transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Short Code */}
              <div className="text-center py-4 border-t border-slate-200">
                <p className="text-sm text-slate-600">
                  Short code: <span className="font-mono font-medium text-slate-900">{shortCode}</span>
                </p>
              </div>

              {/* Analytics Preview */}
              <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 rounded-lg p-3">
                <Eye className="w-4 h-4 text-slate-500" />
                <span>Views will be tracked for this link</span>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {isGenerated && (
          <div className="flex items-center justify-end p-6 border-t border-slate-200 bg-slate-50">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg transition-colors"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Simple password hashing (for demo - use bcrypt in production)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
