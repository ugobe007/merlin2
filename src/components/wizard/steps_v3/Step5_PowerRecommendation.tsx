/**
 * NEW Step 5: Power Recommendation
 * Display completed Power Profile with level achieved
 * NOW includes Battery Configuration & Hardware Costs Preview
 * UPDATED: Users can adjust power storage and generation settings
 * UPDATED: Added Power Profile Certificate download
 */

import React, { useState } from 'react';
import { Zap, TrendingUp, Battery, Clock, Sun, Car, Wind, Target, CheckCircle2, Info, DollarSign, Cpu, Box, HelpCircle, Globe, Plug, Edit3, RotateCcw, Sliders, Award, Download } from 'lucide-react';
import type { EquipmentBreakdown } from '../../../utils/equipmentCalculations';
import type { BaselineCalculationResult } from '../../../services/baselineService';
import { generatePowerCertificate } from '../../../utils/quoteExport';
import RequestQuoteModal from '../../modals/RequestQuoteModal';

interface Step5Props {
  // Core specs
  storageSizeMW: number;
  durationHours: number;
  energyCapacity: number;
  
  // Renewables
  solarMWp?: number;
  evChargerCount?: number;
  generatorKW?: number;
  windMWp?: number;
  
  // Context
  selectedTemplate?: any;
  location?: string;
  goals?: string[];
  
  // Equipment breakdown for pricing preview
  equipmentBreakdown?: EquipmentBreakdown | null;
  
  // Grid strategy (for European off-grid/limited-grid scenarios)
  gridStrategy?: BaselineCalculationResult['gridStrategy'];
  gridConnection?: string;
  annualGridFees?: number;
  
  // ✅ NEW: Callbacks for adjusting values
  onStorageChange?: (sizeMW: number, durationHours: number) => void;
  onSolarChange?: (solarMW: number) => void;
  onWindChange?: (windMW: number) => void;
  onGeneratorChange?: (generatorKW: number) => void;
  onEVChargersChange?: (count: number) => void;
  
  // Navigation
  onNext: () => void;
  onBack: () => void;
}

// Wizard's Journey - Power levels based on energy capacity
const POWER_LEVELS = [
  { name: 'Apprentice', minKWh: 0, maxKWh: 500, icon: '🪄', gradient: 'from-purple-400 to-purple-600' },
  { name: 'Adept', minKWh: 500, maxKWh: 1000, icon: '✨', gradient: 'from-purple-500 to-violet-600' },
  { name: 'Conjurer', minKWh: 1000, maxKWh: 2000, icon: '🔮', gradient: 'from-violet-500 to-purple-700' },
  { name: 'Enchanter', minKWh: 2000, maxKWh: 3500, icon: '⚡', gradient: 'from-purple-600 to-indigo-700' },
  { name: 'Sorcerer', minKWh: 3500, maxKWh: 5000, icon: '🌟', gradient: 'from-indigo-500 to-purple-700' },
  { name: 'Archmage', minKWh: 5000, maxKWh: 10000, icon: '👑', gradient: 'from-indigo-600 to-purple-800' },
  { name: 'Grand Wizard', minKWh: 10000, maxKWh: Infinity, icon: '🧙‍♂️', gradient: 'from-purple-700 via-indigo-600 to-violet-800' }
];

const Step5_PowerRecommendation: React.FC<Step5Props> = ({
  storageSizeMW,
  durationHours,
  energyCapacity,
  solarMWp = 0,
  evChargerCount = 0,
  generatorKW = 0,
  windMWp = 0,
  selectedTemplate,
  location,
  goals = [],
  equipmentBreakdown,
  gridStrategy,
  gridConnection,
  annualGridFees = 0,
  onStorageChange,
  onSolarChange,
  onWindChange,
  onGeneratorChange,
  onEVChargersChange,
  onNext,
  onBack
}) => {
  // ✅ NEW: Editing state
  const [isEditingStorage, setIsEditingStorage] = useState(false);
  const [isEditingGeneration, setIsEditingGeneration] = useState(false);
  const [showRequestQuoteModal, setShowRequestQuoteModal] = useState(false);
  
  // Local editing values
  const [editPowerMW, setEditPowerMW] = useState(storageSizeMW);
  const [editDuration, setEditDuration] = useState(durationHours);
  const [editSolarMW, setEditSolarMW] = useState(solarMWp);
  const [editWindMW, setEditWindMW] = useState(windMWp);
  const [editGeneratorKW, setEditGeneratorKW] = useState(generatorKW);
  const [editEVChargers, setEditEVChargers] = useState(evChargerCount);
  
  // Calculate Power Level
  const totalKWh = energyCapacity * 1000; // Convert MWh to kWh
  const powerLevel = POWER_LEVELS.find(
    level => totalKWh >= level.minKWh && totalKWh < level.maxKWh
  ) || POWER_LEVELS[0];

  // Format currency
  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value.toFixed(0)}`;
  };

  const handleNext = () => {
    // Auto-scroll to bottom before proceeding
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    setTimeout(onNext, 300);
  };

  // ✅ Save storage changes
  const handleSaveStorage = () => {
    if (onStorageChange) {
      onStorageChange(editPowerMW, editDuration);
    }
    setIsEditingStorage(false);
  };

  // ✅ Cancel storage editing
  const handleCancelStorage = () => {
    setEditPowerMW(storageSizeMW);
    setEditDuration(durationHours);
    setIsEditingStorage(false);
  };

  // ✅ Save generation changes
  const handleSaveGeneration = () => {
    if (onSolarChange) onSolarChange(editSolarMW);
    if (onWindChange) onWindChange(editWindMW);
    if (onGeneratorChange) onGeneratorChange(editGeneratorKW);
    if (onEVChargersChange) onEVChargersChange(editEVChargers);
    setIsEditingGeneration(false);
  };

  // ✅ Cancel generation editing
  const handleCancelGeneration = () => {
    setEditSolarMW(solarMWp);
    setEditWindMW(windMWp);
    setEditGeneratorKW(generatorKW);
    setEditEVChargers(evChargerCount);
    setIsEditingGeneration(false);
  };

  // ✅ Generate Power Profile Certificate
  const handleDownloadCertificate = () => {
    generatePowerCertificate({
      storageSizeMW,
      durationHours,
      solarMW: solarMWp,
      windMW: windMWp,
      generatorMW: generatorKW,
      evChargers: evChargerCount,
      location,
      industryTemplate: selectedTemplate?.name || selectedTemplate?.slug || 'Custom Configuration',
    });
  };

  return (
    <div className="space-y-8">
      {/* Header with Level Badge and Certificate Download */}
      <div className="text-center mb-8">
        {/* Achievement Badge - Enhanced Design */}
        <div className="relative inline-block mb-6">
          {/* Glow effect behind badge */}
          <div className={`absolute inset-0 bg-gradient-to-r ${powerLevel.gradient} blur-xl opacity-40 rounded-full scale-110`}></div>
          
          <div className={`
            relative px-8 py-4 rounded-full text-2xl font-bold text-white
            bg-gradient-to-r ${powerLevel.gradient}
            shadow-2xl transform hover:scale-105 transition-all
            border-2 border-white/30
          `}>
            <span className="text-3xl mr-2">{powerLevel.icon}</span>
            {powerLevel.name} Level Achieved!
          </div>
        </div>
        
        <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">
          Your Power Profile is Complete
        </h2>
        <p className="text-gray-600 mt-2 mb-4">
          Merlin has analyzed your needs and optimized your system
        </p>
        
        {/* Download Certificate Button */}
        <button
          onClick={handleDownloadCertificate}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:from-amber-600 hover:via-yellow-600 hover:to-amber-600 transition-all hover:scale-105 border-b-4 border-amber-700 hover:border-amber-800 active:border-b-2 active:translate-y-0.5"
        >
          <Award className="w-5 h-5" />
          Download Achievement Certificate
          <Download className="w-4 h-4" />
        </button>
      </div>

      {/* Core System Specs - 3 Cards with Edit Button */}
      <div className="relative">
        {/* Edit Button */}
        {onStorageChange && !isEditingStorage && (
          <button
            onClick={() => setIsEditingStorage(true)}
            className="absolute -top-3 right-0 flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl text-sm font-semibold hover:from-purple-600 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 border-b-4 border-purple-700 hover:border-purple-800 z-10"
          >
            <Sliders className="w-4 h-4" />
            Adjust Storage
          </button>
        )}
        
        {isEditingStorage ? (
          /* ✅ EDITING MODE - Storage */
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-400 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-purple-600" />
                Adjust Battery Storage
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={handleCancelStorage}
                  className="px-3 py-1.5 text-gray-600 hover:text-gray-800 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveStorage}
                  className="px-4 py-1.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
                >
                  Apply Changes
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Power Output Slider */}
              <div className="bg-white rounded-xl p-4 border border-purple-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Power Output (MW)
                </label>
                <input
                  type="range"
                  min="0.05"
                  max="10"
                  step="0.05"
                  value={editPowerMW}
                  onChange={(e) => setEditPowerMW(parseFloat(e.target.value))}
                  className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between mt-2">
                  <input
                    type="number"
                    min="0.05"
                    max="50"
                    step="0.05"
                    value={editPowerMW}
                    onChange={(e) => setEditPowerMW(parseFloat(e.target.value) || 0.1)}
                    className="w-24 px-2 py-1 border border-gray-300 rounded text-center font-bold text-blue-600"
                  />
                  <span className="text-sm text-gray-500">MW</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">{(editPowerMW * 1000).toFixed(0)} kW</p>
              </div>

              {/* Duration Slider */}
              <div className="bg-white rounded-xl p-4 border border-purple-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (Hours)
                </label>
                <input
                  type="range"
                  min="1"
                  max="12"
                  step="0.5"
                  value={editDuration}
                  onChange={(e) => setEditDuration(parseFloat(e.target.value))}
                  className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                />
                <div className="flex justify-between mt-2">
                  <input
                    type="number"
                    min="1"
                    max="24"
                    step="0.5"
                    value={editDuration}
                    onChange={(e) => setEditDuration(parseFloat(e.target.value) || 1)}
                    className="w-24 px-2 py-1 border border-gray-300 rounded text-center font-bold text-purple-600"
                  />
                  <span className="text-sm text-gray-500">hrs</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Backup duration</p>
              </div>

              {/* Calculated Energy (Read-only) */}
              <div className="bg-white rounded-xl p-4 border border-green-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Energy (Calculated)
                </label>
                <div className="mt-4">
                  <p className="text-3xl font-bold text-green-600">
                    {(editPowerMW * editDuration).toFixed(2)} MWh
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {(editPowerMW * editDuration * 1000).toFixed(0)} kWh capacity
                  </p>
                </div>
              </div>
            </div>
            
            {/* Quick Presets */}
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-sm text-gray-600 mr-2">Quick presets:</span>
              <button
                onClick={() => { setEditPowerMW(0.25); setEditDuration(4); }}
                className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-xs font-medium text-gray-700"
              >
                Small (1 MWh)
              </button>
              <button
                onClick={() => { setEditPowerMW(0.5); setEditDuration(4); }}
                className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-xs font-medium text-gray-700"
              >
                Medium (2 MWh)
              </button>
              <button
                onClick={() => { setEditPowerMW(1.0); setEditDuration(4); }}
                className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-xs font-medium text-gray-700"
              >
                Large (4 MWh)
              </button>
              <button
                onClick={() => { setEditPowerMW(2.5); setEditDuration(4); }}
                className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-xs font-medium text-gray-700"
              >
                X-Large (10 MWh)
              </button>
              <button
                onClick={() => { setEditPowerMW(storageSizeMW); setEditDuration(durationHours); }}
                className="px-3 py-1 bg-purple-100 hover:bg-purple-200 rounded-full text-xs font-medium text-purple-700 flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                Reset to Recommended
              </button>
            </div>
          </div>
        ) : (
          /* ✅ DISPLAY MODE - Storage */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Power */}
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Power Output</h3>
              </div>
              <p className="text-4xl font-bold text-blue-600">
                {(storageSizeMW || 0).toFixed(2)} MW
              </p>
              <p className="text-sm text-gray-600 mt-2">
                {((storageSizeMW || 0) * 1000).toFixed(0)} kW peak capacity
              </p>
            </div>

            {/* Duration */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Duration</h3>
              </div>
              <p className="text-4xl font-bold text-purple-600">
                {(durationHours || 0).toFixed(1)} hrs
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Sustained backup power
              </p>
            </div>

            {/* Energy */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                  <Battery className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Total Energy</h3>
              </div>
              <p className="text-4xl font-bold text-green-600">
                {(energyCapacity || 0).toFixed(2)} MWh
              </p>
              <p className="text-sm text-gray-600 mt-2">
                {(totalKWh || 0).toFixed(0)} kWh storage capacity
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Add-ons Summary (if any) - with Edit capability */}
      {(solarMWp > 0 || evChargerCount > 0 || generatorKW > 0 || windMWp > 0 || isEditingGeneration) && (
        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border-2 border-orange-300 rounded-2xl p-6 relative">
          {/* Edit Button for Generation */}
          {(onSolarChange || onWindChange || onGeneratorChange || onEVChargersChange) && !isEditingGeneration && (
            <button
              onClick={() => setIsEditingGeneration(true)}
              className="absolute -top-3 right-4 flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl text-sm font-semibold hover:from-orange-600 hover:to-amber-600 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 border-b-4 border-orange-700 hover:border-orange-800 z-10"
            >
              <Sliders className="w-4 h-4" />
              Adjust Generation
            </button>
          )}
          
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-xl">
            <span className="text-2xl">✨</span>
            Your Energy Ecosystem
          </h3>
          
          {isEditingGeneration ? (
            /* ✅ EDITING MODE - Generation */
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* Solar */}
                <div className="bg-white rounded-lg p-4 border border-yellow-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Sun className="w-5 h-5 text-yellow-500" />
                    <label className="font-medium text-gray-700">Solar (MW)</label>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="5"
                    step="0.1"
                    value={editSolarMW}
                    onChange={(e) => setEditSolarMW(parseFloat(e.target.value))}
                    className="w-full h-2 bg-yellow-200 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                  />
                  <div className="flex justify-between mt-2">
                    <input
                      type="number"
                      min="0"
                      max="20"
                      step="0.1"
                      value={editSolarMW}
                      onChange={(e) => setEditSolarMW(parseFloat(e.target.value) || 0)}
                      className="w-20 px-2 py-1 border border-gray-300 rounded text-center font-bold text-yellow-600"
                    />
                    <span className="text-sm text-gray-500">MW</span>
                  </div>
                </div>

                {/* Wind */}
                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Wind className="w-5 h-5 text-blue-500" />
                    <label className="font-medium text-gray-700">Wind (MW)</label>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="5"
                    step="0.1"
                    value={editWindMW}
                    onChange={(e) => setEditWindMW(parseFloat(e.target.value))}
                    className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                  <div className="flex justify-between mt-2">
                    <input
                      type="number"
                      min="0"
                      max="20"
                      step="0.1"
                      value={editWindMW}
                      onChange={(e) => setEditWindMW(parseFloat(e.target.value) || 0)}
                      className="w-20 px-2 py-1 border border-gray-300 rounded text-center font-bold text-blue-600"
                    />
                    <span className="text-sm text-gray-500">MW</span>
                  </div>
                </div>

                {/* Generator */}
                <div className="bg-white rounded-lg p-4 border border-orange-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-5 h-5 text-orange-500" />
                    <label className="font-medium text-gray-700">Generator (kW)</label>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="2000"
                    step="50"
                    value={editGeneratorKW}
                    onChange={(e) => setEditGeneratorKW(parseFloat(e.target.value))}
                    className="w-full h-2 bg-orange-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                  />
                  <div className="flex justify-between mt-2">
                    <input
                      type="number"
                      min="0"
                      max="10000"
                      step="50"
                      value={editGeneratorKW}
                      onChange={(e) => setEditGeneratorKW(parseFloat(e.target.value) || 0)}
                      className="w-20 px-2 py-1 border border-gray-300 rounded text-center font-bold text-orange-600"
                    />
                    <span className="text-sm text-gray-500">kW</span>
                  </div>
                </div>

                {/* EV Chargers */}
                <div className="bg-white rounded-lg p-4 border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Car className="w-5 h-5 text-green-500" />
                    <label className="font-medium text-gray-700">EV Chargers</label>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    step="1"
                    value={editEVChargers}
                    onChange={(e) => setEditEVChargers(parseInt(e.target.value))}
                    className="w-full h-2 bg-green-200 rounded-lg appearance-none cursor-pointer accent-green-500"
                  />
                  <div className="flex justify-between mt-2">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      value={editEVChargers}
                      onChange={(e) => setEditEVChargers(parseInt(e.target.value) || 0)}
                      className="w-20 px-2 py-1 border border-gray-300 rounded text-center font-bold text-green-600"
                    />
                    <span className="text-sm text-gray-500">units</span>
                  </div>
                </div>
              </div>
              
              {/* Save/Cancel buttons */}
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={handleCancelGeneration}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveGeneration}
                  className="px-5 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors"
                >
                  Apply Changes
                </button>
              </div>
            </div>
          ) : (
            /* ✅ DISPLAY MODE - Generation */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {solarMWp > 0 && (
                <div className="flex items-center gap-3 bg-white rounded-lg p-4">
                  <Sun className="w-8 h-8 text-yellow-500" />
                  <div>
                    <p className="font-semibold text-gray-900">{(solarMWp || 0).toFixed(2)} MW Solar</p>
                    <p className="text-sm text-gray-600">Clean energy generation</p>
                  </div>
                </div>
              )}
              {evChargerCount > 0 && (
                <div className="flex items-center gap-3 bg-white rounded-lg p-4">
                  <Car className="w-8 h-8 text-green-500" />
                  <div>
                    <p className="font-semibold text-gray-900">{evChargerCount} EV Chargers</p>
                    <p className="text-sm text-gray-600">Electric vehicle support</p>
                  </div>
                </div>
              )}
              {generatorKW > 0 && (
                <div className="flex items-center gap-3 bg-white rounded-lg p-4">
                  <Zap className="w-8 h-8 text-orange-500" />
                  <div>
                    <p className="font-semibold text-gray-900">{(generatorKW || 0).toFixed(0)} kW Generator</p>
                    <p className="text-sm text-gray-600">Backup power redundancy</p>
                  </div>
                </div>
              )}
              {windMWp > 0 && (
                <div className="flex items-center gap-3 bg-white rounded-lg p-4">
                  <Wind className="w-8 h-8 text-blue-500" />
                  <div>
                    <p className="font-semibold text-gray-900">{windMWp.toFixed(2)} MW Wind</p>
                    <p className="text-sm text-gray-600">Wind energy generation</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* Add Generation Button (if none selected yet) */}
      {solarMWp === 0 && evChargerCount === 0 && generatorKW === 0 && windMWp === 0 && !isEditingGeneration && (onSolarChange || onWindChange || onGeneratorChange || onEVChargersChange) && (
        <button
          onClick={() => setIsEditingGeneration(true)}
          className="w-full py-4 border-2 border-dashed border-orange-300 rounded-2xl text-orange-600 font-medium hover:bg-orange-50 hover:border-orange-400 transition-all flex items-center justify-center gap-2"
        >
          <Sun className="w-5 h-5" />
          Add Solar, Wind, Generator, or EV Chargers
        </button>
      )}

      {/* ⚡ GRID STRATEGY SAVINGS (for off-grid/limited-grid scenarios) */}
      {gridStrategy && (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-400 rounded-2xl p-6">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-xl">
            <Plug className="w-6 h-6 text-emerald-600" />
            Grid Strategy: {gridStrategy.strategy}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Savings Card */}
            <div className="bg-white rounded-xl p-4 border border-emerald-200">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-emerald-500" />
                <span className="font-semibold text-emerald-700">Annual Savings</span>
              </div>
              <p className="text-3xl font-bold text-emerald-600">
                {formatCurrency(gridStrategy.annualSavings)}/year
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {gridStrategy.savingsReason}
              </p>
              {annualGridFees > 0 && (
                <p className="text-xs text-gray-500 mt-2">
                  Current grid fees: {formatCurrency(annualGridFees)}/year
                </p>
              )}
            </div>
            
            {/* Generation Requirements Card */}
            <div className="bg-white rounded-xl p-4 border border-emerald-200">
              <div className="flex items-center gap-2 mb-2">
                <Sun className="w-5 h-5 text-yellow-500" />
                <span className="font-semibold text-gray-700">Generation Recommendation</span>
              </div>
              {gridStrategy.requiresGeneration ? (
                <>
                  <p className="text-lg font-bold text-yellow-600">
                    {gridStrategy.recommendedSolarMW.toFixed(2)} MW Solar Recommended
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Required for {gridStrategy.strategy.toLowerCase()} operation
                  </p>
                </>
              ) : (
                <>
                  <p className="text-lg font-medium text-gray-700">
                    Optional: {gridStrategy.recommendedSolarMW.toFixed(2)} MW Solar
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Enhance savings with additional generation
                  </p>
                </>
              )}
            </div>
          </div>
          
          {/* European Market Note */}
          <div className="bg-emerald-100 rounded-lg p-3 flex items-start gap-3">
            <Globe className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-emerald-800">
                Popular in Europe & High Grid-Fee Markets
              </p>
              <p className="text-xs text-emerald-700 mt-1">
                Many European projects save significantly by reducing grid dependency. 
                Grid capacity charges and connection fees can represent 30-50% of electricity costs in some markets.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 🔋 BATTERY CONFIGURATION & HARDWARE COSTS */}
      {equipmentBreakdown && (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-300 rounded-2xl p-6">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-xl">
            <Battery className="w-6 h-6 text-indigo-600" />
            Battery Configuration & Hardware
          </h3>
          
          {/* Battery Details */}
          <div className="bg-white rounded-xl p-4 mb-4 border border-indigo-200">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-semibold text-gray-900 text-lg">
                  {equipmentBreakdown.batteries.manufacturer} {equipmentBreakdown.batteries.model}
                </p>
                <p className="text-sm text-gray-600">
                  {equipmentBreakdown.batteries.quantity} unit{equipmentBreakdown.batteries.quantity > 1 ? 's' : ''} × {(equipmentBreakdown.batteries.unitEnergyMWh * 1000).toFixed(0)} kWh
                </p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-indigo-600">
                  {formatCurrency(equipmentBreakdown.batteries.totalCost)}
                </p>
                <p className="text-xs text-gray-500">
                  @ {formatCurrency(equipmentBreakdown.batteries.pricePerKWh)}/kWh
                </p>
              </div>
            </div>
            
            {/* Market Intelligence badge if available */}
            {equipmentBreakdown.batteries.marketIntelligence?.nrelCompliant && (
              <div className="flex items-center gap-2 text-xs text-green-700 bg-green-100 rounded-lg px-3 py-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>NREL-compliant pricing • 2025 Market Data</span>
              </div>
            )}
          </div>

          {/* Hardware Breakdown Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {/* Inverters */}
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <div className="flex items-center gap-2 mb-1">
                <Cpu className="w-4 h-4 text-blue-500" />
                <span className="text-xs font-medium text-gray-600">Inverters</span>
              </div>
              <p className="font-semibold text-gray-900">{equipmentBreakdown.inverters.quantity}x</p>
              <p className="text-sm text-blue-600 font-medium">{formatCurrency(equipmentBreakdown.inverters.totalCost)}</p>
            </div>

            {/* Transformers */}
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <div className="flex items-center gap-2 mb-1">
                <Box className="w-4 h-4 text-purple-500" />
                <span className="text-xs font-medium text-gray-600">Transformers</span>
              </div>
              <p className="font-semibold text-gray-900">{equipmentBreakdown.transformers.quantity}x</p>
              <p className="text-sm text-purple-600 font-medium">{formatCurrency(equipmentBreakdown.transformers.totalCost)}</p>
            </div>

            {/* Switchgear */}
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-4 h-4 text-orange-500" />
                <span className="text-xs font-medium text-gray-600">Switchgear</span>
              </div>
              <p className="font-semibold text-gray-900">{equipmentBreakdown.switchgear.quantity}x</p>
              <p className="text-sm text-orange-600 font-medium">{formatCurrency(equipmentBreakdown.switchgear.totalCost)}</p>
            </div>

            {/* Installation */}
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="w-4 h-4 text-green-500" />
                <span className="text-xs font-medium text-gray-600">Installation</span>
              </div>
              <p className="font-semibold text-gray-900">BOS + EPC</p>
              <p className="text-sm text-green-600 font-medium">{formatCurrency(equipmentBreakdown.installation.totalInstallation)}</p>
            </div>
          </div>

          {/* Optional Equipment */}
          {(equipmentBreakdown.solar || equipmentBreakdown.generators || equipmentBreakdown.evChargers) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              {equipmentBreakdown.solar && (
                <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Sun className="w-4 h-4 text-yellow-600" />
                    <span className="text-xs font-medium text-gray-600">Solar Array</span>
                  </div>
                  <p className="font-semibold text-gray-900">{equipmentBreakdown.solar.totalMW.toFixed(2)} MW</p>
                  <p className="text-sm text-yellow-700 font-medium">{formatCurrency(equipmentBreakdown.solar.totalCost)}</p>
                </div>
              )}
              {equipmentBreakdown.generators && (
                <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="w-4 h-4 text-orange-600" />
                    <span className="text-xs font-medium text-gray-600">Generator</span>
                  </div>
                  <p className="font-semibold text-gray-900">{(equipmentBreakdown.generators.unitPowerMW * 1000).toFixed(0)} kW</p>
                  <p className="text-sm text-orange-700 font-medium">{formatCurrency(equipmentBreakdown.generators.totalCost)}</p>
                </div>
              )}
              {equipmentBreakdown.evChargers && (
                <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Car className="w-4 h-4 text-green-600" />
                    <span className="text-xs font-medium text-gray-600">EV Chargers</span>
                  </div>
                  <p className="font-semibold text-gray-900">
                    {equipmentBreakdown.evChargers.level2Chargers.quantity + equipmentBreakdown.evChargers.dcFastChargers.quantity} units
                  </p>
                  <p className="text-sm text-green-700 font-medium">{formatCurrency(equipmentBreakdown.evChargers.totalChargingCost)}</p>
                </div>
              )}
            </div>
          )}

          {/* Total Cost Summary */}
          {equipmentBreakdown.totals && (
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-indigo-200 text-sm">Total System Cost</p>
                  <p className="text-3xl font-bold">{formatCurrency(equipmentBreakdown.totals.totalProjectCost)}</p>
                </div>
                <div className="text-right">
                  <p className="text-indigo-200 text-sm">Equipment + Installation</p>
                  <p className="text-sm">
                    {formatCurrency(equipmentBreakdown.totals.equipmentCost)} + {formatCurrency(equipmentBreakdown.totals.installationCost)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ❓ Power Output vs Power Profile Explainer */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <HelpCircle className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-gray-900 text-lg mb-3 flex items-center gap-2">
              Understanding Your System
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Power Output */}
              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-5 h-5 text-blue-500" />
                  <span className="font-semibold text-blue-700">Power Output ({(storageSizeMW || 0).toFixed(2)} MW)</span>
                </div>
                <p className="text-sm text-gray-600">
                  <strong>Technical specification:</strong> The maximum rate your battery can discharge electricity. 
                  Think of it like the "horsepower" of your system — how much power it can deliver at any moment.
                </p>
                <p className="text-xs text-gray-500 mt-2 italic">
                  Example: A 0.6 MW system can power equipment drawing up to 600 kW simultaneously.
                </p>
              </div>

              {/* Power Profile */}
              <div className="bg-white rounded-lg p-4 border border-purple-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{powerLevel.icon}</span>
                  <span className="font-semibold text-purple-700">Power Profile ({powerLevel.name})</span>
                </div>
                <p className="text-sm text-gray-600">
                  <strong>Your achievement level:</strong> Based on your total energy storage capacity ({(totalKWh || 0).toFixed(0)} kWh). 
                  Higher levels unlock greater backup duration, more savings potential, and bigger environmental impact.
                </p>
                <p className="text-xs text-gray-500 mt-2 italic">
                  Your {powerLevel.name} level = {(totalKWh || 0).toFixed(0)} kWh of stored energy
                </p>
              </div>
            </div>
            
            {/* Quick Comparison */}
            <div className="mt-4 bg-gray-100 rounded-lg p-3">
              <p className="text-xs text-gray-700">
                <strong>Simple analogy:</strong> If your battery were a water tank, <strong>Power Output</strong> is how fast water can flow out (the pipe size), 
                while <strong>Power Profile</strong> reflects how much water the tank holds (total capacity). Both matter for different use cases!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Your Goals (if selected) */}
      {goals.length > 0 && (
        <div className="bg-blue-50 border-2 border-blue-300 rounded-2xl p-6">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-xl">
            <Target className="w-6 h-6 text-blue-600" />
            Optimized For Your Goals
          </h3>
          <div className="flex flex-wrap gap-2">
            {goals.map((goal, index) => (
              <span
                key={index}
                className="px-4 py-2 bg-white border-2 border-blue-300 rounded-full text-sm font-semibold text-blue-700 flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                {goal.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Context Summary */}
      <div className="bg-gray-50 border-2 border-gray-200 rounded-2xl p-6">
        <h3 className="font-bold text-gray-900 mb-4 text-xl">System Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {selectedTemplate && (
            <div>
              <p className="text-sm text-gray-600">Industry</p>
              <p className="font-semibold text-gray-900">{selectedTemplate.name}</p>
            </div>
          )}
          {location && (
            <div>
              <p className="text-sm text-gray-600">Location</p>
              <p className="font-semibold text-gray-900">{location}</p>
            </div>
          )}
          <div>
            <p className="text-sm text-gray-600">System Type</p>
            <p className="font-semibold text-gray-900">
              {durationHours < 2 ? 'Peak Shaving' : 
               durationHours < 4 ? 'Load Shifting' : 
               'Long Duration Storage'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Power Level</p>
            <p className="font-semibold text-gray-900">
              {powerLevel.icon} {powerLevel.name}
            </p>
          </div>
        </div>
      </div>

      {/* Estimate Disclaimer & CTA */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-2xl">🧙‍♂️</span>
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-gray-900 text-lg mb-2">
              This is Your Preliminary Estimate
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              The pricing and specifications shown are estimates based on current market data and your inputs. 
              For an <strong>official, bankable quote</strong> with exact pricing, equipment specifications, 
              and installation timeline, request a custom proposal from our energy experts.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setShowRequestQuoteModal(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
              >
                <span>📧</span>
                Request Official Quote
              </button>
              <span className="text-gray-500 text-sm self-center">
                or continue to see your estimate →
              </span>
            </div>
          </div>
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
          solarMW: solarMWp,
          totalCost: equipmentBreakdown?.totals?.totalProjectCost,
          industryName: selectedTemplate?.name,
          location,
        }}
      />
    </div>
  );
};

export default Step5_PowerRecommendation;
