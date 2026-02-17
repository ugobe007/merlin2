/**
 * QUOTE TEMPLATE BUILDER PAGE
 * ============================
 *
 * Brand Kit (Pro) + Template Studio (Advanced) for customizing quote exports.
 *
 * Tabs:
 * 1. Brand Kit — logo, colors, company info
 * 2. Sections — toggle which sections appear in the export
 * 3. Layout — preset selection, custom text, footer/watermark options
 * 4. Saved Templates — manage named presets
 *
 * Tier gating:
 * - Builder/Guest: view-only preview (brand kit locked)
 * - Pro: Brand Kit unlocked, section toggles
 * - Advanced+: Full template studio (custom text, presets, white-label)
 *
 * Created: Feb 2026
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Palette,
  Layout,
  ToggleLeft,
  Save,
  RotateCcw,
  Upload,
  Trash2,
  Copy,
  Check,
  Lock,
  ArrowUpRight,
  Eye,
  FileText,
  Building2,
  Image,
  Type,
} from 'lucide-react';
import {
  loadQuoteTemplate,
  saveQuoteTemplate,
  resetQuoteTemplate,
  getSavedTemplates,
  saveNamedTemplate,
  deleteNamedTemplate,
  LAYOUT_PRESETS,
  DEFAULT_BRAND_KIT,
  DEFAULT_SECTIONS,
  DEFAULT_LAYOUT,
  type QuoteTemplate,
  type BrandKit,
  type TemplateSections,
  type TemplateLayout,
} from '@/services/quoteTemplateConfig';
import { getFeatureAvailability } from '@/services/featureGate';
import { getEffectiveTier, getPlan } from '@/services/subscriptionService';

// ============================================================================
// Sub-components
// ============================================================================

function TierLock({ feature, children }: { feature: string; children: React.ReactNode }) {
  return (
    <div className="relative">
      <div className="opacity-40 pointer-events-none select-none">{children}</div>
      <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 backdrop-blur-[2px] rounded-xl">
        <div className="text-center">
          <Lock className="w-6 h-6 text-amber-400 mx-auto mb-2" />
          <p className="text-sm text-slate-300 font-medium">Upgrade to unlock {feature}</p>
          <a
            href="/pricing"
            className="inline-flex items-center gap-1 mt-2 text-xs text-[#68BFFA] hover:text-[#4A90E2]"
          >
            View Plans <ArrowUpRight className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
}

function ColorPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <label className="text-sm text-slate-400 w-32">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 rounded cursor-pointer border border-slate-600"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-24 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white text-xs font-mono focus:border-[#68BFFA] focus:outline-none"
        />
      </div>
    </div>
  );
}

function SectionToggle({
  label,
  description,
  checked,
  onChange,
  locked,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  locked?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between p-4 bg-slate-800/60 border rounded-xl transition-all ${
        checked ? 'border-[#3B5BDB]/40' : 'border-slate-700/50'
      } ${locked ? 'opacity-50' : ''}`}
    >
      <div className="flex-1">
        <h4 className="text-white text-sm font-medium">{label}</h4>
        <p className="text-slate-400 text-xs mt-0.5">{description}</p>
      </div>
      <button
        onClick={() => !locked && onChange(!checked)}
        disabled={locked}
        className={`relative w-11 h-6 rounded-full transition-colors ${
          checked ? 'bg-[#3B5BDB]' : 'bg-slate-700'
        } ${locked ? 'cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <div
          className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
            checked ? 'left-[22px]' : 'left-0.5'
          }`}
        />
      </button>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function QuoteTemplatePage() {
  const [activeTab, setActiveTab] = useState<'brand' | 'sections' | 'layout' | 'saved'>('brand');
  const [template, setTemplate] = useState<QuoteTemplate>(loadQuoteTemplate());
  const [savedTemplates, setSavedTemplates] = useState<QuoteTemplate[]>(getSavedTemplates());
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');
  const [newTemplateName, setNewTemplateName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const features = getFeatureAvailability();
  const tier = getEffectiveTier();
  const plan = getPlan(tier);
  const isBrandKitUnlocked = features.brandKit; // Pro+
  const isStudioUnlocked = features.templateStudio; // Advanced+

  // Persist on every change
  useEffect(() => {
    saveQuoteTemplate(template);
  }, [template]);

  const updateBrandKit = useCallback((updates: Partial<BrandKit>) => {
    setTemplate((prev) => ({
      ...prev,
      brandKit: { ...prev.brandKit, ...updates },
    }));
  }, []);

  const updateSections = useCallback((updates: Partial<TemplateSections>) => {
    setTemplate((prev) => ({
      ...prev,
      sections: { ...prev.sections, ...updates },
    }));
  }, []);

  const updateLayout = useCallback((updates: Partial<TemplateLayout>) => {
    setTemplate((prev) => ({
      ...prev,
      layout: { ...prev.layout, ...updates },
    }));
  }, []);

  const handleLogoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500_000) {
      alert('Logo must be under 500 KB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      updateBrandKit({ logoBase64: reader.result as string });
    };
    reader.readAsDataURL(file);
  }, [updateBrandKit]);

  const handleSaveAsTemplate = useCallback(() => {
    if (!newTemplateName.trim()) return;
    const named = { ...template, name: newTemplateName.trim() };
    saveNamedTemplate(named);
    setSavedTemplates(getSavedTemplates());
    setNewTemplateName('');
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
  }, [template, newTemplateName]);

  const handleLoadTemplate = useCallback((t: QuoteTemplate) => {
    setTemplate({ ...t });
    saveQuoteTemplate(t);
  }, []);

  const handleDeleteTemplate = useCallback((name: string) => {
    if (!confirm(`Delete template "${name}"?`)) return;
    deleteNamedTemplate(name);
    setSavedTemplates(getSavedTemplates());
  }, []);

  const handleReset = useCallback(() => {
    if (!confirm('Reset template to defaults? This cannot be undone.')) return;
    resetQuoteTemplate();
    setTemplate(loadQuoteTemplate());
  }, []);

  const handleApplyPreset = useCallback((presetKey: string) => {
    const preset = LAYOUT_PRESETS[presetKey];
    if (!preset) return;
    updateSections(preset.sections as Partial<TemplateSections>);
    updateLayout({ preset: presetKey as TemplateLayout['preset'] });
  }, [updateSections, updateLayout]);

  // Tabs
  const tabs = [
    { key: 'brand' as const, label: 'Brand Kit', icon: <Palette className="w-4 h-4" />, tier: 'Pro' },
    { key: 'sections' as const, label: 'Sections', icon: <ToggleLeft className="w-4 h-4" />, tier: 'Pro' },
    { key: 'layout' as const, label: 'Layout & Text', icon: <Layout className="w-4 h-4" />, tier: 'Advanced' },
    { key: 'saved' as const, label: 'Saved Templates', icon: <Copy className="w-4 h-4" />, tier: 'Advanced' },
  ];

  // ──────────────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-[#1a103d] text-white">
      {/* Header */}
      <header className="border-b border-slate-800/50 bg-slate-900/80 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="text-[#68BFFA] hover:text-[#4A90E2] transition-colors text-sm">
              ← Back to Merlin
            </a>
            <div className="h-5 w-px bg-slate-700" />
            <h1 className="text-lg font-bold bg-gradient-to-r from-[#68BFFA] to-[#3B5BDB] bg-clip-text text-transparent">
              Quote Template Builder
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-3 py-1.5 text-slate-400 hover:text-white text-sm transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
            <span className="text-xs bg-transparent text-[#68BFFA] px-3 py-1 rounded-full border border-[#3B5BDB]/40">
              {plan.name} Plan
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 pt-6">
        {/* Tab navigation */}
        <div className="flex gap-2 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? 'bg-transparent text-[#68BFFA] border border-[#3B5BDB]/50'
                  : 'text-slate-400 hover:text-[#68BFFA] border border-transparent hover:border-slate-700'
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.tier && (
                <span className="text-[10px] bg-slate-700/50 text-slate-500 px-1.5 py-0.5 rounded-full">
                  {tab.tier}+
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ──────────────────────────────────── */}
        {/* TAB: Brand Kit                      */}
        {/* ──────────────────────────────────── */}
        {activeTab === 'brand' && (
          <div>
            {!isBrandKitUnlocked ? (
              <TierLock feature="Brand Kit">
                <BrandKitForm
                  brandKit={template.brandKit}
                  onChange={updateBrandKit}
                  onLogoUpload={handleLogoUpload}
                  fileInputRef={fileInputRef}
                />
              </TierLock>
            ) : (
              <BrandKitForm
                brandKit={template.brandKit}
                onChange={updateBrandKit}
                onLogoUpload={handleLogoUpload}
                fileInputRef={fileInputRef}
              />
            )}
          </div>
        )}

        {/* ──────────────────────────────────── */}
        {/* TAB: Sections                       */}
        {/* ──────────────────────────────────── */}
        {activeTab === 'sections' && (
          <div>
            {!isBrandKitUnlocked ? (
              <TierLock feature="Section Controls">
                <SectionsPanel sections={template.sections} onChange={updateSections} isAdvanced={isStudioUnlocked} />
              </TierLock>
            ) : (
              <SectionsPanel sections={template.sections} onChange={updateSections} isAdvanced={isStudioUnlocked} />
            )}
          </div>
        )}

        {/* ──────────────────────────────────── */}
        {/* TAB: Layout & Text                  */}
        {/* ──────────────────────────────────── */}
        {activeTab === 'layout' && (
          <div>
            {!isStudioUnlocked ? (
              <TierLock feature="Template Studio">
                <LayoutPanel
                  layout={template.layout}
                  onChange={updateLayout}
                  onApplyPreset={handleApplyPreset}
                />
              </TierLock>
            ) : (
              <LayoutPanel
                layout={template.layout}
                onChange={updateLayout}
                onApplyPreset={handleApplyPreset}
              />
            )}
          </div>
        )}

        {/* ──────────────────────────────────── */}
        {/* TAB: Saved Templates                */}
        {/* ──────────────────────────────────── */}
        {activeTab === 'saved' && (
          <div>
            {!isStudioUnlocked ? (
              <TierLock feature="Saved Templates">
                <SavedTemplatesPanel
                  templates={savedTemplates}
                  newName={newTemplateName}
                  onNewNameChange={setNewTemplateName}
                  onSave={handleSaveAsTemplate}
                  onLoad={handleLoadTemplate}
                  onDelete={handleDeleteTemplate}
                  saveStatus={saveStatus}
                />
              </TierLock>
            ) : (
              <SavedTemplatesPanel
                templates={savedTemplates}
                newName={newTemplateName}
                onNewNameChange={setNewTemplateName}
                onSave={handleSaveAsTemplate}
                onLoad={handleLoadTemplate}
                onDelete={handleDeleteTemplate}
                saveStatus={saveStatus}
              />
            )}
          </div>
        )}

        {/* Live preview */}
        <div className="mt-8 mb-12">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Eye className="w-5 h-5 text-[#68BFFA]" />
            Live Preview
          </h3>
          <TemplatePreview template={template} />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Panel Components
// ============================================================================

function BrandKitForm({
  brandKit,
  onChange,
  onLogoUpload,
  fileInputRef,
}: {
  brandKit: BrandKit;
  onChange: (u: Partial<BrandKit>) => void;
  onLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">Brand Kit</h2>
        <p className="text-slate-400 text-sm">
          Customize your quote exports with your company branding.
        </p>
      </div>

      {/* Logo upload */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
        <h3 className="text-white font-medium text-sm mb-3 flex items-center gap-2">
          <Image className="w-4 h-4 text-[#68BFFA]" />
          Company Logo
        </h3>
        <div className="flex items-center gap-4">
          {brandKit.logoBase64 ? (
            <div className="relative group">
              <img
                src={brandKit.logoBase64}
                alt="Logo"
                className="w-20 h-20 object-contain bg-white rounded-lg p-2"
              />
              <button
                onClick={() => onChange({ logoBase64: null })}
                className="absolute -top-2 -right-2 p-1 bg-red-600 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <div className="w-20 h-20 border-2 border-dashed border-slate-600 rounded-lg flex items-center justify-center text-slate-500">
              <Upload className="w-6 h-6" />
            </div>
          )}
          <div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 border border-slate-600 hover:border-[#68BFFA]/40 text-slate-300 hover:text-[#68BFFA] rounded-lg text-sm transition-all"
            >
              Upload Logo
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/svg+xml"
              onChange={onLogoUpload}
              className="hidden"
            />
            <p className="text-xs text-slate-500 mt-1">PNG, JPEG, or SVG. Max 500 KB.</p>
          </div>
        </div>
      </div>

      {/* Company info */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
        <h3 className="text-white font-medium text-sm mb-3 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-[#68BFFA]" />
          Company Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {([
            ['companyName', 'Company Name', 'Acme Energy Solutions'],
            ['tagline', 'Tagline', 'Powering the future'],
            ['contactName', 'Contact Name', 'Jane Doe'],
            ['contactEmail', 'Email', 'jane@acme.energy'],
            ['contactPhone', 'Phone', '+1 (555) 123-4567'],
            ['website', 'Website', 'https://acme.energy'],
            ['address', 'Address', '123 Energy Blvd, Suite 100'],
          ] as const).map(([key, label, placeholder]) => (
            <div key={key}>
              <label className="block text-xs text-slate-400 mb-1">{label}</label>
              <input
                type="text"
                value={brandKit[key]}
                onChange={(e) => onChange({ [key]: e.target.value })}
                placeholder={placeholder}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm placeholder:text-slate-600 focus:border-[#68BFFA] focus:outline-none"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Colors */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
        <h3 className="text-white font-medium text-sm mb-3 flex items-center gap-2">
          <Palette className="w-4 h-4 text-[#68BFFA]" />
          Brand Colors
        </h3>
        <div className="space-y-3">
          <ColorPicker label="Primary Color" value={brandKit.primaryColor} onChange={(v) => onChange({ primaryColor: v })} />
          <ColorPicker label="Accent Color" value={brandKit.accentColor} onChange={(v) => onChange({ accentColor: v })} />
          <ColorPicker label="Header Text" value={brandKit.headerTextColor} onChange={(v) => onChange({ headerTextColor: v })} />
        </div>
      </div>
    </div>
  );
}

function SectionsPanel({
  sections,
  onChange,
  isAdvanced,
}: {
  sections: TemplateSections;
  onChange: (u: Partial<TemplateSections>) => void;
  isAdvanced: boolean;
}) {
  const sectionDefs: Array<{ key: keyof TemplateSections; label: string; description: string; advancedOnly?: boolean }> = [
    { key: 'coverPage', label: 'Cover Page', description: 'Title page with project name, location, and date' },
    { key: 'executiveSummary', label: 'Executive Summary', description: 'Brief overview paragraph for decision-makers' },
    { key: 'systemSpecs', label: 'System Specifications', description: 'BESS size, duration, chemistry, inverter details' },
    { key: 'equipmentBreakdown', label: 'Equipment Breakdown', description: 'Line-item equipment costs with sources' },
    { key: 'financialAnalysis', label: 'Financial Analysis', description: 'ROI, NPV, IRR, payback period' },
    { key: 'savingsAnalysis', label: 'Savings Analysis', description: 'Demand charge savings, energy arbitrage potential' },
    { key: 'trueQuoteSources', label: 'TrueQuote™ Sources', description: 'Source attribution for every calculation' },
    { key: 'advancedAnalysis', label: 'Advanced Analysis', description: 'Monte Carlo, 8760 dispatch, sensitivity (Advanced+)', advancedOnly: true },
    { key: 'termsAndConditions', label: 'Terms & Conditions', description: 'Legal disclaimer and quote validity' },
    { key: 'engineeringAppendix', label: 'Engineering Appendix', description: 'Detailed technical notes and assumptions' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">Report Sections</h2>
        <p className="text-slate-400 text-sm">Toggle which sections appear in your exported quotes.</p>
      </div>
      <div className="space-y-3">
        {sectionDefs.map((s) => (
          <SectionToggle
            key={s.key}
            label={s.label}
            description={s.description}
            checked={sections[s.key]}
            onChange={(v) => onChange({ [s.key]: v })}
            locked={s.advancedOnly && !isAdvanced}
          />
        ))}
      </div>
    </div>
  );
}

function LayoutPanel({
  layout,
  onChange,
  onApplyPreset,
}: {
  layout: TemplateLayout;
  onChange: (u: Partial<TemplateLayout>) => void;
  onApplyPreset: (key: string) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">Layout & Custom Text</h2>
        <p className="text-slate-400 text-sm">Choose a layout preset and override default text.</p>
      </div>

      {/* Presets */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
        <h3 className="text-white font-medium text-sm mb-3">Layout Presets</h3>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(LAYOUT_PRESETS).map(([key, preset]) => (
            <button
              key={key}
              onClick={() => onApplyPreset(key)}
              className={`p-4 rounded-xl border text-left transition-all ${
                layout.preset === key
                  ? 'border-[#3B5BDB] bg-[#3B5BDB]/10'
                  : 'border-slate-700/50 hover:border-slate-600'
              }`}
            >
              <h4 className="text-white font-medium text-sm">{preset.label}</h4>
              <p className="text-slate-400 text-xs mt-1">{preset.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Custom text */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5 space-y-4">
        <h3 className="text-white font-medium text-sm flex items-center gap-2">
          <Type className="w-4 h-4 text-[#68BFFA]" />
          Custom Text
        </h3>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Cover Page Text</label>
          <textarea
            rows={3}
            value={layout.coverText}
            onChange={(e) => onChange({ coverText: e.target.value })}
            placeholder="Custom introduction text for the cover page..."
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm placeholder:text-slate-600 focus:border-[#68BFFA] focus:outline-none resize-none"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Terms & Conditions</label>
          <textarea
            rows={3}
            value={layout.termsText}
            onChange={(e) => onChange({ termsText: e.target.value })}
            placeholder="Custom terms, disclaimers, or legal text..."
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm placeholder:text-slate-600 focus:border-[#68BFFA] focus:outline-none resize-none"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Page Footer</label>
          <input
            type="text"
            value={layout.footerText}
            onChange={(e) => onChange({ footerText: e.target.value })}
            placeholder="Custom footer text..."
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm placeholder:text-slate-600 focus:border-[#68BFFA] focus:outline-none"
          />
        </div>
      </div>

      {/* Toggles */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5 space-y-3">
        <h3 className="text-white font-medium text-sm">Options</h3>
        {([
          ['pageNumbers', 'Page numbers'],
          ['dateStamp', 'Date stamp'],
          ['merlinWatermark', 'Merlin watermark'],
          ['trueQuoteBadge', 'TrueQuote™ badge'],
        ] as const).map(([key, label]) => (
          <label key={key} className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={layout[key]}
              onChange={(e) => onChange({ [key]: e.target.checked })}
              className="rounded bg-slate-700 border-slate-600 text-[#3B5BDB] focus:ring-[#3B5BDB]"
            />
            <span className="text-sm text-slate-300">{label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function SavedTemplatesPanel({
  templates,
  newName,
  onNewNameChange,
  onSave,
  onLoad,
  onDelete,
  saveStatus,
}: {
  templates: QuoteTemplate[];
  newName: string;
  onNewNameChange: (v: string) => void;
  onSave: () => void;
  onLoad: (t: QuoteTemplate) => void;
  onDelete: (name: string) => void;
  saveStatus: 'idle' | 'saved';
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">Saved Templates</h2>
        <p className="text-slate-400 text-sm">Save and reuse template configurations for different clients or use cases.</p>
      </div>

      {/* Save current as */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
        <h3 className="text-white font-medium text-sm mb-3">Save Current Configuration</h3>
        <div className="flex gap-3">
          <input
            type="text"
            value={newName}
            onChange={(e) => onNewNameChange(e.target.value)}
            placeholder="Template name..."
            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm placeholder:text-slate-600 focus:border-[#68BFFA] focus:outline-none"
          />
          <button
            onClick={onSave}
            disabled={!newName.trim()}
            className="flex items-center gap-2 px-4 py-2 border border-[#3B5BDB] text-[#68BFFA] hover:bg-[#3B5BDB]/10 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm transition-all"
          >
            {saveStatus === 'saved' ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saveStatus === 'saved' ? 'Saved!' : 'Save'}
          </button>
        </div>
      </div>

      {/* Saved list */}
      {templates.length > 0 ? (
        <div className="space-y-3">
          {templates.map((t) => (
            <div
              key={t.name}
              className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 flex items-center justify-between"
            >
              <div>
                <h4 className="text-white font-medium text-sm">{t.name}</h4>
                <p className="text-slate-500 text-xs">
                  Last updated: {new Date(t.updatedAt).toLocaleDateString()}
                  {t.brandKit.companyName && ` • ${t.brandKit.companyName}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onLoad(t)}
                  className="px-3 py-1.5 border border-slate-600 hover:border-[#68BFFA]/40 text-slate-300 hover:text-[#68BFFA] rounded-lg text-xs transition-all"
                >
                  Load
                </button>
                <button
                  onClick={() => onDelete(t.name)}
                  className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-slate-500">
          <FileText className="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p>No saved templates yet.</p>
          <p className="text-xs mt-1">Save your current configuration to reuse it later.</p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Live Preview
// ============================================================================

function TemplatePreview({ template }: { template: QuoteTemplate }) {
  const { brandKit, sections, layout } = template;
  const primaryColor = brandKit.primaryColor || '#1B8F5A';
  const accentColor = brandKit.accentColor || '#3ECF8E';
  const headerColor = brandKit.headerTextColor || '#1A1F36';

  return (
    <div className="bg-white rounded-xl shadow-2xl overflow-hidden max-w-2xl mx-auto">
      {/* Mini cover page */}
      {sections.coverPage && (
        <div className="p-8 border-b" style={{ borderColor: primaryColor }}>
          <div className="flex items-center justify-between mb-6">
            {brandKit.logoBase64 ? (
              <img src={brandKit.logoBase64} alt="Logo" className="h-10 object-contain" />
            ) : (
              <div className="text-lg font-bold" style={{ color: primaryColor }}>
                {brandKit.companyName || 'Your Company'}
              </div>
            )}
            {layout.trueQuoteBadge && (
              <span className="text-xs px-2 py-1 rounded-full border" style={{ borderColor: accentColor, color: primaryColor }}>
                TrueQuote™ Verified
              </span>
            )}
          </div>
          <h2 className="text-2xl font-bold" style={{ color: headerColor }}>
            BESS Proposal
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            {layout.coverText || 'Professional energy storage solution quote'}
          </p>
          {brandKit.tagline && (
            <p className="text-xs mt-3" style={{ color: primaryColor }}>{brandKit.tagline}</p>
          )}
        </div>
      )}

      {/* Section indicators */}
      <div className="p-6 space-y-3">
        {sections.executiveSummary && (
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: primaryColor }} />
            <span className="text-sm text-gray-700 font-medium">Executive Summary</span>
          </div>
        )}
        {sections.systemSpecs && (
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: primaryColor }} />
            <span className="text-sm text-gray-700 font-medium">System Specifications</span>
          </div>
        )}
        {sections.equipmentBreakdown && (
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: primaryColor }} />
            <span className="text-sm text-gray-700 font-medium">Equipment Breakdown</span>
          </div>
        )}
        {sections.financialAnalysis && (
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: accentColor }} />
            <span className="text-sm text-gray-700 font-medium">Financial Analysis</span>
          </div>
        )}
        {sections.savingsAnalysis && (
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: accentColor }} />
            <span className="text-sm text-gray-700 font-medium">Savings Analysis</span>
          </div>
        )}
        {sections.trueQuoteSources && (
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-[#68BFFA]" />
            <span className="text-sm text-gray-700 font-medium">TrueQuote™ Sources</span>
          </div>
        )}
        {sections.advancedAnalysis && (
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-[#3B5BDB]" />
            <span className="text-sm text-gray-700 font-medium">Advanced Analysis</span>
          </div>
        )}
        {sections.engineeringAppendix && (
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-slate-400" />
            <span className="text-sm text-gray-700 font-medium">Engineering Appendix</span>
          </div>
        )}
      </div>

      {/* Footer preview */}
      <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between text-xs text-gray-400">
        <span>{layout.footerText || (brandKit.companyName ? `© ${new Date().getFullYear()} ${brandKit.companyName}` : 'Merlin Energy')}</span>
        <div className="flex items-center gap-3">
          {layout.dateStamp && <span>{new Date().toLocaleDateString()}</span>}
          {layout.pageNumbers && <span>Page 1 of 5</span>}
        </div>
      </div>

      {/* Terms preview */}
      {sections.termsAndConditions && (
        <div className="px-6 py-3 bg-gray-50 text-[10px] text-gray-400 border-t border-gray-100">
          {layout.termsText || 'This quote is valid for 30 days. Pricing subject to change. All calculations verified by TrueQuote™ methodology.'}
        </div>
      )}
    </div>
  );
}
