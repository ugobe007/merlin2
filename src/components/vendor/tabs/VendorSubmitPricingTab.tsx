import React from "react";
import { AlertCircle, Loader2, Upload } from "lucide-react";

interface PricingForm {
  product_category: "battery" | "inverter" | "ems" | "bos" | "container";
  manufacturer: string;
  model: string;
  capacity_kwh: string;
  power_kw: string;
  price_per_kwh: string;
  price_per_kw: string;
  lead_time_weeks: string;
  warranty_years: string;
  certifications: string;
  datasheet: File | null;
}

interface VendorSubmitPricingTabProps {
  pricingForm: PricingForm;
  setPricingForm: (form: PricingForm) => void;
  error: string | null;
  isLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onClearError: () => void;
}

const VendorSubmitPricingTab: React.FC<VendorSubmitPricingTabProps> = ({
  pricingForm,
  setPricingForm,
  error,
  isLoading,
  onSubmit,
  onClearError,
}) => {
  return (
    <div className="rounded-xl p-8 border border-white/[0.06] bg-[rgba(255,255,255,0.03)]">
      <h2 className="text-2xl font-bold text-white mb-6">Submit Product Pricing</h2>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="text-red-300 text-sm">{error}</div>
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Product Category *
          </label>
          <select
            value={pricingForm.product_category}
            onChange={(e) => {
              setPricingForm({
                ...pricingForm,
                product_category: e.target.value as PricingForm["product_category"],
              });
              onClearError();
            }}
            className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white focus:ring-2 focus:ring-[#3ECF8E]/50 focus:border-[#3ECF8E]/50"
            required
            disabled={isLoading}
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
            <label className="block text-sm font-medium text-slate-300 mb-2">Manufacturer *</label>
            <input
              type="text"
              value={pricingForm.manufacturer}
              onChange={(e) => {
                setPricingForm({ ...pricingForm, manufacturer: e.target.value });
                onClearError();
              }}
              className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-[#3ECF8E]/50 focus:border-[#3ECF8E]/50"
              placeholder="e.g., CATL, BYD, Tesla"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Model Number *</label>
            <input
              type="text"
              value={pricingForm.model}
              onChange={(e) => {
                setPricingForm({ ...pricingForm, model: e.target.value });
                onClearError();
              }}
              className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-[#3ECF8E]/50 focus:border-[#3ECF8E]/50"
              placeholder="e.g., LFP 280Ah"
              required
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Capacity (kWh)</label>
            <input
              type="number"
              step="0.1"
              value={pricingForm.capacity_kwh}
              onChange={(e) => setPricingForm({ ...pricingForm, capacity_kwh: e.target.value })}
              className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-[#3ECF8E]/50 focus:border-[#3ECF8E]/50"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Power Rating (kW)
            </label>
            <input
              type="number"
              step="0.1"
              value={pricingForm.power_kw}
              onChange={(e) => setPricingForm({ ...pricingForm, power_kw: e.target.value })}
              className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-[#3ECF8E]/50 focus:border-[#3ECF8E]/50"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Price per kWh (USD) *
            </label>
            <input
              type="number"
              step="0.01"
              value={pricingForm.price_per_kwh}
              onChange={(e) => setPricingForm({ ...pricingForm, price_per_kwh: e.target.value })}
              className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-[#3ECF8E]/50 focus:border-[#3ECF8E]/50"
              placeholder="e.g., 145.00"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Price per kW (USD)
            </label>
            <input
              type="number"
              step="0.01"
              value={pricingForm.price_per_kw}
              onChange={(e) => setPricingForm({ ...pricingForm, price_per_kw: e.target.value })}
              className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-[#3ECF8E]/50 focus:border-[#3ECF8E]/50"
              placeholder="e.g., 180.00"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Lead Time (weeks) *
            </label>
            <input
              type="number"
              value={pricingForm.lead_time_weeks}
              onChange={(e) => setPricingForm({ ...pricingForm, lead_time_weeks: e.target.value })}
              className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-[#3ECF8E]/50 focus:border-[#3ECF8E]/50"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Warranty (years) *
            </label>
            <input
              type="number"
              value={pricingForm.warranty_years}
              onChange={(e) => setPricingForm({ ...pricingForm, warranty_years: e.target.value })}
              className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-[#3ECF8E]/50 focus:border-[#3ECF8E]/50"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Certifications</label>
          <input
            type="text"
            value={pricingForm.certifications}
            onChange={(e) => setPricingForm({ ...pricingForm, certifications: e.target.value })}
            className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-[#3ECF8E]/50 focus:border-[#3ECF8E]/50"
            placeholder="e.g., UL9540, IEC 62619, UN38.3"
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Product Datasheet (PDF)
          </label>
          <input
            type="file"
            accept=".pdf"
            onChange={(e) =>
              setPricingForm({ ...pricingForm, datasheet: e.target.files?.[0] || null })
            }
            className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.1] rounded-lg text-slate-300 file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#3ECF8E]/20 file:text-[#3ECF8E] hover:file:bg-[#3ECF8E]/30 focus:ring-2 focus:ring-[#3ECF8E]/50 focus:border-[#3ECF8E]/50"
            disabled={isLoading}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-[#3ECF8E] hover:bg-[#35b87a] text-[#0f1117] py-4 rounded-lg font-bold text-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Upload className="w-5 h-5" />
              Submit Pricing
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default VendorSubmitPricingTab;
