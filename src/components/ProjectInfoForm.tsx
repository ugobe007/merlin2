import React, { useState, useEffect } from "react";
import { User, Mail, MapPin, Target, Calendar, CheckCircle } from "lucide-react";
import { supabase } from "../services/supabaseClient";

interface ProjectInfoFormProps {
  onComplete: (data: {
    projectName: string;
    projectLocation?: string;
    projectGoals: string;
    projectSchedule?: string;
    userName: string;
    email: string;
    userId?: string;
  }) => void;
  initialData?: {
    projectName?: string;
    projectLocation?: string;
    projectGoals?: string;
    projectSchedule?: string;
    userName?: string;
    email?: string;
  };
}

export const ProjectInfoForm: React.FC<ProjectInfoFormProps> = ({ onComplete, initialData }) => {
  const [formData, setFormData] = useState({
    projectName: initialData?.projectName || "",
    projectLocation: initialData?.projectLocation || "",
    projectGoals: initialData?.projectGoals || "",
    projectSchedule: initialData?.projectSchedule || "",
    userName: initialData?.userName || "",
    email: initialData?.email || "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        // User is logged in, pre-fill email and name
        const { data: profile } = await supabase
          .from("users")
          .select("email, full_name")
          .eq("id", user.id)
          .single();

        if (profile) {
          setFormData((prev) => ({
            ...prev,
            email: profile.email || user.email || "",
            userName: profile.full_name || user.user_metadata?.full_name || "",
          }));
        }
      }
    };
    checkAuth();
  }, []);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.projectName.trim()) {
      newErrors.projectName = "Project name is required";
    }

    if (!formData.projectGoals.trim()) {
      newErrors.projectGoals = "Project goals are required";
    }

    if (!formData.userName.trim()) {
      newErrors.userName = "Your name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      // Check if user is already logged in
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      let userId: string | undefined;

      if (currentUser) {
        // User is already logged in
        userId = currentUser.id;

        // Update user profile if needed
        await supabase
          .from("users")
          .update({
            full_name: formData.userName,
            email: formData.email,
          })
          .eq("id", currentUser.id);
      } else {
        // Create new account
        const tempPassword = Math.random().toString(36).slice(-12) + "A1!";

        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email: formData.email,
          password: tempPassword,
          options: {
            data: {
              full_name: formData.userName,
            },
            emailRedirectTo: `${window.location.origin}/?advanced=true&view=custom-config`,
          },
        });

        if (signUpError) {
          // Check if user already exists
          if (
            signUpError.message.includes("already registered") ||
            signUpError.message.includes("already exists")
          ) {
            // Try to sign in (they'll need to reset password, but we can still create the account record)
            const { data: existingUser } = await supabase
              .from("users")
              .select("id")
              .eq("email", formData.email)
              .single();

            if (existingUser) {
              userId = existingUser.id;
            } else {
              throw new Error("Account exists but profile not found. Please sign in first.");
            }
          } else {
            throw signUpError;
          }
        } else if (authData.user) {
          userId = authData.user.id;

          // Create user profile
          await supabase.from("users").upsert(
            {
              id: authData.user.id,
              email: formData.email,
              full_name: formData.userName,
              created_at: new Date().toISOString(),
            },
            {
              onConflict: "id",
            }
          );
        }
      }

      if (!userId) {
        throw new Error("Failed to create or retrieve user account");
      }

      // Store project info in sessionStorage for quote generation
      const projectInfo = {
        projectName: formData.projectName,
        projectLocation: formData.projectLocation || null,
        projectGoals: formData.projectGoals,
        projectSchedule: formData.projectSchedule || null,
        userId,
        createdAt: new Date().toISOString(),
      };

      sessionStorage.setItem("projectInfo", JSON.stringify(projectInfo));

      setIsComplete(true);

      // Call onComplete with all data
      onComplete({
        ...formData,
        userId,
      });

      // Show success briefly
      setTimeout(() => {
        setIsComplete(false);
      }, 2000);
    } catch (error: any) {
      console.error("Error creating account:", error);
      setErrors({
        submit: error.message || "Failed to create account. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isComplete) {
    return (
      <div className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border-2 border-emerald-500/50 rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-3 text-emerald-400">
          <CheckCircle className="w-6 h-6" />
          <span className="font-bold text-lg">Project information saved!</span>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-gradient-to-br from-slate-800/90 via-slate-900/80 to-slate-800/90 backdrop-blur-md border border-emerald-500/20 rounded-2xl p-6 mb-6 shadow-2xl"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
            <Target className="w-6 h-6 text-emerald-400" />
            Project Information
          </h2>
          <p className="text-sm text-slate-400">
            Create your account to save and download quotes
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Project Name - Required */}
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-slate-300 mb-2">
            Project Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={formData.projectName}
            onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
            placeholder="e.g., Hotel Energy Storage System"
            className={`w-full px-4 py-3 bg-slate-700/50 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all ${
              errors.projectName ? "border-red-500" : "border-slate-600 focus:border-emerald-400"
            }`}
            required
          />
          {errors.projectName && <p className="text-red-400 text-xs mt-1">{errors.projectName}</p>}
        </div>

        {/* Project Location - Optional */}
        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Project Location
          </label>
          <input
            type="text"
            value={formData.projectLocation}
            onChange={(e) => setFormData({ ...formData, projectLocation: e.target.value })}
            placeholder="e.g., Las Vegas, NV"
            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 transition-all"
          />
        </div>

        {/* Project Goals - Required */}
        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
            <Target className="w-4 h-4" />
            Project Goals <span className="text-red-400">*</span>
          </label>
          <select
            value={formData.projectGoals}
            onChange={(e) => setFormData({ ...formData, projectGoals: e.target.value })}
            className={`w-full px-4 py-3 bg-slate-700/50 border rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all ${
              errors.projectGoals
                ? "border-red-500"
                : "border-slate-600 focus:border-emerald-400"
            }`}
            required
          >
            <option value="">Select project goals...</option>
            <option value="cost-savings">Cost Savings (Peak Shaving)</option>
            <option value="backup-power">Backup Power / Resilience</option>
            <option value="sustainability">Sustainability / ESG Goals</option>
            <option value="grid-services">Grid Services / Revenue</option>
            <option value="solar-integration">Solar Integration</option>
            <option value="multiple">Multiple Goals</option>
          </select>
          {errors.projectGoals && (
            <p className="text-red-400 text-xs mt-1">{errors.projectGoals}</p>
          )}
        </div>

        {/* Project Schedule - Optional */}
        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Project Schedule
          </label>
          <select
            value={formData.projectSchedule}
            onChange={(e) => setFormData({ ...formData, projectSchedule: e.target.value })}
            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 transition-all"
          >
            <option value="">Select timeline...</option>
            <option value="immediate">Immediate (0-3 months)</option>
            <option value="short-term">Short-term (3-6 months)</option>
            <option value="medium-term">Medium-term (6-12 months)</option>
            <option value="long-term">Long-term (12+ months)</option>
            <option value="exploring">Just exploring</option>
          </select>
        </div>

        {/* User Name - Required */}
        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
            <User className="w-4 h-4" />
            Your Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={formData.userName}
            onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
            placeholder="John Doe"
            className={`w-full px-4 py-3 bg-slate-700/50 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all ${
              errors.userName ? "border-red-500" : "border-slate-600 focus:border-emerald-400"
            }`}
            required
          />
          {errors.userName && <p className="text-red-400 text-xs mt-1">{errors.userName}</p>}
        </div>

        {/* Email - Required */}
        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Email Address <span className="text-red-400">*</span>
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="john@example.com"
            className={`w-full px-4 py-3 bg-slate-700/50 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all ${
              errors.email ? "border-red-500" : "border-slate-600 focus:border-emerald-400"
            }`}
            required
          />
          {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
        </div>
      </div>

      {errors.submit && (
        <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
          <p className="text-red-400 text-sm">{errors.submit}</p>
        </div>
      )}

      <div className="mt-6 flex items-center justify-between">
        <p className="text-xs text-slate-500">
          <span className="text-red-400">*</span> Required fields. Account required to download
          quotes.
        </p>
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Creating Account...
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4" />
              Save & Continue
            </>
          )}
        </button>
      </div>
    </form>
  );
};
