import React, { useState } from 'react';

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
    industryTemplate: string;
    
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
  onClose: () => void;
}

const QuoteCompletePage: React.FC<QuoteCompletePageProps> = ({
  quoteData,
  onDownloadPDF,
  onDownloadExcel,
  onEmailQuote,
  onSaveProject,
  onRequestConsultation,
  onClose,
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
    <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 z-50 overflow-y-auto">
      {/* Header */}
      <div className="bg-white shadow-lg border-b-4 border-gradient-to-r from-blue-500 to-purple-500">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-5xl">🎉</span>
              <div>
                <h1 className="text-3xl font-extrabold text-gray-900">
                  Congratulations! Your Quote is Ready
                </h1>
                <p className="text-gray-600 mt-1">
                  Here's your customized energy storage solution
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
          <h3 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Download & Share Your Quote
          </h3>
          
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
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuoteCompletePage;
