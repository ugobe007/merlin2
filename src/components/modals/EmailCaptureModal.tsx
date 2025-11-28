/**
 * Email Capture Modal
 * Captures user details and creates account before allowing download
 */

import React, { useState } from 'react';
import { X, Mail, User, Building2, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';

interface EmailCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (userId: string) => void;
  quoteData?: {
    storageSizeMW: number;
    totalCost: number;
    industryName?: string;
  };
}

const EmailCaptureModal: React.FC<EmailCaptureModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  quoteData
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

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
      // Generate a temporary password (user can reset later)
      const tempPassword = Math.random().toString(36).slice(-12) + 'A1!';
      
      // Sign up the user with Supabase Auth
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
        // Check if user already exists
        if (signUpError.message.includes('already registered')) {
          // Try to sign in instead
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: formData.email,
            password: tempPassword,
          });

          if (signInError) {
            // User exists but password doesn't match - this is OK, we'll just update the user record
            console.log('User exists, proceeding with existing account');
            // Get user by email
            const { data: userData, error: userError } = await supabase
              .from('users')
              .select('id')
              .eq('email', formData.email)
              .single();

            if (userError || !userData) {
              throw new Error('Failed to retrieve user account');
            }

            // Update user profile
            await supabase
              .from('users')
              .update({
                full_name: formData.name,
                company: formData.company,
              })
              .eq('id', userData.id);

            setSuccess(true);
            setTimeout(() => {
              onSuccess(userData.id);
            }, 1500);
            return;
          }
        } else {
          throw signUpError;
        }
      }

      if (!authData.user) {
        throw new Error('Failed to create account');
      }

      // Create or update user record in users table
      const { error: profileError } = await supabase
        .from('users')
        .upsert({
          id: authData.user.id,
          email: formData.email,
          full_name: formData.name,
          company: formData.company,
          tier: 'FREE', // Default tier
          created_at: new Date().toISOString(),
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        // Don't fail completely if profile creation fails
      }

      // Save quote data reference if provided
      if (quoteData) {
        await supabase.from('saved_quotes').insert({
          user_id: authData.user.id,
          use_case_slug: quoteData.industryName?.toLowerCase().replace(/\s+/g, '-'),
          storage_size_mw: quoteData.storageSizeMW,
          total_cost: quoteData.totalCost,
          quote_data: quoteData,
          created_at: new Date().toISOString(),
        });
      }

      setSuccess(true);
      
      // Wait for success animation then trigger download
      setTimeout(() => {
        onSuccess(authData.user!.id);
      }, 1500);

    } catch (err: any) {
      console.error('Account creation error:', err);
      setError(err.message || 'Failed to create account. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 rounded-t-2xl flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-white">Download Your Quote</h2>
              <p className="text-blue-100 text-sm mt-1">
                Create your free account to continue
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
              disabled={isLoading}
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {success ? (
              // Success State
              <div className="text-center py-8 space-y-4">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Account Created!</h3>
                <p className="text-gray-600">
                  Your download will begin shortly...
                </p>
              </div>
            ) : (
              // Form
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="w-4 h-4 inline mr-1" />
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="John Smith"
                    disabled={isLoading}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                    required
                  />
                </div>

                {/* Email Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail className="w-4 h-4 inline mr-1" />
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="john@company.com"
                    disabled={isLoading}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                    required
                  />
                </div>

                {/* Company Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Building2 className="w-4 h-4 inline mr-1" />
                    Company Name *
                  </label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => handleInputChange('company', e.target.value)}
                    placeholder="Acme Corp"
                    disabled={isLoading}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                    required
                  />
                </div>

                {/* Error Message */}
                {error && (
                  <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-red-900">Error</p>
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                )}

                {/* Privacy Notice */}
                <p className="text-xs text-gray-500">
                  By creating an account, you agree to receive your quote and occasional updates about battery energy storage solutions. We respect your privacy and won't spam you.
                </p>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      Create Account & Download
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Footer */}
          {!success && (
            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 rounded-b-2xl">
              <p className="text-xs text-center text-gray-600">
                Already have an account? You'll be able to save this quote to your portfolio.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailCaptureModal;
