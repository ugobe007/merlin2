import { X, Shield, Lock, Eye, Database, UserCheck, FileText } from "lucide-react";

interface PrivacyPolicyProps {
  onClose: () => void;
}

export default function PrivacyPolicy({ onClose }: PrivacyPolicyProps) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#0f1117] rounded-2xl shadow-2xl max-w-4xl w-full border border-white/[0.08] max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-white/[0.08] flex-shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <Shield size={28} className="text-emerald-400" />
              Privacy Policy
            </h2>
            <p className="text-white/40 text-sm mt-1">Last Updated: October 22, 2025</p>
          </div>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/[0.06]"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="space-y-8">
            {/* Introduction */}
            <section>
              <div className="bg-emerald-500/[0.06] border border-emerald-500/20 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <FileText size={20} className="text-emerald-400" />
                  Our Commitment to Your Privacy
                </h3>
                <p className="text-white/60 leading-relaxed text-sm">
                  At Merlin Energy, we take your privacy seriously. This policy explains how we
                  collect, use, protect, and share your information. We are committed to
                  transparency and giving you control over your data.
                </p>
              </div>
            </section>

            {/* Information We Collect */}
            <section>
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Database size={22} className="text-blue-400" />
                1. Information We Collect
              </h3>

              <div className="space-y-4">
                <div className="border-l-2 border-blue-400/40 pl-4">
                  <h4 className="font-semibold text-white mb-2 text-sm">Account Information</h4>
                  <ul className="text-white/50 text-sm space-y-1">
                    <li>• Name, email address, job title</li>
                    <li>• Company name (for business accounts)</li>
                    <li>• Password (encrypted and never stored in plain text)</li>
                    <li>• Account preferences and settings</li>
                  </ul>
                </div>

                <div className="border-l-2 border-blue-400/40 pl-4">
                  <h4 className="font-semibold text-white mb-2 text-sm">Project & Quote Data</h4>
                  <ul className="text-white/50 text-sm space-y-1">
                    <li>• BESS system specifications and configurations</li>
                    <li>• Project locations and requirements</li>
                    <li>• Saved quotes and calculations</li>
                    <li>• Use case templates applied</li>
                  </ul>
                </div>

                <div className="border-l-2 border-blue-400/40 pl-4">
                  <h4 className="font-semibold text-white mb-2 text-sm">Pricing Data (Optional)</h4>
                  <ul className="text-white/50 text-sm space-y-1">
                    <li>• Uploaded price sheets and quotes (with your consent)</li>
                    <li>• Vendor information (anonymized for market intelligence)</li>
                    <li>• Equipment pricing and specifications</li>
                    <li>
                      <strong className="text-white/70">Note:</strong> You control what pricing data you share
                    </li>
                  </ul>
                </div>

                <div className="border-l-2 border-blue-400/40 pl-4">
                  <h4 className="font-semibold text-white mb-2 text-sm">Usage Information</h4>
                  <ul className="text-white/50 text-sm space-y-1">
                    <li>• Features used and frequency</li>
                    <li>• Time spent on platform</li>
                    <li>• Browser type and device information</li>
                    <li>• IP address (for security purposes)</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* How We Use Your Information */}
            <section>
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <UserCheck size={22} className="text-emerald-400" />
                2. How We Use Your Information
              </h3>

              <div className="bg-emerald-500/[0.06] border border-emerald-500/20 rounded-xl p-6 space-y-3">
                {[
                  { label: "Provide Services", desc: "Generate quotes, save projects, deliver market intelligence" },
                  { label: "Improve Platform", desc: "Analyze usage patterns to enhance features and user experience" },
                  { label: "Market Intelligence", desc: "Aggregate anonymized pricing data for industry insights" },
                  { label: "Vendor Matching", desc: "Connect customers with qualified vendors (with consent)" },
                  { label: "Security", desc: "Detect and prevent fraud, abuse, and unauthorized access" },
                  { label: "Communications", desc: "Send important updates, feature announcements, and support messages" },
                ].map((item) => (
                  <div key={item.label} className="flex items-start gap-3">
                    <span className="text-emerald-400 font-bold text-sm mt-0.5">✓</span>
                    <div className="text-sm">
                      <strong className="text-white/80">{item.label}:</strong>{" "}
                      <span className="text-white/50">{item.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Data Protection */}
            <section>
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Lock size={22} className="text-red-400" />
                3. How We Protect Your Data
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { icon: "🔐", title: "Encryption", desc: "All data is encrypted in transit (TLS/SSL) and at rest using industry-standard encryption" },
                  { icon: "🛡️", title: "Access Controls", desc: "Role-based permissions ensure only authorized users can access sensitive data" },
                  { icon: "📝", title: "Audit Logs", desc: "All data access and modifications are logged for security monitoring and compliance" },
                  { icon: "🔄", title: "Regular Backups", desc: "Automated backups ensure your data is never lost and can be recovered if needed" },
                ].map((item) => (
                  <div key={item.title} className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4">
                    <h4 className="font-semibold text-white mb-2 text-sm flex items-center gap-2">
                      <span className="text-lg">{item.icon}</span>
                      {item.title}
                    </h4>
                    <p className="text-white/50 text-xs">{item.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Data Sharing */}
            <section>
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Eye size={22} className="text-amber-400" />
                4. When We Share Your Information
              </h3>

              <div className="bg-amber-500/[0.06] border border-amber-500/20 rounded-xl p-6">
                <p className="font-semibold text-white mb-3 text-sm">
                  We NEVER sell your personal information to third parties.
                </p>
                <p className="text-white/50 text-sm mb-4">
                  We only share information in these specific circumstances:
                </p>

                <div className="space-y-3">
                  {[
                    { title: "With Your Consent", desc: "When you opt-in to share pricing data for market intelligence or vendor matching" },
                    { title: "Service Providers", desc: "Trusted partners who help us operate the platform (hosting, analytics, payment processing)" },
                    { title: "Legal Requirements", desc: "When required by law, court order, or to protect rights and safety" },
                    { title: "Aggregated Data", desc: "Anonymized, aggregated market statistics that cannot identify individual users" },
                  ].map((item) => (
                    <div key={item.title} className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-4">
                      <strong className="text-white/80 text-sm">{item.title}:</strong>
                      <p className="text-white/50 text-xs mt-1">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Your Rights */}
            <section>
              <h3 className="text-xl font-bold text-white mb-4">5. Your Privacy Rights</h3>

              <div className="bg-blue-500/[0.06] border border-blue-500/20 rounded-xl p-6 space-y-3">
                <p className="font-semibold text-white text-sm">You have the right to:</p>
                <ul className="space-y-2">
                  {[
                    { label: "Access", desc: "Request a copy of all data we have about you" },
                    { label: "Correct", desc: "Update or correct inaccurate information" },
                    { label: "Delete", desc: "Request deletion of your personal data" },
                    { label: "Export", desc: "Download your data in a portable format" },
                    { label: "Opt-Out", desc: "Decline data sharing for market intelligence" },
                    { label: "Object", desc: "Object to processing of your data for certain purposes" },
                  ].map((item) => (
                    <li key={item.label} className="flex items-start gap-2">
                      <span className="text-blue-400 font-bold text-sm mt-0.5">•</span>
                      <span className="text-white/60 text-sm">
                        <strong className="text-white/80">{item.label}:</strong> {item.desc}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 pt-4 border-t border-white/[0.08]">
                  <p className="text-white/40 text-xs">
                    To exercise these rights, contact us at{" "}
                    <strong className="text-emerald-400">privacy@merlinenergy.com</strong>
                  </p>
                </div>
              </div>
            </section>

            {/* Data Retention */}
            <section>
              <h3 className="text-xl font-bold text-white mb-4">6. Data Retention</h3>
              <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6">
                <p className="text-white/60 text-sm mb-4">
                  We retain your information only as long as necessary to provide services and
                  comply with legal obligations:
                </p>
                <ul className="space-y-2 text-white/50 text-sm">
                  <li>
                    <strong className="text-white/70">Account Data:</strong> Retained while your account is active + 30 days
                    after deletion
                  </li>
                  <li>
                    <strong className="text-white/70">Project Data:</strong> Retained for 2 years or until you delete it
                  </li>
                  <li>
                    <strong className="text-white/70">Anonymized Analytics:</strong> Retained indefinitely for market research
                  </li>
                  <li>
                    <strong className="text-white/70">Audit Logs:</strong> Retained for 7 years for security and compliance
                  </li>
                </ul>
              </div>
            </section>

            {/* Cookies */}
            <section>
              <h3 className="text-xl font-bold text-white mb-4">7. Cookies & Tracking</h3>
              <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6">
                <p className="text-white/60 text-sm mb-3">
                  We use cookies and similar technologies to enhance your experience:
                </p>
                <ul className="space-y-2 text-white/50 text-sm">
                  <li>
                    • <strong className="text-white/70">Essential Cookies:</strong> Required for login and security (cannot be
                    disabled)
                  </li>
                  <li>
                    • <strong className="text-white/70">Preference Cookies:</strong> Remember your settings and choices
                  </li>
                  <li>
                    • <strong className="text-white/70">Analytics Cookies:</strong> Help us understand how you use the
                    platform (optional)
                  </li>
                </ul>
              </div>
            </section>

            {/* Changes to Policy */}
            <section>
              <h3 className="text-xl font-bold text-white mb-4">8. Changes to This Policy</h3>
              <p className="text-white/60 text-sm">
                We may update this policy periodically. We&apos;ll notify you of significant changes via
                email or prominent notice on the platform. Continued use after changes indicates
                acceptance.
              </p>
            </section>

            {/* Contact */}
            <section>
              <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">9. Contact Us</h3>
                <p className="text-white/50 text-sm mb-4">Questions about privacy? We&apos;re here to help:</p>
                <div className="space-y-2 text-white/60 text-sm">
                  <p>
                    <strong className="text-white/80">Email:</strong> privacy@merlinenergy.com
                  </p>
                  <p>
                    <strong className="text-white/80">Privacy Officer:</strong> Chief Security Officer
                  </p>
                  <p>
                    <strong className="text-white/80">Response Time:</strong> Within 48 hours
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 border-t border-white/[0.08] p-4">
          <button
            onClick={onClose}
            className="w-full border border-emerald-500/30 text-emerald-400 px-6 py-3 rounded-xl font-semibold hover:bg-emerald-500/10 transition-all"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
}
