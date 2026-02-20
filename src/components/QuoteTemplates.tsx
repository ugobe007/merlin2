import React, { useState, useEffect } from "react";
import { TrueQuoteBadgeCanonical } from "@/components/shared/TrueQuoteBadgeCanonical";

interface QuoteTemplate {
  id: string;
  name: string;
  description: string;
  category: "commercial" | "residential" | "industrial" | "custom";
  sections: {
    executiveSummary: boolean;
    technicalSpecs: boolean;
    financialAnalysis: boolean;
    environmentalImpact: boolean;
    implementationTimeline: boolean;
    maintenancePlan: boolean;
    warranties: boolean;
    termsAndConditions: boolean;
    appendices: boolean;
  };
  customSections: Array<{
    id: string;
    title: string;
    content: string;
    order: number;
  }>;
  branding: {
    headerText?: string;
    footerText?: string;
    includeCompanyInfo: boolean;
    includeLogo: boolean;
  };
  formatting: {
    pageNumbers: boolean;
    tableOfContents: boolean;
    colorScheme: "professional" | "modern" | "minimal";
  };
  createdAt: string;
  updatedAt: string;
  isDefault: boolean;
}

interface QuoteTemplatesProps {
  onClose: () => void;
  onSelectTemplate: (template: QuoteTemplate) => void;
  userId: string;
}

const QuoteTemplates: React.FC<QuoteTemplatesProps> = ({ onClose, onSelectTemplate, userId }) => {
  const [activeTab, setActiveTab] = useState<"browse" | "create" | "manage">("browse");
  const [templates, setTemplates] = useState<QuoteTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<QuoteTemplate | null>(null);
  const [_isCreating, setIsCreating] = useState(false);

  // New template form state
  const [newTemplate, setNewTemplate] = useState<Partial<QuoteTemplate>>({
    name: "",
    description: "",
    category: "commercial",
    sections: {
      executiveSummary: true,
      technicalSpecs: true,
      financialAnalysis: true,
      environmentalImpact: false,
      implementationTimeline: true,
      maintenancePlan: false,
      warranties: true,
      termsAndConditions: true,
      appendices: false,
    },
    customSections: [],
    branding: {
      includeCompanyInfo: true,
      includeLogo: true,
    },
    formatting: {
      pageNumbers: true,
      tableOfContents: true,
      colorScheme: "professional",
    },
    isDefault: false,
  });

  // Load templates from localStorage
  useEffect(() => {
    const storedTemplates = localStorage.getItem(`quote_templates_${userId}`);
    if (storedTemplates) {
      setTemplates(JSON.parse(storedTemplates));
    } else {
      // Initialize with default templates
      const defaultTemplates = getDefaultTemplates();
      setTemplates(defaultTemplates);
      localStorage.setItem(`quote_templates_${userId}`, JSON.stringify(defaultTemplates));
    }
  }, [userId]);

  const getDefaultTemplates = (): QuoteTemplate[] => {
    return [
      {
        id: "default-commercial",
        name: "Commercial BESS Quote",
        description: "Comprehensive template for commercial battery energy storage projects",
        category: "commercial",
        sections: {
          executiveSummary: true,
          technicalSpecs: true,
          financialAnalysis: true,
          environmentalImpact: true,
          implementationTimeline: true,
          maintenancePlan: true,
          warranties: true,
          termsAndConditions: true,
          appendices: true,
        },
        customSections: [],
        branding: {
          headerText: "Battery Energy Storage Solution Proposal",
          footerText: "Confidential - For Review Only",
          includeCompanyInfo: true,
          includeLogo: true,
        },
        formatting: {
          pageNumbers: true,
          tableOfContents: true,
          colorScheme: "professional",
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isDefault: true,
      },
      {
        id: "default-residential",
        name: "Residential BESS Quote",
        description: "Simplified template for residential battery storage systems",
        category: "residential",
        sections: {
          executiveSummary: true,
          technicalSpecs: true,
          financialAnalysis: true,
          environmentalImpact: true,
          implementationTimeline: true,
          maintenancePlan: false,
          warranties: true,
          termsAndConditions: true,
          appendices: false,
        },
        customSections: [],
        branding: {
          headerText: "Your Home Energy Storage Solution",
          footerText: "",
          includeCompanyInfo: true,
          includeLogo: true,
        },
        formatting: {
          pageNumbers: false,
          tableOfContents: false,
          colorScheme: "modern",
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isDefault: true,
      },
      {
        id: "default-industrial",
        name: "Industrial/Utility Scale",
        description: "Detailed template for large-scale utility and industrial projects",
        category: "industrial",
        sections: {
          executiveSummary: true,
          technicalSpecs: true,
          financialAnalysis: true,
          environmentalImpact: true,
          implementationTimeline: true,
          maintenancePlan: true,
          warranties: true,
          termsAndConditions: true,
          appendices: true,
        },
        customSections: [
          {
            id: "grid-services",
            title: "Grid Services & Ancillary Revenue",
            content:
              "Details on frequency regulation, capacity markets, and demand response programs",
            order: 4,
          },
          {
            id: "interconnection",
            title: "Interconnection Requirements",
            content: "Utility interconnection process, studies, and timeline",
            order: 5,
          },
        ],
        branding: {
          headerText: "Utility-Scale Energy Storage Project Proposal",
          footerText: "Proprietary and Confidential",
          includeCompanyInfo: true,
          includeLogo: true,
        },
        formatting: {
          pageNumbers: true,
          tableOfContents: true,
          colorScheme: "professional",
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isDefault: true,
      },
      {
        id: "default-quick",
        name: "Quick Quote",
        description: "Fast, minimal template for preliminary pricing",
        category: "custom",
        sections: {
          executiveSummary: false,
          technicalSpecs: true,
          financialAnalysis: true,
          environmentalImpact: false,
          implementationTimeline: false,
          maintenancePlan: false,
          warranties: false,
          termsAndConditions: true,
          appendices: false,
        },
        customSections: [],
        branding: {
          includeCompanyInfo: true,
          includeLogo: false,
        },
        formatting: {
          pageNumbers: false,
          tableOfContents: false,
          colorScheme: "minimal",
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isDefault: true,
      },
    ];
  };

  const handleCreateTemplate = () => {
    if (!newTemplate.name) {
      alert("Please enter a template name");
      return;
    }

    const template: QuoteTemplate = {
      id: `template-${Date.now()}`,
      name: newTemplate.name,
      description: newTemplate.description || "",
      category: newTemplate.category || "custom",
      sections: newTemplate.sections!,
      customSections: newTemplate.customSections || [],
      branding: newTemplate.branding!,
      formatting: newTemplate.formatting!,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDefault: false,
    };

    const updatedTemplates = [...templates, template];
    setTemplates(updatedTemplates);
    localStorage.setItem(`quote_templates_${userId}`, JSON.stringify(updatedTemplates));

    setIsCreating(false);
    setActiveTab("manage");
    alert("Template created successfully!");
  };

  const handleDeleteTemplate = (templateId: string) => {
    if (confirm("Are you sure you want to delete this template?")) {
      const updatedTemplates = templates.filter((t) => t.id !== templateId);
      setTemplates(updatedTemplates);
      localStorage.setItem(`quote_templates_${userId}`, JSON.stringify(updatedTemplates));
    }
  };

  const handleSetDefaultTemplate = (templateId: string) => {
    const updatedTemplates = templates.map((t) => ({
      ...t,
      isDefault: t.id === templateId,
    }));
    setTemplates(updatedTemplates);
    localStorage.setItem(`quote_templates_${userId}`, JSON.stringify(updatedTemplates));
  };

  const addCustomSection = () => {
    const newSection = {
      id: `section-${Date.now()}`,
      title: "New Section",
      content: "",
      order: (newTemplate.customSections?.length || 0) + 1,
    };
    setNewTemplate({
      ...newTemplate,
      customSections: [...(newTemplate.customSections || []), newSection],
    });
  };

  const removeCustomSection = (sectionId: string) => {
    setNewTemplate({
      ...newTemplate,
      customSections: newTemplate.customSections?.filter((s) => s.id !== sectionId),
    });
  };

  const getSectionCount = (template: QuoteTemplate) => {
    const standardSections = Object.values(template.sections).filter(Boolean).length;
    const customSections = template.customSections.length;
    return standardSections + customSections;
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col relative overflow-hidden" style={{ background: '#0c1631', border: '1px solid rgba(255,255,255,0.08)' }}>
        {/* Certificate Seal Watermark */}
        <div className="absolute pointer-events-none" style={{ right: '-40px', bottom: '-40px', opacity: 0.03, zIndex: 0 }}>
          <svg width="380" height="380" viewBox="0 0 380 380" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Outer ring with notches */}
            <circle cx="190" cy="190" r="185" stroke="#fbbf24" strokeWidth="2" />
            <circle cx="190" cy="190" r="175" stroke="#fbbf24" strokeWidth="1" />
            {/* Decorative notches */}
            {Array.from({ length: 72 }).map((_, i) => {
              const angle = (i * 5 * Math.PI) / 180;
              const inner = i % 2 === 0 ? 168 : 172;
              return (
                <line
                  key={i}
                  x1={190 + inner * Math.cos(angle)}
                  y1={190 + inner * Math.sin(angle)}
                  x2={190 + 180 * Math.cos(angle)}
                  y2={190 + 180 * Math.sin(angle)}
                  stroke="#fbbf24"
                  strokeWidth="1"
                />
              );
            })}
            {/* Inner decorative circles */}
            <circle cx="190" cy="190" r="155" stroke="#fbbf24" strokeWidth="1.5" />
            <circle cx="190" cy="190" r="150" stroke="#fbbf24" strokeWidth="0.5" />
            <circle cx="190" cy="190" r="100" stroke="#fbbf24" strokeWidth="1" />
            <circle cx="190" cy="190" r="95" stroke="#fbbf24" strokeWidth="0.5" />
            {/* Star in center */}
            <path d="M190 130 L200 170 L240 170 L208 195 L218 235 L190 212 L162 235 L172 195 L140 170 L180 170Z" fill="#fbbf24" />
            {/* Text arcs - top */}
            <text fill="#fbbf24" fontSize="14" fontWeight="bold" letterSpacing="4">
              <textPath href="#topArc" startOffset="50%" textAnchor="middle">MERLIN TRUEQUOTE™</textPath>
            </text>
            <defs>
              <path id="topArc" d="M 50 190 A 140 140 0 0 1 330 190" />
              <path id="bottomArc" d="M 330 190 A 140 140 0 0 1 50 190" />
            </defs>
            {/* Text arcs - bottom */}
            <text fill="#fbbf24" fontSize="12" fontWeight="bold" letterSpacing="3">
              <textPath href="#bottomArc" startOffset="50%" textAnchor="middle">CERTIFIED • VERIFIED</textPath>
            </text>
          </svg>
        </div>

        {/* Header */}
        <div className="px-6 py-4 flex justify-between items-center rounded-t-2xl relative z-10" style={{ background: '#060d1f', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-2xl font-bold text-white">Quote Templates</h2>
              <TrueQuoteBadgeCanonical label="Certified" showTooltip={true} />
            </div>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Create and manage customizable quote templates for different project types
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/10 rounded-full w-10 h-10 flex items-center justify-center text-2xl font-bold transition-all"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 relative z-10" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex space-x-6">
            {[
              { id: "browse", label: "📋 Browse Templates", icon: "📋" },
              { id: "create", label: "✨ Create New", icon: "✨" },
              { id: "manage", label: "⚙️ Manage", icon: "⚙️" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? "border-amber-400 text-amber-300"
                    : "border-transparent text-gray-400 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 relative z-10" style={{ background: 'rgba(255,255,255,0.02)' }}>
          {/* Browse Tab */}
          {activeTab === "browse" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="rounded-lg p-4 hover:shadow-lg transition-all cursor-pointer backdrop-blur-sm group"
                  style={{
                    background: selectedTemplate?.id === template.id ? 'rgba(251,191,36,0.08)' : 'rgba(255,255,255,0.03)',
                    border: selectedTemplate?.id === template.id ? '1px solid rgba(251,191,36,0.3)' : '1px solid rgba(255,255,255,0.08)',
                  }}
                  onClick={() => setSelectedTemplate(template)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-lg text-white">{template.name}</h3>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {template.isDefault && (
                          <span className="inline-block px-2 py-0.5 text-xs rounded" style={{ background: 'rgba(16,185,129,0.15)', color: '#6ee7b7', border: '1px solid rgba(16,185,129,0.3)' }}>
                            ⭐ Default
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded" style={{ background: 'rgba(242,193,79,0.08)', border: '1px solid rgba(242,193,79,0.2)', color: '#f2c14f' }}>
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><circle cx="5" cy="5" r="4" stroke="#f2c14f" strokeWidth="1"/><path d="M3 5.2L4.5 6.5L7 3.8" stroke="#f2c14f" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          TrueQuote™
                        </span>
                      </div>
                    </div>
                    <span className="px-2 py-1 text-xs rounded capitalize" style={{ background: 'rgba(59,130,246,0.15)', color: '#93c5fd', border: '1px solid rgba(59,130,246,0.3)' }}>
                      {template.category}
                    </span>
                  </div>

                  <p className="text-sm text-gray-300 mb-3">{template.description}</p>

                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>{getSectionCount(template)} sections</span>
                    <span>{template.formatting.colorScheme} style</span>
                  </div>

                  {selectedTemplate?.id === template.id && (
                    <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                      <h4 className="font-semibold text-sm mb-2 text-white">Included Sections:</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(template.sections).map(
                          ([key, value]) =>
                            value && (
                              <div key={key} className="flex items-center text-xs">
                                <span className="text-emerald-400 mr-1">✓</span>
                                <span style={{ color: 'rgba(255,255,255,0.6)' }}>
                                  {key.replace(/([A-Z])/g, " $1").trim()}
                                </span>
                              </div>
                            )
                        )}
                        {template.customSections.map((section) => (
                          <div key={section.id} className="flex items-center text-xs">
                            <span className="text-blue-400 mr-1">✓</span>
                            <span style={{ color: 'rgba(255,255,255,0.6)' }}>{section.title}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Create Tab */}
          {activeTab === "create" && (
            <div className="max-w-3xl mx-auto space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  Template Name *
                </label>
                <input
                  type="text"
                  value={newTemplate.name || ""}
                  onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                  placeholder="e.g., Commercial Solar + Storage Quote"
                  className="w-full px-3 py-2 rounded-md text-white placeholder-gray-500 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'rgba(255,255,255,0.6)' }}>Description</label>
                <textarea
                  value={newTemplate.description || ""}
                  onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                  placeholder="Brief description of when to use this template"
                  rows={2}
                  className="w-full px-3 py-2 rounded-md text-white placeholder-gray-500 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'rgba(255,255,255,0.6)' }}>Category</label>
                <select
                  value={newTemplate.category}
                  onChange={(e) =>
                    setNewTemplate({ ...newTemplate, category: e.target.value as any })
                  }
                  className="w-full px-3 py-2 rounded-md text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  <option value="commercial">Commercial</option>
                  <option value="residential">Residential</option>
                  <option value="industrial">Industrial/Utility Scale</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  Standard Sections
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(newTemplate.sections || {}).map(([key, value]) => (
                    <label
                      key={key}
                      className="flex items-center p-2 rounded hover:bg-white/5 cursor-pointer"
                      style={{ border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) =>
                          setNewTemplate({
                            ...newTemplate,
                            sections: {
                              ...newTemplate.sections!,
                              [key]: e.target.checked,
                            },
                          })
                        }
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-300">{key.replace(/([A-Z])/g, " $1").trim()}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>Custom Sections</label>
                  <button
                    onClick={addCustomSection}
                    className="px-3 py-1 text-sm rounded transition-colors"
                    style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)' }}
                  >
                    + Add Section
                  </button>
                </div>
                {newTemplate.customSections && newTemplate.customSections.length > 0 ? (
                  <div className="space-y-2">
                    {newTemplate.customSections.map((section) => (
                      <div
                        key={section.id}
                        className="flex items-center gap-2 p-2 rounded"
                        style={{ border: '1px solid rgba(255,255,255,0.08)' }}
                      >
                        <input
                          type="text"
                          value={section.title}
                          onChange={(e) =>
                            setNewTemplate({
                              ...newTemplate,
                              customSections: newTemplate.customSections?.map((s) =>
                                s.id === section.id ? { ...s, title: e.target.value } : s
                              ),
                            })
                          }
                          placeholder="Section title"
                          className="flex-1 px-2 py-1 rounded text-sm text-white placeholder-gray-500"
                          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                        />
                        <button
                          onClick={() => removeCustomSection(section.id)}
                          className="text-red-400 hover:text-red-300 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm italic" style={{ color: 'rgba(255,255,255,0.4)' }}>No custom sections added</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  Formatting Style
                </label>
                <div className="flex gap-3">
                  {["professional", "modern", "minimal"].map((style) => (
                    <label key={style} className="flex-1">
                      <input
                        type="radio"
                        checked={newTemplate.formatting?.colorScheme === style}
                        onChange={() =>
                          setNewTemplate({
                            ...newTemplate,
                            formatting: {
                              ...newTemplate.formatting!,
                              colorScheme: style as any,
                            },
                          })
                        }
                        className="mr-2"
                      />
                      <span className="text-sm capitalize text-gray-300">{style}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newTemplate.formatting?.pageNumbers}
                    onChange={(e) =>
                      setNewTemplate({
                        ...newTemplate,
                        formatting: {
                          ...newTemplate.formatting!,
                          pageNumbers: e.target.checked,
                        },
                      })
                    }
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-300">Page Numbers</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newTemplate.formatting?.tableOfContents}
                    onChange={(e) =>
                      setNewTemplate({
                        ...newTemplate,
                        formatting: {
                          ...newTemplate.formatting!,
                          tableOfContents: e.target.checked,
                        },
                      })
                    }
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-300">Table of Contents</span>
                </label>
              </div>

              <button
                onClick={handleCreateTemplate}
                className="w-full py-3 rounded-md font-semibold transition-colors"
                style={{ background: '#fbbf24', color: '#000' }}
              >
                Create Template
              </button>
            </div>
          )}

          {/* Manage Tab */}
          {activeTab === "manage" && (
            <div className="space-y-3">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="rounded-lg p-4 flex justify-between items-center"
                  style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-white">{template.name}</h3>
                      {template.isDefault && (
                        <span className="px-2 py-1 text-xs rounded" style={{ background: 'rgba(16,185,129,0.15)', color: '#6ee7b7' }}>
                          Default
                        </span>
                      )}
                      <span className="px-2 py-1 text-xs rounded capitalize" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}>
                        {template.category}
                      </span>
                    </div>
                    <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>{template.description}</p>
                    <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      {getSectionCount(template)} sections • Created{" "}
                      {new Date(template.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {!template.isDefault && (
                      <button
                        onClick={() => handleSetDefaultTemplate(template.id)}
                        className="px-3 py-1 text-sm rounded transition-colors"
                        style={{ border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.7)' }}
                      >
                        Set as Default
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="px-3 py-1 text-sm rounded transition-colors"
                      style={{ color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}
                      disabled={template.isDefault}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 flex justify-between items-center relative z-10" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-md transition-colors"
              style={{ color: 'rgba(255,255,255,0.5)' }}
            >
              Cancel
            </button>
            <span className="text-xs hidden sm:inline-flex items-center gap-1.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="5" stroke="rgba(242,193,79,0.5)" strokeWidth="1"/><path d="M4 6.2L5.4 7.5L8 4.5" stroke="rgba(242,193,79,0.5)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/></svg>
              All quotes include TrueQuote™ source verification
            </span>
          </div>
          {activeTab === "browse" && selectedTemplate && (
            <button
              onClick={() => {
                onSelectTemplate(selectedTemplate);
                onClose();
              }}
              className="px-6 py-2.5 rounded-lg font-semibold transition-all flex items-center gap-2 hover:shadow-lg hover:shadow-amber-500/20"
              style={{ background: '#fbbf24', color: '#000' }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="#000" strokeWidth="1.5"/><path d="M4.5 7.2L6.3 9L9.5 5.5" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Use This Template
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuoteTemplates;
