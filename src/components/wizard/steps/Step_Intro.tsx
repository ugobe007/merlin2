import React from 'react';
import { Sparkles, ArrowRight, Zap, TrendingUp, FileCheck, Clock, Shield, Users } from 'lucide-react';
import merlinImage from '../../../assets/images/new_Merlin.png';

interface StepIntroProps {
  onStart: () => void;
  onSkipToAdvanced?: () => void;
}

const StepIntro: React.FC<StepIntroProps> = ({ onStart, onSkipToAdvanced }) => {
  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Hero Section with Merlin Icon */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-24 h-24 mb-6">
          <img 
            src={merlinImage} 
            alt="Merlin Energy Storage" 
            className="w-full h-full object-contain"
          />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Smart Quote Wizard
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
          Get a personalized energy storage system quote tailored to your business needs. 
          Our intelligent wizard analyzes your requirements and delivers a comprehensive proposal in minutes.
        </p>

        {/* Primary CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-3">
          <button
            onClick={onStart}
            className="inline-flex items-center gap-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-12 py-5 rounded-xl text-xl font-bold shadow-xl hover:shadow-2xl transition-all hover:scale-105"
          >
            <Sparkles className="w-6 h-6" />
            <span>Start Guided Wizard</span>
            <ArrowRight className="w-6 h-6" />
          </button>
          
          {onSkipToAdvanced && (
            <button
              onClick={onSkipToAdvanced}
              className="inline-flex items-center gap-3 bg-white hover:bg-gray-50 text-gray-900 px-8 py-5 rounded-xl text-lg font-semibold border-2 border-gray-300 hover:border-purple-400 shadow-lg hover:shadow-xl transition-all"
            >
              <Zap className="w-5 h-5 text-purple-600" />
              <span>Advanced: Custom Quote Builder</span>
            </button>
          )}
        </div>
        <p className="text-sm text-gray-500">
          <Clock className="inline w-4 h-4 mr-1" />
          Takes 5-10 minutes • No credit card required • Instant results
        </p>
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

      {/* Process Overview - Simplified */}
      <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-gray-200 mb-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">How It Works</h2>
        <div className="grid md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-2xl font-bold">
              1
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Select Industry</h3>
            <p className="text-sm text-gray-600">Choose your business type or create a custom profile</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center text-white text-2xl font-bold">
              2
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Answer Questions</h3>
            <p className="text-sm text-gray-600">Provide details about your operation and energy needs</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white text-2xl font-bold">
              3
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Configure System</h3>
            <p className="text-sm text-gray-600">Adjust power, storage, and renewable energy options</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center text-white text-2xl font-bold">
              4
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Get Your Quote</h3>
            <p className="text-sm text-gray-600">Download detailed proposal with pricing and ROI analysis</p>
          </div>
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
