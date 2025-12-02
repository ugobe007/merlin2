/**
 * NEW Step 6: Preliminary Quote
 * Equipment list, cost breakdown, ROI calculations
 */

import React, { useState } from 'react';
import { Battery, Zap, DollarSign, TrendingUp, Calendar, Percent, Sun, Wind, Car } from 'lucide-react';
import RequestQuoteModal from '../../modals/RequestQuoteModal';

interface Step6Props {
  // Core specs
  storageSizeMW: number;
  durationHours: number;
  energyCapacity: number;
  
  // Extras
  solarMW?: number;
  windMW?: number;
  generatorMW?: number;
  evChargerCount?: number;
  
  // Equipment breakdown
  equipmentBreakdown?: any;
  
  // Financials (from centralizedCalculations - SINGLE SOURCE OF TRUTH)
  equipmentCost?: number;
  installationCost?: number;
  annualSavings?: number;
  paybackYears?: number;
  roi10Year?: number;
  roi25Year?: number;
  npv?: number;
  irr?: number;
  taxCredit?: number;   // From centralizedCalculations.taxCredit
  netCost?: number;     // From centralizedCalculations.netCost
  
  // Context
  selectedTemplate?: any;
  location?: string;
  
  // Navigation
  onNext: () => void;
  onBack: () => void;
}

const Step6_PreliminaryQuote: React.FC<Step6Props> = ({
  storageSizeMW,
  durationHours,
  energyCapacity,
  solarMW = 0,
  windMW = 0,
  generatorMW = 0,
  evChargerCount = 0,
  equipmentBreakdown,
  equipmentCost = 0,
  installationCost = 0,
  annualSavings = 0,
  paybackYears = 0,
  roi10Year = 0,
  roi25Year = 0,
  npv = 0,
  irr = 0,
  taxCredit: taxCreditProp,     // From centralizedCalculations
  netCost: netCostProp,         // From centralizedCalculations
  selectedTemplate,
  location,
  onNext,
  onBack
}) => {
  // Modal state
  const [showRequestQuoteModal, setShowRequestQuoteModal] = useState(false);
  
  // Calculate category totals from equipment breakdown
  const batteryCost = equipmentBreakdown?.batteries?.totalCost || 0;
  const inverterCost = equipmentBreakdown?.inverters?.totalCost || 0;
  const transformerCost = (equipmentBreakdown?.transformers?.totalCost || 0) + (equipmentBreakdown?.switchgear?.totalCost || 0);
  
  // Category 1: Core BESS (Batteries + Power Electronics)
  const coreBessEquipment = batteryCost + inverterCost + transformerCost;
  
  // Category 1b: Power Generation (Solar, Wind, Generators)
  const solarCost = equipmentBreakdown?.solar?.totalCost || 0;
  const windCost = equipmentBreakdown?.wind?.totalCost || 0;
  const generatorCost = equipmentBreakdown?.generators?.totalCost || 0;
  const evChargerCost = equipmentBreakdown?.evChargers?.totalChargingCost || 0;
  const powerGenerationEquipment = solarCost + windCost + generatorCost + evChargerCost;
  
  // Category 2: Installation & Services
  const installationServices = equipmentBreakdown?.installation?.totalInstallation || installationCost || 0;
  
  // Total Equipment Cost (Category 1)
  const totalEquipmentCost = coreBessEquipment + powerGenerationEquipment;
  
  // Total Project Cost (Turnkey)
  const totalProjectCost = equipmentBreakdown?.totals?.totalProjectCost || (totalEquipmentCost + installationServices);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // USE CENTRALIZED CALCULATIONS (SINGLE SOURCE OF TRUTH)
  // Tax credit and net cost come from centralizedCalculations.ts
  // The 30% ITC rate is defined in the database calculation_constants table
  // ═══════════════════════════════════════════════════════════════════════════
  const federalTaxCredit = taxCreditProp ?? (totalProjectCost * 0.30); // Fallback if prop not passed
  const netCost = netCostProp ?? (totalProjectCost - federalTaxCredit);

  const handleNext = () => {
    // Auto-scroll to bottom before proceeding
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    setTimeout(onNext, 300);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex justify-center items-center gap-3 mb-4">
          <DollarSign className="w-12 h-12 text-green-600" />
          <div>
            <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-600">
              Preliminary Quote
            </h2>
            <p className="text-gray-600 mt-2">
              Equipment costs and financial projections
            </p>
          </div>
        </div>
      </div>

      {/* System Summary Card */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-300 rounded-2xl p-6">
        <h3 className="font-bold text-gray-900 mb-4 text-xl">Your System</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600">Power</p>
            <p className="text-2xl font-bold text-blue-600">{(storageSizeMW || 0).toFixed(2)} MW</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Duration</p>
            <p className="text-2xl font-bold text-purple-600">{(durationHours || 0).toFixed(1)} hrs</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Energy</p>
            <p className="text-2xl font-bold text-green-600">{(energyCapacity || 0).toFixed(2)} MWh</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Location</p>
            <p className="text-lg font-bold text-gray-900">{location || 'Not specified'}</p>
          </div>
        </div>
      </div>

      {/* System Extras (if any) */}
      {(solarMW > 0 || windMW > 0 || generatorMW > 0 || evChargerCount > 0) && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-2xl p-6">
          <h3 className="font-bold text-gray-900 mb-4 text-xl flex items-center gap-2">
            <span className="text-2xl">✨</span>
            System Extras
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {solarMW > 0 && (
              <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                <Sun className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-yellow-600">{solarMW.toFixed(1)} MW</p>
                <p className="text-xs text-gray-600">Solar Panels</p>
              </div>
            )}
            {windMW > 0 && (
              <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                <Wind className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-blue-600">{windMW.toFixed(1)} MW</p>
                <p className="text-xs text-gray-600">Wind Turbines</p>
              </div>
            )}
            {generatorMW > 0 && (
              <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                <Zap className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-orange-600">{(generatorMW * 1000).toFixed(0)} kW</p>
                <p className="text-xs text-gray-600">Generator</p>
              </div>
            )}
            {evChargerCount > 0 && (
              <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                <Car className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-green-600">{evChargerCount}</p>
                <p className="text-xs text-gray-600">EV Chargers</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Equipment Breakdown */}
      <div className="bg-white border-2 border-gray-200 rounded-2xl p-6">
        <h3 className="font-bold text-gray-900 mb-6 text-xl flex items-center gap-2">
          <Battery className="w-6 h-6 text-blue-600" />
          Detailed Equipment Breakdown
        </h3>
        <div className="space-y-3">
          {/* Battery System */}
          {equipmentBreakdown?.batteries && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-semibold text-gray-900">Battery Energy Storage System</p>
                  <p className="text-sm text-gray-600">
                    {equipmentBreakdown.batteries.quantity || 0}x {equipmentBreakdown.batteries.manufacturer || 'Battery'} {equipmentBreakdown.batteries.model || 'System'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {(equipmentBreakdown.batteries.unitEnergyMWh || 0).toFixed(1)} MWh × {equipmentBreakdown.batteries.quantity || 0} units = {((equipmentBreakdown.batteries.unitEnergyMWh || 0) * (equipmentBreakdown.batteries.quantity || 0)).toFixed(1)} MWh total
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    ${(equipmentBreakdown.batteries.pricePerKWh || 0).toFixed(0)}/kWh
                  </p>
                </div>
                <p className="text-xl font-bold text-blue-600">{formatCurrency(equipmentBreakdown.batteries.totalCost || 0)}</p>
              </div>
            </div>
          )}
          
          {/* Inverters */}
          {equipmentBreakdown?.inverters && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-gray-900">Power Inverters</p>
                  <p className="text-sm text-gray-600">
                    {equipmentBreakdown.inverters.quantity}x {equipmentBreakdown.inverters.manufacturer} {equipmentBreakdown.inverters.model}
                  </p>
                  <p className="text-sm text-gray-600">
                    {equipmentBreakdown.inverters.unitPowerMW.toFixed(1)} MW each
                  </p>
                </div>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(equipmentBreakdown.inverters.totalCost)}</p>
              </div>
            </div>
          )}
          
          {/* Transformers */}
          {equipmentBreakdown?.transformers && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-gray-900">Transformers & Switchgear</p>
                  <p className="text-sm text-gray-600">
                    {equipmentBreakdown.transformers.quantity}x {equipmentBreakdown.transformers.manufacturer} Transformers ({equipmentBreakdown.transformers.voltage})
                  </p>
                  <p className="text-sm text-gray-600">
                    {equipmentBreakdown.switchgear.quantity}x {equipmentBreakdown.switchgear.type}
                  </p>
                </div>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(equipmentBreakdown.transformers.totalCost + equipmentBreakdown.switchgear.totalCost)}</p>
              </div>
            </div>
          )}
          
          {/* Solar Panels */}
          {equipmentBreakdown?.solar && (
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-gray-900 flex items-center gap-2">
                    <Sun className="w-5 h-5 text-yellow-600" />
                    Solar Panel System
                  </p>
                  <p className="text-sm text-gray-600">
                    {equipmentBreakdown.solar.totalMW.toFixed(1)} MW capacity ({equipmentBreakdown.solar.panelQuantity.toLocaleString()} panels)
                  </p>
                  <p className="text-sm text-gray-600">
                    {equipmentBreakdown.solar.inverterQuantity} inverters • ${equipmentBreakdown.solar.costPerWatt.toFixed(2)}/W
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {equipmentBreakdown.solar.priceCategory}
                  </p>
                </div>
                <p className="text-lg font-bold text-yellow-700">{formatCurrency(equipmentBreakdown.solar.totalCost)}</p>
              </div>
            </div>
          )}
          
          {/* Wind Turbines */}
          {equipmentBreakdown?.wind && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-gray-900 flex items-center gap-2">
                    <Wind className="w-5 h-5 text-blue-600" />
                    Wind Turbine System
                  </p>
                  <p className="text-sm text-gray-600">
                    {equipmentBreakdown.wind.turbineQuantity}x {equipmentBreakdown.wind.turbineModel}
                  </p>
                  <p className="text-sm text-gray-600">
                    {equipmentBreakdown.wind.unitPowerMW.toFixed(1)} MW each • ${equipmentBreakdown.wind.costPerKW.toFixed(0)}/kW
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {equipmentBreakdown.wind.priceCategory}
                  </p>
                </div>
                <p className="text-lg font-bold text-blue-700">{formatCurrency(equipmentBreakdown.wind.totalCost)}</p>
              </div>
            </div>
          )}
          
          {/* Generators */}
          {equipmentBreakdown?.generators && (
            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-gray-900 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-orange-600" />
                    Backup Generators
                  </p>
                  <p className="text-sm text-gray-600">
                    {equipmentBreakdown.generators.quantity}x {equipmentBreakdown.generators.manufacturer}
                  </p>
                  <p className="text-sm text-gray-600">
                    {equipmentBreakdown.generators.unitPowerMW.toFixed(1)} MW each • {equipmentBreakdown.generators.fuelType}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    ${equipmentBreakdown.generators.costPerKW.toFixed(0)}/kW
                  </p>
                </div>
                <p className="text-lg font-bold text-orange-700">{formatCurrency(equipmentBreakdown.generators.totalCost)}</p>
              </div>
            </div>
          )}
          
          {/* EV Chargers */}
          {equipmentBreakdown?.evChargers && (
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-gray-900 flex items-center gap-2">
                    <Car className="w-5 h-5 text-green-600" />
                    EV Charging Infrastructure
                  </p>
                  {equipmentBreakdown.evChargers.level2Chargers.quantity > 0 && (
                    <p className="text-sm text-gray-600">
                      Level 2: {equipmentBreakdown.evChargers.level2Chargers.quantity}x {equipmentBreakdown.evChargers.level2Chargers.unitPowerKW}kW = {formatCurrency(equipmentBreakdown.evChargers.level2Chargers.totalCost)}
                    </p>
                  )}
                  {equipmentBreakdown.evChargers.dcFastChargers.quantity > 0 && (
                    <p className="text-sm text-gray-600">
                      DC Fast: {equipmentBreakdown.evChargers.dcFastChargers.quantity}x {equipmentBreakdown.evChargers.dcFastChargers.unitPowerKW}kW = {formatCurrency(equipmentBreakdown.evChargers.dcFastChargers.totalCost)}
                    </p>
                  )}
                </div>
                <p className="text-lg font-bold text-green-700">{formatCurrency(equipmentBreakdown.evChargers.totalChargingCost)}</p>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* COST SUMMARY - 3 Categories                                   */}
          {/* ============================================================ */}
          
          {/* CATEGORY 1: Equipment Subtotal */}
          <div className="border-t-2 border-gray-200 pt-6 mt-6">
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <h4 className="font-bold text-blue-800 mb-3 flex items-center gap-2">
                <Battery className="w-5 h-5" />
                Category 1: Equipment
              </h4>
              
              {/* Core BESS */}
              <div className="flex justify-between items-center py-2 border-b border-blue-100">
                <span className="text-gray-700">BESS + Power Electronics</span>
                <span className="font-semibold text-gray-900">{formatCurrency(coreBessEquipment)}</span>
              </div>
              
              {/* Power Generation (if any) */}
              {powerGenerationEquipment > 0 && (
                <div className="flex justify-between items-center py-2 border-b border-blue-100">
                  <span className="text-gray-700">Power Generation (Solar/Wind/Gen/EV)</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(powerGenerationEquipment)}</span>
                </div>
              )}
              
              {/* Equipment Subtotal */}
              <div className="flex justify-between items-center pt-3">
                <span className="font-bold text-blue-800">Equipment Subtotal</span>
                <span className="text-xl font-bold text-blue-600">{formatCurrency(totalEquipmentCost)}</span>
              </div>
            </div>
          </div>

          {/* CATEGORY 2: Installation & Services */}
          <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
            <h4 className="font-bold text-purple-800 mb-3 flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Category 2: Installation & Services
            </h4>
            
            {equipmentBreakdown?.installation && (
              <>
                <div className="flex justify-between items-center py-1 text-sm">
                  <span className="text-gray-600">Balance of Plant (BOS)</span>
                  <span className="text-gray-900">{formatCurrency(equipmentBreakdown.installation.bos || 0)}</span>
                </div>
                <div className="flex justify-between items-center py-1 text-sm">
                  <span className="text-gray-600">EPC Services</span>
                  <span className="text-gray-900">{formatCurrency(equipmentBreakdown.installation.epc || 0)}</span>
                </div>
                <div className="flex justify-between items-center py-1 text-sm border-b border-purple-100">
                  <span className="text-gray-600">Contingency</span>
                  <span className="text-gray-900">{formatCurrency(equipmentBreakdown.installation.contingency || 0)}</span>
                </div>
              </>
            )}
            
            <div className="flex justify-between items-center pt-3">
              <span className="font-bold text-purple-800">Installation Subtotal</span>
              <span className="text-xl font-bold text-purple-600">{formatCurrency(installationServices)}</span>
            </div>
          </div>

          {/* CATEGORY 3: Turnkey Total (before incentives) */}
          <div className="bg-gray-100 rounded-xl p-4 border-2 border-gray-300">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xl font-bold text-gray-900">Total Project Cost</p>
                <p className="text-sm text-gray-600">(Turnkey Price)</p>
              </div>
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(totalProjectCost)}</p>
            </div>
          </div>

          {/* Tax Credit */}
          <div className="flex justify-between items-center p-4 bg-green-50 rounded-xl border-2 border-green-300">
            <div>
              <p className="font-semibold text-green-700">Federal Investment Tax Credit (30%)</p>
              <p className="text-sm text-gray-600">IRA 2022 incentive • 30% × {formatCurrency(totalProjectCost)}</p>
            </div>
            <p className="text-2xl font-bold text-green-600">-{formatCurrency(federalTaxCredit)}</p>
          </div>

          {/* Net Cost */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xl font-bold text-white">Net Cost After Incentives</p>
                <p className="text-sm text-green-100">Your estimated out-of-pocket cost</p>
              </div>
              <p className="text-4xl font-bold text-white">{formatCurrency(netCost)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Metrics - 4 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Annual Savings */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Annual Savings</h3>
          </div>
          <p className="text-4xl font-bold text-green-600">
            {formatCurrency(annualSavings)}
          </p>
          <p className="text-sm text-gray-600 mt-2">
            Year 1 estimated savings
          </p>
        </div>

        {/* Payback Period */}
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Payback Period</h3>
          </div>
          <p className="text-4xl font-bold text-blue-600">
            {paybackYears.toFixed(1)} years
          </p>
          <p className="text-sm text-gray-600 mt-2">
            Simple payback period
          </p>
        </div>

        {/* ROI 10 Year */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">10-Year ROI</h3>
          </div>
          <p className="text-4xl font-bold text-purple-600">
            {formatPercent(roi10Year)}
          </p>
          <p className="text-sm text-gray-600 mt-2">
            Return on investment
          </p>
        </div>

        {/* IRR */}
        <div className="bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-200 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
              <Percent className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Internal Rate of Return</h3>
          </div>
          <p className="text-4xl font-bold text-orange-600">
            {formatPercent(irr)}
          </p>
          <p className="text-sm text-gray-600 mt-2">
            Annual return rate (IRR)
          </p>
        </div>
      </div>

      {/* 25-Year Projection */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl p-8">
        <h3 className="font-bold mb-6 text-2xl">25-Year Financial Projection</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-blue-100 mb-2">Total Savings Over 25 Years</p>
            <p className="text-4xl font-bold">{formatCurrency(annualSavings * 25)}</p>
          </div>
          <div>
            <p className="text-blue-100 mb-2">25-Year ROI</p>
            <p className="text-4xl font-bold">{formatPercent(roi25Year)}</p>
          </div>
          <div>
            <p className="text-blue-100 mb-2">Net Present Value (NPV)</p>
            <p className="text-4xl font-bold">{formatCurrency(npv)}</p>
          </div>
        </div>
      </div>

      {/* Important Notes */}
      <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-6">
        <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
          <span className="text-xl">ℹ️</span>
          Important Notes
        </h4>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start gap-2">
            <span className="text-yellow-600 mt-0.5">•</span>
            <span>Preliminary estimates based on industry averages and your inputs</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-yellow-600 mt-0.5">•</span>
            <span>Final costs may vary based on site-specific conditions and vendor selection</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-yellow-600 mt-0.5">•</span>
            <span>Tax incentives subject to eligibility requirements and legislation changes</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-yellow-600 mt-0.5">•</span>
            <span>Consult with qualified installers and tax professionals for accurate quotes</span>
          </li>
        </ul>
      </div>

      {/* Request Official Quote CTA */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl p-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="text-4xl">🧙‍♂️</span>
            <div>
              <h4 className="font-bold text-xl">Ready for an Official Quote?</h4>
              <p className="text-purple-100 text-sm">
                Get exact pricing, equipment specs, and installation timeline from our energy experts
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowRequestQuoteModal(true)}
            className="px-6 py-3 bg-white text-purple-600 font-bold rounded-lg hover:bg-purple-50 transition-all shadow-lg whitespace-nowrap"
          >
            📧 Request Official Quote
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center pt-6 border-t">
        <button
          onClick={onBack}
          className="px-6 py-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
        >
          ← Back
        </button>
        <button
          onClick={handleNext}
          className="px-8 py-3 rounded-lg font-semibold transition-all bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700 shadow-lg hover:shadow-xl"
        >
          Next →
        </button>
      </div>

      {/* Request Quote Modal */}
      <RequestQuoteModal
        isOpen={showRequestQuoteModal}
        onClose={() => setShowRequestQuoteModal(false)}
        quoteData={{
          storageSizeMW,
          durationHours,
          energyCapacity,
          solarMW,
          totalCost: totalProjectCost,
          industryName: selectedTemplate?.name,
          location,
        }}
      />
    </div>
  );
};

export default Step6_PreliminaryQuote;
