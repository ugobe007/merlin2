import React, { useState } from "react";
import {
  Home,
  Users,
  Settings,
  TrendingUp,
  Database,
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
  >("dashboard");
  // const [refreshInterval, setRefreshInterval] = useState<number>(30); // Unused
  const [showPricingAdmin, setShowPricingAdmin] = useState(false);

  // Enhanced mock data (will be replaced with Supabase queries and real-time APIs)
  const stats: AdminStats = {
    totalUsers: 1247,
    freeUsers: 1100,
    semiPremiumUsers: 120,
    premiumUsers: 27,
    quotesGeneratedToday: 145,
    activeSessions: 23,
    monthlyRevenue: 3613,
    systemHealth: "operational",
    uptime: 99.97,
    apiResponseTime: 142,
    errorRate: 0.08,
    activeWorkflows: 8,
    completedWorkflows: 1247,
    failedWorkflows: 3,
  };

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

            {/* Exit to Home Button - Smaller, professional */}
            <button
              onClick={() => (window.location.href = "/")}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 text-sm rounded-lg font-medium transition-all duration-200"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Exit</span>
            </button>
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
                            onClick={() => setActiveTab(item.key as typeof activeTab)}
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
          <div className="space-y-5">
            {/* Section Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-lg flex items-center justify-center shadow-md shadow-emerald-500/10">
                  <BarChart3 className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-lg font-bold text-white">System Overview</h2>
              </div>
              <div className="flex items-center gap-2 text-xs text-white/50">
                <div className="w-1.5 h-1.5 bg-emerald-500/50 rounded-full animate-pulse"></div>
                Live
              </div>
            </div>

            {/* Stats Grid - Compact cards */}
            <div className="grid md:grid-cols-4 gap-4">
              {/* Total Users */}
              <div className="bg-white/[0.03] backdrop-blur-md rounded-xl p-4 border border-white/[0.08] shadow-lg shadow-black/10 hover:shadow-xl transition-all duration-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-sky-400 rounded-lg flex items-center justify-center">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-xs font-medium text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">
                    +12%
                  </span>
                </div>
                <p className="text-2xl font-bold text-white">{stats.totalUsers.toLocaleString()}</p>
                <p className="text-xs text-white/50 mt-0.5">Total Users</p>
                {/* Mini chart placeholder */}
                <div className="mt-2 flex items-end gap-0.5 h-6">
                  {[40, 65, 45, 70, 55, 80, 60].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-gradient-to-t from-blue-500/40 to-blue-500/10 rounded-sm"
                      style={{ height: `${h}%` }}
                    ></div>
                  ))}
                </div>
              </div>

              {/* Quotes Today */}
              <div className="bg-white/[0.03] backdrop-blur-md rounded-xl p-4 border border-emerald-500/10 shadow-lg shadow-emerald-500/5 hover:shadow-xl transition-all duration-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-xs font-medium text-emerald-400 bg-emerald-500/5 px-2 py-0.5 rounded-full">
                    +8%
                  </span>
                </div>
                <p className="text-2xl font-bold text-white">{stats.quotesGeneratedToday}</p>
                <p className="text-xs text-white/50 mt-0.5">Quotes Today</p>
                <div className="mt-2 flex items-end gap-0.5 h-6">
                  {[30, 50, 40, 75, 60, 85, 70].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-gradient-to-t from-emerald-500/40 to-emerald-500/10 rounded-sm"
                      style={{ height: `${h}%` }}
                    ></div>
                  ))}
                </div>
              </div>

              {/* Monthly Revenue */}
              <div className="bg-white/[0.03] backdrop-blur-md rounded-xl p-4 border border-white/[0.08] shadow-lg shadow-black/10 hover:shadow-xl transition-all duration-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    +15%
                  </span>
                </div>
                <p className="text-2xl font-bold text-white">
                  ${stats.monthlyRevenue.toLocaleString()}
                </p>
                <p className="text-xs text-white/50 mt-0.5">Monthly Revenue</p>
                <div className="mt-2 flex items-end gap-0.5 h-6">
                  {[45, 55, 50, 65, 70, 80, 90].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-gradient-to-t from-emerald-600/50 to-emerald-500/20 rounded-sm"
                      style={{ height: `${h}%` }}
                    ></div>
                  ))}
                </div>
              </div>

              {/* Active Sessions */}
              <div className="bg-white/[0.03] backdrop-blur-md rounded-xl p-4 border border-orange-500/10 shadow-lg shadow-orange-500/5 hover:shadow-xl transition-all duration-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg flex items-center justify-center">
                    <Activity className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-emerald-500/50 rounded-full animate-pulse"></div>
                    <span className="text-xs text-white/50">Live</span>
                  </div>
                </div>
                <p className="text-2xl font-bold text-white">{stats.activeSessions}</p>
                <p className="text-xs text-white/50 mt-0.5">Active Sessions</p>
                <div className="mt-2 flex items-end gap-0.5 h-6">
                  {[60, 45, 70, 55, 80, 65, 75].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-gradient-to-t from-orange-500/40 to-orange-500/10 rounded-sm"
                      style={{ height: `${h}%` }}
                    ></div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Actions - Compact professional buttons */}
            <div className="bg-white/[0.03] backdrop-blur-md rounded-xl p-5 border border-white/[0.08] shadow-lg shadow-black/10">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 bg-gradient-to-br from-amber-500 to-orange-500 rounded-md flex items-center justify-center">
                  <Zap className="w-3 h-3 text-white" />
                </div>
                <h3 className="text-sm font-bold text-white/80 uppercase tracking-wide">
                  Quick Actions
                </h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <button
                  onClick={() => setActiveTab("useCases")}
                  className="group flex items-center gap-2 p-3 bg-blue-500/5 hover:bg-white/[0.06] border border-white/[0.08] hover:border-white/[0.12] rounded-xl transition-all duration-200 hover:shadow-md"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center shadow-sm group-hover:scale-[1.02] transition-transform">
                    <FileText className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-medium text-white/80">Use Cases</span>
                </button>

                <button
                  onClick={() => setActiveTab("users")}
                  className="group flex items-center gap-2 p-3 bg-emerald-500/5 hover:bg-white/[0.06] border border-emerald-500/20 hover:border-emerald-500/30 rounded-xl transition-all duration-200 hover:shadow-md"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center shadow-sm group-hover:scale-[1.02] transition-transform">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-medium text-white/80">Users</span>
                </button>

                <button
                  onClick={() => setActiveTab("analytics")}
                  className="group flex items-center gap-2 p-3 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] hover:border-emerald-500/30 rounded-xl transition-all duration-200 hover:shadow-md"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-lg flex items-center justify-center shadow-sm group-hover:scale-[1.02] transition-transform">
                    <TrendingUp className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-medium text-white/80">Analytics</span>
                </button>

                <button
                  onClick={() => setActiveTab("settings")}
                  className="group flex items-center gap-2 p-3 bg-orange-500/5 hover:bg-white/[0.06] border border-orange-500/20 hover:border-orange-500/30 rounded-xl transition-all duration-200 hover:shadow-md"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg flex items-center justify-center shadow-sm group-hover:scale-[1.02] transition-transform">
                    <Settings className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-medium text-white/80">Settings</span>
                </button>
              </div>
            </div>

            {/* System Status Banner - Compact */}
            <div
              className={`rounded-xl p-3 flex items-center justify-between ${
                stats.systemHealth === "operational"
                  ? "bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-500/20"
                  : stats.systemHealth === "degraded"
                    ? "bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-500/20/50"
                    : "bg-gradient-to-r from-red-50 to-rose-50 border border-red-500/20/50"
              }`}
            >
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full animate-pulse ${
                    stats.systemHealth === "operational"
                      ? "bg-emerald-500/50"
                      : stats.systemHealth === "degraded"
                        ? "bg-amber-500/50"
                        : "bg-red-500/50"
                  }`}
                ></div>
                <span className="text-sm font-medium text-white/80">
                  All systems {stats.systemHealth}
                </span>
              </div>
              <div className="flex items-center gap-6 text-sm text-white/60">
                <span>
                  Uptime: <span className="font-semibold text-emerald-400">{stats.uptime}%</span>
                </span>
                <span>
                  API:{" "}
                  <span className="font-semibold text-blue-400">{stats.apiResponseTime}ms</span>
                </span>
                <span>
                  Errors: <span className="font-semibold text-white/80">{stats.errorRate}%</span>
                </span>
              </div>
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
      </div>

      {/* Pricing Admin Dashboard Modal */}
      <PricingAdminDashboard isOpen={showPricingAdmin} onClose={() => setShowPricingAdmin(false)} />
    </div>
  );
};

export default AdminDashboard;
