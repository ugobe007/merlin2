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

  const tabs = [
    { id: "privacy" as const, label: "Privacy Controls", icon: Eye },
    { id: "security" as const, label: "Security", icon: Lock },
    { id: "data" as const, label: "Your Data", icon: Download },
  ];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#0f1117] rounded-2xl shadow-2xl max-w-5xl w-full border border-white/[0.08] max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-white/[0.08] flex-shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <Shield size={28} className="text-emerald-400" />
              Security & Privacy
            </h2>
            <p className="text-white/40 text-sm mt-1">Control your data and security preferences</p>
          </div>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/[0.06]"
          >
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-white/[0.08] flex-shrink-0">
          <div className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? "border-b-2 border-emerald-400 text-emerald-400"
                    : "text-white/40 hover:text-white/70"
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Privacy Tab */}
          {activeTab === "privacy" && (
            <div className="space-y-6">
              <div className="bg-emerald-500/[0.06] border border-emerald-500/20 rounded-xl p-5">
                <h3 className="text-lg font-semibold text-white mb-1">Your Privacy Choices</h3>
                <p className="text-white/50 text-sm">
                  Control how we use your data. Changes take effect immediately.
                </p>
              </div>

              {/* Data Sharing */}
              <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6">
                <h4 className="text-base font-semibold text-white mb-4">Data Sharing Preferences</h4>

                <div className="space-y-4">
                  {/* Market Data */}
                  <div className="flex items-start justify-between p-4 bg-white/[0.02] border border-white/[0.06] rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h5 className="font-medium text-white text-sm">
                          Market Intelligence Contribution
                        </h5>
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20 font-medium">
                          +10 Credits/Quote
                        </span>
                      </div>
                      <p className="text-xs text-white/40">
                        Share anonymized pricing data to improve market intelligence. Your vendor
                        information is never disclosed.
                      </p>
                    </div>
                    <button
                      onClick={() => setShareMarketData(!shareMarketData)}
                      className={`ml-4 w-10 h-10 rounded-lg flex items-center justify-center transition-all flex-shrink-0 ${
                        shareMarketData
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-white/[0.04] text-white/30 border border-white/[0.08]"
                      }`}
                    >
                      {shareMarketData ? <CheckCircle size={18} /> : <EyeOff size={18} />}
                    </button>
                  </div>

                  {/* Anonymous Usage */}
                  <div className="flex items-start justify-between p-4 bg-white/[0.02] border border-white/[0.06] rounded-lg">
                    <div className="flex-1">
                      <h5 className="font-medium text-white mb-2 text-sm">Anonymous Usage Analytics</h5>
                      <p className="text-xs text-white/40">
                        Help us improve the platform by sharing how you use features (no personal
                        data collected).
                      </p>
                    </div>
                    <button
                      onClick={() => setShareAnonymousUsage(!shareAnonymousUsage)}
                      className={`ml-4 w-10 h-10 rounded-lg flex items-center justify-center transition-all flex-shrink-0 ${
                        shareAnonymousUsage
                          ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                          : "bg-white/[0.04] text-white/30 border border-white/[0.08]"
                      }`}
                    >
                      {shareAnonymousUsage ? <CheckCircle size={18} /> : <EyeOff size={18} />}
                    </button>
                  </div>

                  {/* Vendor Matching */}
                  <div className="flex items-start justify-between p-4 bg-white/[0.02] border border-white/[0.06] rounded-lg">
                    <div className="flex-1">
                      <h5 className="font-medium text-white mb-2 text-sm">Vendor Marketplace Matching</h5>
                      <p className="text-xs text-white/40">
                        Allow vendors to submit competitive quotes for your projects. You decide
                        which leads to accept.
                      </p>
                    </div>
                    <button
                      onClick={() => setVendorMatching(!vendorMatching)}
                      className={`ml-4 w-10 h-10 rounded-lg flex items-center justify-center transition-all flex-shrink-0 ${
                        vendorMatching
                          ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          : "bg-white/[0.04] text-white/30 border border-white/[0.08]"
                      }`}
                    >
                      {vendorMatching ? <CheckCircle size={18} /> : <EyeOff size={18} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Communications */}
              <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6">
                <h4 className="text-base font-semibold text-white mb-4">Communication Preferences</h4>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/[0.06] rounded-lg">
                    <div>
                      <h5 className="font-medium text-white text-sm">Marketing Emails</h5>
                      <p className="text-xs text-white/40">
                        Feature updates, tips, and promotional content
                      </p>
                    </div>
                    <button
                      onClick={() => setMarketingEmails(!marketingEmails)}
                      className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        marketingEmails
                          ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                          : "bg-white/[0.04] text-white/40 border border-white/[0.08]"
                      }`}
                    >
                      {marketingEmails ? "Enabled" : "Disabled"}
                    </button>
                  </div>

                  <div className="p-4 bg-amber-500/[0.06] border border-amber-500/20 rounded-lg">
                    <p className="text-xs text-white/50">
                      <strong className="text-amber-400">Note:</strong> You will still receive essential emails (security
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
              <div className="bg-red-500/[0.06] border border-red-500/20 rounded-xl p-5">
                <h3 className="text-lg font-semibold text-white mb-1">Security Settings</h3>
                <p className="text-white/50 text-sm">Protect your account with these security features.</p>
              </div>

              {/* Two-Factor Authentication */}
              <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h4 className="text-base font-semibold text-white mb-2 flex items-center gap-2">
                      <Lock size={20} className="text-red-400" />
                      Two-Factor Authentication (2FA)
                    </h4>
                    <p className="text-white/50 text-sm mb-4">
                      Add an extra layer of security to your account. Requires a verification code
                      from your phone when logging in.
                    </p>
                  </div>
                  <button
                    onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
                    className={`ml-4 px-5 py-2 rounded-lg text-sm font-medium transition-all flex-shrink-0 ${
                      twoFactorEnabled
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : "bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30"
                    }`}
                  >
                    {twoFactorEnabled ? "Enabled ✓" : "Enable 2FA"}
                  </button>
                </div>

                {twoFactorEnabled && (
                  <div className="bg-emerald-500/[0.06] border border-emerald-500/20 rounded-lg p-4">
                    <p className="text-xs text-emerald-400 flex items-center gap-2">
                      <CheckCircle size={14} />
                      <strong>2FA is active.</strong> Your account is protected with two-factor
                      authentication.
                    </p>
                  </div>
                )}
              </div>

              {/* Session Management */}
              <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6">
                <h4 className="text-base font-semibold text-white mb-4">Session Management</h4>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-white/60 mb-2">
                      Auto-Logout After Inactivity
                    </label>
                    <select
                      value={sessionTimeout}
                      onChange={(e) => setSessionTimeout(e.target.value)}
                      className="w-full md:w-64 bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-2 text-white text-sm focus:border-emerald-500/40 focus:outline-none"
                    >
                      <option value="15">15 minutes</option>
                      <option value="30">30 minutes</option>
                      <option value="60">1 hour</option>
                      <option value="120">2 hours</option>
                      <option value="never">Never</option>
                    </select>
                    <p className="text-xs text-white/40 mt-2">
                      Automatically log out after this period of inactivity for security.
                    </p>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/[0.06] rounded-lg">
                    <div>
                      <h5 className="font-medium text-white text-sm">Login Notifications</h5>
                      <p className="text-xs text-white/40">
                        Get email alerts when your account is accessed
                      </p>
                    </div>
                    <button
                      onClick={() => setLoginNotifications(!loginNotifications)}
                      className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        loginNotifications
                          ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                          : "bg-white/[0.04] text-white/40 border border-white/[0.08]"
                      }`}
                    >
                      {loginNotifications ? "Enabled" : "Disabled"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Password Change */}
              <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6">
                <h4 className="text-base font-semibold text-white mb-4">Password</h4>
                <button className="border border-blue-500/30 text-blue-400 px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-500/10 transition-all">
                  Change Password
                </button>
                <p className="text-xs text-white/40 mt-2">
                  Last changed: 45 days ago • Strength: Strong
                </p>
              </div>

              {/* Active Sessions */}
              <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6">
                <h4 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                  <History size={18} className="text-white/50" />
                  Active Sessions
                </h4>
                <div className="space-y-3">
                  <div className="p-4 bg-emerald-500/[0.06] border border-emerald-500/20 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-white text-sm">MacBook Pro • Chrome</p>
                        <p className="text-xs text-white/40">San Francisco, CA • Current session</p>
                        <p className="text-[10px] text-white/30 mt-1">Last active: Now</p>
                      </div>
                      <span className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-[10px] font-medium border border-emerald-500/20">
                        Current
                      </span>
                    </div>
                  </div>

                  <div className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-white text-sm">iPhone 15 • Safari</p>
                        <p className="text-xs text-white/40">San Francisco, CA</p>
                        <p className="text-[10px] text-white/30 mt-1">Last active: 2 hours ago</p>
                      </div>
                      <button className="text-red-400 hover:text-red-300 text-xs font-medium">
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
              <div className="bg-blue-500/[0.06] border border-blue-500/20 rounded-xl p-5">
                <h3 className="text-lg font-semibold text-white mb-1">Your Data Rights</h3>
                <p className="text-white/50 text-sm">
                  Access, download, or delete your personal data at any time.
                </p>
              </div>

              {/* Export Data */}
              <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6">
                <h4 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                  <Download size={20} className="text-blue-400" />
                  Export Your Data
                </h4>
                <p className="text-white/50 text-sm mb-4">
                  Download a complete copy of all your data including account info, projects,
                  quotes, and activity history.
                </p>
                <button
                  onClick={handleExportData}
                  className="border border-blue-500/30 text-blue-400 px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-500/10 transition-all flex items-center gap-2"
                >
                  <Download size={16} />
                  Download My Data (JSON)
                </button>
                <p className="text-[10px] text-white/30 mt-2">
                  Export includes all data associated with your account in machine-readable format
                </p>
              </div>

              {/* Data Summary */}
              <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6">
                <h4 className="text-base font-semibold text-white mb-4">Your Data Summary</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { value: "12", label: "Projects", color: "text-blue-400" },
                    { value: "45", label: "Saved Quotes", color: "text-emerald-400" },
                    { value: "3", label: "Price Uploads", color: "text-purple-400" },
                    { value: "8.5 MB", label: "Storage Used", color: "text-amber-400" },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-4 text-center">
                      <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                      <div className="text-[10px] text-white/40 mt-1">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Data Retention */}
              <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6">
                <h4 className="text-base font-semibold text-white mb-4">Data Retention Policy</h4>
                <div className="space-y-2 text-white/50 text-sm">
                  <p>• <strong className="text-white/70">Account data:</strong> Retained while account is active</p>
                  <p>• <strong className="text-white/70">Project data:</strong> Stored for 2 years after last access</p>
                  <p>• <strong className="text-white/70">Anonymized analytics:</strong> Retained indefinitely</p>
                  <p>• <strong className="text-white/70">After deletion:</strong> 30-day grace period, then permanently removed</p>
                </div>
              </div>

              {/* Delete Account */}
              <div className="bg-red-500/[0.06] border border-red-500/20 rounded-xl p-6">
                <h4 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                  <Trash2 size={20} className="text-red-400" />
                  Delete Account
                </h4>
                <div className="bg-white/[0.03] border border-red-500/20 rounded-lg p-4 mb-4">
                  <p className="text-white/60 text-sm mb-2">
                    <strong className="text-red-400">Warning:</strong> This action cannot be undone.
                  </p>
                  <p className="text-xs text-white/40">
                    Deleting your account will permanently remove all your data including projects,
                    quotes, and settings. You will have a 30-day grace period to recover your
                    account.
                  </p>
                </div>

                {!showDeleteConfirm ? (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="bg-red-500/20 text-red-400 border border-red-500/30 px-5 py-2 rounded-lg text-sm font-medium hover:bg-red-500/30 transition-all"
                  >
                    Delete My Account
                  </button>
                ) : (
                  <div className="space-y-3">
                    <p className="text-red-400 text-sm font-medium">
                      Are you absolutely sure? This will delete everything.
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={handleDeleteAccount}
                        className="bg-red-500/30 text-red-300 border border-red-500/40 px-5 py-2 rounded-lg text-sm font-medium hover:bg-red-500/40 transition-all"
                      >
                        Yes, Delete Everything
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        className="bg-white/[0.04] text-white/50 border border-white/[0.08] px-5 py-2 rounded-lg text-sm font-medium hover:bg-white/[0.06] transition-all"
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
        <div className="flex-shrink-0 border-t border-white/[0.08] p-4">
          <div className="flex justify-between items-center">
            <p className="text-xs text-white/30">Changes are saved automatically</p>
            <button
              onClick={onClose}
              className="border border-emerald-500/30 text-emerald-400 px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-500/10 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
