/**
 * SAVE SCENARIO MODAL
 * Modal for saving current quote as a comparison scenario
 */

import React, { useState } from 'react';
import { X, Save, Tag, FileText } from 'lucide-react';

interface SaveScenarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, options: { isBaseline?: boolean; tags?: string[]; notes?: string }) => Promise<void>;
  suggestedName?: string;
}

export function SaveScenarioModal({
  isOpen,
  onClose,
  onSave,
  suggestedName = '',
}: SaveScenarioModalProps) {
  const [name, setName] = useState(suggestedName);
  const [isBaseline, setIsBaseline] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const commonTags = [
    'Conservative',
    'Aggressive',
    'Balanced',
    'Solar-Heavy',
    'Storage-Only',
    'Backup-Focused',
    'ROI-Optimized',
  ];

  const toggleTag = (tag: string) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    
    setIsSaving(true);
    try {
      await onSave(name, { isBaseline, tags, notes });
      onClose();
    } catch (error) {
      console.error('Failed to save scenario:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#3ECF8E]/10 border border-[#3ECF8E]/20 flex items-center justify-center">
              <Save className="w-5 h-5 text-[#3ECF8E]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Save Scenario</h2>
              <p className="text-sm text-slate-400">
                Compare this quote with other options
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Scenario Name */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Scenario Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., 'Aggressive Solar + BESS'"
              className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#3ECF8E]/30"
            />
          </div>

          {/* Baseline Toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
            <div>
              <p className="text-sm font-medium text-white">Set as Baseline</p>
              <p className="text-xs text-slate-400">
                Use this as the reference for comparisons
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsBaseline(!isBaseline)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isBaseline ? 'bg-[#3ECF8E]' : 'bg-slate-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isBaseline ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Tags */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
              <Tag className="w-4 h-4" />
              Tags (optional)
            </label>
            <div className="flex flex-wrap gap-2">
              {commonTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    tags.includes(tag)
                      ? 'bg-[#3ECF8E] text-slate-900'
                      : 'bg-white/5 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
              <FileText className="w-4 h-4" />
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this scenario..."
              rows={3}
              className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#3ECF8E]/30 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 p-6 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-lg border border-white/10 bg-white/5 text-slate-300 font-medium hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!name.trim() || isSaving}
            className="flex-1 px-4 py-2.5 rounded-lg bg-[#3ECF8E] text-slate-900 font-bold hover:bg-[#35b87c] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {isSaving ? 'Saving...' : 'Save Scenario'}
          </button>
        </div>
      </div>
    </div>
  );
}
