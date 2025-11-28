import React from 'react';
import { Sparkles, ArrowRight, Zap, TrendingUp, FileCheck, Clock, Shield, Users } from 'lucide-react';
import merlinImage from '@/assets/images/new_Merlin.png';

interface StepIntroProps {
  onStart: () => void;
  onSkipToAdvanced?: () => void;
}

const StepIntro: React.FC<StepIntroProps> = ({ onStart, onSkipToAdvanced }) => {
  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Merlin's House - Hero Section */}
      <div className="mb-12">
        <div className="flex flex-col md:flex-row items-center gap-8 bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 rounded-3xl p-8 border-4 border-purple-200 shadow-2xl">
          {/* Merlin in a Box - Left Side */}
          <div className="flex-shrink-0">
            <div className="relative">
              {/* Decorative background circle */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-400 via-blue-400 to-indigo-400 rounded-3xl blur-2xl opacity-30 animate-pulse"></div>
              
              {/* Merlin's Box */}
              <div className="relative bg-gradient-to-br from-purple-100 via-blue-100 to-indigo-100 rounded-3xl p-8 border-4 border-purple-300 shadow-xl">
                <div className="w-48 h-48 md:w-56 md:h-56 flex items-center justify-center">
                  <img 
                    src={merlinImage} 
                    alt="Merlin - Your Energy Storage Guide" 
                    className="w-full h-full object-contain drop-shadow-2xl"
                  />
                </div>
                {/* Magical sparkles decoration */}
                <div className="absolute -top-2 -right-2">
                  <Sparkles className="w-8 h-8 text-yellow-400 animate-pulse" />
                </div>
                <div className="absolute -bottom-2 -left-2">
                  <Sparkles className="w-6 h-6 text-purple-400 animate-pulse" style={{ animationDelay: '0.5s' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Welcome Message - Right Side */}
          <div className="flex-1 text-center md:text-left">
            <div className="mb-6">
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500 bg-clip-text text-transparent mb-4 drop-shadow-md">
                Welcome to Merlin!
              </h1>
              <p className="text-xl md:text-2xl text-gray-700 font-medium mb-2">
                Let me guide you through your perfect energy storage solution
              </p>
              <p className="text-lg text-gray-600">
                In just 5-10 minutes, I'll help you create a customized BESS quote with precise pricing, savings projections, and ROI analysis.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4 mb-4">
              <button
                onClick={onStart}
                className="inline-flex items-center gap-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-10 py-4 rounded-xl text-xl font-bold shadow-xl hover:shadow-2xl transition-all hover:scale-105 animate-pulse shadow-purple-500/50"
                style={{
                  boxShadow: '0 0 20px rgba(147, 51, 234, 0.5), 0 0 40px rgba(59, 130, 246, 0.3)'
                }}
              >
                <Sparkles className="w-6 h-6" />
                <span>Start Guided Wizard</span>
                <ArrowRight className="w-6 h-6" />
              </button>
              
              {onSkipToAdvanced && (
                <button
                  onClick={onSkipToAdvanced}
                  className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-8 py-4 rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105"
                >
                  <Zap className="w-5 h-5" />
                  <span>Advanced: Custom Quote Builder</span>
                </button>
              )}
            </div>

            {/* Quick Info */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-600" />
                <span>5-10 minutes</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-600" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-indigo-600" />
                <span>Instant results</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* What You'll Get Section - Expanded */}
      <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 rounded-2xl p-8 mb-12 border-2 border-purple-200">
        <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">What You'll Receive</h2>
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="text-4xl mb-3">💰</div>
            <h3 className="font-bold text-gray-900 mb-2 text-lg">Complete Cost Analysis</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Equipment pricing</li>
              <li>• Installation costs</li>
              <li>• Shipping & logistics</li>
              <li>• Tax credit calculations</li>
              <li>• Financing options</li>
            </ul>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="text-4xl mb-3">📊</div>
            <h3 className="font-bold text-gray-900 mb-2 text-lg">Financial Projections</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Annual savings estimate</li>
              <li>• Payback period</li>
              <li>• 10 & 20-year ROI</li>
              <li>• Demand charge reductions</li>
              <li>• Energy arbitrage gains</li>
            </ul>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="text-4xl mb-3">⚡</div>
            <h3 className="font-bold text-gray-900 mb-2 text-lg">System Configuration</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Optimized battery size</li>
              <li>• Storage duration</li>
              <li>• Solar/wind integration</li>
              <li>• Backup power options</li>
              <li>• Smart control systems</li>
            </ul>
          </div>
        </div>

        {/* Example Quote Preview */}
        <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-purple-300">
          <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">Example Quote Summary</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span className="font-semibold text-gray-700">Power Output:</span>
                <span className="text-xl font-bold text-blue-600">2.0 MW</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="font-semibold text-gray-700">Energy Storage:</span>
                <span className="text-xl font-bold text-green-600">8.0 MWh</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                <span className="font-semibold text-gray-700">Duration:</span>
                <span className="text-xl font-bold text-purple-600">4 hours</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="font-semibold text-gray-700">Total Cost:</span>
                <span className="text-xl font-bold text-gray-900">$2.4M</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="font-semibold text-gray-700">Annual Savings:</span>
                <span className="text-xl font-bold text-green-600">$380K/yr</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                <span className="font-semibold text-gray-700">Payback Period:</span>
                <span className="text-xl font-bold text-yellow-600">6.3 years</span>
              </div>
            </div>
          </div>
          <p className="text-center text-sm text-gray-500 mt-4 italic">
            * Your actual quote will be customized based on your specific requirements
          </p>
        </div>
      </div>

      {/* Step-by-Step Guide - Detailed */}
      <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-gray-200 mb-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-3 text-center">Your Step-by-Step Journey</h2>
        <p className="text-center text-gray-600 mb-8">Here's exactly what to expect in the next 5-10 minutes</p>
        
        <div className="space-y-6">
          {/* Step 1 */}
          <div className="flex gap-4 p-6 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border-2 border-blue-200">
            <div className="flex-shrink-0">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                1
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Choose Your Industry Template</h3>
              <p className="text-gray-700 mb-3">Select from 30+ pre-configured industry profiles (hotel, manufacturing, EV charging, etc.) or start from scratch with "Custom Project"</p>
              <div className="bg-white/60 rounded-lg p-3 text-sm">
                <p className="font-semibold text-blue-800 mb-1">What you'll do:</p>
                <ul className="text-gray-600 space-y-1">
                  <li>• Browse industry categories</li>
                  <li>• Review typical use cases</li>
                  <li>• Select the best match for your business</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex gap-4 p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200">
            <div className="flex-shrink-0">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                2
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Answer Simple Questions</h3>
              <p className="text-gray-700 mb-3">Tell us about your operation - questions adapt based on your industry</p>
              <div className="bg-white/60 rounded-lg p-3 text-sm">
                <p className="font-semibold text-purple-800 mb-1">Examples you'll answer:</p>
                <ul className="text-gray-600 space-y-1">
                  <li>• Location (for utility rates & incentives)</li>
                  <li>• Facility size (square footage or rooms)</li>
                  <li>• Current electricity rate ($/kWh)</li>
                  <li>• Primary goal (cost savings, backup power, etc.)</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex gap-4 p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-200">
            <div className="flex-shrink-0">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                3
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Configure Battery System</h3>
              <p className="text-gray-700 mb-3">Adjust power output (MW) and storage duration (hours) with real-time cost updates</p>
              <div className="bg-white/60 rounded-lg p-3 text-sm">
                <p className="font-semibold text-green-800 mb-1">You'll see:</p>
                <ul className="text-gray-600 space-y-1">
                  <li>• AI-recommended system size based on your needs</li>
                  <li>• Interactive sliders to customize power & storage</li>
                  <li>• Live pricing updates as you adjust values</li>
                  <li>• Comparison of different battery chemistries (LFP, NMC, etc.)</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Step 4 */}
          <div className="flex gap-4 p-6 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border-2 border-yellow-200">
            <div className="flex-shrink-0">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                4
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Add Renewable Energy (Optional)</h3>
              <p className="text-gray-700 mb-3">Include solar panels, wind turbines, or backup generators for a complete hybrid system</p>
              <div className="bg-white/60 rounded-lg p-3 text-sm">
                <p className="font-semibold text-orange-800 mb-1">Optional add-ons:</p>
                <ul className="text-gray-600 space-y-1">
                  <li>• Solar PV (rooftop, ground-mount, or carport)</li>
                  <li>• Wind turbines (if suitable for location)</li>
                  <li>• Backup generators (diesel or natural gas)</li>
                  <li>• EV charging infrastructure</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Step 5 */}
          <div className="flex gap-4 p-6 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl border-2 border-indigo-200">
            <div className="flex-shrink-0">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                5
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Choose Project Details</h3>
              <p className="text-gray-700 mb-3">Select installation timeline, shipping options, and financing preferences</p>
              <div className="bg-white/60 rounded-lg p-3 text-sm">
                <p className="font-semibold text-indigo-800 mb-1">You'll configure:</p>
                <ul className="text-gray-600 space-y-1">
                  <li>• Installation timeline (3, 6, or 12+ months)</li>
                  <li>• Shipping method (standard, expedited, or white-glove)</li>
                  <li>• Financing option (cash, loan, lease, or PPA)</li>
                  <li>• Warranty coverage (10, 15, or 20 years)</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Step 6 */}
          <div className="flex gap-4 p-6 bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl border-2 border-pink-300 shadow-lg">
            <div className="flex-shrink-0">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                6
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-2">📋 Get Your Comprehensive Quote</h3>
              <p className="text-gray-700 mb-3">Receive a detailed proposal with everything you need to move forward</p>
              <div className="bg-white/60 rounded-lg p-3 text-sm">
                <p className="font-semibold text-pink-800 mb-1">Your quote includes:</p>
                <ul className="text-gray-600 space-y-1">
                  <li>• ✅ Complete equipment breakdown with pricing</li>
                  <li>• 💰 Total project cost (equipment + installation + shipping)</li>
                  <li>• 📊 Financial analysis (annual savings, payback, 10-20 year ROI)</li>
                  <li>• 💵 Tax credits & incentives (ITC, SGIP, state programs)</li>
                  <li>• 📈 Energy bill reduction projections</li>
                  <li>• 📄 Professional PDF you can share with stakeholders</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Time Estimate */}
        <div className="mt-8 text-center bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6 border-2 border-gray-300">
          <p className="text-lg font-semibold text-gray-900 mb-2">
            <Clock className="inline w-5 h-5 mr-2 text-blue-600" />
            Total Time: 5-10 minutes
          </p>
          <p className="text-sm text-gray-600">
            You can save your progress at any step and return later. No account required to get started.
          </p>
        </div>
      </div>

      {/* Benefits Grid */}
      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border-2 border-blue-200">
          <TrendingUp className="w-10 h-10 text-blue-600 mb-3" />
          <h3 className="font-bold text-gray-900 mb-2 text-lg">AI-Optimized</h3>
          <p className="text-sm text-gray-600">
            Advanced algorithms analyze your usage patterns and recommend the most cost-effective configuration for maximum ROI.
          </p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border-2 border-purple-200">
          <FileCheck className="w-10 h-10 text-purple-600 mb-3" />
          <h3 className="font-bold text-gray-900 mb-2 text-lg">Industry Standards</h3>
          <p className="text-sm text-gray-600">
            Based on real-world data from thousands of installations. Our calculations follow NREL and DOE methodologies.
          </p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border-2 border-green-200">
          <Shield className="w-10 h-10 text-green-600 mb-3" />
          <h3 className="font-bold text-gray-900 mb-2 text-lg">Trusted & Transparent</h3>
          <p className="text-sm text-gray-600">
            Clear pricing with no hidden fees. All calculations explained with links to our methodology and data sources.
          </p>
        </div>
      </div>

      {/* Trust Indicators */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-8 border-2 border-gray-200">
        <div className="grid md:grid-cols-4 gap-6 text-center">
          <div>
            <div className="text-3xl font-bold text-gray-900">30+</div>
            <div className="text-sm text-gray-600">Industry Templates</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-900">50,000+</div>
            <div className="text-sm text-gray-600">Quotes Generated</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-900">$5B+</div>
            <div className="text-sm text-gray-600">Projects Valued</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-900">98%</div>
            <div className="text-sm text-gray-600">Customer Satisfaction</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StepIntro;
