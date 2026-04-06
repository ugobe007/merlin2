import React, { useState } from "react";
import { X, Mail, Lock, Eye, EyeOff, User, Building2 } from "lucide-react";
import { authService } from "../services/authService";

// Google SVG icon
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

// GitHub SVG icon
const GitHubIcon = () => (
  <svg
    className="w-5 h-5"
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
  </svg>
);

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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

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
          setSuccessMessage(
            `Welcome to Merlin Energy, ${result.user.firstName}! Your account has been created.`
          );
          setTimeout(() => {
            onLoginSuccess(result.user);
            onClose();
          }, 1200);
        } else {
          setErrorMessage(result.error || "Signup failed. Please try again.");
          if (result.error?.includes("already exists")) {
            setMode("login");
          }
        }
      } else {
        const result = await authService.signIn(formData.email, formData.password);

        if (result.success && result.user) {
          setSuccessMessage(`Welcome back, ${result.user.firstName}!`);
          setTimeout(() => {
            onLoginSuccess(result.user);
            onClose();
          }, 800);
        } else {
          setErrorMessage(result.error || "Login failed. Please check your credentials.");
          if (result.error?.includes("No account found")) {
            setMode("signup");
          }
        }
      }
    } catch (error) {
      console.error("Authentication error:", error);
      setErrorMessage("Authentication failed. Please try again.");
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
          <div className="mb-4">
            <img
              src="/images/new_profile_merlin.png"
              alt="Merlin"
              className="w-16 h-16 rounded-xl mx-auto"
            />
          </div>
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

          {errorMessage && (
            <div
              className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 font-medium"
              role="alert"
            >
              {errorMessage}
            </div>
          )}
          {successMessage && (
            <div
              className="rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700 font-medium"
              role="status"
            >
              ✅ {successMessage}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-b from-purple-500 to-purple-700 text-white py-3 rounded-xl font-bold text-lg hover:from-purple-600 hover:to-purple-800 transition-all disabled:opacity-50"
          >
            {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
          </button>
        </form>

        {/* OAuth divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400 font-medium">or continue with</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* OAuth buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            disabled={loading}
            onClick={() => {
              setLoading(true);
              setErrorMessage(null);
              authService.signInWithOAuth("google").catch(() => {
                setErrorMessage("Google sign-in failed. Please try again.");
                setLoading(false);
              });
            }}
            className="flex items-center justify-center gap-2 border-2 border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-semibold py-3 rounded-xl transition-all disabled:opacity-50"
          >
            <GoogleIcon />
            Google
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => {
              setLoading(true);
              setErrorMessage(null);
              authService.signInWithOAuth("github").catch(() => {
                setErrorMessage("GitHub sign-in failed. Please try again.");
                setLoading(false);
              });
            }}
            className="flex items-center justify-center gap-2 border-2 border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-semibold py-3 rounded-xl transition-all disabled:opacity-50"
          >
            <GitHubIcon />
            GitHub
          </button>
        </div>

        <div className="mt-5 text-center space-y-2">
          <button
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
            className="text-purple-600 hover:text-purple-800 font-semibold text-sm block w-full"
          >
            {mode === "login"
              ? "Don't have an account? Sign up"
              : "Already have an account? Sign in"}
          </button>
          {mode === "login" && (
            <button
              type="button"
              onClick={async () => {
                const email = formData.email || prompt("Enter your email address:");
                if (!email) return;
                setLoading(true);
                const result = await authService.resetPassword(email);
                setLoading(false);
                setErrorMessage(null);
                setSuccessMessage(result.error ?? "Password reset email sent — check your inbox.");
              }}
              className="text-gray-400 hover:text-gray-600 text-xs"
            >
              Forgot password?
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
