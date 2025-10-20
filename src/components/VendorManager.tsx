import React, { useState, useEffect } from 'react';

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

interface VendorManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

const VendorManager: React.FC<VendorManagerProps> = ({ isOpen, onClose }) => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'vendors' | 'products'>('vendors');
  const [showAddVendor, setShowAddVendor] = useState(false);
  
  const [newVendor, setNewVendor] = useState({
    name: '',
    contact_email: '',
    contact_phone: '',
    address: '',
    website: '',
    specialty: '',
    notes: ''
  });

  const API_BASE = process.env.NODE_ENV === 'development' 
    ? `http://localhost:5001/api/db`
    : '/api/db';

  useEffect(() => {
    if (isOpen) {
      fetchVendors();
    }
  }, [isOpen]);

  const fetchVendors = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/vendors`);
      if (response.ok) {
        const data = await response.json();
        setVendors(data);
      }
    } catch (error) {
      console.error('Error fetching vendors:', error);
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
      console.error('Error fetching products:', error);
    }
  };

  const createVendor = async () => {
    if (!newVendor.name || !newVendor.contact_email) return;
    
    try {
      const response = await fetch(`${API_BASE}/vendors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newVendor)
      });
      
      if (response.ok) {
        setNewVendor({
          name: '', contact_email: '', contact_phone: '',
          address: '', website: '', specialty: '', notes: ''
        });
        setShowAddVendor(false);
        fetchVendors();
      }
    } catch (error) {
      console.error('Error creating vendor:', error);
    }
  };

  const handleVendorSelect = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setActiveTab('products');
    fetchVendorProducts(vendor.id);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-5/6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">Vendor & Product Manager</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('vendors')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'vendors'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Vendors ({vendors.length})
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'products'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Products ({products.length})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'vendors' && (
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
                          selectedVendor?.id === vendor.id ? 'bg-blue-50 border-blue-300' : ''
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
                          <a href={selectedVendor.website} target="_blank" rel="noopener noreferrer" 
                             className="text-blue-600 hover:underline">
                            {selectedVendor.website}
                          </a>
                        </div>
                      )}
                      {selectedVendor.specialty && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Specialty</label>
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

          {activeTab === 'products' && (
            <div className="h-full p-6">
              {selectedVendor ? (
                <div>
                  <h3 className="text-xl font-bold mb-4">
                    Products from {selectedVendor.name}
                  </h3>
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
                            <div className="text-xs text-blue-600 mt-1">
                              {product.availability}
                            </div>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={newVendor.contact_phone}
                    onChange={(e) => setNewVendor({ ...newVendor, contact_phone: e.target.value })}
                    className="w-full border rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Specialty
                  </label>
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
      </div>
    </div>
  );
};

export default VendorManager;