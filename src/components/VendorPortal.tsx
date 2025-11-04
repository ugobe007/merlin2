import React, { useState } from 'react';
import { Upload, FileText, DollarSign, CheckCircle, Clock, TrendingUp, Mail, Phone, Building2 } from 'lucide-react';

interface VendorProfile {
  company: string;
  contact_name: string;
  email: string;
  phone: string;
  specialty: string;
  certifications: string[];
}

interface PricingSubmission {
  id: string;
  product_category: string;
  model: string;
  price_per_kwh?: number;
  price_per_kw?: number;
  lead_time_weeks: number;
  warranty_years: number;
  status: 'pending' | 'approved' | 'rejected';
  submitted_date: string;
}

const VendorPortal: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'submit-pricing' | 'rfqs' | 'profile'>('dashboard');
  const [showRegistration, setShowRegistration] = useState(false);
  
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registrationForm, setRegistrationForm] = useState({
    company: '',
    contact_name: '',
    email: '',
    phone: '',
    password: '',
    specialty: '',
    website: '',
    description: ''
  });

  const [pricingForm, setPricingForm] = useState({
    product_category: 'battery',
    manufacturer: '',
    model: '',
    capacity_kwh: '',
    power_kw: '',
    price_per_kwh: '',
    price_per_kw: '',
    lead_time_weeks: '',
    warranty_years: '',
    certifications: '',
    datasheet: null as File | null
  });

  // Mock data for demonstration
  const mockSubmissions: PricingSubmission[] = [
    {
      id: '1',
      product_category: 'LFP Battery',
      model: 'CATL LFP 280Ah',
      price_per_kwh: 145,
      lead_time_weeks: 12,
      warranty_years: 10,
      status: 'approved',
      submitted_date: '2025-10-15'
    },
    {
      id: '2',
      product_category: 'PCS Inverter',
      model: 'SMA 500kW',
      price_per_kw: 180,
      lead_time_weeks: 8,
      warranty_years: 5,
      status: 'pending',
      submitted_date: '2025-10-28'
    }
  ];

  const mockRFQs = [
    {
      id: 'RFQ-2025-001',
      project: 'Hotel (300 Rooms) BESS',
      capacity: '2 MW / 4 MWh',
      location: 'California',
      due_date: '2025-11-15',
      status: 'open'
    },
    {
      id: 'RFQ-2025-002',
      project: 'Data Center Backup Power',
      capacity: '5 MW / 10 MWh',
      location: 'Texas',
      due_date: '2025-11-20',
      status: 'open'
    }
  ];

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement actual authentication
    if (loginForm.email && loginForm.password) {
      setIsLoggedIn(true);
    }
  };

  const handleRegistration = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement actual registration
    alert('Registration submitted! Our team will review and approve your vendor account within 24 hours.');
    setShowRegistration(false);
  };

  const handlePricingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement actual submission
    alert('Pricing submitted successfully! Our team will review and update our pricing database.');
    setPricingForm({
      product_category: 'battery',
      manufacturer: '',
      model: '',
      capacity_kwh: '',
      power_kw: '',
      price_per_kwh: '',
      price_per_kw: '',
      lead_time_weeks: '',
      warranty_years: '',
      certifications: '',
      datasheet: null
    });
  };

  // Login/Registration Screen
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-3 mb-4">
              <span className="text-5xl">🧙‍♂️</span>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Merlin Vendor Portal
              </h1>
            </div>
            <p className="text-xl text-gray-600">
              Partner with Merlin to provide competitive pricing for energy storage solutions
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            
            {/* Login Section */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Vendor Login</h2>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="vendor@company.com"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="••••••••"
                    required
                  />
                </div>
                
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
                >
                  Sign In
                </button>
                
                <p className="text-center text-sm text-gray-600 mt-4">
                  <a href="#" className="text-purple-600 hover:underline">Forgot password?</a>
                </p>
              </form>
            </div>

            {/* Benefits Section */}
            <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl shadow-lg p-8 text-white">
              <h2 className="text-2xl font-bold mb-6">Why Partner with Merlin?</h2>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <TrendingUp className="w-6 h-6 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-lg">Access to Active RFQs</h3>
                    <p className="text-white/90 text-sm">Real-time notifications for projects matching your products</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <DollarSign className="w-6 h-6 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-lg">Competitive Exposure</h3>
                    <p className="text-white/90 text-sm">Your pricing included in thousands of quotes generated monthly</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <FileText className="w-6 h-6 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-lg">Streamlined Process</h3>
                    <p className="text-white/90 text-sm">Simple pricing submission and proposal management</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-lg">Transparent Platform</h3>
                    <p className="text-white/90 text-sm">Fair comparison based on price, lead time, and quality</p>
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => setShowRegistration(true)}
                className="w-full bg-white text-purple-600 py-3 rounded-lg font-bold mt-8 hover:shadow-xl transition-all"
              >
                Become a Vendor Partner
              </button>
            </div>
          </div>

          {/* Registration Modal */}
          {showRegistration && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Vendor Registration</h2>
                
                <form onSubmit={handleRegistration} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Company Name *</label>
                      <input
                        type="text"
                        value={registrationForm.company}
                        onChange={(e) => setRegistrationForm({...registrationForm, company: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Contact Name *</label>
                      <input
                        type="text"
                        value={registrationForm.contact_name}
                        onChange={(e) => setRegistrationForm({...registrationForm, contact_name: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
                      <input
                        type="email"
                        value={registrationForm.email}
                        onChange={(e) => setRegistrationForm({...registrationForm, email: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                      <input
                        type="tel"
                        value={registrationForm.phone}
                        onChange={(e) => setRegistrationForm({...registrationForm, phone: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
                    <input
                      type="password"
                      value={registrationForm.password}
                      onChange={(e) => setRegistrationForm({...registrationForm, password: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Specialty/Product Category *</label>
                    <select
                      value={registrationForm.specialty}
                      onChange={(e) => setRegistrationForm({...registrationForm, specialty: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      required
                    >
                      <option value="">Select category...</option>
                      <option value="battery">Battery Manufacturer</option>
                      <option value="inverter">Inverter/PCS Manufacturer</option>
                      <option value="ems">EMS Software Provider</option>
                      <option value="bos">Balance of System</option>
                      <option value="epc">EPC Contractor</option>
                      <option value="integrator">System Integrator</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Company Website</label>
                    <input
                      type="url"
                      value={registrationForm.website}
                      onChange={(e) => setRegistrationForm({...registrationForm, website: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      placeholder="https://..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Company Description</label>
                    <textarea
                      value={registrationForm.description}
                      onChange={(e) => setRegistrationForm({...registrationForm, description: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      rows={4}
                      placeholder="Tell us about your company and products..."
                    />
                  </div>
                  
                  <div className="flex gap-4 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowRegistration(false)}
                      className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
                    >
                      Submit Registration
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Vendor Dashboard (After Login)
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🧙‍♂️</span>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Merlin Vendor Portal
            </h1>
          </div>
          <button
            onClick={() => setIsLoggedIn(false)}
            className="text-gray-600 hover:text-gray-800 font-semibold"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex gap-8">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
              { id: 'submit-pricing', label: 'Submit Pricing', icon: DollarSign },
              { id: 'rfqs', label: 'Active RFQs', icon: FileText },
              { id: 'profile', label: 'Profile', icon: Building2 }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-4 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-purple-600 text-purple-600 font-semibold'
                    : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-800">Welcome Back!</h2>
            
            {/* Stats */}
            <div className="grid md:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-gray-600">Active Submissions</p>
                  <Clock className="w-5 h-5 text-yellow-500" />
                </div>
                <p className="text-3xl font-bold text-gray-800">1</p>
              </div>
              
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-gray-600">Approved Products</p>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
                <p className="text-3xl font-bold text-gray-800">1</p>
              </div>
              
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-gray-600">Open RFQs</p>
                  <FileText className="w-5 h-5 text-blue-500" />
                </div>
                <p className="text-3xl font-bold text-gray-800">{mockRFQs.length}</p>
              </div>
              
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-gray-600">Quotes This Month</p>
                  <TrendingUp className="w-5 h-5 text-purple-500" />
                </div>
                <p className="text-3xl font-bold text-gray-800">247</p>
              </div>
            </div>

            {/* Recent Submissions */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Recent Pricing Submissions</h3>
              <div className="space-y-3">
                {mockSubmissions.map(submission => (
                  <div key={submission.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-semibold text-gray-800">{submission.product_category} - {submission.model}</p>
                      <p className="text-sm text-gray-600">
                        ${submission.price_per_kwh || submission.price_per_kw}/
                        {submission.price_per_kwh ? 'kWh' : 'kW'} • 
                        {submission.lead_time_weeks} weeks • 
                        {submission.warranty_years}yr warranty
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      submission.status === 'approved' ? 'bg-green-100 text-green-700' :
                      submission.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {submission.status.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Submit Pricing Tab */}
        {activeTab === 'submit-pricing' && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Submit Product Pricing</h2>
            
            <form onSubmit={handlePricingSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Product Category *</label>
                <select
                  value={pricingForm.product_category}
                  onChange={(e) => setPricingForm({...pricingForm, product_category: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  required
                >
                  <option value="battery">Battery Module</option>
                  <option value="inverter">Inverter/PCS</option>
                  <option value="ems">Energy Management System</option>
                  <option value="bos">Balance of System</option>
                  <option value="container">Container/Enclosure</option>
                </select>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Manufacturer *</label>
                  <input
                    type="text"
                    value={pricingForm.manufacturer}
                    onChange={(e) => setPricingForm({...pricingForm, manufacturer: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g., CATL, BYD, Tesla"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Model Number *</label>
                  <input
                    type="text"
                    value={pricingForm.model}
                    onChange={(e) => setPricingForm({...pricingForm, model: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g., LFP 280Ah"
                    required
                  />
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Capacity (kWh)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={pricingForm.capacity_kwh}
                    onChange={(e) => setPricingForm({...pricingForm, capacity_kwh: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Power Rating (kW)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={pricingForm.power_kw}
                    onChange={(e) => setPricingForm({...pricingForm, power_kw: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price per kWh (USD) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={pricingForm.price_per_kwh}
                    onChange={(e) => setPricingForm({...pricingForm, price_per_kwh: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g., 145.00"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price per kW (USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={pricingForm.price_per_kw}
                    onChange={(e) => setPricingForm({...pricingForm, price_per_kw: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g., 180.00"
                  />
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Lead Time (weeks) *</label>
                  <input
                    type="number"
                    value={pricingForm.lead_time_weeks}
                    onChange={(e) => setPricingForm({...pricingForm, lead_time_weeks: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Warranty (years) *</label>
                  <input
                    type="number"
                    value={pricingForm.warranty_years}
                    onChange={(e) => setPricingForm({...pricingForm, warranty_years: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Certifications</label>
                <input
                  type="text"
                  value={pricingForm.certifications}
                  onChange={(e) => setPricingForm({...pricingForm, certifications: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g., UL9540, IEC 62619, UN38.3"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Product Datasheet (PDF)</label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setPricingForm({...pricingForm, datasheet: e.target.files?.[0] || null})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 rounded-lg font-semibold text-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
              >
                <Upload className="w-5 h-5" />
                Submit Pricing
              </button>
            </form>
          </div>
        )}

        {/* RFQs Tab */}
        {activeTab === 'rfqs' && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-800">Active RFQs</h2>
            
            <div className="grid gap-6">
              {mockRFQs.map(rfq => (
                <div key={rfq.id} className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-sm text-purple-600 font-semibold">{rfq.id}</p>
                      <h3 className="text-xl font-bold text-gray-800 mt-1">{rfq.project}</h3>
                    </div>
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                      {rfq.status.toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="grid md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">System Size</p>
                      <p className="font-semibold text-gray-800">{rfq.capacity}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Location</p>
                      <p className="font-semibold text-gray-800">{rfq.location}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Due Date</p>
                      <p className="font-semibold text-gray-800">{new Date(rfq.due_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <button className="flex-1 bg-purple-600 text-white py-2 rounded-lg font-semibold hover:bg-purple-700 transition-colors">
                      Submit Proposal
                    </button>
                    <button className="px-6 bg-gray-200 text-gray-800 py-2 rounded-lg font-semibold hover:bg-gray-300 transition-colors">
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Vendor Profile</h2>
            
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                  <input
                    type="text"
                    defaultValue="ACME Battery Solutions"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Contact Name</label>
                  <input
                    type="text"
                    defaultValue="John Smith"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    defaultValue="john@acmebattery.com"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    defaultValue="(555) 123-4567"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Specialty</label>
                <input
                  type="text"
                  defaultValue="Battery Manufacturer"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  disabled
                />
              </div>
              
              <button className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:shadow-lg transition-all">
                Save Changes
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorPortal;
