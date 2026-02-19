/**
 * RequestQuoteModal.tsx
 * Professional quote request form - replaces mailto: links
 * Captures lead info: name, company, email, phone, message
 */

import React, { useState } from "react";
import {
  X,
  Mail,
  User,
  Building2,
  Phone,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Send,
  Shield,
} from "lucide-react";
import { supabase } from "../../services/supabaseClient";

interface RequestQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  quoteData?: {
    storageSizeMW?: number;
    durationHours?: number;
    energyCapacity?: number;
    solarMW?: number;
    totalCost?: number;
    industryName?: string;
    location?: string;
  };
}

const RequestQuoteModal: React.FC<RequestQuoteModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  quoteData,
}) => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    company: "",
    phone: "",
    message: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^[\d\s\-\+\(\)\.]{10,}$/;
    return phone.length === 0 || phoneRegex.test(phone);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.firstName.trim()) return setError("Please enter your first name");
    if (!formData.lastName.trim()) return setError("Please enter your last name");
    if (!formData.email.trim()) return setError("Please enter your email");
    if (!validateEmail(formData.email)) return setError("Please enter a valid email address");
    if (!formData.company.trim()) return setError("Please enter your company name");
    if (formData.phone && !validatePhone(formData.phone))
      return setError("Please enter a valid phone number");

    setIsLoading(true);
    setError(null);

    try {
      const { error: insertError } = await (supabase as any).from("quote_requests").insert({
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        company: formData.company.trim(),
        phone: formData.phone.trim() || null,
        message: formData.message.trim() || null,
        quote_data: quoteData || null,
        status: "new",
        created_at: new Date().toISOString(),
      });

      if (insertError) {
        if (import.meta.env.DEV) {
          console.log("Quote request (table may not exist):", insertError);
        }

        const existingRequests = JSON.parse(
          localStorage.getItem("merlin_quote_requests") || "[]"
        );
        existingRequests.push({
          ...formData,
          quoteData,
          timestamp: new Date().toISOString(),
        });
        localStorage.setItem("merlin_quote_requests", JSON.stringify(existingRequests));
      }

      setSuccess(true);

      setTimeout(() => {
        onSuccess?.();
        onClose();
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          company: "",
          phone: "",
          message: "",
        });
        setSuccess(false);
        setIsLoading(false);
      }, 2500);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to submit request. Please try again.";
      console.error("Quote request error:", err);
      setError(message);
      setIsLoading(false);
    }
  };

  const formatSystemSummary = () => {
    if (!quoteData) return null;

    const parts: string[] = [];
    if (quoteData.storageSizeMW) parts.push(`${quoteData.storageSizeMW.toFixed(2)} MW`);
    if (quoteData.durationHours) parts.push(`${quoteData.durationHours}h duration`);
    if (quoteData.energyCapacity) parts.push(`${quoteData.energyCapacity.toFixed(1)} MWh`);
    if (quoteData.solarMW) parts.push(`+ ${quoteData.solarMW.toFixed(1)} MW Solar`);

    return parts.join(" • ");
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden">
          <div className="bg-gradient-to-r from-purple-700 via-indigo-600 to-purple-800 px-6 py-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>

            <div className="relative z-10 flex justify-between items-start">
              <div className="flex items-center gap-4">
                <img src="/images/new_profile_merlin.png" alt="Merlin" className="w-14 h-14 rounded-xl" />
                <div>
                  <h2 className="text-2xl font-bold text-white">Request Official Quote</h2>
                  <p className="text-purple-200 text-sm mt-1">
                    Our energy experts will contact you within 24 hours
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
                disabled={isLoading}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {formatSystemSummary() && (
              <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-white/20 rounded-full text-white text-sm">
                <Sparkles className="w-4 h-4" />
                <span>{formatSystemSummary()}</span>
              </div>
            )}
          </div>

          <div className="p-6">
            {success ? (
              <div className="text-center py-8 space-y-4">
                <div className="mx-auto w-20 h-20 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                  <CheckCircle className="w-12 h-12 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Request Submitted! 🎉</h3>
                <p className="text-gray-600 max-w-sm mx-auto">
                  Thank you, <strong>{formData.firstName}</strong>! Our team will reach out to you
                  at <strong>{formData.email}</strong> within 24 hours.
                </p>
                <div className="flex items-center justify-center gap-2 text-sm text-purple-600 mt-4">
                  <Shield className="w-4 h-4" />
                  <span>Your information is safe with us</span>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      First Name *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange("firstName", e.target.value)}
                        placeholder="John"
                        disabled={isLoading}
                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange("lastName", e.target.value)}
                      placeholder="Smith"
                      disabled={isLoading}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Company Name *
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={formData.company}
                      onChange={(e) => handleInputChange("company", e.target.value)}
                      placeholder="Acme Corporation"
                      disabled={isLoading}
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      placeholder="john@company.com"
                      disabled={isLoading}
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Phone Number <span className="text-gray-400">(optional)</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      placeholder="+1 (555) 123-4567"
                      disabled={isLoading}
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Message <span className="text-gray-400">(optional)</span>
                  </label>
                  <div className="relative">
                    <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <textarea
                      value={formData.message}
                      onChange={(e) => handleInputChange("message", e.target.value)}
                      placeholder="Tell us about your project timeline, specific requirements, or any questions..."
                      disabled={isLoading}
                      rows={3}
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed resize-none"
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-red-900">Error</p>
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                )}

                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-100">
                  <p className="text-sm font-semibold text-purple-900 mb-2">What you&apos;ll receive:</p>
                  <ul className="text-sm text-purple-700 space-y-1">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Official bankable quote with guaranteed pricing
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Detailed equipment specifications
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Installation timeline & financing options
                    </li>
                  </ul>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Submit Request
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {!success && (
            <div className="border-t border-gray-100 px-6 py-4 bg-gray-50">
              <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                <Shield className="w-4 h-4" />
                <span>Your information is encrypted and secure. We never share your data.</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RequestQuoteModal;
