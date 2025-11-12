import React, { useState } from 'react';
import { formatSolarCapacity } from '../../../utils/solarSizingUtils';

interface Step6_FinalOutputProps {
  quoteData: {
    // System configuration
    storageSizeMW: number;
    durationHours: number;
    solarMW: number;
    windMW: number;
    generatorMW: number;
    location: string;
    selectedGoal: string | string[];
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
  onEmailQuote: (email: string) => void;
  onSaveProject: () => void;
  onRequestConsultation: () => void;
}

const Step6_FinalOutput: React.FC<Step6_FinalOutputProps> = ({
  quoteData,
  onDownloadPDF,
  onDownloadExcel,
  onEmailQuote,
  onSaveProject,
  onRequestConsultation,
}) => {
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [projectSaved, setProjectSaved] = useState(false);

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

  const totalEnergyMWh = quoteData.storageSizeMW * quoteData.durationHours;
  const hasRenewables = quoteData.solarMW > 0 || quoteData.windMW > 0 || quoteData.generatorMW > 0;

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-4xl font-bold text-gray-800">
          Your Custom Quote is Ready!
        </h2>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
          Download your detailed quote or save it to review later
        </p>
      </div>

      {/* Quote Summary Card */}
      <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-2xl p-8 shadow-2xl">
        <h3 className="text-2xl font-bold mb-6 text-center">Your Energy Storage System</h3>
        
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* System Details */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 space-y-3">
            <h4 className="font-bold text-lg mb-3 border-b border-white/30 pb-2">System Configuration</h4>
            <div className="flex justify-between">
              <span>Power Output:</span>
              <span className="font-bold">{quoteData.storageSizeMW.toFixed(1)} MW</span>
            </div>
            <div className="flex justify-between">
              <span>Energy Storage:</span>
              <span className="font-bold">{totalEnergyMWh.toFixed(1)} MWh</span>
            </div>
            <div className="flex justify-between">
              <span>Duration:</span>
              <span className="font-bold">{quoteData.durationHours} hours</span>
            </div>
            {hasRenewables && (
              <div className="pt-2 border-t border-white/30">
                <div className="text-sm font-semibold mb-1">+ Renewables:</div>
                {quoteData.solarMW > 0 && <div className="text-sm">☀️ {formatSolarCapacity(quoteData.solarMW)} Solar</div>}
                {quoteData.windMW > 0 && <div className="text-sm">💨 {quoteData.windMW.toFixed(1)} MW Wind</div>}
                {quoteData.generatorMW > 0 && <div className="text-sm">⚡ {quoteData.generatorMW.toFixed(1)} MW Generator</div>}
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-white/30">
              <span>Location:</span>
              <span className="font-bold">{quoteData.location}</span>
            </div>
          </div>

          {/* Financial Summary */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 space-y-3">
            <h4 className="font-bold text-lg mb-3 border-b border-white/30 pb-2">Financial Summary</h4>
            <div className="flex justify-between">
              <span>Total Project Cost:</span>
              <span className="font-bold">${(quoteData.totalProjectCost / 1000000).toFixed(2)}M</span>
            </div>
            <div className="flex justify-between text-green-300">
              <span>30% Tax Credit:</span>
              <span className="font-bold">-${(quoteData.taxCredit / 1000000).toFixed(2)}M</span>
            </div>
            <div className="flex justify-between border-t border-white/30 pt-2 text-xl">
              <span>Net Cost:</span>
              <span className="font-bold">${(quoteData.netCost / 1000000).toFixed(2)}M</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-white/30">
              <span>Annual Savings:</span>
              <span className="font-bold text-green-300">${(quoteData.annualSavings / 1000).toFixed(0)}K/yr</span>
            </div>
            <div className="flex justify-between">
              <span>Payback Period:</span>
              <span className="font-bold">{quoteData.paybackYears.toFixed(1)} years</span>
            </div>
          </div>
        </div>

        {/* Selected Options */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
          <h4 className="font-bold text-lg mb-3">Your Selected Options</h4>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="opacity-75 mb-1">Installation:</div>
              <div className="font-bold">{quoteData.installationOption}</div>
            </div>
            <div>
              <div className="opacity-75 mb-1">Shipping:</div>
              <div className="font-bold">{quoteData.shippingOption}</div>
            </div>
            <div>
              <div className="opacity-75 mb-1">Financing:</div>
              <div className="font-bold">{quoteData.financingOption}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Download Options */}
      <div className="bg-white rounded-xl border-2 border-blue-400 p-8 shadow-lg">
        <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          📥 Download Your Quote
        </h3>
        
        <div className="grid md:grid-cols-2 gap-4">
          <button
            onClick={onDownloadPDF}
            className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white p-6 rounded-xl font-bold text-lg shadow-lg transition-all hover:scale-105 flex items-center justify-center gap-3"
          >
            <span className="text-3xl">📄</span>
            <div className="text-left">
              <div>Download PDF</div>
              <div className="text-sm font-normal opacity-90">Summary report</div>
            </div>
          </button>

          <button
            onClick={onDownloadExcel}
            className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white p-6 rounded-xl font-bold text-lg shadow-lg transition-all hover:scale-105 flex items-center justify-center gap-3"
          >
            <span className="text-3xl">📊</span>
            <div className="text-left">
              <div>Download Excel</div>
              <div className="text-sm font-normal opacity-90">Full analysis</div>
            </div>
          </button>
        </div>
      </div>

      {/* Email Quote */}
      <div className="bg-white rounded-xl border-2 border-purple-400 p-8 shadow-lg">
        <h3 className="text-2xl font-bold text-gray-800 mb-4 text-center">
          📧 Email This Quote
        </h3>
        <p className="text-center text-gray-600 mb-6">
          Send to yourself or share with your team
        </p>
        
        <div className="flex gap-4 max-w-2xl mx-auto">
          <input
            type="email"
            placeholder="your.email@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 p-4 border-2 border-gray-300 rounded-xl text-lg text-gray-900 focus:border-purple-500 focus:outline-none"
          />
          <button
            onClick={handleEmailSubmit}
            disabled={!email.includes('@')}
            className={`px-8 py-4 rounded-xl font-bold text-lg shadow-lg transition-all ${
              email.includes('@')
                ? 'bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {emailSent ? '✓ Sent!' : 'Send'}
          </button>
        </div>
      </div>

      {/* Save Project */}
      <div className="bg-white rounded-xl border-2 border-green-400 p-8 shadow-lg">
        <h3 className="text-2xl font-bold text-gray-800 mb-4 text-center">
          💾 Save for Later
        </h3>
        <p className="text-center text-gray-600 mb-6">
          Save this configuration to your account and come back anytime
        </p>
        
        <div className="text-center">
          <button
            onClick={handleSave}
            className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-12 py-4 rounded-xl font-bold text-lg shadow-lg transition-all hover:scale-105"
          >
            {projectSaved ? '✓ Saved to My Projects!' : '💾 Save to My Projects'}
          </button>
        </div>
      </div>

      {/* Next Steps */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border-2 border-indigo-400 p-8 shadow-lg">
        <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          🚀 Ready for Next Steps?
        </h3>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow">
            <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <span className="text-2xl">👥</span>
              Free Consultation
            </h4>
            <p className="text-sm text-gray-600 mb-4">
              Talk to an energy expert about your project and get personalized recommendations
            </p>
            <button
              onClick={onRequestConsultation}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Schedule Call
            </button>
          </div>

          <div className="bg-white p-6 rounded-xl shadow">
            <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <span className="text-2xl">🔨</span>
              Get Installer Quotes
            </h4>
            <p className="text-sm text-gray-600 mb-4">
              Connect with vetted installation partners in your area for competitive bids
            </p>
            <button
              className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Find Installers
            </button>
          </div>

          <div className="bg-white p-6 rounded-xl shadow">
            <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <span className="text-2xl">💰</span>
              Financing Options
            </h4>
            <p className="text-sm text-gray-600 mb-4">
              Explore loans, leases, and tax equity structures to fund your project
            </p>
            <button
              className="w-full bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              View Financing
            </button>
          </div>

          <div className="bg-white p-6 rounded-xl shadow">
            <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <span className="text-2xl">📚</span>
              Incentives Guide
            </h4>
            <p className="text-sm text-gray-600 mb-4">
              Download our guide to federal, state, and local incentives for your location
            </p>
            <button
              className="w-full bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Get Guide
            </button>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl p-8 text-center shadow-2xl">
        <h3 className="text-3xl font-bold mb-4">
          Ready to Move Forward?
        </h3>
        <p className="text-xl mb-6 opacity-90">
          Let's turn this quote into reality
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <button
            onClick={onRequestConsultation}
            className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-4 rounded-xl font-bold text-lg shadow-lg transition-all hover:scale-105"
          >
            Talk to an Expert
          </button>
          <button
            onClick={onDownloadPDF}
            className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg transition-all border-2 border-white/50"
          >
            Download & Share
          </button>
        </div>
      </div>
    </div>
  );
};

export default Step6_FinalOutput;
