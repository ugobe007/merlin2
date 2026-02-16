import { X, Scale, AlertTriangle, CheckCircle } from "lucide-react";

interface TermsOfServiceProps {
  onClose: () => void;
}

export default function TermsOfService({ onClose }: TermsOfServiceProps) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#0f1117] rounded-2xl shadow-2xl max-w-4xl w-full border border-white/[0.08] max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-white/[0.08] flex-shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <Scale size={28} className="text-emerald-400" />
              Terms of Service
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
              <div className="bg-white/[0.03] rounded-xl p-6 border border-white/[0.08]">
                <h3 className="text-lg font-semibold text-white mb-3">Agreement to Terms</h3>
                <p className="text-white/60 leading-relaxed">
                  By accessing and using Merlin Energy (&ldquo;the Platform&rdquo;), you agree to be bound by
                  these Terms of Service. If you do not agree to these terms, please do not use the
                  Platform.
                </p>
              </div>
            </section>

            {/* Use of Platform */}
            <section>
              <h3 className="text-xl font-bold text-white mb-4">1. Use of Platform</h3>

              <div className="space-y-4">
                <div className="bg-emerald-500/[0.06] border border-emerald-500/20 rounded-xl p-5">
                  <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                    <CheckCircle size={18} className="text-emerald-400" />
                    Permitted Uses
                  </h4>
                  <ul className="space-y-2 text-white/60 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400 mt-1">•</span>
                      Generate BESS quotes and project estimates
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400 mt-1">•</span>
                      Save and manage your project portfolio
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400 mt-1">•</span>
                      Access market intelligence data (per your tier)
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400 mt-1">•</span>
                      Upload pricing data for credit rewards (optional)
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400 mt-1">•</span>
                      Connect with vendors through our marketplace
                    </li>
                  </ul>
                </div>

                <div className="bg-red-500/[0.06] border border-red-500/20 rounded-xl p-5">
                  <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                    <AlertTriangle size={18} className="text-red-400" />
                    Prohibited Uses
                  </h4>
                  <ul className="space-y-2 text-white/60 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-red-400 mt-1">•</span>
                      Scraping or automated data collection
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-400 mt-1">•</span>
                      Sharing your account credentials
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-400 mt-1">•</span>
                      Uploading malware or malicious code
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-400 mt-1">•</span>
                      Impersonating others or providing false information
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-400 mt-1">•</span>
                      Violating intellectual property rights
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-400 mt-1">•</span>
                      Attempting to access unauthorized areas
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Account Responsibilities */}
            <section>
              <h3 className="text-xl font-bold text-white mb-4">2. Account Responsibilities</h3>
              <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6">
                <ul className="space-y-3 text-white/60 text-sm">
                  <li>
                    <strong className="text-white/80">Accurate Information:</strong> Provide truthful and complete
                    registration details
                  </li>
                  <li>
                    <strong className="text-white/80">Security:</strong> Maintain confidentiality of your password and account
                  </li>
                  <li>
                    <strong className="text-white/80">Notifications:</strong> Promptly notify us of any unauthorized access
                  </li>
                  <li>
                    <strong className="text-white/80">Responsibility:</strong> You are responsible for all activity under your
                    account
                  </li>
                  <li>
                    <strong className="text-white/80">Age Requirement:</strong> You must be 18+ to use this platform
                  </li>
                </ul>
              </div>
            </section>

            {/* Subscription & Billing */}
            <section>
              <h3 className="text-xl font-bold text-white mb-4">3. Subscription & Billing</h3>
              <div className="space-y-4">
                <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5">
                  <h4 className="font-semibold text-white mb-2">Free Tier</h4>
                  <p className="text-white/50 text-sm">
                    Access to basic features with limitations. May include ads or promotional
                    content.
                  </p>
                </div>
                <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5">
                  <h4 className="font-semibold text-white mb-2">Paid Tiers</h4>
                  <ul className="text-white/50 text-sm space-y-1">
                    <li>• Billed monthly or annually as selected</li>
                    <li>• Automatically renews unless cancelled</li>
                    <li>• Cancel anytime — no refunds for partial periods</li>
                    <li>• Price changes require 30 days notice</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Intellectual Property */}
            <section>
              <h3 className="text-xl font-bold text-white mb-4">4. Intellectual Property</h3>
              <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6 space-y-3 text-white/60 text-sm">
                <p>
                  <strong className="text-white/80">Our IP:</strong> The Platform, including all software, algorithms,
                  designs, and content, is owned by Merlin Energy and protected by copyright and
                  trademark laws.
                </p>
                <p>
                  <strong className="text-white/80">Your Content:</strong> You retain ownership of data you upload. By using
                  the Platform, you grant us a license to use your content to provide services and
                  improve the platform.
                </p>
                <p>
                  <strong className="text-white/80">Pricing Data:</strong> Data shared for market intelligence becomes part
                  of our anonymized database. You cannot withdraw already-shared data.
                </p>
              </div>
            </section>

            {/* Vendor Marketplace */}
            <section>
              <h3 className="text-xl font-bold text-white mb-4">5. Vendor Marketplace Terms</h3>
              <div className="bg-amber-500/[0.06] border border-amber-500/20 rounded-xl p-6">
                <ul className="space-y-3 text-white/60 text-sm">
                  <li>
                    <strong className="text-white/80">Lead Fees:</strong> Vendors pay an 8% fee on successful project closes
                  </li>
                  <li>
                    <strong className="text-white/80">No Guarantee:</strong> We do not guarantee leads will convert to sales
                  </li>
                  <li>
                    <strong className="text-white/80">Lead Quality:</strong> We match based on criteria provided, but cannot
                    verify customer intent
                  </li>
                  <li>
                    <strong className="text-white/80">Payment:</strong> Fees are due within 30 days of project close
                  </li>
                  <li>
                    <strong className="text-white/80">Disputes:</strong> Report any issues within 14 days for investigation
                  </li>
                </ul>
              </div>
            </section>

            {/* Disclaimers */}
            <section>
              <h3 className="text-xl font-bold text-white mb-4">
                6. Disclaimers & Limitations
              </h3>
              <div className="bg-red-500/[0.06] border border-red-500/20 rounded-xl p-6">
                <p className="font-semibold text-red-400 mb-3 text-xs uppercase tracking-wider">Important Legal Notice</p>
                <ul className="space-y-2 text-white/60 text-sm">
                  <li>
                    <strong className="text-white/80">No Warranties:</strong> Platform provided &ldquo;AS IS&rdquo; without warranties of
                    any kind
                  </li>
                  <li>
                    <strong className="text-white/80">Estimates Only:</strong> Quotes are estimates, not guaranteed prices
                  </li>
                  <li>
                    <strong className="text-white/80">No Professional Advice:</strong> Not a substitute for engineering or
                    legal consultation
                  </li>
                  <li>
                    <strong className="text-white/80">Third-Party Data:</strong> Market data may be inaccurate or outdated
                  </li>
                  <li>
                    <strong className="text-white/80">Availability:</strong> We do not guarantee uninterrupted or error-free
                    service
                  </li>
                  <li>
                    <strong className="text-white/80">Limitation of Liability:</strong> Our liability is limited to fees paid
                    in the last 12 months
                  </li>
                </ul>
              </div>
            </section>

            {/* Termination */}
            <section>
              <h3 className="text-xl font-bold text-white mb-4">7. Termination</h3>
              <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6">
                <p className="text-white/60 text-sm mb-3">
                  We reserve the right to suspend or terminate accounts that:
                </p>
                <ul className="space-y-1 text-white/50 text-sm">
                  <li>• Violate these Terms of Service</li>
                  <li>• Engage in fraudulent activity</li>
                  <li>• Fail to pay subscription fees</li>
                  <li>• Pose security risks to the platform</li>
                </ul>
                <p className="text-white/50 text-sm mt-3">
                  Upon termination, you lose access to the platform and your data may be deleted
                  after 30 days.
                </p>
              </div>
            </section>

            {/* Indemnification */}
            <section>
              <h3 className="text-xl font-bold text-white mb-4">8. Indemnification</h3>
              <p className="text-white/60 text-sm">
                You agree to indemnify and hold Merlin Energy harmless from any claims, damages, or
                expenses arising from your use of the platform, violation of these terms, or
                infringement of third-party rights.
              </p>
            </section>

            {/* Governing Law */}
            <section>
              <h3 className="text-xl font-bold text-white mb-4">9. Governing Law</h3>
              <p className="text-white/60 text-sm">
                These terms are governed by the laws of the State of Delaware, USA. Any disputes
                will be resolved through binding arbitration in Delaware.
              </p>
            </section>

            {/* Changes to Terms */}
            <section>
              <h3 className="text-xl font-bold text-white mb-4">10. Changes to Terms</h3>
              <p className="text-white/60 text-sm">
                We may modify these terms at any time. Material changes will be communicated via
                email or platform notification. Continued use after changes constitutes acceptance.
              </p>
            </section>

            {/* Contact */}
            <section>
              <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Questions?</h3>
                <p className="text-white/50 text-sm mb-4">Contact us about these terms:</p>
                <div className="space-y-2 text-white/60 text-sm">
                  <p>
                    <strong className="text-white/80">Email:</strong> legal@merlinenergy.com
                  </p>
                  <p>
                    <strong className="text-white/80">Address:</strong> Merlin Energy Inc., Delaware, USA
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
            I Agree to Terms
          </button>
        </div>
      </div>
    </div>
  );
}
