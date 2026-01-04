import React, { useState } from "react";
import { Save, RotateCcw, Droplet } from "lucide-react";

export interface WatermarkSettings {
  enabled: boolean;
  text: string;
  useCustomText: boolean;
  opacity: number;
  color: string;
  fontSize: number;
  rotation: number;
}

const DEFAULT_SETTINGS: WatermarkSettings = {
  enabled: true,
  text: "merlin certified",
  useCustomText: false,
  opacity: 10,
  color: "#0b74de",
  fontSize: 48,
  rotation: -30,
};

export const loadWatermarkSettings = (): WatermarkSettings => {
  try {
    const stored = localStorage.getItem("merlin_watermark_settings");
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error("Failed to load watermark settings:", error);
  }
  return DEFAULT_SETTINGS;
};

export const saveWatermarkSettings = (settings: WatermarkSettings): void => {
  try {
    localStorage.setItem("merlin_watermark_settings", JSON.stringify(settings));
  } catch (error) {
    console.error("Failed to save watermark settings:", error);
  }
};

interface AdminWatermarkSettingsProps {
  onClose?: () => void;
}

const AdminWatermarkSettings: React.FC<AdminWatermarkSettingsProps> = ({ onClose }) => {
  const [settings, setSettings] = useState<WatermarkSettings>(loadWatermarkSettings());
  const [showPreview, setShowPreview] = useState(true);
  const [saveMessage, setSaveMessage] = useState("");

  const handleSave = () => {
    saveWatermarkSettings(settings);
    setSaveMessage("✅ Settings saved successfully!");
    setTimeout(() => setSaveMessage(""), 3000);
  };

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);
    setSaveMessage("🔄 Reset to defaults");
    setTimeout(() => setSaveMessage(""), 3000);
  };

  const updateSetting = <K extends keyof WatermarkSettings>(
    key: K,
    value: WatermarkSettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const getWatermarkText = () => {
    if (!settings.enabled) return "";
    const baseText = settings.useCustomText && settings.text ? settings.text : "merlin certified";
    return `${baseText} -- ${new Date().toLocaleDateString()}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Droplet className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">Watermark Settings</h2>
                <p className="text-blue-100 text-sm">Customize quote certification watermarks</p>
              </div>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Settings Panel */}
          <div className="space-y-6">
            {/* Enable/Disable */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enabled}
                  onChange={(e) => updateSetting("enabled", e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded"
                />
                <div>
                  <span className="font-semibold text-gray-900">Enable Watermark</span>
                  <p className="text-sm text-gray-600">Show watermark on all quotes and exports</p>
                </div>
              </label>
            </div>

            {/* Custom Text */}
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.useCustomText}
                  onChange={(e) => updateSetting("useCustomText", e.target.checked)}
                  disabled={!settings.enabled}
                  className="w-5 h-5 text-blue-600 rounded disabled:opacity-50"
                />
                <span className="font-semibold text-gray-900">Use Custom Text</span>
              </label>

              <input
                type="text"
                value={settings.text}
                onChange={(e) => updateSetting("text", e.target.value)}
                disabled={!settings.enabled || !settings.useCustomText}
                placeholder="merlin certified"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:opacity-50"
              />
              <p className="text-xs text-gray-500">Current date will be appended automatically</p>
            </div>

            {/* Opacity Slider */}
            <div className="space-y-2">
              <label className="flex items-center justify-between">
                <span className="font-semibold text-gray-900">Opacity</span>
                <span className="text-sm text-gray-600">{settings.opacity}%</span>
              </label>
              <input
                type="range"
                min="5"
                max="50"
                value={settings.opacity}
                onChange={(e) => updateSetting("opacity", Number(e.target.value))}
                disabled={!settings.enabled}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
              />
              <p className="text-xs text-gray-500">Lower values = more subtle watermark</p>
            </div>

            {/* Color Picker */}
            <div className="space-y-2">
              <label className="font-semibold text-gray-900">Color</label>
              <div className="flex gap-3 items-center">
                <input
                  type="color"
                  value={settings.color}
                  onChange={(e) => updateSetting("color", e.target.value)}
                  disabled={!settings.enabled}
                  className="w-20 h-10 rounded cursor-pointer disabled:opacity-50"
                />
                <input
                  type="text"
                  value={settings.color}
                  onChange={(e) => updateSetting("color", e.target.value)}
                  disabled={!settings.enabled}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:opacity-50"
                />
              </div>
            </div>

            {/* Font Size */}
            <div className="space-y-2">
              <label className="flex items-center justify-between">
                <span className="font-semibold text-gray-900">Font Size</span>
                <span className="text-sm text-gray-600">{settings.fontSize}px</span>
              </label>
              <input
                type="range"
                min="24"
                max="96"
                value={settings.fontSize}
                onChange={(e) => updateSetting("fontSize", Number(e.target.value))}
                disabled={!settings.enabled}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
              />
            </div>

            {/* Rotation */}
            <div className="space-y-2">
              <label className="flex items-center justify-between">
                <span className="font-semibold text-gray-900">Rotation</span>
                <span className="text-sm text-gray-600">{settings.rotation}°</span>
              </label>
              <input
                type="range"
                min="-90"
                max="90"
                value={settings.rotation}
                onChange={(e) => updateSetting("rotation", Number(e.target.value))}
                disabled={!settings.enabled}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleSave}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
              >
                <Save className="w-5 h-5" />
                Save Settings
              </button>
              <button
                onClick={handleReset}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-200 hover:bg-gray-300 rounded-lg font-semibold transition-colors"
              >
                <RotateCcw className="w-5 h-5" />
                Reset
              </button>
            </div>

            {saveMessage && (
              <div className="text-center py-2 bg-green-50 text-green-700 rounded-lg font-semibold">
                {saveMessage}
              </div>
            )}
          </div>

          {/* Preview Panel */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Live Preview</h3>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={showPreview}
                  onChange={(e) => setShowPreview(e.target.checked)}
                  className="rounded"
                />
                Show preview
              </label>
            </div>

            {showPreview && (
              <div className="relative bg-white border-2 border-gray-200 rounded-lg h-[500px] overflow-hidden">
                {/* Mock Quote Document */}
                <div className="p-8 text-gray-700">
                  <h2 className="text-2xl font-bold text-blue-900 mb-4">BESS QUOTE</h2>

                  <div className="space-y-4 text-sm">
                    <div>
                      <p className="font-semibold">Project Name:</p>
                      <p>Sample Energy Storage Project</p>
                    </div>

                    <div>
                      <p className="font-semibold">Location:</p>
                      <p>California, USA</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="font-semibold">System Size:</p>
                        <p>50 MW / 200 MWh</p>
                      </div>
                      <div>
                        <p className="font-semibold">Duration:</p>
                        <p>4 hours</p>
                      </div>
                    </div>

                    <div>
                      <p className="font-semibold">Chemistry:</p>
                      <p>Lithium Iron Phosphate (LFP)</p>
                    </div>

                    <div className="mt-8 pt-4 border-t">
                      <p className="font-semibold mb-2">Financial Summary:</p>
                      <p className="text-2xl font-bold text-green-600">$8,500,000</p>
                    </div>
                  </div>
                </div>

                {/* Watermark Overlay */}
                {settings.enabled && (
                  <div
                    className="pointer-events-none select-none absolute inset-0 flex items-center justify-center"
                    style={{
                      opacity: settings.opacity / 100,
                      transform: `rotate(${settings.rotation}deg)`,
                      fontSize: `${settings.fontSize}px`,
                      color: settings.color,
                      fontWeight: "bold",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {getWatermarkText()}
                  </div>
                )}
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                <strong>💡 Tip:</strong> Watermark changes apply to all new quote previews and
                exports. Lower opacity (10-20%) works best for professional documents.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminWatermarkSettings;
