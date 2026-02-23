import React from "react";
import type { Vendor } from "@/services/supabaseClient";

interface VendorProfileTabProps {
  currentVendor: Vendor;
}

const VendorProfileTab: React.FC<VendorProfileTabProps> = ({ currentVendor }) => {
  return (
    <div className="rounded-xl p-8 border border-white/[0.06] bg-[rgba(255,255,255,0.03)]">
      <h2 className="text-2xl font-bold text-white mb-6">Vendor Profile</h2>

      {/* Status Badge */}
      <div className="mb-6">
        <span
          className={`px-4 py-2 rounded-full text-sm font-semibold ${
            currentVendor.status === "approved"
              ? "bg-[#3ECF8E]/10 text-[#3ECF8E] border border-[#3ECF8E]/20"
              : currentVendor.status === "pending"
                ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                : "bg-red-500/10 text-red-400 border border-red-500/20"
          }`}
        >
          Account Status: {currentVendor.status.toUpperCase()}
        </span>
      </div>

      <div className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Company Name</label>
            <input
              type="text"
              value={currentVendor.company_name}
              className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-lg text-slate-300"
              readOnly
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Contact Name</label>
            <input
              type="text"
              value={currentVendor.contact_name}
              className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-lg text-slate-300"
              readOnly
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
            <input
              type="email"
              value={currentVendor.email}
              className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-lg text-slate-300"
              readOnly
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Phone</label>
            <input
              type="tel"
              value={currentVendor.phone || "Not provided"}
              className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-lg text-slate-300"
              readOnly
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Specialty</label>
            <input
              type="text"
              value={currentVendor.specialty.replace("_", " ").toUpperCase()}
              className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-lg text-slate-300"
              readOnly
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Website</label>
            <input
              type="text"
              value={currentVendor.website || "Not provided"}
              className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-lg text-slate-300"
              readOnly
            />
          </div>
        </div>

        {currentVendor.description && (
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Company Description
            </label>
            <textarea
              value={currentVendor.description}
              className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-lg text-slate-300"
              rows={4}
              readOnly
            />
          </div>
        )}

        <div className="pt-4 border-t border-white/[0.06]">
          <p className="text-sm text-slate-500">
            Member since: {new Date(currentVendor.created_at).toLocaleDateString()}
          </p>
          {currentVendor.last_login && (
            <p className="text-sm text-slate-500">
              Last login: {new Date(currentVendor.last_login).toLocaleString()}
            </p>
          )}
        </div>

        <p className="text-sm text-slate-500 italic">
          To update your profile information, please contact support at vendors@merlin.energy
        </p>
      </div>
    </div>
  );
};

export default VendorProfileTab;
