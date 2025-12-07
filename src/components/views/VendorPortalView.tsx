/**
 * Vendor Portal View
 * ==================
 * 
 * Entry point for vendor/partner portal
 */

import React from 'react';
import { ArrowLeft, Building2, Package, TrendingUp, Users } from 'lucide-react';
import merlinImage from '../../assets/images/new_Merlin.png';

interface VendorPortalViewProps {
  onBack: () => void;
  onJoinCustomerPlatform?: () => void;
}

const VendorPortalView: React.FC<VendorPortalViewProps> = ({ onBack, onJoinCustomerPlatform }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          <div className="flex items-center gap-2">
            <img src={merlinImage} alt="Merlin" className="w-10 h-10" />
            <span className="text-xl font-bold text-white">Merlin</span>
            <span className="text-sm text-blue-300 font-medium ml-2">Vendor Portal</span>
          </div>
        </div>
      </header>
      
      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black text-white mb-4">
            Vendor Partner Portal
          </h1>
          <p className="text-xl text-blue-200/80">
            Join our network of trusted BESS equipment and service providers
          </p>
        </div>
        
        {/* Feature Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4">
              <Package className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Product Listings</h3>
            <p className="text-white/70">
              List your batteries, inverters, and BOS components in our marketplace
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Quote Integration</h3>
            <p className="text-white/70">
              Your products appear directly in customer quotes with real-time pricing
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Lead Generation</h3>
            <p className="text-white/70">
              Connect with qualified buyers actively seeking BESS solutions
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center mb-4">
              <Building2 className="w-6 h-6 text-amber-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Analytics Dashboard</h3>
            <p className="text-white/70">
              Track product views, quote inclusions, and market demand insights
            </p>
          </div>
        </div>
        
        {/* CTA */}
        <div className="text-center">
          <p className="text-white/60 mb-6">
            Vendor portal is currently in beta. Contact us to join the program.
          </p>
          <div className="flex items-center justify-center gap-4">
            <a 
              href="mailto:vendors@merlin.energy"
              className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-600 transition-colors"
            >
              Contact Vendor Team
            </a>
            {onJoinCustomerPlatform && (
              <button
                onClick={onJoinCustomerPlatform}
                className="bg-white/20 text-white px-6 py-3 rounded-xl font-semibold hover:bg-white/30 transition-colors"
              >
                Customer Platform →
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default VendorPortalView;
