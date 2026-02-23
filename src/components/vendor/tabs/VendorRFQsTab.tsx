import React from "react";
import { FileText } from "lucide-react";
import type { RFQ } from "@/services/supabaseClient";

interface VendorRFQsTabProps {
  openRFQs: RFQ[];
}

const VendorRFQsTab: React.FC<VendorRFQsTabProps> = ({ openRFQs }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-white">Active RFQs</h2>

      {openRFQs.length === 0 ? (
        <div className="rounded-xl p-8 text-center border border-white/[0.06] bg-[rgba(255,255,255,0.03)]">
          <FileText className="w-16 h-16 mx-auto mb-4 text-slate-600" />
          <h3 className="text-xl font-bold text-white mb-2">No Open RFQs</h3>
          <p className="text-slate-400">
            There are no active requests for quotes at the moment. Check back later!
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {openRFQs.map((rfq) => (
            <div
              key={rfq.id}
              className="rounded-xl p-6 border border-white/[0.06] bg-[rgba(255,255,255,0.03)]"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-sm text-[#3ECF8E] font-semibold">{rfq.rfq_number}</p>
                  <h3 className="text-xl font-bold text-white mt-1">{rfq.project_name}</h3>
                </div>
                <span className="px-3 py-1 bg-[#3ECF8E]/10 text-[#3ECF8E] rounded-full text-sm font-semibold border border-[#3ECF8E]/20">
                  {rfq.status.toUpperCase()}
                </span>
              </div>

              <div className="grid md:grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-sm text-slate-400">System Size</p>
                  <p className="font-semibold text-white">
                    {rfq.system_size_mw} MW / {rfq.system_size_mw * rfq.duration_hours} MWh
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Location</p>
                  <p className="font-semibold text-white">{rfq.location}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Due Date</p>
                  <p className="font-semibold text-white">
                    {new Date(rfq.due_date).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <button className="flex-1 bg-[#3ECF8E] hover:bg-[#35b87a] text-[#0f1117] py-2 rounded-lg font-bold transition-colors">
                  Submit Proposal
                </button>
                <button className="px-6 bg-white/[0.06] text-slate-300 py-2 rounded-lg font-semibold hover:bg-white/[0.1] border border-white/[0.1] transition-colors">
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VendorRFQsTab;
