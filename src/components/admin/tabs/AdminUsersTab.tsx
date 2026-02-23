import React from "react";
import { Users } from "lucide-react";

export default function AdminUsersTab() {
  return (
    <>
      <div className="space-y-6">
        {/* Section Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Users className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">User Management</h2>
          </div>
          <button className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-4 py-2 rounded-xl font-semibold shadow-lg shadow-emerald-500/10 transition-all hover:scale-[1.02]">
            + Add User
          </button>
        </div>

        {/* Search & Filters */}
        <div className="bg-white/[0.03] backdrop-blur-sm p-4 rounded-2xl border border-white/[0.08] shadow-lg">
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Search by email or name..."
              className="flex-1 bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-2 text-white placeholder-gray-400 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 outline-none transition-all"
            />
            <select className="bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-2 text-white focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 outline-none transition-all">
              <option>All Tiers</option>
              <option>Free</option>
              <option>Semi-Premium</option>
              <option>Premium</option>
              <option>Admin</option>
            </select>
          </div>
        </div>

        {/* User List */}
        <div className="space-y-4">
          {/* Example Users */}
          {[
            { email: "john@example.com", tier: "free", quotesUsed: 2, joined: "Jan 15, 2025" },
            {
              email: "sarah@company.com",
              tier: "premium",
              quotesUsed: 47,
              joined: "Dec 3, 2024",
            },
            {
              email: "mike@business.com",
              tier: "semi_premium",
              quotesUsed: 18,
              joined: "Feb 1, 2025",
            },
          ].map((user, idx) => (
            <div
              key={idx}
              className="bg-white/[0.03] backdrop-blur-sm p-4 rounded-2xl border border-white/[0.08] hover:border-white/[0.12] hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-semibold">{user.email}</p>
                  <div className="flex gap-4 mt-2 text-sm">
                    <span
                      className={`px-2 py-1 rounded-lg ${
                        user.tier === "premium"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : user.tier === "semi_premium"
                            ? "bg-blue-500/10 text-blue-400"
                            : "bg-white/[0.05] text-white/80"
                      }`}
                    >
                      {user.tier === "semi_premium"
                        ? "Semi-Premium"
                        : user.tier.charAt(0).toUpperCase() + user.tier.slice(1)}
                    </span>
                    <span className="text-white/50">Joined: {user.joined}</span>
                    <span className="text-white/50">Quotes: {user.quotesUsed}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.02]">
                    Change Tier
                  </button>
                  <button className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium shadow-lg shadow-emerald-500/10 transition-all hover:scale-[1.02]">
                    View Activity
                  </button>
                  <button className="bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium shadow-lg shadow-red-500/25 transition-all hover:scale-[1.02]">
                    Disable
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Coming Soon Notice */}
        <div className="bg-blue-500/5 border border-blue-500/15 p-4 rounded-2xl">
          <p className="text-blue-400 text-sm">
            💡 <strong>Coming Soon:</strong> Full user management with Supabase integration. You'll
            be able to change tiers, reset quote limits, view detailed activity, and manage
            subscriptions.
          </p>
        </div>
      </div>
    </>
  );
}
