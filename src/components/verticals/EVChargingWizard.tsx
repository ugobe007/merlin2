/**
 * EV CHARGING WIZARD - Smart Quote Builder
 * =========================================
 * 
 * USER-FRIENDLY wizard for EV charging station planning.
 * Designed for business owners (hotels, hospitals, offices) who want
 * to add EV charging without needing technical expertise.
 * 
 * Design Philosophy:
 * - Ask simple questions, provide smart recommendations
 * - "What kind of business?" not "How many Level 2 vs DCFC ports?"
 * - Auto-calculate optimal setup based on business type and scale
 * - Show clear ROI and savings upfront
 * - Hide complexity behind "Customize" options for pros
 * 
 * DER Integration (Dec 2025):
 * - Grid services revenue shown as "bonus savings" (not technical jargon)
 * - V2G explained as "Turn parked EVs into backup power"
 * 
 * Uses: 
 * - calculateQuote() from unifiedQuoteCalculator (SINGLE SOURCE OF TRUTH)
 * - evChargingCalculations.ts for charger specs (SINGLE SOURCE OF TRUTH)
 */

import React, { useState, useEffect } from 'react';
import { 
  X, ArrowLeft, ArrowRight, Check, Zap, Battery, Sun, 
  Gauge, DollarSign, Calendar, Download, CheckCircle, AlertCircle, 
  Sparkles, Car, TrendingDown, Phone, FileText, FileSpreadsheet, File, Bolt,
  BarChart3, Network, Building, Globe, Hotel, Hospital, GraduationCap, 
  Plane, ShoppingBag, Warehouse, Coffee, Settings, ChevronDown, ChevronUp,
  Users, ParkingCircle, Clock, Leaf, Trophy, Shield, HelpCircle
} from 'lucide-react';
import { calculateQuote, type QuoteResult } from '@/services/unifiedQuoteCalculator';
import { 
  EV_CHARGER_SPECS, 
  GRID_SERVICES, 
  V2G_CONFIG, 
  PROSUMER_MODES,
  calculateEVHubPower,
  calculateEVHubCosts,
  calculateEVHubBESSSize,
  calculateGridServicesRevenue,
  calculateV2GPotential,
  type EVChargerConfig,
} from '@/services/evChargingCalculations';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';
import merlinImage from '@/assets/images/new_Merlin.png';
import { KeyMetricsDashboard, CO2Badge } from '@/components/shared/KeyMetricsDashboard';
import { quickCO2Estimate, calculateEVChargingCO2Impact } from '@/services/environmentalMetricsService';

// ============================================
// CONCIERGE SERVICE TIERS
// ============================================

const CONCIERGE_TIERS = {
  standard: {
    name: 'Quick Quote',
    description: 'Self-service quote builder',
    icon: '⚡',
    features: ['Instant recommendations', 'Download quote', 'Basic support'],
    color: 'emerald',
  },
  pro: {
    name: 'Concierge Pro',
    description: 'White-glove service with dedicated expert',
    icon: '👑',
    features: ['Dedicated energy advisor', 'Custom financing options', 'Site assessment', 'Priority installation', 'Extended warranty'],
    color: 'amber',
    badge: 'Premium',
  },
} as const;

// ============================================
// USER-FRIENDLY BUSINESS TYPES
// ============================================

const BUSINESS_TYPES = {
  hotel: {
    name: 'Hotel / Resort',
    icon: Hotel,
    description: 'Guest amenity & sustainability',
    examples: 'Marriott, Hilton, boutique hotels',
    defaultChargers: { level2: 8, dcfc: 0 },
    avgDwellTime: '8+ hours (overnight)',
    recommendation: 'Level 2 chargers are perfect - guests charge while they sleep!',
    gridServicesNote: 'Earn extra revenue during low-occupancy periods',
  },
  hospital: {
    name: 'Hospital / Healthcare',
    icon: Hospital,
    description: 'Staff, patients & visitors',
    examples: 'Hospitals, clinics, medical centers',
    defaultChargers: { level2: 12, dcfc: 2 },
    avgDwellTime: '2-8 hours',
    recommendation: 'Mix of Level 2 for staff + fast chargers for visitors',
    gridServicesNote: 'Battery backup doubles as emergency power!',
  },
  office: {
    name: 'Office Building',
    icon: Building,
    description: 'Employee benefit & tenant attraction',
    examples: 'Corporate HQ, office parks, co-working',
    defaultChargers: { level2: 10, dcfc: 0 },
    avgDwellTime: '8+ hours (workday)',
    recommendation: 'Level 2 chargers - employees charge during work hours',
    gridServicesNote: 'Reduce demand charges during peak office hours',
  },
  retail: {
    name: 'Retail / Shopping',
    icon: ShoppingBag,
    description: 'Customer convenience & dwell time',
    examples: 'Malls, grocery stores, shopping centers',
    defaultChargers: { level2: 4, dcfc: 4 },
    avgDwellTime: '30 min - 2 hours',
    recommendation: 'Fast chargers attract customers who shop while charging',
    gridServicesNote: 'Offset high electricity costs during store hours',
  },
  university: {
    name: 'College / University',
    icon: GraduationCap,
    description: 'Students, faculty & sustainability goals',
    examples: 'Universities, community colleges, schools',
    defaultChargers: { level2: 16, dcfc: 2 },
    avgDwellTime: '4-8 hours',
    recommendation: 'Mostly Level 2 for all-day parking, some fast for visitors',
    gridServicesNote: 'Great for campus sustainability initiatives',
  },
  airport: {
    name: 'Airport / Transit',
    icon: Plane,
    description: 'Travelers, employees & rideshare',
    examples: 'Airports, train stations, bus depots',
    defaultChargers: { level2: 20, dcfc: 8 },
    avgDwellTime: '1-7 days',
    recommendation: 'High capacity with fast charging for rideshare pickup',
    gridServicesNote: 'Large-scale DER opportunity with fleet charging',
  },
  fleet: {
    name: 'Fleet / Logistics',
    icon: Warehouse,
    description: 'Delivery, service & company vehicles',
    examples: 'Delivery hubs, service companies, rental',
    defaultChargers: { level2: 8, dcfc: 8 },
    avgDwellTime: 'Overnight + quick top-ups',
    recommendation: 'Fast chargers for daytime, Level 2 for overnight',
    gridServicesNote: 'Fleet batteries can earn V2G revenue when parked',
  },
  restaurant: {
    name: 'Restaurant / Cafe',
    icon: Coffee,
    description: 'Dine & charge experience',
    examples: 'Restaurants, cafes, drive-thrus',
    defaultChargers: { level2: 2, dcfc: 2 },
    avgDwellTime: '30 min - 2 hours',
    recommendation: 'Fast chargers match dining time perfectly',
    gridServicesNote: 'Attract eco-conscious customers',
  },
} as const;

// Scale options in plain language
const SCALE_OPTIONS = {
  starter: {
    name: 'Getting Started',
    description: '2-4 chargers',
    parkingSpots: '< 50 spots',
    multiplier: 0.5,
    icon: '🌱',
  },
  growing: {
    name: 'Growing',
    description: '5-10 chargers', 
    parkingSpots: '50-200 spots',
    multiplier: 1.0,
    icon: '🌿',
  },
  established: {
    name: 'Established',
    description: '11-20 chargers',
    parkingSpots: '200-500 spots',
    multiplier: 2.0,
    icon: '🌳',
  },
  enterprise: {
    name: 'Enterprise',
    description: '20+ chargers',
    parkingSpots: '500+ spots',
    multiplier: 3.0,
    icon: '🏢',
  },
} as const;

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
// STATION TYPES (Use Cases)
// ============================================

const CHARGER_TYPES = {
  'retail': { name: 'Retail / Shopping Center', dcfcSize: 150, hpcSize: 0, utilizationTarget: 35, icon: '🛒' },
  'highway': { name: 'Highway Travel Center', dcfcSize: 150, hpcSize: 350, utilizationTarget: 45, icon: '🛣️' },
  'fleet': { name: 'Fleet Depot', dcfcSize: 50, hpcSize: 0, utilizationTarget: 60, icon: '🚚' },
  'workplace': { name: 'Workplace / Office', dcfcSize: 0, hpcSize: 0, utilizationTarget: 40, icon: '🏢' },
  'hospitality': { name: 'Hotel / Hospitality', dcfcSize: 50, hpcSize: 0, utilizationTarget: 25, icon: '🏨' },
  'multifamily': { name: 'Multifamily / Residential', dcfcSize: 0, hpcSize: 0, utilizationTarget: 50, icon: '🏠' },
  'municipal': { name: 'Municipal / Public', dcfcSize: 150, hpcSize: 0, utilizationTarget: 30, icon: '🏛️' },
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
// WIZARD STEPS - Simple & Clear
// ============================================

const WIZARD_STEPS = [
  { id: 'business', title: 'Your Business', icon: Building },
  { id: 'scale', title: 'Size & Location', icon: ParkingCircle },
  { id: 'recommendation', title: 'Our Recommendation', icon: Sparkles },
  { id: 'quote', title: 'Your Savings', icon: DollarSign },
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
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Concierge Tier Selection
  const [conciergeTier, setConciergeTier] = useState<keyof typeof CONCIERGE_TIERS>('standard');
  
  // Step 1: Business Type (Simple!)
  const [businessType, setBusinessType] = useState<keyof typeof BUSINESS_TYPES>('hotel');
  const [businessName, setBusinessName] = useState(mergedInputs.businessName);
  
  // Step 2: Scale & Location (Simple!)
  const [scale, setScale] = useState<keyof typeof SCALE_OPTIONS>('growing');
  const [state, setState] = useState(mergedInputs.state);
  
  // Step 3: Smart Recommendation (Auto-calculated, with optional customize)
  const [wantsBatteryStorage, setWantsBatteryStorage] = useState(true);
  const [wantsSolarCanopy, setWantsSolarCanopy] = useState(true);
  const [wantsGridServices, setWantsGridServices] = useState(false); // Default off - it's advanced
  
  // Advanced customization (hidden by default)
  const [customChargers, setCustomChargers] = useState({
    level2: 0,
    dcfc: 0,
  });
  
  // ============================================
  // SMART RECOMMENDATION ENGINE
  // ============================================
  
  // Auto-calculate recommended setup based on business type and scale
  const getSmartRecommendation = () => {
    const business = BUSINESS_TYPES[businessType];
    const scaleConfig = SCALE_OPTIONS[scale];
    
    // Calculate charger counts based on business defaults * scale multiplier
    const level2Count = Math.round(business.defaultChargers.level2 * scaleConfig.multiplier);
    const dcfcCount = Math.round(business.defaultChargers.dcfc * scaleConfig.multiplier);
    
    // Use custom values if user has modified them
    const finalLevel2 = showAdvanced && customChargers.level2 > 0 ? customChargers.level2 : Math.max(2, level2Count);
    const finalDCFC = showAdvanced && customChargers.dcfc > 0 ? customChargers.dcfc : dcfcCount;
    
    // Calculate power requirements
    const level2Power = finalLevel2 * 11; // Average Level 2 is 11kW
    const dcfcPower = finalDCFC * 100; // Average DCFC is 100kW  
    const totalPowerKW = level2Power + dcfcPower;
    const peakDemandKW = Math.round(totalPowerKW * 0.7); // 70% concurrency
    
    // Get state electricity rates
    const stateData = STATE_RATES[state] || STATE_RATES['Other'];
    
    // Calculate monthly costs WITHOUT battery
    const peakHours = 12; // Typical peak window
    const dailyKWh = peakDemandKW * 0.4 * peakHours; // 40% avg utilization
    const monthlyKWh = dailyKWh * 30;
    const monthlyDemandCharges = peakDemandKW * stateData.demandCharge;
    const monthlyEnergyCharges = monthlyKWh * stateData.rate;
    const monthlyElectricityCost = monthlyDemandCharges + monthlyEnergyCharges;
    
    // Recommended BESS size (cover 50% of peak demand)
    const bessKW = wantsBatteryStorage ? Math.round(peakDemandKW * 0.5) : 0;
    const bessKWh = bessKW * 2; // 2-hour duration
    
    // Solar canopy estimate (if wanted)
    const solarKW = wantsSolarCanopy ? Math.round(totalPowerKW * 0.3) : 0; // 30% of load
    
    // Savings from BESS (demand charge reduction)
    const demandChargeSavings = wantsBatteryStorage ? monthlyDemandCharges * 0.4 : 0; // 40% reduction
    const solarSavings = wantsSolarCanopy ? solarKW * 150 : 0; // ~$150/kW/year
    const gridServicesSavings = wantsGridServices ? bessKW * 100 : 0; // ~$100/kW/year
    
    const annualSavings = (demandChargeSavings * 12) + solarSavings + gridServicesSavings;
    
    return {
      chargers: {
        level2: finalLevel2,
        dcfc: finalDCFC,
        totalPowerKW,
        peakDemandKW,
      },
      costs: {
        monthlyElectricity: monthlyElectricityCost,
        monthlyDemandCharges,
      },
      recommendation: {
        bessKW,
        bessKWh,
        solarKW,
      },
      savings: {
        monthly: Math.round(annualSavings / 12),
        annual: Math.round(annualSavings),
        demandChargeReduction: Math.round(demandChargeSavings * 12),
        solarOffset: Math.round(solarSavings),
        gridServices: Math.round(gridServicesSavings),
      },
      businessInsight: business.recommendation,
      gridServicesNote: business.gridServicesNote,
      dwellTime: business.avgDwellTime,
    };
  };
  
  const recommendation = getSmartRecommendation();
  
  // Calculated values for compatibility
  const calculatedPower = {
    totalConnectedKW: recommendation.chargers.totalPowerKW,
    peakDemandKW: recommendation.chargers.peakDemandKW,
    monthlyDemandCharges: recommendation.costs.monthlyDemandCharges,
    monthlyEnergyCharges: recommendation.costs.monthlyElectricity - recommendation.costs.monthlyDemandCharges,
  };
  
  // Generate final quote using the smart recommendation
  async function generateQuote() {
    setIsCalculating(true);
    
    try {
      const storageSizeMW = recommendation.recommendation.bessKW / 1000;
      const durationHours = 2; // 2 hours for peak shaving
      
      const stateData = STATE_RATES[state] || STATE_RATES['Other'];
      
      const result = await calculateQuote({
        storageSizeMW: Math.max(0.1, storageSizeMW),
        durationHours,
        location: state,
        electricityRate: stateData.rate,
        useCase: 'ev-charging',
        solarMW: wantsSolarCanopy ? (recommendation.recommendation.solarKW / 1000) : 0,
      });
      
      setQuoteResult(result);
    } catch (error) {
      console.error('Quote calculation error:', error);
    } finally {
      setIsCalculating(false);
    }
  }
  
  // Trigger quote generation when reaching the final step
  useEffect(() => {
    if (currentStep === WIZARD_STEPS.length - 1) {
      generateQuote();
    }
  }, [currentStep]);
  
  // canProceed validation
  const canProceed = () => {
    switch (currentStep) {
      case 0: return true; // Business type
      case 1: return true; // Scale & location
      case 2: return true; // Recommendation (can always proceed)
      case 3: return quoteResult !== null; // Quote loaded
      default: return true;
    }
  };
  
  // Download functions
  function downloadQuote() {
    if (!quoteResult) return;
    
    const formatCurrency = (n: number) => `$${Math.round(n).toLocaleString()}`;
    const batteryKW = recommendation.recommendation.bessKW;
    
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
    
    onComplete?.({ inputs: mergedInputs, recommendation, calculatedPower, quoteResult });
  }

  async function downloadWord() {
    if (!quoteResult) return;
    
    const formatCurrency = (n: number) => `$${Math.round(n).toLocaleString()}`;
    const batteryKW = recommendation.recommendation.bessKW;
    
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
    
    const batteryKW = recommendation.recommendation.bessKW;
    
    const csvRows = [
      ['MERLIN ENERGY - EV Charging Station Quote'],
      [''],
      ['Quote Date', new Date().toLocaleDateString()],
      [''],
      ['BUSINESS INFORMATION'],
      ['Business Name', businessName || BUSINESS_TYPES[businessType].name],
      ['Business Type', BUSINESS_TYPES[businessType].name],
      ['Scale', SCALE_OPTIONS[scale].name],
      ['Location', state],
      [''],
      ['CHARGING SETUP'],
      ['Level 2 Chargers', recommendation.chargers.level2],
      ['Fast Chargers (DCFC)', recommendation.chargers.dcfc],
      ['Total Connected Load (kW)', calculatedPower.totalConnectedKW],
      ['Peak Demand (kW)', calculatedPower.peakDemandKW],
      [''],
      ['BATTERY SYSTEM'],
      ['Battery Size (kW)', batteryKW],
      ['Battery Capacity (kWh)', recommendation.recommendation.bessKWh],
      ['Solar (kW)', wantsSolarCanopy ? recommendation.recommendation.solarKW : 0],
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
        
        {/* Content - User-Friendly Steps */}
        <div className="p-6 pb-8 overflow-y-auto max-h-[calc(90vh-220px)]">
          
          {/* ================================================
              STEP 0: What Kind of Business? (Simple!)
              ================================================ */}
          {currentStep === 0 && (
            <div className="space-y-6">
              {/* Concierge Tier Selection */}
              <div className="mb-6">
                <p className="text-center text-emerald-200/70 text-sm mb-3">Choose your experience</p>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(CONCIERGE_TIERS).map(([key, tier]) => (
                    <button
                      key={key}
                      onClick={() => setConciergeTier(key as keyof typeof CONCIERGE_TIERS)}
                      className={`p-4 rounded-xl border-2 text-left transition-all relative ${
                        conciergeTier === key 
                          ? key === 'pro' 
                            ? 'border-amber-500 bg-amber-500/20 shadow-lg shadow-amber-500/20' 
                            : 'border-emerald-500 bg-emerald-500/20'
                          : 'border-white/10 hover:border-white/30 bg-white/5'
                      }`}
                    >
                      {'badge' in tier && (
                        <span className="absolute -top-2 -right-2 bg-amber-500 text-black text-xs font-bold px-2 py-0.5 rounded-full">
                          {tier.badge}
                        </span>
                      )}
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{tier.icon}</span>
                        <span className="font-bold text-white">{tier.name}</span>
                      </div>
                      <p className="text-xs text-emerald-200/60">{tier.description}</p>
                      <ul className="mt-2 space-y-1">
                        {tier.features.slice(0, 3).map((feature, i) => (
                          <li key={i} className="text-xs text-white/50 flex items-center gap-1">
                            <Check className="w-3 h-3 text-emerald-400" />{feature}
                          </li>
                        ))}
                      </ul>
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="text-center">
                <h3 className="text-2xl font-bold text-white mb-2">What kind of business do you have?</h3>
                <p className="text-emerald-200/70">We'll recommend the perfect EV charging setup for you</p>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
                {Object.entries(BUSINESS_TYPES).map(([key, business]) => {
                  const Icon = business.icon;
                  return (
                    <button
                      key={key}
                      onClick={() => setBusinessType(key as keyof typeof BUSINESS_TYPES)}
                      className={`p-4 rounded-xl border-2 text-center transition-all hover:scale-105 ${
                        businessType === key 
                          ? 'border-emerald-500 bg-emerald-500/20 shadow-lg shadow-emerald-500/20' 
                          : 'border-white/10 hover:border-white/30 bg-white/5'
                      }`}
                    >
                      <Icon className={`w-8 h-8 mx-auto mb-2 ${businessType === key ? 'text-emerald-400' : 'text-white/60'}`} />
                      <p className="font-bold text-white text-sm">{business.name}</p>
                      <p className="text-xs text-emerald-200/60 mt-1">{business.description}</p>
                    </button>
                  );
                })}
              </div>
              
              {/* Selected business info */}
              <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-xl p-4 border border-emerald-400/30">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-emerald-400 mt-0.5" />
                  <div>
                    <p className="text-white font-medium">Why EV charging for {BUSINESS_TYPES[businessType].name}?</p>
                    <p className="text-emerald-200/70 text-sm mt-1">{BUSINESS_TYPES[businessType].recommendation}</p>
                    <p className="text-xs text-cyan-400 mt-2">
                      💡 {BUSINESS_TYPES[businessType].gridServicesNote}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Optional: Business name */}
              <div>
                <label className="block text-sm text-emerald-200 mb-2">Business name (optional)</label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g., Downtown Marriott"
                  className="w-full bg-white/10 rounded-lg px-4 py-3 text-white placeholder-white/40 border border-white/10 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          )}
          
          {/* ================================================
              STEP 1: Scale & Location (Simple!)
              ================================================ */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-white mb-2">How big is your location?</h3>
                <p className="text-emerald-200/70">This helps us size your charging station</p>
              </div>
              
              {/* Scale Selection */}
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
                {Object.entries(SCALE_OPTIONS).map(([key, option]) => (
                  <button
                    key={key}
                    onClick={() => setScale(key as keyof typeof SCALE_OPTIONS)}
                    className={`p-4 rounded-xl border-2 text-center transition-all ${
                      scale === key 
                        ? 'border-emerald-500 bg-emerald-500/20' 
                        : 'border-white/10 hover:border-white/30 bg-white/5'
                    }`}
                  >
                    <span className="text-3xl">{option.icon}</span>
                    <p className="font-bold text-white mt-2">{option.name}</p>
                    <p className="text-sm text-emerald-200/70">{option.description}</p>
                    <p className="text-xs text-white/50 mt-1">{option.parkingSpots}</p>
                  </button>
                ))}
              </div>
              
              {/* State Selection */}
              <div>
                <label className="block text-sm text-emerald-200 mb-2">Where is your location?</label>
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full bg-white/10 rounded-lg px-4 py-3 text-white border border-white/10 focus:border-emerald-500 focus:outline-none"
                >
                  {Object.keys(STATE_RATES).map((st) => (
                    <option key={st} value={st} className="bg-gray-800">{st}</option>
                  ))}
                </select>
                <p className="text-xs text-emerald-200/60 mt-2">
                  💡 Electricity in {state}: ${(STATE_RATES[state]?.rate || 0.14).toFixed(2)}/kWh • 
                  Demand charges: ${STATE_RATES[state]?.demandCharge || 18}/kW
                </p>
              </div>
              
              {/* Quick Preview */}
              <div className="bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 rounded-xl p-4 border border-cyan-400/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-cyan-200">Your estimated setup</p>
                    <p className="text-2xl font-bold text-white">
                      {recommendation.chargers.level2} Level 2 + {recommendation.chargers.dcfc} Fast Chargers
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-emerald-200">Peak demand</p>
                    <p className="text-xl font-bold text-emerald-400">{recommendation.chargers.peakDemandKW} kW</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* ================================================
              STEP 2: Smart Recommendation (Auto-calculated!)
              ================================================ */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-white mb-2">Here's what we recommend</h3>
                <p className="text-emerald-200/70">Based on your {BUSINESS_TYPES[businessType].name.toLowerCase()}</p>
              </div>
              
              {/* The Big Number - Monthly Savings */}
              <div className="bg-gradient-to-br from-emerald-500/30 via-teal-500/20 to-cyan-500/30 rounded-2xl p-6 border-2 border-emerald-400/50 text-center">
                <p className="text-emerald-200 uppercase tracking-widest text-sm font-bold mb-1">You could save</p>
                <p className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-teal-300">
                  ${recommendation.savings.annual.toLocaleString()}/year
                </p>
                <p className="text-emerald-200/70 mt-2">with battery storage + solar</p>
              </div>
              
              {/* Recommended Setup - Cards */}
              <div className="grid md:grid-cols-3 gap-4">
                {/* EV Chargers */}
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="flex items-center gap-2 mb-3">
                    <Car className="w-5 h-5 text-blue-400" />
                    <span className="font-bold text-white">EV Chargers</span>
                  </div>
                  <p className="text-3xl font-bold text-white">{recommendation.chargers.level2 + recommendation.chargers.dcfc}</p>
                  <p className="text-sm text-emerald-200/70">
                    {recommendation.chargers.level2} Level 2 • {recommendation.chargers.dcfc} Fast
                  </p>
                  <p className="text-xs text-white/50 mt-2">{recommendation.dwellTime} typical stay</p>
                </div>
                
                {/* Battery Storage */}
                <div className={`rounded-xl p-4 border ${wantsBatteryStorage ? 'bg-emerald-500/10 border-emerald-400/30' : 'bg-white/5 border-white/10'}`}>
                  <label className="flex items-center gap-2 mb-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={wantsBatteryStorage}
                      onChange={(e) => setWantsBatteryStorage(e.target.checked)}
                      className="w-4 h-4 accent-emerald-500"
                    />
                    <Battery className="w-5 h-5 text-emerald-400" />
                    <span className="font-bold text-white">Battery Storage</span>
                  </label>
                  {wantsBatteryStorage ? (
                    <>
                      <p className="text-3xl font-bold text-emerald-400">{recommendation.recommendation.bessKW} kW</p>
                      <p className="text-sm text-emerald-200/70">{recommendation.recommendation.bessKWh} kWh capacity</p>
                      <p className="text-xs text-emerald-400 mt-2">
                        Saves ${recommendation.savings.demandChargeReduction.toLocaleString()}/yr in demand charges
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-white/50">Not included</p>
                  )}
                </div>
                
                {/* Solar Canopy */}
                <div className={`rounded-xl p-4 border ${wantsSolarCanopy ? 'bg-amber-500/10 border-amber-400/30' : 'bg-white/5 border-white/10'}`}>
                  <label className="flex items-center gap-2 mb-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={wantsSolarCanopy}
                      onChange={(e) => setWantsSolarCanopy(e.target.checked)}
                      className="w-4 h-4 accent-amber-500"
                    />
                    <Sun className="w-5 h-5 text-amber-400" />
                    <span className="font-bold text-white">Solar Canopy</span>
                  </label>
                  {wantsSolarCanopy ? (
                    <>
                      <p className="text-3xl font-bold text-amber-400">{recommendation.recommendation.solarKW} kW</p>
                      <p className="text-sm text-amber-200/70">Shades cars + free power</p>
                      <p className="text-xs text-amber-400 mt-2">
                        Saves ${recommendation.savings.solarOffset.toLocaleString()}/yr
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-white/50">Not included</p>
                  )}
                </div>
              </div>
              
              {/* Grid Services Bonus (Optional - Advanced) */}
              <div className={`rounded-xl p-4 border ${wantsGridServices ? 'bg-purple-500/10 border-purple-400/30' : 'bg-white/5 border-white/10'}`}>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={wantsGridServices}
                    onChange={(e) => setWantsGridServices(e.target.checked)}
                    className="w-5 h-5 accent-purple-500"
                  />
                  <Network className="w-5 h-5 text-purple-400" />
                  <div className="flex-1">
                    <span className="font-bold text-white">Earn Extra from the Grid</span>
                    <span className="ml-2 text-xs bg-purple-500/30 text-purple-300 px-2 py-0.5 rounded-full">Bonus</span>
                    <p className="text-sm text-purple-200/70">
                      Your battery can earn money by helping stabilize the electric grid
                    </p>
                  </div>
                  {wantsGridServices && wantsBatteryStorage && (
                    <div className="text-right">
                      <p className="text-lg font-bold text-purple-400">+${recommendation.savings.gridServices.toLocaleString()}/yr</p>
                    </div>
                  )}
                </label>
              </div>
              
              {/* Advanced Customization Toggle */}
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
              >
                <Settings className="w-4 h-4" />
                {showAdvanced ? 'Hide' : 'Show'} advanced options
                {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              
              {showAdvanced && (
                <div className="bg-white/5 rounded-xl p-4 border border-white/10 space-y-4">
                  <p className="text-sm text-white/70">Customize your charger count:</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-emerald-200">Level 2 Chargers</label>
                      <input
                        type="number"
                        min={0}
                        max={50}
                        value={customChargers.level2 || recommendation.chargers.level2}
                        onChange={(e) => setCustomChargers({...customChargers, level2: parseInt(e.target.value) || 0})}
                        className="w-full bg-white/10 rounded px-3 py-2 text-white mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-emerald-200">Fast Chargers (DCFC)</label>
                      <input
                        type="number"
                        min={0}
                        max={20}
                        value={customChargers.dcfc || recommendation.chargers.dcfc}
                        onChange={(e) => setCustomChargers({...customChargers, dcfc: parseInt(e.target.value) || 0})}
                        className="w-full bg-white/10 rounded px-3 py-2 text-white mt-1"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* ================================================
              STEP 3: Your Quote (Results!)
              ================================================ */}
          {currentStep === 3 && (
            <div className="space-y-6">
              {isCalculating ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full mb-4" />
                  <p className="text-white font-bold">Calculating your personalized quote...</p>
                  <p className="text-emerald-200/70 text-sm">Just a moment...</p>
                </div>
              ) : quoteResult ? (
                <>
                  <div className="text-center mb-4">
                    <h3 className="text-2xl font-bold text-white mb-1">
                      {businessName ? `${businessName} - ` : ''}Your EV Charging Quote
                    </h3>
                    <p className="text-emerald-200/70">
                      {BUSINESS_TYPES[businessType].name} • {SCALE_OPTIONS[scale].description} • {state}
                    </p>
                  </div>
                  
                  {/* Main Savings Card */}
                  <div className="bg-gradient-to-br from-emerald-500/30 via-teal-500/20 to-cyan-500/30 rounded-2xl p-6 border-2 border-emerald-400/50 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Trophy className="w-6 h-6 text-amber-400" />
                      <p className="text-emerald-200 uppercase tracking-widest text-sm font-bold">Annual Savings</p>
                    </div>
                    <p className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-teal-300">
                      ${Math.round(quoteResult.financials.annualSavings).toLocaleString()}
                    </p>
                    <p className="text-emerald-200/70 mt-2">That's ${Math.round(quoteResult.financials.annualSavings / 12).toLocaleString()}/month back in your pocket</p>
                  </div>
                  
                  {/* Key Metrics Dashboard */}
                  <KeyMetricsDashboard
                    input={{
                      vertical: 'ev-charging',
                      systemSizeKW: recommendation.recommendation.bessKW,
                      systemSizeKWh: recommendation.recommendation.bessKWh,
                      annualSavings: quoteResult.financials.annualSavings,
                      paybackYears: quoteResult.financials.paybackYears,
                      roi10Year: quoteResult.financials.roi10Year,
                      roi25Year: quoteResult.financials.roi25Year,
                      netCost: quoteResult.costs.netCost,
                      totalChargers: recommendation.chargers.level2 + recommendation.chargers.dcfc,
                      peakDemandReduction: Math.round(recommendation.chargers.peakDemandKW * 0.4),
                      state: state,
                      annualKWhDisplaced: recommendation.recommendation.bessKWh * 365,
                    }}
                    layout="grid"
                    maxMetrics={6}
                    showCO2Details={true}
                  />
                  
                  {/* CO2 Badge */}
                  <div className="flex justify-center">
                    <CO2Badge
                      annualSavingsKWh={recommendation.recommendation.bessKWh * 365}
                      state={state}
                      systemType="ev-charging"
                    />
                  </div>
                  
                  {/* Investment Summary */}
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <h4 className="font-bold text-white mb-3 flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-emerald-400" />
                      Investment Summary
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-emerald-200/70">Equipment (Battery + Chargers)</span>
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
                        <span className="flex items-center gap-1">
                          <Shield className="w-4 h-4" /> Federal Tax Credit (30%)
                        </span>
                        <span>-${Math.round(quoteResult.costs.taxCredit).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between py-3 bg-emerald-500/20 rounded-lg px-3 text-lg mt-2">
                        <span className="text-emerald-300 font-bold">Your Net Cost</span>
                        <span className="text-emerald-400 font-black">${Math.round(quoteResult.costs.netCost).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* What's Included */}
                  <div className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 rounded-xl p-4 border border-emerald-400/20">
                    <h4 className="font-bold text-white mb-3">What's included in your quote:</h4>
                    <div className="grid md:grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2 text-emerald-200">
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                        {recommendation.chargers.level2 + recommendation.chargers.dcfc} EV Chargers
                      </div>
                      {wantsBatteryStorage && (
                        <div className="flex items-center gap-2 text-emerald-200">
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                          {recommendation.recommendation.bessKW} kW / {recommendation.recommendation.bessKWh} kWh Battery
                        </div>
                      )}
                      {wantsSolarCanopy && (
                        <div className="flex items-center gap-2 text-emerald-200">
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                          {recommendation.recommendation.solarKW} kW Solar Canopy
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-emerald-200">
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                        Installation & permitting
                      </div>
                      <div className="flex items-center gap-2 text-emerald-200">
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                        10-year warranty
                      </div>
                      <div className="flex items-center gap-2 text-emerald-200">
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                        Monitoring & support
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
                  
                  {/* CTA - Different based on Concierge tier */}
                  {conciergeTier === 'pro' ? (
                    <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-xl p-4 border border-amber-400/30">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-2xl">👑</span>
                        <div>
                          <p className="font-bold text-amber-400">Concierge Pro Benefits</p>
                          <p className="text-sm text-amber-200/70">Your dedicated advisor will contact you within 24 hours</p>
                        </div>
                      </div>
                      <ul className="grid grid-cols-2 gap-2 text-sm mb-4">
                        {CONCIERGE_TIERS.pro.features.map((feature, i) => (
                          <li key={i} className="flex items-center gap-2 text-amber-200">
                            <CheckCircle className="w-4 h-4 text-amber-400" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                      <button
                        onClick={onRequestConsultation}
                        className="w-full bg-gradient-to-r from-amber-600 via-orange-600 to-amber-600 hover:from-amber-500 hover:via-orange-500 hover:to-amber-500 text-white py-4 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all hover:scale-105 flex items-center justify-center gap-2"
                      >
                        <Phone className="w-5 h-5" />
                        Schedule VIP Consultation
                      </button>
                    </div>
                  ) : onRequestConsultation && (
                    <button
                      onClick={onRequestConsultation}
                      className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:via-teal-500 hover:to-cyan-500 text-white py-4 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all hover:scale-105 flex items-center justify-center gap-2"
                    >
                      <Phone className="w-5 h-5" />
                      Talk to an Expert - Free Consultation
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
