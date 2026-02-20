/**
 * Shared Quote Viewer Page
 * 
 * Public read-only view of shared quotes.
 * Route: /q/:shortCode
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/services/supabaseClient';
import { Check, Clock, DollarSign, Zap, TrendingUp, AlertCircle, Lock } from 'lucide-react';

interface SharedQuote {
  id: string;
  short_code: string;
  quote_data: {
    peakLoadKW: number;
    bessKW: number;
    bessKWh: number;
    capexUSD: number;
    annualSavingsUSD: number;
    paybackYears: number;
    npv?: number;
    irr?: number;
    sharedAt: string;
    version: string;
    [key: string]: unknown;
  };
  created_at: string;
  expires_at: string;
  view_count: number;
  password_hash?: string;
}

export default function SharedQuotePage() {
  const { shortCode } = useParams<{ shortCode: string }>();
  const navigate = useNavigate();
  const [quote, setQuote] = useState<SharedQuote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    if (!shortCode) {
      setError('Invalid share link');
      setLoading(false);
      return;
    }

    loadQuote();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shortCode]);

  const loadQuote = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('shared_quotes')
        .select('*')
        .eq('short_code', shortCode)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          setError('Quote not found or has expired');
        } else {
          setError('Failed to load quote');
        }
        setLoading(false);
        return;
      }

      if (!data) {
        setError('Quote not found');
        setLoading(false);
        return;
      }

      // Check if password protected
      if (data.password_hash) {
        setRequiresPassword(true);
        setLoading(false);
        return;
      }

      // Track view
      trackView(data.id);

      setQuote(data);
      setLoading(false);
    } catch (err) {
      console.error('[SharedQuote] Load error:', err);
      setError('Failed to load quote');
      setLoading(false);
    }
  };

  const verifyPassword = async () => {
    if (!password) {
      setPasswordError('Please enter a password');
      return;
    }

    try {
      // Hash password and compare (simplified - use bcrypt in production)
      const hashedInput = await hashPassword(password);
      
      const { data, error: fetchError } = await supabase
        .from('shared_quotes')
        .select('*')
        .eq('short_code', shortCode)
        .eq('password_hash', hashedInput)
        .single();

      if (fetchError || !data) {
        setPasswordError('Incorrect password');
        return;
      }

      // Track view
      trackView(data.id);

      setQuote(data);
      setRequiresPassword(false);
      setPasswordError('');
    } catch (err) {
      console.error('[SharedQuote] Password verification error:', err);
      setPasswordError('Verification failed');
    }
  };

  const trackView = async (quoteId: string) => {
    try {
      // Increment view count
      await supabase
        .from('shared_quotes')
        .update({
          view_count: supabase.rpc('increment', { row_id: quoteId }),
          last_viewed_at: new Date().toISOString(),
        })
        .eq('id', quoteId);

      // Record detailed view
      await supabase.from('shared_quote_views').insert({
        shared_quote_id: quoteId,
        user_agent: navigator.userAgent,
        referrer: document.referrer,
      });
    } catch (err) {
      // Non-blocking error
      console.error('[SharedQuote] Tracking error:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading quote...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            {error}
          </h1>
          <p className="text-slate-600 mb-6">
            This link may have expired or been removed.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  if (requiresPassword) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
          <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2 text-center">
            Password Protected
          </h1>
          <p className="text-slate-600 mb-6 text-center">
            This quote requires a password to view.
          </p>

          <div className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setPasswordError('');
              }}
              placeholder="Enter password"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              onKeyPress={(e) => e.key === 'Enter' && verifyPassword()}
            />
            {passwordError && (
              <p className="text-sm text-red-600">{passwordError}</p>
            )}
            <button
              onClick={verifyPassword}
              className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              Unlock Quote
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!quote) return null;

  const q = quote.quote_data;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 py-12 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                BESS Quote Shared with You
              </h1>
              <p className="text-slate-600">
                Shared on {new Date(q.sharedAt).toLocaleDateString()}
              </p>
            </div>
            <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
              <Check className="w-8 h-8 text-green-600" />
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid md:grid-cols-4 gap-6">
            <div>
              <div className="flex items-center gap-2 text-slate-600 mb-2">
                <Zap className="w-4 h-4" />
                <span className="text-sm font-medium">System Size</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">
                {q.bessKW.toFixed(0)} kW
              </p>
              <p className="text-sm text-slate-600">
                {q.bessKWh.toFixed(0)} kWh
              </p>
            </div>

            <div>
              <div className="flex items-center gap-2 text-slate-600 mb-2">
                <DollarSign className="w-4 h-4" />
                <span className="text-sm font-medium">Investment</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">
                ${q.capexUSD.toLocaleString()}
              </p>
              <p className="text-sm text-green-600">
                After tax credits
              </p>
            </div>

            <div>
              <div className="flex items-center gap-2 text-slate-600 mb-2">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm font-medium">Annual Savings</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">
                ${q.annualSavingsUSD.toLocaleString()}
              </p>
              <p className="text-sm text-slate-600">
                /year
              </p>
            </div>

            <div>
              <div className="flex items-center gap-2 text-slate-600 mb-2">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-medium">Payback</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">
                {q.paybackYears.toFixed(1)} years
              </p>
              {q.npv && (
                <p className="text-sm text-green-600">
                  NPV: ${q.npv.toLocaleString()}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Get Your Own Quote CTA */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-2">
            Want a custom quote for your facility?
          </h2>
          <p className="text-blue-100 mb-6">
            Get a TrueQuote™ verified estimate in just 5 minutes
          </p>
          <button
            onClick={() => navigate('/wizard')}
            className="px-8 py-4 bg-white text-blue-600 hover:bg-blue-50 font-bold rounded-lg transition-colors"
          >
            Start Your Free Quote
          </button>
        </div>
      </div>
    </div>
  );
}

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
