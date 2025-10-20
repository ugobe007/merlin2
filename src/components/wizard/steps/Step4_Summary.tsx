

import React from 'react';
import { UTILITY_RATES } from '../../../utils/energyCalculations';

interface Step4Props {
    power: number;
    duration: number;
    gridConnection: string;
    selectedEquipment: string[];
    budget: number;
    warranty: string;
    primaryApplication: string;
    solarMW: number;
    windMW: number;
    generatorMW: number;
    pcsIncluded: boolean;
    projectLocation: string;
    generatorFuelType: string;
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
      annualSavings: number;
      paybackPeriod: number;
    };
}

const Step4_Summary: React.FC<Step4Props> = ({
    power,
    duration,
    gridConnection,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    selectedEquipment,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    budget,
    warranty,
    primaryApplication,
    solarMW,
    windMW,
    generatorMW,
    pcsIncluded,
    projectLocation,
    generatorFuelType,
    costs,
}) => {
  const batteryMWh = power * duration;
  
  // Calculate ROI based on utility cost savings only (not fuel costs)
  const utilityRates = UTILITY_RATES[projectLocation] || UTILITY_RATES['United States'];
  
  // Simple utility savings calculation
  const dailyEnergyKWh = batteryMWh * 1000 * 1; // 1 cycle per day
  const annualEnergyKWh = dailyEnergyKWh * 365;
  
  // Peak shaving: charge during off-peak, discharge during peak
  const peakShavingSavings = annualEnergyKWh * 0.7 * (utilityRates.peakRateKWh - utilityRates.offPeakRateKWh);
  
  // Demand charge reduction: reduce peak demand
  const demandChargeSavings = (power * 1000) * utilityRates.demandChargeKW * 12;
  
  // Total annual savings (utility only)
  const annualSavings = peakShavingSavings + demandChargeSavings;
  
  // Simple payback calculation
  const simplePaybackYears = annualSavings > 0 ? costs.grandTotal / annualSavings : 999;
  
  // 10-year ROI calculation
  const tenYearSavings = annualSavings * 10;
  const tenYearROI = costs.grandTotal > 0 ? ((tenYearSavings - costs.grandTotal) / costs.grandTotal) * 100 : 0;
  
  const applicationNames: { [key: string]: string } = {
    'ev-charging': 'EV Charging',
    'data-center': 'Data Center',
    'manufacturing': 'Manufacturing',
    'industrial-backup': 'Industrial Backup',
    'grid-stabilization': 'Grid Stabilization',
    'renewable-integration': 'Renewable Integration',
    'peak-shaving': 'Peak Shaving',
    'commercial': 'Commercial',
    'utility': 'Utility Scale',
    'resiliency': 'Resiliency',
    'other': 'Other',
  };

  return (
    <div className="p-4 text-white">
      <div className="text-center mb-6 flex flex-col items-center">
        <video 
          src="/Merlin_video1.mp4" 
          autoPlay
          loop
          muted
          playsInline
          className="w-48 h-48 object-contain mb-4 drop-shadow-[0_0_20px_rgba(192,132,252,0.6)] rounded-2xl"
        />
        <h2 className="text-3xl font-bold text-white mb-2">🎉 Configuration Complete!</h2>
        <p className="text-purple-200">Here's your comprehensive BESS system summary</p>
      </div>

      {/* ROI Summary - Prominent Display */}
      <div className="bg-gradient-to-br from-green-600/30 to-emerald-600/30 p-8 rounded-2xl border-2 border-green-400/50 mb-6 shadow-2xl">
        <h3 className="text-2xl font-bold text-green-300 mb-6 text-center">� Financial Summary</h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-green-900/40 p-6 rounded-xl border border-green-500/30 text-center">
            <p className="text-green-300 text-sm font-semibold mb-2 uppercase tracking-wide">Total Investment</p>
            <p className="text-white font-bold text-4xl">${costs.grandTotal.toLocaleString()}</p>
            <p className="text-green-200 text-xs mt-2">Including all equipment, BoS, EPC, tariffs & shipping</p>
          </div>
          <div className="bg-green-900/40 p-6 rounded-xl border border-green-500/30 text-center">
            <p className="text-green-300 text-sm font-semibold mb-2 uppercase tracking-wide">💰 Annual Savings</p>
            <p className="text-green-400 font-bold text-4xl">${Math.round(annualSavings).toLocaleString()}</p>
            <p className="text-green-200 text-xs mt-2">${Math.round(peakShavingSavings).toLocaleString()} peak + ${Math.round(demandChargeSavings).toLocaleString()} demand</p>
          </div>
          <div className="bg-green-900/40 p-6 rounded-xl border border-green-500/30 text-center">
            <p className="text-green-300 text-sm font-semibold mb-2 uppercase tracking-wide">ROI Period</p>
            <p className="text-green-400 font-bold text-4xl">
              {simplePaybackYears < 100 ? simplePaybackYears.toFixed(1) : '∞'} <span className="text-2xl">years</span>
            </p>
            <p className="text-green-200 text-xs mt-2">10-year ROI: {tenYearROI.toFixed(0)}%</p>
          </div>
        </div>
        <div className="mt-6 p-4 bg-blue-900/30 rounded-lg border border-blue-500/30">
          <div className="flex items-start space-x-3">
            <span className="text-2xl">💡</span>
            <div className="flex-1 text-sm">
              <p className="text-blue-200 font-semibold mb-1">Savings Calculation</p>
              <p className="text-gray-300">
                Based on {projectLocation} utility rates: Peak ${utilityRates.peakRateKWh.toFixed(3)}/kWh, 
                Off-peak ${utilityRates.offPeakRateKWh.toFixed(3)}/kWh, 
                Demand ${utilityRates.demandChargeKW.toFixed(2)}/kW/month
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* System Configuration */}
      <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/30 p-6 rounded-xl border border-blue-500/30 mb-4">
        <h3 className="text-xl font-bold text-blue-300 mb-4">🔋 Energy Storage System</h3>
        <div className="space-y-2 text-lg">
          <div className="flex justify-between">
            <span className="text-blue-200">BESS Power:</span>
            <span className="text-white font-bold">{power} MW</span>
          </div>
          <div className="flex justify-between">
            <span className="text-blue-200">Storage Capacity:</span>
            <span className="text-white font-bold">{batteryMWh.toFixed(1)} MWh</span>
          </div>
          <div className="flex justify-between">
            <span className="text-blue-200">PCS Included:</span>
            <span className="text-white font-bold">{pcsIncluded ? 'Yes' : 'No'}</span>
          </div>
          <div className="flex justify-between border-t border-blue-500/30 pt-2 mt-2">
            <span className="text-blue-300 font-semibold">BESS Cost:</span>
            <span className="text-white font-bold text-xl">${costs.batterySystem.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Renewable Energy */}
      {(solarMW > 0 || windMW > 0 || generatorMW > 0) && (
        <div className="bg-gradient-to-br from-green-900/30 to-emerald-800/30 p-6 rounded-xl border border-green-500/30 mb-4">
          <h3 className="text-xl font-bold text-green-300 mb-4">⚡ Alternative Energy Sources</h3>
          <div className="space-y-2 text-lg">
            {solarMW > 0 && (
              <>
                <div className="flex justify-between">
                  <span className="text-yellow-200">☀️ Solar Capacity:</span>
                  <span className="text-white font-bold">{solarMW} MW</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-yellow-200">Solar Cost:</span>
                  <span className="text-white font-bold">${costs.solar.toLocaleString()}</span>
                </div>
              </>
            )}
            {windMW > 0 && (
              <>
                <div className="flex justify-between">
                  <span className="text-cyan-200">💨 Wind Capacity:</span>
                  <span className="text-white font-bold">{windMW} MW</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cyan-200">Wind Cost:</span>
                  <span className="text-white font-bold">${costs.wind.toLocaleString()}</span>
                </div>
              </>
            )}
            {generatorMW > 0 && (
              <>
                <div className="flex justify-between">
                  <span className="text-red-200">🔥 Generator Capacity:</span>
                  <span className="text-white font-bold">{generatorMW} MW ({generatorFuelType})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-red-200">Generator Cost:</span>
                  <span className="text-white font-bold">${costs.generator.toLocaleString()}</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Total Cost Breakdown */}
      <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/30 p-6 rounded-xl border-2 border-purple-500/40 mb-4">
        <h3 className="text-xl font-bold text-purple-300 mb-4">💰 Total Project Cost</h3>
        <div className="space-y-2">
          <div className="flex justify-between text-lg">
            <span className="text-purple-200">Equipment Subtotal:</span>
            <span className="text-white font-bold">${(costs.batterySystem + costs.solar + costs.wind + costs.generator).toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-purple-200">Balance of System (12%):</span>
            <span className="text-white">${costs.bos.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-purple-200">EPC & Installation (15%):</span>
            <span className="text-white">${costs.epc.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-orange-200">Import Tariffs:</span>
            <span className="text-white">${costs.tariffs.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-cyan-200">Shipping & Logistics:</span>
            <span className="text-white">${costs.shipping.toLocaleString()}</span>
          </div>
          <div className="flex justify-between border-t-2 border-purple-500/50 pt-3 mt-3">
            <span className="text-purple-300 font-bold text-xl">GRAND TOTAL:</span>
            <span className="text-white font-bold text-2xl">${costs.grandTotal.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Additional Details */}
      <div className="bg-gradient-to-br from-gray-800/30 to-gray-900/30 p-6 rounded-xl border border-gray-600/30">
        <h3 className="text-xl font-bold text-gray-300 mb-4">📝 Project Details</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-gray-400">Grid Connection:</p>
            <p className="text-white font-semibold">{gridConnection === 'behind' ? 'Behind the meter' : 'Front of meter'}</p>
          </div>
          <div>
            <p className="text-gray-400">Primary Application:</p>
            <p className="text-white font-semibold">{applicationNames[primaryApplication]}</p>
          </div>
          <div>
            <p className="text-gray-400">Warranty:</p>
            <p className="text-white font-semibold">{warranty} years</p>
          </div>
          <div>
            <p className="text-gray-400">Location:</p>
            <p className="text-white font-semibold">United States</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step4_Summary;
