import React, { useState, useEffect } from "react";

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
  const [isCreating, setIsCreating] = useState(false);

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
      <div className="bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col border-4 border-purple-400/60 ring-4 ring-purple-500/20">
        {/* Header */}
        <div className="px-6 py-4 border-b-4 border-purple-400/50 flex justify-between items-center bg-gradient-to-r from-purple-800 via-indigo-700 to-blue-700 rounded-t-2xl">
          <div>
            <h2 className="text-2xl font-bold text-white">Quote Templates</h2>
            <p className="text-sm text-purple-200 mt-1">
              Create and manage customizable quote templates for different project types
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full w-10 h-10 flex items-center justify-center text-2xl font-bold transition-all"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b-4 border-purple-400/50 px-6 bg-gradient-to-r from-slate-800/80 to-slate-700/80">
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
                    ? "border-purple-400 text-purple-300"
                    : "border-transparent text-gray-400 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-slate-800/50 to-slate-900/50">
          {/* Browse Tab */}
          {activeTab === "browse" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className={`border-2 rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer backdrop-blur-sm ${
                    selectedTemplate?.id === template.id
                      ? "border-purple-400/60 bg-gradient-to-br from-purple-500/30 to-violet-500/30"
                      : "border-purple-400/30 bg-slate-700/50 hover:border-purple-400/50"
                  }`}
                  onClick={() => setSelectedTemplate(template)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-lg text-white">{template.name}</h3>
                      {template.isDefault && (
                        <span className="inline-block px-2 py-1 text-xs bg-gradient-to-r from-emerald-500/30 to-teal-500/30 text-emerald-300 border border-emerald-400/50 rounded mt-1">
                          ⭐ Default
                        </span>
                      )}
                    </div>
                    <span className="px-2 py-1 text-xs bg-gradient-to-r from-purple-500/30 to-violet-500/30 text-purple-300 border border-purple-400/50 rounded capitalize">
                      {template.category}
                    </span>
                  </div>

                  <p className="text-sm text-gray-300 mb-3">{template.description}</p>

                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>{getSectionCount(template)} sections</span>
                    <span>{template.formatting.colorScheme} style</span>
                  </div>

                  {selectedTemplate?.id === template.id && (
                    <div className="mt-4 pt-4 border-t border-purple-400/30">
                      <h4 className="font-semibold text-sm mb-2">Included Sections:</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(template.sections).map(
                          ([key, value]) =>
                            value && (
                              <div key={key} className="flex items-center text-xs">
                                <span className="text-green-600 mr-1">✓</span>
                                <span className="text-gray-700">
                                  {key.replace(/([A-Z])/g, " $1").trim()}
                                </span>
                              </div>
                            )
                        )}
                        {template.customSections.map((section) => (
                          <div key={section.id} className="flex items-center text-xs">
                            <span className="text-blue-600 mr-1">✓</span>
                            <span className="text-gray-700">{section.title}</span>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template Name *
                </label>
                <input
                  type="text"
                  value={newTemplate.name || ""}
                  onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                  placeholder="e.g., Commercial Solar + Storage Quote"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={newTemplate.description || ""}
                  onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                  placeholder="Brief description of when to use this template"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={newTemplate.category}
                  onChange={(e) =>
                    setNewTemplate({ ...newTemplate, category: e.target.value as any })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
                >
                  <option value="commercial">Commercial</option>
                  <option value="residential">Residential</option>
                  <option value="industrial">Industrial/Utility Scale</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Standard Sections
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(newTemplate.sections || {}).map(([key, value]) => (
                    <label
                      key={key}
                      className="flex items-center p-2 border border-gray-200 rounded hover:bg-gray-50"
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
                      <span className="text-sm">{key.replace(/([A-Z])/g, " $1").trim()}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">Custom Sections</label>
                  <button
                    onClick={addCustomSection}
                    className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700"
                  >
                    + Add Section
                  </button>
                </div>
                {newTemplate.customSections && newTemplate.customSections.length > 0 ? (
                  <div className="space-y-2">
                    {newTemplate.customSections.map((section) => (
                      <div
                        key={section.id}
                        className="flex items-center gap-2 p-2 border border-gray-200 rounded"
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
                          className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                        <button
                          onClick={() => removeCustomSection(section.id)}
                          className="text-red-600 hover:text-red-700 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">No custom sections added</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                      <span className="text-sm capitalize">{style}</span>
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
                  <span className="text-sm">Page Numbers</span>
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
                  <span className="text-sm">Table of Contents</span>
                </label>
              </div>

              <button
                onClick={handleCreateTemplate}
                className="w-full py-3 bg-purple-600 text-white rounded-md font-semibold hover:bg-purple-700"
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
                  className="border border-gray-200 rounded-lg p-4 flex justify-between items-center"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{template.name}</h3>
                      {template.isDefault && (
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">
                          Default
                        </span>
                      )}
                      <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded capitalize">
                        {template.category}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {getSectionCount(template)} sections • Created{" "}
                      {new Date(template.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {!template.isDefault && (
                      <button
                        onClick={() => handleSetDefaultTemplate(template.id)}
                        className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                      >
                        Set as Default
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="px-3 py-1 text-sm text-red-600 border border-red-300 rounded hover:bg-red-50"
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
        <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
          >
            Cancel
          </button>
          {activeTab === "browse" && selectedTemplate && (
            <button
              onClick={() => {
                onSelectTemplate(selectedTemplate);
                onClose();
              }}
              className="px-6 py-2 bg-purple-600 text-white rounded-md font-semibold hover:bg-purple-700"
            >
              Use This Template
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuoteTemplates;
