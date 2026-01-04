import React, { useState, useEffect } from "react";

interface Vendor {
  id: string;
  name: string;
  contact_email: string;
  contact_phone?: string;
  address?: string;
  website?: string;
  specialty?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

interface Product {
  id: string;
  vendor_id: string;
  name: string;
  category: string;
  model_number?: string;
  specifications?: any;
  price?: number;
  unit?: string;
  availability?: string;
  created_at?: string;
  updated_at?: string;
}

interface VendorQuote {
  id: string;
  vendor_id: string;
  vendor_name?: string;
  file_name: string;
  file_url?: string;
  upload_date: string;
  pricing_data?: {
    battery_kwh?: number;
    pcs_kw?: number;
    bos_percent?: number;
    epc_percent?: number;
    notes?: string;
  };
}

interface VendorManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

const VendorManager: React.FC<VendorManagerProps> = ({ isOpen, onClose }) => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [vendorQuotes, setVendorQuotes] = useState<VendorQuote[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"vendors" | "products" | "quotes">("quotes");
  const [showAddVendor, setShowAddVendor] = useState(false);
  const [showUploadQuote, setShowUploadQuote] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [quotePricing, setQuotePricing] = useState({
    battery_kwh: "",
    pcs_kw: "",
    bos_percent: "",
    epc_percent: "",
    notes: "",
  });

  const [newVendor, setNewVendor] = useState({
    name: "",
    contact_email: "",
    contact_phone: "",
    address: "",
    website: "",
    specialty: "",
    notes: "",
  });

  // Disabled localhost API since server is down - using local storage fallback
  const API_BASE = "/api/db"; // Always use production API path or fallback to local storage

  useEffect(() => {
    if (isOpen) {
      fetchVendors();
      fetchVendorQuotes();
    }
  }, [isOpen]);

  const fetchVendorQuotes = async () => {
    // For now, use local storage
    const stored = localStorage.getItem("vendor_quotes");
    if (stored) {
      setVendorQuotes(JSON.parse(stored));
    }
  };

  const fetchVendors = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/vendors`);
      if (response.ok) {
        const data = await response.json();
        setVendors(data);
      }
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  const fetchVendorProducts = async (vendorId: string) => {
    try {
      const response = await fetch(`${API_BASE}/vendors/${vendorId}/products`);
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
      console.error('Failed to fetch vendor products:', error);
    }
  };

  const createVendor = async () => {
    if (!newVendor.name || !newVendor.contact_email) return;

    try {
      const response = await fetch(`${API_BASE}/vendors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newVendor),
      });

      if (response.ok) {
        setNewVendor({
          name: "",
          contact_email: "",
          contact_phone: "",
          address: "",
          website: "",
          specialty: "",
          notes: "",
        });
        setShowAddVendor(false);
        fetchVendors();
      }
    } catch (error) {
      console.error('Failed to create vendor:', error);
    }
  };

  const handleVendorSelect = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setActiveTab("products");
    fetchVendorProducts(vendor.id);
  };

  const handleUploadQuote = () => {
    if (!uploadFile || !selectedVendor) return;

    const newQuote: VendorQuote = {
      id: Date.now().toString(),
      vendor_id: selectedVendor.id,
      vendor_name: selectedVendor.name,
      file_name: uploadFile.name,
      upload_date: new Date().toISOString(),
      pricing_data: {
        battery_kwh: quotePricing.battery_kwh ? parseFloat(quotePricing.battery_kwh) : undefined,
        pcs_kw: quotePricing.pcs_kw ? parseFloat(quotePricing.pcs_kw) : undefined,
        bos_percent: quotePricing.bos_percent
          ? parseFloat(quotePricing.bos_percent) / 100
          : undefined,
        epc_percent: quotePricing.epc_percent
          ? parseFloat(quotePricing.epc_percent) / 100
          : undefined,
        notes: quotePricing.notes,
      },
    };

    const updated = [...vendorQuotes, newQuote];
    setVendorQuotes(updated);
    localStorage.setItem("vendor_quotes", JSON.stringify(updated));

    // Reset form
    setUploadFile(null);
    setQuotePricing({ battery_kwh: "", pcs_kw: "", bos_percent: "", epc_percent: "", notes: "" });
    setShowUploadQuote(false);
  };

  const deleteQuote = (quoteId: string) => {
    const updated = vendorQuotes.filter((q) => q.id !== quoteId);
    setVendorQuotes(updated);
    localStorage.setItem("vendor_quotes", JSON.stringify(updated));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-5/6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">Vendor & Product Manager</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab("quotes")}
            className={`px-6 py-3 font-medium ${
              activeTab === "quotes"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            📋 Vendor Quotes ({vendorQuotes.length})
          </button>
          <button
            onClick={() => setActiveTab("vendors")}
            className={`px-6 py-3 font-medium ${
              activeTab === "vendors"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            🏢 Vendors ({vendors.length})
          </button>
          <button
            onClick={() => setActiveTab("products")}
            className={`px-6 py-3 font-medium ${
              activeTab === "products"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            📦 Products ({products.length})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === "quotes" && (
            <div className="h-full p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">Uploaded Vendor Quotes</h3>
                <button
                  onClick={() => {
                    if (vendors.length === 0) {
                      alert("Please add vendors first in the Vendors tab");
                      return;
                    }
                    setShowUploadQuote(true);
                  }}
                  className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 flex items-center gap-2"
                >
                  📤 Upload Quote
                </button>
              </div>

              {vendorQuotes.length === 0 ? (
                <div className="text-center text-gray-500 mt-12">
                  <div className="text-6xl mb-4">📋</div>
                  <p className="text-lg">No vendor quotes uploaded yet</p>
                  <p className="text-sm mt-2">
                    Upload vendor quotes to compare pricing with Merlin's estimates
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {vendorQuotes.map((quote) => (
                    <div
                      key={quote.id}
                      className="border rounded-lg p-4 hover:shadow-lg transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-bold text-lg">
                            {quote.vendor_name || "Unknown Vendor"}
                          </h4>
                          <p className="text-sm text-gray-600">{quote.file_name}</p>
                          <p className="text-xs text-gray-400">
                            {new Date(quote.upload_date).toLocaleDateString()}
                          </p>
                        </div>
                        <button
                          onClick={() => deleteQuote(quote.id)}
                          className="text-red-500 hover:text-red-700 text-xl"
                          title="Delete quote"
                        >
                          🗑️
                        </button>
                      </div>

                      {quote.pricing_data && (
                        <div className="bg-gray-50 p-3 rounded space-y-2">
                          <div className="text-sm font-medium text-gray-700">Pricing Data:</div>
                          {quote.pricing_data.battery_kwh && (
                            <div className="flex justify-between text-sm">
                              <span>Battery:</span>
                              <span className="font-bold">
                                ${quote.pricing_data.battery_kwh}/kWh
                              </span>
                            </div>
                          )}
                          {quote.pricing_data.pcs_kw && (
                            <div className="flex justify-between text-sm">
                              <span>PCS:</span>
                              <span className="font-bold">${quote.pricing_data.pcs_kw}/kW</span>
                            </div>
                          )}
                          {quote.pricing_data.bos_percent !== undefined && (
                            <div className="flex justify-between text-sm">
                              <span>BOS:</span>
                              <span className="font-bold">
                                {(quote.pricing_data.bos_percent * 100).toFixed(1)}%
                              </span>
                            </div>
                          )}
                          {quote.pricing_data.epc_percent !== undefined && (
                            <div className="flex justify-between text-sm">
                              <span>EPC:</span>
                              <span className="font-bold">
                                {(quote.pricing_data.epc_percent * 100).toFixed(1)}%
                              </span>
                            </div>
                          )}
                          {quote.pricing_data.notes && (
                            <div className="text-xs text-gray-600 mt-2 italic">
                              {quote.pricing_data.notes}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "vendors" && (
            <div className="h-full flex">
              {/* Vendor List */}
              <div className="w-1/3 border-r h-full overflow-y-auto">
                <div className="p-4 border-b">
                  <button
                    onClick={() => setShowAddVendor(true)}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
                  >
                    Add New Vendor
                  </button>
                </div>

                {isLoading ? (
                  <div className="p-4 text-center">Loading vendors...</div>
                ) : (
                  <div className="space-y-2 p-4">
                    {vendors.map((vendor) => (
                      <div
                        key={vendor.id}
                        onClick={() => handleVendorSelect(vendor)}
                        className={`p-3 rounded border cursor-pointer hover:bg-gray-50 ${
                          selectedVendor?.id === vendor.id ? "bg-blue-50 border-blue-300" : ""
                        }`}
                      >
                        <div className="font-semibold">{vendor.name}</div>
                        <div className="text-sm text-gray-600">{vendor.contact_email}</div>
                        {vendor.specialty && (
                          <div className="text-xs text-blue-600 mt-1">{vendor.specialty}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Vendor Details */}
              <div className="flex-1 p-6">
                {selectedVendor ? (
                  <div className="space-y-4">
                    <h3 className="text-xl font-bold">{selectedVendor.name}</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <div className="text-gray-900">{selectedVendor.contact_email}</div>
                      </div>
                      {selectedVendor.contact_phone && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Phone</label>
                          <div className="text-gray-900">{selectedVendor.contact_phone}</div>
                        </div>
                      )}
                      {selectedVendor.website && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Website</label>
                          <a
                            href={selectedVendor.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {selectedVendor.website}
                          </a>
                        </div>
                      )}
                      {selectedVendor.specialty && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Specialty
                          </label>
                          <div className="text-gray-900">{selectedVendor.specialty}</div>
                        </div>
                      )}
                    </div>
                    {selectedVendor.address && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Address</label>
                        <div className="text-gray-900">{selectedVendor.address}</div>
                      </div>
                    )}
                    {selectedVendor.notes && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Notes</label>
                        <div className="text-gray-900">{selectedVendor.notes}</div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 mt-8">
                    Select a vendor to view details
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "products" && (
            <div className="h-full p-6">
              {selectedVendor ? (
                <div>
                  <h3 className="text-xl font-bold mb-4">Products from {selectedVendor.name}</h3>
                  {products.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {products.map((product) => (
                        <div key={product.id} className="border rounded-lg p-4">
                          <h4 className="font-semibold">{product.name}</h4>
                          <div className="text-sm text-gray-600 mb-2">{product.category}</div>
                          {product.model_number && (
                            <div className="text-sm">Model: {product.model_number}</div>
                          )}
                          {product.price && (
                            <div className="text-lg font-bold text-green-600 mt-2">
                              ${product.price.toLocaleString()}
                              {product.unit && ` / ${product.unit}`}
                            </div>
                          )}
                          {product.availability && (
                            <div className="text-xs text-blue-600 mt-1">{product.availability}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 mt-8">
                      No products found for this vendor
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-gray-500 mt-8">
                  Select a vendor to view their products
                </div>
              )}
            </div>
          )}
        </div>

        {/* Add Vendor Modal */}
        {showAddVendor && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-bold mb-4">Add New Vendor</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    value={newVendor.name}
                    onChange={(e) => setNewVendor({ ...newVendor, name: e.target.value })}
                    className="w-full border rounded-md px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Email *
                  </label>
                  <input
                    type="email"
                    value={newVendor.contact_email}
                    onChange={(e) => setNewVendor({ ...newVendor, contact_email: e.target.value })}
                    className="w-full border rounded-md px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={newVendor.contact_phone}
                    onChange={(e) => setNewVendor({ ...newVendor, contact_phone: e.target.value })}
                    className="w-full border rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Specialty</label>
                  <input
                    type="text"
                    value={newVendor.specialty}
                    onChange={(e) => setNewVendor({ ...newVendor, specialty: e.target.value })}
                    className="w-full border rounded-md px-3 py-2"
                    placeholder="e.g., Battery Systems, Solar Panels"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowAddVendor(false)}
                  className="px-4 py-2 border rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={createVendor}
                  disabled={!newVendor.name || !newVendor.contact_email}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300"
                >
                  Add Vendor
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Upload Quote Modal */}
        {showUploadQuote && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center overflow-y-auto">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl m-4">
              <h3 className="text-lg font-bold mb-4">Upload Vendor Quote</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Vendor *
                  </label>
                  <select
                    value={selectedVendor?.id || ""}
                    onChange={(e) => {
                      const vendor = vendors.find((v) => v.id === e.target.value);
                      setSelectedVendor(vendor || null);
                    }}
                    className="w-full border rounded-md px-3 py-2"
                    required
                  >
                    <option value="">Choose a vendor...</option>
                    {vendors.map((vendor) => (
                      <option key={vendor.id} value={vendor.id}>
                        {vendor.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quote File (PDF/Excel) *
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.xlsx,.xls,.csv"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    className="w-full border rounded-md px-3 py-2"
                  />
                  {uploadFile && (
                    <p className="text-sm text-green-600 mt-1">📄 {uploadFile.name}</p>
                  )}
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-blue-900 mb-3">
                    Extract Pricing Data (optional):
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-700 mb-1">Battery ($/kWh)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={quotePricing.battery_kwh}
                        onChange={(e) =>
                          setQuotePricing({ ...quotePricing, battery_kwh: e.target.value })
                        }
                        className="w-full border rounded-md px-2 py-1 text-sm"
                        placeholder="250.00"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-700 mb-1">PCS ($/kW)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={quotePricing.pcs_kw}
                        onChange={(e) =>
                          setQuotePricing({ ...quotePricing, pcs_kw: e.target.value })
                        }
                        className="w-full border rounded-md px-2 py-1 text-sm"
                        placeholder="200.00"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-700 mb-1">BOS (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={quotePricing.bos_percent}
                        onChange={(e) =>
                          setQuotePricing({ ...quotePricing, bos_percent: e.target.value })
                        }
                        className="w-full border rounded-md px-2 py-1 text-sm"
                        placeholder="15"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-700 mb-1">EPC (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={quotePricing.epc_percent}
                        onChange={(e) =>
                          setQuotePricing({ ...quotePricing, epc_percent: e.target.value })
                        }
                        className="w-full border rounded-md px-2 py-1 text-sm"
                        placeholder="10"
                      />
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className="block text-xs text-gray-700 mb-1">Notes</label>
                    <textarea
                      value={quotePricing.notes}
                      onChange={(e) => setQuotePricing({ ...quotePricing, notes: e.target.value })}
                      className="w-full border rounded-md px-2 py-1 text-sm"
                      rows={2}
                      placeholder="Additional notes about this quote..."
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowUploadQuote(false);
                    setUploadFile(null);
                    setQuotePricing({
                      battery_kwh: "",
                      pcs_kw: "",
                      bos_percent: "",
                      epc_percent: "",
                      notes: "",
                    });
                  }}
                  className="px-4 py-2 border rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUploadQuote}
                  disabled={!uploadFile || !selectedVendor}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300"
                >
                  Upload Quote
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorManager;
