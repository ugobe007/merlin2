import React from "react";
import {
  AlertCircle,
  Loader2,
  TrendingUp,
  DollarSign,
  FileText,
  CheckCircle,
  ShieldCheck,
  ArrowLeft,
} from "lucide-react";
import merlinIcon from "@/assets/images/new_small_profile_.png";
import badgeIcon from "@/assets/images/badge_icon.jpg";

interface LoginForm {
  email: string;
  password: string;
}

interface RegistrationForm {
  company: string;
  contact_name: string;
  email: string;
  phone: string;
  password: string;
  specialty: "battery" | "inverter" | "ems" | "bos" | "epc" | "integrator" | "";
  website: string;
  description: string;
}

interface VendorLoginScreenProps {
  error: string | null;
  isLoading: boolean;
  loginForm: LoginForm;
  setLoginForm: (form: LoginForm) => void;
  registrationForm: RegistrationForm;
  setRegistrationForm: (form: RegistrationForm) => void;
  showRegistration: boolean;
  setShowRegistration: (show: boolean) => void;
  onLogin: (e: React.FormEvent) => void;
  onRegister: (e: React.FormEvent) => void;
  onClearError: () => void;
}

const VendorLoginScreen: React.FC<VendorLoginScreenProps> = ({
  error,
  isLoading,
  loginForm,
  setLoginForm,
  registrationForm,
  setRegistrationForm,
  showRegistration,
  setShowRegistration,
  onLogin,
  onRegister,
  onClearError,
}) => {
  return (
    <div className="min-h-screen bg-[#0f1117] py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Back to Home */}
        <div className="mb-6">
          <a
            href="/"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-emerald-400 transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Merlin Home
          </a>
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-4 mb-4">
            {/* ProQuote Blue Shield Badge */}
            <div className="relative w-16 h-16 flex-shrink-0">
              <img src={badgeIcon} alt="ProQuote" className="w-16 h-16 rounded-xl object-cover" />
              <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center ring-2 ring-[#0f1117]">
                <ShieldCheck className="w-4 h-4 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">
                Pro<span className="text-[#3ECF8E]">Quote</span>™
              </h1>
              <p className="text-sm text-slate-400 font-medium">Vendor Partner Portal</p>
            </div>
          </div>
          <p className="text-xl text-slate-400">
            Partner with Merlin to provide competitive pricing for energy storage solutions
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Login Section */}
          <div className="rounded-xl p-8 border border-white/[0.06] bg-[rgba(255,255,255,0.03)]">
            <div className="flex items-center gap-3 mb-6">
              <img src={merlinIcon} alt="Merlin" className="w-8 h-8 rounded-lg" />
              <h2 className="text-2xl font-bold text-white">Vendor Login</h2>
            </div>

            {/* Error Display */}
            {error && (
              <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="text-red-300 text-sm">{error}</div>
              </div>
            )}

            <form onSubmit={onLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={loginForm.email}
                  onChange={(e) => {
                    setLoginForm({ ...loginForm, email: e.target.value });
                    onClearError();
                  }}
                  className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-[#3ECF8E]/50 focus:border-[#3ECF8E]/50 transition-colors"
                  placeholder="vendor@company.com"
                  required
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => {
                    setLoginForm({ ...loginForm, password: e.target.value });
                    onClearError();
                  }}
                  className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-[#3ECF8E]/50 focus:border-[#3ECF8E]/50 transition-colors"
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#3ECF8E] hover:bg-[#35b87a] text-[#0f1117] py-3 rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  "Sign In"
                )}
              </button>

              <p className="text-center text-sm text-slate-500 mt-4">
                <a href="#" className="text-[#3ECF8E] hover:underline">
                  Forgot password?
                </a>
              </p>
            </form>
          </div>

          {/* Benefits Section */}
          <div className="rounded-xl p-8 border border-[#3ECF8E]/20 bg-gradient-to-br from-[#3ECF8E]/[0.06] to-transparent">
            <h2 className="text-2xl font-bold text-white mb-6">Why Partner with Merlin?</h2>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <TrendingUp className="w-6 h-6 text-[#3ECF8E] flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-lg text-white">Access to Active RFQs</h3>
                  <p className="text-slate-400 text-sm">
                    Real-time notifications for projects matching your products
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <DollarSign className="w-6 h-6 text-[#3ECF8E] flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-lg text-white">Competitive Exposure</h3>
                  <p className="text-slate-400 text-sm">
                    Your pricing included in thousands of quotes generated monthly
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <FileText className="w-6 h-6 text-[#3ECF8E] flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-lg text-white">Streamlined Process</h3>
                  <p className="text-slate-400 text-sm">
                    Simple pricing submission and proposal management
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-[#3ECF8E] flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-lg text-white">Transparent Platform</h3>
                  <p className="text-slate-400 text-sm">
                    Fair comparison based on price, lead time, and quality
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowRegistration(true)}
              className="w-full border-2 border-[#3ECF8E] text-[#3ECF8E] hover:bg-[#3ECF8E]/10 py-3 rounded-lg font-bold mt-8 transition-all"
            >
              Become a Vendor Partner
            </button>
          </div>
        </div>

        {/* Registration Modal */}
        {showRegistration && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#1a1c23] border border-white/[0.08] rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8">
              <div className="flex items-center gap-3 mb-6">
                <img src={merlinIcon} alt="Merlin" className="w-8 h-8 rounded-lg" />
                <h2 className="text-2xl font-bold text-white">Vendor Registration</h2>
              </div>

              {/* Error Display */}
              {error && (
                <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="text-red-300 text-sm">{error}</div>
                </div>
              )}

              <form onSubmit={onRegister} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Company Name *
                    </label>
                    <input
                      type="text"
                      value={registrationForm.company}
                      onChange={(e) => {
                        setRegistrationForm({ ...registrationForm, company: e.target.value });
                        onClearError();
                      }}
                      className="w-full px-4 py-2 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-[#3ECF8E]/50 focus:border-[#3ECF8E]/50"
                      required
                      disabled={isLoading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Contact Name *
                    </label>
                    <input
                      type="text"
                      value={registrationForm.contact_name}
                      onChange={(e) =>
                        setRegistrationForm({
                          ...registrationForm,
                          contact_name: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-[#3ECF8E]/50 focus:border-[#3ECF8E]/50"
                      required
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={registrationForm.email}
                      onChange={(e) =>
                        setRegistrationForm({ ...registrationForm, email: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-[#3ECF8E]/50 focus:border-[#3ECF8E]/50"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={registrationForm.phone}
                      onChange={(e) =>
                        setRegistrationForm({ ...registrationForm, phone: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-[#3ECF8E]/50 focus:border-[#3ECF8E]/50"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Password *
                  </label>
                  <input
                    type="password"
                    value={registrationForm.password}
                    onChange={(e) =>
                      setRegistrationForm({ ...registrationForm, password: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-[#3ECF8E]/50 focus:border-[#3ECF8E]/50"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Specialty/Product Category *
                  </label>
                  <select
                    value={registrationForm.specialty}
                    onChange={(e) =>
                      setRegistrationForm({
                        ...registrationForm,
                        specialty: e.target.value as typeof registrationForm.specialty,
                      })
                    }
                    className="w-full px-4 py-2 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white focus:ring-2 focus:ring-[#3ECF8E]/50 focus:border-[#3ECF8E]/50"
                    required
                  >
                    <option value="">Select category...</option>
                    <option value="battery">Battery Manufacturer</option>
                    <option value="inverter">Inverter/PCS Manufacturer</option>
                    <option value="ems">EMS Software Provider</option>
                    <option value="bos">Balance of System</option>
                    <option value="epc">EPC Contractor</option>
                    <option value="integrator">System Integrator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Company Website
                  </label>
                  <input
                    type="url"
                    value={registrationForm.website}
                    onChange={(e) =>
                      setRegistrationForm({ ...registrationForm, website: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-[#3ECF8E]/50 focus:border-[#3ECF8E]/50"
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Company Description
                  </label>
                  <textarea
                    value={registrationForm.description}
                    onChange={(e) =>
                      setRegistrationForm({ ...registrationForm, description: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-[#3ECF8E]/50 focus:border-[#3ECF8E]/50"
                    rows={4}
                    placeholder="Tell us about your company and products..."
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowRegistration(false);
                      onClearError();
                    }}
                    disabled={isLoading}
                    className="flex-1 bg-white/[0.06] text-slate-300 py-3 rounded-lg font-semibold hover:bg-white/[0.1] border border-white/[0.1] transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 bg-[#3ECF8E] hover:bg-[#35b87a] text-[#0f1117] py-3 rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Registering...
                      </>
                    ) : (
                      "Submit Registration"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorLoginScreen;
