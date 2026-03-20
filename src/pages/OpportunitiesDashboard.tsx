/**
 * Opportunities Dashboard
 * View and manage business leads from the opportunity scraper
 */

import React, { useState, useEffect } from "react";
import {
  Search,
  ExternalLink,
  CheckCircle,
  Archive,
  TrendingUp,
  Play,
  Sparkles,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { runOpportunityScraper } from "../api/opportunityScraper";
import type { Opportunity, OpportunityFilter, OpportunityStatus } from "../types/opportunity";

// Signal display names
const SIGNAL_LABELS: Record<string, string> = {
  construction: "🏗️ Construction",
  expansion: "📈 Expansion",
  new_opening: "🆕 New Opening",
  funding: "💰 Funding",
  acquisition: "🤝 Acquisition",
  sustainability_initiative: "🌱 Sustainability",
  energy_upgrade: "⚡ Energy Upgrade",
  facility_upgrade: "🔧 Facility Upgrade",
};

// Industry display names
const INDUSTRY_LABELS: Record<string, string> = {
  data_center: "🖥️ Data Center",
  manufacturing: "🏭 Manufacturing",
  logistics: "📦 Logistics",
  hospitality: "🏨 Hospitality",
  healthcare: "🏥 Healthcare",
  retail: "🛍️ Retail",
  education: "🎓 Education",
  automotive: "🚗 Automotive",
  other: "Other",
};

export function OpportunitiesDashboard() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [filteredOpportunities, setFilteredOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null);
  const [scraping, setScraping] = useState(false);

  // Filters
  const [filter, setFilter] = useState<OpportunityFilter>({
    status: ["new"],
    minConfidence: 30,
  });
  const [searchQuery, setSearchQuery] = useState("");

  // Load opportunities
  useEffect(() => {
    loadOpportunities();
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = [...opportunities];

    // Status filter
    if (filter.status && filter.status.length > 0) {
      filtered = filtered.filter((opp) => filter.status!.includes(opp.status));
    }

    // Confidence filter
    if (filter.minConfidence) {
      filtered = filtered.filter((opp) => opp.confidence_score >= filter.minConfidence!);
    }

    // Industry filter
    if (filter.industry && filter.industry.length > 0) {
      filtered = filtered.filter((opp) => opp.industry && filter.industry!.includes(opp.industry));
    }

    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (opp) =>
          opp.company_name.toLowerCase().includes(query) ||
          opp.description.toLowerCase().includes(query)
      );
    }

    setFilteredOpportunities(filtered);
  }, [opportunities, filter, searchQuery]);

  async function loadOpportunities() {
    try {
      const { data, error } = await supabase
        .from("opportunities")
        .select("*")
        .order("confidence_score", { ascending: false });

      if (error) throw error;

      setOpportunities(data || []);
    } catch (error) {
      console.error("Error loading opportunities:", error);
    } finally {
      setLoading(false);
    }
  }

  async function runScraper() {
    setScraping(true);
    try {
      const result = await runOpportunityScraper();
      if (result.success) {
        await loadOpportunities();
        alert(
          `✅ Scraper complete!\n\nFound: ${result.data?.total_found || 0} opportunities\nNew: ${result.data?.new_opportunities || 0}\nDuplicates: ${result.data?.duplicates_skipped || 0}`
        );
      } else {
        alert(`❌ Scraper failed: ${result.error}`);
      }
    } catch (error) {
      console.error("Scraper error:", error);
      alert("❌ Failed to run scraper");
    } finally {
      setScraping(false);
    }
  }

  async function updateStatus(oppId: string, newStatus: OpportunityStatus) {
    try {
      const updates: Partial<Opportunity> = {
        status: newStatus,
        updated_at: new Date().toISOString(),
      };

      if (newStatus === "contacted") {
        updates.contacted_at = new Date().toISOString();
      }

      const { error } = await supabase.from("opportunities").update(updates).eq("id", oppId);

      if (error) throw error;

      // Update local state
      setOpportunities((prev) =>
        prev.map((opp) => (opp.id === oppId ? { ...opp, ...updates } : opp))
      );

      if (selectedOpp?.id === oppId) {
        setSelectedOpp({ ...selectedOpp, ...updates });
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  }

  function getConfidenceColor(score: number) {
    if (score >= 70) return "text-emerald-400 bg-emerald-950/30 border-emerald-500/30";
    if (score >= 50) return "text-yellow-400 bg-yellow-950/30 border-yellow-500/30";
    return "text-slate-400 bg-slate-950/30 border-slate-500/30";
  }

  function getConfidenceLabel(score: number) {
    if (score >= 70) return "High";
    if (score >= 50) return "Medium";
    return "Low";
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-slate-400">Loading opportunities...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-emerald-950/20 to-slate-950 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent">
              Opportunity Dashboard
            </h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={runScraper}
              disabled={scraping}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 disabled:text-slate-400 text-white rounded-lg transition-colors font-semibold"
            >
              <Play className="w-4 h-4" />
              {scraping ? "Scraping..." : "Run Scraper"}
            </button>
            <button
              onClick={loadOpportunities}
              className="px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 rounded-lg text-emerald-400 hover:bg-emerald-500/30 transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>
        <p className="text-slate-400">
          Business leads discovered by Merlin&apos;s opportunity scraper
        </p>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto grid grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4">
          <div className="text-2xl font-bold text-white">{opportunities.length}</div>
          <div className="text-sm text-slate-400">Total Opportunities</div>
        </div>
        <div className="bg-emerald-900/30 backdrop-blur-sm border border-emerald-700/50 rounded-xl p-4">
          <div className="text-2xl font-bold text-emerald-400">
            {opportunities.filter((o) => o.status === "new").length}
          </div>
          <div className="text-sm text-slate-400">New</div>
        </div>
        <div className="bg-blue-900/30 backdrop-blur-sm border border-blue-700/50 rounded-xl p-4">
          <div className="text-2xl font-bold text-blue-400">
            {opportunities.filter((o) => o.status === "contacted").length}
          </div>
          <div className="text-sm text-slate-400">Contacted</div>
        </div>
        <div className="bg-purple-900/30 backdrop-blur-sm border border-purple-700/50 rounded-xl p-4">
          <div className="text-2xl font-bold text-purple-400">
            {opportunities.filter((o) => o.confidence_score >= 70).length}
          </div>
          <div className="text-sm text-slate-400">High Confidence</div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4 mb-6">
        <div className="grid grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search companies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Status filter */}
          <div>
            <select
              value={filter.status?.[0] || ""}
              onChange={(e) =>
                setFilter({
                  ...filter,
                  status: e.target.value ? [e.target.value as OpportunityStatus] : undefined,
                })
              }
              className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">All Status</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="qualified">Qualified</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {/* Confidence filter */}
          <div>
            <select
              value={filter.minConfidence || 0}
              onChange={(e) => setFilter({ ...filter, minConfidence: parseInt(e.target.value) })}
              className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="0">All Confidence</option>
              <option value="70">High (70+)</option>
              <option value="50">Medium (50+)</option>
              <option value="30">Low (30+)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Opportunities Table */}
      <div className="max-w-7xl mx-auto bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-800/50 border-b border-slate-700">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-semibold text-emerald-400">
                  Confidence
                </th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-emerald-400">
                  Company
                </th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-emerald-400">
                  Industry
                </th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-emerald-400">
                  Signals
                </th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-emerald-400">
                  Status
                </th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-emerald-400">Date</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-emerald-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredOpportunities.map((opp) => (
                <tr
                  key={opp.id}
                  className="hover:bg-slate-800/30 cursor-pointer transition-colors"
                  onClick={() => setSelectedOpp(opp)}
                >
                  <td className="px-4 py-3">
                    <div
                      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full border text-xs font-medium ${getConfidenceColor(opp.confidence_score)}`}
                    >
                      <TrendingUp className="w-3 h-3" />
                      {opp.confidence_score}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-white font-medium">{opp.company_name}</div>
                    <div className="text-xs text-slate-400 line-clamp-1">{opp.description}</div>
                  </td>
                  <td className="px-4 py-3">
                    {opp.industry && (
                      <div className="text-sm text-slate-300">{INDUSTRY_LABELS[opp.industry]}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {opp.signals.slice(0, 2).map((signal: string) => (
                        <span
                          key={signal}
                          className="text-xs px-2 py-0.5 bg-emerald-950/50 border border-emerald-800/30 rounded text-emerald-300"
                        >
                          {SIGNAL_LABELS[signal]?.split(" ")[0]}
                        </span>
                      ))}
                      {opp.signals.length > 2 && (
                        <span className="text-xs text-slate-400">+{opp.signals.length - 2}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        opp.status === "new"
                          ? "bg-blue-950/50 text-blue-400 border border-blue-800/30"
                          : opp.status === "contacted"
                            ? "bg-yellow-950/50 text-yellow-400 border border-yellow-800/30"
                            : opp.status === "qualified"
                              ? "bg-emerald-950/50 text-emerald-400 border border-emerald-800/30"
                              : "bg-slate-950/50 text-slate-400 border border-slate-800/30"
                      }`}
                    >
                      {opp.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-400">
                    {new Date(opp.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(opp.source_url, "_blank");
                        }}
                        className="p-1.5 hover:bg-slate-700/50 rounded transition-colors"
                        title="View source"
                      >
                        <ExternalLink className="w-4 h-4 text-slate-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredOpportunities.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              No opportunities found matching your filters
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedOpp && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6"
          onClick={() => setSelectedOpp(null)}
        >
          <div
            className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-800">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">{selectedOpp.company_name}</h2>
                  <div className="flex items-center gap-2">
                    <div
                      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full border text-xs font-medium ${getConfidenceColor(selectedOpp.confidence_score)}`}
                    >
                      <TrendingUp className="w-3 h-3" />
                      {getConfidenceLabel(selectedOpp.confidence_score)} (
                      {selectedOpp.confidence_score})
                    </div>
                    {selectedOpp.industry && (
                      <span className="text-sm text-slate-300">
                        {INDUSTRY_LABELS[selectedOpp.industry]}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedOpp(null)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              {/* Signals */}
              <div className="flex flex-wrap gap-2">
                {selectedOpp.signals.map((signal: string) => (
                  <span
                    key={signal}
                    className="text-sm px-3 py-1 bg-emerald-950/50 border border-emerald-800/30 rounded-full text-emerald-300"
                  >
                    {SIGNAL_LABELS[signal]}
                  </span>
                ))}
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div>
                <div className="text-sm text-emerald-400 font-semibold mb-1">Description</div>
                <p className="text-slate-300">{selectedOpp.description}</p>
              </div>

              <div>
                <div className="text-sm text-emerald-400 font-semibold mb-1">Source</div>
                <a
                  href={selectedOpp.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
                >
                  {selectedOpp.source_name}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-emerald-400 font-semibold mb-1">Status</div>
                  <div className="text-slate-300">{selectedOpp.status}</div>
                </div>
                <div>
                  <div className="text-sm text-emerald-400 font-semibold mb-1">Discovered</div>
                  <div className="text-slate-300">
                    {new Date(selectedOpp.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-6 border-t border-slate-800 flex gap-3">
              <button
                onClick={() => updateStatus(selectedOpp.id, "contacted")}
                disabled={selectedOpp.status === "contacted"}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 rounded-lg text-emerald-400 hover:bg-emerald-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle className="w-4 h-4" />
                Mark Contacted
              </button>
              <button
                onClick={() => updateStatus(selectedOpp.id, "qualified")}
                disabled={selectedOpp.status === "qualified"}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-500/20 border border-purple-500/30 rounded-lg text-purple-400 hover:bg-purple-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <TrendingUp className="w-4 h-4" />
                Mark Qualified
              </button>
              <button
                onClick={() => updateStatus(selectedOpp.id, "archived")}
                className="px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-400 hover:bg-slate-700 transition-colors"
              >
                <Archive className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OpportunitiesDashboard;
