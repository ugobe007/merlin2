import React from 'react';
import PricingConfigurationPanel from '../pricing/PricingConfigurationPanel';
import FinancialSummaryPanel from '../financial/FinancialSummaryPanel';
import SystemDetailsPanel from '../system/SystemDetailsPanel';

interface AdvancedQuoteBuilderSectionProps {
  // Display state
  showAdvancedQuoteBuilder: boolean;
  setShowAdvancedQuoteBuilder: (show: boolean) => void;
  
  // Project data
  quoteName: string;
  setQuoteName: (name: string) => void;
  powerMW: number;
  setPowerMW: (power: number) => void;
  standbyHours: number;
  setStandbyHours: (hours: number) => void;
  gridMode: string;
  setGridMode: (mode: string) => void;
  useCase: string;
  setUseCase: (useCase: string) => void;
  generatorMW: number;
  setGeneratorMW: (generator: number) => void;
  solarMWp: number;
  setSolarMWp: (solar: number) => void;
  windMW: number;
  setWindMW: (wind: number) => void;
  utilization: number;
  setUtilization: (utilization: number) => void;
  warranty: string;
  setWarranty: (warranty: string) => void;
  
  // Pricing configuration
  batteryKwh: number;
  setBatteryKwh: (kwh: number) => void;
  pcsKw: number;
  setPcsKw: (kw: number) => void;
  bosPercent: number;
  setBosPercent: (percent: number) => void;
  epcPercent: number;
  setEpcPercent: (percent: number) => void;
  tariffPercent: number;
  setTariffPercent: (percent: number) => void;
  solarKwp: number;
  setSolarKwp: (kwp: number) => void;
  windKw: number;
  setWindKw: (kw: number) => void;
  genKw: number;
  setGenKw: (kw: number) => void;
  onGridPcsFactor: number;
  setOnGridPcsFactor: (factor: number) => void;
  offGridPcsFactor: number;
  setOffGridPcsFactor: (factor: number) => void;
  
  // Financial data
  currency: string;
  setCurrency: (currency: string) => void;
  bessCapEx: number;
  grandCapEx: number;
  annualSavings: number;
  roiYears: number;
  currentQuoteStatus: string;
  
  // Calculated values
  actualDuration: number;
  totalMWh: number;
  annualEnergyMWh: number;
  effectiveBatteryKwh: number;
  pcsKW: number;
  
  // Handlers
  handleSaveProject: () => void;
  handleLoadProject: () => void;
  handlePortfolio: () => void;
  handleResetToDefaults: () => void;
  getCurrencySymbol: () => string;
  convertCurrency: (amount: number) => number;
  handleExportWord: () => void;
  setShowCalculationModal: (show: boolean) => void;
  handleExportCalculations: () => void;
  setShowAnalytics: (show: boolean) => void;
  setShowProfessionalAnalytics?: (show: boolean) => void;
  setShowFinancing: (show: boolean) => void;
  setShowTemplates: (show: boolean) => void;
  setShowUtilityRates: (show: boolean) => void;
  setShowQuoteTemplates: (show: boolean) => void;
  setShowPricingPresets: (show: boolean) => void;
  setShowReviewWorkflow: (show: boolean) => void;
  renderMainQuoteForm: () => React.ReactNode;
  
  // Styles
  inputStyle: string;
  labelStyle: string;
}

export default function AdvancedQuoteBuilderSection({
  // Display state
  showAdvancedQuoteBuilder,
  setShowAdvancedQuoteBuilder,
  
  // Project data
  quoteName,
  setQuoteName,
  powerMW,
  setPowerMW,
  standbyHours,
  setStandbyHours,
  gridMode,
  setGridMode,
  useCase,
  setUseCase,
  generatorMW,
  setGeneratorMW,
  solarMWp,
  setSolarMWp,
  windMW,
  setWindMW,
  utilization,
  setUtilization,
  warranty,
  setWarranty,
  
  // Pricing configuration
  batteryKwh,
  setBatteryKwh,
  pcsKw,
  setPcsKw,
  bosPercent,
  setBosPercent,
  epcPercent,
  setEpcPercent,
  tariffPercent,
  setTariffPercent,
  solarKwp,
  setSolarKwp,
  windKw,
  setWindKw,
  genKw,
  setGenKw,
  onGridPcsFactor,
  setOnGridPcsFactor,
  offGridPcsFactor,
  setOffGridPcsFactor,
  
  // Financial data
  currency,
  setCurrency,
  bessCapEx,
  grandCapEx,
  annualSavings,
  roiYears,
  currentQuoteStatus,
  
  // Calculated values
  actualDuration,
  totalMWh,
  annualEnergyMWh,
  effectiveBatteryKwh,
  pcsKW,
  
  // Handlers
  handleSaveProject,
  handleLoadProject,
  handlePortfolio,
  handleResetToDefaults,
  getCurrencySymbol,
  convertCurrency,
  handleExportWord,
  setShowCalculationModal,
  handleExportCalculations,
  setShowAnalytics,
  setShowProfessionalAnalytics,
  setShowFinancing,
  setShowTemplates,
  setShowUtilityRates,
  setShowQuoteTemplates,
  setShowPricingPresets,
  setShowReviewWorkflow,
  renderMainQuoteForm,
  
  // Styles
  inputStyle,
  labelStyle,
}: AdvancedQuoteBuilderSectionProps) {
  
  if (!showAdvancedQuoteBuilder) {
    return null;
  }

  return (
    <>
      {/* Back to Simple View Button */}
      <section className="my-6 text-center">
        <button
          onClick={() => {
            console.log('🔙 Back to Simple View clicked');
            setShowAdvancedQuoteBuilder(false);
            // Reset scroll position
            window.scrollTo(0, 0);
          }}
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-8 py-3 rounded-xl font-semibold shadow-md transition-all inline-flex items-center gap-2"
        >
          <span>←</span>
          <span>Back to Simple View</span>
        </button>
      </section>

      {/* Project Management Section - Only in Advanced Mode */}
      <section className="my-6 rounded-2xl p-6 shadow-xl border-2 border-blue-400 bg-gradient-to-r from-blue-50 to-indigo-50">
        <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">Project Management</h3>
        <div className="flex justify-center items-center space-x-4">
          <input 
            type="text" 
            placeholder="My BESS Project"
            value={quoteName}
            onChange={(e) => setQuoteName(e.target.value)}
            className={`${inputStyle} w-64 text-center`}
          />
          
          <button 
            className="bg-gradient-to-b from-gray-200 to-gray-300 text-gray-700 px-6 py-3 rounded-xl font-bold shadow-lg border-2 border-blue-400 flex items-center justify-center space-x-2"
            onClick={handleSaveProject}
          >
            <span className="text-xl">💾</span>
            <span>Save</span>
          </button>
          
          <button 
            className="bg-gradient-to-b from-green-400 to-green-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg border-2 border-green-800 flex items-center justify-center space-x-2"
            onClick={handleLoadProject}
          >
            <span className="text-xl">📂</span>
            <span>Load</span>
          </button>
          
          <button 
            className="bg-gradient-to-b from-purple-600 to-purple-800 text-yellow-300 px-6 py-3 rounded-xl font-bold shadow-lg border-2 border-purple-900 flex items-center justify-center space-x-2"
            onClick={handlePortfolio}
          >
            <span>📊</span>
            <span>Portfolio</span>
          </button>
        </div>
      </section>

      {/* Main Quote Form */}
      {renderMainQuoteForm()}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT AND MIDDLE COLUMNS */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* SYSTEM CONFIGURATION PANEL */}
          <section className="rounded-2xl p-8 shadow-2xl border-2 border-purple-300 bg-gradient-to-b from-purple-50 via-purple-100 to-white relative overflow-hidden">
            <h2 className="text-3xl font-bold text-gray-800 mb-8">System Configuration</h2>
            <div className="space-y-6">
              <div>
                <label className={labelStyle}>Power (MW)</label>
                <input type="number" step="0.1" value={powerMW} onChange={(e) => setPowerMW(parseFloat(e.target.value) || 0)} className={inputStyle} />
              </div>
              <div>
                <label className={labelStyle}>Duration (hours)</label>
                <select value={standbyHours} onChange={(e) => setStandbyHours(parseFloat(e.target.value) || 2)} className={inputStyle}>
                  <option value="0.5">0.5 hours (UPS applications)</option>
                  <option value="1">1 hour (Short backup)</option>
                  <option value="2">2 hours (Standard grid support)</option>
                  <option value="3">3 hours (Extended grid support)</option>
                  <option value="4">4 hours (Long duration storage)</option>
                  <option value="6">6 hours (Extended backup)</option>
                  <option value="8">8 hours (Overnight storage)</option>
                </select>
                <div className="text-xs text-gray-500 mt-1">
                  💡 Most BESS projects use 2-4 hours. Use longer durations only for specialized applications.
                </div>
              </div>
              <div>
                <label className={labelStyle}>Grid Mode</label>
                <select value={gridMode} onChange={(e) => setGridMode(e.target.value)} className={inputStyle}>
                  <option>On-grid</option>
                  <option>Off-grid</option>
                  <option>Hybrid</option>
                </select>
              </div>
              <div>
                <label className={labelStyle}>Generator (MW)</label>
                <input type="number" step="0.1" value={generatorMW} onChange={(e) => setGeneratorMW(parseFloat(e.target.value) || 0)} className={inputStyle} />
              </div>
              <div>
                <label className={labelStyle}>Solar (MWp) - Optional</label>
                <input type="number" step="0.1" value={solarMWp} onChange={(e) => setSolarMWp(parseFloat(e.target.value) || 0)} className={inputStyle} placeholder="0 (Battery only)" />
                {solarMWp > 0 && (
                  <div className="text-xs text-amber-600 mt-1 p-2 bg-amber-50 rounded border border-amber-200">
                    ⚠️ {solarMWp}MW solar requires ~{(solarMWp * 100000 / 43560).toFixed(1)} acres of roof/land space. 
                    Verify your facility can support this before including in quote.
                  </div>
                )}
                <div className="text-xs text-gray-500 mt-1">
                  💡 Solar is optional - many BESS projects work great without it. Only add if you have adequate space and want renewable generation.
                </div>
              </div>
              <div>
                <label className={labelStyle}>Wind (MW)</label>
                <input type="number" step="0.1" value={windMW} onChange={(e) => setWindMW(parseFloat(e.target.value) || 0)} className={inputStyle} />
              </div>
              <div>
                <label className={labelStyle}>Utilization Rate (%)</label>
                <input type="number" step="1" value={utilization * 100} onChange={(e) => setUtilization((parseFloat(e.target.value) || 0) / 100)} className={inputStyle} />
              </div>
              <div>
                <label className={labelStyle}>Use Case</label>
                <select value={useCase} onChange={(e) => setUseCase(e.target.value)} className={inputStyle}>
                  <option>EV Charging Stations</option>
                  <option>Data Centers</option>
                  <option>Manufacturing</option>
                  <option>Commercial Buildings</option>
                  <option>Utilities</option>
                </select>
              </div>
              <div>
                <label className={labelStyle}>Warranty</label>
                <select value={warranty} onChange={(e) => setWarranty(e.target.value)} className={inputStyle}>
                  <option>5 years</option>
                  <option>10 years</option>
                  <option>15 years</option>
                  <option>20 years</option>
                </select>
              </div>
            </div>
          </section>

          {/* PRICING CONFIGURATION PANEL */}
          <PricingConfigurationPanel
            batteryKwh={batteryKwh}
            setBatteryKwh={setBatteryKwh}
            pcsKW={pcsKw}
            setPcsKW={setPcsKw}
            bosPercent={bosPercent}
            setBosPercent={setBosPercent}
            epcPercent={epcPercent}
            setEpcPercent={setEpcPercent}
            tariffPercent={tariffPercent}
            setTariffPercent={setTariffPercent}
            solarMWp={solarMWp}
            setSolarMWp={setSolarMWp}
            solarKwp={solarKwp}
            setSolarKwp={setSolarKwp}
            windMW={windMW}
            setWindMW={setWindMW}
            windKw={windKw}
            setWindKw={setWindKw}
            generatorMW={generatorMW}
            setGeneratorMW={setGeneratorMW}
            genKw={genKw}
            setGenKw={setGenKw}
            onGridPcsFactor={onGridPcsFactor}
            setOnGridPcsFactor={setOnGridPcsFactor}
            offGridPcsFactor={offGridPcsFactor}
            setOffGridPcsFactor={setOffGridPcsFactor}
            powerMW={powerMW}
            standbyHours={standbyHours}
            actualDuration={actualDuration}
            totalMWh={totalMWh}
            annualEnergyMWh={annualEnergyMWh}
            effectiveBatteryKwh={effectiveBatteryKwh}
            handleResetToDefaults={handleResetToDefaults}
            getCurrencySymbol={getCurrencySymbol}
          />
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-8">
          {/* FINANCIAL SUMMARY PANEL */}
          <FinancialSummaryPanel
            currency={currency}
            setCurrency={setCurrency}
            bessCapEx={bessCapEx}
            grandCapEx={grandCapEx}
            annualSavings={annualSavings}
            roiYears={roiYears}
            currentQuoteStatus={currentQuoteStatus}
            getCurrencySymbol={getCurrencySymbol}
            convertCurrency={convertCurrency}
            handleExportWord={handleExportWord}
            setShowCalculationModal={setShowCalculationModal}
            handleExportCalculations={handleExportCalculations}
            setShowAnalytics={setShowAnalytics}
            setShowProfessionalAnalytics={setShowProfessionalAnalytics}
            setShowFinancing={setShowFinancing}
            setShowTemplates={setShowTemplates}
            setShowUtilityRates={setShowUtilityRates}
            setShowQuoteTemplates={setShowQuoteTemplates}
            setShowPricingPresets={setShowPricingPresets}
            setShowReviewWorkflow={setShowReviewWorkflow}
          />

          {/* SYSTEM DETAILS PANEL */}
          <SystemDetailsPanel
            actualDuration={actualDuration}
            standbyHours={standbyHours}
            totalMWh={totalMWh}
            pcsKW={pcsKW}
            annualEnergyMWh={annualEnergyMWh}
          />
        </div>
      </div>
    </>
  );
}