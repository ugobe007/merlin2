import { Eye, X, Download, CheckCircle, FileSpreadsheet, FileText } from "lucide-react";

interface QuotePreviewModalProps {
  // Modal control
  showPreview: boolean;
  onClose: () => void;
  previewFormat: "word" | "excel";
  setPreviewFormat: (format: "word" | "excel") => void;

  // Export functionality
  onExport: (format: "word" | "excel" | "pdf") => void;
  isExporting: boolean;
  exportSuccess: boolean;

  // Project Information
  projectName?: string;
  location?: string;
  applicationType: string;
  useCase: string;

  // System Specifications
  storageSizeMW: number;
  storageSizeMWh: number;
  durationHours: number;
  chemistry: string;
  roundTripEfficiency: number;
  installationType: string;
  gridConnection: string;

  // Electrical Specifications
  systemVoltage: number;
  dcVoltage: number;
  inverterType: string;
  numberOfInverters: number;
  inverterRating: number;
  inverterEfficiency: number;
  switchgearType: string;
  switchgearRating: number;
  bmsType: string;
  transformerRequired: boolean;
  transformerRating?: number;
  transformerVoltage?: string;

  // Performance Metrics
  cyclesPerYear: number;
  warrantyYears: number;
  utilityRate: number;
  demandCharge: number;

  // Renewable Integration
  solarPVIncluded: boolean;
  solarCapacityKW?: number;
  solarPanelType?: string;
  solarPanelEfficiency?: number;
  windTurbineIncluded: boolean;
  windCapacityKW?: number;
  windTurbineType?: string;
  fuelCellIncluded: boolean;
  fuelCellCapacityKW?: number;
  fuelCellType?: string;
  fuelType?: string;
  generatorIncluded: boolean;
  generatorCapacityKW?: number;
  generatorFuelTypeSelected?: string;
  generatorRedundancy?: boolean;

  // Financial
  localSystemCost: number;
}

export function QuotePreviewModal({
  showPreview,
  onClose,
  previewFormat,
  setPreviewFormat,
  onExport,
  isExporting,
  exportSuccess,
  projectName,
  location,
  applicationType,
  useCase,
  storageSizeMW,
  storageSizeMWh,
  durationHours,
  chemistry,
  roundTripEfficiency,
  installationType,
  gridConnection,
  systemVoltage,
  dcVoltage,
  inverterType,
  numberOfInverters,
  inverterRating,
  inverterEfficiency,
  switchgearType,
  switchgearRating,
  bmsType,
  transformerRequired,
  transformerRating,
  transformerVoltage,
  cyclesPerYear,
  warrantyYears,
  utilityRate,
  demandCharge,
  solarPVIncluded,
  solarCapacityKW,
  solarPanelType,
  solarPanelEfficiency,
  windTurbineIncluded,
  windCapacityKW,
  windTurbineType,
  fuelCellIncluded,
  fuelCellCapacityKW,
  fuelCellType,
  fuelType,
  generatorIncluded,
  generatorCapacityKW,
  generatorFuelTypeSelected,
  generatorRedundancy,
  localSystemCost,
}: QuotePreviewModalProps) {
  if (!showPreview) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        className="rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
        style={{ background: "#0f1117", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        {/* Modal Header */}
        <div
          className="text-white p-6 flex items-center justify-between"
          style={{
            background: "rgba(255,255,255,0.02)",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <Eye className="w-7 h-7 text-blue-400" />
              Quote Format Preview
            </h2>
            <p className="mt-1 text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
              See how your professional quote will look
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Format Tabs */}
          <div
            className="flex gap-4 mb-6"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
          >
            <button
              onClick={() => setPreviewFormat("word")}
              className={`px-6 py-3 font-semibold transition-colors ${
                previewFormat === "word"
                  ? "text-blue-400 border-b-2 border-blue-400"
                  : "text-white/40 hover:text-white/70"
              }`}
            >
              📄 Word Document
            </button>
            <button
              onClick={() => setPreviewFormat("excel")}
              className={`px-6 py-3 font-semibold transition-colors ${
                previewFormat === "excel"
                  ? "text-emerald-400 border-b-2 border-emerald-400"
                  : "text-white/40 hover:text-white/70"
              }`}
            >
              📊 Excel Spreadsheet
            </button>
          </div>

          {/* Word Document Preview */}
          {previewFormat === "word" && (
            <div
              className="rounded-xl p-8"
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div
                className="bg-white rounded-lg p-8 shadow-lg max-w-4xl mx-auto"
                style={{ fontFamily: "Calibri, sans-serif" }}
              >
                {/* Document Header */}
                <div className="border-b-4 border-blue-600 pb-6 mb-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h1 className="text-4xl font-bold text-gray-900 mb-2">⚡ MERLIN Energy</h1>
                      <p className="text-lg text-gray-600">Battery Energy Storage System Quote</p>
                    </div>
                    <div className="text-right text-sm text-gray-600">
                      <p className="font-semibold">
                        Quote #MER-{Math.floor(Math.random() * 10000)}
                      </p>
                      <p>{new Date().toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                {/* Project Information */}
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b-2 border-gray-300 pb-2">
                    Project Information
                  </h2>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-semibold text-gray-700">Project Name:</p>
                      <p className="text-gray-900">{projectName || "Sample BESS Project"}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-700">Location:</p>
                      <p className="text-gray-900">{location || "California, USA"}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-700">Application Type:</p>
                      <p className="text-gray-900 capitalize">{applicationType}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-700">Use Case:</p>
                      <p className="text-gray-900 capitalize">{useCase.replace("-", " ")}</p>
                    </div>
                  </div>
                </div>

                {/* System Specifications */}
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b-2 border-gray-300 pb-2">
                    System Specifications
                  </h2>
                  <table className="w-full text-sm">
                    <tbody>
                      <tr className="border-b border-gray-200">
                        <td className="py-2 font-semibold text-gray-700">Power Rating:</td>
                        <td className="py-2 text-gray-900 text-right">
                          {storageSizeMW.toFixed(1)} MW
                        </td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="py-2 font-semibold text-gray-700">Energy Capacity:</td>
                        <td className="py-2 text-gray-900 text-right">
                          {storageSizeMWh.toFixed(1)} MWh
                        </td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="py-2 font-semibold text-gray-700">Duration:</td>
                        <td className="py-2 text-gray-900 text-right">
                          {durationHours.toFixed(1)} hours
                        </td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="py-2 font-semibold text-gray-700">Battery Chemistry:</td>
                        <td className="py-2 text-gray-900 text-right uppercase">{chemistry}</td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="py-2 font-semibold text-gray-700">Round-Trip Efficiency:</td>
                        <td className="py-2 text-gray-900 text-right">{roundTripEfficiency}%</td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="py-2 font-semibold text-gray-700">Installation Type:</td>
                        <td className="py-2 text-gray-900 text-right capitalize">
                          {installationType}
                        </td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="py-2 font-semibold text-gray-700">Grid Connection:</td>
                        <td className="py-2 text-gray-900 text-right uppercase">
                          {gridConnection}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Electrical Specifications */}
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b-2 border-gray-300 pb-2">
                    Electrical Specifications
                  </h2>
                  <table className="w-full text-sm">
                    <tbody>
                      <tr className="border-b border-gray-200">
                        <td className="py-2 font-semibold text-gray-700">System Voltage (AC):</td>
                        <td className="py-2 text-gray-900 text-right">{systemVoltage}V</td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="py-2 font-semibold text-gray-700">DC Voltage:</td>
                        <td className="py-2 text-gray-900 text-right">{dcVoltage}V</td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="py-2 font-semibold text-gray-700">Inverter Type:</td>
                        <td className="py-2 text-gray-900 text-right capitalize">{inverterType}</td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="py-2 font-semibold text-gray-700">Number of Inverters:</td>
                        <td className="py-2 text-gray-900 text-right">{numberOfInverters} units</td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="py-2 font-semibold text-gray-700">
                          Inverter Rating (each):
                        </td>
                        <td className="py-2 text-gray-900 text-right">{inverterRating} kW</td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="py-2 font-semibold text-gray-700">
                          Total Inverter Capacity:
                        </td>
                        <td className="py-2 text-gray-900 text-right">
                          {numberOfInverters * inverterRating} kW
                        </td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="py-2 font-semibold text-gray-700">Inverter Efficiency:</td>
                        <td className="py-2 text-gray-900 text-right">{inverterEfficiency}%</td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="py-2 font-semibold text-gray-700">Switchgear Type:</td>
                        <td className="py-2 text-gray-900 text-right capitalize">
                          {switchgearType.replace("-", " ")}
                        </td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="py-2 font-semibold text-gray-700">Switchgear Rating:</td>
                        <td className="py-2 text-gray-900 text-right">{switchgearRating} A</td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="py-2 font-semibold text-gray-700">BMS Type:</td>
                        <td className="py-2 text-gray-900 text-right capitalize">{bmsType}</td>
                      </tr>
                      {transformerRequired && (
                        <>
                          <tr className="border-b border-gray-200">
                            <td className="py-2 font-semibold text-gray-700">
                              Transformer Rating:
                            </td>
                            <td className="py-2 text-gray-900 text-right">
                              {transformerRating} kVA
                            </td>
                          </tr>
                          <tr className="border-b border-gray-200">
                            <td className="py-2 font-semibold text-gray-700">
                              Transformer Voltage:
                            </td>
                            <td className="py-2 text-gray-900 text-right">{transformerVoltage}</td>
                          </tr>
                        </>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Performance Metrics */}
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b-2 border-gray-300 pb-2">
                    Performance & Operations
                  </h2>
                  <table className="w-full text-sm">
                    <tbody>
                      <tr className="border-b border-gray-200">
                        <td className="py-2 font-semibold text-gray-700">
                          Expected Cycles per Year:
                        </td>
                        <td className="py-2 text-gray-900 text-right">{cyclesPerYear} cycles</td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="py-2 font-semibold text-gray-700">Warranty Period:</td>
                        <td className="py-2 text-gray-900 text-right">{warrantyYears} years</td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="py-2 font-semibold text-gray-700">
                          Reference Utility Rate:
                        </td>
                        <td className="py-2 text-gray-900 text-right">
                          ${utilityRate.toFixed(3)}/kWh
                        </td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="py-2 font-semibold text-gray-700">
                          Reference Demand Charge:
                        </td>
                        <td className="py-2 text-gray-900 text-right">${demandCharge}/kW</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Renewable Integration (if applicable) */}
                {(solarPVIncluded ||
                  windTurbineIncluded ||
                  fuelCellIncluded ||
                  generatorIncluded) && (
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b-2 border-gray-300 pb-2">
                      Renewable & Backup Integration
                    </h2>
                    <table className="w-full text-sm">
                      <tbody>
                        {solarPVIncluded && (
                          <>
                            <tr className="border-b border-gray-200 bg-yellow-50">
                              <td className="py-2 font-semibold text-gray-700">
                                ☀️ Solar PV Capacity:
                              </td>
                              <td className="py-2 text-gray-900 text-right">
                                {solarCapacityKW} kW
                              </td>
                            </tr>
                            <tr className="border-b border-gray-200">
                              <td className="py-2 font-semibold text-gray-700 pl-6">Panel Type:</td>
                              <td className="py-2 text-gray-900 text-right capitalize">
                                {solarPanelType}
                              </td>
                            </tr>
                            <tr className="border-b border-gray-200">
                              <td className="py-2 font-semibold text-gray-700 pl-6">
                                Panel Efficiency:
                              </td>
                              <td className="py-2 text-gray-900 text-right">
                                {solarPanelEfficiency}%
                              </td>
                            </tr>
                          </>
                        )}
                        {windTurbineIncluded && (
                          <>
                            <tr className="border-b border-gray-200 bg-blue-50">
                              <td className="py-2 font-semibold text-gray-700">
                                💨 Wind Turbine Capacity:
                              </td>
                              <td className="py-2 text-gray-900 text-right">{windCapacityKW} kW</td>
                            </tr>
                            <tr className="border-b border-gray-200">
                              <td className="py-2 font-semibold text-gray-700 pl-6">
                                Turbine Type:
                              </td>
                              <td className="py-2 text-gray-900 text-right capitalize">
                                {windTurbineType}
                              </td>
                            </tr>
                          </>
                        )}
                        {fuelCellIncluded && (
                          <>
                            <tr className="border-b border-gray-200 bg-green-50">
                              <td className="py-2 font-semibold text-gray-700">
                                ⚗️ Fuel Cell Capacity:
                              </td>
                              <td className="py-2 text-gray-900 text-right">
                                {fuelCellCapacityKW} kW
                              </td>
                            </tr>
                            <tr className="border-b border-gray-200">
                              <td className="py-2 font-semibold text-gray-700 pl-6">
                                Fuel Cell Type:
                              </td>
                              <td className="py-2 text-gray-900 text-right uppercase">
                                {fuelCellType}
                              </td>
                            </tr>
                            <tr className="border-b border-gray-200">
                              <td className="py-2 font-semibold text-gray-700 pl-6">Fuel Type:</td>
                              <td className="py-2 text-gray-900 text-right capitalize">
                                {fuelType}
                              </td>
                            </tr>
                          </>
                        )}
                        {generatorIncluded && (
                          <tr className="border-b border-gray-200 bg-blue-50">
                            <td className="py-2 font-semibold text-gray-700">
                              {generatorFuelTypeSelected === "diesel"
                                ? "🛢️ Diesel"
                                : generatorFuelTypeSelected === "natural-gas"
                                  ? "🔥 Natural Gas"
                                  : generatorFuelTypeSelected === "dual-fuel"
                                    ? "⚡ Dual-Fuel"
                                    : "🔄 Linear"}{" "}
                              Generator:
                            </td>
                            <td className="py-2 text-gray-900 text-right">
                              {generatorCapacityKW} kW{generatorRedundancy ? " (N+1)" : ""}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Pricing Summary */}
                <div className="mb-6 bg-blue-50 rounded-lg p-6 border-2 border-blue-200">
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">Investment Summary</h2>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-lg">
                      <span className="font-semibold text-gray-700">Total System Cost:</span>
                      <span className="text-2xl font-bold text-blue-600">
                        ${(localSystemCost / 1000000).toFixed(2)}M
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm text-gray-600">
                      <span>Cost per kW:</span>
                      <span className="font-semibold">
                        ${(localSystemCost / (storageSizeMW * 1000)).toFixed(0)}/kW
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm text-gray-600">
                      <span>Cost per kWh:</span>
                      <span className="font-semibold">
                        ${(localSystemCost / (storageSizeMWh * 1000)).toFixed(0)}/kWh
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-8 pt-6 border-t-2 border-gray-300 text-xs text-gray-600">
                  <p className="mb-2">This quote is valid for 30 days from the date of issue.</p>
                  <p className="mb-2">
                    Terms: 50% deposit upon contract signing, 50% upon commissioning.
                  </p>
                  <p>Warranty: {warrantyYears} year comprehensive warranty included.</p>
                </div>
              </div>
            </div>
          )}

          {/* Excel Spreadsheet Preview */}
          {previewFormat === "excel" && (
            <div
              className="rounded-xl p-8"
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div className="bg-white rounded-lg p-4 shadow-lg max-w-5xl mx-auto overflow-x-auto">
                {/* Excel-style spreadsheet */}
                <div className="text-xs" style={{ fontFamily: "Arial, sans-serif" }}>
                  {/* Header Row */}
                  <div className="bg-green-700 text-white font-bold grid grid-cols-12 border border-gray-400">
                    <div className="p-2 border-r border-gray-400">A</div>
                    <div className="p-2 border-r border-gray-400">B</div>
                    <div className="p-2 border-r border-gray-400">C</div>
                    <div className="p-2 border-r border-gray-400">D</div>
                    <div className="p-2 border-r border-gray-400">E</div>
                    <div className="p-2 border-r border-gray-400">F</div>
                    <div className="p-2 border-r border-gray-400">G</div>
                    <div className="p-2 border-r border-gray-400">H</div>
                    <div className="p-2 border-r border-gray-400">I</div>
                    <div className="p-2 border-r border-gray-400">J</div>
                    <div className="p-2 border-r border-gray-400">K</div>
                    <div className="p-2">L</div>
                  </div>

                  {/* Title Section */}
                  <div className="grid grid-cols-12 border-x border-b border-gray-400">
                    <div className="col-span-12 bg-blue-600 text-white font-bold text-xl p-3 border-b border-gray-400">
                      ⚡ MERLIN Energy - BESS Quote Summary
                    </div>
                  </div>

                  {/* Quote Info */}
                  <div className="grid grid-cols-12 border-x border-b border-gray-400">
                    <div className="col-span-3 bg-gray-100 font-semibold p-2 border-r border-gray-400">
                      Quote #
                    </div>
                    <div className="col-span-3 p-2 border-r border-gray-400">
                      MER-{Math.floor(Math.random() * 10000)}
                    </div>
                    <div className="col-span-3 bg-gray-100 font-semibold p-2 border-r border-gray-400">
                      Date
                    </div>
                    <div className="col-span-3 p-2">{new Date().toLocaleDateString()}</div>
                  </div>

                  {/* Empty Row */}
                  <div className="grid grid-cols-12 border-x border-b border-gray-400">
                    <div className="col-span-12 p-2">&nbsp;</div>
                  </div>

                  {/* Project Information Header */}
                  <div className="grid grid-cols-12 border-x border-b border-gray-400">
                    <div className="col-span-12 bg-blue-100 font-bold p-2">PROJECT INFORMATION</div>
                  </div>
                  <div className="grid grid-cols-12 border-x border-b border-gray-400">
                    <div className="col-span-3 bg-gray-100 font-semibold p-2 border-r border-gray-400">
                      Project Name
                    </div>
                    <div className="col-span-9 p-2">{projectName || "Sample BESS Project"}</div>
                  </div>
                  <div className="grid grid-cols-12 border-x border-b border-gray-400">
                    <div className="col-span-3 bg-gray-100 font-semibold p-2 border-r border-gray-400">
                      Location
                    </div>
                    <div className="col-span-9 p-2">{location || "California, USA"}</div>
                  </div>
                  <div className="grid grid-cols-12 border-x border-b border-gray-400">
                    <div className="col-span-3 bg-gray-100 font-semibold p-2 border-r border-gray-400">
                      Application
                    </div>
                    <div className="col-span-3 p-2 border-r border-gray-400 capitalize">
                      {applicationType}
                    </div>
                    <div className="col-span-3 bg-gray-100 font-semibold p-2 border-r border-gray-400">
                      Use Case
                    </div>
                    <div className="col-span-3 p-2 capitalize">{useCase.replace("-", " ")}</div>
                  </div>

                  {/* Empty Row */}
                  <div className="grid grid-cols-12 border-x border-b border-gray-400">
                    <div className="col-span-12 p-2">&nbsp;</div>
                  </div>

                  {/* System Specifications */}
                  <div className="grid grid-cols-12 border-x border-b border-gray-400">
                    <div className="col-span-12 bg-blue-100 font-bold p-2">
                      SYSTEM SPECIFICATIONS
                    </div>
                  </div>
                  <div className="grid grid-cols-12 border-x border-b border-gray-400 bg-gray-50">
                    <div className="col-span-6 font-semibold p-2 border-r border-gray-400">
                      Parameter
                    </div>
                    <div className="col-span-3 font-semibold p-2 border-r border-gray-400 text-center">
                      Value
                    </div>
                    <div className="col-span-3 font-semibold p-2 text-center">Unit</div>
                  </div>
                  <div className="grid grid-cols-12 border-x border-b border-gray-400">
                    <div className="col-span-6 p-2 border-r border-gray-400">Power Rating</div>
                    <div className="col-span-3 p-2 border-r border-gray-400 text-right">
                      {storageSizeMW.toFixed(1)}
                    </div>
                    <div className="col-span-3 p-2 text-center">MW</div>
                  </div>
                  <div className="grid grid-cols-12 border-x border-b border-gray-400">
                    <div className="col-span-6 p-2 border-r border-gray-400">Energy Capacity</div>
                    <div className="col-span-3 p-2 border-r border-gray-400 text-right">
                      {storageSizeMWh.toFixed(1)}
                    </div>
                    <div className="col-span-3 p-2 text-center">MWh</div>
                  </div>
                  <div className="grid grid-cols-12 border-x border-b border-gray-400">
                    <div className="col-span-6 p-2 border-r border-gray-400">Duration</div>
                    <div className="col-span-3 p-2 border-r border-gray-400 text-right">
                      {durationHours.toFixed(1)}
                    </div>
                    <div className="col-span-3 p-2 text-center">hours</div>
                  </div>
                  <div className="grid grid-cols-12 border-x border-b border-gray-400">
                    <div className="col-span-6 p-2 border-r border-gray-400">Battery Chemistry</div>
                    <div className="col-span-3 p-2 border-r border-gray-400 text-right uppercase">
                      {chemistry}
                    </div>
                    <div className="col-span-3 p-2 text-center">-</div>
                  </div>
                  <div className="grid grid-cols-12 border-x border-b border-gray-400">
                    <div className="col-span-6 p-2 border-r border-gray-400">
                      Round-Trip Efficiency
                    </div>
                    <div className="col-span-3 p-2 border-r border-gray-400 text-right">
                      {roundTripEfficiency}
                    </div>
                    <div className="col-span-3 p-2 text-center">%</div>
                  </div>
                  <div className="grid grid-cols-12 border-x border-b border-gray-400">
                    <div className="col-span-6 p-2 border-r border-gray-400">Cycles per Year</div>
                    <div className="col-span-3 p-2 border-r border-gray-400 text-right">
                      {cyclesPerYear}
                    </div>
                    <div className="col-span-3 p-2 text-center">cycles/yr</div>
                  </div>
                  <div className="grid grid-cols-12 border-x border-b border-gray-400">
                    <div className="col-span-6 p-2 border-r border-gray-400">Installation Type</div>
                    <div className="col-span-3 p-2 border-r border-gray-400 text-right capitalize">
                      {installationType}
                    </div>
                    <div className="col-span-3 p-2 text-center">-</div>
                  </div>
                  <div className="grid grid-cols-12 border-x border-b border-gray-400">
                    <div className="col-span-6 p-2 border-r border-gray-400">Grid Connection</div>
                    <div className="col-span-3 p-2 border-r border-gray-400 text-right uppercase">
                      {gridConnection}
                    </div>
                    <div className="col-span-3 p-2 text-center">-</div>
                  </div>

                  {/* Empty Row */}
                  <div className="grid grid-cols-12 border-x border-b border-gray-400">
                    <div className="col-span-12 p-2">&nbsp;</div>
                  </div>

                  {/* Electrical Specifications */}
                  <div className="grid grid-cols-12 border-x border-b border-gray-400">
                    <div className="col-span-12 bg-blue-100 font-bold p-2">
                      ELECTRICAL SPECIFICATIONS
                    </div>
                  </div>
                  <div className="grid grid-cols-12 border-x border-b border-gray-400">
                    <div className="col-span-6 p-2 border-r border-gray-400">
                      System Voltage (AC)
                    </div>
                    <div className="col-span-3 p-2 border-r border-gray-400 text-right">
                      {systemVoltage}
                    </div>
                    <div className="col-span-3 p-2 text-center">V</div>
                  </div>
                  <div className="grid grid-cols-12 border-x border-b border-gray-400">
                    <div className="col-span-6 p-2 border-r border-gray-400">DC Voltage</div>
                    <div className="col-span-3 p-2 border-r border-gray-400 text-right">
                      {dcVoltage}
                    </div>
                    <div className="col-span-3 p-2 text-center">V</div>
                  </div>
                  <div className="grid grid-cols-12 border-x border-b border-gray-400">
                    <div className="col-span-6 p-2 border-r border-gray-400">
                      Number of Inverters
                    </div>
                    <div className="col-span-3 p-2 border-r border-gray-400 text-right">
                      {numberOfInverters}
                    </div>
                    <div className="col-span-3 p-2 text-center">units</div>
                  </div>
                  <div className="grid grid-cols-12 border-x border-b border-gray-400">
                    <div className="col-span-6 p-2 border-r border-gray-400">
                      Inverter Rating (each)
                    </div>
                    <div className="col-span-3 p-2 border-r border-gray-400 text-right">
                      {inverterRating}
                    </div>
                    <div className="col-span-3 p-2 text-center">kW</div>
                  </div>
                  <div className="grid grid-cols-12 border-x border-b border-gray-400">
                    <div className="col-span-6 p-2 border-r border-gray-400">
                      Inverter Efficiency
                    </div>
                    <div className="col-span-3 p-2 border-r border-gray-400 text-right">
                      {inverterEfficiency}
                    </div>
                    <div className="col-span-3 p-2 text-center">%</div>
                  </div>
                  <div className="grid grid-cols-12 border-x border-b border-gray-400">
                    <div className="col-span-6 p-2 border-r border-gray-400">Inverter Type</div>
                    <div className="col-span-3 p-2 border-r border-gray-400 text-right capitalize">
                      {inverterType}
                    </div>
                    <div className="col-span-3 p-2 text-center">-</div>
                  </div>
                  <div className="grid grid-cols-12 border-x border-b border-gray-400">
                    <div className="col-span-6 p-2 border-r border-gray-400">Switchgear Type</div>
                    <div className="col-span-3 p-2 border-r border-gray-400 text-right capitalize">
                      {switchgearType.replace("-", " ")}
                    </div>
                    <div className="col-span-3 p-2 text-center">-</div>
                  </div>
                  <div className="grid grid-cols-12 border-x border-b border-gray-400">
                    <div className="col-span-6 p-2 border-r border-gray-400">Switchgear Rating</div>
                    <div className="col-span-3 p-2 border-r border-gray-400 text-right">
                      {switchgearRating}
                    </div>
                    <div className="col-span-3 p-2 text-center">A</div>
                  </div>
                  <div className="grid grid-cols-12 border-x border-b border-gray-400">
                    <div className="col-span-6 p-2 border-r border-gray-400">BMS Type</div>
                    <div className="col-span-3 p-2 border-r border-gray-400 text-right capitalize">
                      {bmsType}
                    </div>
                    <div className="col-span-3 p-2 text-center">-</div>
                  </div>
                  {transformerRequired && (
                    <>
                      <div className="grid grid-cols-12 border-x border-b border-gray-400">
                        <div className="col-span-6 p-2 border-r border-gray-400">
                          Transformer Rating
                        </div>
                        <div className="col-span-3 p-2 border-r border-gray-400 text-right">
                          {transformerRating}
                        </div>
                        <div className="col-span-3 p-2 text-center">kVA</div>
                      </div>
                      <div className="grid grid-cols-12 border-x border-b border-gray-400">
                        <div className="col-span-6 p-2 border-r border-gray-400">
                          Transformer Voltage
                        </div>
                        <div className="col-span-3 p-2 border-r border-gray-400 text-right">
                          {transformerVoltage}
                        </div>
                        <div className="col-span-3 p-2 text-center">-</div>
                      </div>
                    </>
                  )}

                  {/* Empty Row */}
                  <div className="grid grid-cols-12 border-x border-b border-gray-400">
                    <div className="col-span-12 p-2">&nbsp;</div>
                  </div>

                  {/* Financial Summary */}
                  <div className="grid grid-cols-12 border-x border-b border-gray-400">
                    <div className="col-span-12 bg-green-100 font-bold p-2">FINANCIAL SUMMARY</div>
                  </div>
                  <div className="grid grid-cols-12 border-x border-b border-gray-400 bg-yellow-50">
                    <div className="col-span-6 font-bold p-2 border-r border-gray-400">
                      Total System Cost
                    </div>
                    <div className="col-span-3 font-bold p-2 border-r border-gray-400 text-right text-green-700">
                      ${(localSystemCost / 1000000).toFixed(2)}M
                    </div>
                    <div className="col-span-3 p-2 text-center">USD</div>
                  </div>
                  <div className="grid grid-cols-12 border-x border-b border-gray-400">
                    <div className="col-span-6 p-2 border-r border-gray-400">Cost per kW</div>
                    <div className="col-span-3 p-2 border-r border-gray-400 text-right">
                      ${(localSystemCost / (storageSizeMW * 1000)).toFixed(0)}
                    </div>
                    <div className="col-span-3 p-2 text-center">$/kW</div>
                  </div>
                  <div className="grid grid-cols-12 border-x border-b border-gray-400">
                    <div className="col-span-6 p-2 border-r border-gray-400">Cost per kWh</div>
                    <div className="col-span-3 p-2 border-r border-gray-400 text-right">
                      ${(localSystemCost / (storageSizeMWh * 1000)).toFixed(0)}
                    </div>
                    <div className="col-span-3 p-2 text-center">$/kWh</div>
                  </div>
                  <div className="grid grid-cols-12 border-x border-b border-gray-400">
                    <div className="col-span-6 p-2 border-r border-gray-400">Warranty Period</div>
                    <div className="col-span-3 p-2 border-r border-gray-400 text-right">
                      {warrantyYears}
                    </div>
                    <div className="col-span-3 p-2 text-center">years</div>
                  </div>
                  <div className="grid grid-cols-12 border-x border-b border-gray-400">
                    <div className="col-span-6 p-2 border-r border-gray-400">
                      Utility Rate (Reference)
                    </div>
                    <div className="col-span-3 p-2 border-r border-gray-400 text-right">
                      ${utilityRate.toFixed(3)}
                    </div>
                    <div className="col-span-3 p-2 text-center">$/kWh</div>
                  </div>
                  <div className="grid grid-cols-12 border-x border-b border-gray-400">
                    <div className="col-span-6 p-2 border-r border-gray-400">
                      Demand Charge (Reference)
                    </div>
                    <div className="col-span-3 p-2 border-r border-gray-400 text-right">
                      ${demandCharge}
                    </div>
                    <div className="col-span-3 p-2 text-center">$/kW</div>
                  </div>

                  {/* Footer */}
                  <div className="grid grid-cols-12 border-x border-b border-gray-400">
                    <div className="col-span-12 p-2">&nbsp;</div>
                  </div>
                  <div className="grid grid-cols-12 border-x border-b border-gray-400">
                    <div className="col-span-12 bg-gray-100 text-xs p-3">
                      <p className="mb-1">
                        <strong>Quote Valid:</strong> 30 days from issue date
                      </p>
                      <p className="mb-1">
                        <strong>Payment Terms:</strong> 50% deposit upon contract signing, 50% upon
                        commissioning
                      </p>
                      <p>
                        <strong>Includes:</strong> {warrantyYears}-year comprehensive warranty,
                        installation, commissioning, and training
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-6 flex gap-4 justify-end">
            <button
              onClick={onClose}
              className="px-6 py-3 rounded-lg font-semibold transition-colors"
              style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.7)" }}
            >
              Close Preview
            </button>

            {/* Export Format Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => onExport("word")}
                disabled={isExporting}
                className="px-5 py-3 rounded-lg font-semibold transition-all disabled:opacity-50 flex items-center gap-2 hover:scale-[1.02]"
                style={{
                  background: "rgba(59,130,246,0.15)",
                  border: "1px solid rgba(59,130,246,0.3)",
                  color: "#93c5fd",
                }}
              >
                {isExporting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Exporting...
                  </>
                ) : exportSuccess ? (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Downloaded!
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    Word (.docx)
                  </>
                )}
              </button>
              <button
                onClick={() => onExport("excel")}
                className="px-5 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 hover:scale-[1.02]"
                style={{
                  background: "rgba(16,185,129,0.15)",
                  border: "1px solid rgba(16,185,129,0.3)",
                  color: "#6ee7b7",
                }}
              >
                <FileSpreadsheet className="w-5 h-5" />
                Excel
              </button>
              <button
                onClick={() => onExport("pdf")}
                className="px-5 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 hover:scale-[1.02]"
                style={{
                  background: "rgba(239,68,68,0.15)",
                  border: "1px solid rgba(239,68,68,0.3)",
                  color: "#fca5a5",
                }}
              >
                <FileText className="w-5 h-5" />
                PDF
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
