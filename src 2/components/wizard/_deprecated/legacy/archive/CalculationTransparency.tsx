/**
 * Calculation Transparency Component
 * 
 * Provides visibility into battery sizing calculations with:
 * - Explanation of how the size was determined
 * - Links to external validation calculators
 * - Expandable detailed calculation formulas
 */

import React, { useState } from 'react';
import { Calculator, ExternalLink, ChevronDown, ChevronUp, Info } from 'lucide-react';

interface CalculationTransparencyProps {
  storageSizeMW: number;
  durationHours: number;
  industryTemplate?: string;
  peakLoad?: number;
  buildingSize?: string | number;
  calculationMethod?: string;
}

export default function CalculationTransparency({
  storageSizeMW,
  durationHours,
  industryTemplate = 'your facility',
  peakLoad,
  buildingSize,
  calculationMethod = 'AI-recommended sizing based on industry best practices'
}: CalculationTransparencyProps) {
  const [showDetailedCalc, setShowDetailedCalc] = useState(false);
  
  // Calculate derived values
  const totalEnergyMWh = storageSizeMW * durationHours;
  const safetyFactor = 1.2;
  const efficiencyLoss = 0.9;
  
  // External calculator resources
  const calculators = [
    {
      name: 'JCalc Battery Size Calculator',
      url: 'https://www.jcalc.net/battery-size-calculator',
      description: 'Industry-standard calculator for battery bank sizing'
    },
    {
      name: 'Unbound Solar Battery Bank Sizing Guide',
      url: 'https://unboundsolar.com/solar-information/battery-bank-sizing',
      description: 'Comprehensive guide with sizing formulas and examples'
    },
    {
      name: 'Big Battery System Sizing Calculator',
      url: 'https://bigbattery.com/system-sizing-calculator/system-sizing-calculator',
      description: 'Interactive calculator for complete system sizing'
    }
  ];
  
  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6 mt-6 shadow-sm">
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className="bg-blue-500 text-white p-2 rounded-lg">
          <Calculator className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-blue-900 text-lg mb-1">
            How We Calculated {storageSizeMW.toFixed(2)} MW / {durationHours}hr
          </h4>
          <p className="text-sm text-blue-700">
            {calculationMethod}
          </p>
        </div>
      </div>
      
      {/* Calculation Overview */}
      <div className="bg-white/80 rounded-lg p-4 mb-4 border border-blue-100">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-900">{storageSizeMW.toFixed(2)} MW</div>
            <div className="text-xs text-gray-600 mt-1">Power Capacity</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-900">{totalEnergyMWh.toFixed(2)} MWh</div>
            <div className="text-xs text-gray-600 mt-1">Energy Storage</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-900">{durationHours}hr</div>
            <div className="text-xs text-gray-600 mt-1">Backup Duration</div>
          </div>
        </div>
      </div>
      
      {/* Calculation Inputs */}
      <div className="bg-white/60 rounded-lg p-4 mb-4 border border-blue-100">
        <div className="flex items-center gap-2 mb-2">
          <Info className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-semibold text-gray-700">Based on:</span>
        </div>
        <ul className="space-y-1 text-sm text-gray-700 ml-6">
          <li>• <span className="font-medium">Industry:</span> {industryTemplate}</li>
          {peakLoad && <li>• <span className="font-medium">Peak Load:</span> {peakLoad.toFixed(2)} MW</li>}
          {buildingSize && <li>• <span className="font-medium">Facility Size:</span> {typeof buildingSize === 'number' ? `${buildingSize.toLocaleString()} sq ft` : buildingSize}</li>}
          <li>• <span className="font-medium">Backup Duration:</span> {durationHours} hours</li>
          <li>• <span className="font-medium">Safety Factor:</span> 1.2x (20% buffer for unexpected loads)</li>
          <li>• <span className="font-medium">Round-trip Efficiency:</span> ~90% (typical lithium-ion)</li>
        </ul>
      </div>
      
      {/* Verify with External Calculators */}
      <div className="mb-4">
        <h5 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <ExternalLink className="w-4 h-4" />
          Verify with Industry-Standard Calculators:
        </h5>
        <div className="space-y-2">
          {calculators.map((calc, idx) => (
            <a
              key={idx}
              href={calc.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-3 p-3 bg-white/80 hover:bg-white rounded-lg border border-blue-100 hover:border-blue-300 transition-all group"
            >
              <ExternalLink className="w-4 h-4 text-blue-500 mt-0.5 group-hover:text-blue-700" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-blue-700 group-hover:text-blue-900 group-hover:underline">
                  {calc.name}
                </div>
                <div className="text-xs text-gray-600 mt-0.5">
                  {calc.description}
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
      
      {/* Detailed Calculation (Expandable) */}
      <div className="border-t border-blue-200 pt-4">
        <button
          onClick={() => setShowDetailedCalc(!showDetailedCalc)}
          className="flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-900 transition-colors"
        >
          {showDetailedCalc ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
          {showDetailedCalc ? 'Hide' : 'Show'} detailed calculation formulas
        </button>
        
        {showDetailedCalc && (
          <div className="mt-3 p-4 bg-white rounded-lg border border-blue-200 font-mono text-xs space-y-3">
            <div>
              <div className="text-gray-600 mb-1">Step 1: Calculate Required Power</div>
              <div className="bg-gray-50 p-2 rounded border border-gray-200">
                <div className="text-blue-900">Power (MW) = Peak Load × Safety Factor × Efficiency Loss</div>
                <div className="text-gray-700 mt-1">
                  {storageSizeMW.toFixed(2)} MW = {peakLoad?.toFixed(2) || 'Estimated'} MW × {safetyFactor} × {efficiencyLoss}
                </div>
              </div>
            </div>
            
            <div>
              <div className="text-gray-600 mb-1">Step 2: Calculate Energy Storage Required</div>
              <div className="bg-gray-50 p-2 rounded border border-gray-200">
                <div className="text-blue-900">Energy (MWh) = Power (MW) × Duration (hours)</div>
                <div className="text-gray-700 mt-1">
                  {totalEnergyMWh.toFixed(2)} MWh = {storageSizeMW.toFixed(2)} MW × {durationHours} hours
                </div>
              </div>
            </div>
            
            <div>
              <div className="text-gray-600 mb-1">Step 3: Account for Depth of Discharge (DoD)</div>
              <div className="bg-gray-50 p-2 rounded border border-gray-200">
                <div className="text-blue-900">Actual Battery Size = Energy / Typical DoD (0.8-0.9)</div>
                <div className="text-gray-700 mt-1">
                  This ensures battery longevity by not fully depleting cells
                </div>
              </div>
            </div>
            
            <div className="pt-2 border-t border-gray-200 text-gray-600">
              <strong>Note:</strong> Actual sizing also considers:
              <ul className="list-disc list-inside mt-1 space-y-0.5 ml-2">
                <li>Temperature derating (cold weather reduces capacity 10-20%)</li>
                <li>Inverter efficiency losses (~5-8%)</li>
                <li>Cycle life optimization (shallower discharges = longer life)</li>
                <li>Future load growth projections</li>
                <li>Grid service requirements (frequency regulation, demand response)</li>
              </ul>
            </div>
          </div>
        )}
      </div>
      
      {/* Disclaimer */}
      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-yellow-700 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-yellow-800">
            <strong>Important:</strong> This is a preliminary sizing estimate. Final system design requires detailed 
            electrical load analysis, site assessment, and engineering review. We recommend validating this sizing 
            with the external calculators above or consulting with a certified energy storage system integrator.
          </p>
        </div>
      </div>
    </div>
  );
}
