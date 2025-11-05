import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { generatePDF, generateExcel, generateWord } from '../../utils/quoteExport';

// New customer-focused steps
import Step0_Goals from './steps/Step0_Goals';
import Step1_IndustryTemplate from './steps/Step1_IndustryTemplate';
import Step2_SimpleConfiguration from './steps/Step2_SimpleConfiguration';
import Step3_AddRenewables from './steps/Step3_AddRenewables';
import Step4_LocationPricing from './steps/Step4_LocationPricing';
import Step5_QuoteSummary from './steps/Step4_QuoteSummary'; // Renamed import to avoid confusion
import QuoteCompletePage from './QuoteCompletePage';

interface SmartWizardProps {
  show: boolean;
  onClose: () => void;
  onFinish: (data: any) => void;
}

const SmartWizardV2: React.FC<SmartWizardProps> = ({ show, onClose, onFinish }) => {
  const [step, setStep] = useState(0);
  const [showCompletePage, setShowCompletePage] = useState(false);
  const [showAIWizard, setShowAIWizard] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<Array<{
    type: 'optimization' | 'cost-saving' | 'performance' | 'warning';
    title: string;
    description: string;
    currentValue: string;
    suggestedValue: string;
    impact: string;
    savings?: string;
    action: () => void;
  }>>([]);

  // Step 0: Goals
  const [selectedGoal, setSelectedGoal] = useState('');

  // Step 1: Industry Template
  const [selectedTemplate, setSelectedTemplate] = useState<string | string[]>([]);
  const [useTemplate, setUseTemplate] = useState(true);

  // Step 2: Configuration
  const [storageSizeMW, setStorageSizeMW] = useState(2);
  const [durationHours, setDurationHours] = useState(4);

  // Step 3: Renewables
  const [includeRenewables, setIncludeRenewables] = useState(false);
  const [solarMW, setSolarMW] = useState(0);
  const [windMW, setWindMW] = useState(0);
  const [generatorMW, setGeneratorMW] = useState(0);

  // Step 4: Location & Pricing
  const [location, setLocation] = useState('');
  const [electricityRate, setElectricityRate] = useState(0.15);
  const [knowsRate, setKnowsRate] = useState(false);

  // Step 5: Options (tracked in Step5_QuoteSummary component)
  const [selectedInstallation, setSelectedInstallation] = useState('epc');
  const [selectedShipping, setSelectedShipping] = useState('best-value');
  const [selectedFinancing, setSelectedFinancing] = useState('cash');

  // Apply industry template defaults
  useEffect(() => {
    const templateKey = Array.isArray(selectedTemplate) ? selectedTemplate[0] : selectedTemplate;
    if (useTemplate && templateKey && templateKey !== 'custom') {
      const templates: { [key: string]: { mw: number; hours: number } } = {
        'manufacturing': { mw: 3, hours: 4 },
        'office': { mw: 1, hours: 4 },
        'datacenter': { mw: 10, hours: 6 },
        'warehouse': { mw: 2, hours: 3 },
        'hotel': { mw: 1, hours: 4 },
        'retail': { mw: 0.5, hours: 3 },
        'agriculture': { mw: 1.5, hours: 6 },
        'car-wash': { mw: 0.25, hours: 2 },
        'ev-charging': { mw: 1, hours: 2 },
        'apartment': { mw: 1, hours: 4 },
        'university': { mw: 5, hours: 5 },
        'indoor-farm': { mw: 0.4, hours: 4 }
      };
      
      const template = templates[templateKey];
      if (template) {
        setStorageSizeMW(template.mw);
        setDurationHours(template.hours);
      }
    }
  }, [selectedTemplate, useTemplate]);

  // Cost calculations
  const calculateCosts = () => {
    const totalEnergyMWh = storageSizeMW * durationHours;
    
    // Equipment costs
    const batteryCostPerKWh = 250; // $250/kWh
    const batteryCost = totalEnergyMWh * 1000 * batteryCostPerKWh;
    
    const pcsCostPerKW = 150; // $150/kW
    const pcsCost = storageSizeMW * 1000 * pcsCostPerKW;
    
    const solarCost = solarMW * 1000000; // $1M/MW
    const windCost = windMW * 1500000; // $1.5M/MW
    const generatorCost = generatorMW * 800000; // $800K/MW
    
    const equipmentCost = batteryCost + pcsCost + solarCost + windCost + generatorCost;
    
    // Installation costs (base, before markup)
    const baseInstallationCost = equipmentCost * 0.20; // 20% of equipment cost
    
    // Installation markup based on selection
    const installationMultipliers: { [key: string]: number } = {
      'epc': 1.30,
      'contractor': 1.20,
      'self': 1.0
    };
    const installationCost = baseInstallationCost * (installationMultipliers[selectedInstallation] || 1.3);
    
    // Shipping costs
    const baseShippingCost = totalEnergyMWh * 15000; // $15K/MWh base
    const shippingMultipliers: { [key: string]: number } = {
      'best-value': 1.0,
      'usa': 1.4,
      'china': 0.8
    };
    const shippingCost = baseShippingCost * (shippingMultipliers[selectedShipping] || 1.0);
    
    // Tariffs (21% on battery from China)
    const tariffCost = batteryCost * 0.21;
    
    // Total project cost
    const totalProjectCost = equipmentCost + installationCost + shippingCost + tariffCost;
    
    // Tax credit (30% ITC if paired with renewables, or standalone)
    const taxCredit = totalProjectCost * 0.30;
    const netCost = totalProjectCost - taxCredit;
    
    // Annual savings calculation
    const peakShavingSavings = totalEnergyMWh * 365 * (electricityRate - 0.05) * 1000; // Arbitrage
    const demandChargeSavings = storageSizeMW * 12 * 15000; // $15K/MW-month demand charge reduction
    const gridServiceRevenue = storageSizeMW * 30000; // $30K/MW-year
    
    let annualSavings = peakShavingSavings + demandChargeSavings + gridServiceRevenue;
    
    // Add renewable energy savings
    if (solarMW > 0) {
      annualSavings += solarMW * 1500 * electricityRate * 1000; // 1500 MWh/MW-year * rate
    }
    if (windMW > 0) {
      annualSavings += windMW * 2500 * electricityRate * 1000; // 2500 MWh/MW-year * rate
    }
    
    // Payback period
    const paybackYears = netCost / annualSavings;
    
    return {
      equipmentCost,
      installationCost,
      shippingCost,
      tariffCost,
      totalProjectCost,
      taxCredit,
      netCost,
      annualSavings,
      paybackYears
    };
  };

  const costs = calculateCosts();

  const analyzeConfiguration = () => {
    const suggestions: Array<{
      type: 'optimization' | 'cost-saving' | 'performance' | 'warning';
      title: string;
      description: string;
      currentValue: string;
      suggestedValue: string;
      impact: string;
      savings?: string;
      action: () => void;
    }> = [];

    const totalEnergyMWh = storageSizeMW * durationHours;
    const costs = calculateCosts();

    // Analyze based on selected goal
    if (selectedGoal === 'cost-reduction' || selectedGoal === 'demand-charge-reduction') {
      // Check if duration is optimal for peak shaving
      if (durationHours > 4) {
        const optimalDuration = 4;
        const newSize = storageSizeMW * 1.1; // Slight increase in power
        suggestions.push({
          type: 'cost-saving',
          title: 'Optimize for Peak Shaving',
          description: 'For demand charge reduction, shorter duration with higher power is more cost-effective. You can reduce upfront costs while maintaining peak shaving capability.',
          currentValue: `${storageSizeMW.toFixed(1)}MW / ${durationHours}hr`,
          suggestedValue: `${newSize.toFixed(1)}MW / ${optimalDuration}hr`,
          impact: 'Reduces equipment cost by ~20% while improving demand response',
          savings: '$' + ((costs.totalProjectCost * 0.2) / 1000000).toFixed(2) + 'M',
          action: () => {
            setStorageSizeMW(newSize);
            setDurationHours(optimalDuration);
          }
        });
      }
    }

    if (selectedGoal === 'backup-power' || selectedGoal === 'grid-independence') {
      // Check if duration is sufficient for backup
      if (durationHours < 4) {
        const recommendedDuration = 6;
        suggestions.push({
          type: 'warning',
          title: 'Backup Duration May Be Insufficient',
          description: 'For reliable backup power during outages, we recommend at least 6 hours of storage. This ensures you can maintain operations through typical utility restoration times.',
          currentValue: `${durationHours} hours`,
          suggestedValue: `${recommendedDuration} hours`,
          impact: 'Provides 50% more backup time for critical operations',
          action: () => {
            setDurationHours(recommendedDuration);
          }
        });
      }
    }

    // Check for oversizing
    const templateKey = Array.isArray(selectedTemplate) ? selectedTemplate[0] : selectedTemplate;
    if (totalEnergyMWh > 20 && templateKey !== 'datacenter' && templateKey !== 'university') {
      const optimalSize = storageSizeMW * 0.75;
      suggestions.push({
        type: 'cost-saving',
        title: 'System May Be Oversized',
        description: `Based on typical ${getIndustryName(templateKey)} energy profiles, you may be able to reduce system size and save significantly on upfront costs while still meeting your ${selectedGoal.replace('-', ' ')} goals.`,
        currentValue: `${totalEnergyMWh.toFixed(1)} MWh`,
        suggestedValue: `${(optimalSize * durationHours).toFixed(1)} MWh`,
        impact: 'Reduces upfront investment while maintaining performance',
        savings: '$' + ((costs.totalProjectCost * 0.25) / 1000000).toFixed(2) + 'M',
        action: () => {
          setStorageSizeMW(optimalSize);
        }
      });
    }

    // Check if renewables would improve ROI
    if (!includeRenewables && (selectedGoal === 'energy-independence' || selectedGoal === 'renewable-integration')) {
      const suggestedSolar = storageSizeMW * 0.8;
      suggestions.push({
        type: 'optimization',
        title: 'Add Solar for Better ROI',
        description: 'Pairing battery storage with solar can improve your payback period by 30-40%. Solar generation during peak hours maximizes arbitrage opportunities and demand charge reduction.',
        currentValue: 'No renewables',
        suggestedValue: `${suggestedSolar.toFixed(1)}MW Solar`,
        impact: 'Could reduce payback to ' + (costs.paybackYears * 0.65).toFixed(1) + ' years',
        savings: '$' + ((costs.annualSavings * 0.5) / 1000).toFixed(0) + 'K/year additional',
        action: () => {
          setIncludeRenewables(true);
          setSolarMW(suggestedSolar);
          setStep(3); // Navigate to renewables step
        }
      });
    }

    // Check payback period
    if (costs.paybackYears > 7) {
      const optimizedSize = storageSizeMW * 0.8;
      suggestions.push({
        type: 'cost-saving',
        title: 'Improve Payback Period',
        description: 'Your current payback period is longer than ideal. By right-sizing the system, you can achieve a better ROI while still meeting your operational needs.',
        currentValue: costs.paybackYears.toFixed(1) + ' years',
        suggestedValue: ((costs.netCost * 0.8) / costs.annualSavings).toFixed(1) + ' years',
        impact: 'Better ROI and faster return on investment',
        savings: 'Break even ' + (costs.paybackYears - ((costs.netCost * 0.8) / costs.annualSavings)).toFixed(1) + ' years sooner',
        action: () => {
          setStorageSizeMW(optimizedSize);
        }
      });
    }

    // Energy arbitrage optimization
    if (selectedGoal === 'energy-cost-savings' && durationHours < 4) {
      suggestions.push({
        type: 'optimization',
        title: 'Extend Duration for Energy Arbitrage',
        description: 'For maximum energy cost savings through time-of-use arbitrage, longer discharge duration (4-6 hours) allows you to capture more peak pricing spreads.',
        currentValue: `${durationHours} hours`,
        suggestedValue: '4-5 hours',
        impact: 'Increases annual savings by capturing longer peak periods',
        savings: '$' + ((costs.annualSavings * 0.3) / 1000).toFixed(0) + 'K/year additional',
        action: () => {
          setDurationHours(4);
        }
      });
    }

    // Location-based suggestion
    if (location && location.includes('CA')) {
      suggestions.push({
        type: 'optimization',
        title: 'California Incentive Available',
        description: 'California offers additional SGIP (Self-Generation Incentive Program) rebates of $200-$350/kWh for energy storage. This could significantly reduce your upfront costs beyond the federal tax credit.',
        currentValue: 'Federal ITC only',
        suggestedValue: 'Federal ITC + SGIP',
        impact: 'Additional $' + ((totalEnergyMWh * 1000 * 250) / 1000000).toFixed(2) + 'M in rebates',
        savings: 'Up to $' + ((totalEnergyMWh * 1000 * 250) / 1000000).toFixed(2) + 'M additional savings',
        action: () => {
          alert('SGIP application details would be provided here');
        }
      });
    }

    setAiSuggestions(suggestions);
  };

  const getIndustryName = (template: string | string[]): string => {
    const templateKey = Array.isArray(template) ? template[0] : template;
    const industryMap: { [key: string]: string } = {
      'manufacturing': 'Manufacturing Facility',
      'data-center': 'Data Center',
      'cold-storage': 'Cold Storage',
      'hospital': 'Hospital',
      'university': 'University',
      'retail': 'Retail',
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

  const handleOpenAIWizard = () => {
    analyzeConfiguration();
    setShowAIWizard(true);
  };

  const handleNext = () => {
    if (step < 5) {
      setStep(step + 1);
    } else if (step === 5) {
      // After quote summary, show complete page
      setShowCompletePage(true);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 0: return selectedGoal !== '';
      case 1: return useTemplate ? (Array.isArray(selectedTemplate) ? selectedTemplate.length > 0 : selectedTemplate !== '') : true;
      case 2: return storageSizeMW > 0 && durationHours > 0;
      case 3: return true; // Optional step
      case 4: return location !== '' && electricityRate > 0;
      case 5: return true; // Options step, defaults are set
      default: return false;
    }
  };

  const getStepTitle = () => {
    const titles = [
      'What\'s Your Goal?',
      'Quick Configuration',
      'Configure Your System',
      'Add Renewables?',
      'Location & Pricing',
      'Review Your Quote'
    ];
    return titles[step] || '';
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <Step0_Goals
            selectedGoal={selectedGoal}
            setSelectedGoal={setSelectedGoal}
          />
        );
      case 1:
        return (
          <Step1_IndustryTemplate
            selectedTemplate={selectedTemplate}
            setSelectedTemplate={setSelectedTemplate}
            useTemplate={useTemplate}
            setUseTemplate={setUseTemplate}
          />
        );
      case 2:
        return (
          <Step2_SimpleConfiguration
            storageSizeMW={storageSizeMW}
            setStorageSizeMW={setStorageSizeMW}
            durationHours={durationHours}
            setDurationHours={setDurationHours}
            industryTemplate={selectedTemplate}
          />
        );
      case 3:
        return (
          <Step3_AddRenewables
            includeRenewables={includeRenewables}
            setIncludeRenewables={setIncludeRenewables}
            solarMW={solarMW}
            setSolarMW={setSolarMW}
            windMW={windMW}
            setWindMW={setWindMW}
            generatorMW={generatorMW}
            setGeneratorMW={setGeneratorMW}
          />
        );
      case 4:
        return (
          <Step4_LocationPricing
            location={location}
            setLocation={setLocation}
            electricityRate={electricityRate}
            setElectricityRate={setElectricityRate}
            knowsRate={knowsRate}
            setKnowsRate={setKnowsRate}
          />
        );
      case 5:
        return (
          <Step5_QuoteSummary
            storageSizeMW={storageSizeMW}
            durationHours={durationHours}
            solarMW={solarMW}
            windMW={windMW}
            generatorMW={generatorMW}
            location={location}
            selectedGoal={selectedGoal}
            industryTemplate={selectedTemplate}
            equipmentCost={costs.equipmentCost}
            installationCost={costs.installationCost}
            shippingCost={costs.shippingCost}
            tariffCost={costs.tariffCost}
            totalProjectCost={costs.totalProjectCost}
            annualSavings={costs.annualSavings}
            paybackYears={costs.paybackYears}
            taxCredit30Percent={costs.taxCredit}
            netCostAfterTaxCredit={costs.netCost}
          />
        );
      default:
        return null;
    }
  };

  // Show complete page instead of modal for final step
  if (showCompletePage) {
    return (
      <QuoteCompletePage
        quoteData={{
          storageSizeMW,
          durationHours,
          solarMW,
          windMW,
          generatorMW,
          location,
          selectedGoal,
          industryTemplate: selectedTemplate,
          totalProjectCost: costs.totalProjectCost,
          annualSavings: costs.annualSavings,
          paybackYears: costs.paybackYears,
          taxCredit: costs.taxCredit,
          netCost: costs.netCost,
          installationOption: selectedInstallation,
          shippingOption: selectedShipping,
          financingOption: selectedFinancing
        }}
        onDownloadPDF={() => generatePDF({
          storageSizeMW,
          durationHours,
          solarMW,
          windMW,
          generatorMW,
          location,
          selectedGoal,
          industryTemplate: selectedTemplate,
          totalProjectCost: costs.totalProjectCost,
          annualSavings: costs.annualSavings,
          paybackYears: costs.paybackYears,
          taxCredit: costs.taxCredit,
          netCost: costs.netCost,
          installationOption: selectedInstallation,
          shippingOption: selectedShipping,
          financingOption: selectedFinancing
        })}
        onDownloadExcel={() => generateExcel({
          storageSizeMW,
          durationHours,
          solarMW,
          windMW,
          generatorMW,
          location,
          selectedGoal,
          industryTemplate: selectedTemplate,
          totalProjectCost: costs.totalProjectCost,
          annualSavings: costs.annualSavings,
          paybackYears: costs.paybackYears,
          taxCredit: costs.taxCredit,
          netCost: costs.netCost,
          installationOption: selectedInstallation,
          shippingOption: selectedShipping,
          financingOption: selectedFinancing
        })}
        onDownloadWord={() => generateWord({
          storageSizeMW,
          durationHours,
          solarMW,
          windMW,
          generatorMW,
          location,
          selectedGoal,
          industryTemplate: selectedTemplate,
          totalProjectCost: costs.totalProjectCost,
          annualSavings: costs.annualSavings,
          paybackYears: costs.paybackYears,
          taxCredit: costs.taxCredit,
          netCost: costs.netCost,
          installationOption: selectedInstallation,
          shippingOption: selectedShipping,
          financingOption: selectedFinancing
        })}
        onEmailQuote={(email: string) => {
          // Send email with quote (would integrate with email service)
          alert(`Quote will be sent to ${email}\n(Email service integration pending)`);
        }}
        onSaveProject={() => {
          // Save to local storage or database
          const quoteData = {
            storageSizeMW,
            durationHours,
            solarMW,
            windMW,
            generatorMW,
            location,
            selectedGoal,
            industryTemplate: selectedTemplate,
            timestamp: new Date().toISOString()
          };
          localStorage.setItem('saved_quote', JSON.stringify(quoteData));
          alert('Quote saved successfully!');
        }}
        onRequestConsultation={() => {
          // Open email with consultation request
          window.location.href = 'mailto:info@merlinenergy.com?subject=Consultation Request&body=Hi, I completed my BESS quote and would like to schedule a consultation to discuss my project.';
        }}
        onClose={() => {
          setShowCompletePage(false);
          onClose();
        }}
      />
    );
  }

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <span className="text-4xl">🪄</span>
              <div>
                <h2 className="text-2xl font-bold">Smart Wizard</h2>
                <p className="text-sm opacity-90">Step {step + 1} of 6: {getStepTitle()}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* AI Wizard Button - More Prominent */}
              {step >= 1 && (
                <button
                  onClick={handleOpenAIWizard}
                  className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white px-5 py-2.5 rounded-lg font-bold transition-all hover:scale-105 flex items-center gap-2 shadow-lg border-2 border-white/50 animate-pulse hover:animate-none"
                >
                  <Sparkles className="w-5 h-5" />
                  <span>AI Wizard</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 text-3xl font-bold"
              >
                ×
              </button>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="mt-4 bg-white/20 rounded-full h-2">
            <div
              className="bg-white rounded-full h-2 transition-all duration-300"
              style={{ width: `${((step + 1) / 7) * 100}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-8 max-h-[70vh] overflow-y-auto">
          {renderStep()}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-6 rounded-b-2xl border-t-2 border-gray-200 flex items-center justify-between">
          <button
            onClick={handleBack}
            disabled={step === 0}
            className={`px-6 py-3 rounded-xl font-bold transition-all ${
              step === 0
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-gray-300 hover:bg-gray-400 text-gray-800'
            }`}
          >
            ← Back
          </button>

          <div className="text-sm text-gray-500">
            Step {step + 1} of 6
          </div>

          <button
            onClick={handleNext}
            disabled={!canProceed()}
            className={`px-8 py-3 rounded-xl font-bold transition-all ${
              canProceed()
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {step === 5 ? 'Get My Quote →' : 'Next →'}
          </button>
        </div>
      </div>

      {/* AI Wizard - Intelligent Suggestions Modal */}
      {showAIWizard && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 text-white p-8 rounded-t-3xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="bg-white/20 p-3 rounded-2xl animate-pulse">
                    <Sparkles className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold flex items-center gap-2">
                      AI Wizard
                      <span className="text-sm bg-white/20 px-3 py-1 rounded-full">Analyzing...</span>
                    </h3>
                    <p className="text-sm opacity-90 mt-1">I've analyzed your configuration and found optimization opportunities</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAIWizard(false)}
                  className="text-white/80 hover:text-white transition-colors text-3xl"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-8">
              {/* Industry & Use Case Banner */}
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl p-6 mb-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm opacity-90 mb-1">Optimizing for</div>
                    <div className="text-3xl font-bold mb-2">{getIndustryName(selectedTemplate)}</div>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="bg-white/20 px-3 py-1 rounded-full capitalize">
                        🎯 {selectedGoal.replace('-', ' ')}
                      </span>
                      {location && (
                        <span className="bg-white/20 px-3 py-1 rounded-full">
                          📍 {location}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm opacity-90 mb-1">Current System</div>
                    <div className="text-2xl font-bold">{storageSizeMW.toFixed(1)}MW / {durationHours}hr</div>
                    <div className="text-sm">{(storageSizeMW * durationHours).toFixed(1)} MWh Total</div>
                  </div>
                </div>
              </div>

              {/* Current Configuration Summary */}
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 mb-6 border-2 border-blue-200">
                <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span>📊</span>
                  Financial Overview
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                    <div className="text-2xl font-bold text-gray-900">${(costs.totalProjectCost / 1000000).toFixed(2)}M</div>
                    <div className="text-xs text-gray-600 mt-1">Total Project Cost</div>
                  </div>
                  <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                    <div className="text-2xl font-bold text-green-600">${(costs.annualSavings / 1000).toFixed(0)}K</div>
                    <div className="text-xs text-gray-600 mt-1">Annual Savings</div>
                  </div>
                  <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                    <div className="text-2xl font-bold text-purple-600">{costs.paybackYears.toFixed(1)} yrs</div>
                    <div className="text-xs text-gray-600 mt-1">Payback Period</div>
                  </div>
                </div>
              </div>

              {/* Interactive Configuration Adjustment Tools */}
              <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-2xl p-6 mb-6 border-2 border-orange-200">
                <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span>🎛️</span>
                  Adjust Your Configuration
                </h4>
                <p className="text-sm text-gray-600 mb-6">
                  Fine-tune your system before moving forward. The AI will update recommendations in real-time.
                </p>

                {/* Power Output Slider */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold text-gray-700">Power Output (MW)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={storageSizeMW}
                        onChange={(e) => setStorageSizeMW(Number(e.target.value))}
                        min="0.5"
                        max="50"
                        step="0.1"
                        className="w-20 px-3 py-1 border-2 border-gray-300 rounded-lg text-center font-bold"
                      />
                      <span className="text-sm text-gray-600">MW</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="50"
                    step="0.1"
                    value={storageSizeMW}
                    onChange={(e) => setStorageSizeMW(Number(e.target.value))}
                    className="w-full h-3 bg-gradient-to-r from-blue-200 to-blue-400 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0.5 MW</span>
                    <span>50 MW</span>
                  </div>
                </div>

                {/* Duration Slider */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold text-gray-700">Duration (Hours)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={durationHours}
                        onChange={(e) => setDurationHours(Number(e.target.value))}
                        min="1"
                        max="12"
                        step="1"
                        className="w-20 px-3 py-1 border-2 border-gray-300 rounded-lg text-center font-bold"
                      />
                      <span className="text-sm text-gray-600">hrs</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="12"
                    step="1"
                    value={durationHours}
                    onChange={(e) => setDurationHours(Number(e.target.value))}
                    className="w-full h-3 bg-gradient-to-r from-purple-200 to-purple-400 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>1 hr</span>
                    <span>12 hrs</span>
                  </div>
                </div>

                {/* Total Energy Display */}
                <div className="bg-white rounded-xl p-4 text-center shadow-sm border-2 border-orange-300">
                  <div className="text-sm text-gray-600 mb-1">Total Energy Capacity</div>
                  <div className="text-3xl font-bold text-orange-600">
                    {(storageSizeMW * durationHours).toFixed(1)} MWh
                  </div>
                </div>

                {/* Quick Action Buttons */}
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      handleOpenAIWizard();
                      // Show confirmation after analysis
                      setTimeout(() => {
                        const hasImprovements = aiSuggestions.length > 0;
                        if (hasImprovements) {
                          alert(`✨ AI Wizard found ${aiSuggestions.length} optimization${aiSuggestions.length > 1 ? 's' : ''} to improve your configuration! Review the suggestions below.`);
                        } else {
                          const confirmed = confirm('✅ Your configuration is already optimized!\n\nYour current setup is well-suited for your goals. Would you like to continue to the next step?');
                          if (confirmed) {
                            setShowAIWizard(false);
                            if (step < 5) setStep(step + 1);
                          }
                        }
                      }, 100);
                    }}
                    className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    AI Wizard
                  </button>
                  <button
                    onClick={() => {
                      setShowAIWizard(false);
                      if (step < 5) setStep(step + 1);
                    }}
                    className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                  >
                    <span>✓</span>
                    Confirm & Continue
                  </button>
                </div>
              </div>

              {/* AI Suggestions */}
              {aiSuggestions.length > 0 ? (
                <div className="space-y-4">
                  <h4 className="font-bold text-xl text-gray-900 mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-orange-500" />
                    AI Recommendations ({aiSuggestions.length})
                  </h4>
                  
                  {aiSuggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className={`rounded-2xl p-6 border-2 shadow-lg transition-all hover:shadow-xl ${
                        suggestion.type === 'cost-saving' 
                          ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300'
                          : suggestion.type === 'warning'
                          ? 'bg-gradient-to-br from-red-50 to-orange-50 border-red-300'
                          : suggestion.type === 'optimization'
                          ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-300'
                          : 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-300'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`text-3xl ${
                            suggestion.type === 'cost-saving' ? '💰' :
                            suggestion.type === 'warning' ? '⚠️' :
                            suggestion.type === 'optimization' ? '🎯' : '⭐'
                          }`}>
                            {suggestion.type === 'cost-saving' ? '💰' :
                             suggestion.type === 'warning' ? '⚠️' :
                             suggestion.type === 'optimization' ? '🎯' : '⭐'}
                          </div>
                          <div>
                            <h5 className="font-bold text-lg text-gray-900">{suggestion.title}</h5>
                            <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                              suggestion.type === 'cost-saving' ? 'bg-green-200 text-green-800' :
                              suggestion.type === 'warning' ? 'bg-red-200 text-red-800' :
                              suggestion.type === 'optimization' ? 'bg-blue-200 text-blue-800' :
                              'bg-purple-200 text-purple-800'
                            }`}>
                              {suggestion.type.replace('-', ' ').toUpperCase()}
                            </span>
                          </div>
                        </div>
                        {suggestion.savings && (
                          <div className="bg-white rounded-lg px-4 py-2 shadow-sm">
                            <div className="text-sm text-gray-600">Potential Savings</div>
                            <div className="text-lg font-bold text-green-600">{suggestion.savings}</div>
                          </div>
                        )}
                      </div>

                      <p className="text-gray-700 mb-4 leading-relaxed">{suggestion.description}</p>

                      {/* Before/After Comparison */}
                      <div className="bg-white/80 rounded-xl p-4 mb-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center">
                            <div className="text-xs font-semibold text-gray-500 mb-2">CURRENT</div>
                            <div className="bg-gray-100 rounded-lg p-3 border-2 border-gray-300">
                              <div className="font-bold text-gray-900">{suggestion.currentValue}</div>
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs font-semibold text-orange-600 mb-2">AI OPTIMIZED ✨</div>
                            <div className="bg-gradient-to-br from-orange-100 to-yellow-100 rounded-lg p-3 border-2 border-orange-400 shadow-md">
                              <div className="font-bold text-orange-700">{suggestion.suggestedValue}</div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Arrow showing improvement */}
                        <div className="flex items-center justify-center my-2">
                          <ArrowRight className="w-6 h-6 text-orange-500" />
                        </div>
                        
                        {/* Impact and Savings */}
                        <div className="grid grid-cols-1 gap-2 mt-3">
                          <div className="bg-blue-50 rounded-lg p-3 text-center">
                            <div className="text-xs text-blue-600 font-semibold mb-1">💡 IMPACT</div>
                            <div className="text-sm font-bold text-blue-900">{suggestion.impact}</div>
                          </div>
                          {suggestion.savings && (
                            <div className="bg-green-50 rounded-lg p-3 text-center">
                              <div className="text-xs text-green-600 font-semibold mb-1">� SAVINGS</div>
                              <div className="text-xl font-bold text-green-700">{suggestion.savings}</div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => {
                            suggestion.action();
                            handleOpenAIWizard(); // Refresh AI analysis
                          }}
                          className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                        >
                          <span>Apply & Re-analyze</span>
                        </button>
                        <button
                          onClick={() => {
                            suggestion.action();
                            setShowAIWizard(false);
                            if (step < 5) setStep(step + 1);
                          }}
                          className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                        >
                          <span>Apply & Continue</span>
                          <ArrowRight className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-12 text-center border-2 border-green-200">
                  <div className="text-6xl mb-4 animate-bounce">✨</div>
                  <h4 className="text-2xl font-bold text-gray-900 mb-3">Configuration Looks Great!</h4>
                  <p className="text-gray-700 text-lg mb-4">
                    Your current setup is well-optimized for <strong className="text-green-700">{getIndustryName(selectedTemplate)}</strong>
                  </p>
                  <div className="bg-white rounded-xl p-6 mb-4 shadow-sm">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-gray-600">System Size</div>
                        <div className="font-bold text-gray-900 text-lg">{storageSizeMW.toFixed(1)}MW / {durationHours}hr</div>
                        <div className="text-green-600">✓ Optimal</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Goal Alignment</div>
                        <div className="font-bold text-gray-900 text-lg capitalize">{selectedGoal.replace('-', ' ')}</div>
                        <div className="text-green-600">✓ Matched</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Payback Period</div>
                        <div className="font-bold text-gray-900 text-lg">{costs.paybackYears.toFixed(1)} years</div>
                        <div className="text-green-600">✓ Competitive</div>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-6">
                    Continue with your configuration or use the adjustment tools above to see new AI recommendations.
                  </p>
                  <button
                    onClick={() => {
                      setShowAIWizard(false);
                      if (step < 5) setStep(step + 1);
                    }}
                    className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white py-4 px-8 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all inline-flex items-center gap-2"
                  >
                    <span>✓ Confirm Configuration & Continue</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              )}

              {/* Bottom Action Buttons */}
              <div className="mt-6 flex gap-3 justify-center">
                <button
                  onClick={() => setShowAIWizard(false)}
                  className="px-8 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-semibold transition-all"
                >
                  Close & Keep Editing
                </button>
                {aiSuggestions.length > 0 && (
                  <button
                    onClick={() => {
                      setShowAIWizard(false);
                      if (step < 5) setStep(step + 1);
                    }}
                    className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-semibold transition-all flex items-center gap-2"
                  >
                    <span>Skip Suggestions & Continue</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartWizardV2;
