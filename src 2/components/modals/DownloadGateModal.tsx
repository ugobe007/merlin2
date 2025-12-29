/**
 * Download Gate Modal
 * Smart modal that:
 * - Checks if user is logged in → proceeds directly to download
 * - If not logged in → shows sign-up form first
 * Replaces the separate EmailCaptureModal with auth-aware behavior
 */

import React, { useState, useEffect } from 'react';
import { X, Mail, User, Building2, CheckCircle, AlertCircle, Download, Lock, UserCheck, Sparkles } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { authService } from '../../services/authService';

type DownloadType = 'pdf' | 'excel' | 'word' | 'certificate';

interface DownloadGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceedWithDownload: () => void;
  onShowLogin?: () => void;
  downloadType: DownloadType;
  quoteData?: {
    storageSizeMW?: number;
    totalCost?: number;
    industryName?: string;
  };
}

const DOWNLOAD_LABELS: Record<DownloadType, { icon: string; label: string; color: string }> = {
  pdf: { icon: '📄', label: 'PDF Quote', color: 'from-red-500 to-red-600' },
  excel: { icon: '📊', label: 'Excel Quote', color: 'from-green-500 to-green-600' },
  word: { icon: '📝', label: 'Word Quote', color: 'from-blue-500 to-blue-600' },
  certificate: { icon: '🏆', label: 'Power Certificate', color: 'from-purple-500 to-indigo-600' },
};

const DownloadGateModal: React.FC<DownloadGateModalProps> = ({
  isOpen,
  onClose,
  onProceedWithDownload,
  onShowLogin,
  downloadType,
  quoteData
}) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Check auth status when modal opens
  useEffect(() => {
    if (isOpen) {
      checkAuthStatus();
    }
  }, [isOpen]);

  const checkAuthStatus = async () => {
    setIsCheckingAuth(true);
    try {
      // Check both authService (local) and Supabase
      const localUser = authService.getCurrentUser();
      const { data: { user: supabaseUser } } = await supabase.auth.getUser();
      
      if (localUser || supabaseUser) {
        setIsLoggedIn(true);
        // Auto-proceed with download after a brief moment
        setTimeout(() => {
          onProceedWithDownload();
          onClose();
        }, 500);
      } else {
        setIsLoggedIn(false);
      }
    } catch (err) {
      console.error('Auth check error:', err);
      setIsLoggedIn(false);
    } finally {
      setIsCheckingAuth(false);
    }
  };

  if (!isOpen) return null;

  const downloadInfo = DOWNLOAD_LABELS[downloadType];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!formData.email.trim()) {
      setError('Please enter your email');
      return;
    }
    if (!validateEmail(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }
    if (!formData.company.trim()) {
      setError('Please enter your company name');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Generate a temporary password
      const tempPassword = Math.random().toString(36).slice(-12) + 'A1!';
      
      // Try to sign up with Supabase Auth
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: tempPassword,
        options: {
          data: {
            full_name: formData.name,
            company: formData.company,
          },
        },
      });

      if (signUpError) {
        // If user already exists, that's fine - we'll proceed anyway
        if (!signUpError.message.includes('already registered')) {
          console.error('Sign up error:', signUpError);
        }
      }

      // Also save to local authService for immediate access
      const userId = authData?.user?.id || `local_${Date.now()}`;
      
      // Save lead info to localStorage (backup)
      const leads = JSON.parse(localStorage.getItem('merlin_download_leads') || '[]');
      leads.push({
        ...formData,
        userId,
        downloadType,
        quoteData,
        timestamp: new Date().toISOString(),
      });
      localStorage.setItem('merlin_download_leads', JSON.stringify(leads));

      // Try to save to Supabase (non-blocking)
      try {
        await supabase.from('download_leads').insert({
          name: formData.name,
          email: formData.email,
          company: formData.company,
          download_type: downloadType,
          quote_data: quoteData,
          created_at: new Date().toISOString(),
        });
      } catch (dbErr) {
        // Table might not exist - that's OK
        if (import.meta.env.DEV) { console.log('Lead table insert (may not exist):', dbErr); }
      }

      setSuccess(true);
      
      // Wait for success animation then proceed with download
      setTimeout(() => {
        onProceedWithDownload();
        onClose();
        // Reset form
        setFormData({ name: '', email: '', company: '' });
        setSuccess(false);
      }, 1500);

    } catch (err: any) {
      console.error('Sign up error:', err);
      setError(err.message || 'Failed to create account. Please try again.');
      setIsLoading(false);
    }
  };

  // Loading state while checking auth
  if (isCheckingAuth) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" />
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Checking your account...</p>
          </div>
        </div>
      </div>
    );
  }

  // If logged in, show quick success (this usually auto-closes)
  if (isLoggedIn && !success) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" />
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 text-center max-w-sm">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <UserCheck className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Welcome Back!</h3>
            <p className="text-gray-600">Starting your download...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
          {/* Header */}
          <div className={`bg-gradient-to-r ${downloadInfo.color} px-6 py-5 relative overflow-hidden`}>
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
            
            <div className="relative z-10 flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="text-4xl">{downloadInfo.icon}</div>
                <div>
                  <h2 className="text-xl font-bold text-white">Download {downloadInfo.label}</h2>
                  <p className="text-white/80 text-sm mt-0.5">
                    Create a free account to continue
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
                disabled={isLoading}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {success ? (
              // Success State
              <div className="text-center py-6 space-y-4">
                <div className="mx-auto w-16 h-16 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Success! 🎉</h3>
                <p className="text-gray-600">
                  Your download is starting...
                </p>
              </div>
            ) : (
              // Sign Up Form
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Benefits banner */}
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-3 border border-purple-100 mb-4">
                  <div className="flex items-center gap-2 text-sm text-purple-700">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    <span className="font-medium">Free account includes:</span>
                    <span>saved quotes • portfolio • price alerts</span>
                  </div>
                </div>

                {/* Name Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="John Smith"
                      disabled={isLoading}
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                      required
                    />
                  </div>
                </div>

                {/* Email Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="john@company.com"
                      disabled={isLoading}
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                      required
                    />
                  </div>
                </div>

                {/* Company Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Company Name *
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={formData.company}
                      onChange={(e) => handleInputChange('company', e.target.value)}
                      placeholder="Acme Corp"
                      disabled={isLoading}
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                      required
                    />
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="p-3 bg-red-50 border-2 border-red-200 rounded-xl flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                {/* Privacy Notice */}
                <p className="text-xs text-gray-500 text-center">
                  By signing up, you agree to receive occasional updates about battery storage solutions.
                </p>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full py-3.5 bg-gradient-to-r ${downloadInfo.color} text-white font-bold rounded-xl hover:opacity-90 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5" />
                      Sign Up & Download
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Footer */}
          {!success && (
            <div className="border-t border-gray-100 px-6 py-3 bg-gray-50">
              <p className="text-xs text-center text-gray-500">
                Already have an account? <a href="#" className="text-purple-600 font-medium hover:underline" onClick={(e) => { e.preventDefault(); onClose(); onShowLogin?.(); }}>Sign in</a> for instant access.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DownloadGateModal;
