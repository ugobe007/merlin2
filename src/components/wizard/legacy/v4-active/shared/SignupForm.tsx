/**
 * SIGNUP FORM COMPONENT
 * =====================
 * 
 * User signup form for saving quotes and becoming a member.
 * Fields: Name (required), Email (required), Company Name (optional), Title (optional)
 */

import React, { useState } from 'react';
import { Mail, User, Building, Briefcase, CheckCircle, X } from 'lucide-react';

export interface SignupFormProps {
  onSignup: (data: { name: string; email: string; companyName?: string; title?: string }) => Promise<void>;
  onClose?: () => void;
}

export function SignupForm({ onSignup, onClose }: SignupFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    companyName: '',
    title: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  
  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    setIsSubmitting(true);
    try {
      await onSignup({
        name: formData.name.trim(),
        email: formData.email.trim(),
        companyName: formData.companyName.trim() || undefined,
        title: formData.title.trim() || undefined,
      });
      setSuccess(true);
      setTimeout(() => {
        setIsOpen(false);
        setSuccess(false);
        setFormData({ name: '', email: '', companyName: '', title: '' });
        if (onClose) onClose();
      }, 2000);
    } catch (error) {
      console.error('Signup error:', error);
      setErrors({ submit: 'Failed to sign up. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 z-50 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600 text-white font-bold px-6 py-4 rounded-2xl shadow-2xl hover:scale-105 transition-all flex items-center gap-3 border-2 border-white/40"
      >
        <Mail className="w-5 h-5" />
        <span>JOIN NOW</span>
      </button>
    );
  }
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 border-2 border-purple-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-t-2xl p-6 relative">
          {onClose && (
            <button
              onClick={() => {
                setIsOpen(false);
                if (onClose) onClose();
              }}
              className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
          <h2 className="text-white font-bold text-xl mb-2">Join Now to Save Your Quote</h2>
          <p className="text-white/90 text-sm">Become a member and access your saved quotes anytime</p>
        </div>
        
        {/* Form */}
        {success ? (
          <div className="p-8 text-center">
            <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
            <h3 className="text-gray-900 font-bold text-lg mb-2">Welcome!</h3>
            <p className="text-gray-600">Your quote has been saved. Check your email for confirmation.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Name - Required */}
            <div>
              <label className="block text-gray-700 font-semibold text-sm mb-2 flex items-center gap-2">
                <User className="w-4 h-4 text-purple-600" />
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full px-4 py-3 rounded-xl border-2 ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                } focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all`}
                placeholder="Enter your full name"
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>
            
            {/* Email - Required */}
            <div>
              <label className="block text-gray-700 font-semibold text-sm mb-2 flex items-center gap-2">
                <Mail className="w-4 h-4 text-purple-600" />
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`w-full px-4 py-3 rounded-xl border-2 ${
                  errors.email ? 'border-red-300' : 'border-gray-300'
                } focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all`}
                placeholder="your.email@example.com"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>
            
            {/* Company Name - Optional */}
            <div>
              <label className="block text-gray-700 font-semibold text-sm mb-2 flex items-center gap-2">
                <Building className="w-4 h-4 text-gray-400" />
                Company Name <span className="text-gray-400 text-xs">(optional)</span>
              </label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                placeholder="Your company name"
              />
            </div>
            
            {/* Title - Optional */}
            <div>
              <label className="block text-gray-700 font-semibold text-sm mb-2 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-gray-400" />
                Title <span className="text-gray-400 text-xs">(optional)</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                placeholder="Your job title"
              />
            </div>
            
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm">
                {errors.submit}
              </div>
            )}
            
            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600 text-white font-bold py-4 rounded-xl shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isSubmitting ? 'Signing Up...' : 'Join & Save Quote'}
            </button>
            
            <p className="text-xs text-gray-500 text-center">
              By joining, you agree to our terms of service and privacy policy
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

