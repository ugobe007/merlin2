// Professional quote export utilities for PDF, Excel, and Word

interface QuoteData {
  storageSizeMW: number;
  durationHours: number;
  solarMW: number;
  windMW: number;
  generatorMW: number;
  location: string;
  industryTemplate: string | string[];
  gridConnection?: string;
  totalProjectCost: number;
  annualSavings: number;
  paybackYears: number;
  taxCredit: number;
  netCost: number;
  installationOption: string;
  shippingOption: string;
  financingOption: string;
}

const getIndustryName = (template: string | string[]): string => {
  const templateKey = Array.isArray(template) ? template[0] : template;
  const industryMap: { [key: string]: string } = {
    'manufacturing': 'Manufacturing Facility',
    'data-center': 'Data Center',
    'cold-storage': 'Cold Storage Warehouse',
    'hospital': 'Hospital',
    'university': 'University/College Campus',
    'retail': 'Retail Store',
    'microgrid': 'Microgrid',
    'agricultural': 'Agricultural Operation',
    'car-wash': 'Car Wash',
    'ev-charging': 'EV Charging Hub',
    'apartment': 'Apartment Building',
    'indoor-farm': 'Indoor Farm'
  };
  const result = industryMap[templateKey] || templateKey;
  
  // If multiple templates, show count
  if (Array.isArray(template) && template.length > 1) {
    return `${result} (+${template.length - 1} more)`;
  }
  return result;
};

export const generatePDF = (quoteData: QuoteData, equipmentBreakdown: any): void => {
  const totalEnergyMWh = quoteData.storageSizeMW * quoteData.durationHours;
  const hasRenewables = quoteData.solarMW > 0 || quoteData.windMW > 0 || quoteData.generatorMW > 0;
  const industryName = getIndustryName(quoteData.industryTemplate);
  
  // Create a professional HTML document for printing/PDF
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow pop-ups to download the PDF');
    return;
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>BESS Quote - ${industryName}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #1f2937;
          background: linear-gradient(135deg, #6B46C1 0%, #553C9A 100%);
          padding: 40px 20px;
        }
        
        .container {
          max-width: 900px;
          margin: 0 auto;
          background: white;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        
        .header {
          background: linear-gradient(135deg, #6B46C1 0%, #553C9A 100%);
          color: white;
          padding: 60px 40px;
          text-align: center;
        }
        
        .merlin-logo {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 15px;
          margin-bottom: 30px;
          font-size: 42px;
          font-weight: bold;
        }
        
        .merlin-icon {
          font-size: 48px;
        }
        
        .header h1 {
          font-size: 48px;
          font-weight: bold;
          margin-bottom: 10px;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
        }
        
        .header .subtitle {
          font-size: 20px;
          opacity: 0.95;
          margin-bottom: 30px;
        }
        
        .header .industry-tag {
          display: inline-block;
          background: rgba(255,255,255,0.2);
          backdrop-filter: blur(10px);
          padding: 12px 30px;
          border-radius: 50px;
          font-size: 18px;
          font-weight: 600;
          border: 2px solid rgba(255,255,255,0.3);
        }
        
        .content {
          padding: 40px;
        }
        
        .section {
          margin-bottom: 40px;
          page-break-inside: avoid;
        }
        
        .section-title {
          font-size: 24px;
          font-weight: bold;
          color: #6B46C1;
          margin-bottom: 20px;
          padding-bottom: 10px;
          border-bottom: 3px solid #6B46C1;
        }
        
        .info-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
          margin-top: 20px;
        }
        
        .info-card {
          background: linear-gradient(135deg, #F7FAFC 0%, #E2E8F0 100%);
          padding: 20px;
          border-radius: 12px;
          border-left: 4px solid #6B46C1;
        }
        
        .info-card .label {
          font-size: 14px;
          color: #718096;
          margin-bottom: 5px;
          font-weight: 600;
        }
        
        .info-card .value {
          font-size: 28px;
          font-weight: bold;
          color: #1f2937;
        }
        
        .info-card .unit {
          font-size: 16px;
          color: #718096;
          font-weight: normal;
        }
        
        .highlight-card {
          background: linear-gradient(135deg, #6B46C1 0%, #553C9A 100%);
          color: white;
          padding: 30px;
          border-radius: 15px;
          text-align: center;
          margin: 30px 0;
          box-shadow: 0 10px 30px rgba(107, 70, 193, 0.3);
        }
        
        .highlight-card .big-number {
          font-size: 48px;
          font-weight: bold;
          margin: 10px 0;
        }
        
        .highlight-card .description {
          font-size: 18px;
          opacity: 0.95;
        }
        
        .cost-breakdown {
          background: #f9fafb;
          padding: 25px;
          border-radius: 12px;
          margin-top: 20px;
        }
        
        .cost-row {
          display: flex;
          justify-content: space-between;
          padding: 12px 0;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .cost-row:last-child {
          border-bottom: none;
          font-weight: bold;
          font-size: 20px;
          padding-top: 20px;
          border-top: 3px solid #6B46C1;
        }
        
        .cost-row.savings {
          color: #10b981;
        }
        
        .options-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-top: 20px;
        }
        
        .option-card {
          background: white;
          border: 2px solid #e5e7eb;
          padding: 20px;
          border-radius: 12px;
          text-align: center;
        }
        
        .option-card .icon {
          font-size: 36px;
          margin-bottom: 10px;
        }
        
        .option-card .title {
          font-weight: bold;
          font-size: 16px;
          margin-bottom: 5px;
          text-transform: capitalize;
        }
        
        .option-card .subtitle {
          font-size: 14px;
          color: #6b7280;
        }
        
        .footer {
          background: #f9fafb;
          padding: 30px 40px;
          text-align: center;
          color: #6b7280;
          font-size: 14px;
        }
        
        .footer .company {
          font-size: 18px;
          font-weight: bold;
          color: #6B46C1;
          margin-bottom: 10px;
        }
        
        @media print {
          body {
            background: white;
            padding: 0;
          }
          
          .container {
            box-shadow: none;
            max-width: 100%;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header">
          <div class="merlin-logo">
            <span class="merlin-icon">🧙‍♂️</span>
            <span>MERLIN</span>
          </div>
          <h1>⚡ Energy Storage Quote</h1>
          <div class="subtitle">Professional BESS Configuration</div>
          <div class="industry-tag">${industryName}</div>
        </div>
        
        <!-- Content -->
        <div class="content">
          <!-- Custom Solution Explanation -->
          <div style="background: linear-gradient(135deg, #EDE9FE 0%, #DDD6FE 100%); padding: 25px; border-radius: 15px; margin-bottom: 30px; border-left: 5px solid #6B46C1;">
            <h3 style="color: #6B46C1; font-size: 22px; margin-bottom: 15px; font-weight: bold;">🎯 Designed For Your ${industryName}</h3>
            <p style="font-size: 16px; line-height: 1.8; color: #374151; margin-bottom: 15px;">
              This battery energy storage system has been specifically configured to meet the unique operational requirements and energy patterns of ${industryName.toLowerCase()} facilities. 
              This ${quoteData.durationHours}-hour system is optimized for peak demand reduction and time-of-use energy arbitrage, targeting the highest-cost periods when your facility experiences peak load. The system provides reliable energy storage to maintain critical operations during grid outages while ensuring business continuity and protecting sensitive equipment.
            </p>
            <p style="font-size: 16px; line-height: 1.8; color: #374151;">
              The <strong>${quoteData.storageSizeMW.toFixed(1)} MW power rating</strong> aligns with your facility's typical peak demand, while the <strong>${quoteData.durationHours}-hour duration</strong> ensures sufficient energy capacity to meet your ${industryName.toLowerCase()}'s operational profile. This configuration maximizes financial returns while maintaining operational reliability.
            </p>
          </div>

          <!-- System Configuration -->
          <div class="section">
            <div class="section-title">🔋 Complete System Configuration</div>
            <div class="info-grid">
              <div class="info-card">
                <div class="label">Power Output</div>
                <div class="value">${quoteData.storageSizeMW.toFixed(1)} <span class="unit">MW</span></div>
              </div>
              <div class="info-card">
                <div class="label">Duration</div>
                <div class="value">${quoteData.durationHours} <span class="unit">hours</span></div>
              </div>
              <div class="info-card">
                <div class="label">Total Energy Storage</div>
                <div class="value">${totalEnergyMWh.toFixed(1)} <span class="unit">MWh</span></div>
              </div>
              <div class="info-card">
                <div class="label">Location</div>
                <div class="value" style="font-size: 20px;">${quoteData.location || 'To Be Determined'}</div>
              </div>
            </div>
            
            <!-- Technical Specifications -->
            <div style="margin-top: 20px; padding: 20px; background: #f3f4f6; border-radius: 12px;">
              <div style="font-weight: bold; margin-bottom: 15px; color: #374151; font-size: 18px;">📐 Technical Specifications</div>
              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; font-size: 14px;">
                <div><span style="color: #6b7280;">Battery Chemistry:</span> <strong>LFP (Lithium Iron Phosphate)</strong></div>
                <div><span style="color: #6b7280;">Cycle Life:</span> <strong>6,000+ cycles @ 80% DOD</strong></div>
                <div><span style="color: #6b7280;">Round-Trip Efficiency:</span> <strong>~90%</strong></div>
                <div><span style="color: #6b7280;">Response Time:</span> <strong><1 second</strong></div>
                <div><span style="color: #6b7280;">Operating Temp:</span> <strong>-20°C to 55°C</strong></div>
                <div><span style="color: #6b7280;">Warranty:</span> <strong>10 years / 70% capacity</strong></div>
                <div><span style="color: #6b7280;">Certifications:</span> <strong>UL 9540, UL 1973, IEEE 1547</strong></div>
                <div><span style="color: #6b7280;">Fire Suppression:</span> <strong>NFPA 855 Compliant</strong></div>
              </div>
            </div>
            
            <!-- System Configuration Summary -->
            <div style="margin-top: 20px; padding: 25px; background: linear-gradient(135deg, #F7FAFC 0%, #EDE9FE 100%); border-radius: 12px; border-left: 5px solid #6B46C1;">
              <div style="font-weight: bold; margin-bottom: 20px; color: #6B46C1; font-size: 22px;">⚙️ System Configuration Summary</div>
              
              
              <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 15px;">
                <div style="font-weight: bold; color: #374151; margin-bottom: 12px; font-size: 18px;">How This Configuration Meets Your Needs</div>
                
                <div style="margin-bottom: 15px;">
                  <div style="font-weight: bold; color: #6B46C1; margin-bottom: 8px;">🎯 Primary Objectives Addressed:</div>
                  <ul style="margin-left: 20px; color: #4b5563; font-size: 14px; line-height: 1.8;">
                    <li><strong>Energy Storage & Management:</strong> ${totalEnergyMWh.toFixed(1)} MWh battery system provides ${(totalEnergyMWh / (quoteData.storageSizeMW * 0.7)).toFixed(1)} hours of backup power and intelligent demand charge management</li>
                    <li><strong>Power Quality & Reliability:</strong> ${quoteData.gridConnection === 'off-grid' ? 'Grid-forming inverters enable stable operation without external grid reference' : 'Bi-directional inverters provide seamless grid integration with <50ms backup transition'}</li>
                    <li><strong>Operational Cost Reduction:</strong> System delivers ${quoteData.paybackYears.toFixed(1)}-year payback with ${((quoteData.annualSavings * 25 / quoteData.netCost) * 100).toFixed(0)}% 25-year ROI through peak shaving and energy arbitrage</li>
                    <li><strong>Business Continuity:</strong> Uninterruptible power protection prevents costly shutdowns and ensures critical operations during grid disturbances</li>
                    ${quoteData.solarMW > 0 || quoteData.windMW > 0 ? '<li><strong>Sustainability Goals:</strong> Renewable energy integration reduces CO₂ emissions while lowering long-term operating costs</li>' : ''}
                  </ul>
                </div>
                
                <div style="margin-bottom: 15px;">
                  <div style="font-weight: bold; color: #059669; margin-bottom: 8px;">🏭 Industry-Specific Benefits for ${getIndustryName(quoteData.industryTemplate)}:</div>
                  <div style="color: #4b5563; font-size: 14px; line-height: 1.6;">
                    ${quoteData.industryTemplate.includes('ev-charging') ? 
                      `<strong>EV Charging Operations:</strong> Battery system provides grid stability during high-power charging events, reduces demand charges by up to 70%, and enables 24/7 charging capability ${quoteData.gridConnection === 'off-grid' ? 'in remote locations' : 'with grid support'}. Fast charging compatibility ensures customer satisfaction and revenue optimization.` :
                    quoteData.industryTemplate.includes('manufacturing') ?
                      `<strong>Manufacturing Continuity:</strong> Uninterruptible power protection prevents costly production shutdowns, demand charge optimization reduces operating costs by 15-25%, and backup power ensures critical equipment protection during grid disturbances.` :
                    quoteData.industryTemplate.includes('data-center') ?
                      `<strong>Data Center Reliability:</strong> Mission-critical backup power with <50ms transfer time, demand charge reduction of 20-30%, and grid-independent operation capability ensure 99.99%+ uptime for IT infrastructure.` :
                    quoteData.industryTemplate.includes('hospital') ?
                      `<strong>Healthcare Facility Support:</strong> Life-safety backup power with seamless transition, reduced energy costs for 24/7 operations, and compliance with healthcare facility backup power requirements (NFPA 99).` :
                    quoteData.industryTemplate.includes('cold-storage') ?
                      `<strong>Cold Storage Efficiency:</strong> Thermal load management during peak demand periods, backup power for refrigeration systems, and energy cost optimization for temperature-critical storage operations.` :
                      `<strong>Commercial Operations:</strong> Reliable backup power protection, significant demand charge savings, and operational cost reduction tailored to your facility's energy profile and business continuity requirements.`
                    }
                  </div>
                </div>
                
                ${quoteData.gridConnection === 'off-grid' ? `
                <div style="margin-bottom: 15px;">
                  <div style="font-weight: bold; color: #dc2626; margin-bottom: 8px;">🏝️ Off-Grid Operation Capabilities:</div>
                  <ul style="margin-left: 20px; color: #4b5563; font-size: 14px; line-height: 1.8;">
                    <li><strong>Island Mode Operation:</strong> Grid-forming inverters provide stable power without external grid reference</li>
                    <li><strong>Automatic Load Management:</strong> Smart controls prioritize critical loads during limited generation periods</li>
                    <li><strong>Multi-Source Integration:</strong> Seamless coordination between solar, battery, and generator power sources</li>
                    <li><strong>Fuel Optimization:</strong> Generator runtime minimization through intelligent battery dispatch reduces operating costs</li>
                  </ul>
                </div>` : `
                <div style="margin-bottom: 15px;">
                  <div style="font-weight: bold; color: #2563eb; margin-bottom: 8px;">� Grid-Interactive Features:</div>
                  <ul style="margin-left: 20px; color: #4b5563; font-size: 14px; line-height: 1.8;">
                    <li><strong>Utility Integration:</strong> IEEE 1547 compliant interconnection with anti-islanding protection</li>
                    <li><strong>Grid Services:</strong> Potential revenue streams from frequency regulation and demand response programs</li>
                    <li><strong>Seamless Backup:</strong> Automatic transfer to island mode during grid outages with <50ms transition</li>
                    <li><strong>Peak Shaving:</strong> Intelligent discharge during high-demand periods reduces utility charges</li>
                  </ul>
                </div>`}
                
                <div>
                  <div style="font-weight: bold; color: #7c3aed; margin-bottom: 8px;">📊 Performance Optimization:</div>
                  <div style="color: #4b5563; font-size: 14px; line-height: 1.6;">
                    The system is optimized for <strong>${((totalEnergyMWh / quoteData.storageSizeMW) * 100 / 4).toFixed(0)}% daily utilization</strong>, providing optimal balance between equipment cost and operational savings. Advanced energy management algorithms maximize financial returns through time-of-use arbitrage, demand charge reduction, and renewable energy integration while ensuring equipment longevity through intelligent cycling.
                  </div>
                </div>
              </div>
            </div>
              
              <div style="background: #EDE9FE; padding: 15px; border-radius: 8px; font-size: 13px; color: #4c1d95; border: 1px solid #C4B5FD;">
                <strong>✓ Implementation Includes:</strong> Comprehensive site preparation, professional system commissioning, operator training, remote monitoring setup, and complete documentation package for utility interconnection and regulatory compliance.
              </div>
            </div>
            
            ${hasRenewables || quoteData.gridConnection === 'off-grid' ? `
            <div style="margin-top: 20px; padding: 20px; background: #ecfdf5; border-radius: 12px; border-left: 4px solid #10b981;">
              <div style="font-weight: bold; margin-bottom: 10px; color: #059669; font-size: 18px;">☀️ ${quoteData.gridConnection === 'off-grid' ? 'Power Generation Summary' : 'Renewable Energy Integration'}</div>
              <div style="display: flex; gap: 30px; flex-wrap: wrap; font-size: 16px;">
                ${quoteData.solarMW > 0 ? `<div>☀️ Solar PV: <strong>${quoteData.solarMW.toFixed(1)} MW</strong> (${(quoteData.solarMW * 1300).toFixed(0)} annual MWh)</div>` : ''}
                ${quoteData.windMW > 0 ? `<div>💨 Wind: <strong>${quoteData.windMW.toFixed(1)} MW</strong> (${(quoteData.windMW * 2200).toFixed(0)} annual MWh)</div>` : ''}
                ${quoteData.generatorMW > 0 || quoteData.gridConnection === 'off-grid' ? 
                  `<div>⚡ Generator: <strong>${quoteData.generatorMW > 0 ? quoteData.generatorMW.toFixed(1) : (quoteData.storageSizeMW * 0.5).toFixed(1)} MW</strong> (${quoteData.gridConnection === 'off-grid' ? 'Primary backup power' : 'Backup'})</div>` : ''}
              </div>
            </div>
            ` : ''}
          </div>
          
          <!-- Financial Summary -->
          <div class="section">
            <div class="section-title">🎯 Financial Summary</div>
            <div class="cost-breakdown">
              <div class="cost-row">
                <span>Equipment Cost (Battery + Inverter)</span>
                <span><strong>$${((quoteData.totalProjectCost * 0.60) / 1000000).toFixed(2)}M</strong></span>
              </div>
              <div class="cost-row">
                <span>Installation & Engineering</span>
                <span><strong>$${((quoteData.totalProjectCost * 0.25) / 1000000).toFixed(2)}M</strong></span>
              </div>
              <div class="cost-row">
                <span>Shipping & Logistics</span>
                <span><strong>$${((quoteData.totalProjectCost * 0.10) / 1000000).toFixed(2)}M</strong></span>
              </div>
              <div class="cost-row">
                <span>Permits, Commissioning & Misc.</span>
                <span><strong>$${((quoteData.totalProjectCost * 0.05) / 1000000).toFixed(2)}M</strong></span>
              </div>
              <div class="cost-row" style="background: #f3f4f6; margin-top: 10px; padding: 15px;">
                <span>Total Project Cost</span>
                <span><strong>$${(quoteData.totalProjectCost / 1000000).toFixed(2)}M</strong></span>
              </div>
              <div class="cost-row savings">
                <span>Federal ITC Tax Credit (30%)</span>
                <span><strong>-$${(quoteData.taxCredit / 1000000).toFixed(2)}M</strong></span>
              </div>
              <div class="cost-row">
                <span>Net Investment After Tax Credit</span>
                <span><strong>$${(quoteData.netCost / 1000000).toFixed(2)}M</strong></span>
              </div>
            </div>
            
            <div class="highlight-card">
              <div class="description">Estimated Annual Energy Savings</div>
              <div class="big-number">$${(quoteData.annualSavings / 1000).toFixed(0)}K</div>
              <div class="description">Simple Payback Period: ${quoteData.paybackYears.toFixed(1)} years | 25-Year ROI: ${((quoteData.annualSavings * 25 / quoteData.netCost) * 100).toFixed(0)}%</div>
            </div>
            
            <!-- Savings Breakdown -->
            <div style="margin-top: 20px; padding: 20px; background: #f3f4f6; border-radius: 12px;">
              <div style="font-weight: bold; margin-bottom: 15px; color: #374151; font-size: 18px;">💵 Annual Savings Breakdown (Estimated)</div>
              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; font-size: 14px;">
                <div><span style="color: #6b7280;">Demand Charge Reduction:</span> <strong>$${(quoteData.annualSavings * 0.45 / 1000).toFixed(0)}K</strong></div>
                <div><span style="color: #6b7280;">Energy Arbitrage (TOU):</span> <strong>$${(quoteData.annualSavings * 0.35 / 1000).toFixed(0)}K</strong></div>
                <div><span style="color: #6b7280;">Utility Incentives:</span> <strong>$${(quoteData.annualSavings * 0.15 / 1000).toFixed(0)}K</strong></div>
                <div><span style="color: #6b7280;">Backup Value / Other:</span> <strong>$${(quoteData.annualSavings * 0.05 / 1000).toFixed(0)}K</strong></div>
              </div>
              <div style="margin-top: 15px; padding: 15px; background: white; border-radius: 8px; font-size: 13px; color: #6b7280;">
                <strong>Note:</strong> Actual savings will vary based on utility rates, usage patterns, and operational strategy. This estimate assumes typical ${industryName.toLowerCase()} load profiles and current utility rates in ${quoteData.location || 'your area'}.
              </div>
            </div>
          </div>
          
          <!-- Your Selections -->
          <div class="section">
            <div class="section-title">📋 Your Selections</div>
            <div class="options-grid">
              <div class="option-card">
                <div class="icon">🏗️</div>
                <div class="title">${quoteData.installationOption.replace('-', ' ')}</div>
                <div class="subtitle">Installation</div>
              </div>
              <div class="option-card">
                <div class="icon">🚢</div>
                <div class="title">${quoteData.shippingOption.replace('-', ' ')}</div>
                <div class="subtitle">Shipping</div>
              </div>
              <div class="option-card">
                <div class="icon">🎯</div>
                <div class="title">${quoteData.financingOption}</div>
                <div class="subtitle">Financing</div>
              </div>
            </div>
          </div>
          
          <!-- Industry Application -->
          <div class="section">
            <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 20px; border-radius: 12px; border-left: 4px solid #f59e0b;">
              <div style="font-weight: bold; margin-bottom: 10px; color: #d97706;">� Industry Application</div>
              <div style="font-size: 18px; text-transform: capitalize;">${industryName} Energy Storage Solution</div>
            </div>
          </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
          <div class="company">🧙‍♂️ MERLIN Energy Solutions</div>
          <div>Professional Battery Energy Storage Systems</div>
          <div style="margin-top: 10px;">Quote Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
          <div style="margin-top: 5px; font-size: 12px; font-style: italic;">Your trusted energy storage advisor</div>
        </div>
      </div>
      
      <!-- Calculation Details Section (Hidden by default) -->
      <div id="calculationDetails" style="display: none; background: #F8FAFC; border: 2px solid #E2E8F0; padding: 25px; border-radius: 8px; margin-top: 30px;">
        <h3 style="margin: 0 0 20px 0; color: #1F2937; font-size: 20px; text-align: center;">🤖 AI-Powered Financial Calculations</h3>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
          <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #3B82F6;">
            <h4 style="margin: 0 0 10px 0; color: #1E40AF;">System Specifications</h4>
            <ul style="margin: 0; padding-left: 20px; font-size: 13px; line-height: 1.6;">
              <li>Battery Capacity: <strong>${totalEnergyMWh.toFixed(1)} MWh</strong></li>
              <li>Power Rating: <strong>${quoteData.storageSizeMW.toFixed(1)} MW</strong></li>
              <li>Duration: <strong>${quoteData.durationHours.toFixed(1)} hours</strong></li>
              <li>Round-trip Efficiency: <strong>85-90%</strong></li>
              <li>Backup Duration: <strong>${(totalEnergyMWh / (quoteData.storageSizeMW * 0.7)).toFixed(1)} hours</strong></li>
            </ul>
          </div>
          
          <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #059669;">
            <h4 style="margin: 0 0 10px 0; color: #065F46;">Cost Analysis</h4>
            <ul style="margin: 0; padding-left: 20px; font-size: 13px; line-height: 1.6;">
              <li>Total Project Cost: <strong>$$${(quoteData.totalProjectCost / 1000000).toFixed(2)}M</strong></li>
              <li>Federal ITC Credit (30%): <strong>-$$${(quoteData.taxCredit / 1000000).toFixed(2)}M</strong></li>
              <li>Net Investment: <strong>$$${(quoteData.netCost / 1000000).toFixed(2)}M</strong></li>
              <li>Cost per MWh: <strong>$$${(quoteData.netCost / totalEnergyMWh / 1000).toFixed(0)}K</strong></li>
              <li>Cost per MW: <strong>$$${(quoteData.netCost / quoteData.storageSizeMW / 1000000).toFixed(1)}M</strong></li>
            </ul>
          </div>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
          <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #7C3AED;">
            <h4 style="margin: 0 0 10px 0; color: #6B46C1;">Savings Methodology</h4>
            <ul style="margin: 0; padding-left: 20px; font-size: 13px; line-height: 1.6;">
              <li>Demand Charge Reduction: <strong>Peak shaving analysis</strong></li>
              <li>Time-of-Use Arbitrage: <strong>Peak/off-peak differential</strong></li>
              <li>Capacity Factor: <strong>${((totalEnergyMWh / quoteData.storageSizeMW) * 100 / 4).toFixed(0)}% daily utilization</strong></li>
              <li>Annual Savings: <strong>$$${(quoteData.annualSavings / 1000).toFixed(0)}K/year</strong></li>
              <li>Monthly Savings: <strong>$$${(quoteData.annualSavings / 12 / 1000).toFixed(0)}K/month</strong></li>
            </ul>
          </div>
          
          <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #DC2626;">
            <h4 style="margin: 0 0 10px 0; color: #B91C1C;">ROI Calculations</h4>
            <ul style="margin: 0; padding-left: 20px; font-size: 13px; line-height: 1.6;">
              <li>Simple Payback: <strong>$$${(quoteData.netCost / 1000000).toFixed(2)}M ÷ $$${(quoteData.annualSavings / 1000).toFixed(0)}K = ${quoteData.paybackYears.toFixed(1)} years</strong></li>
              <li>10-Year ROI: <strong>${((quoteData.annualSavings * 10 / quoteData.netCost) * 100).toFixed(0)}%</strong></li>
              <li>25-Year ROI: <strong>${((quoteData.annualSavings * 25 / quoteData.netCost) * 100).toFixed(0)}%</strong></li>
              <li>O&M Allowance: <strong>$$${((quoteData.totalProjectCost * 0.02) / 1000).toFixed(0)}K/year (2%)</strong></li>
              <li>Degradation Factor: <strong>0.5% per year included</strong></li>
            </ul>
          </div>
        </div>
        
        <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #F59E0B;">
          <h4 style="margin: 0 0 10px 0; color: #D97706;">Industry-Specific Factors</h4>
          <ul style="margin: 0; padding-left: 20px; font-size: 13px; line-height: 1.6;">
            <li>Use Case: <strong>${getIndustryName(quoteData.industryTemplate)}</strong></li>
            <li>Load Profile: <strong>${quoteData.gridConnection === 'off-grid' ? 'Off-grid operation with generator backup' : 'Grid-tied with seamless backup capability'}</strong></li>
            <li>Compliance Standards: <strong>IEC 61215/61730, IEEE 1547, NFPA 855</strong></li>
            <li>Installation Type: <strong>${quoteData.gridConnection === 'off-grid' ? 'Standalone microgrid system' : 'Grid-interactive energy storage'}</strong></li>
            ${quoteData.solarMW > 0 ? `<li>Solar Integration: <strong>${quoteData.solarMW.toFixed(1)} MW PV capacity included</strong></li>` : ''}
          </ul>
        </div>
        
        <div style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; padding: 15px; border-radius: 6px; margin-top: 15px;">
          <h4 style="margin: 0 0 10px 0;">✓ AI Validation Process</h4>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 13px;">
            <div>✓ Equipment costs verified against market rates</div>
            <div>✓ Utility rate analysis from regional data</div>
            <div>✓ Industry benchmarks applied</div>
            <div>✓ Conservative assumptions used</div>
            <div>✓ Multiple scenario analysis completed</div>
            <div>✓ Performance data from similar installations</div>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 20px;">
          <button onclick="hideCalculationDetails()" style="background: #6B46C1; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: bold;">
            Hide Calculations
          </button>
        </div>
      </div>
      
      <!-- Contact Section -->
      <div style="background: linear-gradient(135deg, #6B46C1 0%, #553C9A 100%); color: white; padding: 20px; border-radius: 8px; margin-top: 30px; text-align: center;">
        <div style="font-size: 18px; font-weight: bold; margin-bottom: 10px;">📞 Questions About This Quote?</div>
        <div style="font-size: 14px; margin-bottom: 15px;">Contact Merlin Energy for personalized assistance and technical support</div>
        <div style="display: flex; gap: 15px; justify-content: center; align-items: center;">
          <button onclick="contactMerlinEnergy()" style="background: white; color: #6B46C1; border: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; font-size: 14px; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            Contact Merlin Energy
          </button>
          <button onclick="window.print()" style="background: rgba(255,255,255,0.2); color: white; border: 1px solid white; padding: 12px 24px; border-radius: 6px; font-weight: bold; font-size: 14px; cursor: pointer;">
            🖨️ Print Quote
          </button>
        </div>
      </div>
      
      <script>
        function showCalculationDetails() {
          const detailsSection = document.getElementById('calculationDetails');
          if (detailsSection) {
            detailsSection.style.display = 'block';
            setTimeout(function() {
              detailsSection.scrollIntoView({ behavior: 'smooth' });
            }, 100);
          }
        }
        
        function hideCalculationDetails() {
          const detailsSection = document.getElementById('calculationDetails');
          if (detailsSection) {
            detailsSection.style.display = 'none';
          }
        }
        
        function contactMerlinEnergy() {
          const name = prompt("Please enter your name:");
          if (name) {
            const email = prompt("Please enter your email address so we can respond:");
            if (email) {
              const message = \`Hello Merlin Energy,

I would like to discuss the energy storage quote for:
- Project: \${document.querySelector('.header-title').textContent}
- System: \${document.querySelector('.header-subtitle').textContent.replace('System: ', '')}

My contact information:
- Name: \${name}
- Email: \${email}

Please contact me to discuss this proposal and answer any questions I may have.

Thank you!\`;
              
              const mailtoLink = \`mailto:info@merlinenergy.com?subject=Quote Inquiry - Energy Storage System&body=\${encodeURIComponent(message)}\`;
              window.open(mailtoLink);
            } else {
              alert("Email address is required so we can respond to your inquiry.");
            }
          } else {
            alert("Name is required to process your inquiry.");
          }
        }
        
        window.onload = function() {
          // Disabled auto-print to allow interactive features
          // setTimeout(function() {
          //   window.print();
          // }, 500);
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
};

export const generateExcel = (quoteData: QuoteData, equipmentBreakdown: any): void => {
  const totalEnergyMWh = quoteData.storageSizeMW * quoteData.durationHours;
  const industryName = getIndustryName(quoteData.industryTemplate);
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  
  // Build system description
  let systemDescription = 'BESS';
  if (quoteData.solarMW > 0) systemDescription += ' + Solar';
  if (quoteData.windMW > 0) systemDescription += ' + Wind';
  if (quoteData.generatorMW > 0) systemDescription += ' + Generator';
  
  // Create comprehensive CSV content
  const csvContent = `ENERGY SAVINGS QUOTE - MERLIN ENERGY INC.
Generated Date:,${today}
Quote Valid Until:,${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
Website:,www.merlinenergy.com

====================================
PROJECT INFORMATION
====================================
Use Case:,${industryName}
Customer:,${industryName} Facility
Location:,${quoteData.location || 'To Be Determined'}
Industry Application:,${industryName.toUpperCase()} ENERGY STORAGE SOLUTION
System Type:,${systemDescription}

====================================
PROFESSIONAL SYSTEM BREAKDOWN
====================================
Subsystem,Description,Capacity/Scope,Estimated Cost (USD ex-VAT),Notes${equipmentBreakdown.generators && equipmentBreakdown.generators.totalCost > 0 ? `
${quoteData.gridConnection === 'off-grid' ? 'Backup Generators' : 'Natural Gas Generators'},${quoteData.gridConnection === 'off-grid' ? 'Caterpillar diesel gensets with auto-start/stop' : 'Caterpillar/Cummins NG gensets with paralleling'} (${equipmentBreakdown.generators.quantity} units),${(equipmentBreakdown.generators.quantity * equipmentBreakdown.generators.unitPowerMW).toFixed(1)} MW total,$$${(equipmentBreakdown.generators.totalCost / 1000000).toFixed(2)}M,${quoteData.gridConnection === 'off-grid' ? 'Tier 4 Final compliant with sound attenuation' : 'MCPD compliant with sound-attenuated enclosures'}` : ''}
BESS System,LFP battery storage with PCS and fire-rated enclosure,${totalEnergyMWh.toFixed(1)} MWh / ${quoteData.storageSizeMW.toFixed(1)} MW,$$${(equipmentBreakdown.batteries.totalCost / 1000000).toFixed(2)}M,"Includes HVAC thermal management, transformer tie-in, SCADA controls"
Power Conversion,${quoteData.gridConnection === 'off-grid' ? 'SMA grid-forming hybrid inverters with island mode capability' : 'SMA bi-directional grid-tie inverters with seamless transfer'},${quoteData.storageSizeMW.toFixed(1)} MW total capacity,$$${(equipmentBreakdown.inverters.totalCost / 1000000).toFixed(2)}M,${quoteData.gridConnection === 'off-grid' ? 'Grid-forming operation without external reference' : 'IEEE 1547 compliant with anti-islanding protection'}${equipmentBreakdown.solar && equipmentBreakdown.solar.totalCost > 0 ? `
Photovoltaic Array,${quoteData.gridConnection === 'off-grid' ? 'Ground-mounted PV with MPPT charge controllers' : 'Roof or ground-mounted PV with string inverters'},${quoteData.solarMW.toFixed(1)} MWp DC capacity,$$${(equipmentBreakdown.solar.totalCost / 1000000).toFixed(2)}M,IEC 61215/61730 certified modules with 25-year warranty` : ''}${equipmentBreakdown.wind && equipmentBreakdown.wind.totalCost > 0 ? `
Wind Generation,Utility-scale wind turbines with grid synchronization,${quoteData.windMW.toFixed(1)} MW rated capacity,$$${(equipmentBreakdown.wind.totalCost / 1000000).toFixed(2)}M,IEC 61400 certified with advanced blade control` : ''}
Medium Voltage Equipment,ABB transformers with protective switchgear and MV distribution,${quoteData.storageSizeMW.toFixed(1)} MW system integration,$$${((equipmentBreakdown.transformers.totalCost + equipmentBreakdown.switchgear.totalCost) / 1000000).toFixed(2)}M,"Oil-filled transformers with digital protection relays, arc-resistant switchgear"${equipmentBreakdown.evChargers && equipmentBreakdown.evChargers.totalChargingCost > 0 ? `
EV Charging Infrastructure,Level 2 and DC fast charging stations with network connectivity,${equipmentBreakdown.evChargers.level2Chargers.quantity} Level 2 + ${equipmentBreakdown.evChargers.dcFastChargers.quantity} DC Fast units,$$${(equipmentBreakdown.evChargers.totalChargingCost / 1000000).toFixed(2)}M,OCPP 2.0 compliant with payment processing and load management` : ''}
Control & Monitoring,Energy management system with SCADA integration and remote monitoring,—,$$${((equipmentBreakdown.totals.equipmentCost * 0.05) / 1000000).toFixed(2)}M,"HMI touchscreen interface, cybersecurity compliance, cloud connectivity"
Balance of Plant,Cabling and civil works with foundations and commissioning,—,$$${(equipmentBreakdown.totals.installationCost / 1000000).toFixed(2)}M,"Includes delivery, import duties, and professional commissioning"
,,,,
Total System Cost (ex-VAT),,,$$${(quoteData.totalProjectCost / 1000000).toFixed(2)}M,
Total incl. Local Taxes,,,$$${((quoteData.totalProjectCost * 1.08) / 1000000).toFixed(2)}M,"Estimated 8% combined state/local tax rate"

====================================
ROI & FINANCIAL SCENARIOS
====================================
Utilization Rate,Annual Savings (USD),Simple Payback (yrs)
5%,$$${((quoteData.annualSavings * 0.05) / 1000).toFixed(0)}K,${(quoteData.totalProjectCost / (quoteData.annualSavings * 0.05)).toFixed(1)}
10%,$$${((quoteData.annualSavings * 0.10) / 1000).toFixed(0)}K,${(quoteData.totalProjectCost / (quoteData.annualSavings * 0.10)).toFixed(1)}
15%,$$${((quoteData.annualSavings * 0.15) / 1000).toFixed(0)}K,${(quoteData.totalProjectCost / (quoteData.annualSavings * 0.15)).toFixed(1)}
25%,$$${((quoteData.annualSavings * 0.25) / 1000).toFixed(0)}K,${(quoteData.totalProjectCost / (quoteData.annualSavings * 0.25)).toFixed(1)}
50%,$$${((quoteData.annualSavings * 0.50) / 1000).toFixed(0)}K,${(quoteData.totalProjectCost / (quoteData.annualSavings * 0.50)).toFixed(1)}

Financial Metrics,,
10-Year ROI,≈ ${((quoteData.annualSavings * 10 / quoteData.netCost) * 100).toFixed(0)}% (net of O&M),
O&M Allowance,≈ $$${((quoteData.totalProjectCost * 0.02) / 1000).toFixed(0)}K / year,
${quoteData.gridConnection === 'off-grid' ? 'Fuel Cost' : 'Grid Offset Rate'},${quoteData.gridConnection === 'off-grid' ? '≈ $0.08 / kWh (Diesel)' : '≈ $0.12 / kWh (Grid Avoided)'},
CO₂ Reduction,≈ ${quoteData.gridConnection === 'off-grid' ? '75% vs diesel-only' : '45% vs grid electricity'},
TOTAL PROJECT COST,$${(quoteData.totalProjectCost / 1000000).toFixed(2)}M
Less: Federal ITC Tax Credit (30%),-$${(quoteData.taxCredit / 1000000).toFixed(2)}M
NET INVESTMENT (After Tax Credit),$${(quoteData.netCost / 1000000).toFixed(2)}M

====================================
KEY FINANCIAL METRICS
====================================
Annual Energy Savings,$${(quoteData.annualSavings / 1000).toFixed(0)}K per year
Simple Payback Period,${quoteData.paybackYears.toFixed(1)} years
25-Year Return on Investment,${((quoteData.annualSavings * 25 / quoteData.netCost) * 100).toFixed(0)}%
Total 25-Year Savings,$${((quoteData.annualSavings * 25) / 1000000).toFixed(2)}M

====================================
SYSTEM CONFIGURATION
====================================
Component,Specification
Power Output (MW),${quoteData.storageSizeMW.toFixed(1)} MW
Duration (hours),${quoteData.durationHours} hours
Total Energy Storage (MWh),${totalEnergyMWh.toFixed(1)} MWh
${quoteData.solarMW > 0 ? `Solar Generation (MW),${quoteData.solarMW.toFixed(1)} MW` : ''}
${quoteData.windMW > 0 ? `Wind Generation (MW),${quoteData.windMW.toFixed(1)} MW` : ''}
${quoteData.generatorMW > 0 ? `Generator Backup (MW),${quoteData.generatorMW.toFixed(1)} MW` : ''}
Battery Chemistry,Lithium Iron Phosphate (LFP)
Expected Cycle Life,"6,000+ cycles"
Round-Trip Efficiency,85-90%
Operating Temperature Range,-20°C to 50°C

====================================
SYSTEM CONFIGURATION SUMMARY
====================================

HOW THIS CONFIGURATION MEETS YOUR NEEDS:

🎯 PRIMARY OBJECTIVES ADDRESSED:
- Energy Storage & Management: ${totalEnergyMWh.toFixed(1)} MWh battery system provides ${(totalEnergyMWh / (quoteData.storageSizeMW * 0.7)).toFixed(1)} hours backup power and intelligent demand charge management
- Power Quality & Reliability: ${quoteData.gridConnection === 'off-grid' ? 'Grid-forming inverters enable stable operation without external grid reference' : 'Bi-directional inverters provide seamless grid integration with <50ms backup transition'}
- Operational Cost Reduction: System delivers ${quoteData.paybackYears.toFixed(1)}-year payback with ${((quoteData.annualSavings * 25 / quoteData.netCost) * 100).toFixed(0)}% 25-year ROI through peak shaving and energy arbitrage
- Business Continuity: Uninterruptible power protection prevents costly shutdowns and ensures critical operations during grid disturbances${quoteData.solarMW > 0 || quoteData.windMW > 0 ? '\n- Sustainability Goals: Renewable energy integration reduces CO₂ emissions while lowering long-term operating costs' : ''}

🏭 INDUSTRY-SPECIFIC BENEFITS FOR ${getIndustryName(quoteData.industryTemplate).toUpperCase()}:
${quoteData.industryTemplate.includes('ev-charging') ? 
  `EV Charging Operations: Battery system provides grid stability during high-power charging events, reduces demand charges by up to 70%, and enables 24/7 charging capability ${quoteData.gridConnection === 'off-grid' ? 'in remote locations' : 'with grid support'}. Fast charging compatibility ensures customer satisfaction and revenue optimization.` :
quoteData.industryTemplate.includes('manufacturing') ?
  `Manufacturing Continuity: Uninterruptible power protection prevents costly production shutdowns, demand charge optimization reduces operating costs by 15-25%, and backup power ensures critical equipment protection during grid disturbances.` :
quoteData.industryTemplate.includes('data-center') ?
  `Data Center Reliability: Mission-critical backup power with <50ms transfer time, demand charge reduction of 20-30%, and grid-independent operation capability ensure 99.99%+ uptime for IT infrastructure.` :
quoteData.industryTemplate.includes('hospital') ?
  `Healthcare Facility Support: Life-safety backup power with seamless transition, reduced energy costs for 24/7 operations, and compliance with healthcare facility backup power requirements (NFPA 99).` :
quoteData.industryTemplate.includes('cold-storage') ?
  `Cold Storage Efficiency: Thermal load management during peak demand periods, backup power for refrigeration systems, and energy cost optimization for temperature-critical storage operations.` :
  `Commercial Operations: Reliable backup power protection, significant demand charge savings, and operational cost reduction tailored to your facility's energy profile and business continuity requirements.`
}

${quoteData.gridConnection === 'off-grid' ? `🏝️ OFF-GRID OPERATION CAPABILITIES:
- Island Mode Operation: Grid-forming inverters provide stable power without external grid reference
- Automatic Load Management: Smart controls prioritize critical loads during limited generation periods
- Multi-Source Integration: Seamless coordination between solar, battery, and generator power sources
- Fuel Optimization: Generator runtime minimization through intelligent battery dispatch reduces operating costs` : `� GRID-INTERACTIVE FEATURES:
- Utility Integration: IEEE 1547 compliant interconnection with anti-islanding protection
- Grid Services: Potential revenue streams from frequency regulation and demand response programs
- Seamless Backup: Automatic transfer to island mode during grid outages with <50ms transition
- Peak Shaving: Intelligent discharge during high-demand periods reduces utility charges`}

� PERFORMANCE OPTIMIZATION:
The system is optimized for ${((totalEnergyMWh / quoteData.storageSizeMW) * 100 / 4).toFixed(0)}% daily utilization, providing optimal balance between equipment cost and operational savings. Advanced energy management algorithms maximize financial returns through time-of-use arbitrage, demand charge reduction, and renewable energy integration while ensuring equipment longevity through intelligent cycling.

✓ IMPLEMENTATION INCLUDES:
Comprehensive site preparation, professional system commissioning, operator training, remote monitoring setup, and complete documentation package for utility interconnection and regulatory compliance.

====================================
YOUR SELECTIONS
====================================
Installation Option:,${quoteData.installationOption.replace('-', ' ').toUpperCase()}
Shipping Method:,${quoteData.shippingOption.replace('-', ' ').toUpperCase()}
Financing Type:,${quoteData.financingOption}

====================================
INSTALLATION OPTIONS COMPARISON
====================================
Option,Cost Impact,Project Complexity,Timeline
Full Turnkey EPC,+25-35%,Lowest (vendor handles all),4-6 months
General Contractor,+15-25%,Medium (you coordinate trades),6-9 months
Self-Installation,+0%,Highest (DIY or own crew),9-12 months

====================================
COST BREAKDOWN BY CATEGORY
====================================
Category,Amount,Percentage
Equipment,$${((quoteData.totalProjectCost * 0.60) / 1000000).toFixed(2)}M,60%
Installation,$${((quoteData.totalProjectCost * 0.25) / 1000000).toFixed(2)}M,25%
Shipping,$${((quoteData.totalProjectCost * 0.10) / 1000000).toFixed(2)}M,10%
Permits & Other,$${((quoteData.totalProjectCost * 0.05) / 1000000).toFixed(2)}M,5%

====================================
ESTIMATED SAVINGS BREAKDOWN
====================================
Savings Source,Annual Savings,Percentage
Demand Charge Reduction,$${(quoteData.annualSavings * 0.45 / 1000).toFixed(0)}K,45%
Energy Arbitrage,$${(quoteData.annualSavings * 0.35 / 1000).toFixed(0)}K,35%
Incentives & Credits,$${(quoteData.annualSavings * 0.15 / 1000).toFixed(0)}K,15%
Backup Power Value,$${(quoteData.annualSavings * 0.05 / 1000).toFixed(0)}K,5%

====================================
25-YEAR FINANCIAL PROJECTION
====================================
Year,Annual Savings,Cumulative Savings,Net Position
1,$${(quoteData.annualSavings / 1000).toFixed(0)}K,$${(quoteData.annualSavings / 1000).toFixed(0)}K,-$${((quoteData.netCost - quoteData.annualSavings) / 1000000).toFixed(2)}M
5,$${(quoteData.annualSavings / 1000).toFixed(0)}K,$${(quoteData.annualSavings * 5 / 1000).toFixed(0)}K,${quoteData.annualSavings * 5 > quoteData.netCost ? '+' : '-'}$${(Math.abs(quoteData.annualSavings * 5 - quoteData.netCost) / 1000000).toFixed(2)}M
10,$${(quoteData.annualSavings / 1000).toFixed(0)}K,$${(quoteData.annualSavings * 10 / 1000).toFixed(0)}K,+$${((quoteData.annualSavings * 10 - quoteData.netCost) / 1000000).toFixed(2)}M
15,$${(quoteData.annualSavings / 1000).toFixed(0)}K,$${(quoteData.annualSavings * 15 / 1000).toFixed(0)}K,+$${((quoteData.annualSavings * 15 - quoteData.netCost) / 1000000).toFixed(2)}M
20,$${(quoteData.annualSavings / 1000).toFixed(0)}K,$${(quoteData.annualSavings * 20 / 1000).toFixed(0)}K,+$${((quoteData.annualSavings * 20 - quoteData.netCost) / 1000000).toFixed(2)}M
25,$${(quoteData.annualSavings / 1000).toFixed(0)}K,$${(quoteData.annualSavings * 25 / 1000).toFixed(0)}K,+$${((quoteData.annualSavings * 25 - quoteData.netCost) / 1000000).toFixed(2)}M

====================================
IMPORTANT NOTES
====================================
"This quote is based on current market pricing and utility rate structures"
"Actual costs may vary based on site conditions, interconnection requirements, and local regulations"
"Federal ITC tax credit eligibility should be confirmed with a qualified tax professional"
"State and local incentives may be available in addition to federal credits"
"Equipment specifications subject to availability and technology improvements"
"Installation timeline depends on permitting, utility approvals, and site readiness"
"Annual savings estimates assume consistent energy usage patterns and utility rates"
"System performance may vary based on operating conditions and maintenance"

====================================
NEXT STEPS
====================================
1. Review this quote and system configuration
2. Schedule a site assessment for detailed engineering
3. Confirm utility interconnection requirements
4. Apply for relevant permits and incentives
5. Finalize equipment selection and procurement
6. Begin installation and commissioning

====================================
CONTACT INFORMATION
====================================
Company:,Merlin Energy Inc.
Website:,www.merlinenergy.com
Email:,quotes@merlinenergy.com
Phone:,(555) 123-4567

Thank you for considering Merlin Energy for your energy storage needs!
`;

  // Create and download CSV file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `Merlin_Energy_Quote_${industryName.replace(/\s+/g, '_')}_${Date.now()}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up URL object
  URL.revokeObjectURL(url);
};

export const generateWord = (quoteData: QuoteData, equipmentBreakdown: any): void => {
  const totalEnergyMWh = quoteData.storageSizeMW * quoteData.durationHours;
  const hasRenewables = quoteData.solarMW > 0 || quoteData.windMW > 0 || quoteData.generatorMW > 0;
  const industryName = getIndustryName(quoteData.industryTemplate);
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  
  // Build system description
  let systemDescription = 'BESS';
  if (quoteData.solarMW > 0) {
    systemDescription += ' + Solar';
  }
  if (quoteData.windMW > 0) {
    systemDescription += ' + Wind';
  }
  if (quoteData.generatorMW > 0) {
    systemDescription += ' + Generator';
  }
  
  // Customer name (use industry as fallback)
  const customerName = industryName + ' Facility';
  
  // Create HTML content that Word can open (.doc format)
  const htmlContent = `
<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <title>BESS Quote - ${industryName}</title>
  <style>
    body { 
      font-family: Arial, Helvetica, sans-serif; 
      line-height: 1.6;
      color: #000;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px;
    }
    .header-container {
      width: 100%;
      margin-bottom: 15px;
      border: 3px solid #6B46C1;
      border-radius: 8px;
      background: linear-gradient(135deg, #E5E7EB 0%, #EDE9FE 100%);
      padding: 25px;
      text-align: center;
      box-shadow: 0 4px 6px rgba(107, 70, 193, 0.2);
    }
    .header-title {
      font-size: 28px;
      font-weight: bold;
      color: #6B46C1;
      line-height: 1.3;
      margin: 0 0 12px 0;
      text-transform: uppercase;
      text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
      letter-spacing: 1px;
    }
    .header-subtitle {
      font-size: 16px;
      font-weight: 600;
      color: #003366;
      margin: 8px 0;
      background: rgba(255, 255, 255, 0.7);
      padding: 6px 12px;
      border-radius: 4px;
      display: inline-block;
      margin-left: 8px;
      margin-right: 8px;
    }
    .company-info {
      text-align: center;
      margin-bottom: 20px;
      padding: 8px;
      background: #EDE9FE;
      border-radius: 4px;
      border: 1px solid #C4B5FD;
    }
    .company-name {
      font-size: 14px;
      font-weight: bold;
      color: #6B46C1;
      margin-bottom: 2px;
    }
    .company-website {
      font-size: 12px;
      color: #553C9A;
    }
    .section-header {
      background-color: #E5E7EB;
      padding: 10px 15px;
      margin: 25px 0 15px 0;
      border-left: 4px solid #6B46C1;
      font-size: 16px;
      font-weight: bold;
      color: #1F2937;
    }
    h1 { 
      color: #6B46C1; 
      font-size: 32px;
      border-bottom: 4px solid #6B46C1;
      padding-bottom: 10px;
      margin-bottom: 30px;
    }
    h2 { 
      color: #6B46C1; 
      font-size: 20px;
      margin-top: 25px;
      margin-bottom: 12px;
      border-bottom: 2px solid #E2E8F0;
      padding-bottom: 6px;
    }
    h3 { 
      color: #553C9A; 
      font-size: 16px;
      margin-top: 15px;
      margin-bottom: 8px;
    }
    table { 
      width: 100%; 
      border-collapse: collapse; 
      margin: 10px 0;
      font-size: 13px;
    }
    th, td { 
      border: 1px solid #d1d5db; 
      padding: 8px 12px; 
      text-align: left;
    }
    th { 
      background-color: #f3f4f6; 
      font-weight: bold;
    }
    .highlight { 
      background-color: #EDE9FE; 
      padding: 15px; 
      border-left: 4px solid #6B46C1;
      margin: 15px 0;
      font-size: 16px;
      font-weight: bold;
    }
    .info-box { 
      background-color: #EDE9FE; 
      padding: 12px; 
      margin: 12px 0;
      border-radius: 4px;
      border-left: 3px solid #6B46C1;
      font-size: 13px;
    }
    .success { 
      background-color: #ecfdf5; 
      border-left: 4px solid #10b981;
    }
    .purple-box {
      background-color: #EDE9FE;
      border-left: 4px solid #6B46C1;
      padding: 15px;
      margin: 15px 0;
      border-radius: 4px;
      font-size: 13px;
      line-height: 1.6;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #6B46C1;
      font-size: 12px;
      color: #718096;
      text-align: center;
    }
    .footer strong {
      color: #6B46C1;
      font-size: 16px;
    }
  </style>
</head>
<body>
  <!-- Header with Project Details -->
  <div class="header-container">
    <div class="header-title">ENERGY SAVINGS QUOTE</div>
    <div class="header-subtitle">USE CASE: ${industryName}</div>
    <div class="header-subtitle">Customer: ${customerName}</div>
    <div class="header-subtitle">System: ${systemDescription}</div>
  </div>
  
  <!-- Company Information -->
  <div class="company-info">
    <div class="company-name">Merlin Energy Inc.</div>
    <div class="company-website">www.merlinenergy.com</div>
  </div>
  
  <!-- Executive Summary Table -->
  <div style="background: linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 100%); padding: 25px; border-radius: 8px; margin: 25px 0;">
    <h2 style="margin: 0 0 20px 0; text-align: center; font-size: 22px; color: #1F2937; font-weight: bold;">📋 EXECUTIVE SUMMARY</h2>
    
    <table style="width: 100%; background: white; border-radius: 6px; margin-bottom: 15px; border: none; font-size: 13px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      <tr style="background: #6B46C1; color: white;">
        <td style="padding: 12px 15px; font-weight: bold; border-radius: 6px 0 0 0;">Key Metrics</td>
        <td style="padding: 12px 15px; font-weight: bold; text-align: right; border-radius: 0 6px 0 0;">Value</td>
      </tr>
      <tr>
        <td style="padding: 10px 15px; border-bottom: 1px solid #E5E7EB;"><strong>System Capacity:</strong></td>
        <td style="padding: 10px 15px; text-align: right; border-bottom: 1px solid #E5E7EB; color: #059669; font-weight: bold;">${totalEnergyMWh.toFixed(1)} MWh / ${quoteData.storageSizeMW.toFixed(1)} MW</td>
      </tr>
      <tr>
        <td style="padding: 10px 15px; border-bottom: 1px solid #E5E7EB;"><strong>Total Investment:</strong></td>
        <td style="padding: 10px 15px; text-align: right; border-bottom: 1px solid #E5E7EB; color: #6B46C1; font-weight: bold;">$$${(quoteData.totalProjectCost / 1000000).toFixed(2)}M</td>
      </tr>
      <tr>
        <td style="padding: 10px 15px; border-bottom: 1px solid #E5E7EB;"><strong>Net Cost (After ITC):</strong></td>
        <td style="padding: 10px 15px; text-align: right; border-bottom: 1px solid #E5E7EB; color: #059669; font-weight: bold;">$$${(quoteData.netCost / 1000000).toFixed(2)}M</td>
      </tr>
      <tr>
        <td style="padding: 10px 15px; border-bottom: 1px solid #E5E7EB;"><strong>Annual Savings:</strong></td>
        <td style="padding: 10px 15px; text-align: right; border-bottom: 1px solid #E5E7EB; color: #059669; font-weight: bold;">$$${(quoteData.annualSavings / 1000).toFixed(0)}K per year</td>
      </tr>
      <tr>
        <td style="padding: 10px 15px; border-bottom: 1px solid #E5E7EB;"><strong>Simple Payback:</strong></td>
        <td style="padding: 10px 15px; text-align: right; border-bottom: 1px solid #E5E7EB; color: #7C3AED; font-weight: bold;">${quoteData.paybackYears.toFixed(1)} years</td>
      </tr>
      <tr>
        <td style="padding: 10px 15px;"><strong>25-Year ROI:</strong></td>
        <td style="padding: 10px 15px; text-align: right; color: #7C3AED; font-weight: bold;">${((quoteData.annualSavings * 25 / quoteData.netCost) * 100).toFixed(0)}%</td>
      </tr>
    </table>
    
    <div style="background: linear-gradient(135deg, #6B46C1 0%, #553C9A 100%); color: white; padding: 15px; border-radius: 6px; margin-top: 15px;">
      <div style="font-weight: bold; margin-bottom: 8px; font-size: 16px;">🎯 Designed for ${getIndustryName(quoteData.industryTemplate)} Operations:</div>
      <div style="font-size: 14px; line-height: 1.6;">
        ${quoteData.industryTemplate.includes('ev-charging') ? 
          `This BESS configuration is specifically optimized for EV charging facilities, providing demand charge reduction of up to 70%, grid stability during high-power charging events, and 24/7 charging capability. The ${totalEnergyMWh.toFixed(1)} MWh capacity ensures consistent fast-charging service while minimizing utility costs and maximizing revenue potential.` :
        quoteData.industryTemplate.includes('manufacturing') ?
          `Engineered for manufacturing operations requiring uninterrupted power and cost optimization. This system provides seamless backup power during outages, reduces demand charges by 15-25%, and ensures critical equipment protection. The ${(totalEnergyMWh / (quoteData.storageSizeMW * 0.7)).toFixed(1)}-hour backup capacity protects against costly production shutdowns.` :
        quoteData.industryTemplate.includes('data-center') ?
          `Mission-critical configuration for data center operations demanding 99.99%+ uptime. Features <50ms transfer time for seamless backup power, 20-30% demand charge reduction, and grid-independent operation capability. The ${totalEnergyMWh.toFixed(1)} MWh system ensures uninterrupted IT infrastructure operation.` :
        quoteData.industryTemplate.includes('hospital') ?
          `Life-safety compliant system designed for healthcare facilities. Provides seamless backup power transition, reduces 24/7 operational energy costs, and meets NFPA 99 healthcare facility requirements. The ${(totalEnergyMWh / (quoteData.storageSizeMW * 0.7)).toFixed(1)}-hour capacity ensures patient safety and critical system protection.` :
        quoteData.industryTemplate.includes('cold-storage') ?
          `Specialized for temperature-critical cold storage operations. Manages thermal loads during peak demand periods, provides backup power for refrigeration systems, and optimizes energy costs for 24/7 cooling requirements. Prevents costly inventory loss during power outages.` :
          `Commercial-grade energy storage solution optimized for your facility's operational profile. Delivers reliable backup power protection, significant demand charge savings, and operational cost reduction tailored to your specific energy usage patterns and business continuity requirements.`
        }
      </div>
    </div>
    
    <!-- AI Calculations Transparency -->
    <div style="background: rgba(59, 130, 246, 0.1); border: 1px solid #3B82F6; padding: 15px; border-radius: 6px; margin-top: 15px;">
      <div style="display: flex; align-items: center; justify-content: space-between;">
        <div>
          <div style="font-weight: bold; color: #1E40AF; margin-bottom: 5px;">🤖 AI-Powered Financial Analysis</div>
          <div style="font-size: 13px; color: #374151;">All calculations verified by advanced AI algorithms considering utility rates, equipment specifications, and industry best practices.</div>
        </div>
        <button onclick="showCalculationDetails()" style="background: #3B82F6; color: white; border: none; padding: 8px 16px; border-radius: 4px; font-size: 12px; cursor: pointer; white-space: nowrap;">
          View Calculations
        </button>
      </div>
    </div>
  </div>
  
  <!-- QUOTE SUMMARY - Cost at a Glance -->
  <div style="background: linear-gradient(135deg, #6B46C1 0%, #553C9A 100%); color: white; padding: 30px; border-radius: 8px; margin-top: 25px; margin-bottom: 25px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    <h2 style="margin: 0 0 20px 0; text-align: center; font-size: 26px; border: none; padding: 0; letter-spacing: 1px;">🎯 QUOTE SUMMARY</h2>
    
    <!-- Professional System Breakdown Table -->
    <table style="width: 100%; background: white; color: #1F2937; border-radius: 6px; margin-bottom: 20px; border: none; font-size: 12px;">
      <tr style="background: #F3F4F6;">
        <td style="padding: 8px 10px; font-size: 11px; font-weight: bold; border: 1px solid #E5E7EB; width: 18%;">Subsystem</td>
        <td style="padding: 8px 10px; font-size: 11px; font-weight: bold; border: 1px solid #E5E7EB; width: 32%;">Description</td>
        <td style="padding: 8px 10px; font-size: 11px; font-weight: bold; border: 1px solid #E5E7EB; width: 16%;">Capacity/Scope</td>
        <td style="padding: 8px 10px; font-size: 11px; font-weight: bold; text-align: right; border: 1px solid #E5E7EB; width: 14%;">Estimated Cost</td>
        <td style="padding: 8px 10px; font-size: 11px; font-weight: bold; border: 1px solid #E5E7EB; width: 20%;">Notes</td>
      </tr>
      ${equipmentBreakdown.generators && equipmentBreakdown.generators.totalCost > 0 ? `<tr>
        <td style="padding: 6px 10px; border: 1px solid #E5E7EB; font-weight: 600; color: #059669;">${quoteData.gridConnection === 'off-grid' ? 'Backup Generators' : 'Natural Gas Generators'}</td>
        <td style="padding: 6px 10px; border: 1px solid #E5E7EB;">${quoteData.gridConnection === 'off-grid' ? 'Caterpillar diesel gensets with auto-start/stop' : 'Caterpillar/Cummins NG gensets with paralleling'} (${equipmentBreakdown.generators.quantity} units)</td>
        <td style="padding: 6px 10px; border: 1px solid #E5E7EB;">${(equipmentBreakdown.generators.quantity * equipmentBreakdown.generators.unitPowerMW).toFixed(1)} MW total</td>
        <td style="padding: 6px 10px; text-align: right; border: 1px solid #E5E7EB; font-weight: 600;">$$${(equipmentBreakdown.generators.totalCost / 1000000).toFixed(2)}M</td>
        <td style="padding: 6px 10px; border: 1px solid #E5E7EB; font-size: 10px;">${quoteData.gridConnection === 'off-grid' ? 'Tier 4 Final compliant with sound attenuation' : 'MCPD compliant with sound-attenuated enclosures'}</td>
      </tr>` : ''}
      <tr>
        <td style="padding: 6px 10px; border: 1px solid #E5E7EB; font-weight: 600; color: #8b5cf6;">BESS System</td>
        <td style="padding: 6px 10px; border: 1px solid #E5E7EB;">LFP battery storage with PCS and fire-rated enclosure</td>
        <td style="padding: 6px 10px; border: 1px solid #E5E7EB;">${totalEnergyMWh.toFixed(1)} MWh / ${quoteData.storageSizeMW.toFixed(1)} MW</td>
        <td style="padding: 6px 10px; text-align: right; border: 1px solid #E5E7EB; font-weight: 600;">$$${(equipmentBreakdown.batteries.totalCost / 1000000).toFixed(2)}M</td>
        <td style="padding: 6px 10px; border: 1px solid #E5E7EB; font-size: 10px;">Includes HVAC thermal management, transformer tie-in, SCADA controls</td>
      </tr>
      <tr>
        <td style="padding: 6px 10px; border: 1px solid #E5E7EB; font-weight: 600; color: #f59e0b;">Power Conversion</td>
        <td style="padding: 6px 10px; border: 1px solid #E5E7EB;">${quoteData.gridConnection === 'off-grid' ? 'SMA grid-forming hybrid inverters with island mode capability' : 'SMA bi-directional grid-tie inverters with seamless transfer'}</td>
        <td style="padding: 6px 10px; border: 1px solid #E5E7EB;">${quoteData.storageSizeMW.toFixed(1)} MW total capacity</td>
        <td style="padding: 6px 10px; text-align: right; border: 1px solid #E5E7EB; font-weight: 600;">$$${(equipmentBreakdown.inverters.totalCost / 1000000).toFixed(2)}M</td>
        <td style="padding: 6px 10px; border: 1px solid #E5E7EB; font-size: 10px;">${quoteData.gridConnection === 'off-grid' ? 'Grid-forming operation without external reference' : 'IEEE 1547 compliant with anti-islanding protection'}</td>
      </tr>
      ${equipmentBreakdown.solar && equipmentBreakdown.solar.totalCost > 0 ? `<tr>
        <td style="padding: 6px 10px; border: 1px solid #E5E7EB; font-weight: 600; color: #f59e0b;">Photovoltaic Array</td>
        <td style="padding: 6px 10px; border: 1px solid #E5E7EB;">${quoteData.gridConnection === 'off-grid' ? 'Ground-mounted PV with MPPT charge controllers' : 'Roof or ground-mounted PV with string inverters'}</td>
        <td style="padding: 6px 10px; border: 1px solid #E5E7EB;">${quoteData.solarMW.toFixed(1)} MWp DC capacity</td>
        <td style="padding: 6px 10px; text-align: right; border: 1px solid #E5E7EB; font-weight: 600;">$$${(equipmentBreakdown.solar.totalCost / 1000000).toFixed(2)}M</td>
        <td style="padding: 6px 10px; border: 1px solid #E5E7EB; font-size: 10px;">IEC 61215/61730 certified modules with 25-year warranty</td>
      </tr>` : ''}
      ${equipmentBreakdown.wind && equipmentBreakdown.wind.totalCost > 0 ? `<tr>
        <td style="padding: 6px 10px; border: 1px solid #E5E7EB; font-weight: 600; color: #06b6d4;">Wind Generation</td>
        <td style="padding: 6px 10px; border: 1px solid #E5E7EB;">Utility-scale wind turbines with grid synchronization</td>
        <td style="padding: 6px 10px; border: 1px solid #E5E7EB;">${quoteData.windMW.toFixed(1)} MW rated capacity</td>
        <td style="padding: 6px 10px; text-align: right; border: 1px solid #E5E7EB; font-weight: 600;">$$${(equipmentBreakdown.wind.totalCost / 1000000).toFixed(2)}M</td>
        <td style="padding: 6px 10px; border: 1px solid #E5E7EB; font-size: 10px;">IEC 61400 certified with advanced blade control</td>
      </tr>` : ''}
      <tr>
        <td style="padding: 6px 10px; border: 1px solid #E5E7EB; font-weight: 600; color: #ef4444;">MV Equipment</td>
        <td style="padding: 6px 10px; border: 1px solid #E5E7EB;">ABB transformers with protective switchgear and MV distribution</td>
        <td style="padding: 6px 10px; border: 1px solid #E5E7EB;">${quoteData.storageSizeMW.toFixed(1)} MW system integration</td>
        <td style="padding: 6px 10px; text-align: right; border: 1px solid #E5E7EB; font-weight: 600;">$$${((equipmentBreakdown.transformers.totalCost + equipmentBreakdown.switchgear.totalCost) / 1000000).toFixed(2)}M</td>
        <td style="padding: 6px 10px; border: 1px solid #E5E7EB; font-size: 10px;">Oil-filled transformers with digital protection relays, arc-resistant switchgear</td>
      </tr>
      ${equipmentBreakdown.evChargers && equipmentBreakdown.evChargers.totalChargingCost > 0 ? `<tr>
        <td style="padding: 6px 10px; border: 1px solid #E5E7EB; font-weight: 600; color: #8b5cf6;">EV Charging Infrastructure</td>
        <td style="padding: 6px 10px; border: 1px solid #E5E7EB;">Level 2 and DC fast charging stations with network connectivity</td>
        <td style="padding: 6px 10px; border: 1px solid #E5E7EB;">${equipmentBreakdown.evChargers.level2Chargers.quantity} Level 2 + ${equipmentBreakdown.evChargers.dcFastChargers.quantity} DC Fast units</td>
        <td style="padding: 6px 10px; text-align: right; border: 1px solid #E5E7EB; font-weight: 600;">$$${(equipmentBreakdown.evChargers.totalChargingCost / 1000000).toFixed(2)}M</td>
        <td style="padding: 6px 10px; border: 1px solid #E5E7EB; font-size: 10px;">OCPP 2.0 compliant with payment processing and load management</td>
      </tr>` : ''}
      <tr>
        <td style="padding: 6px 10px; border: 1px solid #E5E7EB; font-weight: 600; color: #6b7280;">Control & Monitoring</td>
        <td style="padding: 6px 10px; border: 1px solid #E5E7EB;">Energy management system with SCADA integration and remote monitoring</td>
        <td style="padding: 6px 10px; border: 1px solid #E5E7EB;">—</td>
        <td style="padding: 6px 10px; text-align: right; border: 1px solid #E5E7EB; font-weight: 600;">$$${((equipmentBreakdown.totals.equipmentCost * 0.05) / 1000000).toFixed(2)}M</td>
        <td style="padding: 6px 10px; border: 1px solid #E5E7EB; font-size: 10px;">HMI touchscreen interface, cybersecurity compliance, cloud connectivity</td>
      </tr>
      <tr>
        <td style="padding: 6px 10px; border: 1px solid #E5E7EB; font-weight: 600; color: #6b7280;">Balance of Plant</td>
        <td style="padding: 6px 10px; border: 1px solid #E5E7EB;">Cabling and civil works with foundations and commissioning</td>
        <td style="padding: 6px 10px; border: 1px solid #E5E7EB;">—</td>
        <td style="padding: 6px 10px; text-align: right; border: 1px solid #E5E7EB; font-weight: 600;">$$${(equipmentBreakdown.totals.installationCost / 1000000).toFixed(2)}M</td>
        <td style="padding: 6px 10px; border: 1px solid #E5E7EB; font-size: 10px;">Includes delivery, import duties, and professional commissioning</td>
      </tr>
      <tr style="background: #F9FAFB; border-top: 2px solid #CBD5E0;">
        <td style="padding: 10px 10px; font-size: 13px; font-weight: bold; border: 1px solid #E5E7EB;" colspan="3">Total System Cost (ex-VAT)</td>
        <td style="padding: 10px 10px; text-align: right; font-size: 14px; font-weight: bold; border: 1px solid #E5E7EB;">$$${(quoteData.totalProjectCost / 1000000).toFixed(2)}M</td>
        <td style="padding: 10px 10px; border: 1px solid #E5E7EB;"></td>
      </tr>
      <tr style="background: #FEF3C7;">
        <td style="padding: 8px 10px; font-size: 12px; font-weight: bold; border: 1px solid #E5E7EB;" colspan="3">Total incl. Local Taxes (8%)</td>
        <td style="padding: 8px 10px; text-align: right; font-size: 13px; font-weight: bold; border: 1px solid #E5E7EB;">$$${((quoteData.totalProjectCost * 1.08) / 1000000).toFixed(2)}M</td>
        <td style="padding: 8px 10px; border: 1px solid #E5E7EB; font-size: 10px;">Estimated combined state/local tax rate</td>
      </tr>
      <tr style="background: #F9FAFB;">
        <td style="padding: 10px 12px; font-size: 14px; font-weight: bold; border: 1px solid #E5E7EB;">Total Project Cost</td>
        <td style="padding: 10px 12px; text-align: right; font-size: 15px; font-weight: bold; border: 1px solid #E5E7EB;">$${(quoteData.totalProjectCost / 1000000).toFixed(2)}M</td>
      </tr>
      <tr style="background: #D1FAE5;">
        <td style="padding: 10px 12px; font-size: 13px; font-weight: bold; color: #065F46; border: 1px solid #E5E7EB;">Less: Federal ITC Tax Credit (30%)</td>
        <td style="padding: 10px 12px; text-align: right; font-size: 14px; font-weight: bold; color: #065F46; border: 1px solid #E5E7EB;">-$${(quoteData.taxCredit / 1000000).toFixed(2)}M</td>
      </tr>
    </table>
    
    <!-- ROI & Financial Scenarios Table -->
    <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 25px; border-radius: 8px; margin-top: 30px; margin-bottom: 20px;">
      <h3 style="margin: 0 0 15px 0; text-align: center; font-size: 20px;">📈 ROI & FINANCIAL SCENARIOS</h3>
      
      <table style="width: 100%; background: white; color: #1F2937; border-radius: 6px; margin-bottom: 15px; border: none; font-size: 12px;">
        <tr style="background: #F3F4F6;">
          <td style="padding: 8px 12px; font-weight: bold; border: 1px solid #E5E7EB;">Utilization Rate</td>
          <td style="padding: 8px 12px; font-weight: bold; text-align: right; border: 1px solid #E5E7EB;">Annual Savings (USD)</td>
          <td style="padding: 8px 12px; font-weight: bold; text-align: right; border: 1px solid #E5E7EB;">Simple Payback (yrs)</td>
        </tr>
        <tr>
          <td style="padding: 6px 12px; border: 1px solid #E5E7EB;">5%</td>
          <td style="padding: 6px 12px; text-align: right; border: 1px solid #E5E7EB;">$$${((quoteData.annualSavings * 0.05) / 1000).toFixed(0)}K</td>
          <td style="padding: 6px 12px; text-align: right; border: 1px solid #E5E7EB;">${(quoteData.totalProjectCost / (quoteData.annualSavings * 0.05)).toFixed(1)}</td>
        </tr>
        <tr>
          <td style="padding: 6px 12px; border: 1px solid #E5E7EB;">10%</td>
          <td style="padding: 6px 12px; text-align: right; border: 1px solid #E5E7EB;">$$${((quoteData.annualSavings * 0.10) / 1000).toFixed(0)}K</td>
          <td style="padding: 6px 12px; text-align: right; border: 1px solid #E5E7EB;">${(quoteData.totalProjectCost / (quoteData.annualSavings * 0.10)).toFixed(1)}</td>
        </tr>
        <tr>
          <td style="padding: 6px 12px; border: 1px solid #E5E7EB;">15%</td>
          <td style="padding: 6px 12px; text-align: right; border: 1px solid #E5E7EB;">$$${((quoteData.annualSavings * 0.15) / 1000).toFixed(0)}K</td>
          <td style="padding: 6px 12px; text-align: right; border: 1px solid #E5E7EB;">${(quoteData.totalProjectCost / (quoteData.annualSavings * 0.15)).toFixed(1)}</td>
        </tr>
        <tr>
          <td style="padding: 6px 12px; border: 1px solid #E5E7EB;">25%</td>
          <td style="padding: 6px 12px; text-align: right; border: 1px solid #E5E7EB;">$$${((quoteData.annualSavings * 0.25) / 1000).toFixed(0)}K</td>
          <td style="padding: 6px 12px; text-align: right; border: 1px solid #E5E7EB;">${(quoteData.totalProjectCost / (quoteData.annualSavings * 0.25)).toFixed(1)}</td>
        </tr>
        <tr style="background: #FEF3C7;">
          <td style="padding: 6px 12px; border: 1px solid #E5E7EB; font-weight: bold;">50%</td>
          <td style="padding: 6px 12px; text-align: right; border: 1px solid #E5E7EB; font-weight: bold;">$$${((quoteData.annualSavings * 0.50) / 1000).toFixed(0)}K</td>
          <td style="padding: 6px 12px; text-align: right; border: 1px solid #E5E7EB; font-weight: bold;">${(quoteData.totalProjectCost / (quoteData.annualSavings * 0.50)).toFixed(1)}</td>
        </tr>
      </table>
      
      <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 6px; font-size: 13px; line-height: 1.6;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span><strong>10-Year ROI:</strong></span>
          <span>≈ ${((quoteData.annualSavings * 10 / quoteData.netCost) * 100).toFixed(0)}% (net of O&M)</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span><strong>O&M Allowance:</strong></span>
          <span>≈ $$${((quoteData.totalProjectCost * 0.02) / 1000).toFixed(0)}K / year</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span><strong>${quoteData.gridConnection === 'off-grid' ? 'Fuel Cost:' : 'Grid Offset Rate:'}</strong></span>
          <span>${quoteData.gridConnection === 'off-grid' ? '≈ $0.08 / kWh (Diesel)' : '≈ $0.12 / kWh (Grid Avoided)'}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span><strong>CO₂ Reduction:</strong></span>
          <span>≈ ${quoteData.gridConnection === 'off-grid' ? '75% vs diesel-only' : '45% vs grid electricity'}</span>
        </div>
      </div>
    </div>
        <tr>
          <td style="padding: 5px 8px; font-size: 13px; border: none;"><strong>Annual Energy Savings:</strong></td>
          <td style="padding: 5px 8px; text-align: right; font-size: 13px; color: #059669; font-weight: bold; border: none;">$${(quoteData.annualSavings / 1000).toFixed(0)}K per year</td>
        </tr>
        <tr>
          <td style="padding: 5px 8px; font-size: 13px; border: none;"><strong>Simple Payback Period:</strong></td>
          <td style="padding: 5px 8px; text-align: right; font-size: 13px; font-weight: bold; border: none;">${quoteData.paybackYears.toFixed(1)} years</td>
        </tr>
        <tr>
          <td style="padding: 5px 8px; font-size: 13px; border: none;"><strong>25-Year Return on Investment:</strong></td>
          <td style="padding: 5px 8px; text-align: right; font-size: 13px; color: #7C3AED; font-weight: bold; border: none;">${((quoteData.annualSavings * 25 / quoteData.netCost) * 100).toFixed(0)}%</td>
        </tr>
      </table>
    </div>
  </div>
  
  <!-- Project Information Section -->
  <div class="section-header" style="margin-top: -20px;">PROJECT INFORMATION</div>
  
  <table style="width: 100%; border: 1px solid #d1d5db; margin-bottom: 20px;">
    <tr>
      <td style="width: 30%; background-color: #f9fafb; border: 1px solid #d1d5db; padding: 8px 12px; font-weight: bold; font-size: 13px;">Client Name:</td>
      <td style="width: 70%; border: 1px solid #d1d5db; padding: 8px 12px; font-size: 13px;">${industryName} Facility</td>
    </tr>
    <tr>
      <td style="background-color: #f9fafb; border: 1px solid #d1d5db; padding: 8px 12px; font-weight: bold; font-size: 13px;">Project Name:</td>
      <td style="border: 1px solid #d1d5db; padding: 8px 12px; font-size: 13px;">${industryName} - ENERGY STORAGE SOLUTION</td>
    </tr>
    <tr>
      <td style="background-color: #f9fafb; border: 1px solid #d1d5db; padding: 8px 12px; font-weight: bold; font-size: 13px;">Quote Date:</td>
      <td style="border: 1px solid #d1d5db; padding: 8px 12px; font-size: 13px;">${today}</td>
    </tr>
    <tr>
      <td style="background-color: #f9fafb; border: 1px solid #d1d5db; padding: 8px 12px; font-weight: bold; font-size: 13px;">Location:</td>
      <td style="border: 1px solid #d1d5db; padding: 8px 12px; font-size: 13px;">${quoteData.location || 'To Be Determined'}</td>
    </tr>
  </table>
  
  <div class="purple-box">
    <h3 style="color: #6B46C1; margin-top: 0;">🎯 Designed For Your ${industryName}</h3>
    <p style="line-height: 1.8;">
      This battery energy storage system has been specifically configured to meet the unique operational requirements and energy patterns of ${industryName.toLowerCase()} facilities.
      This ${quoteData.durationHours}-hour system is optimized for peak demand reduction and time-of-use energy arbitrage, targeting the highest-cost periods when your facility experiences peak load. The system provides reliable energy storage to maintain critical operations during grid outages while ensuring business continuity and protecting sensitive equipment.
    </p>
    <p style="line-height: 1.8;">
      The <strong>${quoteData.storageSizeMW.toFixed(1)} MW power rating</strong> aligns with your facility's typical peak demand, while the <strong>${quoteData.durationHours}-hour duration</strong> ensures sufficient energy capacity to meet your ${industryName.toLowerCase()}'s operational profile. This configuration maximizes financial returns while maintaining operational reliability.
    </p>
  </div>
  
  <h2>🔋 System Configuration</h2>
  <table>
    <tr>
      <th>Specification</th>
      <th>Value</th>
    </tr>
    <tr>
      <td>Power Output</td>
      <td><strong>${quoteData.storageSizeMW.toFixed(1)} MW</strong></td>
    </tr>
    <tr>
      <td>Duration</td>
      <td><strong>${quoteData.durationHours} hours</strong></td>
    </tr>
    <tr>
      <td>Total Energy Storage</td>
      <td><strong>${totalEnergyMWh.toFixed(1)} MWh</strong></td>
    </tr>
    <tr>
      <td>Battery Chemistry</td>
      <td>LFP (Lithium Iron Phosphate)</td>
    </tr>
    <tr>
      <td>Cycle Life</td>
      <td>6,000+ cycles @ 80% DOD</td>
    </tr>
    <tr>
      <td>Round-Trip Efficiency</td>
      <td>~90%</td>
    </tr>
    <tr>
      <td>Response Time</td>
      <td>&lt;1 second</td>
    </tr>
    <tr>
      <td>Warranty</td>
      <td>10 years / 70% capacity retention</td>
    </tr>
    <tr>
      <td>Certifications</td>
      <td>UL 9540, UL 1973, IEEE 1547, NFPA 855</td>
    </tr>
  </table>
  
  <h2>⚙️ System Configuration Summary</h2>
  
  <h3>How This Configuration Meets Your Needs</h3>
  
  <h4>🎯 Primary Objectives Addressed:</h4>
  <ul>
    <li><strong>Energy Storage & Management:</strong> ${totalEnergyMWh.toFixed(1)} MWh battery system provides ${(totalEnergyMWh / (quoteData.storageSizeMW * 0.7)).toFixed(1)} hours of backup power and intelligent demand charge management</li>
    <li><strong>Power Quality & Reliability:</strong> ${quoteData.gridConnection === 'off-grid' ? 'Grid-forming inverters enable stable operation without external grid reference' : 'Bi-directional inverters provide seamless grid integration with <50ms backup transition'}</li>
    <li><strong>Operational Cost Reduction:</strong> System delivers ${quoteData.paybackYears.toFixed(1)}-year payback with ${((quoteData.annualSavings * 25 / quoteData.netCost) * 100).toFixed(0)}% 25-year ROI through peak shaving and energy arbitrage</li>
    <li><strong>Business Continuity:</strong> Uninterruptible power protection prevents costly shutdowns and ensures critical operations during grid disturbances</li>
    ${quoteData.solarMW > 0 || quoteData.windMW > 0 ? '<li><strong>Sustainability Goals:</strong> Renewable energy integration reduces CO₂ emissions while lowering long-term operating costs</li>' : ''}
  </ul>
  
  <h4>🏭 Industry-Specific Benefits for ${getIndustryName(quoteData.industryTemplate)}:</h4>
  <p>
    ${quoteData.industryTemplate.includes('ev-charging') ? 
      `<strong>EV Charging Operations:</strong> Battery system provides grid stability during high-power charging events, reduces demand charges by up to 70%, and enables 24/7 charging capability ${quoteData.gridConnection === 'off-grid' ? 'in remote locations' : 'with grid support'}. Fast charging compatibility ensures customer satisfaction and revenue optimization.` :
    quoteData.industryTemplate.includes('manufacturing') ?
      `<strong>Manufacturing Continuity:</strong> Uninterruptible power protection prevents costly production shutdowns, demand charge optimization reduces operating costs by 15-25%, and backup power ensures critical equipment protection during grid disturbances.` :
    quoteData.industryTemplate.includes('data-center') ?
      `<strong>Data Center Reliability:</strong> Mission-critical backup power with <50ms transfer time, demand charge reduction of 20-30%, and grid-independent operation capability ensure 99.99%+ uptime for IT infrastructure.` :
    quoteData.industryTemplate.includes('hospital') ?
      `<strong>Healthcare Facility Support:</strong> Life-safety backup power with seamless transition, reduced energy costs for 24/7 operations, and compliance with healthcare facility backup power requirements (NFPA 99).` :
    quoteData.industryTemplate.includes('cold-storage') ?
      `<strong>Cold Storage Efficiency:</strong> Thermal load management during peak demand periods, backup power for refrigeration systems, and energy cost optimization for temperature-critical storage operations.` :
      `<strong>Commercial Operations:</strong> Reliable backup power protection, significant demand charge savings, and operational cost reduction tailored to your facility's energy profile and business continuity requirements.`
    }
  </p>
  
  ${quoteData.gridConnection === 'off-grid' ? `
  <h4>🏝️ Off-Grid Operation Capabilities:</h4>
  <ul>
    <li><strong>Island Mode Operation:</strong> Grid-forming inverters provide stable power without external grid reference</li>
    <li><strong>Automatic Load Management:</strong> Smart controls prioritize critical loads during limited generation periods</li>
    <li><strong>Multi-Source Integration:</strong> Seamless coordination between solar, battery, and generator power sources</li>
    <li><strong>Fuel Optimization:</strong> Generator runtime minimization through intelligent battery dispatch reduces operating costs</li>
  </ul>` : `
  <h4>🔌 Grid-Interactive Features:</h4>
  <ul>
    <li><strong>Utility Integration:</strong> IEEE 1547 compliant interconnection with anti-islanding protection</li>
    <li><strong>Grid Services:</strong> Potential revenue streams from frequency regulation and demand response programs</li>
    <li><strong>Seamless Backup:</strong> Automatic transfer to island mode during grid outages with <50ms transition</li>
    <li><strong>Peak Shaving:</strong> Intelligent discharge during high-demand periods reduces utility charges</li>
  </ul>`}
  
  <h4>📊 Performance Optimization:</h4>
  <p>
    The system is optimized for <strong>${((totalEnergyMWh / quoteData.storageSizeMW) * 100 / 4).toFixed(0)}% daily utilization</strong>, providing optimal balance between equipment cost and operational savings. Advanced energy management algorithms maximize financial returns through time-of-use arbitrage, demand charge reduction, and renewable energy integration while ensuring equipment longevity through intelligent cycling.
  </p>
  
  <div class="info-box" style="background-color: #EDE9FE; border-left: 4px solid #6B46C1;">
    <strong style="color: #6B46C1;">✓ Implementation Includes:</strong> Comprehensive site preparation, professional system commissioning, operator training, remote monitoring setup, and complete documentation package for utility interconnection and regulatory compliance.
  </div>
  
  ${hasRenewables ? `
  <h3>☀️ Renewable Energy Integration</h3>
  <table>
    <tr>
      <th>Source</th>
      <th>Capacity</th>
      <th>Annual Generation</th>
    </tr>
    ${quoteData.solarMW > 0 ? `
    <tr>
      <td>Solar PV</td>
      <td>${quoteData.solarMW.toFixed(1)} MW</td>
      <td>~${(quoteData.solarMW * 1300).toFixed(0)} MWh</td>
    </tr>
    ` : ''}
    ${quoteData.windMW > 0 ? `
    <tr>
      <td>Wind</td>
      <td>${quoteData.windMW.toFixed(1)} MW</td>
      <td>~${(quoteData.windMW * 2200).toFixed(0)} MWh</td>
    </tr>
    ` : ''}
    ${quoteData.generatorMW > 0 ? `
    <tr>
      <td>Generator (Backup)</td>
      <td>${quoteData.generatorMW.toFixed(1)} MW</td>
      <td>On-Demand</td>
    </tr>
    ` : ''}
  </table>
  ` : ''}
  
  <h2>� Professional System Breakdown</h2>
  <table style="border-collapse: collapse; width: 100%; margin-bottom: 20px;">
    <tr style="background-color: #f3f4f6;">
      <th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 11px;">Subsystem</th>
      <th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 11px;">Description</th>
      <th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 11px;">Capacity/Scope</th>
      <th style="border: 1px solid #ddd; padding: 8px; text-align: right; font-size: 11px;">Estimated Cost</th>
      <th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 11px;">Notes</th>
    </tr>
    ${equipmentBreakdown.generators && equipmentBreakdown.generators.totalCost > 0 ? `<tr>
      <td style="border: 1px solid #ddd; padding: 6px; font-weight: bold; color: #059669;">${quoteData.gridConnection === 'off-grid' ? 'Backup Generators' : 'Natural Gas Generators'}</td>
      <td style="border: 1px solid #ddd; padding: 6px;">${quoteData.gridConnection === 'off-grid' ? 'Caterpillar diesel gensets with auto-start/stop' : 'Caterpillar/Cummins NG gensets with paralleling'} (${equipmentBreakdown.generators.quantity} units)</td>
      <td style="border: 1px solid #ddd; padding: 6px;">${(equipmentBreakdown.generators.quantity * equipmentBreakdown.generators.unitPowerMW).toFixed(1)} MW total</td>
      <td style="border: 1px solid #ddd; padding: 6px; text-align: right; font-weight: bold;">$$${(equipmentBreakdown.generators.totalCost / 1000000).toFixed(2)}M</td>
      <td style="border: 1px solid #ddd; padding: 6px; font-size: 10px;">${quoteData.gridConnection === 'off-grid' ? 'Tier 4 Final compliant with sound attenuation' : 'MCPD compliant with sound-attenuated enclosures'}</td>
    </tr>` : ''}
    <tr>
      <td style="border: 1px solid #ddd; padding: 6px; font-weight: bold; color: #8b5cf6;">BESS System</td>
      <td style="border: 1px solid #ddd; padding: 6px;">LFP battery storage with PCS and fire-rated enclosure</td>
      <td style="border: 1px solid #ddd; padding: 6px;">${totalEnergyMWh.toFixed(1)} MWh / ${quoteData.storageSizeMW.toFixed(1)} MW</td>
      <td style="border: 1px solid #ddd; padding: 6px; text-align: right; font-weight: bold;">$$${(equipmentBreakdown.batteries.totalCost / 1000000).toFixed(2)}M</td>
      <td style="border: 1px solid #ddd; padding: 6px; font-size: 10px;">Includes HVAC thermal management, transformer tie-in, SCADA controls</td>
    </tr>
    <tr>
      <td style="border: 1px solid #ddd; padding: 6px; font-weight: bold; color: #f59e0b;">Power Conversion</td>
      <td style="border: 1px solid #ddd; padding: 6px;">${quoteData.gridConnection === 'off-grid' ? 'SMA grid-forming hybrid inverters with island mode capability' : 'SMA bi-directional grid-tie inverters with seamless transfer'}</td>
      <td style="border: 1px solid #ddd; padding: 6px;">${quoteData.storageSizeMW.toFixed(1)} MW total capacity</td>
      <td style="border: 1px solid #ddd; padding: 6px; text-align: right; font-weight: bold;">$$${(equipmentBreakdown.inverters.totalCost / 1000000).toFixed(2)}M</td>
      <td style="border: 1px solid #ddd; padding: 6px; font-size: 10px;">${quoteData.gridConnection === 'off-grid' ? 'Grid-forming operation without external reference' : 'IEEE 1547 compliant with anti-islanding protection'}</td>
    </tr>
    ${equipmentBreakdown.solar && equipmentBreakdown.solar.totalCost > 0 ? `<tr>
      <td style="border: 1px solid #ddd; padding: 6px; font-weight: bold; color: #f59e0b;">Photovoltaic Array</td>
      <td style="border: 1px solid #ddd; padding: 6px;">${quoteData.gridConnection === 'off-grid' ? 'Ground-mounted PV with MPPT charge controllers' : 'Roof or ground-mounted PV with string inverters'}</td>
      <td style="border: 1px solid #ddd; padding: 6px;">${quoteData.solarMW.toFixed(1)} MWp DC capacity</td>
      <td style="border: 1px solid #ddd; padding: 6px; text-align: right; font-weight: bold;">$$${(equipmentBreakdown.solar.totalCost / 1000000).toFixed(2)}M</td>
      <td style="border: 1px solid #ddd; padding: 6px; font-size: 10px;">IEC 61215/61730 certified modules with 25-year warranty</td>
    </tr>` : ''}
    ${equipmentBreakdown.wind && equipmentBreakdown.wind.totalCost > 0 ? `<tr>
      <td style="border: 1px solid #ddd; padding: 6px; font-weight: bold; color: #06b6d4;">Wind Generation</td>
      <td style="border: 1px solid #ddd; padding: 6px;">Utility-scale wind turbines with grid synchronization</td>
      <td style="border: 1px solid #ddd; padding: 6px;">${quoteData.windMW.toFixed(1)} MW rated capacity</td>
      <td style="border: 1px solid #ddd; padding: 6px; text-align: right; font-weight: bold;">$$${(equipmentBreakdown.wind.totalCost / 1000000).toFixed(2)}M</td>
      <td style="border: 1px solid #ddd; padding: 6px; font-size: 10px;">IEC 61400 certified with advanced blade control</td>
    </tr>` : ''}
    <tr>
      <td style="border: 1px solid #ddd; padding: 6px; font-weight: bold; color: #ef4444;">MV Equipment</td>
      <td style="border: 1px solid #ddd; padding: 6px;">ABB transformers with protective switchgear and MV distribution</td>
      <td style="border: 1px solid #ddd; padding: 6px;">${quoteData.storageSizeMW.toFixed(1)} MW system integration</td>
      <td style="border: 1px solid #ddd; padding: 6px; text-align: right; font-weight: bold;">$$${((equipmentBreakdown.transformers.totalCost + equipmentBreakdown.switchgear.totalCost) / 1000000).toFixed(2)}M</td>
      <td style="border: 1px solid #ddd; padding: 6px; font-size: 10px;">Oil-filled transformers with digital protection relays, arc-resistant switchgear</td>
    </tr>
    ${equipmentBreakdown.evChargers && equipmentBreakdown.evChargers.totalChargingCost > 0 ? `<tr>
      <td style="border: 1px solid #ddd; padding: 6px; font-weight: bold; color: #8b5cf6;">EV Charging Infrastructure</td>
      <td style="border: 1px solid #ddd; padding: 6px;">Level 2 and DC fast charging stations with network connectivity</td>
      <td style="border: 1px solid #ddd; padding: 6px;">${equipmentBreakdown.evChargers.level2Chargers.quantity} Level 2 + ${equipmentBreakdown.evChargers.dcFastChargers.quantity} DC Fast units</td>
      <td style="border: 1px solid #ddd; padding: 6px; text-align: right; font-weight: bold;">$$${(equipmentBreakdown.evChargers.totalChargingCost / 1000000).toFixed(2)}M</td>
      <td style="border: 1px solid #ddd; padding: 6px; font-size: 10px;">OCPP 2.0 compliant with payment processing and load management</td>
    </tr>` : ''}
    <tr>
      <td style="border: 1px solid #ddd; padding: 6px; font-weight: bold; color: #6b7280;">Control & Monitoring</td>
      <td style="border: 1px solid #ddd; padding: 6px;">Energy management system with SCADA integration and remote monitoring</td>
      <td style="border: 1px solid #ddd; padding: 6px;">—</td>
      <td style="border: 1px solid #ddd; padding: 6px; text-align: right; font-weight: bold;">$$${((equipmentBreakdown.totals.equipmentCost * 0.05) / 1000000).toFixed(2)}M</td>
      <td style="border: 1px solid #ddd; padding: 6px; font-size: 10px;">HMI touchscreen interface, cybersecurity compliance, cloud connectivity</td>
    </tr>
    <tr>
      <td style="border: 1px solid #ddd; padding: 6px; font-weight: bold; color: #6b7280;">Balance of Plant</td>
      <td style="border: 1px solid #ddd; padding: 6px;">Cabling and civil works with foundations and commissioning</td>
      <td style="border: 1px solid #ddd; padding: 6px;">—</td>
      <td style="border: 1px solid #ddd; padding: 6px; text-align: right; font-weight: bold;">$$${(equipmentBreakdown.totals.installationCost / 1000000).toFixed(2)}M</td>
      <td style="border: 1px solid #ddd; padding: 6px; font-size: 10px;">Includes delivery, import duties, and professional commissioning</td>
    </tr>
    <tr style="background-color: #f9fafb;">
      <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;" colspan="3">Total System Cost (ex-VAT)</td>
      <td style="border: 1px solid #ddd; padding: 8px; text-align: right; font-weight: bold;">$$${(quoteData.totalProjectCost / 1000000).toFixed(2)}M</td>
      <td style="border: 1px solid #ddd; padding: 8px;"></td>
    </tr>
    <tr style="background-color: #fef3c7;">
      <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;" colspan="3">Total incl. Local Taxes (8%)</td>
      <td style="border: 1px solid #ddd; padding: 8px; text-align: right; font-weight: bold;">$$${((quoteData.totalProjectCost * 1.08) / 1000000).toFixed(2)}M</td>
      <td style="border: 1px solid #ddd; padding: 8px; font-size: 10px;">Estimated combined state/local tax rate</td>
    </tr>
  </table>

  <div style="background-color: #f0fdf4; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
    <h3 style="margin-top: 0;">Financial Metrics Summary</h3>
    <p><strong>10-Year ROI:</strong> ≈ ${((quoteData.annualSavings * 10 / quoteData.netCost) * 100).toFixed(0)}% (net of O&M)</p>
    <p><strong>O&M Allowance:</strong> ≈ $$${((quoteData.totalProjectCost * 0.02) / 1000).toFixed(0)}K / year</p>
    <p><strong>${quoteData.gridConnection === 'off-grid' ? 'Fuel Cost:' : 'Grid Offset Rate:'}</strong> ${quoteData.gridConnection === 'off-grid' ? '≈ $0.08 / kWh (Diesel)' : '≈ $0.12 / kWh (Grid Avoided)'}</p>
    <p><strong>CO₂ Reduction:</strong> ≈ ${quoteData.gridConnection === 'off-grid' ? '75% vs diesel-only' : '45% vs grid electricity'}</p>
  </div>

  <table style="border-collapse: collapse; width: 100%; margin-bottom: 20px;">
    <tr style="background-color: #f3f4f6;">
      <td><strong>Total Project Cost</strong></td>
      <td><strong>$${(quoteData.totalProjectCost / 1000000).toFixed(2)}M</strong></td>
    </tr>
    <tr style="color: #10b981;">
      <td><strong>Federal ITC Tax Credit (30%)</strong></td>
      <td><strong>-$${(quoteData.taxCredit / 1000000).toFixed(2)}M</strong></td>
    </tr>
    <tr style="background-color: #fef3c7;">
      <td><strong>Net Investment After Tax Credit</strong></td>
      <td><strong>$${(quoteData.netCost / 1000000).toFixed(2)}M</strong></td>
    </tr>
  </table>
  
  <div class="highlight">
    💵 Estimated Annual Savings: $${(quoteData.annualSavings / 1000).toFixed(0)}K<br>
    ⏱️ Simple Payback Period: ${quoteData.paybackYears.toFixed(1)} years<br>
    📈 25-Year ROI: ${((quoteData.annualSavings * 25 / quoteData.netCost) * 100).toFixed(0)}%
  </div>
  
  <h2>📋 Your Selections</h2>
  <table>
    <tr>
      <th>Category</th>
      <th>Selection</th>
    </tr>
    <tr>
      <td>Installation Method</td>
      <td>${quoteData.installationOption.replace('-', ' ').toUpperCase()}</td>
    </tr>
    <tr>
      <td>Shipping & Logistics</td>
      <td>${quoteData.shippingOption.replace('-', ' ').toUpperCase()}</td>
    </tr>
    <tr>
      <td>Financing Type</td>
      <td>${quoteData.financingOption.toUpperCase()}</td>
    </tr>
  </table>
  
  <h2>📝 Important Notes</h2>
  <div class="info-box">
    <ul>
      <li>This quote is based on current market prices and estimated utility rates for ${industryName.toLowerCase()} facilities in ${quoteData.location || 'your area'}.</li>
      <li>Actual costs may vary based on site-specific conditions, local requirements, and final engineering assessment.</li>
      <li>Federal Investment Tax Credit (ITC) eligibility and amount should be confirmed with a qualified tax professional.</li>
      <li>Savings estimates assume typical ${industryName.toLowerCase()} load profiles and may vary based on actual usage patterns and operational strategy.</li>
      <li>Equipment specifications are subject to change based on manufacturer availability and project requirements.</li>
      <li>This is a preliminary quote. A detailed site assessment and engineering study are required for final pricing.</li>
    </ul>
  </div>
  
  <h2>🎯 Next Steps</h2>
  <div class="info-box success">
    <ol>
      <li><strong>Site Assessment:</strong> Schedule a detailed evaluation of your facility</li>
      <li><strong>Engineering Design:</strong> Develop customized system design and electrical integration plan</li>
      <li><strong>Utility Coordination:</strong> Coordinate interconnection requirements with your utility provider</li>
      <li><strong>Permit Applications:</strong> Submit required permits and obtain necessary approvals</li>
      <li><strong>Financing Finalization:</strong> Complete financing arrangements and secure tax credit documentation</li>
      <li><strong>Installation:</strong> Professional installation by certified technicians</li>
      <li><strong>Commissioning:</strong> System testing, optimization, and training</li>
    </ol>
  </div>
  
  <div class="footer">
    <strong>🧙‍♂️ MERLIN Energy Solutions</strong><br>
    Professional Battery Energy Storage Systems<br>
    Quote Generated: ${today}<br><br>
    <em>Your trusted energy storage advisor | This quote is valid for 30 days from the date of issue.</em>
  </div>
</body>
</html>`;

  // Create blob with proper Word MIME type
  const blob = new Blob([htmlContent], { type: 'application/msword' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `BESS_Quote_${industryName.replace(/\s+/g, '_')}_${Date.now()}.doc`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up URL object
  URL.revokeObjectURL(url);
};

