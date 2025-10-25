import React, { useState, useEffect } from 'react';

interface PricingPreset {
  id: string;
  name: string;
  description: string;
  isDefault: boolean;
  battery: {
    pricePerKWh: number;
    manufacturer?: string;
    model?: string;
    notes?: string;
  };
  inverter: {
    pricePerKW: number;
    manufacturer?: string;
    model?: string;
    notes?: string;
  };
  installation: {
    laborRate: number;
    hoursEstimate: number;
    materialsCost: number;
    notes?: string;
  };
  epc: {
    enabled: boolean;
    engineeringFee: number;
    engineeringFeeType: 'fixed' | 'percentage';
    procurementFee: number;
    procurementFeeType: 'fixed' | 'percentage';
    constructionFee: number;
    constructionFeeType: 'fixed' | 'percentage';
    projectManagementFee: number;
    projectManagementFeeType: 'fixed' | 'percentage';
    contractor?: string;
    notes?: string;
  };
  additionalCosts: Array<{
    id: string;
    name: string;
    amount: number;
    type: 'fixed' | 'percentage';
    notes?: string;
  }>;
  margins: {
    overallMargin: number;
    applyTo: 'total' | 'hardware' | 'labor';
  };
  createdAt: string;
  updatedAt: string;
}

interface PricingPresetsProps {
  onClose: () => void;
  onSelectPreset: (preset: PricingPreset) => void;
  userId: string;
}

const PricingPresets: React.FC<PricingPresetsProps> = ({ onClose, onSelectPreset, userId }) => {
  const [activeTab, setActiveTab] = useState<'presets' | 'create' | 'manage'>('presets');
  const [presets, setPresets] = useState<PricingPreset[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<PricingPreset | null>(null);
  const [editingPreset, setEditingPreset] = useState<Partial<PricingPreset> | null>(null);

  // Initialize empty preset for creation
  const getEmptyPreset = (): Partial<PricingPreset> => ({
    name: '',
    description: '',
    isDefault: false,
    battery: {
      pricePerKWh: 0,
      manufacturer: '',
      model: '',
      notes: '',
    },
    inverter: {
      pricePerKW: 0,
      manufacturer: '',
      model: '',
      notes: '',
    },
    installation: {
      laborRate: 0,
      hoursEstimate: 0,
      materialsCost: 0,
      notes: '',
    },
    epc: {
      enabled: false,
      engineeringFee: 0,
      engineeringFeeType: 'percentage',
      procurementFee: 0,
      procurementFeeType: 'percentage',
      constructionFee: 0,
      constructionFeeType: 'percentage',
      projectManagementFee: 0,
      projectManagementFeeType: 'percentage',
      contractor: '',
      notes: '',
    },
    additionalCosts: [],
    margins: {
      overallMargin: 0,
      applyTo: 'total',
    },
  });

  useEffect(() => {
    const storedPresets = localStorage.getItem(`pricing_presets_${userId}`);
    if (storedPresets) {
      setPresets(JSON.parse(storedPresets));
    } else {
      // Initialize with default presets
      const defaultPresets = getDefaultPresets();
      setPresets(defaultPresets);
      localStorage.setItem(`pricing_presets_${userId}`, JSON.stringify(defaultPresets));
    }
  }, [userId]);

  const getDefaultPresets = (): PricingPreset[] => {
    return [
      {
        id: 'default-market',
        name: 'Market Rate Pricing',
        description: 'Industry average pricing for BESS components',
        isDefault: true,
        battery: {
          pricePerKWh: 350,
          manufacturer: 'Various',
          model: 'Market Average',
          notes: 'Based on current market rates for LFP batteries',
        },
        inverter: {
          pricePerKW: 150,
          manufacturer: 'Various',
          model: 'Market Average',
          notes: 'Industry standard inverter pricing',
        },
        installation: {
          laborRate: 85,
          hoursEstimate: 40,
          materialsCost: 5000,
          notes: 'Typical commercial installation',
        },
        epc: {
          enabled: false,
          engineeringFee: 5,
          engineeringFeeType: 'percentage',
          procurementFee: 3,
          procurementFeeType: 'percentage',
          constructionFee: 10,
          constructionFeeType: 'percentage',
          projectManagementFee: 7,
          projectManagementFeeType: 'percentage',
        },
        additionalCosts: [],
        margins: {
          overallMargin: 15,
          applyTo: 'total',
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
  };

  const handleSavePreset = () => {
    if (!editingPreset?.name) {
      alert('Please enter a preset name');
      return;
    }

    const preset: PricingPreset = {
      id: editingPreset.id || `preset-${Date.now()}`,
      name: editingPreset.name,
      description: editingPreset.description || '',
      isDefault: editingPreset.isDefault || false,
      battery: editingPreset.battery!,
      inverter: editingPreset.inverter!,
      installation: editingPreset.installation!,
      epc: editingPreset.epc!,
      additionalCosts: editingPreset.additionalCosts || [],
      margins: editingPreset.margins!,
      createdAt: editingPreset.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    let updatedPresets;
    if (editingPreset.id) {
      // Update existing
      updatedPresets = presets.map(p => p.id === preset.id ? preset : p);
    } else {
      // Create new
      updatedPresets = [...presets, preset];
    }

    setPresets(updatedPresets);
    localStorage.setItem(`pricing_presets_${userId}`, JSON.stringify(updatedPresets));
    setEditingPreset(null);
    setActiveTab('presets');
    alert('Preset saved successfully!');
  };

  const handleDeletePreset = (presetId: string) => {
    if (confirm('Are you sure you want to delete this preset?')) {
      const updatedPresets = presets.filter(p => p.id !== presetId);
      setPresets(updatedPresets);
      localStorage.setItem(`pricing_presets_${userId}`, JSON.stringify(updatedPresets));
    }
  };

  const handleSetDefault = (presetId: string) => {
    const updatedPresets = presets.map(p => ({
      ...p,
      isDefault: p.id === presetId,
    }));
    setPresets(updatedPresets);
    localStorage.setItem(`pricing_presets_${userId}`, JSON.stringify(updatedPresets));
  };

  const addAdditionalCost = () => {
    if (!editingPreset) return;
    const newCost = {
      id: `cost-${Date.now()}`,
      name: '',
      amount: 0,
      type: 'fixed' as const,
      notes: '',
    };
    setEditingPreset({
      ...editingPreset,
      additionalCosts: [...(editingPreset.additionalCosts || []), newCost],
    });
  };

  const removeAdditionalCost = (costId: string) => {
    if (!editingPreset) return;
    setEditingPreset({
      ...editingPreset,
      additionalCosts: editingPreset.additionalCosts?.filter(c => c.id !== costId),
    });
  };

  const calculateEstimatedTotal = (preset: PricingPreset, kwh: number = 100, kw: number = 50) => {
    const batteryCost = kwh * preset.battery.pricePerKWh;
    const inverterCost = kw * preset.inverter.pricePerKW;
    const installationCost = (preset.installation.laborRate * preset.installation.hoursEstimate) + preset.installation.materialsCost;
    
    let total = batteryCost + inverterCost + installationCost;

    // Add additional costs
    preset.additionalCosts.forEach(cost => {
      if (cost.type === 'fixed') {
        total += cost.amount;
      } else {
        total += (total * cost.amount / 100);
      }
    });

    // Add EPC fees if enabled
    if (preset.epc.enabled) {
      const subtotal = total;
      if (preset.epc.engineeringFeeType === 'percentage') {
        total += (subtotal * preset.epc.engineeringFee / 100);
      } else {
        total += preset.epc.engineeringFee;
      }
      if (preset.epc.procurementFeeType === 'percentage') {
        total += (subtotal * preset.epc.procurementFee / 100);
      } else {
        total += preset.epc.procurementFee;
      }
      if (preset.epc.constructionFeeType === 'percentage') {
        total += (subtotal * preset.epc.constructionFee / 100);
      } else {
        total += preset.epc.constructionFee;
      }
      if (preset.epc.projectManagementFeeType === 'percentage') {
        total += (subtotal * preset.epc.projectManagementFee / 100);
      } else {
        total += preset.epc.projectManagementFee;
      }
    }

    // Apply margins
    if (preset.margins.overallMargin > 0) {
      total += (total * preset.margins.overallMargin / 100);
    }

    return total;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Pricing Presets</h2>
            <p className="text-sm text-gray-600 mt-1">
              Save and manage your pricing for batteries, installation, and EPC fees
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 px-6">
          <div className="flex space-x-6">
            {[
              { id: 'presets', label: '💰 My Presets' },
              { id: 'create', label: '✨ Create/Edit' },
              { id: 'manage', label: '⚙️ Manage' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Presets Tab */}
          {activeTab === 'presets' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {presets.map((preset) => (
                <div
                  key={preset.id}
                  className={`border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer ${
                    selectedPreset?.id === preset.id ? 'border-purple-600 bg-purple-50' : 'border-gray-200'
                  }`}
                  onClick={() => setSelectedPreset(preset)}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">{preset.name}</h3>
                      {preset.isDefault && (
                        <span className="inline-block px-2 py-1 text-xs bg-green-100 text-green-700 rounded mt-1">
                          ⭐ Default
                        </span>
                      )}
                    </div>
                    {preset.epc.enabled && (
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                        EPC Included
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-gray-600 mb-3">{preset.description}</p>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Battery:</span>
                      <span className="font-semibold">${preset.battery.pricePerKWh}/kWh</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Inverter:</span>
                      <span className="font-semibold">${preset.inverter.pricePerKW}/kW</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Labor Rate:</span>
                      <span className="font-semibold">${preset.installation.laborRate}/hr</span>
                    </div>
                    {preset.margins.overallMargin > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Margin:</span>
                        <span className="font-semibold text-green-600">{preset.margins.overallMargin}%</span>
                      </div>
                    )}
                  </div>

                  {selectedPreset?.id === preset.id && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="p-3 bg-purple-50 rounded">
                        <div className="text-xs text-purple-700 mb-1">Estimated Total (100kWh / 50kW)</div>
                        <div className="text-2xl font-bold text-purple-600">
                          ${calculateEstimatedTotal(preset).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Create/Edit Tab */}
          {activeTab === 'create' && (
            <div className="max-w-4xl mx-auto space-y-6">
              {!editingPreset ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">💰</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Create New Pricing Preset</h3>
                  <p className="text-gray-600 mb-6">
                    Save your pricing for quick quote generation
                  </p>
                  <button
                    onClick={() => setEditingPreset(getEmptyPreset())}
                    className="px-6 py-3 bg-purple-600 text-white rounded-md font-semibold hover:bg-purple-700"
                  >
                    Create New Preset
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Basic Info */}
                  <div className="border-b pb-4">
                    <h3 className="font-bold text-lg mb-4">Basic Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Preset Name *
                        </label>
                        <input
                          type="text"
                          value={editingPreset.name || ''}
                          onChange={(e) => setEditingPreset({ ...editingPreset, name: e.target.value })}
                          placeholder="e.g., My Company Standard Pricing"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Description
                        </label>
                        <input
                          type="text"
                          value={editingPreset.description || ''}
                          onChange={(e) => setEditingPreset({ ...editingPreset, description: e.target.value })}
                          placeholder="Brief description"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Battery Pricing */}
                  <div className="border-b pb-4">
                    <h3 className="font-bold text-lg mb-4">🔋 Battery Pricing</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Price per kWh *
                        </label>
                        <input
                          type="number"
                          value={editingPreset.battery?.pricePerKWh || ''}
                          onChange={(e) => setEditingPreset({
                            ...editingPreset,
                            battery: { ...editingPreset.battery!, pricePerKWh: parseFloat(e.target.value) || 0 }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Manufacturer
                        </label>
                        <input
                          type="text"
                          value={editingPreset.battery?.manufacturer || ''}
                          onChange={(e) => setEditingPreset({
                            ...editingPreset,
                            battery: { ...editingPreset.battery!, manufacturer: e.target.value }
                          })}
                          placeholder="e.g., Tesla, LG, CATL"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Model
                        </label>
                        <input
                          type="text"
                          value={editingPreset.battery?.model || ''}
                          onChange={(e) => setEditingPreset({
                            ...editingPreset,
                            battery: { ...editingPreset.battery!, model: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Notes
                        </label>
                        <input
                          type="text"
                          value={editingPreset.battery?.notes || ''}
                          onChange={(e) => setEditingPreset({
                            ...editingPreset,
                            battery: { ...editingPreset.battery!, notes: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Inverter Pricing */}
                  <div className="border-b pb-4">
                    <h3 className="font-bold text-lg mb-4">⚡ Inverter Pricing</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Price per kW *
                        </label>
                        <input
                          type="number"
                          value={editingPreset.inverter?.pricePerKW || ''}
                          onChange={(e) => setEditingPreset({
                            ...editingPreset,
                            inverter: { ...editingPreset.inverter!, pricePerKW: parseFloat(e.target.value) || 0 }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Manufacturer
                        </label>
                        <input
                          type="text"
                          value={editingPreset.inverter?.manufacturer || ''}
                          onChange={(e) => setEditingPreset({
                            ...editingPreset,
                            inverter: { ...editingPreset.inverter!, manufacturer: e.target.value }
                          })}
                          placeholder="e.g., SMA, Fronius, SolarEdge"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Installation */}
                  <div className="border-b pb-4">
                    <h3 className="font-bold text-lg mb-4">🔧 Installation</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Labor Rate ($/hr)
                        </label>
                        <input
                          type="number"
                          value={editingPreset.installation?.laborRate || ''}
                          onChange={(e) => setEditingPreset({
                            ...editingPreset,
                            installation: { ...editingPreset.installation!, laborRate: parseFloat(e.target.value) || 0 }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Hours Estimate
                        </label>
                        <input
                          type="number"
                          value={editingPreset.installation?.hoursEstimate || ''}
                          onChange={(e) => setEditingPreset({
                            ...editingPreset,
                            installation: { ...editingPreset.installation!, hoursEstimate: parseFloat(e.target.value) || 0 }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Materials Cost ($)
                        </label>
                        <input
                          type="number"
                          value={editingPreset.installation?.materialsCost || ''}
                          onChange={(e) => setEditingPreset({
                            ...editingPreset,
                            installation: { ...editingPreset.installation!, materialsCost: parseFloat(e.target.value) || 0 }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                  </div>

                  {/* EPC Fees */}
                  <div className="border-b pb-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-lg">🏗️ EPC Contractor Fees</h3>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={editingPreset.epc?.enabled || false}
                          onChange={(e) => setEditingPreset({
                            ...editingPreset,
                            epc: { ...editingPreset.epc!, enabled: e.target.checked }
                          })}
                          className="mr-2"
                        />
                        <span className="text-sm">Enable EPC Fees</span>
                      </label>
                    </div>

                    {editingPreset.epc?.enabled && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Contractor Name
                          </label>
                          <input
                            type="text"
                            value={editingPreset.epc?.contractor || ''}
                            onChange={(e) => setEditingPreset({
                              ...editingPreset,
                              epc: { ...editingPreset.epc!, contractor: e.target.value }
                            })}
                            placeholder="EPC Contractor name"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          {[
                            { key: 'engineeringFee', label: 'Engineering Fee' },
                            { key: 'procurementFee', label: 'Procurement Fee' },
                            { key: 'constructionFee', label: 'Construction Fee' },
                            { key: 'projectManagementFee', label: 'Project Management Fee' },
                          ].map((fee) => (
                            <div key={fee.key} className="flex gap-2">
                              <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  {fee.label}
                                </label>
                                <input
                                  type="number"
                                  value={(editingPreset.epc as any)?.[fee.key] || ''}
                                  onChange={(e) => setEditingPreset({
                                    ...editingPreset,
                                    epc: { ...editingPreset.epc!, [fee.key]: parseFloat(e.target.value) || 0 }
                                  })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                />
                              </div>
                              <div className="w-28">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Type
                                </label>
                                <select
                                  value={(editingPreset.epc as any)?.[`${fee.key}Type`] || 'percentage'}
                                  onChange={(e) => setEditingPreset({
                                    ...editingPreset,
                                    epc: { ...editingPreset.epc!, [`${fee.key}Type`]: e.target.value }
                                  })}
                                  className="w-full px-2 py-2 border border-gray-300 rounded-md"
                                >
                                  <option value="percentage">%</option>
                                  <option value="fixed">$</option>
                                </select>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Margins */}
                  <div className="border-b pb-4">
                    <h3 className="font-bold text-lg mb-4">📊 Margins</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Overall Margin (%)
                        </label>
                        <input
                          type="number"
                          value={editingPreset.margins?.overallMargin || ''}
                          onChange={(e) => setEditingPreset({
                            ...editingPreset,
                            margins: { ...editingPreset.margins!, overallMargin: parseFloat(e.target.value) || 0 }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Apply To
                        </label>
                        <select
                          value={editingPreset.margins?.applyTo || 'total'}
                          onChange={(e) => setEditingPreset({
                            ...editingPreset,
                            margins: { ...editingPreset.margins!, applyTo: e.target.value as any }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        >
                          <option value="total">Total Project Cost</option>
                          <option value="hardware">Hardware Only</option>
                          <option value="labor">Labor Only</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setEditingPreset(null)}
                      className="flex-1 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSavePreset}
                      className="flex-1 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                    >
                      Save Preset
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Manage Tab */}
          {activeTab === 'manage' && (
            <div className="space-y-3">
              {presets.map((preset) => (
                <div key={preset.id} className="border border-gray-200 rounded-lg p-4 flex justify-between items-center">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{preset.name}</h3>
                      {preset.isDefault && (
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">
                          Default
                        </span>
                      )}
                      {preset.epc.enabled && (
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                          EPC
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{preset.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Battery: ${preset.battery.pricePerKWh}/kWh • Inverter: ${preset.inverter.pricePerKW}/kW • 
                      Margin: {preset.margins.overallMargin}%
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingPreset(preset);
                        setActiveTab('create');
                      }}
                      className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                    >
                      Edit
                    </button>
                    {!preset.isDefault && (
                      <button
                        onClick={() => handleSetDefault(preset.id)}
                        className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                      >
                        Set Default
                      </button>
                    )}
                    <button
                      onClick={() => handleDeletePreset(preset.id)}
                      className="px-3 py-1 text-sm text-red-600 border border-red-300 rounded hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
          >
            Close
          </button>
          {activeTab === 'presets' && selectedPreset && (
            <button
              onClick={() => {
                onSelectPreset(selectedPreset);
                onClose();
              }}
              className="px-6 py-2 bg-purple-600 text-white rounded-md font-semibold hover:bg-purple-700"
            >
              Use This Preset
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PricingPresets;
