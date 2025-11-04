import React, { useState, useEffect } from 'react';

// New customer-focused steps
import Step0_Goals from './steps/Step0_Goals';
import Step1_IndustryTemplate from './steps/Step1_IndustryTemplate';
import Step2_SimpleConfiguration from './steps/Step2_SimpleConfiguration';
import Step3_AddRenewables from './steps/Step3_AddRenewables';
import Step4_LocationPricing from './steps/Step4_LocationPricing';
import Step5_QuoteSummary from './steps/Step4_QuoteSummary'; // Renamed import to avoid confusion
import Step6_FinalOutput from './steps/Step6_FinalOutput';

interface SmartWizardProps {
  show: boolean;
  onClose: () => void;
  onFinish: (data: any) => void;
}

const SmartWizardV2: React.FC<SmartWizardProps> = ({ show, onClose, onFinish }) => {
  const [step, setStep] = useState(0);

  // Step 0: Goals
  const [selectedGoal, setSelectedGoal] = useState('');

  // Step 1: Industry Template
  const [selectedTemplate, setSelectedTemplate] = useState('');
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
    if (useTemplate && selectedTemplate && selectedTemplate !== 'custom') {
      const templates: { [key: string]: { mw: number; hours: number } } = {
        'manufacturing': { mw: 3, hours: 4 },
        'office': { mw: 1, hours: 4 },
        'datacenter': { mw: 10, hours: 6 },
        'warehouse': { mw: 2, hours: 3 },
        'hotel': { mw: 1, hours: 4 },
        'retail': { mw: 0.5, hours: 3 },
        'agriculture': { mw: 1.5, hours: 6 }
      };
      
      const template = templates[selectedTemplate];
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

  const handleNext = () => {
    if (step < 6) {
      setStep(step + 1);
    } else {
      // Final step - finish wizard
      const finalData = {
        selectedGoal,
        selectedTemplate,
        storageSizeMW,
        durationHours,
        solarMW,
        windMW,
        generatorMW,
        location,
        electricityRate,
        selectedInstallation,
        selectedShipping,
        selectedFinancing,
        ...costs
      };
      onFinish(finalData);
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
      case 1: return useTemplate ? selectedTemplate !== '' : true;
      case 2: return storageSizeMW > 0 && durationHours > 0;
      case 3: return true; // Optional step
      case 4: return location !== '' && electricityRate > 0;
      case 5: return true; // Options step, defaults are set
      case 6: return true; // Final output
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
      'Review Your Quote',
      'Get Your Quote'
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
      case 6:
        return (
          <Step6_FinalOutput
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
            onDownloadPDF={() => console.log('Download PDF')}
            onDownloadExcel={() => console.log('Download Excel')}
            onEmailQuote={(email) => console.log('Email to:', email)}
            onSaveProject={() => console.log('Save project')}
            onRequestConsultation={() => console.log('Request consultation')}
          />
        );
      default:
        return null;
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-4xl">🪄</span>
              <div>
                <h2 className="text-2xl font-bold">Smart Wizard</h2>
                <p className="text-sm opacity-90">Step {step + 1} of 7: {getStepTitle()}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 text-3xl font-bold"
            >
              ×
            </button>
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
            Step {step + 1} of 7
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
            {step === 6 ? 'Finish →' : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SmartWizardV2;
