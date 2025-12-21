/**
 * About View
 * ==========
 * 
 * Simple about page for Merlin BESS platform
 */

import React from 'react';
import { ArrowLeft, Zap } from 'lucide-react';
import merlinImage from '../../assets/images/new_profile_merlin.png';

interface AboutViewProps {
  onBack: () => void;
  onJoinNow?: () => void;
  onStartWizard?: () => void;
}

const AboutView: React.FC<AboutViewProps> = ({ onBack, onJoinNow, onStartWizard }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-800">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          <div className="flex items-center gap-2">
            <img src={merlinImage} alt="Merlin" className="w-10 h-10" />
            <span className="text-xl font-bold text-white">Merlin</span>
          </div>
        </div>
      </header>
      
      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20">
          <h1 className="text-4xl font-black text-white mb-6 text-center">
            About Merlin BESS
          </h1>
          
          <div className="prose prose-invert prose-lg mx-auto">
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-purple-300 mb-4">Our Mission</h2>
              <p className="text-white/90">
                Merlin BESS is a professional Battery Energy Storage System (BESS) financial analysis 
                and quote generation platform. Our mission is to transform complex energy storage 
                calculations into user-friendly workflows with investment-grade financial modeling.
              </p>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-purple-300 mb-4">What We Do</h2>
              <ul className="list-disc list-inside space-y-2 text-white/90">
                <li>Target IRR-based pricing calculations</li>
                <li>Professional battery capacity fading models</li>
                <li>Multiple revenue stream modeling</li>
                <li>Break-even analysis and sensitivity modeling</li>
                <li>Comprehensive cost estimation by region</li>
                <li>Tax incentive calculations (ITC, MACRS)</li>
              </ul>
            </section>
            
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-purple-300 mb-4">Technology</h2>
              <p className="text-white/90">
                Built with React + TypeScript frontend, Supabase backend, and powered by 
                NREL ATB 2024 pricing data for accurate, up-to-date cost estimates.
              </p>
            </section>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-4 mt-8">
            {onStartWizard && (
              <button
                onClick={onStartWizard}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-purple-600 hover:to-indigo-600 transition-colors"
              >
                <Zap className="w-5 h-5" />
                Start Quote Builder
              </button>
            )}
            {onJoinNow && (
              <button
                onClick={onJoinNow}
                className="bg-white/20 text-white px-6 py-3 rounded-xl font-semibold hover:bg-white/30 transition-colors"
              >
                Join Now
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AboutView;
