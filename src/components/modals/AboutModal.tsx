/**
 * About Merlin Modal
 * Popup version of the About Merlin page with company info and capabilities
 */

import React from 'react';
import { X, Zap, BarChart3, Shield, Globe, Sparkles, ArrowRight } from 'lucide-react';
import merlinImage from "../../assets/images/new_Merlin.png";

interface AboutModalProps {
  show: boolean;
  onClose: () => void;
  onStartWizard?: () => void;
}

const AboutModal: React.FC<AboutModalProps> = ({ show, onClose, onStartWizard }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-purple-900 via-purple-800 to-indigo-900 rounded-t-2xl p-8 overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-4 left-4 w-32 h-32 border border-white rounded-full" />
            <div className="absolute top-8 right-8 w-24 h-24 border border-white rounded-full" />
            <div className="absolute bottom-4 left-1/3 w-16 h-16 border border-white rounded-full" />
          </div>
          
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm text-white p-2 rounded-full hover:bg-white/30 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="flex items-center gap-6 relative z-10">
            <img 
              src={merlinImage} 
              alt="Merlin" 
              className="w-24 h-24 object-contain drop-shadow-[0_4px_16px_rgba(255,255,255,0.3)]"
            />
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">About Merlin Energy</h1>
              <p className="text-purple-200 text-lg">Professional BESS Financial Analysis Platform</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-8">
          {/* Mission Statement */}
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="bg-purple-600 p-3 rounded-xl">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Our Mission</h2>
                <p className="text-gray-700 leading-relaxed">
                  Merlin Energy transforms complex battery energy storage calculations into user-friendly workflows 
                  with investment-grade financial modeling. We help businesses unlock millions in energy savings 
                  with professional BESS analysis — all in under 5 minutes.
                </p>
              </div>
            </div>
          </div>

          {/* Capabilities Grid */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Platform Capabilities</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-green-50 border-2 border-green-200 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-green-600 p-2 rounded-lg">
                    <BarChart3 className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900">Financial Modeling</h3>
                </div>
                <ul className="space-y-2 text-gray-700 text-sm">
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> Target IRR-based pricing calculations
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> Battery capacity fading models
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> Multiple revenue stream modeling
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> Break-even & sensitivity analysis
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> Monte Carlo risk simulations
                  </li>
                </ul>
              </div>

              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-blue-600 p-2 rounded-lg">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900">Project Analysis</h3>
                </div>
                <ul className="space-y-2 text-gray-700 text-sm">
                  <li className="flex items-center gap-2">
                    <span className="text-blue-500">✓</span> Regional cost estimation
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-blue-500">✓</span> Use case optimization & ROI
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-blue-500">✓</span> Currency & localization support
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-blue-500">✓</span> Tax incentives (ITC, MACRS)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-blue-500">✓</span> Professional quote generation
                  </li>
                </ul>
              </div>

              <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-orange-600 p-2 rounded-lg">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900">Industry Standards</h3>
                </div>
                <ul className="space-y-2 text-gray-700 text-sm">
                  <li className="flex items-center gap-2">
                    <span className="text-orange-500">✓</span> NREL ATB 2024 cost data
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-orange-500">✓</span> IEEE energy storage standards
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-orange-500">✓</span> ASHRAE & CBECS power data
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-orange-500">✓</span> Investment-grade methodologies
                  </li>
                </ul>
              </div>

              <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-purple-600 p-2 rounded-lg">
                    <Globe className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900">30+ Use Cases</h3>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-700">
                  <span>🏢 Office Buildings</span>
                  <span>🏨 Hotels & Resorts</span>
                  <span>🏭 Manufacturing</span>
                  <span>⚡ EV Charging</span>
                  <span>❄️ Cold Storage</span>
                  <span>🏪 Retail & Grocery</span>
                  <span>🏥 Healthcare</span>
                  <span>📡 Data Centers</span>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-8 text-center">
            <h3 className="text-2xl font-bold text-white mb-3">Ready to unlock your energy savings?</h3>
            <p className="text-purple-100 mb-6 max-w-2xl mx-auto">
              Get your personalized BESS quote in under 5 minutes. No signup required, 100% free.
            </p>
            <button
              onClick={() => {
                onClose();
                onStartWizard?.();
              }}
              className="bg-white text-purple-700 px-8 py-4 rounded-full font-bold text-lg hover:bg-purple-50 transition-all hover:scale-105 inline-flex items-center gap-3 shadow-xl"
            >
              Get My Free Quote
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutModal;
