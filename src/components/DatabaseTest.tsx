import React, { useState, useEffect } from 'react';

interface DatabaseTestProps {
  isOpen: boolean;
  onClose: () => void;
}

const DatabaseTest: React.FC<DatabaseTestProps> = ({ isOpen, onClose }) => {
  const [stats, setStats] = useState<any>(null);
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_BASE = '/api/db';

  const testAPI = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Test database stats
      const statsResponse = await fetch(`${API_BASE}/stats`);
      if (!statsResponse.ok) {
        throw new Error(`Stats API failed: ${statsResponse.status}`);
      }
      const statsData = await statsResponse.json();
      setStats(statsData);

      // Test vendors API
      const vendorsResponse = await fetch(`${API_BASE}/vendors`);
      if (!vendorsResponse.ok) {
        throw new Error(`Vendors API failed: ${vendorsResponse.status}`);
      }
      const vendorsData = await vendorsResponse.json();
      setVendors(vendorsData);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const addTestVendor = async () => {
    try {
      const testVendor = {
        name: "Test Energy Solutions",
        contact_email: "contact@testenergy.com",
        contact_phone: "+1-555-0123",
        specialty: "Battery Systems",
        website: "https://testenergy.com",
        notes: "Test vendor created from database test"
      };

      const response = await fetch(`${API_BASE}/vendors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testVendor)
      });

      if (!response.ok) {
        throw new Error(`Create vendor failed: ${response.status}`);
      }

      // Refresh data
      testAPI();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create vendor');
    }
  };

  useEffect(() => {
    if (isOpen) {
      testAPI();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-4/5 flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">Database Test</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Controls */}
            <div className="flex gap-3">
              <button
                onClick={testAPI}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300"
              >
                {loading ? 'Testing...' : 'Test Database API'}
              </button>
              <button
                onClick={addTestVendor}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-300"
              >
                Add Test Vendor
              </button>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded">
                <strong>Error:</strong> {error}
              </div>
            )}

            {/* API Connection Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Database Stats */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3">Database Stats</h3>
                {stats ? (
                  <div className="space-y-2">
                    <div>Vendors: <span className="font-bold">{stats.vendors}</span></div>
                    <div>Products: <span className="font-bold">{stats.products}</span></div>
                    <div>Materials: <span className="font-bold">{stats.materials}</span></div>
                    <div>Configurations: <span className="font-bold">{stats.configurations}</span></div>
                    <div>Categories: <span className="font-bold">{stats.categories}</span></div>
                  </div>
                ) : (
                  <div className="text-gray-500">No stats loaded</div>
                )}
              </div>

              {/* Vendors List */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3">Vendors ({vendors.length})</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {vendors.length > 0 ? (
                    vendors.map((vendor, index) => (
                      <div key={vendor.id || index} className="bg-white p-3 rounded border">
                        <div className="font-semibold">{vendor.name}</div>
                        <div className="text-sm text-gray-600">{vendor.contact_email}</div>
                        {vendor.specialty && (
                          <div className="text-xs text-blue-600">{vendor.specialty}</div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-gray-500">No vendors found</div>
                  )}
                </div>
              </div>
            </div>

            {/* API Endpoint Tests */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-3">API Endpoint Information</h3>
              <div className="space-y-2 text-sm">
                <div><strong>Base URL:</strong> {API_BASE}</div>
                <div><strong>Available Endpoints:</strong></div>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>GET /stats - Database statistics</li>
                  <li>GET /vendors - List all vendors</li>
                  <li>POST /vendors - Create new vendor</li>
                  <li>GET /vendors/:id - Get single vendor</li>
                  <li>GET /vendors/:id/products - Get vendor products</li>
                  <li>GET /products/search?q=query - Search products</li>
                  <li>GET /bess-configs - List BESS configurations</li>
                  <li>GET /materials - Get materials library</li>
                </ul>
              </div>
            </div>

            {/* Raw Data Display */}
            {(stats || vendors.length > 0) && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3">Raw Data</h3>
                <pre className="text-xs bg-white p-3 rounded border overflow-auto max-h-64">
                  {JSON.stringify({ stats, vendors }, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatabaseTest;