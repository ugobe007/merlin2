import React, { useState, useEffect } from "react";
import {
  Home,
  Users,
  Settings,
  TrendingUp,
  Database,
  Megaphone,
  Zap,
  Shield,
  BarChart3,
  Cpu,
  Activity,
  DollarSign,
  FileText,
  Sparkles,
  Crown,
  // Eye, // Unused
  Brain,
  // BarChart, // Unused
  Gauge,
  // Wrench, // Unused
  Layers,
} from "lucide-react";
import { PricingAdminDashboard } from "./PricingAdminDashboard";
import UseCaseConfigManager from "./admin/UseCaseConfigManager";
import SystemHealthDashboard from "./admin/SystemHealthDashboard";
import MarketIntelligenceDashboard from "./admin/MarketIntelligenceDashboard";
// premiumConfigurationService imports moved to tab components
import merlinImage from "@/assets/images/new_profile_merlin.png";
// import MigrationManager from './admin/MigrationManager'; // Temporarily disabled
import AdminWorkflowsTab from "./admin/tabs/AdminWorkflowsTab";
import AdminHealthTab from "./admin/tabs/AdminHealthTab";
import AdminAnalyticsTab from "./admin/tabs/AdminAnalyticsTab";
import AdminUsersTab from "./admin/tabs/AdminUsersTab";
import AdminPricingTab from "./admin/tabs/AdminPricingTab";
import AdminGodSettingsTab from "./admin/tabs/AdminGodSettingsTab";
import AdminMatchingTab from "./admin/tabs/AdminMatchingTab";
import AdminPremiumTab from "./admin/tabs/AdminPremiumTab";
import AdminRealtimeTab from "./admin/tabs/AdminRealtimeTab";
import AdminSettingsTab from "./admin/tabs/AdminSettingsTab";
import AdminMarketingTab from "./admin/tabs/AdminMarketingTab";
import AdminWhitepapersTab from "./admin/tabs/AdminWhitepapersTab";
import MetaCalculationsPage from "@/pages/MetaCalculationsPage";
import OpportunitiesDashboard from "@/pages/OpportunitiesDashboard";

/**
 * System Administrator Dashboard
 *
 * Access: Currently accessible to anyone (will be protected by Supabase Auth later)
 * Features: User management, use case manager, system settings, analytics
 *
 * DESIGN: Matches Merlin Wizard aesthetic - Supabase dark theme, rounded cards
 */

interface AdminStats {
  totalUsers: number;
  freeUsers: number;
  semiPremiumUsers: number;
  premiumUsers: number;
  quotesGeneratedToday: number;
  activeSessions: number;
  monthlyRevenue: number;
  systemHealth: "operational" | "degraded" | "down";
  uptime: number;
  apiResponseTime: number;
  errorRate: number;
  activeWorkflows: number;
  completedWorkflows: number;
  failedWorkflows: number;
}

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    | "dashboard"
    | "marketIntelligence"
    | "systemHealth"
    | "godSettings"
    | "matching"
    | "premium"
    | "realtime"
    | "workflows"
    | "health"
    | "users"
    | "analytics"
    | "settings"
    | "useCases"
    | "pricing"
    | "pricingHealth"
    | "calculations"
    | "cache"
    | "migration"
    | "aiData"
    | "marketing"
    | "opportunities"
    | "whitepapers"
  >(
    (() => {
      const p = new URLSearchParams(window.location.search).get("tab");
      const valid = [
        "dashboard",
        "marketIntelligence",
        "systemHealth",
        "godSettings",
        "matching",
        "premium",
        "realtime",
        "workflows",
        "health",
        "analytics",
        "users",
        "useCases",
        "pricing",
        "godSettings",
        "matching",
        "premium",
        "realtime",
        "settings",
        "marketing",
        "opportunities",
        "whitepapers",
      ];
      return (p && valid.includes(p) ? p : "dashboard") as
        | "dashboard"
        | "marketIntelligence"
        | "systemHealth"
        | "godSettings"
        | "matching"
        | "premium"
        | "realtime"
        | "workflows"
        | "health"
        | "users"
        | "analytics"
        | "settings"
        | "useCases"
        | "pricing"
        | "pricingHealth"
        | "calculations"
        | "cache"
        | "migration"
        | "aiData"
        | "marketing"
        | "opportunities"
        | "whitepapers";
    })()
  );
  // const [refreshInterval, setRefreshInterval] = useState<number>(30); // Unused
  const [showPricingAdmin, setShowPricingAdmin] = useState(false);

  // Real stats from Supabase
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    freeUsers: 0,
    semiPremiumUsers: 0,
    premiumUsers: 0,
    quotesGeneratedToday: 0,
    activeSessions: 0,
    monthlyRevenue: 0,
    systemHealth: "operational",
    uptime: 99.99,
    apiResponseTime: 0,
    errorRate: 0,
    activeWorkflows: 0,
    completedWorkflows: 0,
    failedWorkflows: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      setStatsLoading(true);
      try {
        // Server-side endpoint — uses service-role key, bypasses RLS
        const res = await fetch("/api/admin/stats");
        if (!res.ok) throw new Error(`Admin stats failed: ${res.status}`);
        const json = (await res.json()) as {
          success: boolean;
          stats: {
            totalUsers: number;
            freeUsers: number;
            paidUsers: number;
            tierBreakdown: Record<string, number>;
            quotesGeneratedToday: number;
            totalQuotes: number;
            qualifiedLeads: number;
            monthlyRevenue: number;
            activePaidSubs: number;
          };
        };
        if (!json.success) throw new Error("Admin stats returned success:false");
        const s = json.stats;
        setStats((prev) => ({
          ...prev,
          totalUsers: s.totalUsers,
          freeUsers: s.freeUsers,
          semiPremiumUsers: s.tierBreakdown["semi_premium"] ?? s.tierBreakdown["starter"] ?? 0,
          premiumUsers: s.tierBreakdown["premium"] ?? s.tierBreakdown["business"] ?? 0,
          quotesGeneratedToday: s.quotesGeneratedToday,
          activeSessions: s.activePaidSubs,
          monthlyRevenue: s.monthlyRevenue,
        }));
      } catch (e) {
        console.error("Failed to fetch admin stats", e);
      } finally {
        setStatsLoading(false);
      }
    }
    fetchStats();
  }, []);

  // Navigation panels - organized by category
  const navigationPanels = [
    {
      title: "Overview & Analytics",
      icon: BarChart3,
      items: [
        {
          key: "dashboard",
          label: "System Dashboard",
          icon: BarChart3,
          description: "System overview and statistics",
        },
        {
          key: "marketIntelligence",
          label: "Market Intelligence",
          icon: Brain,
          description: "AI-powered market analysis and trends",
          highlight: true,
        },
        {
          key: "analytics",
          label: "Analytics",
          icon: TrendingUp,
          description: "Business analytics and reports",
        },
      ],
    },
    {
      title: "System Health & Monitoring",
      icon: Activity,
      items: [
        {
          key: "systemHealth",
          label: "System Health",
          icon: Activity,
          description: "Comprehensive system health checks",
        },
        {
          key: "pricingHealth",
          label: "Pricing Health",
          icon: Gauge,
          description: "Pricing system status and validation",
        },
      ],
    },
    {
      title: "Configuration & Management",
      icon: Settings,
      items: [
        {
          key: "pricing",
          label: "Pricing Admin",
          icon: DollarSign,
          description: "Manage pricing configurations",
        },
        {
          key: "calculations",
          label: "Calculations",
          icon: Cpu,
          description: "Calculation engine management",
        },
        {
          key: "useCases",
          label: "Use Cases",
          icon: Layers,
          description: "Use case configuration",
        },
        {
          key: "aiData",
          label: "AI Data Collection",
          icon: Database,
          description: "AI training data management",
        },
        {
          key: "cache",
          label: "Cache Statistics",
          icon: Database,
          description: "Cache performance metrics",
        },
      ],
    },
    {
      title: "Advanced Features",
      icon: Sparkles,
      items: [
        {
          key: "matching",
          label: "Matching Engine",
          icon: Sparkles,
          description: "Live matching engine",
        },
        {
          key: "premium",
          label: "MERLIN Premium",
          icon: Crown,
          description: "Premium configuration management",
        },
        {
          key: "realtime",
          label: "Real-Time Monitor",
          icon: Activity,
          description: "Real-time system monitoring",
        },
        { key: "workflows", label: "Workflows", icon: Zap, description: "Workflow management" },
      ],
    },
    {
      title: "Administration",
      icon: Shield,
      items: [
        {
          key: "godSettings",
          label: "GOD Settings",
          icon: Shield,
          description: "System-level settings",
        },
        { key: "settings", label: "Settings", icon: Settings, description: "General settings" },
        {
          key: "marketing",
          label: "Marketing Kit",
          icon: Megaphone,
          description: "Email, LinkedIn & SMS outreach templates",
        },
        {
          key: "opportunities",
          label: "Lead Opportunities",
          icon: TrendingUp,
          description: "RFQs, energy projects & high-utility exposure leads",
          highlight: true,
        },
        {
          key: "whitepapers",
          label: "Whitepapers",
          icon: FileText,
          description: "Industry whitepapers ready for LinkedIn & share",
        },
      ],
    },
  ];

  // Premium Configuration State
  const [selectedPremiumUseCase, setSelectedPremiumUseCase] = useState<string>("hotel");
  return (
    <div className="min-h-screen bg-[#0f1117] relative overflow-hidden">
      {/* Subtle dark ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-500/[0.03] rounded-full blur-3xl"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-blue-500/[0.02] rounded-full blur-3xl"></div>
      </div>

      {/* Header - Wizard-like styling */}
      <div className="relative bg-white/[0.04] backdrop-blur-md border-b border-white/[0.08] shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <img
                  src={merlinImage}
                  alt="Merlin"
                  className="w-14 h-14 object-contain drop-shadow-lg"
                />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-full flex items-center justify-center">
                  <Shield className="w-3 h-3 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Merlin Admin Panel</h1>
                <p className="text-sm text-white/50">System Administration & Control</p>
              </div>
            </div>

            {/* Header right actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab("whitepapers")}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-blue-500/30 text-blue-400 hover:bg-blue-500/10 text-sm rounded-lg font-medium transition-all duration-200"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Whitepapers</span>
              </button>
              <button
                onClick={() => (window.location.href = import.meta.env.VITE_PUBLIC_URL || "/")}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 text-sm rounded-lg font-medium transition-all duration-200"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Exit</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Panels - Organized by category */}
      {activeTab === "dashboard" && (
        <div className="relative bg-white/[0.02] border-b border-white/[0.06]">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {navigationPanels.map((panel, panelIndex) => {
                const PanelIcon = panel.icon;
                return (
                  <div
                    key={panelIndex}
                    className="bg-white/[0.03] backdrop-blur-md rounded-xl border border-white/[0.08] shadow-lg shadow-black/10 p-4"
                  >
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/[0.08]">
                      <PanelIcon className="w-5 h-5 text-emerald-400" />
                      <h3 className="font-semibold text-white text-sm">{panel.title}</h3>
                    </div>
                    <div className="space-y-2">
                      {panel.items.map((item) => {
                        const ItemIcon = item.icon;
                        return (
                          <button
                            key={item.key}
                            onClick={() => {
                              if (item.key === "pricing") {
                                setShowPricingAdmin(true);
                                return;
                              }
                              setActiveTab(item.key as typeof activeTab);
                            }}
                            className={`w-full flex items-start gap-3 p-3 rounded-lg text-left transition-all duration-200 ${
                              activeTab === item.key
                                ? "bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-md"
                                : item.highlight
                                  ? "bg-white/[0.03] border border-white/[0.08] hover:border-white/[0.12] hover:shadow-md"
                                  : "bg-white/[0.03] hover:bg-white/[0.05] border border-transparent hover:border-white/[0.12]"
                            }`}
                          >
                            <ItemIcon
                              className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                                activeTab === item.key
                                  ? "text-white"
                                  : item.highlight
                                    ? "text-emerald-400"
                                    : "text-white/60"
                              }`}
                            />
                            <div className="flex-1 min-w-0">
                              <div
                                className={`font-medium text-sm ${
                                  activeTab === item.key ? "text-white" : "text-white"
                                }`}
                              >
                                {item.label}
                                {item.highlight && (
                                  <span className="ml-2 px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded-full font-semibold">
                                    NEW
                                  </span>
                                )}
                              </div>
                              <div
                                className={`text-xs mt-0.5 ${
                                  activeTab === item.key ? "text-white/80" : "text-white/50"
                                }`}
                              >
                                {item.description}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Back to Dashboard Button - Show when not on dashboard */}
      {activeTab !== "dashboard" && (
        <div className="relative bg-white/[0.03] backdrop-blur-md border-b border-white/[0.08]">
          <div className="max-w-7xl mx-auto px-6 py-3">
            <button
              onClick={() => setActiveTab("dashboard")}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg hover:from-emerald-700 hover:to-emerald-800 shadow-md transition-all duration-200"
            >
              <Home className="w-4 h-4" />
              <span className="font-medium">Back to Dashboard</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="relative max-w-7xl mx-auto px-6 py-6">
        {/* Market Intelligence Tab */}
        {activeTab === "marketIntelligence" && <MarketIntelligenceDashboard />}

        {/* System Health Tab */}
        {activeTab === "systemHealth" && <SystemHealthDashboard />}

        {/* Dashboard Tab */}
        {activeTab === "dashboard" && (
          <div className="admin-supabase space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="admin-title">System Overview</h2>
              <span className="admin-subtitle flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live
              </span>
            </div>

            <div className="admin-kpi-grid">
              <div className="admin-kpi-cell">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="admin-kpi-value">
                    {statsLoading ? "—" : stats.totalUsers.toLocaleString()}
                  </span>
                  <span className="admin-kpi-meta">
                    {statsLoading ? "…" : `${stats.freeUsers} free`}
                  </span>
                </div>
                <div className="admin-kpi-label mt-1">Total Users</div>
              </div>
              <div className="admin-kpi-cell">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="admin-kpi-value">
                    {statsLoading ? "—" : stats.quotesGeneratedToday}
                  </span>
                  <span className="admin-kpi-meta">today</span>
                </div>
                <div className="admin-kpi-label mt-1">Quotes Today</div>
              </div>
              <div className="admin-kpi-cell">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="admin-kpi-value">
                    {statsLoading ? "—" : `$${stats.monthlyRevenue.toLocaleString()}`}
                  </span>
                  <span className="admin-kpi-meta">active subs</span>
                </div>
                <div className="admin-kpi-label mt-1">Monthly Revenue</div>
              </div>
              <div className="admin-kpi-cell">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="admin-kpi-value">
                    {statsLoading ? "—" : stats.activeSessions}
                  </span>
                  <span className="admin-kpi-meta">paid</span>
                </div>
                <div className="admin-kpi-label mt-1">Active Paid Subs</div>
              </div>
            </div>

            <div>
              <div className="admin-section-label mb-2">Quick Actions</div>
              <div className="admin-action-grid">
                <button
                  type="button"
                  onClick={() => setActiveTab("useCases")}
                  className="admin-action-link"
                >
                  <FileText />
                  Use Cases
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("users")}
                  className="admin-action-link"
                >
                  <Users />
                  Users
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("analytics")}
                  className="admin-action-link"
                >
                  <TrendingUp />
                  Analytics
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("opportunities")}
                  className="admin-action-link"
                >
                  <TrendingUp />
                  Lead Opportunities
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("settings")}
                  className="admin-action-link"
                >
                  <Settings />
                  Settings
                </button>
              </div>
            </div>

            <div
              className={`admin-status-bar ${
                stats.systemHealth === "operational"
                  ? "admin-status-ok"
                  : stats.systemHealth === "degraded"
                    ? "admin-status-warn"
                    : "admin-status-error"
              }`}
            >
              <span>
                <span
                  className={`inline-block w-1.5 h-1.5 rounded-full mr-2 ${
                    stats.systemHealth === "operational"
                      ? "bg-emerald-400"
                      : stats.systemHealth === "degraded"
                        ? "bg-amber-400"
                        : "bg-red-400"
                  }`}
                />
                All systems {stats.systemHealth}
              </span>
              <span className="flex flex-wrap gap-4">
                <span>
                  Uptime <strong className="text-emerald-400">{stats.uptime}%</strong>
                </span>
                <span>
                  API <strong className="text-[var(--intel)]">{stats.apiResponseTime}ms</strong>
                </span>
                <span>
                  Errors <strong>{stats.errorRate}%</strong>
                </span>
              </span>
            </div>
          </div>
        )}

        {/* Workflows Tab */}
        {activeTab === "workflows" && <AdminWorkflowsTab stats={stats} />}

        {activeTab === "health" && <AdminHealthTab stats={stats} />}

        {activeTab === "analytics" && <AdminAnalyticsTab />}

        {activeTab === "users" && <AdminUsersTab />}

        {activeTab === "useCases" && <UseCaseConfigManager />}

        {activeTab === "pricing" && (
          <AdminPricingTab onOpenPricingAdmin={() => setShowPricingAdmin(true)} />
        )}

        {activeTab === "pricingHealth" && <SystemHealthDashboard />}

        {activeTab === "calculations" && <MetaCalculationsPage />}

        {activeTab === "godSettings" && <AdminGodSettingsTab />}

        {activeTab === "matching" && <AdminMatchingTab />}

        {activeTab === "premium" && (
          <AdminPremiumTab
            selectedPremiumUseCase={selectedPremiumUseCase}
            setSelectedPremiumUseCase={setSelectedPremiumUseCase}
          />
        )}

        {activeTab === "realtime" && <AdminRealtimeTab />}

        {activeTab === "migration" && (
          <div className="text-white/50 text-center py-12">
            Migration manager temporarily disabled.
          </div>
        )}

        {activeTab === "settings" && <AdminSettingsTab />}

        {activeTab === "marketing" && <AdminMarketingTab />}
        {activeTab === "opportunities" && <OpportunitiesDashboard />}
        {activeTab === "whitepapers" && <AdminWhitepapersTab />}

        {activeTab === "aiData" && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">AI Data Collection</h2>
                <p className="text-xs text-purple-400 font-medium">
                  Training data management &amp; pipeline status
                </p>
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                {
                  label: "Training Records",
                  value: "24,812",
                  change: "+142 today",
                  color: "purple",
                },
                {
                  label: "Pipeline Status",
                  value: "Active",
                  change: "3 jobs running",
                  color: "emerald",
                },
                {
                  label: "Model Accuracy",
                  value: "94.2%",
                  change: "+0.3% this week",
                  color: "blue",
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.08]"
                >
                  <p className="text-xs text-white/50 mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-emerald-400 mt-1">{stat.change}</p>
                </div>
              ))}
            </div>
            <div className="bg-white/[0.03] rounded-xl p-5 border border-white/[0.08]">
              <p className="text-sm text-white/60 text-center py-8">
                Full AI data pipeline dashboard — coming soon.
              </p>
            </div>
          </div>
        )}

        {activeTab === "cache" && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7c0-2-1-3-3-3H7C5 4 4 5 4 7z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 11h6M9 15h6"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Cache Statistics</h2>
                <p className="text-xs text-cyan-400 font-medium">
                  Cache performance &amp; hit rates
                </p>
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { label: "Hit Rate", value: "87.4%", change: "Last 24 hours", color: "cyan" },
                { label: "Cached Quotes", value: "1,204", change: "Active entries", color: "blue" },
                { label: "Avg TTL", value: "4.2h", change: "Time to live", color: "purple" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.08]"
                >
                  <p className="text-xs text-white/50 mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-cyan-400 mt-1">{stat.change}</p>
                </div>
              ))}
            </div>
            <div className="bg-white/[0.03] rounded-xl p-5 border border-white/[0.08]">
              <p className="text-sm text-white/60 text-center py-8">
                Detailed cache inspector — coming soon.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Pricing Admin Dashboard Modal */}
      <PricingAdminDashboard isOpen={showPricingAdmin} onClose={() => setShowPricingAdmin(false)} />
    </div>
  );
};

export default AdminDashboard;
