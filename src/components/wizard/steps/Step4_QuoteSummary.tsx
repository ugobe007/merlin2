import React, { useState } from 'react';
import { Sparkles, ArrowRight, Zap, Settings, Truck, Wrench } from 'lucide-react';
import ConsultationModal from '../../modals/ConsultationModal';
import { calculateEquipmentBreakdown, formatCurrency, formatNumber, type EquipmentBreakdown } from '../../../utils/equipmentCalculations';
import { formatSolarCapacity } from '../../../utils/solarSizingUtils';
import AIStatusIndicator from '../AIStatusIndicator';

interface Step4_QuoteSummaryProps {
  // System configuration
  storageSizeMW: number;
  durationHours: number;
  solarMW: number;
  windMW: number;
  generatorMW: number;
  location: string;
  industryTemplate: string | string[];
  
  // Quote calculations (will be passed from parent)
  equipmentCost: number;
  installationCost: number;
  shippingCost: number;
  tariffCost: number;
  // totalProjectCost: number; // Now calculated from equipmentBreakdown
  annualSavings: number;
  paybackYears: number;
  taxCredit30Percent: number;
  netCostAfterTaxCredit: number;
  
  // AI Wizard props
  onOpenAIWizard?: () => void;
  showAIWizard?: boolean;
  aiBaseline?: {
    optimalPowerMW: number;
    optimalDurationHrs: number;
    optimalSolarMW: number;
    improvementText: string;
  } | null;

  // Industry data for detailed equipment breakdown
  industryData?: {
    selectedIndustry: string;
    useCaseData: { [key: string]: any };
  };
}

const Step4_QuoteSummary: React.FC<Step4_QuoteSummaryProps> = ({
  storageSizeMW,
  durationHours,
  solarMW,
  windMW,
  generatorMW,
  location,
  industryTemplate,
  equipmentCost,
  installationCost,
  shippingCost,
  tariffCost,
  // totalProjectCost, // Now calculated from equipmentBreakdown
  annualSavings,
  paybackYears,
  taxCredit30Percent,
  netCostAfterTaxCredit,
  onOpenAIWizard,
  showAIWizard,
  aiBaseline,
  industryData,
}) => {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [selectedInstallation, setSelectedInstallation] = useState('epc');
  const [selectedShipping, setSelectedShipping] = useState('best-value');
  const [selectedFinancing, setSelectedFinancing] = useState('cash');
  const [showConsultationModal, setShowConsultationModal] = useState(false);

  const totalEnergyMWh = storageSizeMW * durationHours;
  // Determine grid connection type from industry data
  const gridConnection = industryData?.useCaseData?.gridConnection || 'on-grid';

  // Calculate detailed equipment breakdown
  const equipmentBreakdown: EquipmentBreakdown = calculateEquipmentBreakdown(
    storageSizeMW,
    durationHours,
    solarMW,
    windMW,
    generatorMW,
    industryData,
    gridConnection
  );

  // Check for renewables including auto-generated generators for off-grid systems
  const hasRenewables = solarMW > 0 || windMW > 0 || generatorMW > 0 || equipmentBreakdown.generators;

  // Use equipment breakdown total as single source of truth
  const totalProjectCost = equipmentBreakdown.totals.totalProjectCost;

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const installationOptions = [
    {
      id: 'epc',
      icon: '🏗️',
      name: 'Full Turnkey (EPC)',
      description: 'One vendor handles everything',
      markup: '25-35%',
      cost: installationCost * 1.3,
      recommended: true,
      pros: ['Lowest hassle', 'Single point of contact', 'Warranty coverage', 'Fastest deployment'],
      cons: ['Highest cost', 'Less control']
    },
    {
      id: 'contractor',
      icon: '👷',
      name: 'General Contractor',
      description: 'You hire the contractor',
      markup: '15-25%',
      cost: installationCost * 1.2,
      recommended: false,
      pros: ['Medium cost', 'More control', 'Can negotiate rates'],
      cons: ['You manage coordination', 'More effort required']
    },
    {
      id: 'self',
      icon: '🔧',
      name: 'Self-Installation',
      description: 'You manage everything',
      markup: '0%',
      cost: installationCost,
      recommended: false,
      pros: ['Lowest cost', 'Full control', 'Equipment only'],
      cons: ['Highest complexity', 'Requires expertise', 'You handle permits']
    }
  ];

  const shippingOptions = [
    {
      id: 'best-value',
      icon: '⭐',
      name: 'Best Value (Recommended)',
      description: 'Optimized shipping route',
      cost: shippingCost,
      leadTime: '8-12 weeks',
      recommended: true
    },
    {
      id: 'usa',
      icon: '🇺🇸',
      name: 'USA Supplier',
      description: 'Fastest delivery, higher cost',
      cost: shippingCost * 1.4,
      leadTime: '4-6 weeks',
      recommended: false
    },
    {
      id: 'china',
      icon: '🇨🇳',
      name: 'China Direct',
      description: 'Best price, longer lead time, 21% tariff',
      cost: shippingCost * 0.8,
      leadTime: '12-16 weeks',
      recommended: false
    }
  ];

  const financingOptions = [
    {
      id: 'cash',
      icon: '💰',
      name: 'Cash Purchase',
      upfront: totalProjectCost,
      monthly: 0,
      ownership: true,
      taxCredits: true,
      cost10yr: totalProjectCost - (annualSavings * 10),
      recommended: true
    },
    {
      id: 'loan',
      icon: '🏦',
      name: 'Traditional Loan (5yr)',
      upfront: totalProjectCost * 0.2,
      monthly: (totalProjectCost * 0.8 * 1.06) / 60, // 6% interest
      ownership: true,
      taxCredits: true,
      cost10yr: totalProjectCost * 1.1 - (annualSavings * 10),
      recommended: false
    },
    {
      id: 'lease',
      icon: '📋',
      name: 'Lease / PPA',
      upfront: 0,
      monthly: annualSavings * 0.8 / 12, // Provider takes 20% of savings
      ownership: false,
      taxCredits: false,
      cost10yr: (annualSavings * 0.8 * 10),
      recommended: false
    }
  ];

  const selectedInstallationOption = installationOptions.find(o => o.id === selectedInstallation);
  const selectedShippingOption = shippingOptions.find(o => o.id === selectedShipping);
  const selectedFinancingOption = financingOptions.find(o => o.id === selectedFinancing);

  // Recalculate totals based on selections
  const adjustedTotalCost = equipmentCost + (selectedInstallationOption?.cost || installationCost) + (selectedShippingOption?.cost || shippingCost) + tariffCost;
  const adjustedNetCost = adjustedTotalCost - taxCredit30Percent;

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <div className="flex justify-center items-center gap-3">
          <h2 className="text-4xl font-bold text-gray-800">
            Your Custom Quote
          </h2>
          <AIStatusIndicator compact={true} />
        </div>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
          Review your system configuration and choose your options
        </p>
      </div>

      {/* System Summary Card */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-400 p-8 shadow-xl">
        <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          Your Energy Storage System
        </h3>
        
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Left: System Details */}
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow">
              <span className="text-gray-600">Power Output:</span>
              <span className="text-2xl font-bold text-blue-600">{storageSizeMW.toFixed(1)} MW</span>
            </div>
            <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow">
              <span className="text-gray-600">Total Storage:</span>
              <span className="text-2xl font-bold text-green-600">{totalEnergyMWh.toFixed(1)} MWh</span>
            </div>
            <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow">
              <span className="text-gray-600">Duration:</span>
              <span className="text-2xl font-bold text-purple-600">{durationHours} hours</span>
            </div>
            {hasRenewables && (
              <div className="bg-green-50 p-4 rounded-lg border border-green-300">
                <div className="text-sm font-semibold text-green-900 mb-2">+ Renewables:</div>
                {solarMW > 0 && <div className="text-sm">☀️ Solar: {formatSolarCapacity(solarMW)}</div>}
                {windMW > 0 && <div className="text-sm">💨 Wind: {windMW.toFixed(1)} MW</div>}
                {generatorMW > 0 && <div className="text-sm">⚡ Generator: {generatorMW.toFixed(1)} MW</div>}
              </div>
            )}
          </div>

          {/* Right: Financial Summary */}
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm text-gray-500 mb-1">Equipment & Installation</div>
              <div className="text-2xl font-bold text-gray-800">${(adjustedTotalCost / 1000000).toFixed(2)}M</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg shadow border border-green-300">
              <div className="text-sm text-gray-600 mb-1">Annual Savings</div>
              <div className="text-2xl font-bold text-green-600">${(annualSavings / 1000).toFixed(0)}K/year</div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg shadow border border-blue-300">
              <div className="text-sm text-gray-600 mb-1">Payback Period</div>
              <div className="text-2xl font-bold text-blue-600">{paybackYears.toFixed(1)} years</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg shadow border border-purple-300">
              <div className="text-sm text-gray-600 mb-1">30% Federal Tax Credit</div>
              <div className="text-2xl font-bold text-purple-600">-${(taxCredit30Percent / 1000000).toFixed(2)}M</div>
            </div>
          </div>
        </div>

        {/* Bottom: Net Cost */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-xl text-center">
          <div className="text-sm opacity-90 mb-1">Net Project Cost (After Tax Credit)</div>
          <div className="text-4xl font-bold">${(adjustedNetCost / 1000000).toFixed(2)}M</div>
        </div>
      </div>

      {/* AI Wizard Button - Prominent placement below Net Cost */}
      {onOpenAIWizard && (
        <div className="mt-6 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-6 border-2 border-yellow-300 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Sparkles className="w-6 h-6 text-orange-500" />
                <h3 className="text-xl font-bold text-gray-800">AI Configuration Optimizer</h3>
              </div>
              <p className="text-gray-600 text-sm mb-3">
                Let AI analyze your configuration and suggest optimizations.
              </p>
              {aiBaseline && aiBaseline.improvementText && (
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-400 rounded-lg px-4 py-2 shadow-md">
                  <span className="text-green-700 font-bold text-base">{aiBaseline.improvementText}</span>
                  <span className="text-green-600 text-xs">← Click AI Wizard to see details</span>
                </div>
              )}
              {(!aiBaseline || !aiBaseline.improvementText) && (
                <div className="inline-flex items-center gap-2 bg-blue-100 border border-blue-300 rounded-lg px-3 py-1.5">
                  <span className="text-blue-700 font-semibold text-sm">🤖 AI Analyzing...</span>
                  <span className="text-blue-600 text-xs">Calculating optimal configuration</span>
                </div>
              )}
            </div>
            <button
              onClick={onOpenAIWizard}
              className="ml-4 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white px-8 py-4 rounded-xl font-bold transition-all hover:scale-105 flex items-center gap-3 shadow-xl border-2 border-white/50"
            >
              <Sparkles className="w-6 h-6" />
              <div className="text-left">
                <div className="text-lg">Open AI Wizard</div>
                <div className="text-xs opacity-90">Get Smart Recommendations</div>
              </div>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Detailed Equipment Breakdown */}
      <div className="bg-white rounded-2xl border-2 border-gray-300 shadow-xl overflow-hidden">
        <button
          onClick={() => toggleSection('equipment')}
          className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 p-3 rounded-full">
              <Settings className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-left">
              <h3 className="text-xl font-bold text-gray-800">Detailed Equipment Breakdown</h3>
              <p className="text-gray-600">Equipment breakdown with costs</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-blue-600">{formatCurrency(equipmentBreakdown.totals.equipmentCost)}</span>
            <div className={`transform transition-transform ${expandedSection === 'equipment' ? 'rotate-180' : ''}`}>
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </button>

        {expandedSection === 'equipment' && (
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            
            {/* Battery Energy Storage System */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-green-100 p-2 rounded-lg">
                  <Zap className="w-5 h-5 text-green-600" />
                </div>
                <h4 className="text-lg font-bold text-gray-800">Battery Energy Storage System</h4>
              </div>
              <div className="bg-white rounded-xl p-6 border-2 border-green-200">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Equipment</div>
                    <div className="font-bold text-gray-900">{equipmentBreakdown.batteries.manufacturer} {equipmentBreakdown.batteries.model}</div>
                    <div className="text-sm text-gray-600 mt-2">
                      {equipmentBreakdown.batteries.unitPowerMW}MW / {equipmentBreakdown.batteries.unitEnergyMWh}MWh per unit
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Quantity & Cost</div>
                    <div className="font-bold text-gray-900">{formatNumber(equipmentBreakdown.batteries.quantity)} units</div>
                    <div className="text-sm text-gray-600">
                      {formatCurrency(equipmentBreakdown.batteries.unitCost)} each
                    </div>
                    <div className="text-lg font-bold text-green-600 mt-1">
                      Total: {formatCurrency(equipmentBreakdown.batteries.totalCost)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Power Conversion Equipment */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Zap className="w-5 h-5 text-blue-600" />
                </div>
                <h4 className="text-lg font-bold text-gray-800">Power Conversion & Grid Integration</h4>
              </div>
              
              <div className="space-y-4">
                {/* Inverters */}
                <div className="bg-white rounded-xl p-4 border-2 border-blue-200">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <div className="text-sm text-gray-600">Power Inverters</div>
                      <div className="font-bold">{equipmentBreakdown.inverters.manufacturer} {equipmentBreakdown.inverters.model}</div>
                      <div className="text-xs text-gray-500">{equipmentBreakdown.inverters.unitPowerMW}MW each</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Quantity</div>
                      <div className="font-bold">{formatNumber(equipmentBreakdown.inverters.quantity)} units</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Cost</div>
                      <div className="font-bold text-blue-600">{formatCurrency(equipmentBreakdown.inverters.totalCost)}</div>
                    </div>
                  </div>
                </div>

                {/* Transformers */}
                <div className="bg-white rounded-xl p-4 border-2 border-blue-200">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <div className="text-sm text-gray-600">Step-up Transformers</div>
                      <div className="font-bold">{equipmentBreakdown.transformers.manufacturer}</div>
                      <div className="text-xs text-gray-500">{equipmentBreakdown.transformers.unitPowerMVA}MVA, {equipmentBreakdown.transformers.voltage}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Quantity</div>
                      <div className="font-bold">{formatNumber(equipmentBreakdown.transformers.quantity)} units</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Cost</div>
                      <div className="font-bold text-blue-600">{formatCurrency(equipmentBreakdown.transformers.totalCost)}</div>
                    </div>
                  </div>
                </div>

                {/* Switchgear */}
                <div className="bg-white rounded-xl p-4 border-2 border-blue-200">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <div className="text-sm text-gray-600">Switchgear & Protection</div>
                      <div className="font-bold">{equipmentBreakdown.switchgear.type}</div>
                      <div className="text-xs text-gray-500">{equipmentBreakdown.switchgear.voltage}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Quantity</div>
                      <div className="font-bold">{formatNumber(equipmentBreakdown.switchgear.quantity)} units</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Cost</div>
                      <div className="font-bold text-blue-600">{formatCurrency(equipmentBreakdown.switchgear.totalCost)}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* EV Chargers (if applicable) */}
            {equipmentBreakdown.evChargers && (
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-purple-100 p-2 rounded-lg">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-bold text-gray-800">EV Charging Infrastructure</h4>
                </div>
                
                <div className="space-y-4">
                  {/* Level 2 Chargers */}
                  {equipmentBreakdown.evChargers.level2Chargers.quantity > 0 && (
                    <div className="bg-white rounded-xl p-4 border-2 border-purple-200">
                      <div className="grid md:grid-cols-3 gap-4">
                        <div>
                          <div className="text-sm text-gray-600">Level 2 Chargers</div>
                          <div className="font-bold">{equipmentBreakdown.evChargers.level2Chargers.unitPowerKW}kW AC Charging</div>
                          <div className="text-xs text-gray-500">7-19kW charging power</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Quantity</div>
                          <div className="font-bold">{formatNumber(equipmentBreakdown.evChargers.level2Chargers.quantity)} chargers</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Cost</div>
                          <div className="font-bold text-purple-600">{formatCurrency(equipmentBreakdown.evChargers.level2Chargers.totalCost)}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* DC Fast Chargers */}
                  {equipmentBreakdown.evChargers.dcFastChargers.quantity > 0 && (
                    <div className="bg-white rounded-xl p-4 border-2 border-purple-200">
                      <div className="grid md:grid-cols-3 gap-4">
                        <div>
                          <div className="text-sm text-gray-600">DC Fast Chargers</div>
                          <div className="font-bold">{equipmentBreakdown.evChargers.dcFastChargers.unitPowerKW}kW DC Charging</div>
                          <div className="text-xs text-gray-500">50-350kW rapid charging</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Quantity</div>
                          <div className="font-bold">{formatNumber(equipmentBreakdown.evChargers.dcFastChargers.quantity)} chargers</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Cost</div>
                          <div className="font-bold text-purple-600">{formatCurrency(equipmentBreakdown.evChargers.dcFastChargers.totalCost)}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                    <div className="text-center">
                      <div className="text-sm text-purple-600 mb-1">Total EV Charging Infrastructure</div>
                      <div className="text-xl font-bold text-purple-700">{formatCurrency(equipmentBreakdown.evChargers.totalChargingCost)}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Generators (if applicable) */}
            {equipmentBreakdown.generators && (
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-orange-100 p-2 rounded-lg">
                    <Settings className="w-5 h-5 text-orange-600" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-800">Backup Generators</h4>
                </div>
                <div className="bg-white rounded-xl p-4 border-2 border-orange-200">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <div className="text-sm text-gray-600">Diesel Generators</div>
                      <div className="font-bold">{equipmentBreakdown.generators.manufacturer}</div>
                      <div className="text-xs text-gray-500">{equipmentBreakdown.generators.unitPowerMW}MW {equipmentBreakdown.generators.fuelType}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Quantity</div>
                      <div className="font-bold">{formatNumber(equipmentBreakdown.generators.quantity)} units</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Cost</div>
                      <div className="font-bold text-orange-600">{formatCurrency(equipmentBreakdown.generators.totalCost)}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Solar (if applicable) */}
            {equipmentBreakdown.solar && (
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-yellow-100 p-2 rounded-lg">
                    <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-bold text-gray-800">Solar Power Generation</h4>
                  {!equipmentBreakdown.solar.spaceRequirements.isFeasible && (
                    <div className="bg-red-100 border border-red-300 rounded-lg px-3 py-1">
                      <span className="text-red-700 font-semibold text-sm">⚠️ Space Constrained</span>
                    </div>
                  )}
                </div>
                
                <div className="space-y-4">
                  {/* Solar System Details */}
                  <div className="bg-white rounded-xl p-4 border-2 border-yellow-200">
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <div className="text-sm text-gray-600">Solar Array</div>
                        <div className="font-bold">{equipmentBreakdown.solar.totalMW}MW Solar PV</div>
                        <div className="text-xs text-gray-500">{formatNumber(equipmentBreakdown.solar.panelQuantity)} panels, {equipmentBreakdown.solar.inverterQuantity} inverters</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Cost per Watt</div>
                        <div className="font-bold">${equipmentBreakdown.solar.costPerWatt.toFixed(2)}/W</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Total Cost</div>
                        <div className="font-bold text-yellow-600">{formatCurrency(equipmentBreakdown.solar.totalCost)}</div>
                      </div>
                    </div>
                  </div>

                  {/* Space Requirements */}
                  <div className="bg-yellow-50 rounded-xl p-6 border-2 border-yellow-200">
                    <h5 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2zM7 3v18M17 3v18M3 7h18M3 17h18" />
                      </svg>
                      Space Requirements Analysis
                    </h5>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Rooftop Option */}
                      <div className="bg-white rounded-lg p-4 border border-yellow-300">
                        <div className="flex items-center gap-2 mb-3">
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                          </svg>
                          <span className="font-semibold text-gray-800">Rooftop Installation</span>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Area needed:</span>
                            <span className="font-bold">{formatNumber(equipmentBreakdown.solar.spaceRequirements.rooftopAreaSqFt)} sq ft</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Equivalent:</span>
                            <span className="font-bold">{equipmentBreakdown.solar.spaceRequirements.rooftopAreaAcres.toFixed(1)} acres</span>
                          </div>
                          <div className="text-xs text-gray-500 mt-2">
                            Tighter spacing, structural load considerations
                          </div>
                        </div>
                      </div>

                      {/* Ground-Mount Option */}
                      <div className="bg-white rounded-lg p-4 border border-yellow-300">
                        <div className="flex items-center gap-2 mb-3">
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4M4 19h4M13 3h8v8h-8zM13 21h8v-8h-8z" />
                          </svg>
                          <span className="font-semibold text-gray-800">Ground-Mount Installation</span>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Area needed:</span>
                            <span className="font-bold">{formatNumber(equipmentBreakdown.solar.spaceRequirements.groundAreaSqFt)} sq ft</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Equivalent:</span>
                            <span className="font-bold">{equipmentBreakdown.solar.spaceRequirements.groundAreaAcres.toFixed(1)} acres</span>
                          </div>
                          <div className="text-xs text-gray-500 mt-2">
                            Includes spacing, access roads, setbacks
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Constraints */}
                    {equipmentBreakdown.solar.spaceRequirements.constraints.length > 0 && (
                      <div className="mt-6">
                        <h6 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                          <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                          Space Constraints
                        </h6>
                        <div className="space-y-2">
                          {equipmentBreakdown.solar.spaceRequirements.constraints.map((constraint, index) => (
                            <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-3">
                              <div className="text-sm text-red-700">{constraint}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Alternatives */}
                    {equipmentBreakdown.solar.spaceRequirements.alternatives && (
                      <div className="mt-6">
                        <h6 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                          Recommended Alternatives
                        </h6>
                        <div className="grid md:grid-cols-2 gap-3">
                          {equipmentBreakdown.solar.spaceRequirements.alternatives.map((alternative, index) => (
                            <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                              <div className="text-sm text-blue-700 font-medium">{alternative}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Installation Breakdown */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-gray-100 p-2 rounded-lg">
                  <Wrench className="w-5 h-5 text-gray-600" />
                </div>
                <h4 className="text-lg font-bold text-gray-800">Installation & Services</h4>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl p-4 border-2 border-gray-200">
                  <div className="text-sm text-gray-600 mb-1">Balance of System</div>
                  <div className="font-bold text-gray-900">{formatCurrency(equipmentBreakdown.installation.bos)}</div>
                  <div className="text-xs text-gray-500">Wiring, mounting, HVAC, monitoring</div>
                </div>
                <div className="bg-white rounded-xl p-4 border-2 border-gray-200">
                  <div className="text-sm text-gray-600 mb-1">EPC & Installation</div>
                  <div className="font-bold text-gray-900">{formatCurrency(equipmentBreakdown.installation.epc)}</div>
                  <div className="text-xs text-gray-500">Engineering, procurement, construction</div>
                </div>
                <div className="bg-white rounded-xl p-4 border-2 border-gray-200">
                  <div className="text-sm text-gray-600 mb-1">Contingency</div>
                  <div className="font-bold text-gray-900">{formatCurrency(equipmentBreakdown.installation.contingency)}</div>
                  <div className="text-xs text-gray-500">Project risk management</div>
                </div>
              </div>
            </div>

            {/* Total Summary */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
              <div className="grid md:grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-blue-100 text-sm mb-1">Equipment Total</div>
                  <div className="text-2xl font-bold">{formatCurrency(equipmentBreakdown.totals.equipmentCost)}</div>
                </div>
                <div>
                  <div className="text-blue-100 text-sm mb-1">Installation Total</div>
                  <div className="text-2xl font-bold">{formatCurrency(equipmentBreakdown.totals.installationCost)}</div>
                </div>
                <div>
                  <div className="text-blue-100 text-sm mb-1">Project Total</div>
                  <div className="text-3xl font-bold">{formatCurrency(equipmentBreakdown.totals.totalProjectCost)}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Expandable Options Sections */}
      <div className="space-y-4">
        
        {/* Installation Options */}
        <div className="bg-white rounded-xl border-2 border-gray-300 shadow-lg overflow-hidden">
          <button
            onClick={() => toggleSection('installation')}
            className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <span className="text-4xl">🏗️</span>
              <div className="text-left">
                <h3 className="text-xl font-bold text-gray-800">Installation Options</h3>
                <p className="text-sm text-gray-600">
                  Selected: {selectedInstallationOption?.name} (+${((selectedInstallationOption?.cost || 0) / 1000000).toFixed(2)}M)
                </p>
              </div>
            </div>
            <span className="text-3xl text-gray-400">{expandedSection === 'installation' ? '−' : '+'}</span>
          </button>
          
          {expandedSection === 'installation' && (
            <div className="p-6 bg-gray-50 border-t-2 border-gray-200">
              <div className="grid md:grid-cols-3 gap-4">
                {installationOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setSelectedInstallation(option.id)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      selectedInstallation === option.id
                        ? 'bg-blue-50 border-blue-500 shadow-lg'
                        : 'bg-white border-gray-300 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-3xl">{option.icon}</span>
                      {option.recommended && (
                        <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full font-bold">
                          Recommended
                        </span>
                      )}
                      {selectedInstallation === option.id && (
                        <span className="text-2xl text-green-600">✓</span>
                      )}
                    </div>
                    <h4 className="font-bold text-gray-900 mb-1">{option.name}</h4>
                    <p className="text-xs text-gray-600 mb-2">{option.description}</p>
                    <div className="text-lg font-bold text-blue-600 mb-2">
                      ${(option.cost / 1000000).toFixed(2)}M
                    </div>
                    <div className="text-xs text-gray-500 mb-2">Markup: {option.markup}</div>
                    <div className="text-xs space-y-1">
                      <div className="font-semibold text-gray-700">Pros:</div>
                      {option.pros.map((pro, idx) => (
                        <div key={idx} className="text-green-600">✓ {pro}</div>
                      ))}
                      <div className="font-semibold text-gray-700 mt-2">Cons:</div>
                      {option.cons.map((con, idx) => (
                        <div key={idx} className="text-red-600">✗ {con}</div>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Shipping & Logistics Options */}
        <div className="bg-white rounded-xl border-2 border-gray-300 shadow-lg overflow-hidden">
          <button
            onClick={() => toggleSection('shipping')}
            className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <span className="text-4xl">🚚</span>
              <div className="text-left">
                <h3 className="text-xl font-bold text-gray-800">Shipping & Logistics</h3>
                <p className="text-sm text-gray-600">
                  Selected: {selectedShippingOption?.name} (+${((selectedShippingOption?.cost || 0) / 1000).toFixed(0)}K)
                </p>
              </div>
            </div>
            <span className="text-3xl text-gray-400">{expandedSection === 'shipping' ? '−' : '+'}</span>
          </button>
          
          {expandedSection === 'shipping' && (
            <div className="p-6 bg-gray-50 border-t-2 border-gray-200">
              <div className="grid md:grid-cols-3 gap-4">
                {shippingOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setSelectedShipping(option.id)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      selectedShipping === option.id
                        ? 'bg-blue-50 border-blue-500 shadow-lg'
                        : 'bg-white border-gray-300 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-3xl">{option.icon}</span>
                      {option.recommended && (
                        <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full font-bold">
                          Recommended
                        </span>
                      )}
                      {selectedShipping === option.id && (
                        <span className="text-2xl text-green-600">✓</span>
                      )}
                    </div>
                    <h4 className="font-bold text-gray-900 mb-1">{option.name}</h4>
                    <p className="text-xs text-gray-600 mb-3">{option.description}</p>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Cost:</span>
                        <span className="font-bold text-blue-600">${(option.cost / 1000).toFixed(0)}K</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Lead Time:</span>
                        <span className="font-semibold text-gray-700">{option.leadTime}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              
              <div className="mt-4 bg-yellow-50 border border-yellow-300 p-4 rounded-lg">
                <div className="flex items-start gap-2">
                  <span className="text-xl">⚠️</span>
                  <div className="text-sm text-gray-700">
                    <strong>Tariffs:</strong> 21% tariff on batteries from China = +${(tariffCost / 1000).toFixed(0)}K (already included in total)
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Financing Options */}
        <div className="bg-white rounded-xl border-2 border-gray-300 shadow-lg overflow-hidden">
          <button
            onClick={() => toggleSection('financing')}
            className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <span className="text-4xl">💳</span>
              <div className="text-left">
                <h3 className="text-xl font-bold text-gray-800">Financing Options</h3>
                <p className="text-sm text-gray-600">
                  Selected: {selectedFinancingOption?.name}
                </p>
              </div>
            </div>
            <span className="text-3xl text-gray-400">{expandedSection === 'financing' ? '−' : '+'}</span>
          </button>
          
          {expandedSection === 'financing' && (
            <div className="p-6 bg-gray-50 border-t-2 border-gray-200">
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                {financingOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setSelectedFinancing(option.id)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      selectedFinancing === option.id
                        ? 'bg-blue-50 border-blue-500 shadow-lg'
                        : 'bg-white border-gray-300 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-3xl">{option.icon}</span>
                      {option.recommended && (
                        <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full font-bold">
                          Best ROI
                        </span>
                      )}
                      {selectedFinancing === option.id && (
                        <span className="text-2xl text-green-600">✓</span>
                      )}
                    </div>
                    <h4 className="font-bold text-gray-900 mb-3">{option.name}</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Upfront:</span>
                        <span className="font-bold">${(option.upfront / 1000000).toFixed(2)}M</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Monthly:</span>
                        <span className="font-bold">${(option.monthly / 1000).toFixed(1)}K</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">You Own It:</span>
                        <span className="font-semibold">{option.ownership ? '✅' : '❌'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tax Credits:</span>
                        <span className="font-semibold">{option.taxCredits ? '✅' : '❌'}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2 mt-2">
                        <span className="text-gray-600">10yr Net:</span>
                        <span className="font-bold text-green-600">
                          ${(option.cost10yr / 1000000).toFixed(2)}M
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Comparison Table */}
              <div className="bg-white rounded-lg border-2 border-gray-300 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-3 text-left">Option</th>
                      <th className="p-3 text-right">Upfront</th>
                      <th className="p-3 text-right">Monthly</th>
                      <th className="p-3 text-center">Ownership</th>
                      <th className="p-3 text-right">10yr Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {financingOptions.map((option) => (
                      <tr key={option.id} className={selectedFinancing === option.id ? 'bg-blue-50 font-semibold' : ''}>
                        <td className="p-3">{option.name}</td>
                        <td className="p-3 text-right">${(option.upfront / 1000000).toFixed(2)}M</td>
                        <td className="p-3 text-right">${(option.monthly / 1000).toFixed(1)}K</td>
                        <td className="p-3 text-center">{option.ownership ? '✅' : '❌'}</td>
                        <td className="p-3 text-right text-green-600 font-bold">${(option.cost10yr / 1000000).toFixed(2)}M</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Industry Calculation Standards Reference */}
      <div className="bg-gradient-to-r from-green-50 to-teal-50 border-2 border-green-400 rounded-xl p-6 shadow-lg">
        <div className="flex items-start space-x-4">
          <span className="text-3xl">🔬</span>
          <div className="flex-1">
            <h4 className="font-bold text-green-800 mb-2">Industry-Validated Calculations</h4>
            <p className="text-gray-700 mb-3">
              All pricing and formulas in this quote are validated against authoritative industry sources including NREL ATB 2024, GSL Energy 2025, and current SEIA/AWEA market data.
            </p>
            <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <span className="text-green-600">✓</span>
                <span>NREL battery cost methodology</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-green-600">✓</span>
                <span>Q4 2025 market pricing</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-green-600">✓</span>
                <span>IEEE degradation standards</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-green-600">✓</span>
                <span>Professional financial modeling</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Help Box */}
      <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-6">
        <div className="flex items-start space-x-4">
          <span className="text-3xl">💡</span>
          <div>
            <h4 className="font-bold text-blue-900 mb-2">Need Help Deciding?</h4>
            <p className="text-gray-700 mb-3">
              Our energy consultants can help you choose the right options for your project and connect you with trusted partners.
            </p>
            <button 
              onClick={() => setShowConsultationModal(true)}
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
            >
              Schedule Free Consultation
            </button>
          </div>
        </div>
      </div>

      {/* Consultation Modal */}
      <ConsultationModal
        isOpen={showConsultationModal}
        onClose={() => setShowConsultationModal(false)}
        quoteData={{
          capacity: totalEnergyMWh,
          power: storageSizeMW,
          duration: durationHours,
          solar: solarMW,
          wind: windMW,
          generator: generatorMW,
          location,
          industry: industryTemplate,
          totalCost: totalProjectCost,
          installationOption: selectedInstallation,
          shippingOption: selectedShipping,
          financingOption: selectedFinancing,
          annualSavings,
          paybackYears
        }}
      />
    </div>
  );
};

export default Step4_QuoteSummary;
