// Professional quote export utilities for PDF, Excel, and Word

interface QuoteData {
  storageSizeMW: number;
  durationHours: number;
  solarMW: number;
  windMW: number;
  generatorMW: number;
  location: string;
  selectedGoal: string;
  industryTemplate: string;
  totalProjectCost: number;
  annualSavings: number;
  paybackYears: number;
  taxCredit: number;
  netCost: number;
  installationOption: string;
  shippingOption: string;
  financingOption: string;
}

const getIndustryName = (template: string): string => {
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
  return industryMap[template] || template;
};

export const generatePDF = (quoteData: QuoteData): void => {
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
              ${quoteData.selectedGoal === 'cost-reduction' || quoteData.selectedGoal === 'demand-charge-reduction' 
                ? `With your primary goal of <strong>reducing costs</strong>, this ${quoteData.durationHours}-hour system is optimized for peak demand reduction and time-of-use energy arbitrage, targeting the highest-cost periods when your facility experiences peak load.`
                : quoteData.selectedGoal === 'backup-power' 
                ? `With your primary goal of <strong>backup power</strong>, this ${quoteData.durationHours}-hour system provides reliable emergency power to maintain critical operations during grid outages, ensuring business continuity and protecting sensitive equipment.`
                : quoteData.selectedGoal === 'renewable-integration'
                ? `With your focus on <strong>renewable integration</strong>, this system is designed to maximize the value of your renewable assets by storing excess generation and dispatching power when it's most valuable or needed.`
                : quoteData.selectedGoal === 'grid-independence'
                ? `With your goal of <strong>grid independence</strong>, this system reduces reliance on utility power by storing energy during off-peak times and providing power during peak periods or outages.`
                : `This system is designed to optimize your energy usage and reduce operational costs through intelligent charge/discharge cycles.`}
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
            
            <!-- Equipment Breakdown -->
            <div style="margin-top: 20px; padding: 25px; background: linear-gradient(135deg, #F7FAFC 0%, #EDE9FE 100%); border-radius: 12px; border-left: 5px solid #6B46C1;">
              <div style="font-weight: bold; margin-bottom: 15px; color: #6B46C1; font-size: 20px;">📦 Complete Equipment Package</div>
              
              <div style="margin-bottom: 20px;">
                <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 12px;">
                  <div style="font-weight: bold; color: #374151; margin-bottom: 8px; font-size: 16px;">🔋 Battery Energy Storage System (BESS)</div>
                  <ul style="margin-left: 20px; color: #4b5563; font-size: 14px; line-height: 1.8;">
                    <li>${totalEnergyMWh.toFixed(1)} MWh LFP Battery Modules</li>
                    <li>Battery Management System (BMS) with cell-level monitoring</li>
                    <li>Thermal management and HVAC systems</li>
                    <li>Fire suppression system (NFPA 855 compliant)</li>
                    <li>Weather-resistant outdoor enclosures or containerized units</li>
                  </ul>
                </div>
                
                <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 12px;">
                  <div style="font-weight: bold; color: #374151; margin-bottom: 8px; font-size: 16px;">⚡ Power Conversion System (PCS)</div>
                  <ul style="margin-left: 20px; color: #4b5563; font-size: 14px; line-height: 1.8;">
                    <li>${quoteData.storageSizeMW.toFixed(1)} MW Bi-directional Inverter/Charger</li>
                    <li>Grid-forming capability for backup/island mode</li>
                    <li>Power factor correction (0.95 leading/lagging)</li>
                    <li>Harmonic filtering (IEEE 519 compliant)</li>
                    <li>Seamless transition (<50ms) between grid and battery modes</li>
                  </ul>
                </div>
                
                <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 12px;">
                  <div style="font-weight: bold; color: #374151; margin-bottom: 8px; font-size: 16px;">🎛️ Energy Management System (EMS)</div>
                  <ul style="margin-left: 20px; color: #4b5563; font-size: 14px; line-height: 1.8;">
                    <li>Advanced control software for optimization strategies</li>
                    <li>Real-time monitoring dashboard with mobile app</li>
                    <li>Automated demand charge management</li>
                    <li>Time-of-use energy arbitrage algorithms</li>
                    <li>Grid services integration (demand response, frequency regulation)</li>
                    <li>Historical data logging and performance analytics</li>
                  </ul>
                </div>
                
                <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 12px;">
                  <div style="font-weight: bold; color: #374151; margin-bottom: 8px; font-size: 16px;">🔌 Balance of System (BOS)</div>
                  <ul style="margin-left: 20px; color: #4b5563; font-size: 14px; line-height: 1.8;">
                    <li>Transformer (if required for voltage matching)</li>
                    <li>AC/DC disconnect switches and circuit protection</li>
                    <li>Metering equipment (revenue-grade for utility programs)</li>
                    <li>Grounding and lightning protection</li>
                    <li>Communication gateway and network equipment</li>
                    <li>Concrete pad or mounting system</li>
                  </ul>
                </div>
                
                ${hasRenewables ? `
                <div style="background: white; padding: 15px; border-radius: 8px;">
                  <div style="font-weight: bold; color: #059669; margin-bottom: 8px; font-size: 16px;">☀️ Renewable Energy Components</div>
                  <ul style="margin-left: 20px; color: #4b5563; font-size: 14px; line-height: 1.8;">
                    ${quoteData.solarMW > 0 ? `<li>${quoteData.solarMW.toFixed(1)} MW Solar PV array with racking and module-level optimization</li>` : ''}
                    ${quoteData.windMW > 0 ? `<li>${quoteData.windMW.toFixed(1)} MW Wind turbine system with tower and controls</li>` : ''}
                    ${quoteData.generatorMW > 0 ? `<li>${quoteData.generatorMW.toFixed(1)} MW Backup generator with automatic transfer switch</li>` : ''}
                    <li>Hybrid inverter for renewable integration</li>
                    <li>Additional metering and monitoring for renewable assets</li>
                  </ul>
                </div>
                ` : ''}
              </div>
              
              <div style="background: #EDE9FE; padding: 15px; border-radius: 8px; font-size: 13px; color: #4c1d95; border: 1px solid #C4B5FD;">
                <strong>✓ Installation Includes:</strong> Site preparation, electrical interconnection, utility coordination, system commissioning, operator training, and documentation package for utility interconnection and permit applications.
              </div>
            </div>
            
            ${hasRenewables ? `
            <div style="margin-top: 20px; padding: 20px; background: #ecfdf5; border-radius: 12px; border-left: 4px solid #10b981;">
              <div style="font-weight: bold; margin-bottom: 10px; color: #059669; font-size: 18px;">☀️ Renewable Energy Integration</div>
              <div style="display: flex; gap: 30px; flex-wrap: wrap; font-size: 16px;">
                ${quoteData.solarMW > 0 ? `<div>☀️ Solar PV: <strong>${quoteData.solarMW.toFixed(1)} MW</strong> (${(quoteData.solarMW * 1300).toFixed(0)} annual MWh)</div>` : ''}
                ${quoteData.windMW > 0 ? `<div>💨 Wind: <strong>${quoteData.windMW.toFixed(1)} MW</strong> (${(quoteData.windMW * 2200).toFixed(0)} annual MWh)</div>` : ''}
                ${quoteData.generatorMW > 0 ? `<div>⚡ Generator: <strong>${quoteData.generatorMW.toFixed(1)} MW</strong> (Backup)</div>` : ''}
              </div>
            </div>
            ` : ''}
          </div>
          
          <!-- Financial Summary -->
          <div class="section">
            <div class="section-title">💰 Financial Summary</div>
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
                <div class="icon">💰</div>
                <div class="title">${quoteData.financingOption}</div>
                <div class="subtitle">Financing</div>
              </div>
            </div>
          </div>
          
          <!-- Primary Goal -->
          <div class="section">
            <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 20px; border-radius: 12px; border-left: 4px solid #f59e0b;">
              <div style="font-weight: bold; margin-bottom: 10px; color: #d97706;">🎯 Primary Goal</div>
              <div style="font-size: 18px; text-transform: capitalize;">${quoteData.selectedGoal.replace('-', ' ')}</div>
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
      
      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 500);
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
};

export const generateExcel = (quoteData: QuoteData): void => {
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
Primary Goal:,${quoteData.selectedGoal.replace('-', ' ').toUpperCase()}
System Type:,${systemDescription}

====================================
QUOTE SUMMARY
====================================
Item,Amount
Equipment (Battery + Inverter),$${((quoteData.totalProjectCost * 0.60) / 1000000).toFixed(2)}M
Installation & Engineering,$${((quoteData.totalProjectCost * 0.25) / 1000000).toFixed(2)}M
Shipping & Logistics,$${((quoteData.totalProjectCost * 0.10) / 1000000).toFixed(2)}M
Permits & Commissioning,$${((quoteData.totalProjectCost * 0.05) / 1000000).toFixed(2)}M
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
EQUIPMENT PACKAGE DETAILS
====================================

BATTERY ENERGY STORAGE SYSTEM (BESS):
- Battery modules and racks (${totalEnergyMWh.toFixed(1)} MWh capacity)
- Battery Management System (BMS)
- Thermal management and HVAC system
- Fire detection and suppression system
- Weatherproof enclosures (NEMA 3R or better)

POWER CONVERSION SYSTEM (PCS):
- ${quoteData.storageSizeMW.toFixed(1)} MW bi-directional inverter
- Grid-forming capability
- Power factor correction (0.95+ capability)
- Harmonic filtering (IEEE 519 compliant)
- Seamless transition (<50ms)

ENERGY MANAGEMENT SYSTEM (EMS):
- Advanced control software
- Real-time monitoring dashboard
- Demand charge management algorithms
- Time-of-use arbitrage optimization
- Grid services coordination
- Performance analytics and reporting

BALANCE OF SYSTEM (BOS):
- Transformer and switchgear
- Electrical disconnects and breakers
- Revenue-grade metering equipment
- Grounding and lightning protection
- Communication gateway
- Foundation and mounting systems

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

export const generateWord = (quoteData: QuoteData): void => {
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
  
  <!-- QUOTE SUMMARY - Cost at a Glance -->
  <div style="background: linear-gradient(135deg, #6B46C1 0%, #553C9A 100%); color: white; padding: 30px; border-radius: 8px; margin-bottom: 25px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    <h2 style="margin: 0 0 20px 0; text-align: center; font-size: 26px; border: none; padding: 0; letter-spacing: 1px;">💰 QUOTE SUMMARY</h2>
    
    <!-- Main Cost Table -->
    <table style="width: 100%; background: white; color: #1F2937; border-radius: 6px; margin-bottom: 20px; border: none;">
      <tr style="background: #F3F4F6;">
        <td style="padding: 8px 12px; font-size: 13px; font-weight: bold; border: 1px solid #E5E7EB;">Item</td>
        <td style="padding: 8px 12px; font-size: 13px; font-weight: bold; text-align: right; border: 1px solid #E5E7EB;">Amount</td>
      </tr>
      <tr>
        <td style="padding: 6px 12px; border: 1px solid #E5E7EB; font-size: 13px;">Equipment (Battery + Inverter)</td>
        <td style="padding: 6px 12px; text-align: right; border: 1px solid #E5E7EB; font-size: 13px;">$${((quoteData.totalProjectCost * 0.60) / 1000000).toFixed(2)}M</td>
      </tr>
      <tr>
        <td style="padding: 6px 12px; border: 1px solid #E5E7EB; font-size: 13px;">Installation & Engineering</td>
        <td style="padding: 6px 12px; text-align: right; border: 1px solid #E5E7EB; font-size: 13px;">$${((quoteData.totalProjectCost * 0.25) / 1000000).toFixed(2)}M</td>
      </tr>
      <tr>
        <td style="padding: 6px 12px; border: 1px solid #E5E7EB; font-size: 13px;">Shipping & Logistics</td>
        <td style="padding: 6px 12px; text-align: right; border: 1px solid #E5E7EB; font-size: 13px;">$${((quoteData.totalProjectCost * 0.10) / 1000000).toFixed(2)}M</td>
      </tr>
      <tr>
        <td style="padding: 6px 12px; border: 1px solid #E5E7EB; font-size: 13px;">Permits, Commissioning & Misc.</td>
        <td style="padding: 6px 12px; text-align: right; border: 1px solid #E5E7EB; font-size: 13px;">$${((quoteData.totalProjectCost * 0.05) / 1000000).toFixed(2)}M</td>
      </tr>
      <tr style="background: #F9FAFB;">
        <td style="padding: 10px 12px; font-size: 14px; font-weight: bold; border: 1px solid #E5E7EB;">Total Project Cost</td>
        <td style="padding: 10px 12px; text-align: right; font-size: 15px; font-weight: bold; border: 1px solid #E5E7EB;">$${(quoteData.totalProjectCost / 1000000).toFixed(2)}M</td>
      </tr>
      <tr style="background: #D1FAE5;">
        <td style="padding: 10px 12px; font-size: 13px; font-weight: bold; color: #065F46; border: 1px solid #E5E7EB;">Less: Federal ITC Tax Credit (30%)</td>
        <td style="padding: 10px 12px; text-align: right; font-size: 14px; font-weight: bold; color: #065F46; border: 1px solid #E5E7EB;">-$${(quoteData.taxCredit / 1000000).toFixed(2)}M</td>
      </tr>
      <tr style="background: #FEF3C7;">
        <td style="padding: 12px; font-size: 15px; font-weight: bold; color: #92400E; border: 1px solid #E5E7EB;">NET INVESTMENT (After Tax Credit)</td>
        <td style="padding: 12px; text-align: right; font-size: 16px; font-weight: bold; color: #92400E; border: 1px solid #E5E7EB;">$${(quoteData.netCost / 1000000).toFixed(2)}M</td>
      </tr>
    </table>
    
    <!-- Financial Metrics -->
    <div style="background: rgba(255,255,255,0.95); color: #1F2937; padding: 15px; border-radius: 6px;">
      <h3 style="margin: 0 0 12px 0; font-size: 14px; color: #6B46C1; text-align: center; font-weight: bold;">KEY FINANCIAL METRICS</h3>
      <table style="width: 100%; border: none;">
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
  <div class="section-header">PROJECT INFORMATION</div>
  
  <table style="width: 100%; border: 1px solid #d1d5db; margin-bottom: 20px;">
    <tr>
      <td style="width: 30%; background-color: #f9fafb; border: 1px solid #d1d5db; padding: 8px 12px; font-weight: bold; font-size: 13px;">Client Name:</td>
      <td style="width: 70%; border: 1px solid #d1d5db; padding: 8px 12px; font-size: 13px;">${industryName} Facility</td>
    </tr>
    <tr>
      <td style="background-color: #f9fafb; border: 1px solid #d1d5db; padding: 8px 12px; font-weight: bold; font-size: 13px;">Project Name:</td>
      <td style="border: 1px solid #d1d5db; padding: 8px 12px; font-size: 13px;">${industryName} - ${quoteData.selectedGoal.replace('-', ' ').toUpperCase()}</td>
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
      ${quoteData.selectedGoal === 'cost-reduction' || quoteData.selectedGoal === 'demand-charge-reduction' 
        ? `With your primary goal of <strong>reducing costs</strong>, this ${quoteData.durationHours}-hour system is optimized for peak demand reduction and time-of-use energy arbitrage, targeting the highest-cost periods when your facility experiences peak load.`
        : quoteData.selectedGoal === 'backup-power' 
        ? `With your primary goal of <strong>backup power</strong>, this ${quoteData.durationHours}-hour system provides reliable emergency power to maintain critical operations during grid outages, ensuring business continuity and protecting sensitive equipment.`
        : quoteData.selectedGoal === 'renewable-integration'
        ? `With your focus on <strong>renewable integration</strong>, this system is designed to maximize the value of your renewable assets by storing excess generation and dispatching power when it's most valuable or needed.`
        : quoteData.selectedGoal === 'grid-independence'
        ? `With your goal of <strong>grid independence</strong>, this system reduces reliance on utility power by storing energy during off-peak times and providing power during peak periods or outages.`
        : `This system is designed to optimize your energy usage and reduce operational costs through intelligent charge/discharge cycles.`}
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
  
  <h2>📦 Complete Equipment Package</h2>
  
  <h3>🔋 Battery Energy Storage System (BESS)</h3>
  <ul>
    <li>${totalEnergyMWh.toFixed(1)} MWh LFP Battery Modules</li>
    <li>Battery Management System (BMS) with cell-level monitoring</li>
    <li>Thermal management and HVAC systems</li>
    <li>Fire suppression system (NFPA 855 compliant)</li>
    <li>Weather-resistant outdoor enclosures or containerized units</li>
  </ul>
  
  <h3>⚡ Power Conversion System (PCS)</h3>
  <ul>
    <li>${quoteData.storageSizeMW.toFixed(1)} MW Bi-directional Inverter/Charger</li>
    <li>Grid-forming capability for backup/island mode</li>
    <li>Power factor correction (0.95 leading/lagging)</li>
    <li>Harmonic filtering (IEEE 519 compliant)</li>
    <li>Seamless transition (&lt;50ms) between grid and battery modes</li>
  </ul>
  
  <h3>🎛️ Energy Management System (EMS)</h3>
  <ul>
    <li>Advanced control software for optimization strategies</li>
    <li>Real-time monitoring dashboard with mobile app</li>
    <li>Automated demand charge management</li>
    <li>Time-of-use energy arbitrage algorithms</li>
    <li>Grid services integration (demand response, frequency regulation)</li>
    <li>Historical data logging and performance analytics</li>
  </ul>
  
  <h3>🔌 Balance of System (BOS)</h3>
  <ul>
    <li>Transformer (if required for voltage matching)</li>
    <li>AC/DC disconnect switches and circuit protection</li>
    <li>Metering equipment (revenue-grade for utility programs)</li>
    <li>Grounding and lightning protection</li>
    <li>Communication gateway and network equipment</li>
    <li>Concrete pad or mounting system</li>
  </ul>
  
  <div class="info-box" style="background-color: #EDE9FE; border-left: 4px solid #6B46C1;">
    <strong style="color: #6B46C1;">✓ Installation Includes:</strong> Site preparation, electrical interconnection, utility coordination, system commissioning, operator training, and documentation package for utility interconnection and permit applications.
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
  
  <h2>💰 Financial Summary</h2>
  <table>
    <tr>
      <th>Cost Component</th>
      <th>Amount</th>
    </tr>
    <tr>
      <td>Equipment (Battery + Inverter)</td>
      <td>$${((quoteData.totalProjectCost * 0.60) / 1000000).toFixed(2)}M</td>
    </tr>
    <tr>
      <td>Installation & Engineering</td>
      <td>$${((quoteData.totalProjectCost * 0.25) / 1000000).toFixed(2)}M</td>
    </tr>
    <tr>
      <td>Shipping & Logistics</td>
      <td>$${((quoteData.totalProjectCost * 0.10) / 1000000).toFixed(2)}M</td>
    </tr>
    <tr>
      <td>Permits, Commissioning & Misc.</td>
      <td>$${((quoteData.totalProjectCost * 0.05) / 1000000).toFixed(2)}M</td>
    </tr>
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
  
  <h3>Annual Savings Breakdown (Estimated)</h3>
  <table>
    <tr>
      <th>Savings Category</th>
      <th>Annual Value</th>
      <th>% of Total</th>
    </tr>
    <tr>
      <td>Demand Charge Reduction</td>
      <td>$${(quoteData.annualSavings * 0.45 / 1000).toFixed(0)}K</td>
      <td>45%</td>
    </tr>
    <tr>
      <td>Energy Arbitrage (Time-of-Use)</td>
      <td>$${(quoteData.annualSavings * 0.35 / 1000).toFixed(0)}K</td>
      <td>35%</td>
    </tr>
    <tr>
      <td>Utility Incentive Programs</td>
      <td>$${(quoteData.annualSavings * 0.15 / 1000).toFixed(0)}K</td>
      <td>15%</td>
    </tr>
    <tr>
      <td>Backup Value & Other Benefits</td>
      <td>$${(quoteData.annualSavings * 0.05 / 1000).toFixed(0)}K</td>
      <td>5%</td>
    </tr>
  </table>
  
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

