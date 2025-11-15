// ⚠️ LEGACY COMPONENT - NEEDS MIGRATION
// This component uses OLD pricingConfigService (hardcoded values)
// TODO: Migrate to use useCaseService.getPricingConfig() for database-driven pricing
// See: /docs/CODE_LINK_AUDIT.md for migration instructions
// 
// Current: pricingConfigService (hardcoded TypeScript objects)
// New: useCaseService (Supabase database, JSONB config_data)
// ====================================================================

import React, { useState, useEffect } from 'react';
import { Settings, DollarSign, Database, Download, Upload, RotateCcw, Save, AlertTriangle, CheckCircle, RefreshCw, Bell, Cloud, CloudOff } from 'lucide-react';
import { pricingConfigService, type PricingConfiguration } from '../services/pricingConfigService';
import { dailyPricingValidator, type ValidationAlert } from '../services/dailyPricingValidator';
import { supabase } from '../services/supabase';
// REMOVED: pricingDatabaseService - archived, conflicts with new schema
// import { pricingDatabaseService, type DatabaseSyncResult } from '../services/pricingDatabaseService';
import { dailySyncService } from '../services/dailySyncService';
import generatorPricingService from '../services/generatorPricingService';
import solarPricingService from '../services/solarPricingService';
import windPricingService from '../services/windPricingService';
import powerElectronicsPricingService from '../services/powerElectronicsPricingService';
import systemControlsPricingService from '../services/systemControlsPricingService';

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
  const [config, setConfig] = useState<PricingConfiguration>(pricingConfigService.getConfiguration());
  const [activeSection, setActiveSection] = useState<string>('validation');
  const [hasChanges, setHasChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [validationAlerts, setValidationAlerts] = useState<ValidationAlert[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  
  // Editable pricing configurations
  const [editableGenerators, setEditableGenerators] = useState(generatorPricingService.getConfiguration());
  const [editableSolar, setEditableSolar] = useState(solarPricingService.getConfiguration());
  const [editableWind, setEditableWind] = useState(windPricingService.getConfiguration());
  const [editablePowerElectronics, setEditablePowerElectronics] = useState(powerElectronicsPricingService.getConfiguration());
  const [editableSystemControls, setEditableSystemControls] = useState(systemControlsPricingService.getConfiguration());
  
  // Supabase integration state
  const [databaseStatus, setDatabaseStatus] = useState<'checking' | 'connected' | 'disconnected' | 'error'>('checking');
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
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
    setDatabaseStatus('checking');
    try {
      // Test connection to Supabase by querying a simple table
      const { data, error } = await supabase
        .from('use_case_templates')
        .select('id')
        .limit(1);
      
      if (error) {
        console.error('Database connection error:', error);
        setDatabaseStatus('error');
      } else {
        setDatabaseStatus('connected');
        setLastSync(new Date().toISOString());
      }
    } catch (error) {
      setDatabaseStatus('error');
      console.error('Database status check failed:', error);
    }
  };

  // Load database statistics
  // ⚠️ DISABLED: pricingDatabaseService archived - use useCaseService instead
  const loadDatabaseStats = async () => {
    try {
      // TODO: Replace with useCaseService statistics methods
      // const stats = await pricingDatabaseService.getDatabaseStats();
      console.warn('⚠️ Database stats disabled - pricingDatabaseService archived');
      setDatabaseStats({});
    } catch (error) {
      console.error('Failed to load database stats:', error);
    }
  };

  // Sync configuration to Supabase
  // ⚠️ DISABLED: pricingDatabaseService archived - use useCaseService instead
  const syncToDatabase = async () => {
    setSyncStatus('syncing');
    setSyncResult(null);
    
    try {
      // First save local changes
      if (hasChanges) {
        await saveChanges();
      }
      
      // TODO: Replace with useCaseService.updatePricingConfig()
      // const result = await pricingDatabaseService.syncLocalConfigToDatabase();
      console.warn('⚠️ Sync to database disabled - pricingDatabaseService archived');
      setSyncResult({
        success: false,
        message: 'Sync temporarily disabled - service being migrated to useCaseService',
        error: 'pricingDatabaseService archived'
      });
      setSyncStatus('error');
      
      // if (result.success) {
      //   setSyncStatus('success');
      //   setLastSync(new Date().toISOString());
      //   await loadDatabaseStats(); // Refresh stats
      // } else {
      //   setSyncStatus('error');
      // }
    } catch (error) {
      setSyncStatus('error');
      setSyncResult({
        success: false,
        message: 'Sync failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // Load configuration from Supabase
  // ⚠️ DISABLED: pricingDatabaseService archived - use useCaseService instead
  const loadFromDatabase = async () => {
    setSyncStatus('syncing');
    setSyncResult(null);
    
    try {
      // TODO: Replace with useCaseService.getPricingConfig()
      // const result = await pricingDatabaseService.loadConfigurationFromDatabase();
      console.warn('⚠️ Load from database disabled - pricingDatabaseService archived');
      setSyncResult({
        success: false,
        message: 'Load temporarily disabled - service being migrated to useCaseService',
        error: 'pricingDatabaseService archived'
      });
      setSyncStatus('error');
      
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
      setSyncStatus('error');
      setSyncResult({
        success: false,
        message: 'Load from database failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // Run manual daily sync
  const runManualSync = async () => {
    setSyncStatus('syncing');
    try {
      const report = await dailySyncService.runManualSync();
      setSyncResult({
        success: report.failedJobs === 0,
        message: report.summary,
        data: report
      });
      setSyncStatus(report.failedJobs === 0 ? 'success' : 'error');
      await loadDatabaseStats();
    } catch (error) {
      setSyncStatus('error');
      setSyncResult({
        success: false,
        message: 'Manual sync failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  const runValidation = async () => {
    setIsValidating(true);
    try {
      const results = await dailyPricingValidator.forceValidation();
      setValidationAlerts(results);
    } catch (error) {
      console.error('Validation failed:', error);
    } finally {
      setIsValidating(false);
    }
  };

  const updateConfigSection = (section: keyof PricingConfiguration, field: string, value: number | string) => {
    const newConfig = {
      ...config,
      [section]: {
        ...(config[section] as any),
        [field]: typeof value === 'string' ? value : Number(value)
      }
    };
    setConfig(newConfig);
    setHasChanges(true);
  };

  const saveChanges = () => {
    setSaveStatus('saving');
    try {
      pricingConfigService.updateConfiguration(config);
      setSaveStatus('saved');
      setHasChanges(false);
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      setSaveStatus('error');
      console.error('Error saving configuration:', error);
    }
  };

  const resetToDefaults = () => {
    if (confirm('Are you sure you want to reset all pricing to defaults? This cannot be undone.')) {
      pricingConfigService.resetToDefaults();
      setConfig(pricingConfigService.getConfiguration());
      setHasChanges(false);
      setSaveStatus('saved');
    }
  };

  const exportConfig = () => {
    const dataStr = pricingConfigService.exportConfiguration();
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `pricing-config-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const importConfig = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const configJson = e.target?.result as string;
          if (pricingConfigService.importConfiguration(configJson)) {
            setConfig(pricingConfigService.getConfiguration());
            setHasChanges(false);
            setSaveStatus('saved');
          } else {
            alert('Invalid configuration file format');
          }
        } catch (error) {
          alert('Error importing configuration');
        }
      };
      reader.readAsText(file);
    }
  };

  // Helper functions for updating editable pricing configurations
  const updateGeneratorPrice = (generatorId: string, field: string, value: any) => {
    const updatedGenerators = { ...editableGenerators };
    const generatorIndex = updatedGenerators.generators.findIndex(g => g.id === generatorId);
    if (generatorIndex >= 0) {
      (updatedGenerators.generators[generatorIndex] as any)[field] = value;
      setEditableGenerators(updatedGenerators);
      generatorPricingService.updateConfiguration(updatedGenerators);
      setHasChanges(true);
    }
  };

  const updateSolarPrice = (type: string, itemId: string, field: string, value: any) => {
    const updatedSolar = { ...editableSolar };
    if (type === 'panels') {
      const itemIndex = updatedSolar.panels.findIndex(p => p.id === itemId);
      if (itemIndex >= 0) {
        (updatedSolar.panels[itemIndex] as any)[field] = value;
      }
    } else if (type === 'inverters') {
      const itemIndex = updatedSolar.inverters.findIndex(i => i.id === itemId);
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
    if (type === 'turbines') {
      const itemIndex = updatedWind.turbines.findIndex(t => t.id === itemId);
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
    if (type === 'inverters') {
      const itemIndex = updatedPE.inverters.findIndex(i => i.id === itemId);
      if (itemIndex >= 0) {
        (updatedPE.inverters[itemIndex] as any)[field] = value;
      }
    } else if (type === 'transformers') {
      const itemIndex = updatedPE.transformers.findIndex(t => t.id === itemId);
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
    if (type === 'controllers') {
      const itemIndex = updatedControls.controllers.findIndex(c => c.id === itemId);
      if (itemIndex >= 0) {
        (updatedControls.controllers[itemIndex] as any)[field] = value;
      }
    }
    setEditableSystemControls(updatedControls);
    systemControlsPricingService.updateConfiguration(updatedControls);
    setHasChanges(true);
  };

  if (!isOpen) return null;

  const sections = [
    { id: 'validation', name: 'Daily Validation', icon: '🔍' },
    { id: 'database', name: 'Supabase Sync', icon: '☁️' },
    { id: 'bess', name: 'BESS Systems', icon: '🔋' },
    { id: 'solar', name: 'Solar PV', icon: '☀️' },
    { id: 'wind', name: 'Wind Power', icon: '💨' },
    { id: 'generators', name: 'Generators', icon: '⚡' },
    { id: 'powerElectronics', name: 'Power Electronics', icon: '🔌' },
    { id: 'evCharging', name: 'EV Charging', icon: '🚗' },
    { id: 'balanceOfPlant', name: 'Balance of Plant', icon: '🏗️' },
    { id: 'systemControls', name: 'System Controls', icon: '📊' }
  ];

  const renderValidationSection = () => {
    const criticalAlerts = validationAlerts.filter(alert => alert.severity === 'critical');
    const warningAlerts = validationAlerts.filter(alert => alert.severity === 'warning');
    const infoAlerts = validationAlerts.filter(alert => alert.severity === 'info');

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Daily Pricing Validation</h3>
          <button
            onClick={runValidation}
            disabled={isValidating}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isValidating ? 'animate-spin' : ''}`} />
            {isValidating ? 'Validating...' : 'Run Validation'}
          </button>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-800 mb-2">🔍 Automated Daily Sound Checks</h4>
          <p className="text-sm text-blue-700">
            Pricing is automatically validated daily at 6 AM against NREL ATB 2024, BloombergNEF, Wood Mackenzie, 
            and other market intelligence sources. Deviations &gt;10% trigger alerts.
          </p>
        </div>

        {/* Alert Summary */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className={`p-4 rounded-lg border ${criticalAlerts.length > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
            <div className="flex items-center">
              <AlertTriangle className={`w-5 h-5 mr-2 ${criticalAlerts.length > 0 ? 'text-red-600' : 'text-green-600'}`} />
              <h4 className={`font-semibold ${criticalAlerts.length > 0 ? 'text-red-800' : 'text-green-800'}`}>Critical Alerts</h4>
            </div>
            <p className={`text-2xl font-bold ${criticalAlerts.length > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {criticalAlerts.length}
            </p>
          </div>

          <div className={`p-4 rounded-lg border ${warningAlerts.length > 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
            <div className="flex items-center">
              <Bell className={`w-5 h-5 mr-2 ${warningAlerts.length > 0 ? 'text-yellow-600' : 'text-green-600'}`} />
              <h4 className={`font-semibold ${warningAlerts.length > 0 ? 'text-yellow-800' : 'text-green-800'}`}>Warnings</h4>
            </div>
            <p className={`text-2xl font-bold ${warningAlerts.length > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
              {warningAlerts.length}
            </p>
          </div>

          <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 mr-2 text-gray-600" />
              <h4 className="font-semibold text-gray-800">Info</h4>
            </div>
            <p className="text-2xl font-bold text-gray-600">{infoAlerts.length}</p>
          </div>
        </div>

        {/* Detailed Alerts */}
        {validationAlerts.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-800">Validation Results</h4>
            {validationAlerts.map((alert, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  alert.severity === 'critical' 
                    ? 'bg-red-50 border-red-200' 
                    : alert.severity === 'warning'
                    ? 'bg-yellow-50 border-yellow-200'
                    : 'bg-blue-50 border-blue-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      {alert.severity === 'critical' && <AlertTriangle className="w-4 h-4 text-red-600 mr-2" />}
                      {alert.severity === 'warning' && <Bell className="w-4 h-4 text-yellow-600 mr-2" />}
                      {alert.severity === 'info' && <CheckCircle className="w-4 h-4 text-blue-600 mr-2" />}
                      <h5 className={`font-semibold ${
                        alert.severity === 'critical' ? 'text-red-800' : 
                        alert.severity === 'warning' ? 'text-yellow-800' : 'text-blue-800'
                      }`}>
                        {alert.category}
                      </h5>
                    </div>
                    <p className={`text-sm mb-2 ${
                      alert.severity === 'critical' ? 'text-red-700' : 
                      alert.severity === 'warning' ? 'text-yellow-700' : 'text-blue-700'
                    }`}>
                      {alert.message}
                    </p>
                    <div className="text-xs space-y-1">
                      <p><strong>Current Price:</strong> ${alert.currentPrice}</p>
                      <p><strong>Market Range:</strong> ${alert.marketRange.min} - ${alert.marketRange.max}</p>
                      <p><strong>Deviation:</strong> {alert.deviation.toFixed(1)}%</p>
                      <p><strong>Recommendation:</strong> {alert.recommendation}</p>
                      <p><strong>Sources:</strong> {alert.sources.join(', ')}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {validationAlerts.length === 0 && (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-gray-800 mb-2">All Pricing Validated ✓</h4>
            <p className="text-gray-600">Your pricing configuration is aligned with current market intelligence.</p>
          </div>
        )}
      </div>
    );
  };

  const renderBESSSection = () => (
    <div className="space-y-6">
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h4 className="font-semibold text-amber-800 mb-2">Size-Weighted BESS Pricing (MWh-Based)</h4>
        <p className="text-sm text-amber-700">{config.bess.vendorNotes}</p>
        <div className="mt-2 text-xs text-amber-600 space-y-1">
          <p>• 2 MWh System: ${config.bess.smallSystemPerKWh}/kWh</p>
          <p>• 8 MWh System: ${Math.round(config.bess.smallSystemPerKWh - 
            ((8 - config.bess.smallSystemSizeMWh) / 
            (config.bess.largeSystemSizeMWh - config.bess.smallSystemSizeMWh)) * 
            (config.bess.smallSystemPerKWh - config.bess.largeSystemPerKWh))}/kWh</p>
          <p>• 15+ MWh Systems: ${config.bess.largeSystemPerKWh}/kWh (floor)</p>
        </div>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-lg border">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Small System Price (${config.bess.smallSystemSizeMWh} MWh reference)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
            <input
              type="number"
              className="w-full pl-8 pr-16 py-2 border border-gray-300 rounded-md"
              value={config.bess.smallSystemPerKWh}
              onChange={(e) => updateConfigSection('bess', 'smallSystemPerKWh', e.target.value)}
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">/kWh</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Large System Floor (${config.bess.largeSystemSizeMWh}+ MWh)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
            <input
              type="number"
              className="w-full pl-8 pr-16 py-2 border border-gray-300 rounded-md"
              value={config.bess.largeSystemPerKWh}
              onChange={(e) => updateConfigSection('bess', 'largeSystemPerKWh', e.target.value)}
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">/kWh</span>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-lg border">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Small System Size Reference (MWh)
          </label>
          <input
            type="number"
            step="0.1"
            className="w-full py-2 border border-gray-300 rounded-md"
            value={config.bess.smallSystemSizeMWh}
            onChange={(e) => updateConfigSection('bess', 'smallSystemSizeMWh', e.target.value)}
          />
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Large System Threshold (MWh)
          </label>
          <input
            type="number"
            step="0.1"
            className="w-full py-2 border border-gray-300 rounded-md"
            value={config.bess.largeSystemSizeMWh}
            onChange={(e) => updateConfigSection('bess', 'largeSystemSizeMWh', e.target.value)}
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-lg border">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Degradation Rate (Annual)
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.001"
              className="w-full pr-8 py-2 border border-gray-300 rounded-md"
              value={config.bess.degradationRate}
              onChange={(e) => updateConfigSection('bess', 'degradationRate', e.target.value)}
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">%</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Warranty Period
          </label>
          <div className="relative">
            <input
              type="number"
              className="w-full pr-16 py-2 border border-gray-300 rounded-md"
              value={config.bess.warrantyYears}
              onChange={(e) => updateConfigSection('bess', 'warrantyYears', e.target.value)}
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">years</span>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg border">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Vendor Notes
        </label>
        <textarea
          className="w-full py-2 px-3 border border-gray-300 rounded-md"
          rows={3}
          value={config.bess.vendorNotes}
          onChange={(e) => updateConfigSection('bess', 'vendorNotes', e.target.value)}
        />
      </div>
    </div>
  );

  const renderGeneratorSection = () => {
    return (
      <div className="space-y-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-semibold text-green-800 mb-2">⚡ Generator Systems - Eaton Power Equipment</h4>
          <p className="text-sm text-green-700">
            Based on official Eaton quote: 200KW Cummins 6LTAA9.5-G260 Natural Gas generator at $64,200/unit.
            Includes Stamford alternator, Deepsea DSE8610 controller, and silent enclosure.
          </p>
        </div>

        {/* Editable Generator Models */}
        <div className="bg-white border rounded-lg p-6">
          <h4 className="font-semibold mb-4">Generator Models (Editable Pricing)</h4>
          <div className="grid gap-4">
            {editableGenerators.generators.map((generator) => (
              <div key={generator.id} className="border border-gray-200 rounded-lg p-4">
                <div className="grid md:grid-cols-6 gap-4 items-center">
                  <div>
                    <h5 className="font-semibold text-gray-900">{generator.model}</h5>
                    <p className="text-sm text-gray-600">{generator.manufacturer}</p>
                    <p className="text-xs text-blue-600 capitalize">{generator.fuelType.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Power (kW)</p>
                    <input
                      type="number"
                      value={generator.ratedPowerKW}
                      onChange={(e) => updateGeneratorPrice(generator.id, 'ratedPowerKW', parseInt(e.target.value))}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Base Price ($)</p>
                    <input
                      type="number"
                      value={generator.basePrice}
                      onChange={(e) => updateGeneratorPrice(generator.id, 'basePrice', parseInt(e.target.value))}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Price/kW ($)</p>
                    <input
                      type="number"
                      step="0.01"
                      value={generator.pricePerKW}
                      onChange={(e) => updateGeneratorPrice(generator.id, 'pricePerKW', parseFloat(e.target.value))}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Enclosure</p>
                    <select
                      value={generator.enclosure}
                      onChange={(e) => updateGeneratorPrice(generator.id, 'enclosure', e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:border-blue-500"
                    >
                      <option value="open">Open</option>
                      <option value="silent">Silent</option>
                      <option value="weather_proof">Weather Proof</option>
                      <option value="container">Container</option>
                    </select>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-green-600">
                      ${Math.round(generator.basePrice / generator.ratedPowerKW)}/kW
                    </p>
                    <p className="text-sm text-gray-500">
                      Total: ${generator.basePrice.toLocaleString()}
                    </p>
                  </div>
                </div>
                
                {generator.id === 'cummins-6ltaa95-g260-200kw' && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
                    <p className="text-sm text-green-800 font-medium">✓ Featured in Eaton Quote</p>
                    <p className="text-xs text-green-700">Original quote: $64,200 for 200kW unit with DSE8610 controller</p>
                  </div>
                )}

                <div className="mt-3 grid md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-gray-700">Engine Details:</p>
                    <p className="text-gray-600">{generator.engine.model}</p>
                    <p className="text-gray-600">{generator.engine.displacement}L, {generator.engine.cylinders} cylinders</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Controller:</p>
                    <p className="text-gray-600">{generator.controller.model}</p>
                    <p className="text-gray-600">{generator.controller.type}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Vendor:</p>
                    <p className="text-gray-600">{generator.vendor.company}</p>
                    <p className="text-gray-600">{generator.vendor.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Installation Costs */}
        <div className="bg-white border rounded-lg p-6">
          <h4 className="font-semibold mb-4">Installation & Operating Costs (Editable)</h4>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h5 className="font-medium text-gray-700 mb-3">Installation Costs (per unit)</h5>
              <div className="grid gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Foundation</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      value={editableGenerators.installationCosts.sitePreperation}
                      onChange={(e) => {
                        const updated = { ...editableGenerators };
                        updated.installationCosts.sitePreperation = parseInt(e.target.value);
                        setEditableGenerators(updated);
                        generatorPricingService.updateConfiguration(updated);
                        setHasChanges(true);
                      }}
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded focus:border-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Transportation</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      value={editableGenerators.installationCosts.electricalConnection}
                      onChange={(e) => {
                        const updated = { ...editableGenerators };
                        updated.installationCosts.electricalConnection = parseInt(e.target.value);
                        setEditableGenerators(updated);
                        generatorPricingService.updateConfiguration(updated);
                        setHasChanges(true);
                      }}
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h5 className="font-medium text-gray-700 mb-3">Operating Costs (annual per kW)</h5>
              <div className="grid gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Maintenance</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      value={editableGenerators.maintenanceCosts.annualPerKW}
                      onChange={(e) => {
                        const updated = { ...editableGenerators };
                        updated.maintenanceCosts.annualPerKW = parseInt(e.target.value);
                        setEditableGenerators(updated);
                        generatorPricingService.updateConfiguration(updated);
                        setHasChanges(true);
                      }}
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded focus:border-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Major Overhaul Cost per kW</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      value={editableGenerators.maintenanceCosts.majorOverhaulCostPerKW}
                      onChange={(e) => {
                        const updated = { ...editableGenerators };
                        updated.maintenanceCosts.majorOverhaulCostPerKW = parseInt(e.target.value);
                        setEditableGenerators(updated);
                        generatorPricingService.updateConfiguration(updated);
                        setHasChanges(true);
                      }}
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Calculator */}
        <div className="bg-white border rounded-lg p-6">
          <h4 className="font-semibold mb-4">Quick Cost Calculator</h4>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Generator Model</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                {editableGenerators.generators.map((gen) => (
                  <option key={gen.id} value={gen.id}>{gen.model} - {gen.ratedPowerKW}kW</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
              <input 
                type="number" 
                min="1" 
                defaultValue="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Include Installation</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                <option value="true">Yes</option>
                <option value="false">Equipment Only</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSolarSection = () => {
    return (
      <div className="space-y-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-semibold text-yellow-800 mb-2">☀️ Solar PV Systems</h4>
          <p className="text-sm text-yellow-700">
            Comprehensive solar panel, inverter, and mounting system pricing with industry-standard components.
          </p>
        </div>

        {/* Editable Solar Panels */}
        <div className="bg-white border rounded-lg p-6">
          <h4 className="font-semibold mb-4">Solar Panels (Editable Pricing)</h4>
          <div className="grid gap-3">
            {editableSolar.panels.map((panel) => (
              <div key={panel.id} className="grid md:grid-cols-7 gap-4 items-center border border-gray-200 rounded p-3">
                <div>
                  <h5 className="font-semibold text-sm">{panel.manufacturer}</h5>
                  <p className="text-xs text-gray-600">{panel.model}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-600">Power (W)</label>
                  <input
                    type="number"
                    value={panel.powerRatingW}
                    onChange={(e) => updateSolarPrice('panels', panel.id, 'powerRatingW', parseInt(e.target.value))}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600">Efficiency (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={panel.efficiency}
                    onChange={(e) => updateSolarPrice('panels', panel.id, 'efficiency', parseFloat(e.target.value))}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600">Technology</label>
                  <select
                    value={panel.technology}
                    onChange={(e) => updateSolarPrice('panels', panel.id, 'technology', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                  >
                    <option value="monocrystalline">Monocrystalline</option>
                    <option value="polycrystalline">Polycrystalline</option>
                    <option value="thin_film">Thin Film</option>
                    <option value="bifacial">Bifacial</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-600">Price per Watt</label>
                  <div className="relative">
                    <span className="absolute left-1 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs">$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={panel.pricePerWatt}
                      onChange={(e) => {
                        const newPricePerWatt = parseFloat(e.target.value);
                        updateSolarPrice('panels', panel.id, 'pricePerWatt', newPricePerWatt);
                        updateSolarPrice('panels', panel.id, 'pricePerPanel', newPricePerWatt * panel.powerRatingW);
                      }}
                      className="w-full pl-4 pr-2 py-1 text-sm border border-gray-300 rounded"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-600">Price per Panel</label>
                  <div className="relative">
                    <span className="absolute left-1 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs">$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={panel.pricePerPanel}
                      onChange={(e) => {
                        const newPricePerPanel = parseFloat(e.target.value);
                        updateSolarPrice('panels', panel.id, 'pricePerPanel', newPricePerPanel);
                        updateSolarPrice('panels', panel.id, 'pricePerWatt', newPricePerPanel / panel.powerRatingW);
                      }}
                      className="w-full pl-4 pr-2 py-1 text-sm border border-gray-300 rounded"
                    />
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-blue-600">${panel.pricePerWatt}/W</p>
                  <p className="text-xs text-gray-500">${panel.pricePerPanel}/panel</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Editable Inverters */}
        <div className="bg-white border rounded-lg p-6">
          <h4 className="font-semibold mb-4">Inverters (Editable Pricing)</h4>
          <div className="grid gap-3">
            {editableSolar.inverters.map((inverter) => (
              <div key={inverter.id} className="grid md:grid-cols-6 gap-4 items-center border border-gray-200 rounded p-3">
                <div>
                  <h5 className="font-semibold text-sm">{inverter.manufacturer}</h5>
                  <p className="text-xs text-gray-600">{inverter.model}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-600">Power (W)</label>
                  <input
                    type="number"
                    value={inverter.powerRatingW}
                    onChange={(e) => updateSolarPrice('inverters', inverter.id, 'powerRatingW', parseInt(e.target.value))}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600">Type</label>
                  <select
                    value={inverter.type}
                    onChange={(e) => updateSolarPrice('inverters', inverter.id, 'type', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                  >
                    <option value="string">String</option>
                    <option value="power_optimizer">Power Optimizer</option>
                    <option value="microinverter">Microinverter</option>
                    <option value="central">Central</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-600">Efficiency (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={inverter.efficiency}
                    onChange={(e) => updateSolarPrice('inverters', inverter.id, 'efficiency', parseFloat(e.target.value))}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600">Price per Watt</label>
                  <div className="relative">
                    <span className="absolute left-1 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs">$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={inverter.pricePerWatt}
                      onChange={(e) => {
                        const newPricePerWatt = parseFloat(e.target.value);
                        updateSolarPrice('inverters', inverter.id, 'pricePerWatt', newPricePerWatt);
                        updateSolarPrice('inverters', inverter.id, 'pricePerUnit', newPricePerWatt * inverter.powerRatingW);
                      }}
                      className="w-full pl-4 pr-2 py-1 text-sm border border-gray-300 rounded"
                    />
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">${inverter.pricePerWatt}/W</p>
                  <p className="text-xs text-gray-500">${inverter.pricePerUnit}/unit</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Installation Costs */}
        <div className="bg-white border rounded-lg p-6">
          <h4 className="font-semibold mb-4">Installation & Component Costs (Editable per kW)</h4>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h5 className="font-medium text-gray-700 mb-3">Installation Costs</h5>
              <div className="grid gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Design & Permitting</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      value={editableSolar.installationCosts.designAndPermitting}
                      onChange={(e) => {
                        const updated = { ...editableSolar };
                        updated.installationCosts.designAndPermitting = parseInt(e.target.value);
                        setEditableSolar(updated);
                        solarPricingService.updateConfiguration(updated);
                        setHasChanges(true);
                      }}
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded focus:border-blue-500"
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">/kW</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Labor</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      value={editableSolar.installationCosts.laborPerKW}
                      onChange={(e) => {
                        const updated = { ...editableSolar };
                        updated.installationCosts.laborPerKW = parseInt(e.target.value);
                        setEditableSolar(updated);
                        solarPricingService.updateConfiguration(updated);
                        setHasChanges(true);
                      }}
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded focus:border-blue-500"
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">/kW</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h5 className="font-medium text-gray-700 mb-3">Additional Components</h5>
              <div className="grid gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">DC Cabling</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      value={editableSolar.additionalComponents.dcCabling}
                      onChange={(e) => {
                        const updated = { ...editableSolar };
                        updated.additionalComponents.dcCabling = parseInt(e.target.value);
                        setEditableSolar(updated);
                        solarPricingService.updateConfiguration(updated);
                        setHasChanges(true);
                      }}
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded focus:border-blue-500"
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">/kW</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">AC Cabling</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      value={editableSolar.additionalComponents.acCabling}
                      onChange={(e) => {
                        const updated = { ...editableSolar };
                        updated.additionalComponents.acCabling = parseInt(e.target.value);
                        setEditableSolar(updated);
                        solarPricingService.updateConfiguration(updated);
                        setHasChanges(true);
                      }}
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded focus:border-blue-500"
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">/kW</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderWindSection = () => {
    return (
      <div className="space-y-6">
        <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4">
          <h4 className="font-semibold text-cyan-800 mb-2">💨 Wind Power Systems</h4>
          <p className="text-sm text-cyan-700">
            Wind turbine and wind farm infrastructure pricing for utility-scale deployments.
          </p>
        </div>

        {/* Editable Wind Turbines */}
        <div className="bg-white border rounded-lg p-6">
          <h4 className="font-semibold mb-4">Wind Turbines (Editable Pricing)</h4>
          <div className="grid gap-4">
            {editableWind.turbines.slice(0, 3).map((turbine) => (
              <div key={turbine.id} className="border border-gray-200 rounded-lg p-4">
                <div className="grid md:grid-cols-5 gap-4 items-center">
                  <div>
                    <h5 className="font-semibold text-gray-900">{turbine.model}</h5>
                    <p className="text-sm text-gray-600">{turbine.manufacturer}</p>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600">Power (kW)</label>
                    <input
                      type="number"
                      value={turbine.ratedPowerKW}
                      onChange={(e) => updateWindPrice('turbines', turbine.id, 'ratedPowerKW', parseInt(e.target.value))}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600">Price/kW ($)</label>
                    <input
                      type="number"
                      value={turbine.pricePerKW}
                      onChange={(e) => {
                        const newPricePerKW = parseInt(e.target.value);
                        updateWindPrice('turbines', turbine.id, 'pricePerKW', newPricePerKW);
                        updateWindPrice('turbines', turbine.id, 'totalPrice', newPricePerKW * turbine.ratedPowerKW);
                      }}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600">Total Price ($)</label>
                    <input
                      type="number"
                      value={turbine.totalPrice}
                      onChange={(e) => {
                        const newTotalPrice = parseInt(e.target.value);
                        updateWindPrice('turbines', turbine.id, 'totalPrice', newTotalPrice);
                        updateWindPrice('turbines', turbine.id, 'pricePerKW', Math.round(newTotalPrice / turbine.ratedPowerKW));
                      }}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                    />
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-cyan-600">${turbine.pricePerKW}/kW</p>
                    <p className="text-xs text-gray-500">${turbine.totalPrice.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderPowerElectronicsSection = () => {
    return (
      <div className="space-y-6">
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <h4 className="font-semibold text-indigo-800 mb-2">🔌 Power Electronics</h4>
          <p className="text-sm text-indigo-700">
            Inverters, transformers, switchgear, and power conditioning equipment for energy systems.
          </p>
        </div>

        {/* Editable Inverters */}
        <div className="bg-white border rounded-lg p-6">
          <h4 className="font-semibold mb-4">Power Inverters (Editable Pricing)</h4>
          <div className="grid gap-3">
            {editablePowerElectronics.inverters.slice(0, 2).map((inverter) => (
              <div key={inverter.id} className="grid md:grid-cols-5 gap-4 items-center border border-gray-200 rounded p-3">
                <div>
                  <h5 className="font-semibold text-sm">{inverter.manufacturer}</h5>
                  <p className="text-xs text-gray-600">{inverter.model}</p>
                </div>
                <div>
                  <label className="block text-xs text-gray-600">Power (kW)</label>
                  <input
                    type="number"
                    value={inverter.powerRatingKW}
                    onChange={(e) => updatePowerElectronicsPrice('inverters', inverter.id, 'powerRatingKW', parseInt(e.target.value))}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600">Efficiency (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={inverter.efficiency}
                    onChange={(e) => updatePowerElectronicsPrice('inverters', inverter.id, 'efficiency', parseFloat(e.target.value))}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600">Price/kW ($)</label>
                  <input
                    type="number"
                    value={inverter.pricePerKW}
                    onChange={(e) => {
                      const newPricePerKW = parseInt(e.target.value);
                      updatePowerElectronicsPrice('inverters', inverter.id, 'pricePerKW', newPricePerKW);
                      updatePowerElectronicsPrice('inverters', inverter.id, 'pricePerUnit', newPricePerKW * inverter.powerRatingKW);
                    }}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                  />
                </div>
                <div className="text-right">
                  <p className="font-bold text-indigo-600">${inverter.pricePerKW}/kW</p>
                  <p className="text-xs text-gray-500">${inverter.pricePerUnit.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Editable Transformers */}
        <div className="bg-white border rounded-lg p-6">
          <h4 className="font-semibold mb-4">Transformers (Editable Pricing)</h4>
          <div className="grid gap-3">
            {editablePowerElectronics.transformers.slice(0, 2).map((transformer) => (
              <div key={transformer.id} className="grid md:grid-cols-5 gap-4 items-center border border-gray-200 rounded p-3">
                <div>
                  <h5 className="font-semibold text-sm">{transformer.manufacturer}</h5>
                  <p className="text-xs text-gray-600">{transformer.model}</p>
                </div>
                <div>
                  <label className="block text-xs text-gray-600">Power (kVA)</label>
                  <input
                    type="number"
                    value={transformer.powerRatingKVA}
                    onChange={(e) => updatePowerElectronicsPrice('transformers', transformer.id, 'powerRatingKVA', parseInt(e.target.value))}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600">Efficiency (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={transformer.efficiency}
                    onChange={(e) => updatePowerElectronicsPrice('transformers', transformer.id, 'efficiency', parseFloat(e.target.value))}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600">Price/kVA ($)</label>
                  <input
                    type="number"
                    value={transformer.pricePerKVA}
                    onChange={(e) => {
                      const newPricePerKVA = parseInt(e.target.value);
                      updatePowerElectronicsPrice('transformers', transformer.id, 'pricePerKVA', newPricePerKVA);
                      updatePowerElectronicsPrice('transformers', transformer.id, 'pricePerUnit', newPricePerKVA * transformer.powerRatingKVA);
                    }}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                  />
                </div>
                <div className="text-right">
                  <p className="font-bold text-orange-600">${transformer.pricePerKVA}/kVA</p>
                  <p className="text-xs text-gray-500">${transformer.pricePerUnit.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderSystemControlsSection = () => {
    return (
      <div className="space-y-6">
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h4 className="font-semibold text-purple-800 mb-2">📊 System Controls</h4>
          <p className="text-sm text-purple-700">
            SCADA, EMS, controllers including Deepsea DSE8610 from Eaton quote, and automation systems.
          </p>
        </div>

        {/* Editable Controllers */}
        <div className="bg-white border rounded-lg p-6">
          <h4 className="font-semibold mb-4">Controllers (Editable Pricing)</h4>
          <div className="grid gap-4">
            {editableSystemControls.controllers.slice(0, 3).map((controller) => (
              <div key={controller.id} className="border border-gray-200 rounded-lg p-4">
                <div className="grid md:grid-cols-4 gap-4 items-center">
                  <div>
                    <h5 className="font-semibold text-gray-900">{controller.model}</h5>
                    <p className="text-sm text-gray-600">{controller.manufacturer}</p>
                    <p className="text-xs text-purple-600">{controller.type.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600">Application</label>
                    <p className="text-sm text-gray-700">{controller.application}</p>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600">Price per Unit ($)</label>
                    <input
                      type="number"
                      value={controller.pricePerUnit}
                      onChange={(e) => updateSystemControlsPrice('controllers', controller.id, 'pricePerUnit', parseInt(e.target.value))}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                    />
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-purple-600">${controller.pricePerUnit.toLocaleString()}</p>
                    <p className="text-sm text-gray-500">per unit</p>
                  </div>
                </div>
                {controller.id === 'deepsea-dse8610' && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
                    <p className="text-sm text-green-800 font-medium">✓ Featured in Eaton Quote</p>
                    <p className="text-xs text-green-700">Advanced generator control with parallel operation capability</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Installation Costs */}
        <div className="bg-white border rounded-lg p-6">
          <h4 className="font-semibold mb-4">Installation & Integration Costs</h4>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h5 className="font-medium text-gray-700 mb-3">Installation (per unit)</h5>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Controller Installation</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={editableSystemControls.installationCosts.controllerInstallationPerUnit}
                    onChange={(e) => {
                      const updated = { ...editableSystemControls };
                      updated.installationCosts.controllerInstallationPerUnit = parseInt(e.target.value);
                      setEditableSystemControls(updated);
                      systemControlsPricingService.updateConfiguration(updated);
                      setHasChanges(true);
                    }}
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
            <div>
              <h5 className="font-medium text-gray-700 mb-3">Integration</h5>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Cybersecurity Setup</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={editableSystemControls.integrationCosts.cybersecuritySetup}
                    onChange={(e) => {
                      const updated = { ...editableSystemControls };
                      updated.integrationCosts.cybersecuritySetup = parseInt(e.target.value);
                      setEditableSystemControls(updated);
                      systemControlsPricingService.updateConfiguration(updated);
                      setHasChanges(true);
                    }}
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderEVChargingSection = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-800 mb-2">EV Charging Infrastructure Pricing</h4>
        <p className="text-sm text-blue-700">{config.evCharging.vendorNotes}</p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-lg border">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Level 1 AC (3.3-7.7kW)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
            <input
              type="number"
              className="w-full pl-8 pr-16 py-2 border border-gray-300 rounded-md"
              value={config.evCharging.level1ACPerUnit}
              onChange={(e) => updateConfigSection('evCharging', 'level1ACPerUnit', e.target.value)}
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">/unit</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Level 2 AC (7.7-22kW)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
            <input
              type="number"
              className="w-full pl-8 pr-16 py-2 border border-gray-300 rounded-md"
              value={config.evCharging.level2ACPerUnit}
              onChange={(e) => updateConfigSection('evCharging', 'level2ACPerUnit', e.target.value)}
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">/unit</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            DC Fast (50-150kW)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
            <input
              type="number"
              className="w-full pl-8 pr-16 py-2 border border-gray-300 rounded-md"
              value={config.evCharging.dcFastPerUnit}
              onChange={(e) => updateConfigSection('evCharging', 'dcFastPerUnit', e.target.value)}
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">/unit</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            DC Ultra Fast (150-350kW)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
            <input
              type="number"
              className="w-full pl-8 pr-16 py-2 border border-gray-300 rounded-md"
              value={config.evCharging.dcUltraFastPerUnit}
              onChange={(e) => updateConfigSection('evCharging', 'dcUltraFastPerUnit', e.target.value)}
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">/unit</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Pantograph Charger (Overhead)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
            <input
              type="number"
              className="w-full pl-8 pr-16 py-2 border border-gray-300 rounded-md"
              value={config.evCharging.pantographChargerPerUnit}
              onChange={(e) => updateConfigSection('evCharging', 'pantographChargerPerUnit', e.target.value)}
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">/unit</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Networking/OCPP (per charger)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
            <input
              type="number"
              className="w-full pl-8 pr-16 py-2 border border-gray-300 rounded-md"
              value={config.evCharging.networkingCostPerUnit}
              onChange={(e) => updateConfigSection('evCharging', 'networkingCostPerUnit', e.target.value)}
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">/unit</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderBalanceOfPlantSection = () => (
    <div className="space-y-6">
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h4 className="font-semibold text-red-800 mb-2 flex items-center">
          <AlertTriangle className="w-4 h-4 mr-2" />
          Balance of Plant Guidelines (≤15% Maximum)
        </h4>
        <p className="text-sm text-red-700">{config.balanceOfPlant.vendorNotes}</p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-lg border">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            BOP Percentage
            {config.balanceOfPlant.bopPercentage > 0.15 && 
              <span className="text-red-500 text-xs ml-2">(⚠️ Exceeds 15% guideline)</span>
            }
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.01"
              max="0.15"
              className={`w-full pr-8 py-2 border rounded-md ${
                config.balanceOfPlant.bopPercentage > 0.15 ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              value={config.balanceOfPlant.bopPercentage}
              onChange={(e) => updateConfigSection('balanceOfPlant', 'bopPercentage', e.target.value)}
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">%</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            EPC Percentage
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.01"
              className="w-full pr-8 py-2 border border-gray-300 rounded-md"
              value={config.balanceOfPlant.epcPercentage}
              onChange={(e) => updateConfigSection('balanceOfPlant', 'epcPercentage', e.target.value)}
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">%</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Labor Cost (per hour)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
            <input
              type="number"
              className="w-full pl-8 pr-12 py-2 border border-gray-300 rounded-md"
              value={config.balanceOfPlant.laborCostPerHour}
              onChange={(e) => updateConfigSection('balanceOfPlant', 'laborCostPerHour', e.target.value)}
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">/hr</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Shipping Percentage
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.01"
              className="w-full pr-8 py-2 border border-gray-300 rounded-md"
              value={config.balanceOfPlant.shippingCostPercentage}
              onChange={(e) => updateConfigSection('balanceOfPlant', 'shippingCostPercentage', e.target.value)}
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">%</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            International Tariff Rate
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.01"
              className="w-full pr-8 py-2 border border-gray-300 rounded-md"
              value={config.balanceOfPlant.internationalTariffRate}
              onChange={(e) => updateConfigSection('balanceOfPlant', 'internationalTariffRate', e.target.value)}
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">%</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Contingency Percentage
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.01"
              className="w-full pr-8 py-2 border border-gray-300 rounded-md"
              value={config.balanceOfPlant.contingencyPercentage}
              onChange={(e) => updateConfigSection('balanceOfPlant', 'contingencyPercentage', e.target.value)}
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">%</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDatabaseSection = () => {
    const getStatusIcon = () => {
      switch (databaseStatus) {
        case 'connected': return <Cloud className="w-5 h-5 text-green-600" />;
        case 'disconnected': return <CloudOff className="w-5 h-5 text-red-600" />;
        case 'error': return <AlertTriangle className="w-5 h-5 text-red-600" />;
        default: return <RefreshCw className="w-5 h-5 text-gray-400 animate-spin" />;
      }
    };

    const getStatusColor = () => {
      switch (databaseStatus) {
        case 'connected': return 'bg-green-50 border-green-200';
        case 'disconnected': return 'bg-yellow-50 border-yellow-200';
        case 'error': return 'bg-red-50 border-red-200';
        default: return 'bg-gray-50 border-gray-200';
      }
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Supabase Database Integration</h3>
          <button
            onClick={checkDatabaseStatus}
            disabled={databaseStatus === 'checking'}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${databaseStatus === 'checking' ? 'animate-spin' : ''}`} />
            Check Status
          </button>
        </div>

        {/* Database Status */}
        <div className={`border rounded-lg p-4 ${getStatusColor()}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getStatusIcon()}
              <div>
                <h4 className="font-semibold">Database Connection</h4>
                <p className="text-sm text-gray-600">
                  {databaseStatus === 'connected' && 'Connected to Supabase - pricing data is being persisted'}
                  {databaseStatus === 'disconnected' && 'Database not available - running in local-only mode'}
                  {databaseStatus === 'error' && 'Database connection error - check credentials'}
                  {databaseStatus === 'checking' && 'Checking database connectivity...'}
                </p>
              </div>
            </div>
            {lastSync && (
              <div className="text-right text-sm text-gray-600">
                <p>Last Sync</p>
                <p className="font-mono text-xs">{new Date(lastSync).toLocaleString()}</p>
              </div>
            )}
          </div>
        </div>

        {/* Database Statistics */}
        {databaseStatus === 'connected' && Object.keys(databaseStats).length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg border">
              <div className="text-2xl font-bold text-blue-600">{databaseStats.totalConfigurations || 0}</div>
              <div className="text-sm text-gray-600">Total Configurations</div>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <div className="text-2xl font-bold text-green-600">{databaseStats.recentDataPoints || 0}</div>
              <div className="text-sm text-gray-600">Recent Data Points</div>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <div className="text-2xl font-bold text-orange-600">{databaseStats.unresolvedAlerts || 0}</div>
              <div className="text-sm text-gray-600">Unresolved Alerts</div>
            </div>
          </div>
        )}

        {/* Sync Actions */}
        <div className="bg-white border rounded-lg p-6">
          <h4 className="font-semibold mb-4">Configuration Synchronization</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={syncToDatabase}
              disabled={syncStatus === 'syncing' || databaseStatus !== 'connected'}
              className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload className="w-4 h-4 mr-2" />
              {syncStatus === 'syncing' ? 'Syncing...' : 'Sync to Database'}
            </button>
            
            <button
              onClick={loadFromDatabase}
              disabled={syncStatus === 'syncing' || databaseStatus !== 'connected'}
              className="flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4 mr-2" />
              Load from Database
            </button>
            
            <button
              onClick={runManualSync}
              disabled={syncStatus === 'syncing' || databaseStatus !== 'connected'}
              className="flex items-center justify-center px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Database className="w-4 h-4 mr-2" />
              Run Daily Sync
            </button>
          </div>
          
          <div className="mt-4 text-sm text-gray-600">
            <p>• <strong>Sync to Database:</strong> Upload current local configuration to Supabase</p>
            <p>• <strong>Load from Database:</strong> Download and apply configuration from Supabase</p>
            <p>• <strong>Run Daily Sync:</strong> Execute complete daily price validation and sync process</p>
          </div>
        </div>

        {/* Sync Results */}
        {syncResult && (
          <div className={`border rounded-lg p-4 ${syncResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-center space-x-2">
              {syncResult.success ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-600" />
              )}
              <h4 className="font-semibold">
                {syncResult.success ? 'Sync Successful' : 'Sync Failed'}
              </h4>
            </div>
            <p className="text-sm mt-2">{syncResult.message}</p>
            {syncResult.error && (
              <p className="text-sm text-red-600 mt-1">Error: {syncResult.error}</p>
            )}
            {syncResult.data && typeof syncResult.data === 'object' && 'summary' in syncResult.data && (
              <details className="mt-2">
                <summary className="text-sm cursor-pointer">View Sync Report</summary>
                <pre className="text-xs bg-gray-100 p-2 rounded mt-2 overflow-x-auto">
                  {JSON.stringify(syncResult.data, null, 2)}
                </pre>
              </details>
            )}
          </div>
        )}

        {/* Daily Sync Service Status */}
        <div className="bg-white border rounded-lg p-6">
          <h4 className="font-semibold mb-4">Daily Sync Service</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Service Status</span>
              <span className={`px-2 py-1 rounded text-xs ${databaseStatus === 'connected' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                {databaseStatus === 'connected' ? 'Running' : 'Offline'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Next Scheduled Sync</span>
              <span className="text-sm font-mono">Daily at 6:00 AM UTC</span>
            </div>
            <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
              <p>The daily sync service automatically:</p>
              <ul className="mt-2 space-y-1 ml-4 list-disc">
                <li>Validates pricing against market sources (NREL, Bloomberg, Wood Mackenzie)</li>
                <li>Updates vendor-specific pricing data (Dynapower, Sinexcel, Great Power, Mainspring)</li>
                <li>Backs up pricing configurations to Supabase</li>
                <li>Processes and cleans up pricing alerts</li>
                <li>Generates daily pricing reports and statistics</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'validation': return renderValidationSection();
      case 'database': return renderDatabaseSection();
      case 'bess': return renderBESSSection();
      case 'solar': return renderSolarSection();
      case 'wind': return renderWindSection();
      case 'generators': return renderGeneratorSection();
      case 'powerElectronics': return renderPowerElectronicsSection();
      case 'systemControls': return renderSystemControlsSection();
      case 'evCharging': return renderEVChargingSection();
      case 'balanceOfPlant': return renderBalanceOfPlantSection();
      default: return <div>Section content not yet implemented</div>;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-7xl w-full h-5/6 m-4 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <Settings className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-bold">Pricing Administration Dashboard</h2>
              <p className="text-sm text-gray-600">
                Version {config.version} • Last updated: {new Date(config.lastUpdated).toLocaleString()}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Save Status */}
            {saveStatus === 'saving' && <span className="text-blue-600 text-sm">Saving...</span>}
            {saveStatus === 'saved' && (
              <span className="text-green-600 text-sm flex items-center">
                <CheckCircle className="w-4 h-4 mr-1" /> Saved
              </span>
            )}
            {saveStatus === 'error' && <span className="text-red-600 text-sm">Save failed</span>}

            {/* Action Buttons */}
            <button
              onClick={saveChanges}
              disabled={!hasChanges || saveStatus === 'saving'}
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
            
            <label className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 cursor-pointer flex items-center">
              <Upload className="w-4 h-4 mr-2" />
              Import
              <input
                type="file"
                accept=".json"
                onChange={importConfig}
                className="hidden"
              />
            </label>
            
            <button
              onClick={resetToDefaults}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </button>
            
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
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
                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                        : 'hover:bg-gray-100'
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
                {sections.find(s => s.id === activeSection)?.icon} {' '}
                {sections.find(s => s.id === activeSection)?.name} Configuration
              </h3>
              
              {renderSectionContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};