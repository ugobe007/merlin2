/**
 * Vendor Portal View
 * ==================
 * 
 * Entry point for vendor/partner portal
 */

import React from 'react';
import { ArrowLeft, Building2, Package, TrendingUp, Users, ShieldCheck } from 'lucide-react';
import merlinImage from '../../assets/images/new_small_profile_.png';

interface VendorPortalViewProps {
  onBack: () => void;
  onJoinCustomerPlatform?: () => void;
}

const VendorPortalView: React.FC<VendorPortalViewProps> = ({ onBack, onJoinCustomerPlatform }) => {
  return (
    <div className="min-h-screen bg-[#0f1117]">
      {/* Header */}
      <header className="bg-[#1a1c23] border-b border-white/[0.06]">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          <div className="flex items-center gap-2">
            <div className="relative">
              <img src={merlinImage} alt="Merlin" className="w-10 h-10 rounded-lg" />
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center ring-2 ring-[#1a1c23]">
                <ShieldCheck className="w-2.5 h-2.5 text-white" />
              </div>
            </div>
            <span className="text-xl font-bold text-white">Pro<span className="text-[#3ECF8E]">Quote</span>™</span>
            <span className="text-xs text-slate-500 font-medium px-2 py-0.5 rounded-full border border-white/[0.08] bg-white/[0.03] ml-1">Vendor Portal</span>
          </div>
        </div>
      </header>
      
      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black text-white mb-4">
            Vendor Partner Portal
          </h1>
          <p className="text-xl text-slate-400">
            Join our network of trusted BESS equipment and service providers
          </p>
        </div>
        
        {/* Feature Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="rounded-2xl p-6 border border-white/[0.06] bg-[rgba(255,255,255,0.03)]">
            <div className="w-12 h-12 bg-blue-500/15 rounded-xl flex items-center justify-center mb-4">
              <Package className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Product Listings</h3>
            <p className="text-slate-400">
              List your batteries, inverters, and BOS components in our marketplace
            </p>
          </div>
          
          <div className="rounded-2xl p-6 border border-white/[0.06] bg-[rgba(255,255,255,0.03)]">
            <div className="w-12 h-12 bg-[#3ECF8E]/15 rounded-xl flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-[#3ECF8E]" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Quote Integration</h3>
            <p className="text-slate-400">
              Your products appear directly in customer quotes with real-time pricing
            </p>
          </div>
          
          <div className="rounded-2xl p-6 border border-white/[0.06] bg-[rgba(255,255,255,0.03)]">
            <div className="w-12 h-12 bg-blue-500/15 rounded-xl flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Lead Generation</h3>
            <p className="text-slate-400">
              Connect with qualified buyers actively seeking BESS solutions
            </p>
          </div>
          
          <div className="rounded-2xl p-6 border border-white/[0.06] bg-[rgba(255,255,255,0.03)]">
            <div className="w-12 h-12 bg-[#3ECF8E]/15 rounded-xl flex items-center justify-center mb-4">
              <Building2 className="w-6 h-6 text-[#3ECF8E]" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Analytics Dashboard</h3>
            <p className="text-slate-400">
              Track product views, quote inclusions, and market demand insights
            </p>
          </div>
        </div>
        
        {/* CTA */}
        <div className="text-center">
          <p className="text-slate-500 mb-6">
            Vendor portal is currently in beta. Contact us to join the program.
          </p>
          <div className="flex items-center justify-center gap-4">
            <a 
              href="mailto:vendors@merlin.energy"
              className="bg-[#3ECF8E] hover:bg-[#35b87a] text-[#0f1117] px-6 py-3 rounded-xl font-bold transition-colors"
            >
              Contact Vendor Team
            </a>
            {onJoinCustomerPlatform && (
              <button
                onClick={onJoinCustomerPlatform}
                className="border border-white/[0.1] text-white px-6 py-3 rounded-xl font-semibold hover:bg-white/[0.06] transition-colors"
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
