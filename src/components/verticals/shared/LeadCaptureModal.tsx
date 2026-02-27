/**
 * SHARED LEAD CAPTURE MODAL
 * =========================
 * Reusable lead capture form that submits to Supabase `leads` table.
 * Config-driven styling and labels.
 * 
 * Created: Feb 7, 2026 — Phase 2 Vertical Unification
 */

import React, { useState } from 'react';
import { X, CheckCircle, Sparkles, ArrowRight } from 'lucide-react';
import type { VerticalConfig } from '@/config/verticalConfig';
import { supabase } from '@/services/supabaseClient';

interface LeadCaptureModalProps {
  config: VerticalConfig;
  isOpen: boolean;
  onClose: () => void;
}

interface LeadInfo {
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  notes: string;
}

export function LeadCaptureModal({ config, isOpen, onClose }: LeadCaptureModalProps) {
  const { theme, leadSourceTag, brandName: _brandName } = config;
  
  const [leadInfo, setLeadInfo] = useState<LeadInfo>({
    businessName: '',
    ownerName: '',
    email: '',
    phone: '',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [leadSubmitted, setLeadSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await supabase.from('leads').insert([{
        name: leadInfo.ownerName,
        email: leadInfo.email,
        company: leadInfo.businessName,
        phone: leadInfo.phone,
        source: leadSourceTag,
        format: 'consultation',
        notes: leadInfo.notes || null,
        source_url: window.location.href,
        industry: config.slug,
      }]);
      setLeadSubmitted(true);
    } catch (error) {
      console.error('Lead submission error:', error);
      setLeadSubmitted(true); // Don't block UX on lead capture failure
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onClose();
    // Reset after animation
    setTimeout(() => {
      setLeadSubmitted(false);
      setLeadInfo({ businessName: '', ownerName: '', email: '', phone: '', notes: '' });
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className={`bg-gradient-to-br from-slate-900 via-${theme.accent}-900/50 to-slate-900 rounded-3xl p-8 max-w-md w-full border-2 border-${theme.accent}-400/60 shadow-2xl shadow-${theme.accent}-500/30 relative`}>
        <button
          onClick={handleClose}
          className={`absolute top-3 right-3 p-2 text-white/70 hover:text-white hover:bg-${theme.accent}-500/30 rounded-xl transition-all border border-transparent hover:border-${theme.accent}-400/50`}
        >
          <X className="w-6 h-6" />
        </button>

        {!leadSubmitted ? (
          <>
            <h3 className={`text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-${theme.accent}-300 to-${theme.accentSecondary}-300 mb-2`}>
              Get Your Free Custom Quote
            </h3>
            <p className={`text-${theme.accent}-200 mb-6 font-medium`}>
              Our team will analyze your facility and send a detailed savings report
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={`block text-sm text-${theme.accent}-200 mb-1`}>Business Name *</label>
                <input
                  type="text"
                  required
                  value={leadInfo.businessName}
                  onChange={(e) => setLeadInfo({ ...leadInfo, businessName: e.target.value })}
                  className={`w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:ring-2 focus:ring-${theme.accent}-500 focus:border-transparent`}
                  placeholder="Business Name"
                />
              </div>
              <div>
                <label className={`block text-sm text-${theme.accent}-200 mb-1`}>Your Name *</label>
                <input
                  type="text"
                  required
                  value={leadInfo.ownerName}
                  onChange={(e) => setLeadInfo({ ...leadInfo, ownerName: e.target.value })}
                  className={`w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:ring-2 focus:ring-${theme.accent}-500 focus:border-transparent`}
                  placeholder="John Smith"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-sm text-${theme.accent}-200 mb-1`}>Email *</label>
                  <input
                    type="email"
                    required
                    value={leadInfo.email}
                    onChange={(e) => setLeadInfo({ ...leadInfo, email: e.target.value })}
                    className={`w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:ring-2 focus:ring-${theme.accent}-500 focus:border-transparent`}
                    placeholder="john@email.com"
                  />
                </div>
                <div>
                  <label className={`block text-sm text-${theme.accent}-200 mb-1`}>Phone *</label>
                  <input
                    type="tel"
                    required
                    value={leadInfo.phone}
                    onChange={(e) => setLeadInfo({ ...leadInfo, phone: e.target.value })}
                    className={`w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:ring-2 focus:ring-${theme.accent}-500 focus:border-transparent`}
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>
              <div>
                <label className={`block text-sm text-${theme.accent}-200 mb-1`}>Questions or Comments</label>
                <textarea
                  value={leadInfo.notes}
                  onChange={(e) => setLeadInfo({ ...leadInfo, notes: e.target.value })}
                  rows={2}
                  className={`w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:ring-2 focus:ring-${theme.accent}-500 focus:border-transparent resize-none`}
                  placeholder="Anything you'd like us to know?"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full bg-gradient-to-r ${theme.ctaGradient} disabled:from-gray-500 disabled:to-gray-600 text-white py-4 rounded-xl font-black text-lg shadow-xl shadow-${theme.accent}-500/30 transition-all hover:scale-105 disabled:hover:scale-100 flex items-center justify-center gap-2 border-2 border-${theme.accent}-300/50`}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                    <span className="animate-pulse">Processing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Get My Free Quote
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center py-6">
            <div className={`w-16 h-16 bg-gradient-to-br ${theme.ctaGradient} rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-xl shadow-${theme.accent}-500/30`}>
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h3 className={`text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-${theme.accent}-300 to-${theme.accentSecondary}-300 mb-2`}>
              Quote Request Sent!
            </h3>
            <p className={`text-${theme.accent}-200/80 text-sm mb-5`}>
              Check <span className={`text-${theme.accent}-300 font-bold`}>{leadInfo.email}</span> — we'll be in touch within 24 hours.
            </p>

            {/* Next steps */}
            <div className="text-left bg-white/5 rounded-xl border border-white/10 p-4 mb-5 space-y-3">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">What happens next</div>
              {[
                { n: "1", text: "Confirmation email on its way to your inbox" },
                { n: "2", text: "Our analyst reviews your facility profile" },
                { n: "3", text: "Custom savings report delivered within 24 hrs" },
              ].map((step) => (
                <div key={step.n} className="flex items-start gap-3">
                  <div className={`w-5 h-5 rounded-full bg-${theme.accent}-500/20 border border-${theme.accent}-500/30 flex items-center justify-center flex-shrink-0 text-${theme.accent}-400 font-bold text-[10px]`}>
                    {step.n}
                  </div>
                  <span className="text-sm text-slate-300">{step.text}</span>
                </div>
              ))}
            </div>

            {/* While you wait CTA */}
            <div className="flex flex-col gap-2">
              <a
                href="/wizard"
                className={`w-full py-3 rounded-xl bg-gradient-to-r ${theme.ctaGradient} text-white font-bold text-sm flex items-center justify-center gap-2`}
              >
                <Sparkles className="w-4 h-4" />
                Explore the Full Wizard
                <ArrowRight className="w-4 h-4" />
              </a>
              <button
                onClick={handleClose}
                className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-sm font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
