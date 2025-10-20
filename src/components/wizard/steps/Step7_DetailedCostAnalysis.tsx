import React from 'react';
import { UTILITY_RATES, calculateEnergySavings, calculateAnnualFuelCost, calculateROITimeline, findPaybackYear } from '../../../utils/energyCalculations';

interface Step7_DetailedCostAnalysisProps {
  bessPowerMW: number;
  solarMW: number;
  windMW: number;
  generatorMW: number;
  generatorFuelType: string;
  selectedEquipment: string[];
  duration: number;
  pcsIncluded: boolean;
  projectLocation: string;
  tariffRegion: string;
  costs: {
    batterySystem: number;
    pcs: number;
    transformers: number;
    inverters: number;
    switchgear: number;
    microgridControls: number;
    solar: number;
    solarInverters: number;
    wind: number;
    windConverters: number;
    generator: number;
    generatorControls: number;
    bos: number;
    epc: number;
    tariffs: number;
    shipping: number;
    grandTotal: number;
  };
}

const Step7_DetailedCostAnalysis: React.FC<Step7_DetailedCostAnalysisProps> = ({
  bessPowerMW,
  solarMW,
  windMW,
  generatorMW,
  generatorFuelType,
  selectedEquipment,
  duration,
  pcsIncluded,
  projectLocation,
  tariffRegion,
  costs,
}) => {
  const batteryMWh = bessPowerMW * duration;
  const utilityRates = UTILITY_RATES[projectLocation] || UTILITY_RATES['Other'];
  
  // Calculate annual energy savings from BESS
  const annualEnergySavings = calculateEnergySavings(batteryMWh, 1, projectLocation);
  
  // Calculate annual fuel costs for generators
  const annualFuelCosts = generatorMW > 0 && generatorFuelType
    ? calculateAnnualFuelCost(
        generatorMW,
        generatorFuelType as 'diesel' | 'natural-gas',
        500, // Estimated 500 hours/year runtime
        projectLocation
      )
    : 0;
  
  // Calculate ROI timeline
  const roiTimeline = calculateROITimeline(costs.grandTotal, annualEnergySavings, annualFuelCosts, 20);
  const paybackYear = findPaybackYear(roiTimeline);
  
  // Equipment subtotal (before BoS, EPC, tariffs, shipping)
  const equipmentSubtotal = costs.grandTotal - costs.bos - costs.epc - costs.tariffs - costs.shipping;
  
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
          Detailed Cost Analysis & ROI
        </h2>
        <p className="text-gray-400 text-lg">
          Complete financial breakdown and return on investment projections
        </p>
      </div>

      {/* Cost Summary Card */}
      <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 p-6 rounded-2xl border border-green-500/30">
        <div className="text-center mb-6">
          <p className="text-green-300 text-sm font-semibold mb-2">TOTAL PROJECT COST</p>
          <p className="text-5xl font-bold text-green-400">
            ${costs.grandTotal.toLocaleString()}
          </p>
          <p className="text-gray-400 text-sm mt-2">Including all equipment, installation, tariffs & shipping</p>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-gray-800/50 p-4 rounded-xl">
            <p className="text-gray-400 text-sm">Cost per kW</p>
            <p className="text-2xl font-bold text-blue-400">
              ${(costs.grandTotal / (bessPowerMW * 1000)).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className="bg-gray-800/50 p-4 rounded-xl">
            <p className="text-gray-400 text-sm">Cost per kWh</p>
            <p className="text-2xl font-bold text-purple-400">
              ${(costs.grandTotal / (batteryMWh * 1000)).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className="bg-gray-800/50 p-4 rounded-xl">
            <p className="text-gray-400 text-sm">Payback Period</p>
            <p className="text-2xl font-bold text-green-400">
              {paybackYear} years
            </p>
          </div>
        </div>
      </div>

      {/* Detailed Cost Breakdown */}
      <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-6 rounded-2xl border border-gray-700/50">
        <h3 className="text-xl font-bold text-gray-200 mb-4">💰 Equipment & Installation Costs</h3>
        
        <div className="space-y-3">
          {/* BESS Components */}
          <div className="flex justify-between items-center p-3 bg-blue-900/20 rounded-lg border border-blue-500/20">
            <div>
              <p className="font-semibold text-white">Battery System ({batteryMWh.toFixed(1)} MWh)</p>
              <p className="text-sm text-gray-400">LFP Chemistry, {bessPowerMW >= 5 ? '$120/kWh' : '$140/kWh'}</p>
            </div>
            <p className="text-lg font-bold text-blue-400">${costs.batterySystem.toLocaleString()}</p>
          </div>

          {!pcsIncluded && costs.pcs > 0 && (
            <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
              <div>
                <p className="font-semibold text-white">Power Conversion System (PCS)</p>
                <p className="text-sm text-gray-400">{bessPowerMW} MW Bi-directional</p>
              </div>
              <p className="text-lg font-bold text-gray-300">${costs.pcs.toLocaleString()}</p>
            </div>
          )}

          <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
            <div>
              <p className="font-semibold text-white">Transformers & Switchgear</p>
              <p className="text-sm text-gray-400">{bessPowerMW} MW capacity</p>
            </div>
            <p className="text-lg font-bold text-gray-300">${(costs.transformers + costs.switchgear).toLocaleString()}</p>
          </div>

          <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
            <div>
              <p className="font-semibold text-white">Inverters & Controls</p>
              <p className="text-sm text-gray-400">Grid integration equipment</p>
            </div>
            <p className="text-lg font-bold text-gray-300">${(costs.inverters + costs.microgridControls).toLocaleString()}</p>
          </div>

          {/* Renewable Energy */}
          {solarMW > 0 && (
            <div className="flex justify-between items-center p-3 bg-yellow-900/20 rounded-lg border border-yellow-500/20">
              <div>
                <p className="font-semibold text-white">Solar Array ({solarMW} MW)</p>
                <p className="text-sm text-gray-400">Panels + Inverters</p>
              </div>
              <p className="text-lg font-bold text-yellow-400">${(costs.solar + costs.solarInverters).toLocaleString()}</p>
            </div>
          )}

          {windMW > 0 && (
            <div className="flex justify-between items-center p-3 bg-cyan-900/20 rounded-lg border border-cyan-500/20">
              <div>
                <p className="font-semibold text-white">Wind Turbines ({windMW} MW)</p>
                <p className="text-sm text-gray-400">Turbines + Converters</p>
              </div>
              <p className="text-lg font-bold text-cyan-400">${(costs.wind + costs.windConverters).toLocaleString()}</p>
            </div>
          )}

          {generatorMW > 0 && (
            <div className="flex justify-between items-center p-3 bg-orange-900/20 rounded-lg border border-orange-500/20">
              <div>
                <p className="font-semibold text-white">Backup Generator ({generatorMW} MW)</p>
                <p className="text-sm text-gray-400">{generatorFuelType === 'diesel' ? 'Diesel' : 'Natural Gas'} powered</p>
              </div>
              <p className="text-lg font-bold text-orange-400">${(costs.generator + costs.generatorControls).toLocaleString()}</p>
            </div>
          )}

          {/* Subtotal */}
          <div className="flex justify-between items-center p-3 bg-purple-900/20 rounded-lg border border-purple-500/30 mt-2">
            <p className="font-bold text-white">EQUIPMENT SUBTOTAL</p>
            <p className="text-xl font-bold text-purple-400">${equipmentSubtotal.toLocaleString()}</p>
          </div>

          {/* BoS, EPC, Tariffs, Shipping */}
          <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
            <div>
              <p className="font-semibold text-white">Balance of System (BoS)</p>
              <p className="text-sm text-gray-400">12% - Cabling, enclosures, protection</p>
            </div>
            <p className="text-lg font-bold text-gray-300">${costs.bos.toLocaleString()}</p>
          </div>

          <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
            <div>
              <p className="font-semibold text-white">EPC Services</p>
              <p className="text-sm text-gray-400">15% - Engineering, procurement, construction</p>
            </div>
            <p className="text-lg font-bold text-gray-300">${costs.epc.toLocaleString()}</p>
          </div>

          <div className="flex justify-between items-center p-3 bg-red-900/20 rounded-lg border border-red-500/20">
            <div>
              <p className="font-semibold text-white">Import Tariffs & Duties</p>
              <p className="text-sm text-gray-400">{tariffRegion} region</p>
            </div>
            <p className="text-lg font-bold text-red-400">${costs.tariffs.toLocaleString()}</p>
          </div>

          <div className="flex justify-between items-center p-3 bg-blue-900/20 rounded-lg border border-blue-500/20">
            <div>
              <p className="font-semibold text-white">Shipping & Logistics</p>
              <p className="text-sm text-gray-400">To {projectLocation}</p>
            </div>
            <p className="text-lg font-bold text-blue-400">${costs.shipping.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* ROI Analysis */}
      <div className="bg-gradient-to-br from-green-900/20 to-blue-900/20 p-6 rounded-2xl border border-green-500/30">
        <h3 className="text-xl font-bold text-green-300 mb-4">📈 Return on Investment Analysis</h3>
        
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="bg-gray-800/50 p-5 rounded-xl">
            <p className="text-gray-400 text-sm mb-2">Annual Energy Savings</p>
            <p className="text-3xl font-bold text-green-400">${annualEnergySavings.toLocaleString()}</p>
            <p className="text-sm text-gray-500 mt-2">Based on {projectLocation} utility rates</p>
            <div className="mt-3 text-xs text-gray-400 space-y-1">
              <p>• Peak rate: ${utilityRates.peakRateKWh}/kWh</p>
              <p>• Off-peak rate: ${utilityRates.offPeakRateKWh}/kWh</p>
              <p>• Demand charge: ${utilityRates.demandChargeKW}/kW/month</p>
            </div>
          </div>

          {annualFuelCosts > 0 && (
            <div className="bg-gray-800/50 p-5 rounded-xl border border-orange-500/30">
              <p className="text-gray-400 text-sm mb-2">Annual Fuel Costs</p>
              <p className="text-3xl font-bold text-orange-400">-${annualFuelCosts.toLocaleString()}</p>
              <p className="text-sm text-gray-500 mt-2">Generator operating costs ({generatorFuelType})</p>
              <div className="mt-3 text-xs text-gray-400 space-y-1">
                <p>• Fuel price: ${generatorFuelType === 'diesel' ? utilityRates.dieselPriceGallon + '/gal' : utilityRates.naturalGasPriceTherm + '/therm'}</p>
                <p>• Est. runtime: 500 hours/year</p>
              </div>
            </div>
          )}

          <div className="bg-gray-800/50 p-5 rounded-xl">
            <p className="text-gray-400 text-sm mb-2">Net Annual Benefit</p>
            <p className="text-3xl font-bold text-blue-400">${(annualEnergySavings - annualFuelCosts).toLocaleString()}</p>
            <p className="text-sm text-gray-500 mt-2">Savings minus operating costs</p>
          </div>

          <div className="bg-green-900/30 p-5 rounded-xl border border-green-500/50">
            <p className="text-gray-300 text-sm mb-2">Payback Period</p>
            <p className="text-3xl font-bold text-green-400">{paybackYear} years</p>
            <p className="text-sm text-gray-500 mt-2">Time to recover investment</p>
            <p className="text-xs text-green-300 mt-3">ROI after 10 years: {roiTimeline[9]?.roiPercent.toFixed(0)}%</p>
          </div>
        </div>

        {/* 20-Year Timeline Preview */}
        <div className="bg-gray-800/30 p-5 rounded-xl">
          <p className="text-gray-300 font-semibold mb-3">20-Year Financial Projection</p>
          <div className="grid grid-cols-4 gap-3 text-sm">
            <div className="bg-blue-900/30 p-3 rounded-lg">
              <p className="text-gray-400 text-xs">Year 5</p>
              <p className="text-white font-bold">${roiTimeline[4]?.cumulativeSavings.toLocaleString()}</p>
              <p className="text-xs text-gray-500">saved</p>
            </div>
            <div className="bg-green-900/30 p-3 rounded-lg">
              <p className="text-gray-400 text-xs">Year 10</p>
              <p className="text-green-400 font-bold">${roiTimeline[9]?.cumulativeSavings.toLocaleString()}</p>
              <p className="text-xs text-gray-500">saved</p>
            </div>
            <div className="bg-emerald-900/30 p-3 rounded-lg">
              <p className="text-gray-400 text-xs">Year 15</p>
              <p className="text-emerald-400 font-bold">${roiTimeline[14]?.cumulativeSavings.toLocaleString()}</p>
              <p className="text-xs text-gray-500">saved</p>
            </div>
            <div className="bg-cyan-900/30 p-3 rounded-lg">
              <p className="text-gray-400 text-xs">Year 20</p>
              <p className="text-cyan-400 font-bold">${roiTimeline[19]?.cumulativeSavings.toLocaleString()}</p>
              <p className="text-xs text-gray-500">saved</p>
            </div>
          </div>
        </div>
      </div>

      {/* Configuration Recommendations */}
      {paybackYear > 7 && (
        <div className="bg-yellow-900/20 p-6 rounded-xl border border-yellow-500/30">
          <div className="flex items-start space-x-4">
            <span className="text-4xl">⚠️</span>
            <div className="flex-1">
              <h4 className="font-bold text-yellow-300 text-lg mb-2">Long Payback Period Detected</h4>
              <p className="text-gray-300 mb-3">
                Your current configuration has a {paybackYear}-year payback period. Consider these optimizations:
              </p>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>• <strong className="text-yellow-200">Reduce system size:</strong> Smaller capacity = lower upfront cost, faster payback</li>
                <li>• <strong className="text-yellow-200">Increase utilization:</strong> More daily cycles = higher annual savings</li>
                {generatorMW > 0 && (
                  <li>• <strong className="text-yellow-200">Reduce generator size:</strong> Lower fuel costs improve ROI</li>
                )}
                {solarMW === 0 && (
                  <li>• <strong className="text-yellow-200">Add solar:</strong> Self-generation reduces grid costs</li>
                )}
                <li>• <strong className="text-yellow-200">Review utility rates:</strong> Ensure peak shaving is optimized</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Step7_DetailedCostAnalysis;
