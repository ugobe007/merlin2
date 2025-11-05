import React from 'react';
import { Sparkles, Target, Building2, Settings, MapPin, FileText, ArrowRight } from 'lucide-react';

interface StepIntroProps {
  onStart: () => void;
}

const StepIntro: React.FC<StepIntroProps> = ({ onStart }) => {
  const steps = [
    {
      icon: Target,
      number: 1,
      title: 'Your Goals',
      description: 'Tell us what you want to achieve',
      examples: 'Save money, go green, backup power',
      color: 'blue',
    },
    {
      icon: Building2,
      number: 2,
      title: 'Your Industry',
      description: 'Select your business type',
      examples: 'Hotel, datacenter, EV charging, casino',
      color: 'purple',
    },
    {
      icon: Settings,
      number: 3,
      title: 'Use Case Details',
      description: 'Answer a few questions about your operation',
      examples: '# of rooms, grid status, power needs',
      color: 'green',
    },
    {
      icon: Sparkles,
      number: 4,
      title: 'AI Recommendations',
      description: 'See your personalized system configuration',
      examples: 'Optimal size, ROI, potential savings',
      color: 'yellow',
    },
    {
      icon: MapPin,
      number: 5,
      title: 'Location & Pricing',
      description: 'Refine based on your location',
      examples: 'Local utility rates, incentives',
      color: 'pink',
    },
    {
      icon: FileText,
      number: 6,
      title: 'Your Quote',
      description: 'Review and download your custom quote',
      examples: 'Installation, financing, ROI details',
      color: 'indigo',
    },
  ];

  const getColorClasses = (color: string) => {
    const colors: { [key: string]: string } = {
      blue: 'from-blue-500 to-cyan-500',
      purple: 'from-purple-500 to-violet-500',
      green: 'from-green-500 to-emerald-500',
      yellow: 'from-yellow-500 to-orange-500',
      pink: 'from-pink-500 to-rose-500',
      indigo: 'from-indigo-500 to-blue-500',
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full mb-6">
          <Sparkles className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to the Smart Wizard
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Get your personalized energy storage quote in just <strong>5-10 minutes</strong>. 
          Our AI-powered wizard will guide you through 6 simple steps to create the perfect solution for your business.
        </p>
      </div>

      {/* Steps Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {steps.map((step) => (
          <div
            key={step.number}
            className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-200 hover:border-purple-300 hover:shadow-xl transition-all"
          >
            <div className="flex items-start gap-4 mb-4">
              <div className={`flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br ${getColorClasses(step.color)} flex items-center justify-center`}>
                <step.icon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-bold text-gray-400">STEP {step.number}</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">{step.title}</h3>
                <p className="text-sm text-gray-600 mb-2">{step.description}</p>
                <p className="text-xs text-gray-500 italic">{step.examples}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Benefits */}
      <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 rounded-2xl p-8 mb-8 border-2 border-purple-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">What You'll Get:</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-4xl mb-3">💰</div>
            <h3 className="font-bold text-gray-900 mb-2">Detailed Cost Breakdown</h3>
            <p className="text-sm text-gray-600">Equipment, installation, shipping, and financing options</p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-3">📊</div>
            <h3 className="font-bold text-gray-900 mb-2">ROI Analysis</h3>
            <p className="text-sm text-gray-600">Annual savings, payback period, and 20-year projections</p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-3">✨</div>
            <h3 className="font-bold text-gray-900 mb-2">AI-Optimized System</h3>
            <p className="text-sm text-gray-600">Personalized recommendations based on your specific needs</p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center">
        <button
          onClick={onStart}
          className="inline-flex items-center gap-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-12 py-5 rounded-2xl text-xl font-bold shadow-2xl hover:shadow-3xl transition-all hover:scale-105"
        >
          <Sparkles className="w-6 h-6" />
          <span>Start Smart Wizard</span>
          <ArrowRight className="w-6 h-6" />
        </button>
        <p className="text-sm text-gray-500 mt-4">Takes 5-10 minutes • No credit card required • Instant quote</p>
      </div>

      {/* Trust Indicators */}
      <div className="mt-12 pt-8 border-t-2 border-gray-200">
        <div className="flex flex-wrap items-center justify-center gap-8 text-center">
          <div>
            <div className="text-2xl font-bold text-gray-900">25+</div>
            <div className="text-sm text-gray-600">Industry Types</div>
          </div>
          <div className="hidden md:block w-px h-12 bg-gray-300"></div>
          <div>
            <div className="text-2xl font-bold text-gray-900">1000+</div>
            <div className="text-sm text-gray-600">Projects Quoted</div>
          </div>
          <div className="hidden md:block w-px h-12 bg-gray-300"></div>
          <div>
            <div className="text-2xl font-bold text-gray-900">$50M+</div>
            <div className="text-sm text-gray-600">Total Savings Generated</div>
          </div>
          <div className="hidden md:block w-px h-12 bg-gray-300"></div>
          <div>
            <div className="text-2xl font-bold text-gray-900">4.9/5</div>
            <div className="text-sm text-gray-600">Customer Rating</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StepIntro;
