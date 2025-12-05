/**
 * HOTEL WIZARD - Detailed Quote Builder
 * ======================================
 * 
 * Guided wizard for hotel owners to build a detailed BESS quote.
 * Pre-populated with data from the HotelEnergy landing page calculator.
 * 
 * Uses: 
 * - calculateQuote() from unifiedQuoteCalculator (SINGLE SOURCE OF TRUTH)
 */

import React, { useState, useEffect } from 'react';
import { 
  X, ArrowLeft, ArrowRight, Check, Zap, Battery, Sun, 
  Gauge, DollarSign, Calendar, Download, CheckCircle, AlertCircle, 
  Sparkles, TrendingDown, Phone, FileText, FileSpreadsheet, File, 
  Building2, Waves, Coffee, Dumbbell, Car, Thermometer, Wind, Users, Target,
  MapPin, Settings
} from 'lucide-react';
import { calculateQuote, type QuoteResult } from '@/services/unifiedQuoteCalculator';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';
import merlinImage from '@/assets/images/new_Merlin.png';
import { KeyMetricsDashboard, CO2Badge } from '@/components/shared/KeyMetricsDashboard';
import { WizardPowerProfile, WizardStepHelp, type StepHelpContent } from '@/components/wizard/shared';
import { PowerGaugeWidget } from '@/components/wizard/widgets';

// ============================================
// TYPES
// ============================================

export interface HotelWizardInputs {
  numberOfRooms: number;
  hotelClass: 'economy' | 'midscale' | 'upscale' | 'luxury';
  state: string;
  businessName?: string;
  ownerName?: string;
  email?: string;
  phone?: string;
}

interface HotelWizardProps {
  onClose: () => void;
  initialInputs?: Partial<HotelWizardInputs>;
  onComplete?: (quoteData: any) => void;
  onRequestConsultation?: () => void;
}

// ============================================
// HOTEL SPECIFICATIONS
// ============================================

const HOTEL_CLASS_PROFILES = {
  economy: { kWhPerRoom: 25, peakKWPerRoom: 1.5, name: 'Economy/Budget', hvacTons: 0.5 },
  midscale: { kWhPerRoom: 35, peakKWPerRoom: 2.0, name: 'Midscale', hvacTons: 0.75 },
  upscale: { kWhPerRoom: 50, peakKWPerRoom: 2.5, name: 'Upscale', hvacTons: 1.0 },
  luxury: { kWhPerRoom: 75, peakKWPerRoom: 3.5, name: 'Luxury/Resort', hvacTons: 1.5 },
};

const AMENITY_SPECS = {
  pool: { name: 'Pool & Hot Tub', peakKW: 50, dailyKWh: 300, icon: Waves },
  restaurant: { name: 'Restaurant/Kitchen', peakKW: 75, dailyKWh: 400, icon: Coffee },
  spa: { name: 'Spa/Sauna/Steam', peakKW: 40, dailyKWh: 200, icon: Thermometer },
  fitnessCenter: { name: 'Fitness Center', peakKW: 15, dailyKWh: 100, icon: Dumbbell },
  evCharging: { name: 'EV Charging (8 L2 ports)', peakKW: 60, dailyKWh: 200, icon: Car },
  laundry: { name: 'On-Site Laundry', peakKW: 40, dailyKWh: 250, icon: Wind },
  conferenceCenter: { name: 'Conference/Meeting Rooms', peakKW: 30, dailyKWh: 150, icon: Building2 },
};

const STATE_RATES: Record<string, { rate: number; demandCharge: number }> = {
  'California': { rate: 0.20, demandCharge: 22 },
  'Florida': { rate: 0.13, demandCharge: 14 },
  'Texas': { rate: 0.11, demandCharge: 12 },
  'New York': { rate: 0.18, demandCharge: 20 },
  'Nevada': { rate: 0.12, demandCharge: 15 },
  'Arizona': { rate: 0.12, demandCharge: 16 },
  'Colorado': { rate: 0.11, demandCharge: 13 },
  'Hawaii': { rate: 0.35, demandCharge: 30 },
  'Massachusetts': { rate: 0.22, demandCharge: 18 },
  'Washington': { rate: 0.10, demandCharge: 10 },
  'Other': { rate: 0.13, demandCharge: 15 },
};

// ============================================
// CONCIERGE SERVICE TIERS
// ============================================
const CONCIERGE_TIERS = {
  'standard': {
    name: 'Standard',
    description: 'Self-service with AI recommendations',
    icon: '🤖',
    features: [
      'AI-powered equipment recommendations',
      'Industry benchmarking data',
      'Automated quote generation',
      'Email support',
    ],
    price: 'Free',
    badge: null as string | null,
  },
  'pro': {
    name: 'Concierge Pro',
    description: 'White-glove service for hotel groups & REITs',
    icon: '👔',
    features: [
      'Dedicated energy analyst',
      'Custom equipment recommendations',
      'Site audit coordination',
      'Multi-property portfolio management',
      'Quarterly performance reviews',
      'Priority phone support',
      'Custom integrations',
    ],
    price: 'Contact Sales',
    badge: 'Hotel Groups' as string | null,
  },
};

// ============================================
// WIZARD STEPS
// ============================================

const WIZARD_STEPS = [
  { id: 'who', title: 'Who Are You?', icon: Users },
  { id: 'what', title: 'Your Hotel', icon: Building2 },
  { id: 'how', title: 'Operations', icon: Settings },
  { id: 'goals', title: 'Your Goals', icon: Target },
  { id: 'quote', title: 'Your Quote', icon: DollarSign },
];

// ============================================
// STEP HELP CONTENT - Hotel Specific
// ============================================

const HOTEL_STEP_HELP: Record<string, StepHelpContent> = {
  'who': {
    stepId: 'who',
    title: 'Tell Us About You',
    description: 'Your role helps us customize the analysis for your specific decision-making needs.',
    tips: [
      { type: 'tip', text: 'Property owners see ROI analysis. Brand managers see portfolio-level insights.' },
      { type: 'info', text: 'Location determines utility rates - this significantly affects savings.' },
    ],
  },
  'what': {
    stepId: 'what',
    title: 'Your Hotel Profile',
    description: 'Hotel class and size determine baseline energy consumption and peak demand.',
    tips: [
      { type: 'tip', text: 'Luxury hotels use 3x more energy per room than economy properties.' },
      { type: 'info', text: 'Amenities like pools, spas, and restaurants significantly increase energy use.' },
    ],
  },
  'how': {
    stepId: 'how',
    title: 'Operating Profile',
    description: 'Occupancy patterns and seasonal variation help us size the battery optimally.',
    tips: [
      { type: 'tip', text: 'Hotels with high peak/off-peak variation benefit most from battery storage.' },
      { type: 'info', text: 'Conference facilities can add 50-100 kW during events.' },
    ],
  },
  'goals': {
    stepId: 'goals',
    title: 'Your Energy Goals',
    description: 'What matters most? Cost savings, sustainability, or backup power for guests?',
    tips: [
      { type: 'tip', text: 'Demand charge reduction typically provides 30-50% of total savings.' },
      { type: 'success', text: 'LEED and sustainability certifications attract eco-conscious travelers.' },
    ],
    links: [
      { label: 'Hotel Energy Efficiency Guide', url: '/docs/hotel-energy' },
      { label: 'ENERGY STAR for Hotels', url: 'https://www.energystar.gov/buildings/resources_audience/hospitality' },
    ],
  },
  'quote': {
    stepId: 'quote',
    title: 'Your Custom Quote',
    description: 'Review your hotel BESS quote with costs, savings projections, and environmental impact.',
    tips: [
      { type: 'success', text: '30% Federal ITC makes battery storage more affordable than ever.' },
      { type: 'tip', text: 'Share this quote with your ownership group or brand energy team.' },
    ],
  },
};

// ============================================
// MAIN COMPONENT
// ============================================

export default function HotelWizard({ 
  onClose, 
  initialInputs = {}, 
  onComplete,
  onRequestConsultation 
}: HotelWizardProps) {
  const mergedInputs = {
    numberOfRooms: initialInputs.numberOfRooms ?? 150,
    hotelClass: initialInputs.hotelClass ?? 'midscale',
    state: initialInputs.state ?? 'Florida',
    businessName: initialInputs.businessName ?? '',
    ownerName: initialInputs.ownerName ?? '',
    email: initialInputs.email ?? '',
    phone: initialInputs.phone ?? '',
  };
  
  const [currentStep, setCurrentStep] = useState(0);
  const [isCalculating, setIsCalculating] = useState(false);
  const [quoteResult, setQuoteResult] = useState<QuoteResult | null>(null);
  
  // Step 0: WHO ARE YOU?
  const [userRole, setUserRole] = useState('owner');
  
  // Power Mode - reveals advanced options for power users
  const [powerMode, setPowerMode] = useState(false);
  
  // Concierge - optional help, not a tier selection
  const [showConciergeHelp, setShowConciergeHelp] = useState(false);
  
  // Step 1: YOUR HOTEL (Type, Size, Amenities)
  const [hotelDetails, setHotelDetails] = useState({
    numberOfRooms: mergedInputs.numberOfRooms,
    hotelClass: mergedInputs.hotelClass as keyof typeof HOTEL_CLASS_PROFILES,
    state: mergedInputs.state,
    buildingAge: 'modern' as 'new' | 'modern' | 'older' | 'historic',
    hvacType: 'ptac' as 'ptac' | 'central' | 'vrf' | 'chiller',
  });
  
  // Step 1 continued: Amenities
  const [amenities, setAmenities] = useState({
    pool: true,
    restaurant: true,
    spa: false,
    fitnessCenter: true,
    evCharging: false,
    laundry: true,
    conferenceCenter: false,
  });
  
  // Step 2: OPERATIONS
  const [operations, setOperations] = useState({
    avgOccupancy: 70,
    peakHoursStart: 6, // 6 AM (morning + evening peaks)
    peakHoursEnd: 22, // 10 PM
    seasonality: 'moderate' as 'low' | 'moderate' | 'high',
    hasBackupGenerator: false,
    generatorKW: 200,
  });
  
  // Step 3: YOUR GOALS
  const [energyGoals, setEnergyGoals] = useState({
    primaryGoal: 'cost-savings' as 'cost-savings' | 'backup-power' | 'sustainability' | 'all',
    targetSavingsPercent: 35,
    interestInSolar: true,
    roofArea: 15000,
    budgetRange: 'moderate' as 'tight' | 'moderate' | 'flexible',
  });
  
  // Calculated values
  const [calculatedPower, setCalculatedPower] = useState({
    basePeakKW: 0,
    amenityPeakKW: 0,
    totalPeakKW: 0,
    dailyKWh: 0,
    monthlyDemandCharges: 0,
    monthlyEnergyCharges: 0,
  });
  
  // Calculate power
  useEffect(() => {
    const calc = calculateHotelPower();
    setCalculatedPower(calc);
  }, [hotelDetails, amenities, operations]);
  
  function calculateHotelPower() {
    const classProfile = HOTEL_CLASS_PROFILES[hotelDetails.hotelClass];
    
    // Base load from rooms
    const occupancyFactor = operations.avgOccupancy / 100;
    let basePeakKW = hotelDetails.numberOfRooms * classProfile.peakKWPerRoom * occupancyFactor;
    let dailyKWh = hotelDetails.numberOfRooms * classProfile.kWhPerRoom * occupancyFactor;
    
    // Building age efficiency factor
    const ageFactors = { new: 0.85, modern: 1.0, older: 1.15, historic: 1.3 };
    basePeakKW *= ageFactors[hotelDetails.buildingAge];
    dailyKWh *= ageFactors[hotelDetails.buildingAge];
    
    // Amenity loads
    let amenityPeakKW = 0;
    Object.entries(amenities).forEach(([key, enabled]) => {
      if (enabled && AMENITY_SPECS[key as keyof typeof AMENITY_SPECS]) {
        const spec = AMENITY_SPECS[key as keyof typeof AMENITY_SPECS];
        amenityPeakKW += spec.peakKW;
        dailyKWh += spec.dailyKWh;
      }
    });
    
    // Total with diversity factor (75%)
    const totalPeakKW = Math.round((basePeakKW + amenityPeakKW) * 0.75);
    
    const stateData = STATE_RATES[hotelDetails.state] || STATE_RATES['Other'];
    const monthlyKWh = dailyKWh * 30;
    
    return {
      basePeakKW: Math.round(basePeakKW),
      amenityPeakKW: Math.round(amenityPeakKW),
      totalPeakKW,
      dailyKWh: Math.round(dailyKWh),
      monthlyDemandCharges: Math.round(totalPeakKW * stateData.demandCharge),
      monthlyEnergyCharges: Math.round(monthlyKWh * stateData.rate),
    };
  }
  
  // Generate quote
  async function generateQuote() {
    setIsCalculating(true);
    
    try {
      const targetReduction = energyGoals.targetSavingsPercent / 100;
      const batteryPowerKW = calculatedPower.totalPeakKW * targetReduction;
      const storageSizeMW = batteryPowerKW / 1000;
      const durationHours = energyGoals.primaryGoal === 'backup-power' ? 6 : 4;
      
      const stateData = STATE_RATES[hotelDetails.state] || STATE_RATES['Other'];
      
      const result = await calculateQuote({
        storageSizeMW: Math.max(0.1, storageSizeMW),
        durationHours,
        location: hotelDetails.state,
        electricityRate: stateData.rate,
        useCase: 'hotel',
        solarMW: energyGoals.interestInSolar ? (energyGoals.roofArea * 0.015 / 1000) : 0,
      });
      
      setQuoteResult(result);
    } catch (error) {
      console.error('Quote calculation error:', error);
    } finally {
      setIsCalculating(false);
    }
  }
  
  // Downloads
  function downloadQuote() {
    if (!quoteResult) return;
    
    const formatCurrency = (n: number) => `$${Math.round(n).toLocaleString()}`;
    const batteryKW = Math.round(calculatedPower.totalPeakKW * energyGoals.targetSavingsPercent / 100);
    
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Hotel Energy Quote - ${mergedInputs.businessName || 'Your Hotel'}</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; color: #1e293b; }
    h1 { color: #6366f1; border-bottom: 3px solid #6366f1; padding-bottom: 10px; }
    h2 { color: #8b5cf6; margin-top: 30px; }
    .summary-box { background: linear-gradient(135deg, #eef2ff, #f5f3ff); border: 2px solid #6366f1; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center; }
    .savings { font-size: 48px; font-weight: bold; color: #6366f1; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
    .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; }
    .card h4 { margin: 0 0 10px 0; color: #475569; font-size: 14px; }
    .card .value { font-size: 24px; font-weight: bold; color: #1e293b; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
    th { background: #f1f5f9; }
    .total-row { background: #eef2ff; font-weight: bold; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 12px; }
  </style>
</head>
<body>
  <h1>🏨 Hotel Battery Storage Quote</h1>
  
  <p><strong>${mergedInputs.businessName || 'Hotel'}</strong><br>
  ${hotelDetails.numberOfRooms} rooms • ${HOTEL_CLASS_PROFILES[hotelDetails.hotelClass].name} • ${hotelDetails.state}</p>
  
  <div class="summary-box">
    <div style="font-size: 14px; color: #6366f1;">ESTIMATED ANNUAL SAVINGS</div>
    <div class="savings">${formatCurrency(quoteResult.financials.annualSavings)}</div>
    <div style="color: #64748b;">per year</div>
  </div>
  
  <div class="grid">
    <div class="card"><h4>Payback Period</h4><div class="value">${quoteResult.financials.paybackYears.toFixed(1)} years</div></div>
    <div class="card"><h4>25-Year ROI</h4><div class="value">${Math.round(quoteResult.financials.roi25Year)}%</div></div>
    <div class="card"><h4>Net Cost (after ITC)</h4><div class="value">${formatCurrency(quoteResult.costs.netCost)}</div></div>
    <div class="card"><h4>Battery Size</h4><div class="value">${batteryKW} kW</div></div>
  </div>
  
  <h2>Investment Summary</h2>
  <table>
    <tr><td>Total Equipment Cost</td><td>${formatCurrency(quoteResult.costs.equipmentCost)}</td></tr>
    <tr><td>Installation</td><td>${formatCurrency(quoteResult.costs.installationCost)}</td></tr>
    <tr class="total-row"><td>Total Project Cost</td><td>${formatCurrency(quoteResult.costs.totalProjectCost)}</td></tr>
    <tr style="color: #6366f1;"><td>Federal Tax Credit (30%)</td><td>-${formatCurrency(quoteResult.costs.taxCredit)}</td></tr>
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
    a.download = `Hotel_Quote_${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    onComplete?.({ inputs: mergedInputs, hotelDetails, amenities, operations, energyGoals, calculatedPower, quoteResult });
  }

  async function downloadWord() {
    if (!quoteResult) return;
    
    const formatCurrency = (n: number) => `$${Math.round(n).toLocaleString()}`;
    const batteryKW = Math.round(calculatedPower.totalPeakKW * energyGoals.targetSavingsPercent / 100);
    
    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({
            children: [new TextRun({ text: '🏨 MERLIN ENERGY', bold: true, size: 48, color: '6366F1' })],
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            children: [new TextRun({ text: 'HOTEL BATTERY STORAGE QUOTE', bold: true, size: 32, color: '8B5CF6' })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),
          new Paragraph({
            children: [new TextRun({ text: `Hotel: ${mergedInputs.businessName || 'Hotel'}`, size: 24 })],
          }),
          new Paragraph({
            children: [new TextRun({ text: `${hotelDetails.numberOfRooms} rooms • ${HOTEL_CLASS_PROFILES[hotelDetails.hotelClass].name}`, size: 24 })],
          }),
          new Paragraph({
            children: [new TextRun({ text: `Location: ${hotelDetails.state}`, size: 24 })],
            spacing: { after: 300 },
          }),
          new Paragraph({
            children: [new TextRun({ text: 'ANNUAL SAVINGS', bold: true, size: 28, color: '6366F1' })],
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            children: [new TextRun({ text: formatCurrency(quoteResult.financials.annualSavings), bold: true, size: 72, color: '6366F1' })],
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
                new TableCell({ children: [new Paragraph('Federal Tax Credit (30%)')], shading: { fill: 'EEF2FF' } }),
                new TableCell({ children: [new Paragraph(`-${formatCurrency(quoteResult.costs.taxCredit)}`)] }),
              ]}),
              new TableRow({ children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Net Cost', bold: true })] })], shading: { fill: 'E0E7FF' } }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: formatCurrency(quoteResult.costs.netCost), bold: true, color: '6366F1' })] })] }),
              ]}),
            ],
          }),
        ],
      }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `Hotel_Quote_${new Date().toISOString().split('T')[0]}.docx`);
  }

  function downloadExcel() {
    if (!quoteResult) return;
    
    const batteryKW = Math.round(calculatedPower.totalPeakKW * energyGoals.targetSavingsPercent / 100);
    const enabledAmenities = Object.entries(amenities).filter(([_, v]) => v).map(([k]) => AMENITY_SPECS[k as keyof typeof AMENITY_SPECS]?.name).join(', ');
    
    const csvRows = [
      ['MERLIN ENERGY - Hotel Quote'],
      [''],
      ['Quote Date', new Date().toLocaleDateString()],
      [''],
      ['HOTEL INFORMATION'],
      ['Hotel Name', mergedInputs.businessName || 'Hotel'],
      ['Location', hotelDetails.state],
      ['Number of Rooms', hotelDetails.numberOfRooms],
      ['Hotel Class', HOTEL_CLASS_PROFILES[hotelDetails.hotelClass].name],
      ['Amenities', enabledAmenities],
      [''],
      ['POWER ANALYSIS'],
      ['Base Peak Demand (kW)', calculatedPower.basePeakKW],
      ['Amenity Peak Demand (kW)', calculatedPower.amenityPeakKW],
      ['Total Peak Demand (kW)', calculatedPower.totalPeakKW],
      [''],
      ['BATTERY SYSTEM'],
      ['Battery Size (kW)', batteryKW],
      ['Target Savings', `${energyGoals.targetSavingsPercent}%`],
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
    saveAs(blob, `Hotel_Quote_${new Date().toISOString().split('T')[0]}.csv`);
  }

  // Run quote calculation when reaching final step
  // Always recalculate when entering final step to pick up any changes from previous steps
  useEffect(() => {
    if (currentStep === WIZARD_STEPS.length - 1) {
      generateQuote();
    }
  }, [currentStep]);
  
  // Clear quote result when user navigates back from final step
  // This ensures slider changes will trigger a fresh calculation
  useEffect(() => {
    if (currentStep < WIZARD_STEPS.length - 1 && quoteResult) {
      setQuoteResult(null);
    }
  }, [currentStep]);
  
  const canProceed = () => {
    switch (currentStep) {
      case 0: return hotelDetails.numberOfRooms > 0;
      case 1: return true;
      case 2: return operations.avgOccupancy > 0;
      case 3: return true;
      case 4: return quoteResult !== null;
      default: return true;
    }
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-gradient-to-br from-indigo-900 via-purple-800 to-violet-900 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-indigo-400/40 shadow-2xl shadow-indigo-500/20">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-900/50 via-purple-900/30 to-indigo-900/50 px-6 py-4 border-b border-indigo-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={merlinImage} alt="Merlin" className="w-10 h-10" />
              <div>
                <h2 className="text-xl font-bold text-white">Build Your Hotel Quote</h2>
                <p className="text-sm text-indigo-300/70">Step {currentStep + 1} of {WIZARD_STEPS.length}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Power Mode Toggle */}
              <button
                onClick={() => setPowerMode(!powerMode)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  powerMode 
                    ? 'bg-amber-500/30 border border-amber-400/50 text-amber-300' 
                    : 'bg-white/10 border border-white/20 text-white/70 hover:border-amber-400/30 hover:text-amber-300'
                }`}
                title="Show advanced options"
              >
                <Zap className="w-4 h-4" />
                <span className="hidden sm:inline">Power Mode</span>
              </button>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <X className="w-5 h-5 text-white/70" />
              </button>
            </div>
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
                        ? 'bg-indigo-500 text-white' 
                        : isComplete 
                          ? 'bg-indigo-500/20 text-indigo-400 cursor-pointer hover:bg-indigo-500/30'
                          : 'bg-white/5 text-white/40'
                    }`}
                  >
                    {isComplete ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                    <span className="text-xs font-medium hidden sm:inline">{step.title}</span>
                  </button>
                  {index < WIZARD_STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-2 ${isComplete ? 'bg-indigo-500/50' : 'bg-white/10'}`} />
                  )}
                </div>
              );
            })}
          </div>
          
          {/* Power Profile - Shows real-time power metrics */}
          {calculatedPower.totalPeakKW > 0 && (
            <WizardPowerProfile
              data={{
                peakDemandKW: calculatedPower.totalPeakKW,
                totalStorageKWh: calculatedPower.totalPeakKW * (energyGoals.targetSavingsPercent / 100) * 4,
                durationHours: 4,
                monthlyUsageKWh: calculatedPower.dailyKWh * 30,
                solarKW: energyGoals.interestInSolar ? Math.round(energyGoals.roofArea * 0.015) : 0,
              }}
              compact={true}
              colorScheme="purple"
              className="mt-4"
            />
          )}
        </div>
        
        {/* Content */}
        <div className="p-6 pb-8 overflow-y-auto max-h-[calc(90vh-220px)]">
          {/* Step 0: WHO ARE YOU? - Simple and Clean */}
          {currentStep === 0 && (
            <div className="space-y-6">
              {/* Step Help */}
              <WizardStepHelp 
                content={HOTEL_STEP_HELP['who']} 
                colorScheme="purple"
              />

              {/* User Role Selection */}
              <div className="mb-6">
                <h4 className="text-md font-bold text-white mb-3">I am a...</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { key: 'owner', icon: '🏨', name: 'Owner/Operator', desc: 'I own or manage a hotel' },
                    { key: 'investor', icon: '💼', name: 'Investor / REIT', desc: 'Evaluating investments' },
                    { key: 'developer', icon: '🏗️', name: 'Developer', desc: 'Planning new properties' },
                    { key: 'explorer', icon: '🔍', name: 'Just Exploring', desc: 'Curious about the numbers' },
                  ].map((role) => (
                    <button
                      key={role.key}
                      onClick={() => setUserRole(role.key)}
                      className={`p-3 rounded-xl border-2 text-center transition-all ${
                        userRole === role.key 
                          ? 'border-indigo-500 bg-indigo-500/20' 
                          : 'border-white/10 hover:border-white/30 bg-white/5'
                      }`}
                    >
                      <span className="text-2xl">{role.icon}</span>
                      <p className="font-bold text-white text-sm mt-1">{role.name}</p>
                      <p className="text-xs text-indigo-200/60">{role.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Location Selection */}
              <div>
                <label className="block text-sm text-indigo-200 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Hotel Location (State)
                </label>
                <select
                  value={hotelDetails.state}
                  onChange={(e) => setHotelDetails({...hotelDetails, state: e.target.value})}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
                >
                  {Object.keys(STATE_RATES).map((state) => (
                    <option key={state} value={state} className="bg-slate-800">{state}</option>
                  ))}
                </select>
                <p className="text-xs text-indigo-200/50 mt-2">
                  💡 Electricity rate: ${STATE_RATES[hotelDetails.state as keyof typeof STATE_RATES]?.rate.toFixed(2)}/kWh • Demand charge: ${STATE_RATES[hotelDetails.state as keyof typeof STATE_RATES]?.demandCharge}/kW
                </p>
              </div>
            </div>
          )}
          
          {/* Step 1: YOUR HOTEL (Type, Size, Amenities) */}
          {currentStep === 1 && (
            <div className="space-y-6">
              {/* Step Help */}
              <WizardStepHelp 
                content={HOTEL_STEP_HELP['what']} 
                colorScheme="purple"
              />
              
              {/* Hotel Class */}
              <div>
                <label className="block text-sm text-indigo-200 mb-3">Hotel Class</label>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(HOTEL_CLASS_PROFILES).map(([key, profile]) => (
                    <button
                      key={key}
                      onClick={() => setHotelDetails({...hotelDetails, hotelClass: key as any})}
                      className={`p-4 rounded-xl text-left transition-all ${
                        hotelDetails.hotelClass === key
                          ? 'bg-indigo-500/30 border-2 border-indigo-400'
                          : 'bg-white/5 border-2 border-transparent hover:border-white/20'
                      }`}
                    >
                      <p className="font-bold text-white">{profile.name}</p>
                      <p className="text-xs text-indigo-200/60">{profile.kWhPerRoom} kWh/room/day</p>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Number of Rooms */}
              <div>
                <label className="block text-sm text-indigo-200 mb-2">Number of Rooms</label>
                <input
                  type="range"
                  min={25}
                  max={500}
                  step={25}
                  value={hotelDetails.numberOfRooms}
                  onChange={(e) => setHotelDetails({...hotelDetails, numberOfRooms: parseInt(e.target.value)})}
                  className="w-full accent-indigo-500"
                />
                <p className="text-center text-white font-bold text-lg">{hotelDetails.numberOfRooms} rooms</p>
              </div>
              
              {/* Building Age */}
              <div>
                <label className="block text-sm text-indigo-200 mb-3">Building Age / Efficiency</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'new', label: 'New (2015+)', efficiency: 'Very Efficient' },
                    { id: 'modern', label: 'Modern (2000-2014)', efficiency: 'Efficient' },
                    { id: 'older', label: 'Older (1980-1999)', efficiency: 'Average' },
                    { id: 'historic', label: 'Historic (<1980)', efficiency: 'Less Efficient' },
                  ].map((age) => (
                    <button
                      key={age.id}
                      onClick={() => setHotelDetails({...hotelDetails, buildingAge: age.id as any})}
                      className={`p-2 rounded-lg text-center transition-all ${
                        hotelDetails.buildingAge === age.id
                          ? 'bg-indigo-500/30 border border-indigo-400'
                          : 'bg-white/5 border border-transparent hover:border-white/20'
                      }`}
                    >
                      <p className="text-xs font-medium text-white">{age.label}</p>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Power Summary */}
              <div className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-xl p-4 border border-indigo-400/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-indigo-200">Room Base Load</p>
                    <p className="text-2xl font-bold text-white">{calculatedPower.basePeakKW} kW</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-purple-200">Amenities</p>
                    <p className="text-2xl font-bold text-purple-400">+{calculatedPower.amenityPeakKW} kW</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-pink-200">Total Peak</p>
                    <p className="text-2xl font-bold text-pink-400">{calculatedPower.totalPeakKW} kW</p>
                  </div>
                </div>
              </div>
              
              {/* Amenity Selection */}
              <div>
                <label className="block text-sm text-indigo-200 mb-3">Select Your Amenities</label>
                <div className="grid md:grid-cols-2 gap-4">
                  {Object.entries(AMENITY_SPECS).map(([key, spec]) => {
                    const Icon = spec.icon;
                    const isEnabled = amenities[key as keyof typeof amenities];
                    
                    return (
                      <button
                        key={key}
                        onClick={() => setAmenities({...amenities, [key]: !isEnabled})}
                        className={`p-4 rounded-xl text-left transition-all flex items-center gap-4 ${
                          isEnabled
                            ? 'bg-indigo-500/30 border-2 border-indigo-400'
                            : 'bg-white/5 border-2 border-transparent hover:border-white/20'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isEnabled ? 'bg-indigo-500' : 'bg-white/10'}`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-white">{spec.name}</p>
                          <p className="text-xs text-indigo-200/60">+{spec.peakKW} kW peak</p>
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isEnabled ? 'border-indigo-400 bg-indigo-500' : 'border-white/30'}`}>
                          {isEnabled && <Check className="w-4 h-4 text-white" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
          
          {/* Step 2: Operations */}
          {currentStep === 2 && (
            <div className="space-y-6">
              {/* Step Help */}
              <WizardStepHelp 
                content={HOTEL_STEP_HELP['how']} 
                colorScheme="purple"
              />
              
              {/* Occupancy */}
              <div>
                <label className="block text-sm text-indigo-200 mb-2">
                  Average Occupancy Rate: <span className="text-indigo-400 font-bold">{operations.avgOccupancy}%</span>
                </label>
                <input
                  type="range"
                  min={30}
                  max={95}
                  step={5}
                  value={operations.avgOccupancy}
                  onChange={(e) => setOperations({...operations, avgOccupancy: parseInt(e.target.value)})}
                  className="w-full accent-indigo-500"
                />
              </div>
              
              {/* Seasonality */}
              <div>
                <label className="block text-sm text-indigo-200 mb-3">Seasonal Demand Variation</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'low', label: 'Low', desc: 'Steady year-round' },
                    { id: 'moderate', label: 'Moderate', desc: 'Some seasonal peaks' },
                    { id: 'high', label: 'High', desc: 'Strong seasonal swings' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setOperations({...operations, seasonality: s.id as any})}
                      className={`p-3 rounded-xl text-center transition-all ${
                        operations.seasonality === s.id
                          ? 'bg-indigo-500/30 border border-indigo-400'
                          : 'bg-white/5 border border-transparent hover:border-white/20'
                      }`}
                    >
                      <p className="font-medium text-white">{s.label}</p>
                      <p className="text-xs text-indigo-200/60">{s.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Existing Generator */}
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={operations.hasBackupGenerator}
                    onChange={(e) => setOperations({...operations, hasBackupGenerator: e.target.checked})}
                    className="w-5 h-5 accent-indigo-500"
                  />
                  <div>
                    <span className="text-white font-medium">Has Existing Backup Generator</span>
                    <p className="text-sm text-indigo-200/60">Battery can supplement or replace diesel generators</p>
                  </div>
                </label>
                
                {operations.hasBackupGenerator && (
                  <div className="mt-4">
                    <label className="text-sm text-indigo-200">Generator Capacity (kW)</label>
                    <input
                      type="number"
                      min={50}
                      max={2000}
                      value={operations.generatorKW}
                      onChange={(e) => setOperations({...operations, generatorKW: parseInt(e.target.value) || 200})}
                      className="w-full bg-white/10 rounded px-3 py-2 text-white mt-1"
                    />
                  </div>
                )}
              </div>
              
              {/* Cost Preview */}
              <div className="bg-pink-500/10 rounded-xl p-4 border border-pink-400/30">
                <h4 className="font-medium text-pink-300 mb-2">Current Monthly Energy Costs</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-2xl font-bold text-pink-400">${calculatedPower.monthlyDemandCharges.toLocaleString()}</p>
                    <p className="text-xs text-pink-200/60">Demand Charges</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-indigo-400">${calculatedPower.monthlyEnergyCharges.toLocaleString()}</p>
                    <p className="text-xs text-indigo-200/60">Energy Charges</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Step 3: Energy Goals */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <WizardStepHelp
                content={HOTEL_STEP_HELP['goals']}
                colorScheme="indigo"
              />
              <div>
                <h3 className="text-lg font-bold text-white mb-2">Energy Goals</h3>
                <p className="text-indigo-200/70 text-sm">What matters most to your hotel?</p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { id: 'cost-savings', label: 'Cut Energy Costs', desc: 'Reduce demand charges 30-40%', icon: TrendingDown },
                  { id: 'backup-power', label: 'Backup Power', desc: 'Never lose power to guests', icon: Battery },
                  { id: 'sustainability', label: 'Sustainability', desc: 'Meet ESG goals & guest expectations', icon: Sun },
                  { id: 'all', label: 'All of the Above', desc: 'Maximum value from storage', icon: Sparkles },
                ].map((goal) => {
                  const Icon = goal.icon;
                  return (
                    <button
                      key={goal.id}
                      onClick={() => setEnergyGoals({...energyGoals, primaryGoal: goal.id as any})}
                      className={`p-4 rounded-xl text-left transition-all ${
                        energyGoals.primaryGoal === goal.id 
                          ? 'border-indigo-500 bg-indigo-500/20 border-2' 
                          : 'border-white/10 hover:border-white/30 bg-white/5 border-2'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-6 h-6 text-indigo-400" />
                        <div>
                          <p className="font-bold text-white">{goal.label}</p>
                          <p className="text-xs text-indigo-200/70">{goal.desc}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
              
              <div>
                <label className="block text-sm text-indigo-200 mb-2">
                  Target Savings: <span className="text-indigo-400 font-bold">{energyGoals.targetSavingsPercent}%</span>
                </label>
                <input
                  type="range"
                  min={20}
                  max={60}
                  step={5}
                  value={energyGoals.targetSavingsPercent}
                  onChange={(e) => setEnergyGoals({...energyGoals, targetSavingsPercent: parseInt(e.target.value)})}
                  className="w-full accent-indigo-500"
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
                    <span className="text-white font-medium">Add Solar Panels</span>
                    <p className="text-sm text-amber-200/60">Generate your own power, appeal to eco-conscious guests</p>
                  </div>
                </label>
                
                {energyGoals.interestInSolar && (
                  <div>
                    <label className="text-sm text-amber-200">Available Roof Area (sq ft)</label>
                    <input
                      type="range"
                      min={5000}
                      max={50000}
                      step={1000}
                      value={energyGoals.roofArea}
                      onChange={(e) => setEnergyGoals({...energyGoals, roofArea: parseInt(e.target.value)})}
                      className="w-full accent-amber-500"
                    />
                    <p className="text-center text-white font-bold">
                      {energyGoals.roofArea.toLocaleString()} sq ft
                      <span className="text-amber-400 ml-2">(~{Math.round(energyGoals.roofArea * 0.015)} kW solar)</span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Step 4: Review Quote */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <WizardStepHelp
                content={HOTEL_STEP_HELP['quote']}
                colorScheme="indigo"
              />
              {isCalculating ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full mb-4" />
                  <p className="text-white font-bold">Calculating your custom quote...</p>
                </div>
              ) : quoteResult ? (
                <>
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-white mb-2">Your Hotel Battery Storage Quote</h3>
                    <p className="text-indigo-200/70">{hotelDetails.numberOfRooms} rooms • {HOTEL_CLASS_PROFILES[hotelDetails.hotelClass].name} • {hotelDetails.state}</p>
                  </div>
                  
                  {/* Main Savings Card */}
                  <div className="bg-gradient-to-br from-indigo-500/30 via-purple-500/20 to-pink-500/30 rounded-2xl p-6 border-2 border-indigo-400/50 text-center">
                    <p className="text-indigo-200 uppercase tracking-widest text-sm font-bold mb-2">🏨 Annual Savings</p>
                    <p className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-300">
                      ${Math.round(quoteResult.financials.annualSavings).toLocaleString()}
                    </p>
                  </div>
                  
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white/10 rounded-xl p-4 text-center">
                      <p className="text-2xl font-bold text-indigo-400">{quoteResult.financials.paybackYears.toFixed(1)}</p>
                      <p className="text-xs text-indigo-200/70">Year Payback</p>
                    </div>
                    <div className="bg-white/10 rounded-xl p-4 text-center">
                      <p className="text-2xl font-bold text-purple-400">{Math.round(quoteResult.financials.roi25Year)}%</p>
                      <p className="text-xs text-purple-200/70">25-Year ROI</p>
                    </div>
                    <div className="bg-white/10 rounded-xl p-4 text-center">
                      <p className="text-2xl font-bold text-pink-400">{Math.round(calculatedPower.totalPeakKW * energyGoals.targetSavingsPercent / 100)} kW</p>
                      <p className="text-xs text-pink-200/70">Battery Size</p>
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
                        <span className="text-indigo-200/70">Equipment Cost</span>
                        <span className="text-white">${Math.round(quoteResult.costs.equipmentCost).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-indigo-200/70">Installation</span>
                        <span className="text-white">${Math.round(quoteResult.costs.installationCost).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between py-2 border-t border-white/10">
                        <span className="text-white font-medium">Total Project Cost</span>
                        <span className="text-white font-bold">${Math.round(quoteResult.costs.totalProjectCost).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-indigo-400">
                        <span>Federal Tax Credit (30%)</span>
                        <span>-${Math.round(quoteResult.costs.taxCredit).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between py-2 bg-indigo-500/20 rounded-lg px-3 text-lg">
                        <span className="text-indigo-300 font-bold">Net Cost</span>
                        <span className="text-indigo-400 font-black">${Math.round(quoteResult.costs.netCost).toLocaleString()}</span>
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
                      className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 text-white py-4 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all hover:scale-105 flex items-center justify-center gap-2"
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
          
          <div className="flex items-center gap-3">
            {/* Concierge Help Button */}
            <button
              onClick={() => setShowConciergeHelp(true)}
              className="flex items-center gap-2 px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/30 text-purple-300 rounded-lg text-sm transition-all"
              title="Need help? Talk to our concierge"
            >
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">Need Help?</span>
            </button>
            
            {currentStep < WIZARD_STEPS.length - 1 && (
              <button
                onClick={() => setCurrentStep(currentStep + 1)}
                disabled={!canProceed()}
                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:from-gray-500 disabled:to-gray-600 text-white rounded-lg font-bold transition-all"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        
        {/* Concierge Help Modal */}
        {showConciergeHelp && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10 p-6">
            <div className="bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-800 rounded-2xl p-6 max-w-md border border-purple-400/30 shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-purple-500/30 rounded-full flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-purple-300" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Merlin Concierge</h3>
                  <p className="text-purple-200/70 text-sm">We're here to help</p>
                </div>
              </div>
              <p className="text-white/80 text-sm mb-4">
                Need guidance? Our energy experts can help you:
              </p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center gap-2 text-sm text-purple-200">
                  <Check className="w-4 h-4 text-emerald-400" /> Understand your hotel's energy profile
                </li>
                <li className="flex items-center gap-2 text-sm text-purple-200">
                  <Check className="w-4 h-4 text-emerald-400" /> Size your battery system correctly
                </li>
                <li className="flex items-center gap-2 text-sm text-purple-200">
                  <Check className="w-4 h-4 text-emerald-400" /> Navigate financing & incentives
                </li>
                <li className="flex items-center gap-2 text-sm text-purple-200">
                  <Check className="w-4 h-4 text-emerald-400" /> Connect with vetted installers
                </li>
              </ul>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConciergeHelp(false)}
                  className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                >
                  Continue on my own
                </button>
                <button
                  onClick={() => {
                    setShowConciergeHelp(false);
                    onRequestConsultation?.();
                  }}
                  className="flex-1 px-4 py-2 bg-purple-500 hover:bg-purple-400 text-white rounded-lg font-medium transition-colors"
                >
                  Talk to Expert
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Floating Power Gauge Widget - Always visible in bottom right */}
      {calculatedPower.totalPeakKW > 0 && (
        <PowerGaugeWidget
          data={{
            bessKW: Math.round(calculatedPower.totalPeakKW * energyGoals.targetSavingsPercent / 100),
            bessKWh: Math.round(calculatedPower.totalPeakKW * energyGoals.targetSavingsPercent / 100 * 4), // 4hr duration for hotels
            peakDemandKW: calculatedPower.totalPeakKW,
            solarKW: energyGoals.interestInSolar ? Math.round(energyGoals.roofArea * 0.015) : 0,
            generatorKW: operations.hasBackupGenerator ? operations.generatorKW : 0,
            powerGapKW: Math.max(0, calculatedPower.totalPeakKW - (
              Math.round(calculatedPower.totalPeakKW * energyGoals.targetSavingsPercent / 100) +
              (energyGoals.interestInSolar ? Math.round(energyGoals.roofArea * 0.015) : 0) +
              (operations.hasBackupGenerator ? operations.generatorKW : 0)
            )),
            isGapMet: (
              Math.round(calculatedPower.totalPeakKW * energyGoals.targetSavingsPercent / 100) +
              (energyGoals.interestInSolar ? Math.round(energyGoals.roofArea * 0.015) : 0) +
              (operations.hasBackupGenerator ? operations.generatorKW : 0)
            ) >= calculatedPower.totalPeakKW * 0.9,
          }}
          position="fixed"
        />
      )}
    </div>
  );
}
