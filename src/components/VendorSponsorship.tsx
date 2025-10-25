import { useState, useEffect } from 'react';
import { X, DollarSign, TrendingUp, Users, Award, CheckCircle, AlertCircle, Package, Zap } from 'lucide-react';

interface VendorSponsorshipProps {
  onClose: () => void;
}

interface PricingSubmission {
  id: string;
  vendorId: string;
  vendorName: string;
  powerRangeMin: number; // kW
  powerRangeMax: number; // kW
  pricePerKWh: number;
  pricePerKW: number;
  manufacturer: string;
  model: string;
  deliveryWeeks: number;
  warrantyYears: number;
  features: string[];
  regions: string[]; // States/regions they serve
  validUntil: Date;
  status: 'active' | 'pending' | 'expired';
  leadsReceived: number;
  leadsConverted: number;
  conversionRate: number;
}

interface MatchedLead {
  id: string;
  projectName: string;
  powerKW: number;
  energyKWh: number;
  location: string;
  projectType: string;
  matchScore: number;
  customerTier: string;
  estimatedValue: number;
  matchedVendors: string[];
  status: 'pending' | 'sent' | 'accepted' | 'rejected';
}

export default function VendorSponsorship({ onClose }: VendorSponsorshipProps) {
  const [activeTab, setActiveTab] = useState<'submit' | 'leads' | 'analytics'>('submit');
  const [isVendor, setIsVendor] = useState(false);
  
  // Submission form state
  const [powerMin, setPowerMin] = useState<number>(100);
  const [powerMax, setPowerMax] = useState<number>(1000);
  const [priceKWh, setPriceKWh] = useState<number>(350);
  const [priceKW, setPriceKW] = useState<number>(450);
  const [manufacturer, setManufacturer] = useState<string>('');
  const [model, setModel] = useState<string>('');
  const [deliveryWeeks, setDeliveryWeeks] = useState<number>(12);
  const [warrantyYears, setWarrantyYears] = useState<number>(10);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [features, setFeatures] = useState<string>('');
  
  // Mock data for vendor submissions
  const [submissions, setSubmissions] = useState<PricingSubmission[]>([
    {
      id: 'v1',
      vendorId: 'vendor123',
      vendorName: 'Your Company',
      powerRangeMin: 500,
      powerRangeMax: 2000,
      pricePerKWh: 325,
      pricePerKW: 420,
      manufacturer: 'Tesla',
      model: 'Megapack 2XL',
      deliveryWeeks: 16,
      warrantyYears: 10,
      features: ['AC Coupled', 'UL 9540A Certified', '24/7 Monitoring'],
      regions: ['California', 'Texas', 'Arizona'],
      validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      status: 'active',
      leadsReceived: 12,
      leadsConverted: 3,
      conversionRate: 25
    }
  ]);
  
  // Mock leads data
  const [leads, setLeads] = useState<MatchedLead[]>([
    {
      id: 'lead1',
      projectName: 'Solar Farm BESS Project',
      powerKW: 800,
      energyKWh: 3200,
      location: 'Texas',
      projectType: 'Solar + Storage',
      matchScore: 95,
      customerTier: 'Professional',
      estimatedValue: 1200000,
      matchedVendors: ['vendor123'],
      status: 'pending'
    },
    {
      id: 'lead2',
      projectName: 'Industrial Microgrid',
      powerKW: 1500,
      energyKWh: 6000,
      location: 'California',
      projectType: 'Commercial',
      matchScore: 88,
      customerTier: 'Enterprise Pro',
      estimatedValue: 2400000,
      matchedVendors: ['vendor123', 'vendor456'],
      status: 'sent'
    }
  ]);

  const availableRegions = [
    'California', 'Texas', 'Arizona', 'Nevada', 'Florida',
    'New York', 'Massachusetts', 'Illinois', 'Colorado', 'Washington'
  ];

  const handleSubmitPricing = () => {
    const newSubmission: PricingSubmission = {
      id: `v${submissions.length + 1}`,
      vendorId: 'vendor123',
      vendorName: 'Your Company',
      powerRangeMin: powerMin,
      powerRangeMax: powerMax,
      pricePerKWh: priceKWh,
      pricePerKW: priceKW,
      manufacturer,
      model,
      deliveryWeeks,
      warrantyYears,
      features: features.split(',').map(f => f.trim()),
      regions: selectedRegions,
      validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      status: 'active',
      leadsReceived: 0,
      leadsConverted: 0,
      conversionRate: 0
    };
    
    setSubmissions([...submissions, newSubmission]);
    alert('Pricing submitted successfully! You\'ll receive matched leads via email.');
  };

  const handleRegionToggle = (region: string) => {
    if (selectedRegions.includes(region)) {
      setSelectedRegions(selectedRegions.filter(r => r !== region));
    } else {
      setSelectedRegions([...selectedRegions, region]);
    }
  };

  const handleAcceptLead = (leadId: string) => {
    setLeads(leads.map(lead => 
      lead.id === leadId ? { ...lead, status: 'accepted' } : lead
    ));
    alert('Lead accepted! Customer details sent to your email. Sales fee of 8% will be charged upon project close.');
  };

  const calculateEstimatedLeads = () => {
    // Simple estimation based on power range and regions
    const rangeSize = powerMax - powerMin;
    const baseLeads = Math.floor(rangeSize / 200);
    const regionMultiplier = selectedRegions.length * 0.5;
    return Math.max(1, Math.floor(baseLeads * regionMultiplier));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full border-4 border-green-300 max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 bg-gradient-to-r from-green-600 to-emerald-600 text-white flex-shrink-0">
          <div>
            <h2 className="text-3xl font-bold flex items-center gap-3">
              <Package size={32} />
              Vendor Marketplace
            </h2>
            <p className="text-green-100 mt-1">Submit pricing • Win qualified leads • Grow your business</p>
          </div>
          <button 
            onClick={onClose} 
            className="text-green-200 hover:text-white transition-colors p-2 rounded-lg hover:bg-green-700"
          >
            <X size={28} />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 bg-gray-50 flex-shrink-0">
          <div className="flex">
            <button
              onClick={() => setActiveTab('submit')}
              className={`flex items-center gap-2 px-6 py-3 font-bold transition-all ${
                activeTab === 'submit'
                  ? 'border-b-4 border-green-600 text-green-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <DollarSign size={20} />
              Submit Pricing
            </button>
            <button
              onClick={() => setActiveTab('leads')}
              className={`flex items-center gap-2 px-6 py-3 font-bold transition-all ${
                activeTab === 'leads'
                  ? 'border-b-4 border-green-600 text-green-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Users size={20} />
              Matched Leads
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {leads.filter(l => l.status === 'pending').length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-2 px-6 py-3 font-bold transition-all ${
                activeTab === 'analytics'
                  ? 'border-b-4 border-green-600 text-green-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <TrendingUp size={20} />
              Analytics
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Submit Pricing Tab */}
          {activeTab === 'submit' && (
            <div className="space-y-6">
              {/* How It Works */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200">
                <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Award size={24} className="text-green-600" />
                  How Vendor Sponsorship Works
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div className="bg-white rounded-lg p-4 border border-green-200">
                    <div className="text-3xl mb-2">1️⃣</div>
                    <div className="font-bold text-gray-900 mb-1">Submit Pricing</div>
                    <div className="text-sm text-gray-600">Enter your competitive pricing for specific power ranges and regions</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-green-200">
                    <div className="text-3xl mb-2">2️⃣</div>
                    <div className="font-bold text-gray-900 mb-1">Get Matched</div>
                    <div className="text-sm text-gray-600">Our AI matches your pricing with active customer quotes</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-green-200">
                    <div className="text-3xl mb-2">3️⃣</div>
                    <div className="font-bold text-gray-900 mb-1">Close Deals</div>
                    <div className="text-sm text-gray-600">Receive qualified leads - pay 8% fee only when you close</div>
                  </div>
                </div>
              </div>

              {/* Pricing Form */}
              <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Submit Your Pricing</h3>
                
                {/* Power Range */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Min Power (kW)</label>
                    <input
                      type="number"
                      value={powerMin}
                      onChange={(e) => setPowerMin(Number(e.target.value))}
                      className="w-full border-2 border-gray-300 rounded-lg px-4 py-2"
                      placeholder="100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Max Power (kW)</label>
                    <input
                      type="number"
                      value={powerMax}
                      onChange={(e) => setPowerMax(Number(e.target.value))}
                      className="w-full border-2 border-gray-300 rounded-lg px-4 py-2"
                      placeholder="1000"
                    />
                  </div>
                </div>

                {/* Pricing */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Price per kWh ($)</label>
                    <input
                      type="number"
                      value={priceKWh}
                      onChange={(e) => setPriceKWh(Number(e.target.value))}
                      className="w-full border-2 border-gray-300 rounded-lg px-4 py-2"
                      placeholder="350"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Price per kW ($)</label>
                    <input
                      type="number"
                      value={priceKW}
                      onChange={(e) => setPriceKW(Number(e.target.value))}
                      className="w-full border-2 border-gray-300 rounded-lg px-4 py-2"
                      placeholder="450"
                    />
                  </div>
                </div>

                {/* Product Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Manufacturer</label>
                    <input
                      type="text"
                      value={manufacturer}
                      onChange={(e) => setManufacturer(e.target.value)}
                      className="w-full border-2 border-gray-300 rounded-lg px-4 py-2"
                      placeholder="Tesla, BYD, CATL, etc."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Model/Product</label>
                    <input
                      type="text"
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      className="w-full border-2 border-gray-300 rounded-lg px-4 py-2"
                      placeholder="Megapack, Cube, etc."
                    />
                  </div>
                </div>

                {/* Delivery & Warranty */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Delivery (weeks)</label>
                    <input
                      type="number"
                      value={deliveryWeeks}
                      onChange={(e) => setDeliveryWeeks(Number(e.target.value))}
                      className="w-full border-2 border-gray-300 rounded-lg px-4 py-2"
                      placeholder="12"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Warranty (years)</label>
                    <input
                      type="number"
                      value={warrantyYears}
                      onChange={(e) => setWarrantyYears(Number(e.target.value))}
                      className="w-full border-2 border-gray-300 rounded-lg px-4 py-2"
                      placeholder="10"
                    />
                  </div>
                </div>

                {/* Regions */}
                <div className="mb-4">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Service Regions</label>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    {availableRegions.map(region => (
                      <button
                        key={region}
                        onClick={() => handleRegionToggle(region)}
                        className={`px-3 py-2 rounded-lg border-2 text-sm font-bold transition-all ${
                          selectedRegions.includes(region)
                            ? 'bg-green-600 text-white border-green-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-green-400'
                        }`}
                      >
                        {region}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Features */}
                <div className="mb-4">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Key Features (comma-separated)</label>
                  <textarea
                    value={features}
                    onChange={(e) => setFeatures(e.target.value)}
                    className="w-full border-2 border-gray-300 rounded-lg px-4 py-2"
                    rows={3}
                    placeholder="AC Coupled, UL 9540A Certified, 24/7 Monitoring"
                  />
                </div>

                {/* Estimated Leads */}
                <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-gray-900">Estimated Monthly Leads</div>
                      <div className="text-sm text-gray-600">Based on your power range and regions</div>
                    </div>
                    <div className="text-4xl font-bold text-green-600">
                      ~{calculateEstimatedLeads()}
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleSubmitPricing}
                  disabled={!manufacturer || !model || selectedRegions.length === 0}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircle size={24} />
                  Submit Pricing & Start Receiving Leads
                </button>
              </div>

              {/* Active Submissions */}
              {submissions.length > 0 && (
                <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Your Active Submissions</h3>
                  <div className="space-y-3">
                    {submissions.map(sub => (
                      <div key={sub.id} className="border-2 border-green-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="font-bold text-gray-900">{sub.manufacturer} {sub.model}</div>
                            <div className="text-sm text-gray-600">{sub.powerRangeMin} - {sub.powerRangeMax} kW</div>
                          </div>
                          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold">
                            {sub.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                          <div>
                            <span className="text-gray-600">$/kWh:</span>
                            <span className="font-bold ml-1">${sub.pricePerKWh}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">$/kW:</span>
                            <span className="font-bold ml-1">${sub.pricePerKW}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Leads:</span>
                            <span className="font-bold ml-1">{sub.leadsReceived}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Converted:</span>
                            <span className="font-bold ml-1">{sub.leadsConverted}</span>
                          </div>
                        </div>
                        <div className="mt-2 text-xs text-gray-500">
                          Regions: {sub.regions.join(', ')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Leads Tab */}
          {activeTab === 'leads' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Matched Project Leads</h3>
                <p className="text-gray-600">
                  These projects match your pricing submissions. Accept leads to receive full customer details.
                </p>
              </div>

              {leads.map(lead => (
                <div key={lead.id} className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-green-300 transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-lg font-bold text-gray-900">{lead.projectName}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-bold">
                          {lead.projectType}
                        </span>
                        <span className="text-sm bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-bold">
                          {lead.customerTier}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">{lead.matchScore}%</div>
                      <div className="text-xs text-gray-600">Match Score</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <div className="text-sm text-gray-600">Power</div>
                      <div className="font-bold text-gray-900">{lead.powerKW} kW</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Energy</div>
                      <div className="font-bold text-gray-900">{lead.energyKWh} kWh</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Location</div>
                      <div className="font-bold text-gray-900">{lead.location}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Est. Value</div>
                      <div className="font-bold text-green-600">${(lead.estimatedValue / 1000).toFixed(0)}K</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      {lead.matchedVendors.length} vendor{lead.matchedVendors.length !== 1 ? 's' : ''} matched
                    </div>
                    {lead.status === 'pending' ? (
                      <button
                        onClick={() => handleAcceptLead(lead.id)}
                        className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-green-700 transition-all flex items-center gap-2"
                      >
                        <CheckCircle size={18} />
                        Accept Lead (8% fee on close)
                      </button>
                    ) : (
                      <span className={`px-4 py-2 rounded-lg font-bold ${
                        lead.status === 'accepted' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {lead.status === 'accepted' ? '✓ Accepted' : 'Sent'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border-2 border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-blue-700 font-bold">Total Leads</div>
                      <div className="text-3xl font-bold text-blue-900 mt-1">
                        {submissions.reduce((sum, sub) => sum + sub.leadsReceived, 0)}
                      </div>
                    </div>
                    <Users size={40} className="text-blue-600 opacity-50" />
                  </div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border-2 border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-green-700 font-bold">Converted</div>
                      <div className="text-3xl font-bold text-green-900 mt-1">
                        {submissions.reduce((sum, sub) => sum + sub.leadsConverted, 0)}
                      </div>
                    </div>
                    <CheckCircle size={40} className="text-green-600 opacity-50" />
                  </div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border-2 border-purple-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-purple-700 font-bold">Conversion Rate</div>
                      <div className="text-3xl font-bold text-purple-900 mt-1">
                        {submissions.length > 0
                          ? Math.round(
                              (submissions.reduce((sum, sub) => sum + sub.leadsConverted, 0) /
                                submissions.reduce((sum, sub) => sum + sub.leadsReceived, 0)) *
                                100
                            ) || 0
                          : 0}%
                      </div>
                    </div>
                    <TrendingUp size={40} className="text-purple-600 opacity-50" />
                  </div>
                </div>
              </div>

              <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Performance by Submission</h3>
                <div className="space-y-3">
                  {submissions.map(sub => (
                    <div key={sub.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <div className="font-bold text-gray-900">
                          {sub.manufacturer} {sub.model} ({sub.powerRangeMin}-{sub.powerRangeMax} kW)
                        </div>
                        <div className="text-sm font-bold text-green-600">
                          {sub.conversionRate}% conversion
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Leads:</span>
                          <span className="font-bold ml-1">{sub.leadsReceived}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Converted:</span>
                          <span className="font-bold ml-1">{sub.leadsConverted}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Pending:</span>
                          <span className="font-bold ml-1">{sub.leadsReceived - sub.leadsConverted}</span>
                        </div>
                      </div>
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{ width: `${sub.conversionRate}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-6 border-2 border-yellow-300">
                <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <Zap size={20} className="text-yellow-600" />
                  Pricing Insights
                </h3>
                <p className="text-gray-700 mb-3">
                  Your pricing is <strong>competitive</strong> in most regions. Consider:
                </p>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span>Expanding to Nevada and Colorado for 15% more leads</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span>Reducing $/kWh by $10 could increase conversion by 8%</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-600 font-bold">!</span>
                    <span>High competition in California - differentiate on delivery time</span>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
