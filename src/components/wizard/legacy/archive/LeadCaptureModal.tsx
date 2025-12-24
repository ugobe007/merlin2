import React, { useState } from 'react';
import { X, UserPlus, Mail, User, Sparkles } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';

interface LeadCaptureModalProps {
  onComplete: (userData: { name: string; email: string }) => void;
  onSkip: () => void;
  format?: 'PDF' | 'Excel' | 'Word' | null;
  purpose?: 'download' | 'save';
}

const LeadCaptureModal: React.FC<LeadCaptureModalProps> = ({ 
  onComplete, 
  onSkip, 
  format,
  purpose = 'download'
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !email) {
      setError('Name and email are required');
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();

      if (!existingUser) {
        // Create new user/lead
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password: Math.random().toString(36).slice(-16), // Generate random password
          options: {
            data: {
              name,
              company,
              phone,
              lead_source: 'quote_download',
              download_format: format,
            }
          }
        });

        if (authError) {
          console.error('Auth error:', authError);
          // Continue anyway - we still want to capture the lead
        }

        // Store lead info in a leads table
        const { error: leadError } = await supabase
          .from('leads')
          .insert({
            name,
            email,
            company,
            phone,
            source: 'quote_download',
            format,
            created_at: new Date().toISOString(),
          });

        if (leadError) {
          console.error('Lead capture error:', leadError);
        }
      }

      // Call onComplete with user data
      onComplete({ name, email });
    } catch (err) {
      console.error('Error capturing lead:', err);
      setError('An error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 text-white p-8 rounded-t-2xl relative">
          <button
            onClick={onSkip}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
              <Sparkles className="w-8 h-8" />
            </div>
            <h2 className="text-3xl font-bold">
              {purpose === 'save' ? 'Save Your Quote!' : 'Get Your Quote!'}
            </h2>
          </div>
          <p className="text-white/90 text-lg">
            {purpose === 'save' 
              ? 'Create a free account to save and access your quote anytime'
              : 'Save your quote and unlock exclusive benefits'}
          </p>
        </div>

        {/* Benefits Banner */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 border-b-2 border-blue-200">
          <div className="flex items-start gap-3">
            <span className="text-2xl mt-1">🎁</span>
            <div>
              <h3 className="font-bold text-gray-900 mb-1">Why create an account?</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>✅ Save and access your quotes anytime</li>
                <li>✅ Get personalized recommendations</li>
                <li>✅ Receive exclusive pricing updates</li>
                <li>✅ Connect with our energy experts</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-3 text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Name - Required */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <User className="w-4 h-4" />
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Smith"
              required
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-gray-900"
            />
          </div>

          {/* Email - Required */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@company.com"
              required
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-gray-900"
            />
          </div>

          {/* Company - Optional */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Company Name (optional)
            </label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Acme Corporation"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-gray-900"
            />
          </div>

          {/* Phone - Optional */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Phone Number (optional)
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(555) 123-4567"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-gray-900"
            />
          </div>

          {/* Download/Save Info */}
          {format && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
              <p className="text-sm text-gray-700 flex items-center gap-2">
                <span className="text-xl">
                  {format === 'PDF' ? '📄' : format === 'Excel' ? '📊' : '📝'}
                </span>
                <span>
                  Your <strong>{format}</strong> quote will download immediately after submission
                </span>
              </p>
            </div>
          )}
          
          {purpose === 'save' && (
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
              <p className="text-sm text-gray-700 flex items-center gap-2">
                <span className="text-xl">💾</span>
                <span>
                  Your quote will be <strong>saved to your account</strong> and accessible anytime
                </span>
              </p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || !name || !email}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <UserPlus className="w-5 h-5" />
                <span>
                  {purpose === 'save' 
                    ? 'Create Account & Save Quote'
                    : `Create Account & Download ${format || 'Quote'}`}
                </span>
              </>
            )}
          </button>

          {/* Skip Option */}
          {purpose === 'download' && (
            <button
              type="button"
              onClick={onSkip}
              className="w-full text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors"
            >
              Skip for now (download without saving)
            </button>
          )}

          {/* Privacy Note */}
          <p className="text-xs text-gray-500 text-center">
            By creating an account, you agree to receive occasional updates about Merlin Energy solutions. 
            We respect your privacy and never share your information.
          </p>
        </form>
      </div>
    </div>
  );
};

export default LeadCaptureModal;
