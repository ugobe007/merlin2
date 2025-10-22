import React, { useState } from 'react';
import { X, Sparkles, Zap, Save, Users, Shield, TrendingUp } from 'lucide-react';

interface JoinMerlinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignUp: () => void;
}

export default function JoinMerlinModal({ isOpen, onClose, onSignUp }: JoinMerlinModalProps) {
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
              Create an account and unlock powerful tools for BESS quoting
            </p>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="p-8">
          <h3 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Why Join Merlin? 🚀
          </h3>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Save Projects */}
            <div className="p-6 rounded-2xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white hover:shadow-lg transition-all">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-purple-100 rounded-xl">
                  <Save className="text-purple-600" size={32} />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">Save Your Projects</h4>
                  <p className="text-gray-700">
                    Never lose your work! Save unlimited BESS configurations and quotes to your personal portfolio.
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
                  <h4 className="text-xl font-bold text-gray-900 mb-2">Team Collaboration</h4>
                  <p className="text-gray-700">
                    Company accounts get 5 free user seats. Share projects and collaborate with your team.
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
                  <h4 className="text-xl font-bold text-gray-900 mb-2">Advanced Analytics</h4>
                  <p className="text-gray-700">
                    Track ROI, compare scenarios, and generate professional reports for clients.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Free Forever Section */}
          <div className="bg-gradient-to-br from-purple-100 to-blue-100 p-8 rounded-2xl border-2 border-purple-300 mb-8">
            <div className="flex items-center justify-center space-x-4 mb-4">
              <Shield className="text-purple-600" size={48} />
              <h3 className="text-3xl font-bold text-gray-900">100% Free Forever</h3>
            </div>
            <div className="text-center space-y-2">
              <p className="text-xl text-gray-700">
                ✅ No credit card required
              </p>
              <p className="text-xl text-gray-700">
                ✅ Unlimited projects and quotes
              </p>
              <p className="text-xl text-gray-700">
                ✅ All features included
              </p>
              <p className="text-xl text-gray-700">
                ✅ Company accounts get 5 team seats
              </p>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={onSignUp}
              className="flex-1 bg-gradient-to-b from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 text-white px-8 py-5 rounded-xl font-bold text-xl shadow-xl transition-all duration-200 border-b-4 border-purple-800 hover:border-purple-900 transform hover:scale-105"
            >
              🎉 Create Free Account
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-white border-2 border-gray-300 hover:border-purple-400 text-gray-700 hover:text-purple-700 px-8 py-5 rounded-xl font-bold text-xl transition-all duration-200"
            >
              Maybe Later
            </button>
          </div>

          {/* Fine Print */}
          <p className="text-center text-sm text-gray-500 mt-6">
            Join thousands of energy professionals using Merlin to create winning BESS quotes
          </p>
        </div>
      </div>
    </div>
  );
}
