import React, { useState, useEffect } from 'react';

interface VendorQuote {
  id: string;
  vendor_name?: string;
  pricing_data?: {
    battery_kwh?: number;
    pcs_kw?: number;
    bos_percent?: number;
    epc_percent?: number;
  };
}

interface Step5CostBreakdownProps {
  bessPowerMW: number;
  solarMW: number;
  windMW: number;
  generatorMW: number;
  selectedEquipment: string[];
  duration: number;
  pcsIncluded: boolean;
}

const Step5_CostBreakdown: React.FC<Step5CostBreakdownProps> = ({
  bessPowerMW,
  solarMW,
  windMW,
  generatorMW,
  selectedEquipment,
  duration,
  pcsIncluded,
}) => {
  const [vendorQuotes, setVendorQuotes] = useState<VendorQuote[]>([]);
  const [selectedQuote, setSelectedQuote] = useState<VendorQuote | null>(null);
  const [showVendorComparison, setShowVendorComparison] = useState(false);

  useEffect(() => {
    // Load vendor quotes from localStorage
    const stored = localStorage.getItem('vendor_quotes');
    if (stored) {
      const quotes = JSON.parse(stored);
      setVendorQuotes(quotes);
    }
  }, []);

  // Calculate battery capacity
  const batteryMWh = bessPowerMW * duration;
  
  // Industry-standard pricing (Merlin Estimate)
  const batteryPricePerKWh = bessPowerMW >= 5 ? 120 : 140; // Large vs Small BESS
  
  // Use vendor pricing if selected, otherwise use Merlin estimates
  const activeBatteryPrice = selectedQuote?.pricing_data?.battery_kwh || batteryPricePerKWh;
  const activePcsPrice = selectedQuote?.pricing_data?.pcs_kw ? selectedQuote.pricing_data.pcs_kw / 1000 : 80; // Convert $/kW to $/MW*1000
  const activeBosPercent = selectedQuote?.pricing_data?.bos_percent || 0.12;
  const activeEpcPercent = selectedQuote?.pricing_data?.epc_percent || 0.15;
  
  const batteryCostTotal = batteryMWh * 1000 * activeBatteryPrice;

  // Cost breakdown per component
  const costs = {
    // Battery costs (PCS and controls typically included in $/kWh price)
    batteryPacks: batteryCostTotal,
    pcs: pcsIncluded ? 0 : bessPowerMW * activePcsPrice * 1000, // Only if not included in BESS price
    transformers: bessPowerMW * 50000, // $50k per MW
    inverters: bessPowerMW * 40000, // $40k per MW
    switchgear: bessPowerMW * 30000, // $30k per MW
    microgridControls: pcsIncluded ? 0 : 150000, // Usually included if PCS included
    bms: 0, // Included in $/kWh price
    
    // Renewable energy costs
    solar: selectedEquipment.includes('solar') ? solarMW * 800000 : 0,
    solarInverters: selectedEquipment.includes('solar') ? solarMW * 50000 : 0,
    
    wind: selectedEquipment.includes('wind') ? windMW * 1200000 : 0,
    windConverters: selectedEquipment.includes('wind') ? windMW * 60000 : 0,
    
    generator: selectedEquipment.includes('power-gen') ? generatorMW * 300000 : 0,
    generatorControls: selectedEquipment.includes('power-gen') ? generatorMW * 20000 : 0,
    
    // Installation and integration
    bos: 0, // Will calculate as percentage
    epc: 0, // Will calculate as percentage
  };

  // Calculate subtotals
  const equipmentSubtotal = Object.values(costs).reduce((a, b) => a + b, 0);
  costs.bos = equipmentSubtotal * activeBosPercent;
  costs.epc = equipmentSubtotal * activeEpcPercent;

  const totalCost = equipmentSubtotal + costs.bos + costs.epc;

  const costItems = [
    { category: '🔋 Battery Energy Storage System (BESS)', items: [
      { name: 'Battery System (LFP Chemistry)', cost: costs.batteryPacks, detail: `${batteryMWh.toFixed(1)} MWh @ $${activeBatteryPrice}/kWh${selectedQuote ? ` (${selectedQuote.vendor_name} quote)` : ' (Merlin estimate)'}${pcsIncluded ? ' - PCS & Controls included' : ''}` },
      ...(costs.pcs > 0 ? [{ name: 'Power Conversion System (PCS)', cost: costs.pcs, detail: `${bessPowerMW} MW @ $${(activePcsPrice * 1000).toFixed(0)}/MW${selectedQuote ? ` (${selectedQuote.vendor_name} quote)` : ' (Merlin estimate)'}` }] : []),
      { name: 'Transformers', cost: costs.transformers, detail: `${bessPowerMW} MW @ $50k/MW` },
      { name: 'Bi-directional Inverters', cost: costs.inverters, detail: `${bessPowerMW} MW @ $40k/MW` },
      { name: 'Switchgear & Protection', cost: costs.switchgear, detail: `${bessPowerMW} MW @ $30k/MW` },
      ...(costs.microgridControls > 0 ? [{ name: 'Microgrid Controls & SCADA', cost: costs.microgridControls, detail: 'System-wide control platform (not included in BESS)' }] : []),
    ]},
  ];

  // Add renewable energy if selected
  if (selectedEquipment.includes('solar') && solarMW > 0) {
    costItems.push({
      category: '☀️ Solar Power System',
      items: [
        { name: 'Solar Panels & Mounting', cost: costs.solar, detail: `${solarMW} MW @ $800k/MW` },
        { name: 'Solar Inverters', cost: costs.solarInverters, detail: `${solarMW} MW @ $50k/MW` },
      ]
    });
  }

  if (selectedEquipment.includes('wind') && windMW > 0) {
    costItems.push({
      category: '💨 Wind Power System',
      items: [
        { name: 'Wind Turbines', cost: costs.wind, detail: `${windMW} MW @ $1.2M/MW` },
        { name: 'Wind Converters & Controls', cost: costs.windConverters, detail: `${windMW} MW @ $60k/MW` },
      ]
    });
  }

  if (selectedEquipment.includes('power-gen') && generatorMW > 0) {
    costItems.push({
      category: '⚡ Backup Generator System',
      items: [
        { name: 'Generator Units', cost: costs.generator, detail: `${generatorMW} MW @ $300k/MW` },
        { name: 'Generator Controls', cost: costs.generatorControls, detail: `${generatorMW} MW @ $20k/MW` },
      ]
    });
  }

  // Add installation costs
  costItems.push({
    category: '🏗️ Installation & Integration',
    items: [
      { name: 'Balance of System (BoS)', cost: costs.bos, detail: `${(activeBosPercent * 100).toFixed(1)}% of equipment cost${selectedQuote ? ` (${selectedQuote.vendor_name})` : ''}` },
      { name: 'Engineering, Procurement & Construction (EPC)', cost: costs.epc, detail: `${(activeEpcPercent * 100).toFixed(1)}% of equipment cost${selectedQuote ? ` (${selectedQuote.vendor_name})` : ''}` },
    ]
  });

  return (
    <div className="p-4">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Detailed Cost Breakdown</h2>
        <p className="text-purple-700 font-semibold">Review component costs and system pricing</p>
      </div>

      {/* Vendor Quote Selector */}
      {vendorQuotes.length > 0 && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl shadow-lg border-2 border-green-400 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📦</span>
              <div>
                <p className="text-gray-800 font-bold">Vendor Quote Comparison</p>
                <p className="text-green-700 text-sm">{vendorQuotes.length} quote{vendorQuotes.length > 1 ? 's' : ''} available</p>
              </div>
            </div>
            <button
              onClick={() => setShowVendorComparison(!showVendorComparison)}
              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-white text-sm transition-all"
            >
              {showVendorComparison ? '✓ Hide' : '📊 Compare'}
            </button>
          </div>
          
          {showVendorComparison && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  id="merlin-estimate"
                  name="pricing-source"
                  checked={!selectedQuote}
                  onChange={() => setSelectedQuote(null)}
                  className="w-4 h-4"
                />
                <label htmlFor="merlin-estimate" className="text-gray-800 cursor-pointer flex-1">
                  <span className="font-semibold">Merlin Estimate</span>
                  <span className="text-green-700 text-sm ml-2">(Industry Standard)</span>
                </label>
              </div>
              
              {vendorQuotes.map((quote) => (
                <div key={quote.id} className="flex items-center gap-2">
                  <input
                    type="radio"
                    id={`quote-${quote.id}`}
                    name="pricing-source"
                    checked={selectedQuote?.id === quote.id}
                    onChange={() => setSelectedQuote(quote)}
                    className="w-4 h-4"
                  />
                  <label htmlFor={`quote-${quote.id}`} className="text-gray-800 cursor-pointer flex-1">
                    <span className="font-semibold">{quote.vendor_name || 'Vendor Quote'}</span>
                    {quote.pricing_data && (
                      <span className="text-green-700 text-sm ml-2">
                        ({quote.pricing_data.battery_kwh ? `$${quote.pricing_data.battery_kwh}/kWh` : 'Custom pricing'})
                      </span>
                    )}
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Total Cost Header */}
      <div className="bg-gradient-to-r from-purple-100 to-blue-100 p-6 rounded-2xl shadow-xl border-2 border-purple-400 mb-6">
        <div className="text-center">
          <p className="text-purple-700 text-lg font-semibold mb-2">Total Project Cost</p>
          <p className="text-5xl font-bold text-gray-900 mb-2">${totalCost.toLocaleString()}</p>
          <p className="text-gray-700 text-sm font-semibold">All components included</p>
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
        {costItems.map((category, idx) => (
          <div key={idx} className="bg-white rounded-xl border-2 border-purple-300 overflow-hidden shadow-lg">
            <div className="bg-gradient-to-r from-purple-100 to-blue-100 px-4 py-3 border-b-2 border-purple-300">
              <h3 className="text-lg font-bold text-gray-800">{category.category}</h3>
            </div>
            <div className="p-4 space-y-2">
              {category.items.map((item, itemIdx) => (
                <div key={itemIdx} className="flex justify-between items-start py-2 border-b border-gray-200 last:border-0">
                  <div className="flex-1">
                    <p className="text-gray-900 font-semibold">{item.name}</p>
                    <p className="text-gray-600 text-sm">{item.detail}</p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-green-700 font-bold text-lg">${item.cost.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mt-6">
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-4 rounded-lg border-2 border-blue-400 text-center">
          <p className="text-blue-700 text-sm font-semibold mb-1">Total Capacity</p>
          <p className="text-gray-900 font-bold text-xl">{bessPowerMW} MW</p>
          <p className="text-blue-600 text-xs">{batteryMWh.toFixed(1)} MWh storage</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-lg border-2 border-green-400 text-center">
          <p className="text-green-700 text-sm font-semibold mb-1">Cost per kW</p>
          <p className="text-gray-900 font-bold text-xl">${(totalCost / (bessPowerMW * 1000)).toFixed(0)}</p>
          <p className="text-green-600 text-xs">$/kW installed</p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-lg border-2 border-purple-400 text-center">
          <p className="text-purple-700 text-sm font-semibold mb-1">Cost per kWh</p>
          <p className="text-gray-900 font-bold text-xl">${(totalCost / (batteryMWh * 1000)).toFixed(0)}</p>
          <p className="text-purple-600 text-xs">$/kWh storage</p>
        </div>
      </div>
    </div>
  );
};

export default Step5_CostBreakdown;
