import React from 'react';
import { X, Sparkles, Zap, Save, Users, TrendingUp } from 'lucide-react';

interface JoinMerlinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onViewPricing: () => void;
}

export default function JoinMerlinModal({ isOpen, onClose, onViewPricing }: JoinMerlinModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full relative animate-in fade-in zoom-in duration-300 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-6 top-6 text-gray-400 hover:text-gray-600 transition-colors z-10"
        >
          <X size={28} />
        </button>

        {/* Header */}
        <div className="bg-gradient-to-br from-purple-600 via-purple-500 to-blue-600 text-white p-12 rounded-t-3xl">
          <div className="text-center">
            <div className="inline-block mb-4">
              <Sparkles size={64} className="animate-pulse" />
            </div>
            <h2 className="text-5xl font-bold mb-4">Join Merlin Energy</h2>
            <p className="text-xl text-purple-100">
              Try it free, then unlock powerful features for professional BESS quoting
            </p>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="p-8">
          <h3 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Experience Merlin's Power 🚀
          </h3>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Save Projects */}
            <div className="p-6 rounded-2xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white hover:shadow-lg transition-all">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-purple-100 rounded-xl">
                  <Save className="text-purple-600" size={32} />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">Save Your Projects 💎</h4>
                  <p className="text-gray-700">
                    Premium members get unlimited saves for all BESS configurations and quotes.
                  </p>
                </div>
              </div>
            </div>

            {/* Smart Wizard */}
            <div className="p-6 rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white hover:shadow-lg transition-all">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Zap className="text-blue-600" size={32} />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">Smart Wizard Access</h4>
                  <p className="text-gray-700">
                    Use our AI-powered wizard to create professional quotes in minutes, not hours.
                  </p>
                </div>
              </div>
            </div>

            {/* Team Collaboration */}
            <div className="p-6 rounded-2xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-white hover:shadow-lg transition-all">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-green-100 rounded-xl">
                  <Users className="text-green-600" size={32} />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">Team Collaboration 💎</h4>
                  <p className="text-gray-700">
                    Business plans include team seats. Share projects and collaborate seamlessly.
                  </p>
                </div>
              </div>
            </div>

            {/* Advanced Features */}
            <div className="p-6 rounded-2xl border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-white hover:shadow-lg transition-all">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-orange-100 rounded-xl">
                  <TrendingUp className="text-orange-600" size={32} />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">Advanced Analytics 💎</h4>
                  <p className="text-gray-700">
                    Premium: Track ROI, compare scenarios, and generate professional client reports.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Try It Now Section */}
          <div className="bg-gradient-to-br from-purple-100 to-blue-100 p-8 rounded-2xl border-2 border-purple-300 mb-8">
            <div className="flex items-center justify-center space-x-4 mb-4">
              <Sparkles className="text-purple-600" size={48} />
              <h3 className="text-3xl font-bold text-gray-900">Start Free - Upgrade Anytime</h3>
            </div>
            <div className="text-center space-y-3">
              <p className="text-2xl font-bold text-purple-700 mb-2">
                Try Merlin with Limited Features
              </p>
              <p className="text-lg text-gray-700">
                ✅ No credit card required to start
              </p>
              <p className="text-lg text-gray-700">
                ✅ Create and explore basic BESS quotes
              </p>
              <p className="text-lg text-gray-700">
                ✅ See how Merlin can transform your workflow
              </p>
              <div className="mt-6 pt-4 border-t-2 border-purple-300">
                <p className="text-lg font-bold text-gray-900 mb-2">
                  🚀 Upgrade for Full Power:
                </p>
                <p className="text-base text-gray-700">
                  Unlimited saves, advanced analytics, team collaboration, and more
                </p>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={onViewPricing}
              className="flex-1 bg-gradient-to-b from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 text-white px-8 py-5 rounded-xl font-bold text-xl shadow-xl transition-all duration-200 border-b-4 border-purple-800 hover:border-purple-900 transform hover:scale-105"
            >
              🚀 Try Merlin Now
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-white border-2 border-gray-300 hover:border-purple-400 text-gray-700 hover:text-purple-700 px-8 py-5 rounded-xl font-bold text-xl transition-all duration-200"
            >
              Not Right Now
            </button>
          </div>

          {/* Fine Print */}
          <p className="text-center text-sm text-gray-500 mt-6">
            Join thousands of energy professionals creating winning BESS quotes with Merlin
          </p>
        </div>
      </div>
    </div>
  );
}
