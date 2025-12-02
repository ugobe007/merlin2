/**
 * EV CHARGING WIZARD - Detailed Quote Builder
 * ============================================
 * 
 * Guided wizard for EV charging station owners to build a detailed BESS quote.
 * Pre-populated with data from the EVChargingEnergy landing page calculator.
 * 
 * Uses: 
 * - calculateQuote() from unifiedQuoteCalculator (SINGLE SOURCE OF TRUTH)
 */

import React, { useState, useEffect } from 'react';
import { 
  X, ArrowLeft, ArrowRight, Check, Zap, Battery, Sun, 
  Gauge, DollarSign, Calendar, Download, CheckCircle, AlertCircle, 
  Sparkles, Car, TrendingDown, Phone, FileText, FileSpreadsheet, File, Bolt
} from 'lucide-react';
import { calculateQuote, type QuoteResult } from '@/services/unifiedQuoteCalculator';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';
import merlinImage from '@/assets/images/new_Merlin.png';

// ============================================
// TYPES
// ============================================

export interface EVChargingWizardInputs {
  level2Ports: number;
  dcfcPorts: number;
  hpcPorts: number;
  state: string;
  businessName?: string;
  ownerName?: string;
  email?: string;
  phone?: string;
}

interface EVChargingWizardProps {
  onClose: () => void;
  initialInputs?: Partial<EVChargingWizardInputs>;
  onComplete?: (quoteData: any) => void;
  onRequestConsultation?: () => void;
}

// ============================================
// EV CHARGER SPECIFICATIONS
// ============================================

const EV_CHARGER_SPECS = {
  level2_7kw: { name: 'Level 2 (7.2 kW)', powerKW: 7.2, cost: 2500 },
  level2_19kw: { name: 'Level 2 (19.2 kW)', powerKW: 19.2, cost: 4500 },
  dcfc_50kw: { name: 'DCFC 50 kW', powerKW: 50, cost: 35000 },
  dcfc_150kw: { name: 'DCFC 150 kW', powerKW: 150, cost: 75000 },
  hpc_250kw: { name: 'HPC 250 kW', powerKW: 250, cost: 150000 },
  hpc_350kw: { name: 'HPC 350 kW', powerKW: 350, cost: 200000 },
};

const CHARGER_TYPES = {
  'retail': { name: 'Retail / Shopping Center', dcfcSize: 150, hpcSize: 0, utilizationTarget: 35 },
  'highway': { name: 'Highway Travel Center', dcfcSize: 150, hpcSize: 350, utilizationTarget: 45 },
  'fleet': { name: 'Fleet Depot', dcfcSize: 50, hpcSize: 0, utilizationTarget: 60 },
  'workplace': { name: 'Workplace / Office', dcfcSize: 0, hpcSize: 0, utilizationTarget: 40 },
  'hospitality': { name: 'Hotel / Hospitality', dcfcSize: 50, hpcSize: 0, utilizationTarget: 25 },
};

const STATE_RATES: Record<string, { rate: number; demandCharge: number }> = {
  'California': { rate: 0.22, demandCharge: 28 },
  'Texas': { rate: 0.12, demandCharge: 18 },
  'Florida': { rate: 0.14, demandCharge: 15 },
  'New York': { rate: 0.20, demandCharge: 25 },
  'Arizona': { rate: 0.13, demandCharge: 20 },
  'Nevada': { rate: 0.11, demandCharge: 18 },
  'Colorado': { rate: 0.12, demandCharge: 16 },
  'Washington': { rate: 0.10, demandCharge: 12 },
  'Oregon': { rate: 0.11, demandCharge: 14 },
  'Georgia': { rate: 0.12, demandCharge: 16 },
  'Other': { rate: 0.14, demandCharge: 18 },
};

// ============================================
// WIZARD STEPS
// ============================================

const WIZARD_STEPS = [
  { id: 'station-type', title: 'Station Type', icon: Bolt },
  { id: 'chargers', title: 'Chargers', icon: Gauge },
  { id: 'operations', title: 'Operations', icon: Calendar },
  { id: 'energy-goals', title: 'Energy Goals', icon: Zap },
  { id: 'review', title: 'Your Quote', icon: DollarSign },
];

// ============================================
// MAIN COMPONENT
// ============================================

export default function EVChargingWizard({ 
  onClose, 
  initialInputs = {}, 
  onComplete,
  onRequestConsultation 
}: EVChargingWizardProps) {
  const mergedInputs = {
    level2Ports: initialInputs.level2Ports ?? 4,
    dcfcPorts: initialInputs.dcfcPorts ?? 4,
    hpcPorts: initialInputs.hpcPorts ?? 0,
    state: initialInputs.state ?? 'California',
    businessName: initialInputs.businessName ?? '',
    ownerName: initialInputs.ownerName ?? '',
    email: initialInputs.email ?? '',
    phone: initialInputs.phone ?? '',
  };
  
  const [currentStep, setCurrentStep] = useState(0);
  const [isCalculating, setIsCalculating] = useState(false);
  const [quoteResult, setQuoteResult] = useState<QuoteResult | null>(null);
  
  // Step 1: Station Type
  const [stationType, setStationType] = useState<keyof typeof CHARGER_TYPES>('retail');
  
  // Step 2: Chargers
  const [chargers, setChargers] = useState({
    level2_7kw: mergedInputs.level2Ports,
    level2_19kw: 0,
    dcfc_50kw: 0,
    dcfc_150kw: mergedInputs.dcfcPorts,
    hpc_250kw: mergedInputs.hpcPorts,
    hpc_350kw: 0,
  });
  
  // Step 3: Operations
  const [operations, setOperations] = useState({
    hoursPerDay: 24,
    peakHoursStart: 7,
    peakHoursEnd: 19,
    utilizationPercent: 40,
    hasExistingTransformer: false,
    transformerCapacityKVA: 500,
  });
  
  // Step 4: Energy Goals
  const [energyGoals, setEnergyGoals] = useState({
    primaryGoal: 'demand-reduction' as 'demand-reduction' | 'grid-independence' | 'expansion' | 'all',
    targetDemandReduction: 50,
    interestInSolar: true,
    solarCanopyArea: 10000,
    budgetRange: 'flexible' as 'tight' | 'moderate' | 'flexible',
  });
  
  // Calculated values
  const [calculatedPower, setCalculatedPower] = useState({
    totalConnectedKW: 0,
    peakDemandKW: 0,
    monthlyDemandCharges: 0,
    monthlyEnergyCharges: 0,
  });
  
  // Calculate power based on charger selections
  useEffect(() => {
    const calc = calculateStationPower();
    setCalculatedPower(calc);
  }, [chargers, operations, stationType, mergedInputs]);
  
  function calculateStationPower() {
    let totalConnectedKW = 0;
    
    totalConnectedKW += chargers.level2_7kw * EV_CHARGER_SPECS.level2_7kw.powerKW;
    totalConnectedKW += chargers.level2_19kw * EV_CHARGER_SPECS.level2_19kw.powerKW;
    totalConnectedKW += chargers.dcfc_50kw * EV_CHARGER_SPECS.dcfc_50kw.powerKW;
    totalConnectedKW += chargers.dcfc_150kw * EV_CHARGER_SPECS.dcfc_150kw.powerKW;
    totalConnectedKW += chargers.hpc_250kw * EV_CHARGER_SPECS.hpc_250kw.powerKW;
    totalConnectedKW += chargers.hpc_350kw * EV_CHARGER_SPECS.hpc_350kw.powerKW;
    
    // Concurrency factor (70% typical)
    const peakDemandKW = Math.round(totalConnectedKW * 0.7);
    
    const stateData = STATE_RATES[mergedInputs.state] || STATE_RATES['Other'];
    const monthlyDemandCharges = peakDemandKW * stateData.demandCharge;
    
    const peakHours = operations.peakHoursEnd - operations.peakHoursStart;
    const dailyKWh = peakDemandKW * (operations.utilizationPercent / 100) * peakHours;
    const monthlyKWh = dailyKWh * 30;
    const monthlyEnergyCharges = monthlyKWh * stateData.rate;
    
    return {
      totalConnectedKW: Math.round(totalConnectedKW),
      peakDemandKW,
      monthlyDemandCharges: Math.round(monthlyDemandCharges),
      monthlyEnergyCharges: Math.round(monthlyEnergyCharges),
    };
  }
  
  // Generate final quote
  async function generateQuote() {
    setIsCalculating(true);
    
    try {
      const targetReduction = energyGoals.targetDemandReduction / 100;
      const batteryPowerKW = calculatedPower.peakDemandKW * targetReduction;
      const storageSizeMW = batteryPowerKW / 1000;
      const durationHours = 2; // 2 hours for peak shaving
      
      const stateData = STATE_RATES[mergedInputs.state] || STATE_RATES['Other'];
      
      const result = await calculateQuote({
        storageSizeMW: Math.max(0.1, storageSizeMW),
        durationHours,
        location: mergedInputs.state,
        electricityRate: stateData.rate,
        useCase: 'ev-charging',
        solarMW: energyGoals.interestInSolar ? (energyGoals.solarCanopyArea * 0.015 / 1000) : 0,
      });
      
      setQuoteResult(result);
    } catch (error) {
      console.error('Quote calculation error:', error);
    } finally {
      setIsCalculating(false);
    }
  }
  
  // Download functions
  function downloadQuote() {
    if (!quoteResult) return;
    
    const formatCurrency = (n: number) => `$${Math.round(n).toLocaleString()}`;
    const batteryKW = Math.round(calculatedPower.peakDemandKW * energyGoals.targetDemandReduction / 100);
    
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>EV Charging Station Quote - ${mergedInputs.businessName || 'Your Station'}</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; color: #1e293b; }
    h1 { color: #10b981; border-bottom: 3px solid #10b981; padding-bottom: 10px; }
    h2 { color: #059669; margin-top: 30px; }
    .summary-box { background: linear-gradient(135deg, #ecfdf5, #d1fae5); border: 2px solid #10b981; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center; }
    .savings { font-size: 48px; font-weight: bold; color: #059669; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
    .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; }
    .card h4 { margin: 0 0 10px 0; color: #475569; font-size: 14px; }
    .card .value { font-size: 24px; font-weight: bold; color: #1e293b; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
    th { background: #f1f5f9; }
    .total-row { background: #ecfdf5; font-weight: bold; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 12px; }
  </style>
</head>
<body>
  <h1>⚡ EV Charging Station Battery Storage Quote</h1>
  
  <p><strong>${mergedInputs.businessName || 'EV Charging Station'}</strong><br>
  ${calculatedPower.totalConnectedKW} kW Total Connected Load • ${mergedInputs.state}</p>
  
  <div class="summary-box">
    <div style="font-size: 14px; color: #059669;">ESTIMATED ANNUAL SAVINGS</div>
    <div class="savings">${formatCurrency(quoteResult.financials.annualSavings)}</div>
    <div style="color: #64748b;">per year</div>
  </div>
  
  <div class="grid">
    <div class="card"><h4>Payback Period</h4><div class="value">${quoteResult.financials.paybackYears.toFixed(1)} years</div></div>
    <div class="card"><h4>25-Year ROI</h4><div class="value">${Math.round(quoteResult.financials.roi25Year)}%</div></div>
    <div class="card"><h4>Net Cost (after ITC)</h4><div class="value">${formatCurrency(quoteResult.costs.netCost)}</div></div>
    <div class="card"><h4>Battery Size</h4><div class="value">${batteryKW} kW</div></div>
  </div>
  
  <h2>System Details</h2>
  <table>
    <tr><td>Battery System</td><td>${formatCurrency(quoteResult.equipment.batteries.totalCost)}</td></tr>
    <tr><td>Inverters</td><td>${formatCurrency(quoteResult.equipment.inverters.totalCost)}</td></tr>
    <tr><td>Transformers</td><td>${formatCurrency(quoteResult.equipment.transformers.totalCost)}</td></tr>
    <tr><td>Installation</td><td>${formatCurrency(quoteResult.equipment.installation.totalInstallation)}</td></tr>
    <tr class="total-row"><td>Total Project Cost</td><td>${formatCurrency(quoteResult.costs.totalProjectCost)}</td></tr>
    <tr style="color: #059669;"><td>Federal Tax Credit (30%)</td><td>-${formatCurrency(quoteResult.costs.taxCredit)}</td></tr>
    <tr class="total-row"><td><strong>Net Cost</strong></td><td><strong>${formatCurrency(quoteResult.costs.netCost)}</strong></td></tr>
  </table>
  
  <div class="footer">
    <p>Generated by Merlin Energy • ${new Date().toLocaleString()}</p>
  </div>
</body>
</html>`;
    
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `EVCharging_Quote_${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    onComplete?.({ inputs: mergedInputs, chargers, operations, energyGoals, calculatedPower, quoteResult });
  }

  async function downloadWord() {
    if (!quoteResult) return;
    
    const formatCurrency = (n: number) => `$${Math.round(n).toLocaleString()}`;
    const batteryKW = Math.round(calculatedPower.peakDemandKW * energyGoals.targetDemandReduction / 100);
    
    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({
            children: [new TextRun({ text: '⚡ MERLIN ENERGY', bold: true, size: 48, color: '10B981' })],
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            children: [new TextRun({ text: 'EV CHARGING STATION BATTERY STORAGE QUOTE', bold: true, size: 32, color: '059669' })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),
          new Paragraph({
            children: [new TextRun({ text: `Station: ${mergedInputs.businessName || 'EV Charging Station'}`, size: 24 })],
          }),
          new Paragraph({
            children: [new TextRun({ text: `Location: ${mergedInputs.state}`, size: 24 })],
          }),
          new Paragraph({
            children: [new TextRun({ text: `Connected Load: ${calculatedPower.totalConnectedKW} kW`, size: 24 })],
            spacing: { after: 300 },
          }),
          new Paragraph({
            children: [new TextRun({ text: 'ANNUAL SAVINGS', bold: true, size: 28, color: '059669' })],
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            children: [new TextRun({ text: formatCurrency(quoteResult.financials.annualSavings), bold: true, size: 72, color: '10B981' })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({ children: [
                new TableCell({ children: [new Paragraph('Payback Period')], shading: { fill: 'F3F4F6' } }),
                new TableCell({ children: [new Paragraph(`${quoteResult.financials.paybackYears.toFixed(1)} years`)] }),
              ]}),
              new TableRow({ children: [
                new TableCell({ children: [new Paragraph('25-Year ROI')], shading: { fill: 'F3F4F6' } }),
                new TableCell({ children: [new Paragraph(`${Math.round(quoteResult.financials.roi25Year)}%`)] }),
              ]}),
              new TableRow({ children: [
                new TableCell({ children: [new Paragraph('Battery Size')], shading: { fill: 'F3F4F6' } }),
                new TableCell({ children: [new Paragraph(`${batteryKW} kW`)] }),
              ]}),
              new TableRow({ children: [
                new TableCell({ children: [new Paragraph('Total Project Cost')], shading: { fill: 'F3F4F6' } }),
                new TableCell({ children: [new Paragraph(formatCurrency(quoteResult.costs.totalProjectCost))] }),
              ]}),
              new TableRow({ children: [
                new TableCell({ children: [new Paragraph('Federal Tax Credit (30%)')], shading: { fill: 'ECFDF5' } }),
                new TableCell({ children: [new Paragraph(`-${formatCurrency(quoteResult.costs.taxCredit)}`)] }),
              ]}),
              new TableRow({ children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Net Cost', bold: true })] })], shading: { fill: 'D1FAE5' } }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: formatCurrency(quoteResult.costs.netCost), bold: true, color: '059669' })] })] }),
              ]}),
            ],
          }),
        ],
      }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `EVCharging_Quote_${new Date().toISOString().split('T')[0]}.docx`);
  }

  function downloadExcel() {
    if (!quoteResult) return;
    
    const batteryKW = Math.round(calculatedPower.peakDemandKW * energyGoals.targetDemandReduction / 100);
    
    const csvRows = [
      ['MERLIN ENERGY - EV Charging Station Quote'],
      [''],
      ['Quote Date', new Date().toLocaleDateString()],
      [''],
      ['STATION INFORMATION'],
      ['Business Name', mergedInputs.businessName || 'EV Charging Station'],
      ['Location', mergedInputs.state],
      ['Total Connected Load (kW)', calculatedPower.totalConnectedKW],
      ['Peak Demand (kW)', calculatedPower.peakDemandKW],
      [''],
      ['CHARGER CONFIGURATION'],
      ['Level 2 (7.2 kW)', chargers.level2_7kw],
      ['Level 2 (19.2 kW)', chargers.level2_19kw],
      ['DCFC 50 kW', chargers.dcfc_50kw],
      ['DCFC 150 kW', chargers.dcfc_150kw],
      ['HPC 250 kW', chargers.hpc_250kw],
      ['HPC 350 kW', chargers.hpc_350kw],
      [''],
      ['BATTERY SYSTEM'],
      ['Battery Size (kW)', batteryKW],
      ['Battery Cost', Math.round(quoteResult.equipment.batteries.totalCost)],
      [''],
      ['FINANCIALS'],
      ['Total Project Cost', Math.round(quoteResult.costs.totalProjectCost)],
      ['Federal Tax Credit', -Math.round(quoteResult.costs.taxCredit)],
      ['Net Cost', Math.round(quoteResult.costs.netCost)],
      ['Annual Savings', Math.round(quoteResult.financials.annualSavings)],
      ['Payback (years)', quoteResult.financials.paybackYears.toFixed(1)],
      ['25-Year ROI (%)', Math.round(quoteResult.financials.roi25Year)],
    ];
    
    const csvContent = csvRows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    saveAs(blob, `EVCharging_Quote_${new Date().toISOString().split('T')[0]}.csv`);
  }

  // Run quote calculation when reaching final step
  useEffect(() => {
    if (currentStep === WIZARD_STEPS.length - 1 && !quoteResult) {
      generateQuote();
    }
  }, [currentStep]);
  
  const canProceed = () => {
    switch (currentStep) {
      case 0: return true;
      case 1: return calculatedPower.totalConnectedKW > 0;
      case 2: return operations.hoursPerDay > 0;
      case 3: return true;
      case 4: return quoteResult !== null;
      default: return true;
    }
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-gradient-to-br from-emerald-900 via-teal-800 to-cyan-900 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-emerald-400/40 shadow-2xl shadow-emerald-500/20">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-900/50 via-teal-900/30 to-emerald-900/50 px-6 py-4 border-b border-emerald-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={merlinImage} alt="Merlin" className="w-10 h-10" />
              <div>
                <h2 className="text-xl font-bold text-white">Build Your EV Charging Quote</h2>
                <p className="text-sm text-emerald-300/70">Step {currentStep + 1} of {WIZARD_STEPS.length}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <X className="w-5 h-5 text-white/70" />
            </button>
          </div>
          
          {/* Progress Steps */}
          <div className="flex items-center gap-2 mt-4">
            {WIZARD_STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStep;
              const isComplete = index < currentStep;
              
              return (
                <div key={step.id} className="flex items-center flex-1">
                  <button
                    onClick={() => index < currentStep && setCurrentStep(index)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all ${
                      isActive 
                        ? 'bg-emerald-500 text-white' 
                        : isComplete 
                          ? 'bg-emerald-500/20 text-emerald-400 cursor-pointer hover:bg-emerald-500/30'
                          : 'bg-white/5 text-white/40'
                    }`}
                  >
                    {isComplete ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                    <span className="text-xs font-medium hidden sm:inline">{step.title}</span>
                  </button>
                  {index < WIZARD_STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-2 ${isComplete ? 'bg-emerald-500/50' : 'bg-white/10'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Step 0: Station Type */}
          {currentStep === 0 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white mb-2">What type of charging station?</h3>
                <p className="text-emerald-200/70 text-sm">This helps us recommend optimal charger mix and battery sizing.</p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                {Object.entries(CHARGER_TYPES).map(([key, type]) => (
                  <button
                    key={key}
                    onClick={() => setStationType(key as keyof typeof CHARGER_TYPES)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      stationType === key 
                        ? 'border-emerald-500 bg-emerald-500/20' 
                        : 'border-white/10 hover:border-white/30 bg-white/5'
                    }`}
                  >
                    <p className="font-bold text-white">{type.name}</p>
                    <p className="text-sm text-emerald-200/70 mt-1">
                      {type.hpcSize > 0 ? `DCFC + HPC up to ${type.hpcSize} kW` : 
                       type.dcfcSize > 0 ? `DCFC up to ${type.dcfcSize} kW` : 
                       'Level 2 destination charging'}
                    </p>
                    <p className="text-xs text-emerald-400 mt-2">{type.utilizationTarget}% typical utilization</p>
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Step 1: Chargers */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white mb-2">Configure your chargers</h3>
                <p className="text-emerald-200/70 text-sm">Select the types and quantities of chargers.</p>
              </div>
              
              {/* Power Summary */}
              <div className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-xl p-4 border border-emerald-400/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-emerald-200">Total Connected Load</p>
                    <p className="text-3xl font-bold text-white">{calculatedPower.totalConnectedKW} kW</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-teal-200">Peak Demand (70%)</p>
                    <p className="text-2xl font-bold text-teal-400">{calculatedPower.peakDemandKW} kW</p>
                  </div>
                </div>
              </div>
              
              {/* Charger Categories */}
              <div className="space-y-4">
                {/* Level 2 */}
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <h4 className="font-bold text-white mb-3 flex items-center gap-2">
                    <Car className="w-5 h-5 text-blue-400" />
                    Level 2 Chargers (Destination)
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-emerald-200">7.2 kW Ports</label>
                      <input
                        type="number"
                        min={0}
                        max={50}
                        value={chargers.level2_7kw}
                        onChange={(e) => setChargers({...chargers, level2_7kw: parseInt(e.target.value) || 0})}
                        className="w-full bg-white/10 rounded px-3 py-2 text-white mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-emerald-200">19.2 kW Ports</label>
                      <input
                        type="number"
                        min={0}
                        max={30}
                        value={chargers.level2_19kw}
                        onChange={(e) => setChargers({...chargers, level2_19kw: parseInt(e.target.value) || 0})}
                        className="w-full bg-white/10 rounded px-3 py-2 text-white mt-1"
                      />
                    </div>
                  </div>
                </div>
                
                {/* DC Fast Charging */}
                <div className="bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/30">
                  <h4 className="font-bold text-white mb-3 flex items-center gap-2">
                    <Bolt className="w-5 h-5 text-emerald-400" />
                    DC Fast Chargers
                    <span className="text-xs bg-emerald-500/20 px-2 py-0.5 rounded text-emerald-300">High Demand Impact</span>
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-emerald-200">50 kW DCFC</label>
                      <input
                        type="number"
                        min={0}
                        max={20}
                        value={chargers.dcfc_50kw}
                        onChange={(e) => setChargers({...chargers, dcfc_50kw: parseInt(e.target.value) || 0})}
                        className="w-full bg-white/10 rounded px-3 py-2 text-white mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-emerald-200">150 kW DCFC</label>
                      <input
                        type="number"
                        min={0}
                        max={16}
                        value={chargers.dcfc_150kw}
                        onChange={(e) => setChargers({...chargers, dcfc_150kw: parseInt(e.target.value) || 0})}
                        className="w-full bg-white/10 rounded px-3 py-2 text-white mt-1"
                      />
                    </div>
                  </div>
                </div>
                
                {/* High Power Charging */}
                <div className="bg-amber-500/10 rounded-xl p-4 border border-amber-500/30">
                  <h4 className="font-bold text-white mb-3 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-400" />
                    High Power Chargers (HPC)
                    <span className="text-xs bg-amber-500/20 px-2 py-0.5 rounded text-amber-300">Maximum Demand Impact</span>
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-amber-200">250 kW HPC</label>
                      <input
                        type="number"
                        min={0}
                        max={12}
                        value={chargers.hpc_250kw}
                        onChange={(e) => setChargers({...chargers, hpc_250kw: parseInt(e.target.value) || 0})}
                        className="w-full bg-white/10 rounded px-3 py-2 text-white mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-amber-200">350 kW HPC</label>
                      <input
                        type="number"
                        min={0}
                        max={8}
                        value={chargers.hpc_350kw}
                        onChange={(e) => setChargers({...chargers, hpc_350kw: parseInt(e.target.value) || 0})}
                        className="w-full bg-white/10 rounded px-3 py-2 text-white mt-1"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Cost Impact */}
              <div className="bg-red-500/10 rounded-xl p-4 border border-red-400/30">
                <h4 className="font-medium text-red-300 mb-2">Monthly Demand Charge Impact</h4>
                <p className="text-3xl font-bold text-red-400">${calculatedPower.monthlyDemandCharges.toLocaleString()}</p>
                <p className="text-sm text-red-200/60">Based on ${STATE_RATES[mergedInputs.state]?.demandCharge || 18}/kW demand charge</p>
              </div>
            </div>
          )}
          
          {/* Step 2: Operations */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white mb-2">Station Operations</h3>
                <p className="text-emerald-200/70 text-sm">This helps optimize battery cycling and savings.</p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm text-emerald-200 mb-2">Hours Open Per Day</label>
                  <input
                    type="range"
                    min="12"
                    max="24"
                    value={operations.hoursPerDay}
                    onChange={(e) => setOperations({...operations, hoursPerDay: parseInt(e.target.value)})}
                    className="w-full accent-emerald-500"
                  />
                  <p className="text-center text-white font-bold">{operations.hoursPerDay} hours/day</p>
                </div>
                
                <div>
                  <label className="block text-sm text-emerald-200 mb-2">Average Utilization</label>
                  <input
                    type="range"
                    min="10"
                    max="80"
                    step="5"
                    value={operations.utilizationPercent}
                    onChange={(e) => setOperations({...operations, utilizationPercent: parseInt(e.target.value)})}
                    className="w-full accent-emerald-500"
                  />
                  <p className="text-center text-white font-bold">{operations.utilizationPercent}% utilization</p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm text-emerald-200 mb-2">Peak Usage Hours</label>
                <div className="flex items-center gap-4">
                  <select
                    value={operations.peakHoursStart}
                    onChange={(e) => setOperations({...operations, peakHoursStart: parseInt(e.target.value)})}
                    className="flex-1 bg-white/10 rounded-lg px-3 py-2 text-white"
                  >
                    {Array.from({length: 12}, (_, i) => i + 6).map((h) => (
                      <option key={h} value={h}>{h > 12 ? h - 12 : h} {h >= 12 ? 'PM' : 'AM'}</option>
                    ))}
                  </select>
                  <span className="text-white">to</span>
                  <select
                    value={operations.peakHoursEnd}
                    onChange={(e) => setOperations({...operations, peakHoursEnd: parseInt(e.target.value)})}
                    className="flex-1 bg-white/10 rounded-lg px-3 py-2 text-white"
                  >
                    {Array.from({length: 12}, (_, i) => i + 12).map((h) => (
                      <option key={h} value={h}>{h > 12 ? h - 12 : h} PM</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={operations.hasExistingTransformer}
                    onChange={(e) => setOperations({...operations, hasExistingTransformer: e.target.checked})}
                    className="w-5 h-5 accent-emerald-500"
                  />
                  <div>
                    <span className="text-white font-medium">Existing Transformer</span>
                    <p className="text-sm text-emerald-200/60">Battery can help avoid costly utility upgrades</p>
                  </div>
                </label>
                
                {operations.hasExistingTransformer && (
                  <div className="mt-4">
                    <label className="text-sm text-emerald-200">Current Transformer Capacity (kVA)</label>
                    <input
                      type="number"
                      min={100}
                      max={5000}
                      value={operations.transformerCapacityKVA}
                      onChange={(e) => setOperations({...operations, transformerCapacityKVA: parseInt(e.target.value) || 500})}
                      className="w-full bg-white/10 rounded px-3 py-2 text-white mt-1"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Step 3: Energy Goals */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white mb-2">Energy Goals</h3>
                <p className="text-emerald-200/70 text-sm">What do you want to achieve with battery storage?</p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { id: 'demand-reduction', label: 'Cut Demand Charges', desc: 'Reduce peak demand 40-60%', icon: TrendingDown },
                  { id: 'grid-independence', label: 'Grid Independence', desc: 'Add capacity without utility upgrades', icon: Gauge },
                  { id: 'expansion', label: 'Expand Chargers', desc: 'Add more chargers on same service', icon: Bolt },
                  { id: 'all', label: 'All of the Above', desc: 'Maximum value from storage', icon: Sparkles },
                ].map((goal) => {
                  const Icon = goal.icon;
                  return (
                    <button
                      key={goal.id}
                      onClick={() => setEnergyGoals({...energyGoals, primaryGoal: goal.id as any})}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        energyGoals.primaryGoal === goal.id 
                          ? 'border-emerald-500 bg-emerald-500/20' 
                          : 'border-white/10 hover:border-white/30 bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-6 h-6 text-emerald-400" />
                        <div>
                          <p className="font-bold text-white">{goal.label}</p>
                          <p className="text-xs text-emerald-200/70">{goal.desc}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
              
              <div>
                <label className="block text-sm text-emerald-200 mb-2">
                  Target Demand Reduction: <span className="text-emerald-400 font-bold">{energyGoals.targetDemandReduction}%</span>
                </label>
                <input
                  type="range"
                  min={20}
                  max={80}
                  step={5}
                  value={energyGoals.targetDemandReduction}
                  onChange={(e) => setEnergyGoals({...energyGoals, targetDemandReduction: parseInt(e.target.value)})}
                  className="w-full accent-emerald-500"
                />
              </div>
              
              <div className="bg-amber-500/10 rounded-xl p-4 border border-amber-500/30">
                <label className="flex items-center gap-3 mb-3">
                  <input
                    type="checkbox"
                    checked={energyGoals.interestInSolar}
                    onChange={(e) => setEnergyGoals({...energyGoals, interestInSolar: e.target.checked})}
                    className="w-5 h-5 accent-amber-500"
                  />
                  <div>
                    <span className="text-white font-medium">Add Solar Canopies</span>
                    <p className="text-sm text-amber-200/60">Shade for vehicles + free power</p>
                  </div>
                </label>
                
                {energyGoals.interestInSolar && (
                  <div>
                    <label className="text-sm text-amber-200">Available Canopy Area (sq ft)</label>
                    <input
                      type="range"
                      min={2000}
                      max={50000}
                      step={1000}
                      value={energyGoals.solarCanopyArea}
                      onChange={(e) => setEnergyGoals({...energyGoals, solarCanopyArea: parseInt(e.target.value)})}
                      className="w-full accent-amber-500"
                    />
                    <p className="text-center text-white font-bold">
                      {energyGoals.solarCanopyArea.toLocaleString()} sq ft
                      <span className="text-amber-400 ml-2">(~{Math.round(energyGoals.solarCanopyArea * 0.015)} kW)</span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Step 4: Review Quote */}
          {currentStep === 4 && (
            <div className="space-y-6">
              {isCalculating ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full mb-4" />
                  <p className="text-white font-bold">Calculating your custom quote...</p>
                </div>
              ) : quoteResult ? (
                <>
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-white mb-2">Your EV Charging Station Quote</h3>
                    <p className="text-emerald-200/70">{calculatedPower.totalConnectedKW} kW Station • {mergedInputs.state}</p>
                  </div>
                  
                  {/* Main Savings Card */}
                  <div className="bg-gradient-to-br from-emerald-500/30 via-teal-500/20 to-cyan-500/30 rounded-2xl p-6 border-2 border-emerald-400/50 text-center">
                    <p className="text-emerald-200 uppercase tracking-widest text-sm font-bold mb-2">⚡ Annual Savings</p>
                    <p className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-teal-300">
                      ${Math.round(quoteResult.financials.annualSavings).toLocaleString()}
                    </p>
                  </div>
                  
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white/10 rounded-xl p-4 text-center">
                      <p className="text-2xl font-bold text-emerald-400">{quoteResult.financials.paybackYears.toFixed(1)}</p>
                      <p className="text-xs text-emerald-200/70">Year Payback</p>
                    </div>
                    <div className="bg-white/10 rounded-xl p-4 text-center">
                      <p className="text-2xl font-bold text-teal-400">{Math.round(quoteResult.financials.roi25Year)}%</p>
                      <p className="text-xs text-teal-200/70">25-Year ROI</p>
                    </div>
                    <div className="bg-white/10 rounded-xl p-4 text-center">
                      <p className="text-2xl font-bold text-cyan-400">{Math.round(calculatedPower.peakDemandKW * energyGoals.targetDemandReduction / 100)} kW</p>
                      <p className="text-xs text-cyan-200/70">Battery Size</p>
                    </div>
                    <div className="bg-white/10 rounded-xl p-4 text-center">
                      <p className="text-2xl font-bold text-amber-400">${Math.round(quoteResult.costs.netCost).toLocaleString()}</p>
                      <p className="text-xs text-amber-200/70">Net Cost</p>
                    </div>
                  </div>
                  
                  {/* Cost Breakdown */}
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <h4 className="font-bold text-white mb-3">Investment Summary</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-emerald-200/70">Equipment Cost</span>
                        <span className="text-white">${Math.round(quoteResult.costs.equipmentCost).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-emerald-200/70">Installation</span>
                        <span className="text-white">${Math.round(quoteResult.costs.installationCost).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between py-2 border-t border-white/10">
                        <span className="text-white font-medium">Total Project Cost</span>
                        <span className="text-white font-bold">${Math.round(quoteResult.costs.totalProjectCost).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-emerald-400">
                        <span>Federal Tax Credit (30%)</span>
                        <span>-${Math.round(quoteResult.costs.taxCredit).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between py-2 bg-emerald-500/20 rounded-lg px-3 text-lg">
                        <span className="text-emerald-300 font-bold">Net Cost</span>
                        <span className="text-emerald-400 font-black">${Math.round(quoteResult.costs.netCost).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Download Options */}
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <h4 className="font-bold text-white mb-3">Download Your Quote</h4>
                    <div className="grid grid-cols-3 gap-3">
                      <button onClick={downloadWord} className="flex flex-col items-center gap-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30 text-white py-4 rounded-xl transition-all hover:scale-105">
                        <FileText className="w-8 h-8 text-blue-400" />
                        <span className="text-sm">Word</span>
                      </button>
                      <button onClick={downloadExcel} className="flex flex-col items-center gap-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/30 text-white py-4 rounded-xl transition-all hover:scale-105">
                        <FileSpreadsheet className="w-8 h-8 text-emerald-400" />
                        <span className="text-sm">Excel</span>
                      </button>
                      <button onClick={downloadQuote} className="flex flex-col items-center gap-2 bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 text-white py-4 rounded-xl transition-all hover:scale-105">
                        <File className="w-8 h-8 text-red-400" />
                        <span className="text-sm">HTML</span>
                      </button>
                    </div>
                  </div>
                  
                  {/* CTA */}
                  {onRequestConsultation && (
                    <button
                      onClick={onRequestConsultation}
                      className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:via-teal-500 hover:to-cyan-500 text-white py-4 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all hover:scale-105 flex items-center justify-center gap-2"
                    >
                      <Phone className="w-5 h-5" />
                      Schedule a Consultation
                    </button>
                  )}
                </>
              ) : (
                <div className="text-center py-12 text-red-400">
                  <AlertCircle className="w-12 h-12 mx-auto mb-4" />
                  <p>Error calculating quote. Please try again.</p>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Footer Navigation */}
        <div className="border-t border-white/10 px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => currentStep === 0 ? onClose() : setCurrentStep(currentStep - 1)}
            className="flex items-center gap-2 px-4 py-2 text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {currentStep === 0 ? 'Cancel' : 'Back'}
          </button>
          
          {currentStep < WIZARD_STEPS.length - 1 && (
            <button
              onClick={() => setCurrentStep(currentStep + 1)}
              disabled={!canProceed()}
              className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:from-gray-500 disabled:to-gray-600 text-white rounded-lg font-bold transition-all"
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
