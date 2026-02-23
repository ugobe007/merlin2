import React from "react";
import { TrendingUp, DollarSign, Users, Zap } from "lucide-react";

export default function AdminAnalyticsTab() {
  return (
    <>
      <div className="space-y-6">
        {/* Section Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/10">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl font-bold text-white">Site Analytics</h2>
        </div>

        {/* Performance Metrics */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white/[0.03] backdrop-blur-sm p-6 rounded-2xl border border-white/[0.08] shadow-lg">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" />
              User Engagement
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-white/60">Daily Active Users</span>
                <span className="text-white font-bold">342</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Avg. Session Duration</span>
                <span className="text-white font-bold">12m 34s</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Bounce Rate</span>
                <span className="text-white font-bold">23.5%</span>
              </div>
            </div>
          </div>

          <div className="bg-white/[0.03] backdrop-blur-sm p-6 rounded-2xl border border-emerald-500/20 shadow-lg">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              Revenue Metrics
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-white/60">Conversion Rate</span>
                <span className="text-white font-bold">8.7%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Avg. Quote Value</span>
                <span className="text-white font-bold">$847K</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Customer LTV</span>
                <span className="text-white font-bold">$1,240</span>
              </div>
            </div>
          </div>

          <div className="bg-white/[0.03] backdrop-blur-sm p-6 rounded-2xl border border-white/[0.08] shadow-lg">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-emerald-400" />
              Performance
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-white/60">Page Load Time</span>
                <span className="text-white font-bold">1.2s</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Core Web Vitals</span>
                <span className="text-emerald-400 font-bold">Good</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Error Rate</span>
                <span className="text-white font-bold">0.08%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
