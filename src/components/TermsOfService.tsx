import { X, FileText, Scale, AlertTriangle, CheckCircle } from 'lucide-react';

interface TermsOfServiceProps {
  onClose: () => void;
}

export default function TermsOfService({ onClose }: TermsOfServiceProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border-4 border-purple-300 max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 bg-gradient-to-r from-purple-600 to-indigo-600 text-white flex-shrink-0">
          <div>
            <h2 className="text-3xl font-bold flex items-center gap-3">
              <Scale size={32} />
              Terms of Service
            </h2>
            <p className="text-purple-100 mt-1">Last Updated: October 22, 2025</p>
          </div>
          <button 
            onClick={onClose} 
            className="text-purple-200 hover:text-white transition-colors p-2 rounded-lg hover:bg-purple-700"
          >
            <X size={28} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="space-y-8">
            {/* Introduction */}
            <section>
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 border-2 border-purple-200">
                <h3 className="text-xl font-bold text-gray-900 mb-3">Agreement to Terms</h3>
                <p className="text-gray-700 leading-relaxed">
                  By accessing and using Merlin Energy ("the Platform"), you agree to be bound by these Terms of Service. 
                  If you do not agree to these terms, please do not use the Platform.
                </p>
              </div>
            </section>

            {/* Use of Platform */}
            <section>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">1. Use of Platform</h3>
              
              <div className="space-y-4">
                <div className="bg-green-50 border-l-4 border-green-500 p-4">
                  <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <CheckCircle size={20} className="text-green-600" />
                    Permitted Uses
                  </h4>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    <li>Generate BESS quotes and project estimates</li>
                    <li>Save and manage your project portfolio</li>
                    <li>Access market intelligence data (per your tier)</li>
                    <li>Upload pricing data for credit rewards (optional)</li>
                    <li>Connect with vendors through our marketplace</li>
                  </ul>
                </div>

                <div className="bg-red-50 border-l-4 border-red-500 p-4">
                  <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <AlertTriangle size={20} className="text-red-600" />
                    Prohibited Uses
                  </h4>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    <li>Scraping or automated data collection</li>
                    <li>Sharing your account credentials</li>
                    <li>Uploading malware or malicious code</li>
                    <li>Impersonating others or providing false information</li>
                    <li>Violating intellectual property rights</li>
                    <li>Attempting to access unauthorized areas</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Account Responsibilities */}
            <section>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">2. Account Responsibilities</h3>
              <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
                <ul className="space-y-3 text-gray-700">
                  <li><strong>Accurate Information:</strong> Provide truthful and complete registration details</li>
                  <li><strong>Security:</strong> Maintain confidentiality of your password and account</li>
                  <li><strong>Notifications:</strong> Promptly notify us of any unauthorized access</li>
                  <li><strong>Responsibility:</strong> You are responsible for all activity under your account</li>
                  <li><strong>Age Requirement:</strong> You must be 18+ to use this platform</li>
                </ul>
              </div>
            </section>

            {/* Subscription & Billing */}
            <section>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">3. Subscription & Billing</h3>
              <div className="space-y-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-bold text-gray-900 mb-2">Free Tier</h4>
                  <p className="text-gray-700 text-sm">
                    Access to basic features with limitations. May include ads or promotional content.
                  </p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <h4 className="font-bold text-gray-900 mb-2">Paid Tiers</h4>
                  <ul className="text-gray-700 text-sm space-y-1">
                    <li>• Billed monthly or annually as selected</li>
                    <li>• Automatically renews unless cancelled</li>
                    <li>• Cancel anytime - no refunds for partial periods</li>
                    <li>• Price changes require 30 days notice</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Intellectual Property */}
            <section>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">4. Intellectual Property</h3>
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="space-y-3 text-gray-700">
                  <p>
                    <strong>Our IP:</strong> The Platform, including all software, algorithms, designs, and content, 
                    is owned by Merlin Energy and protected by copyright and trademark laws.
                  </p>
                  <p>
                    <strong>Your Content:</strong> You retain ownership of data you upload. By using the Platform, 
                    you grant us a license to use your content to provide services and improve the platform.
                  </p>
                  <p>
                    <strong>Pricing Data:</strong> Data shared for market intelligence becomes part of our 
                    anonymized database. You cannot withdraw already-shared data.
                  </p>
                </div>
              </div>
            </section>

            {/* Vendor Marketplace */}
            <section>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">5. Vendor Marketplace Terms</h3>
              <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6">
                <ul className="space-y-3 text-gray-700">
                  <li>
                    <strong>Lead Fees:</strong> Vendors pay an 8% fee on successful project closes
                  </li>
                  <li>
                    <strong>No Guarantee:</strong> We do not guarantee leads will convert to sales
                  </li>
                  <li>
                    <strong>Lead Quality:</strong> We match based on criteria provided, but cannot verify customer intent
                  </li>
                  <li>
                    <strong>Payment:</strong> Fees are due within 30 days of project close
                  </li>
                  <li>
                    <strong>Disputes:</strong> Report any issues within 14 days for investigation
                  </li>
                </ul>
              </div>
            </section>

            {/* Disclaimers */}
            <section>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">6. Disclaimers & Limitations</h3>
              <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6">
                <p className="font-bold text-red-900 mb-3 uppercase">Important Legal Notice:</p>
                <ul className="space-y-2 text-gray-700 text-sm">
                  <li>
                    <strong>No Warranties:</strong> Platform provided "AS IS" without warranties of any kind
                  </li>
                  <li>
                    <strong>Estimates Only:</strong> Quotes are estimates, not guaranteed prices
                  </li>
                  <li>
                    <strong>No Professional Advice:</strong> Not a substitute for engineering or legal consultation
                  </li>
                  <li>
                    <strong>Third-Party Data:</strong> Market data may be inaccurate or outdated
                  </li>
                  <li>
                    <strong>Availability:</strong> We do not guarantee uninterrupted or error-free service
                  </li>
                  <li>
                    <strong>Limitation of Liability:</strong> Our liability is limited to fees paid in the last 12 months
                  </li>
                </ul>
              </div>
            </section>

            {/* Termination */}
            <section>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">7. Termination</h3>
              <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
                <p className="text-gray-700 mb-3">
                  We reserve the right to suspend or terminate accounts that:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>Violate these Terms of Service</li>
                  <li>Engage in fraudulent activity</li>
                  <li>Fail to pay subscription fees</li>
                  <li>Pose security risks to the platform</li>
                </ul>
                <p className="text-gray-700 mt-3">
                  Upon termination, you lose access to the platform and your data may be deleted after 30 days.
                </p>
              </div>
            </section>

            {/* Indemnification */}
            <section>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">8. Indemnification</h3>
              <p className="text-gray-700">
                You agree to indemnify and hold Merlin Energy harmless from any claims, damages, or expenses 
                arising from your use of the platform, violation of these terms, or infringement of third-party rights.
              </p>
            </section>

            {/* Governing Law */}
            <section>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">9. Governing Law</h3>
              <p className="text-gray-700">
                These terms are governed by the laws of the State of Delaware, USA. Any disputes will be 
                resolved through binding arbitration in Delaware.
              </p>
            </section>

            {/* Changes to Terms */}
            <section>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">10. Changes to Terms</h3>
              <p className="text-gray-700">
                We may modify these terms at any time. Material changes will be communicated via email or 
                platform notification. Continued use after changes constitutes acceptance.
              </p>
            </section>

            {/* Contact */}
            <section>
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-200">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Questions?</h3>
                <p className="text-gray-700 mb-4">
                  Contact us about these terms:
                </p>
                <div className="space-y-2 text-gray-700">
                  <p><strong>Email:</strong> legal@merlinenergy.com</p>
                  <p><strong>Address:</strong> Merlin Energy Inc., Delaware, USA</p>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 border-t border-gray-200 p-4 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:from-purple-700 hover:to-indigo-700 transition-all"
          >
            I Agree to Terms
          </button>
        </div>
      </div>
    </div>
  );
}
