import React, { useState, useCallback } from "react";

interface PricingDataCaptureProps {
  onClose: () => void;
  userEmail?: string;
}

interface ExtractedPricingData {
  id: string;
  fileName: string;
  uploadDate: Date;
  status: "pending" | "extracted" | "reviewed" | "validated";
  confidence: number;
  data: {
    // Equipment Costs
    batterySystem?: {
      manufacturer?: string;
      model?: string;
      capacity_kwh?: number;
      power_kw?: number;
      price_total?: number;
      price_per_kwh?: number;
      price_per_kw?: number;
    };
    inverter?: {
      manufacturer?: string;
      model?: string;
      power_kw?: number;
      price?: number;
    };
    bos?: {
      description?: string;
      price?: number;
    };

    // Installation & Soft Costs
    installation?: {
      labor_cost?: number;
      labor_hours?: number;
      labor_rate_per_hour?: number;
    };
    engineering?: number;
    permitting?: number;
    interconnection?: number;

    // Project Details
    project?: {
      location?: string;
      state?: string;
      country?: string;
      system_size_kwh?: number;
      system_size_kw?: number;
      application?: string;
      quote_date?: string;
    };

    // Pricing Summary
    summary?: {
      total_cost?: number;
      cost_per_kwh?: number;
      cost_per_kw?: number;
      warranty_years?: number;
    };

    // Vendor Info (anonymized)
    vendor?: {
      type?: "manufacturer" | "distributor" | "installer" | "epc";
      region?: string;
    };
  };
}

const PricingDataCapture: React.FC<PricingDataCaptureProps> = ({ onClose, _userEmail }) => {
  const [activeTab, setActiveTab] = useState<"upload" | "review" | "history">("upload");
  const [uploadedFiles, setUploadedFiles] = useState<ExtractedPricingData[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<ExtractedPricingData | null>(null);
  const [consentGiven, setConsentGiven] = useState(false);

  // Handle file drag events
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  // Handle file drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  }, []);

  // Handle file input
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files));
    }
  };

  // Process uploaded files
  const handleFiles = async (files: File[]) => {
    if (!consentGiven) {
      alert("Please consent to data usage terms before uploading.");
      return;
    }

    setUploading(true);

    // Simulate file upload and AI extraction
    // In production, this would call your backend API
    for (const file of files) {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const mockExtractedData: ExtractedPricingData = {
        id: Math.random().toString(36).substr(2, 9),
        fileName: file.name,
        uploadDate: new Date(),
        status: "extracted",
        confidence: Math.random() * 0.3 + 0.7, // 70-100%
        data: {
          batterySystem: {
            manufacturer: "Tesla",
            model: "Megapack 2XL",
            capacity_kwh: 3916,
            power_kw: 1927,
            price_total: 1500000,
            price_per_kwh: 383,
            price_per_kw: 778,
          },
          inverter: {
            manufacturer: "Integrated",
            model: "Built-in",
            power_kw: 1927,
            price: 0,
          },
          installation: {
            labor_cost: 75000,
            labor_hours: 600,
            labor_rate_per_hour: 125,
          },
          engineering: 50000,
          permitting: 25000,
          interconnection: 35000,
          project: {
            location: "California",
            state: "CA",
            country: "USA",
            system_size_kwh: 3916,
            system_size_kw: 1927,
            application: "Commercial C&I",
            quote_date: new Date().toISOString().split("T")[0],
          },
          summary: {
            total_cost: 1735000,
            cost_per_kwh: 443,
            cost_per_kw: 900,
            warranty_years: 10,
          },
          vendor: {
            type: "manufacturer",
            region: "West Coast",
          },
        },
      };

      setUploadedFiles((prev) => [mockExtractedData, ...prev]);
    }

    setUploading(false);
    setActiveTab("review");
  };

  // Validate and submit data
  const handleValidateData = (data: ExtractedPricingData) => {
    const updatedData = { ...data, status: "validated" as const };
    setUploadedFiles((prev) => prev.map((f) => (f.id === data.id ? updatedData : f)));
    setSelectedFile(null);

    // In production, send to backend
    alert(
      "Thank you! Your pricing data has been validated and added to our database. You earn 10 data credits!"
    );
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-6xl max-h-[95vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-3xl flex-shrink-0">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-1">📊 Pricing Data Capture</h2>
            <p className="text-gray-600">Help build the world's largest BESS pricing database</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 hover:bg-white rounded-full w-10 h-10 flex items-center justify-center text-3xl transition-all"
            title="Close (ESC)"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-6 bg-gray-50 flex-shrink-0">
          <button
            onClick={() => setActiveTab("upload")}
            className={`px-6 py-3 font-semibold transition-all ${
              activeTab === "upload"
                ? "border-b-2 border-purple-600 text-purple-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            📤 Upload
          </button>
          <button
            onClick={() => setActiveTab("review")}
            className={`px-6 py-3 font-semibold transition-all ${
              activeTab === "review"
                ? "border-b-2 border-purple-600 text-purple-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            ✏️ Review ({uploadedFiles.filter((f) => f.status === "extracted").length})
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-6 py-3 font-semibold transition-all ${
              activeTab === "history"
                ? "border-b-2 border-purple-600 text-purple-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            📜 History ({uploadedFiles.length})
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Upload Tab */}
          {activeTab === "upload" && (
            <div className="space-y-6">
              {/* Consent Checkbox */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                <label className="flex items-start cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consentGiven}
                    onChange={(e) => setConsentGiven(e.target.checked)}
                    className="mt-1 mr-3 w-5 h-5 text-purple-600 rounded"
                  />
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">Data Usage Consent</p>
                    <p className="text-sm text-gray-700">
                      I agree to anonymously share pricing data extracted from uploaded documents.
                      All vendor and customer identifying information will be removed. This data
                      will be used to improve market pricing models and may be sold as aggregated
                      market intelligence.
                      <br />
                      <span className="font-semibold text-purple-600 mt-2 inline-block">
                        🎁 Earn 10 data credits per validated quote!
                      </span>
                    </p>
                  </div>
                </label>
              </div>

              {/* Drag & Drop Area */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`border-3 border-dashed rounded-2xl p-12 text-center transition-all ${
                  dragActive
                    ? "border-purple-500 bg-purple-50"
                    : "border-gray-300 bg-gray-50 hover:border-purple-400"
                } ${!consentGiven ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
              >
                <div className="text-6xl mb-4">📄</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {uploading ? "Processing Files..." : "Drop files here or click to upload"}
                </h3>
                <p className="text-gray-600 mb-4">
                  Supported: PDF, Excel, Word, CSV, Images (JPG, PNG)
                </p>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.xlsx,.xls,.doc,.docx,.csv,.jpg,.jpeg,.png"
                  onChange={handleFileInput}
                  disabled={!consentGiven || uploading}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className={`inline-block px-8 py-3 rounded-xl font-bold transition-all ${
                    !consentGiven || uploading
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 cursor-pointer shadow-lg"
                  }`}
                >
                  {uploading ? "Processing..." : "Select Files"}
                </label>
              </div>

              {/* Benefits */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <div className="text-3xl mb-2">🎯</div>
                  <h4 className="font-bold text-gray-900 mb-1">Earn Credits</h4>
                  <p className="text-sm text-gray-700">
                    Get 10 credits per validated quote to use for premium features
                  </p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="text-3xl mb-2">📈</div>
                  <h4 className="font-bold text-gray-900 mb-1">Better Pricing</h4>
                  <p className="text-sm text-gray-700">
                    Help improve market pricing accuracy for everyone
                  </p>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                  <div className="text-3xl mb-2">🔒</div>
                  <h4 className="font-bold text-gray-900 mb-1">Fully Anonymous</h4>
                  <p className="text-sm text-gray-700">
                    All identifying information is automatically removed
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Review Tab */}
          {activeTab === "review" && (
            <div className="space-y-4">
              {uploadedFiles.filter((f) => f.status === "extracted").length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📭</div>
                  <p className="text-gray-600">
                    No files to review. Upload some pricing documents to get started!
                  </p>
                </div>
              ) : (
                uploadedFiles
                  .filter((f) => f.status === "extracted")
                  .map((file) => (
                    <div
                      key={file.id}
                      className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-purple-300 transition-all"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-bold text-lg text-gray-900">{file.fileName}</h3>
                          <p className="text-sm text-gray-600">
                            Uploaded: {file.uploadDate.toLocaleString()} •
                            <span
                              className={`ml-2 ${file.confidence > 0.85 ? "text-green-600" : "text-yellow-600"}`}
                            >
                              Confidence: {(file.confidence * 100).toFixed(0)}%
                            </span>
                          </p>
                        </div>
                        <button
                          onClick={() => setSelectedFile(file)}
                          className="px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-all"
                        >
                          Review & Validate
                        </button>
                      </div>

                      {/* Preview of extracted data */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Battery System</p>
                          <p className="font-semibold">
                            {file.data.batterySystem?.manufacturer} {file.data.batterySystem?.model}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Capacity</p>
                          <p className="font-semibold">
                            {file.data.batterySystem?.capacity_kwh} kWh
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Total Cost</p>
                          <p className="font-semibold">
                            ${file.data.summary?.total_cost?.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">$/kWh</p>
                          <p className="font-semibold">${file.data.summary?.cost_per_kwh}</p>
                        </div>
                      </div>
                    </div>
                  ))
              )}
            </div>
          )}

          {/* History Tab */}
          {activeTab === "history" && (
            <div className="space-y-4">
              {uploadedFiles.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📊</div>
                  <p className="text-gray-600">
                    No upload history yet. Start by uploading pricing documents!
                  </p>
                </div>
              ) : (
                <div>
                  <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-4 mb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Total Credits Earned</p>
                        <p className="text-3xl font-bold text-purple-600">
                          {uploadedFiles.filter((f) => f.status === "validated").length * 10}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Files Processed</p>
                        <p className="text-3xl font-bold text-blue-600">{uploadedFiles.length}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Validated</p>
                        <p className="text-3xl font-bold text-green-600">
                          {uploadedFiles.filter((f) => f.status === "validated").length}
                        </p>
                      </div>
                    </div>
                  </div>

                  {uploadedFiles.map((file) => (
                    <div
                      key={file.id}
                      className="bg-white border border-gray-200 rounded-lg p-4 mb-2"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-gray-900">{file.fileName}</p>
                          <p className="text-sm text-gray-600">
                            {file.uploadDate.toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-semibold ${
                              file.status === "validated"
                                ? "bg-green-100 text-green-700"
                                : file.status === "reviewed"
                                  ? "bg-blue-100 text-blue-700"
                                  : file.status === "extracted"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {file.status}
                          </span>
                          {file.status === "validated" && (
                            <span className="text-green-600 font-bold">+10 credits</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Detailed Review Modal */}
      {selectedFile && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">Review Extracted Data</h2>
                <p className="text-gray-600">{selectedFile.fileName}</p>
              </div>
              <button
                onClick={() => setSelectedFile(null)}
                className="text-gray-400 hover:text-gray-600 text-3xl"
              >
                ×
              </button>
            </div>

            {/* Editable Form */}
            <div className="space-y-6">
              {/* Battery System */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-bold text-lg mb-4">Battery System</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Manufacturer
                    </label>
                    <input
                      type="text"
                      defaultValue={selectedFile.data.batterySystem?.manufacturer}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Model</label>
                    <input
                      type="text"
                      defaultValue={selectedFile.data.batterySystem?.model}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Capacity (kWh)
                    </label>
                    <input
                      type="number"
                      defaultValue={selectedFile.data.batterySystem?.capacity_kwh}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Power (kW)
                    </label>
                    <input
                      type="number"
                      defaultValue={selectedFile.data.batterySystem?.power_kw}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Total Price ($)
                    </label>
                    <input
                      type="number"
                      defaultValue={selectedFile.data.batterySystem?.price_total}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Price per kWh ($)
                    </label>
                    <input
                      type="number"
                      defaultValue={selectedFile.data.batterySystem?.price_per_kwh}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-bold text-lg mb-4">Project Summary</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Location/State
                    </label>
                    <input
                      type="text"
                      defaultValue={selectedFile.data.project?.state}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Application
                    </label>
                    <input
                      type="text"
                      defaultValue={selectedFile.data.project?.application}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Total System Cost ($)
                    </label>
                    <input
                      type="number"
                      defaultValue={selectedFile.data.summary?.total_cost}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Warranty (years)
                    </label>
                    <input
                      type="number"
                      defaultValue={selectedFile.data.summary?.warranty_years}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={() => handleValidateData(selectedFile)}
                  className="flex-1 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-bold hover:from-green-700 hover:to-green-800 transition-all shadow-lg"
                >
                  ✓ Validate & Submit (+10 Credits)
                </button>
                <button
                  onClick={() => setSelectedFile(null)}
                  className="px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PricingDataCapture;
