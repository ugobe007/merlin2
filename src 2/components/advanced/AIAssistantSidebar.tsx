import React from 'react';

interface AIAssistantSidebarProps {
  applicationType: string;
  energyCapacity: number;
  energyUnit: string;
  powerRating: number;
  powerUnit: string;
  setShowAnalytics: (show: boolean) => void;
  setShowTemplates: (show: boolean) => void;
}

export default function AIAssistantSidebar({
  applicationType,
  energyCapacity,
  energyUnit,
  powerRating,
  powerUnit,
  setShowAnalytics,
  setShowTemplates
}: AIAssistantSidebarProps) {
  const duration = powerRating > 0 ? (energyCapacity / powerRating) : 0;

  return (
    <div className="lg:col-span-1">
      <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl shadow-lg p-6 border border-purple-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white text-sm">🤖</span>
          </div>
          <h3 className="text-lg font-bold text-gray-800">AI Assistant</h3>
          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-semibold">LIVE</span>
        </div>
        
        <div className="space-y-4">
          {/* Dynamic Recommendations based on configuration */}
          <div className="p-3 bg-white rounded-lg border border-purple-200">
            <div className="text-sm text-purple-600 mb-2 font-semibold">🔍 Project Analysis</div>
            <div className="text-sm text-gray-800">
              <strong>{applicationType.charAt(0).toUpperCase() + applicationType.slice(1)}</strong> project: 
              {energyCapacity}{energyUnit} capacity with {powerRating}{powerUnit} output
              {powerRating > 0 && (
                <div className="mt-1 text-xs text-blue-600">
                  Duration: {duration.toFixed(1)} hours at full power
                </div>
              )}
              
              {/* Industry Standard Warnings */}
              {(() => {
                if (duration > 8) {
                  return (
                    <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
                      ⚠️ <strong>Warning:</strong> {duration.toFixed(1)}-hour duration is unusually long for most commercial applications. 
                      Consider reducing energy capacity or increasing power rating.
                    </div>
                  );
                } else if (duration > 6) {
                  return (
                    <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                      ℹ️ <strong>Note:</strong> {duration.toFixed(1)}-hour duration is suitable for backup power or renewable shifting applications.
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          </div>

          {/* Smart Recommendations */}
          <div className="p-3 bg-white rounded-lg border border-green-200">
            <div className="text-sm text-green-600 mb-2 font-semibold">💡 Smart Recommendations</div>
            <div className="text-sm text-gray-800">
              {applicationType === 'residential' && (
                "For home installations, consider Tesla Powerwall or Enphase IQ series for reliability and warranty."
              )}
              {applicationType === 'commercial' && (
                "Commercial projects benefit from modular systems. Consider LFP chemistry for cost-effectiveness."
              )}
              {applicationType === 'utility' && (
                "Utility-scale projects should focus on LCOE optimization. Consider container-based solutions."
              )}
              {applicationType === 'ups' && (
                "UPS systems require fast response (<4ms). Consider Li-ion with high-rate discharge capability for critical loads."
              )}
            </div>
          </div>
          
          {/* Cost Optimization */}
          <div className="p-3 bg-white rounded-lg border border-blue-200">
            <div className="text-sm text-blue-600 mb-2 font-semibold">💰 Cost Optimization</div>
            <div className="text-sm text-gray-800">
              {energyCapacity > 1000 ? (
                "Large systems qualify for bulk pricing. Estimated 15-25% savings possible."
              ) : energyCapacity > 100 ? (
                "Medium-scale project. Consider financing options and tax incentives."
              ) : (
                "Residential scale qualifies for federal tax credits up to 30%."
              )}
            </div>
          </div>

          {/* Market Intelligence */}
          <div className="p-3 bg-white rounded-lg border border-amber-200">
            <div className="text-sm text-amber-600 mb-2 font-semibold">📈 Market Intelligence</div>
            <div className="text-sm text-gray-800">
              Similar {applicationType} projects averaging $
              {applicationType === 'residential' ? '800-1200' : 
               applicationType === 'commercial' ? '600-900' : '400-600'}
              /{energyUnit === 'MWh' ? 'MWh' : 'kWh'} installed
            </div>
          </div>
          
          <button className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-blue-600 transition-colors">
            🧠 Get Detailed AI Analysis
          </button>
          
          <button className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-lg font-semibold hover:from-green-600 hover:to-emerald-600 transition-colors text-sm">
            💬 Chat with AI Assistant
          </button>
        </div>
      </div>
      
      {/* Enhanced Quick Actions with Status Indicators */}
      <div className="mt-6 bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-bold text-gray-800 flex items-center gap-2">
            <span className="text-xl">🚀</span>
            Ready for Next Steps
          </h4>
          {applicationType && energyCapacity > 0 && (
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
              ✓ Configuration Ready
            </span>
          )}
        </div>
        
        {!applicationType || energyCapacity === 0 ? (
          <div className="text-center py-4">
            <div className="text-gray-500 mb-2">⏳ Complete your basic configuration first</div>
            <div className="text-sm text-gray-400">
              {!applicationType && "→ Select an application type above"}
              {applicationType && energyCapacity === 0 && "→ Set your power requirements"}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <button 
              onClick={() => setShowAnalytics(true)}
              className="w-full text-left p-4 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 rounded-lg transition-colors border border-blue-200 shadow-sm hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📊</span>
                  <div>
                    <div className="font-semibold text-blue-800">Advanced Analytics</div>
                    <div className="text-sm text-blue-600">ROI, payback, cashflow analysis</div>
                  </div>
                </div>
                <span className="text-blue-400">→</span>
              </div>
            </button>
            
            <button 
              onClick={() => setShowTemplates(true)}
              className="w-full text-left p-4 bg-gradient-to-r from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 rounded-lg transition-colors border border-green-200 shadow-sm hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📋</span>
                  <div>
                    <div className="font-semibold text-green-800">Generate Quote</div>
                    <div className="text-sm text-green-600">Professional proposal document</div>
                  </div>
                </div>
                <span className="text-green-400">→</span>
              </div>
            </button>
            
            <button className="w-full text-left p-4 bg-gradient-to-r from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 rounded-lg transition-colors border border-purple-200 shadow-sm hover:shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">💾</span>
                  <div>
                    <div className="font-semibold text-purple-800">Save Configuration</div>
                    <div className="text-sm text-purple-600">Store for future reference</div>
                  </div>
                </div>
                <span className="text-purple-400">→</span>
              </div>
            </button>
            
            <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
              <div className="text-sm text-amber-800">
                <span className="font-semibold">💡 Recommended:</span> Start with Advanced Analytics to see cost breakdowns and ROI projections for your {applicationType} project.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}