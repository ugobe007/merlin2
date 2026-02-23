// ⚠️ LEGACY COMPONENT - NEEDS MIGRATION
// This component uses OLD pricingConfigService (hardcoded values)
// TODO: Migrate to use useCaseService.getPricingConfig() for database-driven pricing
// See: /docs/CODE_LINK_AUDIT.md for migration instructions
//
// Current: pricingConfigService (hardcoded TypeScript objects)
// New: useCaseService (Supabase database, JSONB config_data)
// ====================================================================
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState, useEffect } from "react";
import { Settings, Download, Upload, RotateCcw, Save, CheckCircle } from "lucide-react";
import { pricingConfigService, type PricingConfiguration } from "../services/pricingConfigService";
import { dailyPricingValidator, type ValidationAlert } from "../services/dailyPricingValidator";
import { supabase } from "../services/supabase";
import { adminAuthService } from "../services/adminAuthService";
// REMOVED: pricingDatabaseService - archived, conflicts with new schema
// import { pricingDatabaseService, type DatabaseSyncResult } from '../services/pricingDatabaseService';
import { dailySyncService } from "../services/dailySyncService";
import generatorPricingService from "../services/generatorPricingService";
import solarPricingService from "../services/solarPricingService";
import windPricingService from "../services/windPricingService";
import powerElectronicsPricingService from "../services/powerElectronicsPricingService";
import { getSystemControlsPricingService } from "../services/systemControlsPricingService";
import PricingValidationSection from "./admin/pricing/PricingValidationSection";
import PricingBESSSection from "./admin/pricing/PricingBESSSection";
import PricingGeneratorSection from "./admin/pricing/PricingGeneratorSection";
import PricingSolarSection from "./admin/pricing/PricingSolarSection";
import PricingWindSection from "./admin/pricing/PricingWindSection";
import PricingPowerElectronicsSection from "./admin/pricing/PricingPowerElectronicsSection";
import PricingSystemControlsSection from "./admin/pricing/PricingSystemControlsSection";
import PricingEVChargingSection from "./admin/pricing/PricingEVChargingSection";
import PricingBOPSection from "./admin/pricing/PricingBOPSection";
import PricingDatabaseSection from "./admin/pricing/PricingDatabaseSection";

// Temporary type until migration complete
type DatabaseSyncResult = {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
};

interface PricingAdminProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PricingAdminDashboard: React.FC<PricingAdminProps> = ({ isOpen, onClose }) => {
  const [config, setConfig] = useState<PricingConfiguration>(
    pricingConfigService.getConfiguration()
  );
  const [activeSection, setActiveSection] = useState<string>("validation");
  const [hasChanges, setHasChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [validationAlerts, setValidationAlerts] = useState<ValidationAlert[]>([]);
  const [isValidating, setIsValidating] = useState(false);

  // Permission checks
  const canEdit = adminAuthService.hasPermission("edit_pricing");
  const canSave = adminAuthService.hasPermission("save_pricing");
  const canReset = adminAuthService.hasPermission("reset_to_defaults");
  const canImport = adminAuthService.hasPermission("import_config");
  const canSync = adminAuthService.hasPermission("sync_database");
  const _canExport = adminAuthService.hasPermission("export_config");
  const _currentAdmin = adminAuthService.getCurrentAdmin();

  // Editable pricing configurations
  const [editableGenerators, setEditableGenerators] = useState(
    generatorPricingService.getConfiguration()
  );
  const [editableSolar, setEditableSolar] = useState(solarPricingService.getConfiguration());
  const [editableWind, setEditableWind] = useState(windPricingService.getConfiguration());
  const [editablePowerElectronics, setEditablePowerElectronics] = useState(
    powerElectronicsPricingService.getConfiguration()
  );
  const [editableSystemControls, setEditableSystemControls] = useState(
    getSystemControlsPricingService().getConfiguration()
  );

  // Supabase integration state
  const [databaseStatus, setDatabaseStatus] = useState<
    "checking" | "connected" | "disconnected" | "error"
  >("checking");
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "success" | "error">("idle");
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [databaseStats, setDatabaseStats] = useState<Record<string, any>>({});
  const [syncResult, setSyncResult] = useState<DatabaseSyncResult | null>(null);

  useEffect(() => {
    if (isOpen) {
      setConfig(pricingConfigService.getConfiguration());
      setHasChanges(false);

      // Load latest validation results
      const validationResults = dailyPricingValidator.getLatestValidationResults();
      if (validationResults) {
        setValidationAlerts(validationResults.results);
      }

      // Check database connectivity
      checkDatabaseStatus();
      loadDatabaseStats();
    }
  }, [isOpen]);

  // Check Supabase database connectivity
  // ⚠️ DISABLED: pricingDatabaseService archived - use useCaseService instead
  const checkDatabaseStatus = async () => {
    setDatabaseStatus("checking");
    try {
      // Test connection to Supabase with a simple query
      // Try data_collection_log first (from AI system), fallback to any table
      const { data: _data, error } = await supabase
        .from("data_collection_log")
        .select("id")
        .limit(1);

      if (error) {
        console.error("Database connection error:", error);
        // Try alternative table if data_collection_log doesn't exist
        const { error: altError } = await supabase.from("use_case_templates").select("id").limit(1);

        if (altError) {
          console.error("Alternative table check failed:", altError);
          setDatabaseStatus("error");
        } else {
          setDatabaseStatus("connected");
          setLastSync(new Date().toISOString());
        }
      } else {
        setDatabaseStatus("connected");
        setLastSync(new Date().toISOString());
      }
    } catch (error) {
      setDatabaseStatus("error");
      console.error("Database status check failed:", error);
    }
  };

  // Load database statistics
  // ⚠️ DISABLED: pricingDatabaseService archived - use useCaseService instead
  const loadDatabaseStats = async () => {
    try {
      // TODO: Replace with useCaseService statistics methods
      // const stats = await pricingDatabaseService.getDatabaseStats();
      console.warn("⚠️ Database stats disabled - pricingDatabaseService archived");
      setDatabaseStats({});
    } catch (error) {
      console.error("Failed to load database stats:", error);
    }
  };

  // Sync configuration to Supabase
  // ⚠️ DISABLED: pricingDatabaseService archived - use useCaseService instead
  const syncToDatabase = async () => {
    if (!canSync) {
      alert("You do not have permission to sync to database.");
      return;
    }
    setSyncStatus("syncing");
    setSyncResult(null);

    try {
      // First save local changes
      if (hasChanges && canSave) {
        await saveChanges();
      }

      // TODO: Replace with useCaseService.updatePricingConfig()
      // const result = await pricingDatabaseService.syncLocalConfigToDatabase();
      console.warn("⚠️ Sync to database disabled - pricingDatabaseService archived");
      setSyncResult({
        success: false,
        message: "Sync temporarily disabled - service being migrated to useCaseService",
        error: "pricingDatabaseService archived",
      });
      setSyncStatus("error");

      // if (result.success) {
      //   setSyncStatus('success');
      //   setLastSync(new Date().toISOString());
      //   await loadDatabaseStats(); // Refresh stats
      // } else {
      //   setSyncStatus('error');
      // }
    } catch (error) {
      setSyncStatus("error");
      setSyncResult({
        success: false,
        message: "Sync failed",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  // Load configuration from Supabase
  // ⚠️ DISABLED: pricingDatabaseService archived - use useCaseService instead
  const loadFromDatabase = async () => {
    setSyncStatus("syncing");
    setSyncResult(null);

    try {
      // TODO: Replace with useCaseService.getPricingConfig()
      // const result = await pricingDatabaseService.loadConfigurationFromDatabase();
      console.warn("⚠️ Load from database disabled - pricingDatabaseService archived");
      setSyncResult({
        success: false,
        message: "Load temporarily disabled - service being migrated to useCaseService",
        error: "pricingDatabaseService archived",
      });
      setSyncStatus("error");

      // if (result.success) {
      //   // Reload local configuration
      //   const updatedConfig = pricingConfigService.getConfiguration();
      //   setConfig(updatedConfig);
      //   setHasChanges(false);
      //   setSyncStatus('success');
      // } else {
      //   setSyncStatus('error');
      // }
    } catch (error) {
      setSyncStatus("error");
      setSyncResult({
        success: false,
        message: "Load from database failed",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  // Run manual daily sync
  const runManualSync = async () => {
    setSyncStatus("syncing");
    try {
      const report = await dailySyncService.runManualSync();
      setSyncResult({
        success: report.failedJobs === 0,
        message: report.summary,
        data: report,
      });
      setSyncStatus(report.failedJobs === 0 ? "success" : "error");
      await loadDatabaseStats();
    } catch (error) {
      setSyncStatus("error");
      setSyncResult({
        success: false,
        message: "Manual sync failed",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  const runValidation = async () => {
    if (import.meta.env.DEV) console.log("🔄 runValidation called");
    setIsValidating(true);

    try {
      if (import.meta.env.DEV) console.log("🔄 Starting pricing validation...");

      // Validate that the service is available
      if (!dailyPricingValidator) {
        throw new Error("dailyPricingValidator is not available");
      }

      if (import.meta.env.DEV)
        console.log("✅ dailyPricingValidator found, calling forceValidation()...");
      const results = await dailyPricingValidator.forceValidation();
      if (import.meta.env.DEV) {
        console.log("✅ Validation complete:", results);
        console.log("📊 Results count:", results?.length || 0);
      }

      if (!results || !Array.isArray(results)) {
        console.warn("⚠️ Validation returned invalid results:", results);
        setValidationAlerts([]);
        alert("Validation completed but returned no results. Check console for details.");
        return;
      }

      setValidationAlerts(results);
      if (import.meta.env.DEV) console.log("✅ Validation alerts updated in state");

      // Show success message
      const criticalCount = results.filter((r) => r.severity === "critical").length;
      const warningCount = results.filter((r) => r.severity === "warning").length;
      const infoCount = results.filter((r) => r.severity === "info").length;

      if (import.meta.env.DEV)
        console.log(
          `📊 Validation summary: ${criticalCount} critical, ${warningCount} warnings, ${infoCount} info`
        );

      if (results.length === 0) {
        alert("Validation completed successfully. No alerts found.");
      } else {
        alert(
          `Validation completed. Found ${results.length} alert(s): ${criticalCount} critical, ${warningCount} warnings, ${infoCount} info.`
        );
      }
    } catch (error) {
      console.error("❌ Validation failed:", error);
      console.error("❌ Error stack:", error instanceof Error ? error.stack : "No stack trace");
      setValidationAlerts([]);

      // Show user-friendly error message
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      alert(
        `Validation failed: ${errorMessage}\n\nCheck the browser console (F12) for more details.`
      );
    } finally {
      setIsValidating(false);
      if (import.meta.env.DEV) console.log("✅ Validation process completed (finally block)");
    }
  };

  const updateConfigSection = (
    section: keyof PricingConfiguration,
    field: string,
    value: number | string
  ) => {
    if (!canEdit) {
      alert("You do not have permission to edit pricing configuration.");
      return;
    }
    const newConfig = {
      ...config,
      [section]: {
        ...(config[section] as any),
        [field]: typeof value === "string" ? value : Number(value),
      },
    };
    setConfig(newConfig);
    setHasChanges(true);
  };

  const saveChanges = () => {
    if (!canSave) {
      alert("You do not have permission to save pricing configuration.");
      return;
    }
    setSaveStatus("saving");
    try {
      pricingConfigService
        .updateConfiguration(config)
        .then(() => {
          setSaveStatus("saved");
          setHasChanges(false);
          setTimeout(() => setSaveStatus("idle"), 2000);
        })
        .catch((_error) => {
          setSaveStatus("error");
        });
    } catch (error) {
      setSaveStatus("error");
      console.error("Error saving configuration:", error);
    }
  };

  const resetToDefaults = () => {
    if (!canReset) {
      alert(
        "You do not have permission to reset pricing to defaults. This action requires super admin privileges."
      );
      return;
    }
    if (confirm("Are you sure you want to reset all pricing to defaults? This cannot be undone.")) {
      pricingConfigService.resetToDefaults().then(() => {
        setConfig(pricingConfigService.getConfiguration());
        setHasChanges(false);
        setSaveStatus("saved");
      });
    }
  };

  const exportConfig = () => {
    const dataStr = pricingConfigService.exportConfiguration();
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
    const exportFileDefaultName = `pricing-config-${new Date().toISOString().split("T")[0]}.json`;

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  };

  const importConfig = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!canImport) {
      alert(
        "You do not have permission to import pricing configuration. This action requires super admin privileges."
      );
      event.target.value = ""; // Clear file input
      return;
    }
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const configJson = e.target?.result as string;
          pricingConfigService.importConfiguration(configJson).then((success) => {
            if (success) {
              setConfig(pricingConfigService.getConfiguration());
              setHasChanges(false);
              setSaveStatus("saved");
            } else {
              alert("Invalid configuration file format");
            }
          });
        } catch (_error) {
          alert("Error importing configuration");
        }
      };
      reader.readAsText(file);
    }
  };

  // Helper functions for updating editable pricing configurations
  const updateGeneratorPrice = (generatorId: string, field: string, value: any) => {
    const updatedGenerators = { ...editableGenerators };
    const generatorIndex = updatedGenerators.generators.findIndex((g) => g.id === generatorId);
    if (generatorIndex >= 0) {
      (updatedGenerators.generators[generatorIndex] as any)[field] = value;
      setEditableGenerators(updatedGenerators);
      generatorPricingService.updateConfiguration(updatedGenerators);
      setHasChanges(true);
    }
  };

  const updateSolarPrice = (type: string, itemId: string, field: string, value: any) => {
    const updatedSolar = { ...editableSolar };
    if (type === "panels") {
      const itemIndex = updatedSolar.panels.findIndex((p) => p.id === itemId);
      if (itemIndex >= 0) {
        (updatedSolar.panels[itemIndex] as any)[field] = value;
      }
    } else if (type === "inverters") {
      const itemIndex = updatedSolar.inverters.findIndex((i) => i.id === itemId);
      if (itemIndex >= 0) {
        (updatedSolar.inverters[itemIndex] as any)[field] = value;
      }
    }
    setEditableSolar(updatedSolar);
    solarPricingService.updateConfiguration(updatedSolar);
    setHasChanges(true);
  };

  const updateWindPrice = (type: string, itemId: string, field: string, value: any) => {
    const updatedWind = { ...editableWind };
    if (type === "turbines") {
      const itemIndex = updatedWind.turbines.findIndex((t) => t.id === itemId);
      if (itemIndex >= 0) {
        (updatedWind.turbines[itemIndex] as any)[field] = value;
      }
    }
    setEditableWind(updatedWind);
    windPricingService.updateConfiguration(updatedWind);
    setHasChanges(true);
  };

  const updatePowerElectronicsPrice = (type: string, itemId: string, field: string, value: any) => {
    const updatedPE = { ...editablePowerElectronics };
    if (type === "inverters") {
      const itemIndex = updatedPE.inverters.findIndex((i) => i.id === itemId);
      if (itemIndex >= 0) {
        (updatedPE.inverters[itemIndex] as any)[field] = value;
      }
    } else if (type === "transformers") {
      const itemIndex = updatedPE.transformers.findIndex((t) => t.id === itemId);
      if (itemIndex >= 0) {
        (updatedPE.transformers[itemIndex] as any)[field] = value;
      }
    }
    setEditablePowerElectronics(updatedPE);
    powerElectronicsPricingService.updateConfiguration(updatedPE);
    setHasChanges(true);
  };

  const updateSystemControlsPrice = (type: string, itemId: string, field: string, value: any) => {
    const updatedControls = { ...editableSystemControls };
    if (type === "controllers") {
      const itemIndex = updatedControls.controllers.findIndex((c) => c.id === itemId);
      if (itemIndex >= 0) {
        (updatedControls.controllers[itemIndex] as any)[field] = value;
      }
    }
    setEditableSystemControls(updatedControls);
    getSystemControlsPricingService().updateConfiguration(updatedControls);
    setHasChanges(true);
  };

  if (!isOpen) return null;

  const sections = [
    { id: "validation", name: "Daily Validation", icon: "🔍" },
    { id: "database", name: "Supabase Sync", icon: "☁️" },
    { id: "bess", name: "BESS Systems", icon: "🔋" },
    { id: "solar", name: "Solar PV", icon: "☀️" },
    { id: "wind", name: "Wind Power", icon: "💨" },
    { id: "generators", name: "Generators", icon: "⚡" },
    { id: "powerElectronics", name: "Power Electronics", icon: "🔌" },
    { id: "evCharging", name: "EV Charging", icon: "🚗" },
    { id: "balanceOfPlant", name: "Balance of Plant", icon: "🏗️" },
    { id: "systemControls", name: "System Controls", icon: "📊" },
  ];

  const renderSectionContent = () => {
    switch (activeSection) {
      case "validation":
        return (
          <PricingValidationSection
            validationAlerts={validationAlerts}
            isValidating={isValidating}
            runValidation={runValidation}
          />
        );
      case "database":
        return (
          <PricingDatabaseSection
            databaseStatus={databaseStatus}
            syncStatus={syncStatus}
            lastSync={lastSync}
            databaseStats={databaseStats}
            syncResult={syncResult}
            syncToDatabase={syncToDatabase}
            loadFromDatabase={loadFromDatabase}
            runManualSync={runManualSync}
            checkDatabaseStatus={checkDatabaseStatus}
            canSync={canSync}
          />
        );
      case "bess":
        return <PricingBESSSection config={config} updateConfigSection={updateConfigSection} />;
      case "solar":
        return (
          <PricingSolarSection
            editableSolar={editableSolar}
            updateSolarPrice={updateSolarPrice}
            setEditableSolar={setEditableSolar}
            setHasChanges={setHasChanges}
          />
        );
      case "wind":
        return <PricingWindSection editableWind={editableWind} updateWindPrice={updateWindPrice} />;
      case "generators":
        return (
          <PricingGeneratorSection
            editableGenerators={editableGenerators}
            updateGeneratorPrice={updateGeneratorPrice}
            setEditableGenerators={setEditableGenerators}
            setHasChanges={setHasChanges}
          />
        );
      case "powerElectronics":
        return (
          <PricingPowerElectronicsSection
            editablePowerElectronics={editablePowerElectronics}
            updatePowerElectronicsPrice={updatePowerElectronicsPrice}
          />
        );
      case "systemControls":
        return (
          <PricingSystemControlsSection
            editableSystemControls={editableSystemControls}
            updateSystemControlsPrice={updateSystemControlsPrice}
            setEditableSystemControls={setEditableSystemControls}
            setHasChanges={setHasChanges}
          />
        );
      case "evCharging":
        return (
          <PricingEVChargingSection config={config} updateConfigSection={updateConfigSection} />
        );
      case "balanceOfPlant":
        return <PricingBOPSection config={config} updateConfigSection={updateConfigSection} />;
      default:
        return <div>Section content not yet implemented</div>;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-7xl w-full h-5/6 m-4 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <Settings className="w-6 h-6 text-purple-600" />
            <div>
              <h2 className="text-xl font-bold">Pricing Administration Dashboard</h2>
              <p className="text-sm text-gray-600">
                Version {config.version} • Last updated:{" "}
                {new Date(config.lastUpdated).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Save Status */}
            {saveStatus === "saving" && <span className="text-purple-600 text-sm">Saving...</span>}
            {saveStatus === "saved" && (
              <span className="text-green-600 text-sm flex items-center">
                <CheckCircle className="w-4 h-4 mr-1" /> Saved
              </span>
            )}
            {saveStatus === "error" && <span className="text-red-600 text-sm">Save failed</span>}

            {/* Action Buttons */}
            <button
              onClick={saveChanges}
              disabled={!hasChanges || saveStatus === "saving"}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </button>

            <button
              onClick={exportConfig}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>

            <label
              className={`bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center ${!canImport ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
              title={!canImport ? "You do not have permission to import configuration" : ""}
            >
              <Upload className="w-4 h-4 mr-2" />
              Import
              <input
                type="file"
                accept=".json"
                onChange={importConfig}
                className="hidden"
                disabled={!canImport}
              />
            </label>

            <button
              onClick={resetToDefaults}
              disabled={!canReset}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              title={!canReset ? "You do not have permission to reset to defaults" : ""}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </button>

            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              ✕
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-64 bg-gray-50 border-r overflow-y-auto">
            <div className="p-4">
              <h3 className="font-semibold text-gray-800 mb-4">Equipment Categories</h3>
              <nav className="space-y-2">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      activeSection === section.id
                        ? "bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 border border-purple-300 shadow-sm"
                        : "hover:bg-purple-50 text-gray-700"
                    }`}
                  >
                    <span className="mr-2">{section.icon}</span>
                    {section.name}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-4xl">
              <h3 className="text-lg font-semibold mb-6">
                {sections.find((s) => s.id === activeSection)?.icon}{" "}
                {sections.find((s) => s.id === activeSection)?.name} Configuration
              </h3>

              {renderSectionContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
