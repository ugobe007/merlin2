import { X, Shield, Lock, Eye, Database, UserCheck, FileText } from "lucide-react";

interface PrivacyPolicyProps {
  onClose: () => void;
}

export default function PrivacyPolicy({ onClose }: PrivacyPolicyProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border-4 border-blue-300 max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex-shrink-0">
          <div>
            <h2 className="text-3xl font-bold flex items-center gap-3">
              <Shield size={32} />
              Privacy Policy
            </h2>
            <p className="text-blue-100 mt-1">Last Updated: October 22, 2025</p>
          </div>
          <button
            onClick={onClose}
            className="text-blue-200 hover:text-white transition-colors p-2 rounded-lg hover:bg-blue-700"
          >
            <X size={28} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="space-y-8">
            {/* Introduction */}
            <section>
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200">
                <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <FileText size={24} className="text-blue-600" />
                  Our Commitment to Your Privacy
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  At Merlin Energy, we take your privacy seriously. This policy explains how we
                  collect, use, protect, and share your information. We are committed to
                  transparency and giving you control over your data.
                </p>
              </div>
            </section>

            {/* Information We Collect */}
            <section>
              <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Database size={24} className="text-purple-600" />
                1. Information We Collect
              </h3>

              <div className="space-y-4">
                <div className="border-l-4 border-purple-500 pl-4">
                  <h4 className="font-bold text-gray-900 mb-2">Account Information</h4>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    <li>Name, email address, job title</li>
                    <li>Company name (for business accounts)</li>
                    <li>Password (encrypted and never stored in plain text)</li>
                    <li>Account preferences and settings</li>
                  </ul>
                </div>

                <div className="border-l-4 border-purple-500 pl-4">
                  <h4 className="font-bold text-gray-900 mb-2">Project & Quote Data</h4>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    <li>BESS system specifications and configurations</li>
                    <li>Project locations and requirements</li>
                    <li>Saved quotes and calculations</li>
                    <li>Use case templates applied</li>
                  </ul>
                </div>

                <div className="border-l-4 border-purple-500 pl-4">
                  <h4 className="font-bold text-gray-900 mb-2">Pricing Data (Optional)</h4>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    <li>Uploaded price sheets and quotes (with your consent)</li>
                    <li>Vendor information (anonymized for market intelligence)</li>
                    <li>Equipment pricing and specifications</li>
                    <li>
                      <strong>Note:</strong> You control what pricing data you share
                    </li>
                  </ul>
                </div>

                <div className="border-l-4 border-purple-500 pl-4">
                  <h4 className="font-bold text-gray-900 mb-2">Usage Information</h4>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    <li>Features used and frequency</li>
                    <li>Time spent on platform</li>
                    <li>Browser type and device information</li>
                    <li>IP address (for security purposes)</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* How We Use Your Information */}
            <section>
              <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <UserCheck size={24} className="text-green-600" />
                2. How We Use Your Information
              </h3>

              <div className="bg-green-50 rounded-lg p-6 space-y-3">
                <div className="flex items-start gap-3">
                  <span className="text-green-600 font-bold text-xl">✓</span>
                  <div>
                    <strong>Provide Services:</strong> Generate quotes, save projects, deliver
                    market intelligence
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-green-600 font-bold text-xl">✓</span>
                  <div>
                    <strong>Improve Platform:</strong> Analyze usage patterns to enhance features
                    and user experience
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-green-600 font-bold text-xl">✓</span>
                  <div>
                    <strong>Market Intelligence:</strong> Aggregate anonymized pricing data for
                    industry insights
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-green-600 font-bold text-xl">✓</span>
                  <div>
                    <strong>Vendor Matching:</strong> Connect customers with qualified vendors (with
                    consent)
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-green-600 font-bold text-xl">✓</span>
                  <div>
                    <strong>Security:</strong> Detect and prevent fraud, abuse, and unauthorized
                    access
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-green-600 font-bold text-xl">✓</span>
                  <div>
                    <strong>Communications:</strong> Send important updates, feature announcements,
                    and support messages
                  </div>
                </div>
              </div>
            </section>

            {/* Data Protection */}
            <section>
              <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Lock size={24} className="text-red-600" />
                3. How We Protect Your Data
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white border-2 border-gray-200 rounded-xl p-4">
                  <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <span className="text-2xl">🔐</span>
                    Encryption
                  </h4>
                  <p className="text-sm text-gray-700">
                    All data is encrypted in transit (TLS/SSL) and at rest using industry-standard
                    encryption
                  </p>
                </div>

                <div className="bg-white border-2 border-gray-200 rounded-xl p-4">
                  <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <span className="text-2xl">🛡️</span>
                    Access Controls
                  </h4>
                  <p className="text-sm text-gray-700">
                    Role-based permissions ensure only authorized users can access sensitive data
                  </p>
                </div>

                <div className="bg-white border-2 border-gray-200 rounded-xl p-4">
                  <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <span className="text-2xl">📝</span>
                    Audit Logs
                  </h4>
                  <p className="text-sm text-gray-700">
                    All data access and modifications are logged for security monitoring and
                    compliance
                  </p>
                </div>

                <div className="bg-white border-2 border-gray-200 rounded-xl p-4">
                  <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <span className="text-2xl">🔄</span>
                    Regular Backups
                  </h4>
                  <p className="text-sm text-gray-700">
                    Automated backups ensure your data is never lost and can be recovered if needed
                  </p>
                </div>
              </div>
            </section>

            {/* Data Sharing */}
            <section>
              <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Eye size={24} className="text-orange-600" />
                4. When We Share Your Information
              </h3>

              <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-6">
                <p className="font-bold text-gray-900 mb-3">
                  We NEVER sell your personal information to third parties.
                </p>
                <p className="text-gray-700 mb-4">
                  We only share information in these specific circumstances:
                </p>

                <div className="space-y-3">
                  <div className="bg-white rounded-lg p-4">
                    <strong className="text-gray-900">With Your Consent:</strong>
                    <p className="text-gray-700 text-sm mt-1">
                      When you opt-in to share pricing data for market intelligence or vendor
                      matching
                    </p>
                  </div>

                  <div className="bg-white rounded-lg p-4">
                    <strong className="text-gray-900">Service Providers:</strong>
                    <p className="text-gray-700 text-sm mt-1">
                      Trusted partners who help us operate the platform (hosting, analytics, payment
                      processing)
                    </p>
                  </div>

                  <div className="bg-white rounded-lg p-4">
                    <strong className="text-gray-900">Legal Requirements:</strong>
                    <p className="text-gray-700 text-sm mt-1">
                      When required by law, court order, or to protect rights and safety
                    </p>
                  </div>

                  <div className="bg-white rounded-lg p-4">
                    <strong className="text-gray-900">Aggregated Data:</strong>
                    <p className="text-gray-700 text-sm mt-1">
                      Anonymized, aggregated market statistics that cannot identify individual users
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Your Rights */}
            <section>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">5. Your Privacy Rights</h3>

              <div className="bg-blue-50 rounded-xl p-6 space-y-3">
                <p className="font-bold text-gray-900">You have the right to:</p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">•</span>
                    <span className="text-gray-700">
                      <strong>Access:</strong> Request a copy of all data we have about you
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">•</span>
                    <span className="text-gray-700">
                      <strong>Correct:</strong> Update or correct inaccurate information
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">•</span>
                    <span className="text-gray-700">
                      <strong>Delete:</strong> Request deletion of your personal data
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">•</span>
                    <span className="text-gray-700">
                      <strong>Export:</strong> Download your data in a portable format
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">•</span>
                    <span className="text-gray-700">
                      <strong>Opt-Out:</strong> Decline data sharing for market intelligence
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">•</span>
                    <span className="text-gray-700">
                      <strong>Object:</strong> Object to processing of your data for certain
                      purposes
                    </span>
                  </li>
                </ul>
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <p className="text-sm text-gray-600">
                    To exercise these rights, contact us at{" "}
                    <strong>privacy@merlinenergy.com</strong>
                  </p>
                </div>
              </div>
            </section>

            {/* Data Retention */}
            <section>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">6. Data Retention</h3>
              <div className="bg-gray-50 rounded-lg p-6">
                <p className="text-gray-700 mb-4">
                  We retain your information only as long as necessary to provide services and
                  comply with legal obligations:
                </p>
                <ul className="space-y-2 text-gray-700">
                  <li>
                    <strong>Account Data:</strong> Retained while your account is active + 30 days
                    after deletion
                  </li>
                  <li>
                    <strong>Project Data:</strong> Retained for 2 years or until you delete it
                  </li>
                  <li>
                    <strong>Anonymized Analytics:</strong> Retained indefinitely for market research
                  </li>
                  <li>
                    <strong>Audit Logs:</strong> Retained for 7 years for security and compliance
                  </li>
                </ul>
              </div>
            </section>

            {/* Cookies */}
            <section>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">7. Cookies & Tracking</h3>
              <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
                <p className="text-gray-700 mb-3">
                  We use cookies and similar technologies to enhance your experience:
                </p>
                <ul className="space-y-2 text-gray-700">
                  <li>
                    • <strong>Essential Cookies:</strong> Required for login and security (cannot be
                    disabled)
                  </li>
                  <li>
                    • <strong>Preference Cookies:</strong> Remember your settings and choices
                  </li>
                  <li>
                    • <strong>Analytics Cookies:</strong> Help us understand how you use the
                    platform (optional)
                  </li>
                </ul>
              </div>
            </section>

            {/* Changes to Policy */}
            <section>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">8. Changes to This Policy</h3>
              <p className="text-gray-700">
                We may update this policy periodically. We'll notify you of significant changes via
                email or prominent notice on the platform. Continued use after changes indicates
                acceptance.
              </p>
            </section>

            {/* Contact */}
            <section>
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-200">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">9. Contact Us</h3>
                <p className="text-gray-700 mb-4">Questions about privacy? We're here to help:</p>
                <div className="space-y-2 text-gray-700">
                  <p>
                    <strong>Email:</strong> privacy@merlinenergy.com
                  </p>
                  <p>
                    <strong>Privacy Officer:</strong> Chief Security Officer
                  </p>
                  <p>
                    <strong>Response Time:</strong> Within 48 hours
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 border-t border-gray-200 p-4 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:from-blue-700 hover:to-indigo-700 transition-all"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
}
