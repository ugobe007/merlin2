/**
 * MERLIN INPUT COMPONENTS - LIVE DEMO
 * ====================================
 * 
 * Interactive demonstration of all input components
 * matching the November 2025 design system.
 * 
 * Run this in your React app to see all components in action.
 */

import React, { useState } from 'react';
import {
  Crown,
  Building2,
  Ruler,
  Users,
  ArrowUpDown,
  Server,
  Zap,
  Battery,
  Sun,
  Waves,
  Dumbbell,
  Utensils,
  Plug,
  Banknote,
  Leaf,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Clock
} from 'lucide-react';

import {
  QuestionCard,
  MerlinDropdown,
  MerlinToggle,
  MerlinSlider,
  MerlinStepper,
  MerlinChips,
  MerlinYesNo
} from './MerlinInputs';

// ═══════════════════════════════════════════════════════════════════════════════
// DEMO COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function MerlinInputsDemo() {
  // Demo state for all inputs
  const [equipmentTier, setEquipmentTier] = useState('');
  const [buildingClass, setBuildingClass] = useState('');
  const [squareFootage, setSquareFootage] = useState('');
  const [occupancy, setOccupancy] = useState(250);
  const [floors, setFloors] = useState(5);
  const [hasDataCenter, setHasDataCenter] = useState<boolean | null>(null);
  const [goals, setGoals] = useState<string[]>([]);
  const [peakDemand, setPeakDemand] = useState(500);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-indigo-950 to-slate-950 p-4 md:p-8">
      {/* Background Pattern */}
      <div className="fixed inset-0 opacity-5 pointer-events-none">
        <div 
          className="absolute inset-0" 
          style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '32px 32px'
          }} 
        />
      </div>
      
      <div className="relative max-w-3xl mx-auto">
        {/* Header - Merlin Greeting Panel */}
        <div className="relative bg-gradient-to-r from-violet-600 via-purple-600 to-violet-700 rounded-2xl p-6 mb-6 overflow-hidden shadow-2xl shadow-purple-500/30">
          {/* Sparkle effects */}
          <div className="absolute top-4 right-20 w-2 h-2 bg-yellow-300 rounded-full animate-pulse" />
          <div className="absolute top-8 right-32 w-1.5 h-1.5 bg-yellow-200 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
          <div className="absolute bottom-6 right-16 w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDelay: '500ms' }} />
          
          <div className="flex items-start gap-4">
            {/* Merlin Avatar */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-400 to-purple-700 flex items-center justify-center shadow-lg ring-2 ring-white/20">
              <Sparkles className="w-8 h-8 text-yellow-300" />
            </div>
            
            <div className="flex-1">
              <p className="text-white/90 text-lg leading-relaxed">
                Tell me about your facility. I'll analyze your data to recommend the perfect energy solution.
              </p>
            </div>
          </div>
          
          {/* Progress */}
          <div className="flex items-center justify-center gap-3 mt-6">
            <span className="px-4 py-1.5 bg-white/10 backdrop-blur rounded-full text-white text-sm font-medium">
              Step 3 of 5 • Facility Details
            </span>
            <span className="px-3 py-1.5 bg-white/10 backdrop-blur rounded-full text-white/70 text-sm flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              ~5 minutes total
            </span>
          </div>
        </div>
        
        {/* Context Bar */}
        <div className="bg-gradient-to-r from-purple-600/20 via-indigo-600/20 to-blue-600/20 rounded-2xl p-4 mb-6 border border-purple-400/30 backdrop-blur-sm">
          <div className="flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2 text-white/80">
              <Building2 className="w-4 h-4 text-blue-400" />
              <span>Nevada</span>
            </div>
            <div className="w-px h-4 bg-white/20" />
            <div className="flex items-center gap-2 text-white/80">
              <Building2 className="w-4 h-4 text-amber-400" />
              <span>Office Buildings</span>
            </div>
            <div className="w-px h-4 bg-white/20" />
            <div className="flex items-center gap-2 text-white/80">
              <span className="text-emerald-400">✓</span>
              <span>8 questions</span>
            </div>
          </div>
        </div>
        
        {/* Question Cards */}
        <div className="space-y-4">
          
          {/* 1. Toggle Example - Equipment Tier */}
          <QuestionCard
            icon={Crown}
            iconGradient="amber"
            title="Equipment tier"
            subtitle="Premium includes smart building systems and high-efficiency HVAC"
          >
            <MerlinToggle
              options={[
                { value: 'standard', label: 'Standard', sublabel: 'Conventional building systems' },
                { value: 'premium', label: 'Premium', sublabel: 'Smart building with BMS (+30%)' },
              ]}
              value={equipmentTier}
              onChange={setEquipmentTier}
            />
          </QuestionCard>
          
          {/* 2. Toggle Example - Building Class (3 options) */}
          <QuestionCard
            icon={Building2}
            iconGradient="purple"
            title="Building class"
            subtitle="Different building classes have different amenity levels"
          >
            <MerlinToggle
              options={[
                { value: 'A', label: 'Class A', sublabel: 'Premium, high-rise' },
                { value: 'B', label: 'Class B', sublabel: 'Standard, mid-rise' },
                { value: 'C', label: 'Class C', sublabel: 'Basic, older' },
              ]}
              value={buildingClass}
              onChange={setBuildingClass}
              columns={3}
            />
          </QuestionCard>
          
          {/* 3. Dropdown Example - Square Footage */}
          <QuestionCard
            icon={Ruler}
            iconGradient="emerald"
            title="Building square footage"
            subtitle="Total leasable/usable space"
          >
            <MerlinDropdown
              options={[
                { value: '10000', label: 'Under 10,000 sq ft' },
                { value: '25000', label: '10,000 - 25,000 sq ft' },
                { value: '50000', label: '25,000 - 50,000 sq ft' },
                { value: '100000', label: '50,000 - 100,000 sq ft' },
                { value: '250000', label: '100,000 - 250,000 sq ft' },
                { value: '500000', label: '250,000+ sq ft' },
              ]}
              value={squareFootage}
              onChange={setSquareFootage}
              placeholder="Select an option..."
            />
          </QuestionCard>
          
          {/* 4. Slider Example - Occupancy */}
          <QuestionCard
            icon={Users}
            iconGradient="pink"
            title="Average building occupancy"
            subtitle="Typical workday population"
          >
            <MerlinSlider
              min={10}
              max={2000}
              step={10}
              value={occupancy}
              onChange={setOccupancy}
              formatValue={(v) => v.toLocaleString()}
              unit=" people"
              showTicks
              tickCount={5}
            />
          </QuestionCard>
          
          {/* 5. Stepper Example - Number of Floors */}
          <QuestionCard
            icon={ArrowUpDown}
            iconGradient="blue"
            title="Number of floors"
            subtitle="Total building floors including basement levels"
          >
            <MerlinStepper
              min={1}
              max={100}
              step={1}
              value={floors}
              onChange={setFloors}
              unit="floors"
            />
          </QuestionCard>
          
          {/* 6. Yes/No Example - Data Center */}
          <QuestionCard
            icon={Server}
            iconGradient="slate"
            title="Do you have a data center/server room?"
            subtitle="IT infrastructure requiring uninterruptible power supply (UPS)"
          >
            <MerlinYesNo
              value={hasDataCenter}
              onChange={setHasDataCenter}
              yesLabel="Yes, we have servers"
              noLabel="No server room"
            />
          </QuestionCard>
          
          {/* 7. Multi-Select Chips - Goals */}
          <QuestionCard
            icon={Zap}
            iconGradient="amber"
            title="What are your energy goals?"
            subtitle="Select up to 3 priorities"
          >
            <MerlinChips
              options={[
                { value: 'reduce_costs', label: 'Reduce Costs', icon: Banknote },
                { value: 'sustainability', label: 'Sustainability', icon: Leaf },
                { value: 'backup_power', label: 'Backup Power', icon: ShieldCheck },
                { value: 'peak_shaving', label: 'Peak Shaving', icon: Zap },
                { value: 'ev_charging', label: 'EV Charging', icon: Plug },
                { value: 'solar', label: 'Solar Integration', icon: Sun },
              ]}
              values={goals}
              onChange={setGoals}
              maxSelections={3}
            />
          </QuestionCard>
          
          {/* 8. Slider with kW - Peak Demand */}
          <QuestionCard
            icon={Battery}
            iconGradient="emerald"
            title="Estimated peak demand"
            subtitle="Maximum power draw during peak usage"
          >
            <MerlinSlider
              min={50}
              max={5000}
              step={50}
              value={peakDemand}
              onChange={setPeakDemand}
              formatValue={(v) => v.toLocaleString()}
              unit=" kW"
              showMinMax
            />
          </QuestionCard>
          
        </div>
        
        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          <button className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 border border-white/20 text-white/80 hover:bg-white/20 transition-all duration-200">
            <ChevronLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          
          {/* Step Indicators */}
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((step) => (
              <div 
                key={step}
                className={`
                  h-2.5 rounded-full transition-all duration-300
                  ${step === 3 ? 'w-8 bg-violet-400' : step < 3 ? 'w-2.5 bg-emerald-400' : 'w-2.5 bg-white/20'}
                `}
              />
            ))}
          </div>
          
          <button className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-[1.02] transition-all duration-200">
            <span>Continue</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        
        {/* TrueQuote Badge */}
        <div className="flex justify-center mt-8">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
            <Battery className="w-4 h-4" />
            <span>Powered by TrueQuote™ — Every calculation backed by real utility data</span>
          </div>
        </div>
        
        {/* Debug Output */}
        <div className="mt-8 p-4 rounded-xl bg-white/5 border border-white/10">
          <h4 className="text-white/60 text-sm font-medium mb-2">Current Values (Debug)</h4>
          <pre className="text-xs text-white/40 overflow-auto">
{JSON.stringify({
  equipmentTier,
  buildingClass,
  squareFootage,
  occupancy,
  floors,
  hasDataCenter,
  goals,
  peakDemand
}, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
