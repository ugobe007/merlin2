import React, { useState } from "react";
import { X, Mail, Lock, Eye, EyeOff, User, Building2 } from "lucide-react";
import { authService } from "../services/authService";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: any) => void;
  defaultMode?: "login" | "signup";
}

export default function AuthModal({
  isOpen,
  onClose,
  onLoginSuccess,
  defaultMode = "login",
}: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "signup">(defaultMode);
  const [showPassword, setShowPassword] = useState(false);
  const [accountType, setAccountType] = useState<"individual" | "company">("individual");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    company: "",
  });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "signup") {
        const result = await authService.signUp(
          formData.email,
          formData.password,
          formData.firstName,
          formData.lastName,
          formData.company,
          accountType
        );

        if (result.success && result.user) {
          alert(
            `✅ Welcome to Merlin Energy, ${result.user.firstName}!\n\nYour account has been created successfully.`
          );
          onLoginSuccess(result.user);
          onClose();
        } else {
          alert(result.error || "Signup failed");
          if (result.error?.includes("already exists")) {
            setMode("login");
          }
        }
      } else {
        const result = await authService.signIn(formData.email, formData.password);

        if (result.success && result.user) {
          alert(`✅ Welcome back, ${result.user.firstName}!`);
          onLoginSuccess(result.user);
          onClose();
        } else {
          alert(result.error || "Login failed");
          if (result.error?.includes("No account found")) {
            setMode("signup");
          }
        }
      }
    } catch (error) {
      console.error('Authentication error:', error);
      alert("Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full mx-4 p-8 border-4 border-purple-300 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X size={24} />
        </button>

        <div className="text-center mb-8">
          <div className="mb-4"><img src="/images/new_profile_merlin.png" alt="Merlin" className="w-16 h-16 rounded-xl mx-auto" /></div>
          <h2 className="text-3xl font-bold text-purple-700 mb-2">
            {mode === "login" ? "Welcome Back!" : "Join Merlin Energy"}
          </h2>
          <p className="text-gray-600">
            {mode === "login"
              ? "Sign in to access your saved quotes"
              : "Create an account to save your BESS quotes"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <>
              {/* Account Type Selection */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-3">Account Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setAccountType("individual")}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      accountType === "individual"
                        ? "border-purple-500 bg-purple-50"
                        : "border-gray-300 hover:border-purple-300"
                    }`}
                  >
                    <User
                      className={`mx-auto mb-2 ${accountType === "individual" ? "text-purple-600" : "text-gray-400"}`}
                      size={32}
                    />
                    <div className="text-center">
                      <div className="font-bold text-gray-900">Individual</div>
                      <div className="text-xs text-gray-600 mt-1">Personal account</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAccountType("company")}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      accountType === "company"
                        ? "border-purple-500 bg-purple-50"
                        : "border-gray-300 hover:border-purple-300"
                    }`}
                  >
                    <Building2
                      className={`mx-auto mb-2 ${accountType === "company" ? "text-purple-600" : "text-gray-400"}`}
                      size={32}
                    />
                    <div className="text-center">
                      <div className="font-bold text-gray-900">Company</div>
                      <div className="text-xs text-gray-600 mt-1">Team account (5 free seats)</div>
                    </div>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">First Name</label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 focus:border-purple-400 focus:outline-none text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Last Name</label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 focus:border-purple-400 focus:outline-none text-gray-900"
                  />
                </div>
              </div>

              {/* Company Name - Required for company accounts, optional for individual */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Company {accountType === "company" && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="text"
                  required={accountType === "company"}
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 focus:border-purple-400 focus:outline-none text-gray-900"
                  placeholder={accountType === "company" ? "Your Company Name" : "Optional"}
                />
                {accountType === "company" && (
                  <p className="text-xs text-gray-500 mt-1">Your team gets 5 free user seats</p>
                )}
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Email</label>
            <div className="relative">
              <Mail
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full border-2 border-gray-300 rounded-xl px-12 py-3 focus:border-purple-400 focus:outline-none text-gray-900"
                placeholder="your@email.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Password</label>
            <div className="relative">
              <Lock
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full border-2 border-gray-300 rounded-xl px-12 py-3 pr-12 focus:border-purple-400 focus:outline-none text-gray-900"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-b from-purple-500 to-purple-700 text-white py-3 rounded-xl font-bold text-lg hover:from-purple-600 hover:to-purple-800 transition-all disabled:opacity-50"
          >
            {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
            className="text-purple-600 hover:text-purple-800 font-semibold"
          >
            {mode === "login"
              ? "Don't have an account? Sign up"
              : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
