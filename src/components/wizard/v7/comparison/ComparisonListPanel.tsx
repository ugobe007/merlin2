/**
 * COMPARISON LIST PANEL
 * Shows all saved scenarios with selection for comparison
 */

import React, { useState, useEffect } from "react";
import { Trash2, Edit2, Star, Tag } from "lucide-react";
import { getUserScenarios, deleteScenario } from "./comparisonService";
import type { SavedScenario } from "./types";

interface ComparisonListPanelProps {
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onCompare: () => void;
}

export function ComparisonListPanel({
  selectedIds,
  onSelectionChange,
  onCompare,
}: ComparisonListPanelProps) {
  const [scenarios, setScenarios] = useState<SavedScenario[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadScenarios();
  }, []);

  const loadScenarios = async () => {
    setIsLoading(true);
    const data = await getUserScenarios();
    setScenarios(data);
    setIsLoading(false);
  };

  const toggleSelection = (id: string) => {
    const newSelection = selectedIds.includes(id)
      ? selectedIds.filter((sid) => sid !== id)
      : [...selectedIds, id];
    onSelectionChange(newSelection);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this scenario?")) {
      await deleteScenario(id);
      await loadScenarios();
      onSelectionChange(selectedIds.filter((sid) => sid !== id));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-slate-400">Loading scenarios...</div>
      </div>
    );
  }

  if (scenarios.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-slate-400 mb-2">No saved scenarios yet</div>
        <p className="text-sm text-slate-500">
          Complete a quote and save it as a scenario to compare options
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white">Saved Scenarios ({scenarios.length})</h3>
        {selectedIds.length > 1 && (
          <button
            onClick={onCompare}
            className="px-4 py-2 rounded-lg bg-[#3ECF8E] text-slate-900 font-bold hover:bg-[#35b87c] transition-colors"
          >
            Compare Selected ({selectedIds.length})
          </button>
        )}
      </div>

      {/* Scenario List */}
      <div className="space-y-2">
        {scenarios.map((scenario) => {
          const isSelected = selectedIds.includes(scenario.id);
          return (
            <div
              key={scenario.id}
              className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                isSelected
                  ? "border-[#3ECF8E] bg-[#3ECF8E]/5"
                  : "border-white/10 bg-white/5 hover:bg-white/10"
              }`}
              onClick={() => toggleSelection(scenario.id)}
            >
              <div className="flex items-start gap-3">
                {/* Checkbox */}
                <div
                  className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                    isSelected ? "border-[#3ECF8E] bg-[#3ECF8E]" : "border-white/30"
                  }`}
                >
                  {isSelected && (
                    <svg
                      className="w-3 h-3 text-slate-900"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-white truncate">{scenario.scenarioName}</h4>
                    {scenario.isBaseline && (
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    )}
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs mb-2">
                    <div>
                      <span className="text-slate-500">Peak:</span>{" "}
                      <span className="text-slate-300 font-medium">
                        {scenario.peakKw?.toFixed(0) || 0} kW
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Capacity:</span>{" "}
                      <span className="text-slate-300 font-medium">
                        {scenario.kwhCapacity?.toFixed(0) || 0} kWh
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Cost:</span>{" "}
                      <span className="text-slate-300 font-medium">
                        ${(scenario.totalCost || 0).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Payback:</span>{" "}
                      <span className="text-slate-300 font-medium">
                        {scenario.paybackYears?.toFixed(1) || 0} yrs
                      </span>
                    </div>
                  </div>

                  {/* Tags */}
                  {scenario.tags && scenario.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {scenario.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 text-xs text-slate-400"
                        >
                          <Tag className="w-3 h-3" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Notes */}
                  {scenario.notes && (
                    <p className="text-xs text-slate-500 line-clamp-1">{scenario.notes}</p>
                  )}

                  {/* Date */}
                  <div className="text-xs text-slate-600 mt-1">
                    {new Date(scenario.createdAt).toLocaleDateString()}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // TODO: Open edit modal
                    }}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                    title="Edit scenario"
                  >
                    <Edit2 className="w-4 h-4 text-slate-400" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(scenario.id);
                    }}
                    className="p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                    title="Delete scenario"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Compare Button */}
      {selectedIds.length > 1 && (
        <div className="sticky bottom-0 pt-4 pb-2 bg-gradient-to-t from-slate-950 to-transparent">
          <button
            onClick={onCompare}
            className="w-full px-4 py-3 rounded-lg bg-[#3ECF8E] text-slate-900 font-bold hover:bg-[#35b87c] transition-colors"
          >
            Compare {selectedIds.length} Scenarios
          </button>
        </div>
      )}
    </div>
  );
}
