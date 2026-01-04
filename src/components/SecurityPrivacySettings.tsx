import { useState } from "react";
import { X, Shield, Lock, Eye, EyeOff, Download, Trash2, CheckCircle, History } from "lucide-react";

interface SecurityPrivacySettingsProps {
  onClose: () => void;
}

export default function SecurityPrivacySettings({ onClose }: SecurityPrivacySettingsProps) {
  const [activeTab, setActiveTab] = useState<"privacy" | "security" | "data">("privacy");

  // Privacy settings
  const [shareMarketData, setShareMarketData] = useState(true);
  const [shareAnonymousUsage, setShareAnonymousUsage] = useState(true);
  const [vendorMatching, setVendorMatching] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);

  // Security settings
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState("30");
  const [loginNotifications, setLoginNotifications] = useState(true);

  // Data management
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleExportData = () => {
    // Mock data export
    const userData = {
      exported_at: new Date().toISOString(),
      account: {
        email: "user@example.com",
        name: "John Doe",
        created: "2025-01-15",
      },
      projects: 12,
      quotes_saved: 45,
      pricing_contributions: 3,
    };

    const blob = new Blob([JSON.stringify(userData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `merlin-data-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    alert("Your data has been exported successfully!");
  };

  const handleDeleteAccount = () => {
    if (showDeleteConfirm) {
      alert("Account deletion requested. You will receive a confirmation email.");
      setShowDeleteConfirm(false);
      onClose();
    } else {
      setShowDeleteConfirm(true);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full border-4 border-green-300 max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 bg-gradient-to-r from-green-600 to-emerald-600 text-white flex-shrink-0">
          <div>
            <h2 className="text-3xl font-bold flex items-center gap-3">
              <Shield size={32} />
              Security & Privacy
            </h2>
            <p className="text-green-100 mt-1">Control your data and security preferences</p>
          </div>
          <button
            onClick={onClose}
            className="text-green-200 hover:text-white transition-colors p-2 rounded-lg hover:bg-green-700"
          >
            <X size={28} />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 bg-gray-50 flex-shrink-0">
          <div className="flex">
            <button
              onClick={() => setActiveTab("privacy")}
              className={`flex items-center gap-2 px-6 py-3 font-bold transition-all ${
                activeTab === "privacy"
                  ? "border-b-4 border-green-600 text-green-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Eye size={20} />
              Privacy Controls
            </button>
            <button
              onClick={() => setActiveTab("security")}
              className={`flex items-center gap-2 px-6 py-3 font-bold transition-all ${
                activeTab === "security"
                  ? "border-b-4 border-green-600 text-green-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Lock size={20} />
              Security
            </button>
            <button
              onClick={() => setActiveTab("data")}
              className={`flex items-center gap-2 px-6 py-3 font-bold transition-all ${
                activeTab === "data"
                  ? "border-b-4 border-green-600 text-green-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Download size={20} />
              Your Data
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Privacy Tab */}
          {activeTab === "privacy" && (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Your Privacy Choices</h3>
                <p className="text-gray-600">
                  Control how we use your data. Changes take effect immediately.
                </p>
              </div>

              {/* Data Sharing */}
              <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                <h4 className="text-lg font-bold text-gray-900 mb-4">Data Sharing Preferences</h4>

                <div className="space-y-4">
                  {/* Market Data */}
                  <div className="flex items-start justify-between p-4 bg-blue-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h5 className="font-bold text-gray-900">
                          Market Intelligence Contribution
                        </h5>
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold">
                          +10 Credits/Quote
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Share anonymized pricing data to improve market intelligence. Your vendor
                        information is never disclosed.
                      </p>
                    </div>
                    <button
                      onClick={() => setShareMarketData(!shareMarketData)}
                      className={`ml-4 px-6 py-2 rounded-lg font-bold transition-all flex-shrink-0 ${
                        shareMarketData
                          ? "bg-green-600 text-white hover:bg-green-700"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                    >
                      {shareMarketData ? <CheckCircle size={20} /> : <EyeOff size={20} />}
                    </button>
                  </div>

                  {/* Anonymous Usage */}
                  <div className="flex items-start justify-between p-4 bg-purple-50 rounded-lg">
                    <div className="flex-1">
                      <h5 className="font-bold text-gray-900 mb-2">Anonymous Usage Analytics</h5>
                      <p className="text-sm text-gray-600">
                        Help us improve the platform by sharing how you use features (no personal
                        data collected).
                      </p>
                    </div>
                    <button
                      onClick={() => setShareAnonymousUsage(!shareAnonymousUsage)}
                      className={`ml-4 px-6 py-2 rounded-lg font-bold transition-all flex-shrink-0 ${
                        shareAnonymousUsage
                          ? "bg-purple-600 text-white hover:bg-purple-700"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                    >
                      {shareAnonymousUsage ? <CheckCircle size={20} /> : <EyeOff size={20} />}
                    </button>
                  </div>

                  {/* Vendor Matching */}
                  <div className="flex items-start justify-between p-4 bg-orange-50 rounded-lg">
                    <div className="flex-1">
                      <h5 className="font-bold text-gray-900 mb-2">Vendor Marketplace Matching</h5>
                      <p className="text-sm text-gray-600">
                        Allow vendors to submit competitive quotes for your projects. You decide
                        which leads to accept.
                      </p>
                    </div>
                    <button
                      onClick={() => setVendorMatching(!vendorMatching)}
                      className={`ml-4 px-6 py-2 rounded-lg font-bold transition-all flex-shrink-0 ${
                        vendorMatching
                          ? "bg-orange-600 text-white hover:bg-orange-700"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                    >
                      {vendorMatching ? <CheckCircle size={20} /> : <EyeOff size={20} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Communications */}
              <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                <h4 className="text-lg font-bold text-gray-900 mb-4">Communication Preferences</h4>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h5 className="font-bold text-gray-900">Marketing Emails</h5>
                      <p className="text-sm text-gray-600">
                        Feature updates, tips, and promotional content
                      </p>
                    </div>
                    <button
                      onClick={() => setMarketingEmails(!marketingEmails)}
                      className={`px-6 py-2 rounded-lg font-bold transition-all ${
                        marketingEmails
                          ? "bg-blue-600 text-white hover:bg-blue-700"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                    >
                      {marketingEmails ? "Enabled" : "Disabled"}
                    </button>
                  </div>

                  <div className="p-4 bg-yellow-50 border border-yellow-300 rounded-lg">
                    <p className="text-sm text-gray-700">
                      <strong>Note:</strong> You will still receive essential emails (security
                      alerts, billing, account changes) regardless of this setting.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === "security" && (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-6 border-2 border-red-200">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Security Settings</h3>
                <p className="text-gray-600">Protect your account with these security features.</p>
              </div>

              {/* Two-Factor Authentication */}
              <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h4 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                      <Lock size={24} className="text-red-600" />
                      Two-Factor Authentication (2FA)
                    </h4>
                    <p className="text-gray-600 mb-4">
                      Add an extra layer of security to your account. Requires a verification code
                      from your phone when logging in.
                    </p>
                  </div>
                  <button
                    onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
                    className={`ml-4 px-6 py-3 rounded-lg font-bold transition-all flex-shrink-0 ${
                      twoFactorEnabled
                        ? "bg-green-600 text-white hover:bg-green-700"
                        : "bg-red-600 text-white hover:bg-red-700"
                    }`}
                  >
                    {twoFactorEnabled ? "Enabled ✓" : "Enable 2FA"}
                  </button>
                </div>

                {twoFactorEnabled && (
                  <div className="bg-green-50 border border-green-300 rounded-lg p-4">
                    <p className="text-sm text-green-800 flex items-center gap-2">
                      <CheckCircle size={16} />
                      <strong>2FA is active.</strong> Your account is protected with two-factor
                      authentication.
                    </p>
                  </div>
                )}
              </div>

              {/* Session Management */}
              <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                <h4 className="text-lg font-bold text-gray-900 mb-4">Session Management</h4>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Auto-Logout After Inactivity
                    </label>
                    <select
                      value={sessionTimeout}
                      onChange={(e) => setSessionTimeout(e.target.value)}
                      className="w-full md:w-64 border-2 border-gray-300 rounded-lg px-4 py-2"
                    >
                      <option value="15">15 minutes</option>
                      <option value="30">30 minutes</option>
                      <option value="60">1 hour</option>
                      <option value="120">2 hours</option>
                      <option value="never">Never</option>
                    </select>
                    <p className="text-sm text-gray-600 mt-2">
                      Automatically log out after this period of inactivity for security.
                    </p>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                    <div>
                      <h5 className="font-bold text-gray-900">Login Notifications</h5>
                      <p className="text-sm text-gray-600">
                        Get email alerts when your account is accessed
                      </p>
                    </div>
                    <button
                      onClick={() => setLoginNotifications(!loginNotifications)}
                      className={`px-6 py-2 rounded-lg font-bold transition-all ${
                        loginNotifications
                          ? "bg-blue-600 text-white hover:bg-blue-700"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                    >
                      {loginNotifications ? "Enabled" : "Disabled"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Password Change */}
              <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                <h4 className="text-lg font-bold text-gray-900 mb-4">Password</h4>
                <button className="bg-purple-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-purple-700 transition-all">
                  Change Password
                </button>
                <p className="text-sm text-gray-600 mt-2">
                  Last changed: 45 days ago • Strength: Strong
                </p>
              </div>

              {/* Active Sessions */}
              <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <History size={20} />
                  Active Sessions
                </h4>
                <div className="space-y-3">
                  <div className="p-4 bg-green-50 border border-green-300 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-bold text-gray-900">MacBook Pro • Chrome</p>
                        <p className="text-sm text-gray-600">San Francisco, CA • Current session</p>
                        <p className="text-xs text-gray-500">Last active: Now</p>
                      </div>
                      <span className="bg-green-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                        Current
                      </span>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 border border-gray-300 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-bold text-gray-900">iPhone 15 • Safari</p>
                        <p className="text-sm text-gray-600">San Francisco, CA</p>
                        <p className="text-xs text-gray-500">Last active: 2 hours ago</p>
                      </div>
                      <button className="text-red-600 hover:text-red-700 font-bold text-sm">
                        Revoke
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Data Management Tab */}
          {activeTab === "data" && (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border-2 border-blue-200">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Your Data Rights</h3>
                <p className="text-gray-600">
                  Access, download, or delete your personal data at any time.
                </p>
              </div>

              {/* Export Data */}
              <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Download size={24} className="text-blue-600" />
                  Export Your Data
                </h4>
                <p className="text-gray-600 mb-4">
                  Download a complete copy of all your data including account info, projects,
                  quotes, and activity history.
                </p>
                <button
                  onClick={handleExportData}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition-all flex items-center gap-2"
                >
                  <Download size={20} />
                  Download My Data (JSON)
                </button>
                <p className="text-xs text-gray-500 mt-2">
                  Export includes all data associated with your account in machine-readable format
                </p>
              </div>

              {/* Data Summary */}
              <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                <h4 className="text-lg font-bold text-gray-900 mb-4">Your Data Summary</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-blue-600">12</div>
                    <div className="text-sm text-gray-600 mt-1">Projects</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-green-600">45</div>
                    <div className="text-sm text-gray-600 mt-1">Saved Quotes</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-purple-600">3</div>
                    <div className="text-sm text-gray-600 mt-1">Price Uploads</div>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-orange-600">8.5 MB</div>
                    <div className="text-sm text-gray-600 mt-1">Storage Used</div>
                  </div>
                </div>
              </div>

              {/* Data Retention */}
              <div className="bg-gray-50 border-2 border-gray-300 rounded-xl p-6">
                <h4 className="text-lg font-bold text-gray-900 mb-4">Data Retention Policy</h4>
                <div className="space-y-3 text-gray-700">
                  <p>
                    • <strong>Account data:</strong> Retained while account is active
                  </p>
                  <p>
                    • <strong>Project data:</strong> Stored for 2 years after last access
                  </p>
                  <p>
                    • <strong>Anonymized analytics:</strong> Retained indefinitely
                  </p>
                  <p>
                    • <strong>After deletion:</strong> 30-day grace period, then permanently removed
                  </p>
                </div>
              </div>

              {/* Delete Account */}
              <div className="bg-red-50 border-2 border-red-300 rounded-xl p-6">
                <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Trash2 size={24} className="text-red-600" />
                  Delete Account
                </h4>
                <div className="bg-white border border-red-300 rounded-lg p-4 mb-4">
                  <p className="text-gray-700 mb-2">
                    <strong className="text-red-600">Warning:</strong> This action cannot be undone.
                  </p>
                  <p className="text-sm text-gray-600">
                    Deleting your account will permanently remove all your data including projects,
                    quotes, and settings. You will have a 30-day grace period to recover your
                    account.
                  </p>
                </div>

                {!showDeleteConfirm ? (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="bg-red-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-red-700 transition-all"
                  >
                    Delete My Account
                  </button>
                ) : (
                  <div className="space-y-3">
                    <p className="text-red-700 font-bold">
                      Are you absolutely sure? This will delete everything.
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={handleDeleteAccount}
                        className="bg-red-700 text-white px-6 py-3 rounded-lg font-bold hover:bg-red-800 transition-all"
                      >
                        Yes, Delete Everything
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-bold hover:bg-gray-300 transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 border-t border-gray-200 p-4 bg-gray-50">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">Changes are saved automatically</p>
            <button
              onClick={onClose}
              className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:from-green-700 hover:to-emerald-700 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
