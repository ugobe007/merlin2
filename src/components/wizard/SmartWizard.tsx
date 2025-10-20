import React, { useState, useEffect } from 'react';
import Step0_ProjectType from './steps/Step0_ProjectType';
import Step1_PowerEquipment from './steps/Step1_PowerEquipment';
import Step2_HybridConfig from './steps/Step2_HybridConfig';
import Step3_LocationTariff from './steps/Step3_LocationTariff';
import Step2_Budget from './steps/Step2_Budget';
import Step5_EnhancedApplications from './steps/Step5_EnhancedApplications';
import Step6_TimeframeGoals from './steps/Step6_TimeframeGoals';
import Step7_DetailedCostAnalysis from './steps/Step7_DetailedCostAnalysis';
import Step4_Summary from './steps/Step4_Summary';
import QuotePreviewModal from '../modals/QuotePreviewModal';

interface SmartWizardProps {
  show: boolean;
  onClose: () => void;
  onFinish: (data: any) => void;
}

const SmartWizard: React.FC<SmartWizardProps> = ({ show, onClose, onFinish }) => {
  const [step, setStep] = useState(0);
  const [showQuotePreview, setShowQuotePreview] = useState(false);
  const [advancedMode, setAdvancedMode] = useState(false);

  // Step 0 State - Project Type
  const [projectType, setProjectType] = useState('');

  // Step 1 State
  const [power, setPower] = useState(1);
  const [gridConnection, setGridConnection] = useState('behind');
  const [selectedEquipment, setSelectedEquipment] = useState(['bess', 'grid']);

  // Auto-select hybrid equipment when hybrid project type is chosen
  useEffect(() => {
    if (projectType === 'hybrid' && !selectedEquipment.includes('hybrid')) {
      setSelectedEquipment(prev => [...prev, 'hybrid']);
    }
  }, [projectType, selectedEquipment]);

  // Step 2 Hybrid Config State
  const [bessPowerMW, setBessPowerMW] = useState(1);
  const [solarMW, setSolarMW] = useState(0);
  const [windMW, setWindMW] = useState(0);
  const [generatorMW, setGeneratorMW] = useState(0);
  const [generatorFuelType, setGeneratorFuelType] = useState('diesel');
  const [availableSpaceSqFt, setAvailableSpaceSqFt] = useState(0);
  const [pcsIncluded, setPcsIncluded] = useState(true);

  // Step 3 Location/Tariff State
  const [projectLocation, setProjectLocation] = useState('United States');
  const [tariffRegion, setTariffRegion] = useState('North America');
  const [shippingDestination, setShippingDestination] = useState('');

  // Step 4 Budget State
  const [budget, setBudget] = useState(500000);
  const [duration, setDuration] = useState(4);
  const [warranty, setWarranty] = useState('10');

  // Step 5 Applications State - Now multiple selection
  const [selectedApplications, setSelectedApplications] = useState<string[]>([]);
  const [applicationConfigs, setApplicationConfigs] = useState<{ [key: string]: any }>({});

  // Step 6 Timeframe/Goals State - Now multiple selection
  const [projectTimeframe, setProjectTimeframe] = useState('');
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);

  const handleEquipmentToggle = (id: string) => {
    setSelectedEquipment(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const getTariffRate = () => {
    const tariffRates: { [key: string]: number } = {
      'North America': 0.0125, // 1.25% average
      'Europe': 0.045, // 4.5% average
      'Asia Pacific': 0.075, // 7.5% average
      'Middle East': 0.10, // 10% average
      'Africa': 0.15, // 15% average
      'South America': 0.115, // 11.5% average
    };
    return tariffRates[tariffRegion] || 0.05;
  };

  const getShippingCost = () => {
    const batteryMWh = bessPowerMW * duration;
    const totalEquipmentWeight = batteryMWh * 1000 + solarMW * 500 + windMW * 800 + generatorMW * 1200; // Estimated kg
    
    const shippingRates: { [key: string]: number } = {
      'North America': 2.5, // $/kg
      'Europe': 3.5,
      'Asia Pacific': 4.5,
      'Middle East': 5.5,
      'Africa': 6.5,
      'South America': 5.0,
    };
    
    const ratePerKg = shippingRates[tariffRegion] || 3.5;
    return totalEquipmentWeight * ratePerKg;
  };

  const calculateApplicationCosts = () => {
    let totalAdditionalCosts = 0;
    
    // EV Charging additional costs
    if (selectedApplications.includes('ev-charging') && applicationConfigs['ev-charging']) {
      const config = applicationConfigs['ev-charging'];
      const chargerCost = config.chargerType === 'dc-fast' ? 50000 : 8000;
      const transformerCost = config.voltage === 480 ? 30000 : 15000;
      totalAdditionalCosts += (config.numChargers * chargerCost) + transformerCost;
    }
    
    // Data Center additional costs
    if (selectedApplications.includes('data-center') && applicationConfigs['data-center']) {
      const config = applicationConfigs['data-center'];
      const upsCost = config.upsRequired ? config.serverCapacityKW * 500 : 0;
      const redundancyCost = config.redundancyLevel === 'n+1' ? 100000 : config.redundancyLevel === '2n' ? 250000 : 0;
      totalAdditionalCosts += upsCost + redundancyCost;
    }
    
    // Manufacturing additional costs
    if (selectedApplications.includes('manufacturing') && applicationConfigs['manufacturing']) {
      const config = applicationConfigs['manufacturing'];
      const criticalLoadProtection = config.criticalProcesses ? 150000 : 0;
      const shiftSupport = config.loadProfile === 'three-shift' ? 80000 : config.loadProfile === 'two-shift' ? 50000 : 0;
      totalAdditionalCosts += criticalLoadProtection + shiftSupport;
    }
    
    // Add base costs for other applications (no detailed config required)
    if (selectedApplications.includes('industrial-backup')) {
      totalAdditionalCosts += 200000; // Base backup power equipment
    }
    if (selectedApplications.includes('grid-stabilization')) {
      totalAdditionalCosts += 150000; // Grid connection and control equipment
    }
    if (selectedApplications.includes('renewable-integration')) {
      totalAdditionalCosts += 100000; // Integration and control systems
    }
    if (selectedApplications.includes('peak-shaving')) {
      totalAdditionalCosts += 75000; // Monitoring and control equipment
    }
    if (selectedApplications.includes('other')) {
      totalAdditionalCosts += 50000; // General purpose equipment
    }
    
    return totalAdditionalCosts;
  };

  const calculateCosts = () => {
    const batteryMWh = bessPowerMW * duration;
    const pricePerKWh = bessPowerMW >= 5 ? 120 : 140;
    const batterySystem = batteryMWh * 1000 * pricePerKWh;

    const pcs = pcsIncluded ? 0 : bessPowerMW * 50000;
    const transformers = bessPowerMW * 50000;
    const inverters = bessPowerMW * 40000;
    const switchgear = bessPowerMW * 30000;
    const microgridControls = pcsIncluded ? 0 : 150000;

    const solar = solarMW * 800000;
    const solarInverters = solarMW * 50000;
    const wind = windMW * 1200000;
    const windConverters = windMW * 100000;
    const generator = generatorMW * 300000;
    const generatorControls = generatorMW * 50000;

    // Calculate application-specific costs
    const applicationCosts = calculateApplicationCosts();

    const equipmentSubtotal = batterySystem + pcs + transformers + inverters + switchgear + microgridControls + solar + solarInverters + wind + windConverters + generator + generatorControls + applicationCosts;
    
    const bos = equipmentSubtotal * 0.12;
    const epc = equipmentSubtotal * 0.15;
    
    // Calculate tariffs and shipping
    const tariffRate = getTariffRate();
    const tariffs = equipmentSubtotal * tariffRate;
    const shipping = getShippingCost();
    
    const grandTotal = equipmentSubtotal + bos + epc + tariffs + shipping;

    const annualSavings = Math.round(batteryMWh * 365 * 0.15 * 100);
    const paybackPeriod = grandTotal / annualSavings;

    return {
      batterySystem,
      pcs,
      transformers,
      inverters,
      switchgear,
      microgridControls,
      solar,
      solarInverters,
      wind,
      windConverters,
      generator,
      generatorControls,
      applicationCosts,
      bos,
      epc,
      tariffs,
      shipping,
      grandTotal,
      annualSavings,
      paybackPeriod,
    };
  };

  const handleGenerateQuote = () => {
    setShowQuotePreview(true);
  };

  // Get the appropriate total steps based on mode
  const getTotalSteps = () => {
    return advancedMode ? 8 : 5; // Simple mode: 0,1,2,3,4,8 (6 steps), Advanced: 0-8 (9 steps)
  };

  // Map simple mode step to actual step number
  const getActualStep = (simpleStep: number) => {
    if (advancedMode) return simpleStep;
    
    // Simple mode step mapping: skip 5, 6, 7
    const simpleStepMap = [0, 1, 2, 3, 4, 8]; // Skip applications, goals, detailed cost analysis
    return simpleStepMap[simpleStep] || 0;
  };

  const renderStep = () => {
    const actualStep = getActualStep(step);
    console.log('Rendering wizard step:', step, 'actual:', actualStep, 'advanced:', advancedMode);
    switch (actualStep) {
      case 0:
        return (
          <Step0_ProjectType
            projectType={projectType}
            setProjectType={setProjectType}
          />
        );
      case 1:
        return (
          <Step1_PowerEquipment
            power={power}
            setPower={setPower}
            gridConnection={gridConnection}
            setGridConnection={setGridConnection}
            selectedEquipment={selectedEquipment}
            handleEquipmentToggle={handleEquipmentToggle}
          />
        );
      case 2:
        return (
          <Step2_HybridConfig
            selectedEquipment={selectedEquipment}
            handleEquipmentToggle={handleEquipmentToggle}
            solarMW={solarMW}
            setSolarMW={setSolarMW}
            windMW={windMW}
            setWindMW={setWindMW}
            generatorMW={generatorMW}
            setGeneratorMW={setGeneratorMW}
            bessPowerMW={bessPowerMW}
            setBessPowerMW={setBessPowerMW}
            duration={duration}
            pcsIncluded={pcsIncluded}
            setPcsIncluded={setPcsIncluded}
          />
        );
      case 3:
        return (
          <Step3_LocationTariff
            projectLocation={projectLocation}
            setProjectLocation={setProjectLocation}
            tariffRegion={tariffRegion}
            setTariffRegion={setTariffRegion}
            shippingDestination={shippingDestination}
            setShippingDestination={setShippingDestination}
            bessPowerMW={bessPowerMW}
            duration={duration}
            solarMW={solarMW}
            windMW={windMW}
            generatorMW={generatorMW}
          />
        );
      case 4:
        return (
          <Step2_Budget
            budget={budget}
            setBudget={setBudget}
            duration={duration}
            setDuration={setDuration}
            warranty={warranty}
            setWarranty={setWarranty}
          />
        );
      case 5:
        return (
          <Step5_EnhancedApplications
            selectedApplications={selectedApplications}
            setSelectedApplications={setSelectedApplications}
            applicationConfigs={applicationConfigs}
            setApplicationConfigs={setApplicationConfigs}
          />
        );
      case 6:
        return (
          <Step6_TimeframeGoals
            projectTimeframe={projectTimeframe}
            setProjectTimeframe={setProjectTimeframe}
            selectedGoals={selectedGoals}
            setSelectedGoals={setSelectedGoals}
          />
        );
      case 7:
        return (
          <Step7_DetailedCostAnalysis
            bessPowerMW={bessPowerMW}
            solarMW={solarMW}
            windMW={windMW}
            generatorMW={generatorMW}
            generatorFuelType={generatorFuelType}
            selectedEquipment={selectedEquipment}
            duration={duration}
            pcsIncluded={pcsIncluded}
            projectLocation={projectLocation}
            tariffRegion={tariffRegion}
            costs={calculateCosts()}
          />
        );
      case 8:
        return (
          <Step4_Summary
            power={bessPowerMW}
            duration={duration}
            gridConnection={gridConnection}
            selectedEquipment={selectedEquipment}
            budget={budget}
            warranty={warranty}
            primaryApplication={selectedApplications[0] || ''}
            solarMW={solarMW}
            windMW={windMW}
            generatorMW={generatorMW}
            pcsIncluded={pcsIncluded}
            projectLocation={projectLocation}
            generatorFuelType={generatorFuelType}
            costs={calculateCosts()}
          />
        );
      default:
        return (
          <Step0_ProjectType
            projectType={projectType}
            setProjectType={setProjectType}
          />
        );
    }
  };

  if (!show) {
    return null;
  }

  if (!show) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-gradient-to-br from-gray-800 via-purple-900/50 to-blue-900/50 rounded-2xl shadow-2xl w-full max-w-5xl border-2 border-purple-500/30 my-8 flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-purple-500/20 bg-gray-900/50 backdrop-blur-xl">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Smart BESS Wizard
              </h2>
              {advancedMode && (
                <div className="mt-2 flex items-center space-x-2">
                  <span className="px-3 py-1 bg-orange-500/20 border border-orange-500/50 rounded-full text-xs font-bold text-orange-300">
                    ⚙️ ADVANCED MODE
                  </span>
                  <span className="text-xs text-gray-400">
                    All 9 steps • Full configuration options unlocked
                  </span>
                </div>
              )}
              {!advancedMode && (
                <div className="mt-2 flex items-center space-x-2">
                  <span className="px-3 py-1 bg-blue-500/20 border border-blue-500/50 rounded-full text-xs font-bold text-blue-300">
                    🚀 SIMPLE MODE
                  </span>
                  <span className="text-xs text-gray-400">
                    6 essential steps • Streamlined wizard for quick quotes
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-3">
            <button 
              onClick={() => setAdvancedMode(!advancedMode)}
              className={`px-4 py-2 ${
                advancedMode 
                  ? 'bg-gradient-to-br from-orange-500 to-red-500 border-orange-600' 
                  : 'bg-gradient-to-br from-blue-600/80 to-indigo-600/80 border-blue-700/50'
              } text-white rounded-xl font-bold shadow-lg hover:scale-105 transition-all flex items-center space-x-2 border-b-4`}
              title={advancedMode ? "Switch to Simple Mode" : "Enable Advanced Options"}
            >
              <span>⚙️</span>
              <span>{advancedMode ? 'Advanced Mode' : 'Advanced Options'}</span>
            </button>
            <button 
              onClick={onClose}
              className="px-4 py-2 bg-gradient-to-br from-purple-600/80 to-blue-600/80 text-white rounded-xl font-bold shadow-lg hover:scale-105 transition-all flex items-center space-x-2"
            >
              <span>🏠</span>
              <span>Home</span>
            </button>
            <button 
              onClick={onClose} 
              className="px-4 py-2 bg-gray-600/80 hover:bg-gray-600 text-white rounded-xl font-bold shadow-lg transition-all flex items-center space-x-2"
            >
              <span>✕</span>
              <span>Close</span>
            </button>
            </div>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="px-6 py-3 bg-gray-900/30 border-b border-purple-500/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400">
              Step {step + 1} of {getTotalSteps() + 1}
            </span>
            <span className="text-xs text-purple-300">
              {Math.round(((step + 1) / (getTotalSteps() + 1)) * 100)}% Complete
            </span>
          </div>
          <div className="w-full bg-gray-700/50 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((step + 1) / (getTotalSteps() + 1)) * 100}%` }}
            />
          </div>
        </div>
        
        <div className="p-8 flex-1 overflow-y-auto">
          {renderStep()}
        </div>
        <div className="p-6 border-t border-purple-500/20 flex justify-between bg-gray-900/50 backdrop-blur-xl flex-shrink-0">
          <div>
            {step > 0 && (
              <button 
                onClick={() => setStep(step - 1)} 
                className="px-6 py-3 bg-gray-600/80 hover:bg-gray-600 text-white rounded-xl font-bold shadow-lg transition-all border-b-4 border-gray-700/50 hover:border-gray-600 flex items-center space-x-2"
              >
                <span>←</span>
                <span>Back</span>
              </button>
            )}
          </div>
          <div>
            {step < getTotalSteps() && (
              <button 
                onClick={() => setStep(step + 1)} 
                className="px-6 py-3 bg-gradient-to-br from-purple-600/80 to-blue-600/80 text-white rounded-xl font-bold shadow-lg transform hover:scale-105 transition-all border-b-4 border-purple-700/50 hover:border-purple-500 flex items-center space-x-2"
              >
                <span>Next</span>
                <span>→</span>
              </button>
            )}
            {step === getTotalSteps() && (
              <button 
                onClick={handleGenerateQuote}
                className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold shadow-lg transform hover:scale-105 transition-all border-b-4 border-green-700/50 hover:border-green-500 flex items-center space-x-2 text-lg"
              >
                <span>🪄</span>
                <span>Generate My BESS Configuration</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Quote Preview Modal */}
      <QuotePreviewModal
        isOpen={showQuotePreview}
        onClose={() => {
          setShowQuotePreview(false);
          onFinish({
            power: bessPowerMW,
            duration,
            gridConnection,
            selectedEquipment,
            budget,
            warranty,
            primaryApplication: selectedApplications[0] || '',
            solarMW,
            windMW,
            generatorMW,
            projectLocation,
            tariffRegion,
            shippingDestination,
            projectTimeframe,
            primaryGoal: selectedGoals[0] || '',
          });
        }}
        quoteData={{
          clientName: '',
          projectName: 'BESS Project',
          bessPowerMW,
          duration,
          batteryMWh: bessPowerMW * duration,
          solarMW,
          windMW,
          generatorMW,
          gridConnection,
          application: selectedApplications[0] || '',
          location: projectLocation,
          tariffRegion,
          shippingDestination,
          projectTimeframe,
          primaryGoal: selectedGoals[0] || '',
          warranty: `${warranty} years`,
          pcsIncluded,
          costs: calculateCosts(),
          annualSavings: calculateCosts().annualSavings,
          paybackPeriod: calculateCosts().paybackPeriod,
          budget,
        }}
      />
    </div>
  );
};

export default SmartWizard;