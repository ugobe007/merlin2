import React from "react";
import { Settings, Shield, Users } from "lucide-react";

export default function AdminSettingsTab() {
  return (
    <>
      <div className="space-y-6">
        {/* Section Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-gray-500 to-slate-500 rounded-xl flex items-center justify-center shadow-lg shadow-gray-500/25">
            <Settings className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl font-bold text-white">System Settings</h2>
        </div>

        {/* Access Control */}
        <div className="bg-white/[0.03] backdrop-blur-sm p-6 rounded-2xl border border-white/[0.08] shadow-xl">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-400" />
            Access Control
          </h3>
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="w-5 h-5 rounded border-white/20 text-emerald-400 focus:ring-emerald-500"
              />
              <div>
                <span className="text-white font-semibold">Require Login</span>
                <p className="text-white/50 text-sm">
                  Make the app private - users must create an account
                </p>
              </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="w-5 h-5 rounded border-white/20 text-emerald-400 focus:ring-emerald-500"
              />
              <div>
                <span className="text-white font-semibold">Maintenance Mode</span>
                <p className="text-white/50 text-sm">
                  Temporarily disable public access for maintenance
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Tier Limits */}
        <div className="bg-white/[0.03] backdrop-blur-sm p-6 rounded-2xl border border-white/[0.08] shadow-xl">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            Tier Limits
          </h3>

          <div className="space-y-6">
            {/* Free Tier */}
            <div className="bg-white/[0.03] p-4 rounded-xl border border-white/[0.08]">
              <h4 className="text-white font-semibold mb-3">Free Tier</h4>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-white/60 text-sm">Quotes per user</label>
                  <input
                    type="number"
                    defaultValue={3}
                    className="w-full bg-[#1a1a2e] border border-white/[0.08] rounded-xl px-4 py-2 text-white mt-1 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-white/60 text-sm">Quote validity (days)</label>
                  <input
                    type="number"
                    defaultValue={30}
                    className="w-full bg-[#1a1a2e] border border-white/[0.08] rounded-xl px-4 py-2 text-white mt-1 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Semi-Premium Tier */}
            <div className="bg-blue-500/5 p-4 rounded-xl border border-white/[0.08]">
              <h4 className="text-white font-semibold mb-3">Semi-Premium Tier</h4>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="text-white/60 text-sm">Monthly quotes</label>
                  <input
                    type="number"
                    defaultValue={25}
                    className="w-full bg-[#1a1a2e] border border-white/[0.08] rounded-xl px-4 py-2 text-white mt-1 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-white/60 text-sm">Saved quotes</label>
                  <input
                    type="number"
                    defaultValue={5}
                    className="w-full bg-[#1a1a2e] border border-white/[0.08] rounded-xl px-4 py-2 text-white mt-1 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-white/60 text-sm">Price (USD/month)</label>
                  <input
                    type="number"
                    defaultValue={19}
                    className="w-full bg-[#1a1a2e] border border-white/[0.08] rounded-xl px-4 py-2 text-white mt-1 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Premium Tier */}
            <div className="bg-white/[0.03] p-4 rounded-xl border border-white/[0.08]">
              <h4 className="text-white font-semibold mb-3">Premium Tier</h4>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="text-white/60 text-sm">Monthly quotes</label>
                  <input
                    type="text"
                    defaultValue="Unlimited"
                    disabled
                    className="w-full bg-[#1a1a2e] border border-white/[0.08] rounded-xl px-4 py-2 text-white/40 mt-1"
                  />
                </div>
                <div>
                  <label className="text-white/60 text-sm">Saved quotes</label>
                  <input
                    type="text"
                    defaultValue="Unlimited"
                    disabled
                    className="w-full bg-[#1a1a2e] border border-white/[0.08] rounded-xl px-4 py-2 text-white/40 mt-1"
                  />
                </div>
                <div>
                  <label className="text-white/60 text-sm">Price (USD/month)</label>
                  <input
                    type="number"
                    defaultValue={49}
                    className="w-full bg-[#1a1a2e] border border-white/[0.08] rounded-xl px-4 py-2 text-white mt-1 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          <button className="mt-6 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-6 py-2 rounded-xl font-semibold shadow-lg shadow-emerald-500/10 transition-all hover:scale-[1.02]">
            Save Changes
          </button>
        </div>

        {/* Info Notice */}
        <div className="bg-orange-500/5 border border-orange-500/15 p-4 rounded-2xl">
          <p className="text-orange-400 text-sm">
            🔧 <strong>Configuration:</strong> These settings will be stored in the{" "}
            <code className="bg-orange-500/10 px-2 py-1 rounded">system_settings</code> table once
            Supabase is connected.
          </p>
        </div>
      </div>
    </>
  );
}
