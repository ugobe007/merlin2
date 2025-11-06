import type { CalculationBreakdown } from '../../utils/calculationFormulas';

interface CalculationModalProps {
  isOpen: boolean;
  onClose: () => void;
  calculations: CalculationBreakdown[];
  projectName: string;
}

export default function CalculationModal({ isOpen, onClose, calculations, projectName }: CalculationModalProps) {
  if (!isOpen) return null;

  const cardStyle = "bg-gray-800/70 rounded-xl p-6 border-2 border-purple-500/30 shadow-lg backdrop-blur-sm";

  const groupedCalculations = calculations.reduce((acc, calc) => {
    if (!acc[calc.section]) {
      acc[calc.section] = [];
    }
    acc[calc.section].push(calc);
    return acc;
  }, {} as Record<string, CalculationBreakdown[]>);

  const getSectionColor = (section: string) => {
    const colors: Record<string, string> = {
      'BESS Sizing': 'from-blue-500 to-cyan-500',
      'Equipment Costs': 'from-purple-500 to-pink-500',
      'Balance of System': 'from-orange-500 to-yellow-500',
      'EPC & Installation': 'from-green-500 to-teal-500',
      'BESS Total': 'from-indigo-500 to-purple-500',
      'Tariffs & Duties': 'from-red-500 to-orange-500',
      'Application Costs': 'from-pink-500 to-rose-500',
      'Financial Returns': 'from-yellow-500 to-green-500',
    };
    return colors[section] || 'from-gray-500 to-gray-600';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-gray-900 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden border-4 border-purple-500/50">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 sticky top-0 z-10">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold text-white flex items-center space-x-3">
                <span>🎯</span>
                <span>Calculation Breakdown</span>
              </h2>
              <p className="text-purple-100 mt-1">Full transparency: All formulas, variables & assumptions</p>
              <p className="text-sm text-purple-200 mt-1 font-semibold">{projectName}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-red-300 transition-colors text-3xl font-bold w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/10"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)] p-6 space-y-8">
          {/* Introduction */}
          <div className={cardStyle}>
            <div className="flex items-start space-x-4">
              <div className="text-4xl">📊</div>
              <div>
                <h3 className="text-xl font-bold text-blue-300 mb-2">About This Document</h3>
                <p className="text-gray-300 leading-relaxed">
                  This breakdown provides complete transparency into your BESS quote calculation. Every number 
                  in your quote is derived from the formulas shown below. All assumptions, data sources, and 
                  industry standards are documented for your verification and confidence.
                </p>
                <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-blue-900/30 rounded-lg p-3">
                    <div className="font-bold text-blue-300">Data Sources</div>
                    <div className="text-gray-400 mt-1">BNEF, Wood Mackenzie, SEIA, AWEA, EIA</div>
                  </div>
                  <div className="bg-purple-900/30 rounded-lg p-3">
                    <div className="font-bold text-purple-300">Last Updated</div>
                    <div className="text-gray-400 mt-1">Q4 2025 Market Data</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Calculation Sections */}
          {Object.entries(groupedCalculations).map(([section, calcs]) => (
            <div key={section} className="space-y-4">
              <div className={`bg-gradient-to-r ${getSectionColor(section)} rounded-xl p-4 shadow-lg`}>
                <h3 className="text-2xl font-bold text-white flex items-center space-x-2">
                  <span>{section === 'BESS Sizing' ? '⚡' : section === 'Equipment Costs' ? '🔋' : section === 'Financial Returns' ? '💰' : '🔧'}</span>
                  <span>{section}</span>
                </h3>
              </div>

              {calcs.map((calc, idx) => (
                <div key={idx} className={cardStyle}>
                  {/* Category Title */}
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="text-xl font-bold text-purple-300">{calc.category}</h4>
                    <div className="text-right">
                      <div className="text-sm text-gray-400">Result</div>
                      <div className="text-2xl font-bold text-green-400">
                        {calc.result.toLocaleString(undefined, { maximumFractionDigits: 2 })} {calc.resultUnit}
                      </div>
                    </div>
                  </div>

                  {/* Formula */}
                  <div className="bg-blue-900/20 rounded-lg p-4 mb-4 border-l-4 border-blue-400">
                    <div className="text-xs text-blue-300 font-semibold mb-1">FORMULA</div>
                    <div className="font-mono text-blue-100 text-sm">{calc.formula}</div>
                  </div>

                  {/* Variables */}
                  <div className="bg-purple-900/20 rounded-lg p-4 mb-4">
                    <div className="text-xs text-purple-300 font-semibold mb-2">VARIABLES</div>
                    <div className="grid grid-cols-2 gap-3">
                      {calc.variables.map((v, vIdx) => (
                        <div key={vIdx} className="flex justify-between items-center bg-gray-800/50 rounded px-3 py-2">
                          <span className="text-gray-300 text-sm">{v.name}:</span>
                          <span className="font-bold text-white text-sm">
                            {typeof v.value === 'number' ? v.value.toLocaleString() : v.value}
                            {v.unit && <span className="text-gray-400 ml-1">{v.unit}</span>}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Explanation */}
                  <div className="mb-4">
                    <div className="text-xs text-gray-400 font-semibold mb-1">EXPLANATION</div>
                    <p className="text-gray-300 text-sm leading-relaxed">{calc.explanation}</p>
                  </div>

                  {/* Assumptions */}
                  {calc.assumptions && calc.assumptions.length > 0 && (
                    <div className="bg-yellow-900/10 rounded-lg p-4 border-l-4 border-yellow-500">
                      <div className="text-xs text-yellow-300 font-semibold mb-2">ASSUMPTIONS & NOTES</div>
                      <ul className="space-y-1">
                        {calc.assumptions.map((assumption, aIdx) => (
                          <li key={aIdx} className="text-gray-400 text-xs flex items-start">
                            <span className="text-yellow-500 mr-2">•</span>
                            <span>{assumption}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}

          {/* Data Sources Footer */}
          <div className={cardStyle}>
            <h4 className="text-xl font-bold text-green-300 mb-4">📚 Data Sources & References</h4>
            <div className="space-y-2 text-sm text-gray-300">
              <div className="flex items-start">
                <span className="font-bold text-blue-300 w-48">BNEF:</span>
                <span>Bloomberg New Energy Finance - Battery and energy storage pricing</span>
              </div>
              <div className="flex items-start">
                <span className="font-bold text-blue-300 w-48">Wood Mackenzie:</span>
                <span>Solar, wind, PCS, and renewable energy market intelligence</span>
              </div>
              <div className="flex items-start">
                <span className="font-bold text-blue-300 w-48">SEIA:</span>
                <span>Solar Energy Industries Association - Solar installation costs</span>
              </div>
              <div className="flex items-start">
                <span className="font-bold text-blue-300 w-48">AWEA:</span>
                <span>American Wind Energy Association - Wind turbine pricing data</span>
              </div>
              <div className="flex items-start">
                <span className="font-bold text-blue-300 w-48">EIA:</span>
                <span>Energy Information Administration - Utility rate structures</span>
              </div>
              <div className="flex items-start">
                <span className="font-bold text-blue-300 w-48">Caterpillar/Cummins:</span>
                <span>Generator equipment manufacturer pricing</span>
              </div>
            </div>
            <div className="mt-4 p-3 bg-green-900/20 rounded-lg border border-green-500/30">
              <p className="text-xs text-green-300">
                <strong>Pricing Update Frequency:</strong> All market pricing data is reviewed and updated quarterly 
                to ensure accuracy. Last updated Q4 2025. Industry standard percentages (BoS: 10-15%, EPC: 12-18%) 
                are based on actual project data from installed systems.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-gray-800/90 p-4 border-t-2 border-purple-500/30 sticky bottom-0">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-400">
              Generated: {new Date().toLocaleString()}
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold rounded-lg hover:from-purple-400 hover:to-blue-400 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
