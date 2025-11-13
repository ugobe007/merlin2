import React from 'react';
import { X, FileText, Zap, Battery, Sun, Wind, DollarSign, TrendingUp, MapPin } from 'lucide-react';
import { formatCurrency } from '../../utils/equipmentCalculations';
import { formatSolarCapacity } from '../../utils/solarSizingUtils';
import { formatPower } from '../../utils/powerFormatting';

interface SimpleVirtualQuoteViewerProps {
  isOpen: boolean;
  onClose: () => void;
  quoteData: {
    // System Configuration
    storageSizeMW: number;
    durationHours: number;
    solarMW: number;
    windMW: number;
    generatorMW: number;
    
    // Component Configs
    solarSpaceConfig?: {
      spaceType: 'rooftop' | 'ground' | 'canopy' | 'mixed';
      rooftopSqFt?: number;
      groundAcres?: number;
      useAI: boolean;
    };
    evChargerConfig?: {
      level2_11kw: number;
      level2_19kw: number;
      dcfast_50kw: number;
      dcfast_150kw: number;
      dcfast_350kw: number;
    };
    windConfig?: {
      turbineSize: '2.5' | '3.0' | '5.0';
      numberOfTurbines: number;
      useAI: boolean;
    };
    generatorConfig?: {
      generatorType: 'diesel' | 'natural-gas' | 'dual-fuel';
      numberOfUnits: number;
      sizePerUnit: number;
      useAI: boolean;
    };
    
    // Location & Industry
    location: string;
    industryTemplate: string | string[];
    
    // Financials
    equipmentCost: number;
    installationCost: number;
    shippingCost: number;
    tariffCost: number;
    totalProjectCost: number;
    taxCredit30Percent: number;
    netCostAfterTaxCredit: number;
    annualSavings: number;
    paybackYears: number;
  };
}

const SimpleVirtualQuoteViewer: React.FC<SimpleVirtualQuoteViewerProps> = ({
  isOpen,
  onClose,
  quoteData
}) => {
  if (!isOpen) return null;

  const totalPowerMW = quoteData.storageSizeMW + 
    (quoteData.solarMW || 0) + 
    (quoteData.windMW || 0) + 
    (quoteData.generatorMW || 0);
  
  const totalEnergyMWh = quoteData.storageSizeMW * quoteData.durationHours;
  
  const hasRenewables = quoteData.solarMW > 0 || quoteData.windMW > 0 || quoteData.generatorMW > 0;

  const totalEVChargers = quoteData.evChargerConfig 
    ? Object.values(quoteData.evChargerConfig).reduce((sum, count) => sum + count, 0)
    : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6 rounded-t-2xl flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8" />
            <div>
              <h2 className="text-2xl font-bold">Virtual Quote Document</h2>
              <p className="text-blue-100 text-sm">Complete configuration overview</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          {/* System Overview */}
          <section className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-300">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Zap className="w-6 h-6 text-blue-600" />
              System Overview
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-4 shadow">
                <div className="text-sm text-gray-600 mb-1">Total Power Output</div>
                <div className="text-3xl font-bold text-blue-600">
                  {formatPower(totalPowerMW)}
                </div>
                <div className="text-xs text-white mt-1">
                  {formatPower(quoteData.storageSizeMW)} battery
                  {quoteData.solarMW > 0 && ` + ${formatPower(quoteData.solarMW)} solar`}
                  {quoteData.windMW > 0 && ` + ${formatPower(quoteData.windMW)} wind`}
                  {quoteData.generatorMW > 0 && ` + ${formatPower(quoteData.generatorMW)} generator`}
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-4 shadow">
                <div className="text-sm text-gray-600 mb-1">Total Storage</div>
                <div className="text-3xl font-bold text-green-600">
                  {totalEnergyMWh.toFixed(2)} MWh
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {quoteData.durationHours} hours duration
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-4 shadow">
                <div className="text-sm text-gray-600 mb-1">Location</div>
                <div className="text-2xl font-bold text-purple-600 flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  {quoteData.location}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {Array.isArray(quoteData.industryTemplate) 
                    ? quoteData.industryTemplate.join(', ') 
                    : quoteData.industryTemplate}
                </div>
              </div>
            </div>
          </section>

          {/* Battery Storage Detail */}
          <section className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Battery className="w-5 h-5 text-blue-600" />
              Battery Storage System
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-4">
                <div className="text-sm text-gray-600">Power Capacity</div>
                <div className="text-2xl font-bold text-gray-800">
                  {formatPower(quoteData.storageSizeMW)}
                </div>
              </div>
              <div className="bg-white rounded-lg p-4">
                <div className="text-sm text-gray-600">Energy Capacity</div>
                <div className="text-2xl font-bold text-gray-800">
                  {totalEnergyMWh.toFixed(2)} MWh
                </div>
              </div>
            </div>
          </section>

          {/* Renewable Energy (if applicable) */}
          {hasRenewables && (
            <section className="bg-green-50 rounded-xl p-6 border border-green-200">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Sun className="w-5 h-5 text-green-600" />
                Renewable Energy Integration
              </h3>
              <div className="space-y-3">
                {quoteData.solarMW > 0 && (
                  <div className="bg-white rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-gray-800">☀️ Solar PV System</div>
                        <div className="text-sm text-gray-600">
                          {formatSolarCapacity(quoteData.solarMW)}
                          {quoteData.solarSpaceConfig && (
                            <span className="ml-2">
                              ({quoteData.solarSpaceConfig.spaceType === 'rooftop' ? '🏢 Rooftop' : 
                                quoteData.solarSpaceConfig.spaceType === 'ground' ? '🌱 Ground-Mount' :
                                quoteData.solarSpaceConfig.spaceType === 'canopy' ? '🚗 Canopy' : '🔄 Mixed'})
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-green-600">
                        {formatPower(quoteData.solarMW)}
                      </div>
                    </div>
                  </div>
                )}
                
                {quoteData.windMW > 0 && (
                  <div className="bg-white rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-gray-800">💨 Wind Turbines</div>
                        {quoteData.windConfig && (
                          <div className="text-sm text-gray-600">
                            {Math.ceil(quoteData.windMW / parseFloat(quoteData.windConfig.turbineSize))} × 
                            {quoteData.windConfig.turbineSize}MW turbines
                          </div>
                        )}
                      </div>
                      <div className="text-2xl font-bold text-blue-600">
                        {formatPower(quoteData.windMW)}
                      </div>
                    </div>
                  </div>
                )}
                
                {quoteData.generatorMW > 0 && (
                  <div className="bg-white rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-gray-800">⚡ Backup Generator</div>
                        {quoteData.generatorConfig && (
                          <div className="text-sm text-gray-600">
                            {Math.ceil(quoteData.generatorMW / quoteData.generatorConfig.sizePerUnit)} × 
                            {quoteData.generatorConfig.sizePerUnit}MW {quoteData.generatorConfig.generatorType}
                          </div>
                        )}
                      </div>
                      <div className="text-2xl font-bold text-orange-600">
                        {formatPower(quoteData.generatorMW)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* EV Chargers (if applicable) */}
          {totalEVChargers > 0 && quoteData.evChargerConfig && (
            <section className="bg-purple-50 rounded-xl p-6 border border-purple-200">
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                🔌 EV Charging Infrastructure
              </h3>
              <div className="grid md:grid-cols-2 gap-3">
                {quoteData.evChargerConfig.level2_11kw > 0 && (
                  <div className="bg-white rounded-lg p-3">
                    <div className="text-sm text-gray-600">Level 2 (11kW)</div>
                    <div className="text-xl font-bold">{quoteData.evChargerConfig.level2_11kw} units</div>
                  </div>
                )}
                {quoteData.evChargerConfig.level2_19kw > 0 && (
                  <div className="bg-white rounded-lg p-3">
                    <div className="text-sm text-gray-600">Level 2 (19kW)</div>
                    <div className="text-xl font-bold">{quoteData.evChargerConfig.level2_19kw} units</div>
                  </div>
                )}
                {quoteData.evChargerConfig.dcfast_50kw > 0 && (
                  <div className="bg-white rounded-lg p-3">
                    <div className="text-sm text-gray-600">DC Fast (50kW)</div>
                    <div className="text-xl font-bold">{quoteData.evChargerConfig.dcfast_50kw} units</div>
                  </div>
                )}
                {quoteData.evChargerConfig.dcfast_150kw > 0 && (
                  <div className="bg-white rounded-lg p-3">
                    <div className="text-sm text-gray-600">DC Fast (150kW)</div>
                    <div className="text-xl font-bold">{quoteData.evChargerConfig.dcfast_150kw} units</div>
                  </div>
                )}
                {quoteData.evChargerConfig.dcfast_350kw > 0 && (
                  <div className="bg-white rounded-lg p-3">
                    <div className="text-sm text-gray-600">DC Fast (350kW)</div>
                    <div className="text-xl font-bold">{quoteData.evChargerConfig.dcfast_350kw} units</div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Financial Summary */}
          <section className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-300">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-green-600" />
              Financial Summary
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="bg-white rounded-lg p-4">
                  <div className="text-sm text-gray-600">Total Project Cost</div>
                  <div className="text-3xl font-bold text-gray-800">
                    {formatCurrency(quoteData.totalProjectCost)}
                  </div>
                  <div className="text-xs text-gray-500 mt-2 space-y-1">
                    <div>Equipment: {formatCurrency(quoteData.equipmentCost)}</div>
                    <div>Installation: {formatCurrency(quoteData.installationCost)}</div>
                    <div>Shipping: {formatCurrency(quoteData.shippingCost)}</div>
                    {quoteData.tariffCost > 0 && (
                      <div>Tariffs: {formatCurrency(quoteData.tariffCost)}</div>
                    )}
                  </div>
                </div>
                
                <div className="bg-green-100 rounded-lg p-4 border border-green-300">
                  <div className="text-sm text-gray-700">30% Federal Tax Credit</div>
                  <div className="text-2xl font-bold text-green-700">
                    -{formatCurrency(quoteData.taxCredit30Percent)}
                  </div>
                </div>
                
                <div className="bg-blue-100 rounded-lg p-4 border border-blue-300">
                  <div className="text-sm text-gray-700">Net Cost After Tax Credit</div>
                  <div className="text-2xl font-bold text-blue-700">
                    {formatCurrency(quoteData.netCostAfterTaxCredit)}
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="bg-white rounded-lg p-4">
                  <div className="text-sm text-gray-600 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    Annual Energy Savings
                  </div>
                  <div className="text-3xl font-bold text-green-600">
                    {formatCurrency(quoteData.annualSavings)}<span className="text-lg">/year</span>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg p-4">
                  <div className="text-sm text-gray-600">Simple Payback Period</div>
                  <div className="text-3xl font-bold text-purple-600">
                    {quoteData.paybackYears.toFixed(1)} <span className="text-lg">years</span>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg p-4 border border-green-300">
                  <div className="text-sm text-gray-700">10-Year Savings</div>
                  <div className="text-2xl font-bold text-green-700">
                    {formatCurrency(quoteData.annualSavings * 10)}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    ROI: {((quoteData.annualSavings * 10 / quoteData.netCostAfterTaxCredit) * 100).toFixed(0)}%
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              📄 This is your complete system configuration
            </div>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
            >
              Continue with Quote
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleVirtualQuoteViewer;
