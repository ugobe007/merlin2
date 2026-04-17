import React, { useEffect, useState, useCallback } from "react";
import { Users, RefreshCw, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  plan: string | null;
  matches_used: number | null;
  matches_remaining: number | null;
  is_active: boolean | null;
  created_at: string;
  last_login_at: string | null;
  login_count: number | null;
  company_name: string | null;
}

const TIER_OPTIONS = ["free", "semi_premium", "premium", "admin"];

const tierLabel = (plan: string | null) => {
  if (!plan) return "Free";
  if (plan === "semi_premium") return "Semi-Premium";
  return plan.charAt(0).toUpperCase() + plan.slice(1);
};

const tierStyle = (plan: string | null) => {
  if (plan === "premium") return "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20";
  if (plan === "semi_premium") return "bg-blue-500/10 text-blue-400 border border-blue-500/15";
  if (plan === "admin") return "bg-purple-500/20 text-purple-300 border border-purple-500/20";
  return "bg-white/[0.05] text-white/70 border border-white/10";
};

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function AdminUsersTab() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("all");
  const [activityUser, setActivityUser] = useState<UserProfile | null>(null);
  const [tierUser, setTierUser] = useState<UserProfile | null>(null);
  const [pendingTier, setPendingTier] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from("user_profiles")
      .select(
        "id, email, full_name, plan, matches_used, matches_remaining, is_active, created_at, last_login_at, login_count, company_name"
      )
      .order("created_at", { ascending: false })
      .limit(200);
    if (err) {
      setError(err.message);
    } else {
      setUsers(data ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleDisable = async (user: UserProfile) => {
    const next = !user.is_active;
    const label = next ? "re-enable" : "disable";
    if (!confirm(`${label.charAt(0).toUpperCase() + label.slice(1)} ${user.email}?`)) return;
    const { error: err } = await supabase
      .from("user_profiles")
      .update({ is_active: next })
      .eq("id", user.id);
    if (err) {
      alert("Error: " + err.message);
      return;
    }
    setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, is_active: next } : u)));
  };

  const handleChangeTier = async () => {
    if (!tierUser || !pendingTier) return;
    setSaving(true);
    const { error: err } = await supabase
      .from("user_profiles")
      .update({ plan: pendingTier })
      .eq("id", tierUser.id);
    setSaving(false);
    if (err) {
      alert("Error: " + err.message);
      return;
    }
    setUsers((prev) => prev.map((u) => (u.id === tierUser.id ? { ...u, plan: pendingTier } : u)));
    setTierUser(null);
  };

  const filtered = users.filter((u) => {
    const matchSearch =
      !search ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.full_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (u.company_name ?? "").toLowerCase().includes(search.toLowerCase());
    const matchTier = tierFilter === "all" || (u.plan ?? "free") === tierFilter;
    return matchSearch && matchTier;
  });

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">User Management</h2>
              {!loading && (
                <p className="text-xs text-white/40 mt-0.5">
                  {users.length} real users from Supabase
                </p>
              )}
            </div>
          </div>
          <button
            onClick={fetchUsers}
            className="flex items-center gap-2 bg-white/[0.05] hover:bg-white/[0.08] border border-white/10 text-white/70 px-3 py-2 rounded-xl text-sm font-medium transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>

        {/* Search & Filter */}
        <div className="bg-white/[0.03] backdrop-blur-sm p-4 rounded-2xl border border-white/[0.08]">
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Search by email, name, or company..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-2 text-white placeholder-gray-500 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 outline-none transition-all text-sm"
            />
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className="bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-2 text-white focus:border-emerald-500/50 outline-none transition-all text-sm"
            >
              <option value="all">All Tiers</option>
              <option value="free">Free</option>
              <option value="semi_premium">Semi-Premium</option>
              <option value="premium">Premium</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-16 text-white/40">
            <RefreshCw className="w-5 h-5 animate-spin mr-3" />
            Loading users from Supabase…
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 p-4 rounded-2xl text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* User List */}
        {!loading && !error && (
          <div className="space-y-3">
            {filtered.length === 0 && (
              <p className="text-center text-white/30 py-12 text-sm">No users match your search.</p>
            )}
            {filtered.map((user) => (
              <div
                key={user.id}
                className={`bg-white/[0.03] backdrop-blur-sm p-4 rounded-2xl border transition-all ${
                  user.is_active === false
                    ? "border-red-500/20 opacity-60"
                    : "border-white/[0.08] hover:border-white/[0.12]"
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-white font-semibold text-sm truncate">{user.email}</p>
                      {user.is_active === false && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/20">
                          Disabled
                        </span>
                      )}
                    </div>
                    {(user.full_name || user.company_name) && (
                      <p className="text-white/40 text-xs mt-0.5">
                        {[user.full_name, user.company_name].filter(Boolean).join(" · ")}
                      </p>
                    )}
                    <div className="flex gap-3 mt-2 flex-wrap items-center text-xs">
                      <span
                        className={`px-2 py-0.5 rounded-lg text-xs font-medium ${tierStyle(user.plan)}`}
                      >
                        {tierLabel(user.plan)}
                      </span>
                      <span className="text-white/40">Joined {formatDate(user.created_at)}</span>
                      <span className="text-white/40">
                        Quotes:{" "}
                        <span className="text-white/70 font-medium">{user.matches_used ?? 0}</span>
                      </span>
                      {user.login_count != null && (
                        <span className="text-white/40">
                          Logins:{" "}
                          <span className="text-white/70 font-medium">{user.login_count}</span>
                        </span>
                      )}
                      {user.last_login_at && (
                        <span className="text-white/40">
                          Last seen:{" "}
                          <span className="text-white/60">{formatDate(user.last_login_at)}</span>
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => {
                        setTierUser(user);
                        setPendingTier(user.plan ?? "free");
                      }}
                      className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02]"
                    >
                      Change Tier
                    </button>
                    <button
                      onClick={() => setActivityUser(user)}
                      className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium shadow-lg shadow-emerald-500/10 transition-all hover:scale-[1.02]"
                    >
                      View Activity
                    </button>
                    <button
                      onClick={() => handleDisable(user)}
                      className={`text-white px-3 py-1.5 rounded-lg text-xs font-medium shadow-lg transition-all hover:scale-[1.02] ${
                        user.is_active === false
                          ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-500/10"
                          : "bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 shadow-red-500/20"
                      }`}
                    >
                      {user.is_active === false ? "Re-enable" : "Disable"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Change Tier Modal */}
      {tierUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#0f1420] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-white font-bold text-lg mb-1">Change Tier</h3>
            <p className="text-white/50 text-sm mb-5">{tierUser.email}</p>
            <div className="space-y-2 mb-6">
              {TIER_OPTIONS.map((opt) => (
                <label
                  key={opt}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    pendingTier === opt
                      ? "border-emerald-500/50 bg-emerald-500/10"
                      : "border-white/[0.08] hover:border-white/20"
                  }`}
                >
                  <input
                    type="radio"
                    name="tier"
                    value={opt}
                    checked={pendingTier === opt}
                    onChange={() => setPendingTier(opt)}
                    className="accent-emerald-500"
                  />
                  <span className={`text-sm font-medium ${tierStyle(opt)} px-2 py-0.5 rounded-lg`}>
                    {tierLabel(opt)}
                  </span>
                </label>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setTierUser(null)}
                className="flex-1 bg-white/[0.05] hover:bg-white/[0.08] border border-white/10 text-white/70 py-2 rounded-xl text-sm font-medium transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleChangeTier}
                disabled={saving || pendingTier === (tierUser.plan ?? "free")}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2 rounded-xl text-sm font-semibold transition-all"
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Activity Modal */}
      {activityUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#0f1420] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-white font-bold text-lg mb-1">User Activity</h3>
            <p className="text-white/50 text-sm mb-5">{activityUser.email}</p>
            <div className="space-y-1">
              {(
                [
                  ["Plan", tierLabel(activityUser.plan)],
                  ["Status", activityUser.is_active === false ? "🔴 Disabled" : "🟢 Active"],
                  ["Joined", formatDate(activityUser.created_at)],
                  ["Last Login", formatDate(activityUser.last_login_at)],
                  ["Login Count", String(activityUser.login_count ?? 0)],
                  ["Quotes Used", String(activityUser.matches_used ?? 0)],
                  ["Quotes Remaining", String(activityUser.matches_remaining ?? "—")],
                  ["Company", activityUser.company_name ?? "—"],
                ] as [string, string][]
              ).map(([label, val]) => (
                <div
                  key={label}
                  className="flex justify-between items-center py-2.5 border-b border-white/[0.05]"
                >
                  <span className="text-white/50 text-sm">{label}</span>
                  <span className="text-white text-sm font-medium">{val}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => setActivityUser(null)}
              className="mt-6 w-full bg-white/[0.05] hover:bg-white/[0.08] border border-white/10 text-white/70 py-2 rounded-xl text-sm font-medium transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
