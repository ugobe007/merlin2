import React, { useState } from 'react';
import { X, Send, Calendar, MessageSquare } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';

interface ConsultationModalProps {
  isOpen: boolean;
  onClose: () => void;
  quoteData?: any;
}

const ConsultationModal: React.FC<ConsultationModalProps> = ({
  isOpen,
  onClose,
  quoteData
}) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      // Save to Supabase customer_leads table
      const { data, error } = await supabase
        .from('customer_leads')
        .insert([
          {
            email,
            name,
            notes,
            quote_data: quoteData,
            created_at: new Date().toISOString(),
            lead_type: 'consultation_request'
          }
        ]);

      if (error) throw error;

      // Send email in background (mailto with pre-filled content)
      const subject = encodeURIComponent(`Consultation Request from ${name || email}`);
      const body = encodeURIComponent(
        `New consultation request:\n\n` +
        `Name: ${name || 'Not provided'}\n` +
        `Email: ${email}\n\n` +
        `Notes:\n${notes || 'No additional notes'}\n\n` +
        `Quote Data: ${quoteData ? JSON.stringify(quoteData, null, 2) : 'No quote data'}`
      );
      
      // Open mailto in hidden iframe to avoid navigation
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = `mailto:info@merlinenergy.com?subject=${subject}&body=${body}`;
      document.body.appendChild(iframe);
      setTimeout(() => document.body.removeChild(iframe), 1000);

      setSubmitSuccess(true);
      setTimeout(() => {
        onClose();
        setSubmitSuccess(false);
        setEmail('');
        setName('');
        setNotes('');
      }, 2000);

    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to submit request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Calendar className="w-8 h-8" />
            <div>
              <h2 className="text-2xl font-bold">Schedule Free Consultation</h2>
              <p className="text-blue-100 text-sm">We'll review your quote and get in touch</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {submitSuccess ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">✅</div>
              <h3 className="text-2xl font-bold text-green-600 mb-2">Request Submitted!</h3>
              <p className="text-gray-600">
                We've received your consultation request and will contact you shortly.
              </p>
            </div>
          ) : (
            <>
              {/* Info Section */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                <h3 className="font-bold text-blue-900 mb-2 flex items-center space-x-2">
                  <MessageSquare className="w-5 h-5" />
                  <span>What happens next?</span>
                </h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>✓ We'll receive your request immediately</li>
                  <li>✓ Our team will review your quote details</li>
                  <li>✓ We'll reach out within 24 hours to schedule a consultation</li>
                  <li>✓ Discuss options, pricing, and next steps</li>
                </ul>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
                    placeholder="John Smith"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
                    placeholder="john@company.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Additional Notes (Optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors resize-none"
                    placeholder="Tell us about your project timeline, specific requirements, or any questions you have..."
                  />
                </div>

                {errorMessage && (
                  <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 text-red-700">
                    {errorMessage}
                  </div>
                )}

                {/* Quote Summary */}
                {quoteData && (
                  <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Your Quote Summary</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      {quoteData.capacity && (
                        <div>Capacity: <span className="font-semibold">{quoteData.capacity} kWh</span></div>
                      )}
                      {quoteData.power && (
                        <div>Power: <span className="font-semibold">{quoteData.power} kW</span></div>
                      )}
                      {quoteData.totalCost && (
                        <div>Estimated Cost: <span className="font-semibold">${quoteData.totalCost.toLocaleString()}</span></div>
                      )}
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        <span>Submit Request</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConsultationModal;
