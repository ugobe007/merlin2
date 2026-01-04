/**
 * TRUEQUOTE™ VERIFY - INTERACTIVE DEMO
 * 
 * Complete interactive preview showing the TrueQuote Verify badge
 * placement in Steps 5 and 6 of the Merlin Wizard.
 * 
 * Click either badge to see the verification worksheet modal.
 */

import React, { useState } from 'react';
import { TrueQuoteVerifyBadge } from './TrueQuoteVerifyBadge';
import type { TrueQuoteWorksheetData } from './TrueQuoteVerifyBadge';

// Demo worksheet data for a Tier III data center
const DEMO_WORKSHEET_DATA: TrueQuoteWorksheetData = {
  quoteId: 'MQ-MJW1BS7N',
  generatedAt: new Date().toISOString(),
  engineVersion: '2.0.0',
  inputs: {
    location: {
      zipCode: '89101',
      state: 'NV',
      utilityTerritory: 'NV Energy',
      electricityRate: 0.0934,
      electricityRateSource: 'EIA 2024 Nevada Average',
      demandChargeRate: 12.50,
      demandChargeSource: 'NV Energy Commercial Tariff',
      sunHours: 6.4,
      sunHoursSource: 'NREL NSRDB'
    },
    industry: {
      type: 'data-center',
      typeName: 'Data Center',
      subtype: 'tier_3',
      subtypeName: 'Tier III (Concurrently Maintainable)',
      facilityDetails: {
        rackCount: 400,
        powerPerRack: '5 kW',
        pue: 1.6
      }
    }
  },
  calculationSteps: [
    {
      stepNumber: 1,
      category: 'power_demand',
      name: 'Calculate IT Load',
      description: 'Calculate base IT equipment load from rack count',
      formula: 'IT Load = Rack Count × Power per Rack',
      calculation: '400 racks × 5 kW = 2,000 kW',
      inputs: [
        { name: 'Rack Count', value: 400, source: 'User Input (Step 3)' },
        { name: 'Power per Rack', value: '5 kW', source: 'Uptime Institute Standard' }
      ],
      output: { name: 'IT Load', value: 2000, unit: 'kW' }
    },
    {
      stepNumber: 2,
      category: 'power_demand',
      name: 'Apply PUE',
      description: 'Add cooling and infrastructure overhead',
      formula: 'Total Load = IT Load × PUE',
      calculation: '2,000 kW × 1.6 = 3,200 kW',
      inputs: [
        { name: 'IT Load', value: '2,000 kW', source: 'Step 1' },
        { name: 'PUE', value: 1.6, source: 'User Input' }
      ],
      output: { name: 'Total Facility Load', value: 3200, unit: 'kW' },
      benchmark: { source: 'ASHRAE TC 9.9', range: '1.2 - 2.0', status: 'pass' }
    },
    {
      stepNumber: 3,
      category: 'bess_sizing',
      name: 'Calculate BESS Power',
      description: 'Size battery for Tier III requirements',
      formula: 'BESS Power = Peak Demand × BESS Multiplier',
      calculation: '3,200 kW × 50% = 1,600 kW',
      inputs: [
        { name: 'Peak Demand', value: '3,200 kW', source: 'Step 2' },
        { name: 'BESS Multiplier', value: '50%', source: 'Tier III Standard' }
      ],
      output: { name: 'BESS Power', value: 1600, unit: 'kW' }
    },
    {
      stepNumber: 4,
      category: 'bess_sizing',
      name: 'Calculate BESS Energy',
      description: 'Calculate energy capacity from power and duration',
      formula: 'BESS Energy = BESS Power × Duration',
      calculation: '1,600 kW × 4 hrs = 6,400 kWh',
      inputs: [
        { name: 'BESS Power', value: '1,600 kW', source: 'Step 3' },
        { name: 'Duration', value: '4 hours', source: 'C&I Standard' }
      ],
      output: { name: 'BESS Energy', value: 6400, unit: 'kWh' }
    },
    {
      stepNumber: 5,
      category: 'generator',
      name: 'Calculate Generator Size',
      description: 'Tier III requires backup generation',
      formula: 'Generator = Peak Demand × Critical Load × Reserve',
      calculation: '3,200 kW × 100% × 1.25 = 4,000 kW',
      inputs: [
        { name: 'Peak Demand', value: '3,200 kW', source: 'Step 2' },
        { name: 'Critical Load', value: '100%', source: 'Data Center Standard' },
        { name: 'Reserve Margin', value: '1.25x', source: 'NFPA 110' }
      ],
      output: { name: 'Generator Capacity', value: 4000, unit: 'kW' },
      notes: 'Generator is REQUIRED for Tier III to meet 99.982% uptime'
    },
    {
      stepNumber: 6,
      category: 'financial',
      name: 'Calculate Total Investment',
      description: 'Sum all equipment and installation costs',
      formula: 'Total = BESS + Solar + Generator + Installation',
      calculation: '$2.24M + $1.54M + $0 + $0.57M = $4.35M',
      inputs: [
        { name: 'BESS', value: '$2,240,000', source: '6,400 kWh × $350/kWh (NREL ATB)' },
        { name: 'Solar', value: '$1,536,000', source: '1,280 kWp × $1,200/kWp' },
        { name: 'Installation', value: '$567,000', source: '15% of equipment' }
      ],
      output: { name: 'Total Investment', value: 4343000, unit: '$' }
    },
    {
      stepNumber: 7,
      category: 'financial',
      name: 'Apply Federal ITC',
      description: 'Calculate 30% Investment Tax Credit (IRA 2022)',
      formula: 'ITC = (BESS + Solar) × 30%',
      calculation: '($2.24M + $1.54M) × 30% = $1.13M',
      inputs: [
        { name: 'ITC-Eligible', value: '$3,776,000', source: 'BESS + Solar costs' },
        { name: 'ITC Rate', value: '30%', source: 'IRS 48E, Inflation Reduction Act' }
      ],
      output: { name: 'Federal ITC', value: 1132800, unit: '$' }
    },
    {
      stepNumber: 8,
      category: 'financial',
      name: 'Calculate Payback',
      description: 'Time to recover investment from savings',
      formula: 'Payback = Net Cost ÷ Annual Savings',
      calculation: '$3.21M ÷ $453K/yr = 7.1 years',
      inputs: [
        { name: 'Net Cost', value: '$3,210,200', source: 'Total - ITC' },
        { name: 'Annual Savings', value: '$453,000/yr', source: 'Demand + Arbitrage + Solar' }
      ],
      output: { name: 'Payback Period', value: 7.1, unit: 'years' },
      benchmark: { source: 'Industry standard', range: '3-10 years', status: 'pass' }
    }
  ],
  results: {
    peakDemandKW: 3200,
    bessKW: 1600,
    bessKWh: 6400,
    solarKWp: 1280,
    generatorKW: 4000,
    totalInvestment: 4343000,
    federalITC: 1132800,
    netCost: 3210200,
    annualSavings: 453000,
    paybackYears: 7.1
  },
  deviations: [
    {
      field: 'BESS Power',
      displayed: 100,
      calculated: 1600,
      deviationPercent: 93.75,
      severity: 'critical',
      explanation: 'Displayed BESS (100 kW) is 93% smaller than calculated (1,600 kW)',
      recommendation: 'Update BESS sizing to 1,600 kW for Tier III data center'
    },
    {
      field: 'Generator',
      displayed: 0,
      calculated: 4000,
      deviationPercent: 100,
      severity: 'critical',
      explanation: 'Tier III requires backup generation but none was selected',
      recommendation: 'Add 4,000 kW backup generator for 99.982% uptime compliance'
    }
  ],
  sources: [
    { id: 'nrel', shortName: 'NREL ATB 2024', fullName: 'Annual Technology Baseline', organization: 'NREL', year: 2024, url: 'https://atb.nrel.gov', usedFor: ['BESS costs', 'Solar costs'] },
    { id: 'eia', shortName: 'EIA 2024', fullName: 'State Electricity Profiles', organization: 'EIA', year: 2024, url: 'https://eia.gov', usedFor: ['Electricity rates'] },
    { id: 'uptime', shortName: 'Uptime Institute', fullName: 'Tier Standard', organization: 'Uptime Institute', year: 2024, url: 'https://uptimeinstitute.com', usedFor: ['Data center classification'] },
    { id: 'ashrae', shortName: 'ASHRAE TC 9.9', fullName: 'Data Center Guidelines', organization: 'ASHRAE', year: 2023, usedFor: ['PUE standards', 'Power benchmarks'] },
    { id: 'nfpa', shortName: 'NFPA 110', fullName: 'Emergency Power Standard', organization: 'NFPA', year: 2022, usedFor: ['Generator requirements'] },
    { id: 'irs', shortName: 'IRS 48E', fullName: 'Investment Tax Credit', organization: 'IRS', year: 2022, usedFor: ['Federal ITC (30%)'] }
  ]
};

export default function TrueQuoteVerifyDemo() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
      padding: '2rem',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'white', marginBottom: '0.5rem' }}>
            TrueQuote™ Verify Badge Demo
          </h1>
          <p style={{ color: '#94a3b8' }}>
            Showing badge placement in Steps 5 and 6 of the Merlin Wizard
          </p>
        </div>
        
        {/* Step 5 Demo */}
        <div style={{
          background: 'rgba(30, 41, 59, 0.5)',
          borderRadius: '1rem',
          border: '1px solid #334155',
          padding: '1.5rem',
          marginBottom: '2rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', fontSize: '0.875rem', color: '#94a3b8' }}>
            <span style={{ padding: '0.25rem 0.5rem', background: '#334155', borderRadius: '0.25rem' }}>Step 5 of 6</span>
            <span>System Selection</span>
          </div>
          
          {/* System Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
            {/* Starter Card */}
            <div style={{ background: 'rgba(51, 65, 85, 0.5)', borderRadius: '0.75rem', padding: '1rem', border: '1px solid #475569' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <div style={{ width: '2rem', height: '2rem', borderRadius: '0.5rem', background: 'rgba(34, 211, 238, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: '#22d3ee' }}>⚡</span>
                </div>
                <div>
                  <div style={{ fontWeight: '600', color: 'white' }}>STARTER</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Smart & efficient</div>
                </div>
              </div>
              <div style={{ fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', marginBottom: '0.5rem' }}>
                  <span>Power</span><span style={{ color: 'white' }}>70 kW</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', marginBottom: '0.5rem' }}>
                  <span>Storage</span><span style={{ color: 'white' }}>210 kWh</span>
                </div>
              </div>
              <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '0.5rem' }}>
                <div style={{ color: '#10b981', fontWeight: '600' }}>$75K/yr savings</div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>4.6 year payback</div>
              </div>
            </div>
            
            {/* Perfect Fit Card (Selected) */}
            <div style={{ background: 'rgba(51, 65, 85, 0.5)', borderRadius: '0.75rem', padding: '1rem', border: '2px solid rgba(234, 179, 8, 0.5)', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '-0.75rem', right: '1rem', padding: '0.25rem 0.5rem', background: '#eab308', borderRadius: '0.25rem', fontSize: '0.75rem', fontWeight: 'bold', color: '#713f12' }}>
                ⭐ MERLIN'S PICK
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <div style={{ width: '2rem', height: '2rem', borderRadius: '0.5rem', background: 'rgba(234, 179, 8, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: '#eab308' }}>✨</span>
                </div>
                <div>
                  <div style={{ fontWeight: '600', color: 'white' }}>PERFECT FIT</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Merlin's pick</div>
                </div>
              </div>
              <div style={{ fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', marginBottom: '0.5rem' }}>
                  <span>Power</span><span style={{ color: 'white' }}>100 kW</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', marginBottom: '0.5rem' }}>
                  <span>Storage</span><span style={{ color: 'white' }}>400 kWh</span>
                </div>
              </div>
              <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '0.5rem' }}>
                <div style={{ color: '#10b981', fontWeight: '600' }}>$80K/yr savings</div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>4.9 year payback</div>
              </div>
              <button style={{ width: '100%', marginTop: '1rem', padding: '0.5rem', background: '#10b981', borderRadius: '0.5rem', color: 'white', fontSize: '0.875rem', fontWeight: '500', border: 'none', cursor: 'pointer' }}>
                ✓ SELECTED
              </button>
            </div>
            
            {/* Beast Mode Card */}
            <div style={{ background: 'rgba(51, 65, 85, 0.5)', borderRadius: '0.75rem', padding: '1rem', border: '1px solid #475569' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <div style={{ width: '2rem', height: '2rem', borderRadius: '0.5rem', background: 'rgba(168, 85, 247, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: '#a855f7' }}>🚀</span>
                </div>
                <div>
                  <div style={{ fontWeight: '600', color: 'white' }}>BEAST MODE</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Maximum savings</div>
                </div>
              </div>
              <div style={{ fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', marginBottom: '0.5rem' }}>
                  <span>Power</span><span style={{ color: 'white' }}>150 kW</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', marginBottom: '0.5rem' }}>
                  <span>Storage</span><span style={{ color: 'white' }}>900 kWh</span>
                </div>
              </div>
              <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '0.5rem' }}>
                <div style={{ color: '#10b981', fontWeight: '600' }}>$92K/yr savings</div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>5.6 year payback</div>
              </div>
            </div>
          </div>
          
          {/* TrueQuote Verify Badge - STEP 5 PLACEMENT */}
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '1rem', borderTop: '1px solid #334155' }}>
            <TrueQuoteVerifyBadge
              quoteId={DEMO_WORKSHEET_DATA.quoteId}
              worksheetData={DEMO_WORKSHEET_DATA}
              variant="full"
            />
          </div>
        </div>
        
        {/* Step 6 Demo */}
        <div style={{
          background: 'rgba(30, 41, 59, 0.5)',
          borderRadius: '1rem',
          border: '1px solid #334155',
          padding: '1.5rem',
          marginBottom: '2rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', fontSize: '0.875rem', color: '#94a3b8' }}>
            <span style={{ padding: '0.25rem 0.5rem', background: '#334155', borderRadius: '0.25rem' }}>Step 6 of 6</span>
            <span>Quote Summary</span>
          </div>
          
          {/* Quote Header with Badge */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid #334155' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '3rem', height: '3rem', borderRadius: '0.75rem', background: 'linear-gradient(135deg, #a855f7, #ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                ✨
              </div>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'white', margin: 0 }}>PERFECT FIT</h2>
                <p style={{ fontSize: '0.875rem', color: '#94a3b8', margin: 0 }}>📍 NV • 🏢 Data Center</p>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Quote ID</div>
                <div style={{ fontFamily: 'monospace', color: 'white' }}>MQ-MJW1BS7N</div>
              </div>
              
              {/* TrueQuote Verify Badge - STEP 6 PLACEMENT (Compact) */}
              <TrueQuoteVerifyBadge
                quoteId={DEMO_WORKSHEET_DATA.quoteId}
                worksheetData={DEMO_WORKSHEET_DATA}
                variant="compact"
              />
            </div>
          </div>
          
          {/* Quote Content Preview */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div style={{ background: 'rgba(51, 65, 85, 0.3)', borderRadius: '0.75rem', padding: '1rem' }}>
              <h3 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#94a3b8', marginBottom: '0.75rem', marginTop: 0 }}>SYSTEM COMPONENTS</h3>
              <div style={{ fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: '#94a3b8' }}>🔋 Battery Storage</span>
                  <span style={{ color: 'white' }}>100 kW / 400 kWh</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: '#94a3b8' }}>☀️ Solar Array</span>
                  <span style={{ color: 'white' }}>280 kWp</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: '#94a3b8' }}>⚡ EV Charging</span>
                  <span style={{ color: '#64748b' }}>Not selected</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>🔌 Generator</span>
                  <span style={{ color: '#64748b' }}>Not selected</span>
                </div>
              </div>
            </div>
            
            <div style={{ background: 'rgba(51, 65, 85, 0.3)', borderRadius: '0.75rem', padding: '1rem' }}>
              <h3 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#94a3b8', marginBottom: '0.75rem', marginTop: 0 }}>INVESTMENT SUMMARY</h3>
              <div style={{ fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: '#94a3b8' }}>Total Investment</span>
                  <span style={{ color: 'white' }}>$560K</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: '#10b981' }}>Federal ITC (30%)</span>
                  <span style={{ color: '#10b981' }}>-$168K</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: '1px solid #475569' }}>
                  <span style={{ color: 'white', fontWeight: '600' }}>Net Cost</span>
                  <span style={{ color: 'white', fontWeight: '600' }}>$392K</span>
                </div>
              </div>
              <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(168, 85, 247, 0.1)', borderRadius: '0.5rem' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#a855f7' }}>$80K/yr</div>
                <div style={{ fontSize: '0.875rem', color: '#94a3b8' }}>Annual Savings • 4.9 yr payback</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Instructions */}
        <div style={{
          background: 'rgba(5, 150, 105, 0.1)',
          border: '1px solid rgba(5, 150, 105, 0.3)',
          borderRadius: '0.75rem',
          padding: '1rem'
        }}>
          <h3 style={{ fontWeight: '600', color: '#10b981', marginBottom: '0.5rem', marginTop: 0 }}>
            👆 Click either TrueQuote Verify badge to see the worksheet modal
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'rgba(167, 243, 208, 0.7)', margin: 0 }}>
            The badge shows a warning count (2) because the demo data includes critical deviations 
            (undersized BESS and missing generator for a Tier III data center).
          </p>
        </div>
      </div>
    </div>
  );
}
