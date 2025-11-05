import React, { useState } from 'react';
import { Wand2, Sparkles, Send, X } from 'lucide-react';

interface QuoteCompletePageProps {
  quoteData: {
    // System configuration
    storageSizeMW: number;
    durationHours: number;
    solarMW: number;
    windMW: number;
    generatorMW: number;
    location: string;
    selectedGoal: string;
    industryTemplate: string | string[];
    
    // Financial
    totalProjectCost: number;
    annualSavings: number;
    paybackYears: number;
    taxCredit: number;
    netCost: number;
    
    // Options selected
    installationOption: string;
    shippingOption: string;
    financingOption: string;
  };
  onDownloadPDF: () => void;
  onDownloadExcel: () => void;
  onDownloadWord: () => void;
  onEmailQuote: (email: string) => void;
  onSaveProject: () => void;
  onRequestConsultation: () => void;
  onClose: () => void;
}

const QuoteCompletePage: React.FC<QuoteCompletePageProps> = ({
  quoteData,
  onDownloadPDF,
  onDownloadExcel,
  onDownloadWord,
  onEmailQuote,
  onSaveProject,
  onRequestConsultation,
  onClose,
}) => {
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [projectSaved, setProjectSaved] = useState(false);
  const [showAIConfig, setShowAIConfig] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<{
    storageSizeMW: number;
    durationHours: number;
    reasoning: string;
  } | null>(null);

  const handleEmailSubmit = () => {
    if (email && email.includes('@')) {
      onEmailQuote(email);
      setEmailSent(true);
      setTimeout(() => setEmailSent(false), 3000);
    }
  };

  const handleSave = () => {
    onSaveProject();
    setProjectSaved(true);
    setTimeout(() => setProjectSaved(false), 3000);
  };

  const handleAIGenerate = () => {
    if (aiPrompt.trim()) {
      setIsGenerating(true);
      
      // Simulate AI processing (in production, this calls your AI service)
      setTimeout(() => {
        const prompt = aiPrompt.toLowerCase();
        let newSize = quoteData.storageSizeMW;
        let newDuration = quoteData.durationHours;
        let reasoning = '';
        
        // Parse user intent and generate smart recommendations
        if (prompt.includes('reduce') || prompt.includes('smaller') || prompt.includes('cheaper')) {
          newSize = Math.max(0.5, quoteData.storageSizeMW * 0.7);
          newDuration = Math.max(2, quoteData.durationHours - 1);
          reasoning = `I've optimized for cost savings by reducing the system to ${newSize.toFixed(1)}MW/${newDuration}hr. This smaller configuration still covers your peak demand periods and reduces upfront costs by ~30% while maintaining ${Math.round((newSize / quoteData.storageSizeMW) * 100)}% of the original capacity.`;
        } else if (prompt.includes('increase') || prompt.includes('bigger') || prompt.includes('more capacity')) {
          newSize = quoteData.storageSizeMW * 1.3;
          newDuration = quoteData.durationHours + 1;
          reasoning = `I've increased capacity to ${newSize.toFixed(1)}MW/${newDuration}hr to provide more resilience and energy arbitrage opportunities. This enhanced configuration offers ${Math.round(((newSize - quoteData.storageSizeMW) / quoteData.storageSizeMW) * 100)}% more capacity for peak shaving and can handle longer discharge periods.`;
        } else if (prompt.includes('backup') || prompt.includes('outage') || prompt.includes('resilience')) {
          newDuration = Math.max(4, quoteData.durationHours + 2);
          reasoning = `For backup and resilience, I've extended the duration to ${newDuration} hours while keeping ${newSize.toFixed(1)}MW power output. This ensures you can ride through extended grid outages and maintain critical operations longer.`;
        } else if (prompt.includes('demand') || prompt.includes('peak') || prompt.includes('charges')) {
          newSize = quoteData.storageSizeMW * 1.2;
          newDuration = Math.max(2, Math.min(4, quoteData.durationHours));
          reasoning = `For optimal demand charge reduction, I've increased power to ${newSize.toFixed(1)}MW with ${newDuration}hr duration. This configuration can shave more peak demand and typically provides the best ROI for commercial/industrial demand charge management.`;
        } else if (prompt.includes('arbitrage') || prompt.includes('energy') || prompt.includes('trading')) {
          newDuration = Math.max(4, quoteData.durationHours + 1);
          reasoning = `For energy arbitrage, longer duration (${newDuration}hrs) at ${newSize.toFixed(1)}MW is ideal. This allows you to store more low-cost off-peak energy and discharge during high-price periods, maximizing your savings from time-of-use rates.`;
        } else {
          // Generic optimization
          newSize = quoteData.storageSizeMW * 1.1;
          reasoning = `Based on your ${quoteData.industryTemplate} profile and ${quoteData.selectedGoal} goal, I recommend ${newSize.toFixed(1)}MW/${newDuration}hr. This balanced configuration optimizes both upfront cost and long-term savings for your use case.`;
        }
        
        setAiSuggestion({
          storageSizeMW: newSize,
          durationHours: newDuration,
          reasoning
        });
        setIsGenerating(false);
      }, 2000);
    }
  };

  const handleApplyAI = () => {
    // In production, this would update the wizard configuration
    console.log('Applying AI suggestion:', aiSuggestion);
    alert('AI configuration would be applied! (In production, this updates the wizard and recalculates.)');
    setShowAIConfig(false);
  };

  const getIndustryName = (template: string | string[]) => {
    const templateKey = Array.isArray(template) ? template[0] : template;
    const industryMap: { [key: string]: string } = {
      'manufacturing': 'Manufacturing Facility',
      'data-center': 'Data Center',
      'cold-storage': 'Cold Storage Warehouse',
      'hospital': 'Hospital',
      'university': 'University/College Campus',
      'retail': 'Retail Store',
      'microgrid': 'Microgrid',
      'agricultural': 'Agricultural Operation',
      'car-wash': 'Car Wash',
      'ev-charging': 'EV Charging Hub',
      'apartment': 'Apartment Building',
      'indoor-farm': 'Indoor Farm'
    };
    const result = industryMap[templateKey] || templateKey;
    
    // If multiple templates, show count
    if (Array.isArray(template) && template.length > 1) {
      return `${result} (+${template.length - 1} more)`;
    }
    return result;
  };

  const totalEnergyMWh = quoteData.storageSizeMW * quoteData.durationHours;
  const hasRenewables = quoteData.solarMW > 0 || quoteData.windMW > 0 || quoteData.generatorMW > 0;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 z-50 overflow-y-auto">
      {/* Header */}
      <div className="bg-white shadow-lg border-b-4 border-gradient-to-r from-blue-500 to-purple-500">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-purple-600 to-blue-600 p-3 rounded-2xl">
                <Wand2 className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-extrabold text-gray-900">
                  Congratulations! Your Quote is Ready
                </h1>
                <p className="text-gray-600 mt-1">
                  Here's your customized {getIndustryName(quoteData.industryTemplate)} energy storage solution
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-4xl font-bold transition-colors"
            >
              ×
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Use Case & Goal Banner */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-2xl p-6 mb-8 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl px-6 py-3">
                <div className="text-sm opacity-90">Industry</div>
                <div className="text-xl font-bold">{getIndustryName(quoteData.industryTemplate)}</div>
              </div>
              <div className="text-3xl">→</div>
              <div className="bg-white/20 backdrop-blur-sm rounded-xl px-6 py-3">
                <div className="text-sm opacity-90">Primary Goal</div>
                <div className="text-xl font-bold capitalize">{quoteData.selectedGoal.replace('-', ' ')}</div>
              </div>
              <div className="text-3xl">→</div>
              <div className="bg-white/20 backdrop-blur-sm rounded-xl px-6 py-3">
                <div className="text-sm opacity-90">Location</div>
                <div className="text-xl font-bold">{quoteData.location}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quote Summary Card - Hero */}
        <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white rounded-3xl p-12 shadow-2xl mb-12">
          <h2 className="text-4xl font-bold mb-8 text-center">Your Energy Storage System</h2>
          
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* System Details */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 space-y-4">
              <h3 className="font-bold text-2xl mb-4 border-b border-white/30 pb-3">System Configuration</h3>
              <div className="space-y-3 text-lg">
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <span>⚡</span>
                    <span>Power Output:</span>
                  </span>
                  <span className="font-bold text-2xl">{quoteData.storageSizeMW.toFixed(1)} MW</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <span>🔋</span>
                    <span>Energy Storage:</span>
                  </span>
                  <span className="font-bold text-2xl">{totalEnergyMWh.toFixed(1)} MWh</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <span>⏱️</span>
                    <span>Duration:</span>
                  </span>
                  <span className="font-bold text-2xl">{quoteData.durationHours} hours</span>
                </div>
                {hasRenewables && (
                  <div className="pt-3 border-t border-white/30 mt-4">
                    <div className="text-lg font-semibold mb-2">+ Renewable Energy:</div>
                    {quoteData.solarMW > 0 && (
                      <div className="flex items-center gap-2">
                        <span>☀️</span>
                        <span>{quoteData.solarMW.toFixed(1)} MW Solar</span>
                      </div>
                    )}
                    {quoteData.windMW > 0 && (
                      <div className="flex items-center gap-2">
                        <span>💨</span>
                        <span>{quoteData.windMW.toFixed(1)} MW Wind</span>
                      </div>
                    )}
                    {quoteData.generatorMW > 0 && (
                      <div className="flex items-center gap-2">
                        <span>⚡</span>
                        <span>{quoteData.generatorMW.toFixed(1)} MW Generator</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Financial Summary */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 space-y-4">
              <h3 className="font-bold text-2xl mb-4 border-b border-white/30 pb-3">Financial Summary</h3>
              <div className="space-y-3 text-lg">
                <div className="flex justify-between items-center">
                  <span>Total Project Cost:</span>
                  <span className="font-bold text-2xl">${(quoteData.totalProjectCost / 1000000).toFixed(2)}M</span>
                </div>
                <div className="flex justify-between items-center text-green-300">
                  <span>Federal Tax Credit (30%):</span>
                  <span className="font-bold text-2xl">-${(quoteData.taxCredit / 1000000).toFixed(2)}M</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-white/30">
                  <span className="font-bold">Net Cost:</span>
                  <span className="font-bold text-3xl">${(quoteData.netCost / 1000000).toFixed(2)}M</span>
                </div>
                <div className="flex justify-between items-center text-green-300 mt-4">
                  <span>Annual Savings:</span>
                  <span className="font-bold text-2xl">${(quoteData.annualSavings / 1000).toFixed(0)}K</span>
                </div>
                <div className="flex justify-between items-center bg-yellow-400/20 rounded-xl p-3 mt-4">
                  <span className="font-bold text-yellow-200">Payback Period:</span>
                  <span className="font-bold text-3xl text-yellow-100">{quoteData.paybackYears.toFixed(1)} years</span>
                </div>
              </div>
            </div>
          </div>

          {/* Selections Summary */}
          <div className="grid md:grid-cols-3 gap-6 mt-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
              <div className="text-3xl mb-2">🏗️</div>
              <div className="text-sm opacity-80">Installation</div>
              <div className="font-bold text-xl capitalize">{quoteData.installationOption.replace('-', ' ')}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
              <div className="text-3xl mb-2">🚢</div>
              <div className="text-sm opacity-80">Shipping</div>
              <div className="font-bold text-xl capitalize">{quoteData.shippingOption.replace('-', ' ')}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
              <div className="text-3xl mb-2">💰</div>
              <div className="text-sm opacity-80">Financing</div>
              <div className="font-bold text-xl capitalize">{quoteData.financingOption}</div>
            </div>
          </div>
        </div>

        {/* Download & Share Section */}
        <div className="bg-white rounded-2xl shadow-xl p-10 mb-12">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-3xl font-bold text-gray-900">
              Download & Share Your Quote
            </h3>
            {/* AI Auto-Config Button */}
            <button
              onClick={() => setShowAIConfig(true)}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg transition-all hover:scale-105 flex items-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              AI Auto-Configure
            </button>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Download Options */}
            <div>
              <h4 className="font-semibold text-gray-700 mb-4 text-lg">Download Format:</h4>
              <div className="space-y-3">
                <button
                  onClick={onDownloadPDF}
                  className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3"
                >
                  <span className="text-2xl">📄</span>
                  <span>Download PDF</span>
                </button>
                <button
                  onClick={onDownloadExcel}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3"
                >
                  <span className="text-2xl">📊</span>
                  <span>Download Excel</span>
                </button>
                <button
                  onClick={onDownloadWord}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3"
                >
                  <span className="text-2xl">📝</span>
                  <span>Download Word</span>
                </button>
              </div>
            </div>

            {/* Email & Save */}
            <div>
              <h4 className="font-semibold text-gray-700 mb-4 text-lg">Email or Save:</h4>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none text-lg"
                  />
                  <button
                    onClick={handleEmailSubmit}
                    disabled={!email || !email.includes('@')}
                    className={`px-6 py-3 rounded-xl font-bold transition-all ${
                      emailSent
                        ? 'bg-green-500 text-white'
                        : 'bg-blue-500 hover:bg-blue-600 text-white disabled:bg-gray-300 disabled:cursor-not-allowed'
                    }`}
                  >
                    {emailSent ? '✓ Sent' : '📧 Send'}
                  </button>
                </div>
                <button
                  onClick={handleSave}
                  className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all ${
                    projectSaved
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-800 hover:bg-gray-900 text-white'
                  }`}
                >
                  {projectSaved ? '✓ Saved to Projects' : '💾 Save to My Projects'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Next Steps Section */}
        <div className="bg-white rounded-2xl shadow-xl p-10 mb-12">
          <h3 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Recommended Next Steps
          </h3>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Step 1 */}
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border-2 border-blue-200 hover:shadow-lg transition-all">
              <div className="text-4xl mb-3 text-center">👨‍💼</div>
              <h4 className="font-bold text-lg text-gray-900 mb-2 text-center">Free Consultation</h4>
              <p className="text-sm text-gray-600 mb-4 text-center">
                Speak with an energy expert to refine your solution
              </p>
              <button
                onClick={onRequestConsultation}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-all"
              >
                Schedule Call
              </button>
            </div>

            {/* Step 2 */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200 hover:shadow-lg transition-all">
              <div className="text-4xl mb-3 text-center">🏗️</div>
              <h4 className="font-bold text-lg text-gray-900 mb-2 text-center">Get Installer Quotes</h4>
              <p className="text-sm text-gray-600 mb-4 text-center">
                Connect with certified installers in your area
              </p>
              <button className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition-all">
                Find Installers
              </button>
            </div>

            {/* Step 3 */}
            <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-6 border-2 border-purple-200 hover:shadow-lg transition-all">
              <div className="text-4xl mb-3 text-center">💳</div>
              <h4 className="font-bold text-lg text-gray-900 mb-2 text-center">Explore Financing</h4>
              <p className="text-sm text-gray-600 mb-4 text-center">
                Compare loan, lease, and PPA options
              </p>
              <button className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-semibold transition-all">
                View Options
              </button>
            </div>

            {/* Step 4 */}
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-6 border-2 border-orange-200 hover:shadow-lg transition-all">
              <div className="text-4xl mb-3 text-center">🎁</div>
              <h4 className="font-bold text-lg text-gray-900 mb-2 text-center">Incentives Guide</h4>
              <p className="text-sm text-gray-600 mb-4 text-center">
                Discover federal, state & local rebates
              </p>
              <button className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-lg font-semibold transition-all">
                View Incentives
              </button>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-white text-center shadow-2xl">
          <h3 className="text-3xl font-bold mb-4">
            Ready to Move Forward?
          </h3>
          <p className="text-xl mb-8 opacity-90">
            Our team is here to help you every step of the way
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <button
              onClick={onRequestConsultation}
              className="bg-white text-blue-600 px-10 py-5 rounded-xl font-bold text-xl shadow-lg hover:shadow-xl transition-all hover:scale-105"
            >
              Talk to an Expert
            </button>
            <button
              onClick={onClose}
              className="bg-blue-700 hover:bg-blue-800 text-white px-10 py-5 rounded-xl font-bold text-xl shadow-lg transition-all border-2 border-white/30"
            >
              Back to Wizard
            </button>
          </div>
        </div>
      </div>

      {/* AI Auto-Configuration Modal */}
      {showAIConfig && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-8 rounded-t-3xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="bg-white/20 p-3 rounded-2xl">
                    <Sparkles className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold">AI Auto-Configure</h3>
                    <p className="text-sm opacity-90 mt-1">Optimize your system based on your specific needs</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowAIConfig(false);
                    setAiSuggestion(null);
                    setAiPrompt('');
                  }}
                  className="text-white/80 hover:text-white transition-colors text-3xl"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-8">
              {/* Current Configuration */}
              <div className="bg-gray-50 rounded-2xl p-6 mb-6">
                <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span>📋</span>
                  Current Configuration
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Power Output:</span>
                    <span className="font-bold text-gray-900 ml-2">{quoteData.storageSizeMW.toFixed(1)} MW</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Duration:</span>
                    <span className="font-bold text-gray-900 ml-2">{quoteData.durationHours} hours</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Total Capacity:</span>
                    <span className="font-bold text-gray-900 ml-2">{(quoteData.storageSizeMW * quoteData.durationHours).toFixed(1)} MWh</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Payback:</span>
                    <span className="font-bold text-gray-900 ml-2">{quoteData.paybackYears.toFixed(1)} years</span>
                  </div>
                </div>
              </div>

              {/* AI Prompt Input */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-900 mb-3">
                  Tell the AI what you need:
                </label>
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleAIGenerate()}
                  placeholder="E.g., 'I need more backup capacity for outages' or 'Reduce cost while maintaining peak shaving' or 'Optimize for energy arbitrage'"
                  className="w-full px-4 py-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-base"
                  rows={4}
                  disabled={isGenerating}
                />
                
                {/* Quick Prompts */}
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={() => setAiPrompt('Reduce cost while maintaining performance')}
                    className="text-xs bg-purple-100 text-purple-700 px-3 py-2 rounded-full hover:bg-purple-200 transition-colors"
                    disabled={isGenerating}
                  >
                    💰 Reduce Cost
                  </button>
                  <button
                    onClick={() => setAiPrompt('Increase capacity for more resilience')}
                    className="text-xs bg-blue-100 text-blue-700 px-3 py-2 rounded-full hover:bg-blue-200 transition-colors"
                    disabled={isGenerating}
                  >
                    🔋 More Capacity
                  </button>
                  <button
                    onClick={() => setAiPrompt('Optimize for backup power during outages')}
                    className="text-xs bg-green-100 text-green-700 px-3 py-2 rounded-full hover:bg-green-200 transition-colors"
                    disabled={isGenerating}
                  >
                    ⚡ Backup Focus
                  </button>
                  <button
                    onClick={() => setAiPrompt('Maximize demand charge reduction')}
                    className="text-xs bg-orange-100 text-orange-700 px-3 py-2 rounded-full hover:bg-orange-200 transition-colors"
                    disabled={isGenerating}
                  >
                    📊 Peak Shaving
                  </button>
                  <button
                    onClick={() => setAiPrompt('Optimize for energy arbitrage and TOU savings')}
                    className="text-xs bg-teal-100 text-teal-700 px-3 py-2 rounded-full hover:bg-teal-200 transition-colors"
                    disabled={isGenerating}
                  >
                    💹 Energy Trading
                  </button>
                </div>
              </div>

              {/* Generate Button */}
              <button
                onClick={handleAIGenerate}
                disabled={!aiPrompt.trim() || isGenerating}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>AI is thinking...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>Generate AI Recommendation</span>
                  </>
                )}
              </button>

              {/* AI Suggestion Result */}
              {aiSuggestion && !isGenerating && (
                <div className="mt-6 bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-6 border-2 border-purple-200 animate-fadeIn">
                  <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-lg">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                    AI Recommendation
                  </h4>
                  
                  {/* Suggested Configuration */}
                  <div className="bg-white rounded-xl p-4 mb-4">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="text-center p-3 bg-purple-100 rounded-lg">
                        <div className="text-2xl font-bold text-purple-700">{aiSuggestion.storageSizeMW.toFixed(1)} MW</div>
                        <div className="text-xs text-gray-600">Power Output</div>
                      </div>
                      <div className="text-center p-3 bg-blue-100 rounded-lg">
                        <div className="text-2xl font-bold text-blue-700">{aiSuggestion.durationHours} hrs</div>
                        <div className="text-xs text-gray-600">Duration</div>
                      </div>
                    </div>
                    <div className="text-center p-3 bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">{(aiSuggestion.storageSizeMW * aiSuggestion.durationHours).toFixed(1)} MWh</div>
                      <div className="text-xs text-gray-600">Total Energy Capacity</div>
                    </div>
                  </div>

                  {/* Reasoning */}
                  <div className="bg-white rounded-xl p-4 mb-4">
                    <div className="text-sm font-semibold text-gray-700 mb-2">💡 Why this configuration:</div>
                    <p className="text-sm text-gray-600 leading-relaxed">{aiSuggestion.reasoning}</p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={handleApplyAI}
                      className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
                    >
                      ✓ Apply This Configuration
                    </button>
                    <button
                      onClick={() => setAiSuggestion(null)}
                      className="px-6 bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-xl font-semibold transition-all"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuoteCompletePage;
