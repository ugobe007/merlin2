/**
 * Authentication Service — SupabaseAuthService
 *
 * Same public interface as the old LocalStorageAuthService.
 * Session cache: writes { user, sessionExpiry } to localStorage "current_user"
 * so subscriptionService.isUserAuthenticated() and all components work unchanged.
 */

import { supabase } from "./supabaseClient";

// ── Public types (unchanged) ─────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  company?: string;
  jobTitle?: string;
  tier: "free" | "starter" | "pro" | "advanced" | "business";
  createdAt: string;
  accountType: "individual" | "company";
  companyId?: string;
  companyRole?: "owner" | "admin" | "member";
  profileCompleted: boolean;
  bio?: string;
  profilePhoto?: string;
  companyWebsite?: string;
  linkedIn?: string;
  phone?: string;
  publicProfileSlug?: string;
  profileVisibility?: "public" | "private";
  preferences?: {
    defaultCurrency?: string;
    defaultLocation?: string;
    emailNotifications?: boolean;
    profileType?: "energy_professional" | "vendor" | "general_user";
    energyFocus?: string[];
    projectTypes?: string[];
    partnerTypes?: string[];
    targetUseCases?: string[];
    targetCustomers?: string[];
    channelPartners?: string[];
    learningGoals?: string[];
    interestedIndustry?: string[];
    layoutPreference?: "beginner" | "advanced";
  };
}

export interface Company {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
  tier: "free" | "starter" | "pro" | "advanced" | "business";
  seatLimit: number;
  seatsUsed: number;
  memberIds: string[];
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  error?: string;
}

// ── Cache helpers ─────────────────────────────────────────────────────────────

const CURRENT_USER_KEY = "current_user";
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

function writeCache(user: User | null): void {
  if (!user) {
    localStorage.removeItem(CURRENT_USER_KEY);
  } else {
    const sessionExpiry = new Date(Date.now() + SESSION_DURATION_MS).toISOString();
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify({ user, sessionExpiry }));
  }
  // Notify React components so they re-render after async auth state change
  window.dispatchEvent(new CustomEvent("merlin:authchange", { detail: user }));
}

function readCache(): User | null {
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data.sessionExpiry && new Date(data.sessionExpiry) < new Date()) {
      localStorage.removeItem(CURRENT_USER_KEY);
      return null;
    }
    return data.user ?? null;
  } catch {
    return null;
  }
}

// ── DB row → User ─────────────────────────────────────────────────────────────

function rowToUser(row: Record<string, any>): User {
  return {
    id: row.id,
    email: row.email ?? "",
    firstName: row.first_name ?? "",
    lastName: row.last_name ?? "",
    company: row.company ?? undefined,
    jobTitle: row.job_title ?? undefined,
    tier: (row.tier as User["tier"]) ?? "free",
    createdAt: row.created_at ?? new Date().toISOString(),
    accountType: (row.account_type as User["accountType"]) ?? "individual",
    profileCompleted: row.profile_completed ?? false,
    bio: row.bio ?? undefined,
    phone: row.phone ?? undefined,
    linkedIn: row.linkedin ?? undefined,
    companyWebsite: row.company_website ?? undefined,
    publicProfileSlug: row.public_profile_slug ?? undefined,
    profileVisibility: (row.profile_visibility as User["profileVisibility"]) ?? "private",
    preferences: row.preferences ?? {
      defaultCurrency: "USD",
      defaultLocation: "United States",
      emailNotifications: true,
    },
  };
}

// ── SupabaseAuthService ────────────────────────────────────────────────────────

class SupabaseAuthService {
  constructor() {
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (!session?.user) {
        writeCache(null);
        return;
      }
      // Try to fetch existing profile row
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", session.user.id)
        .maybeSingle();

      if (data) {
        // Map actual DB columns (full_name, plan, user_type) to User type
        const row = data as Record<string, any>;
        const nameParts = (row.full_name ?? "").split(" ");
        const mapped: Record<string, any> = {
          ...row,
          first_name: row.first_name ?? nameParts[0] ?? "",
          last_name: row.last_name ?? nameParts.slice(1).join(" ") ?? "",
          tier: row.tier ?? row.plan ?? "free",
          account_type: row.account_type ?? row.user_type ?? "individual",
          profile_completed: row.profile_completed ?? false,
        };
        writeCache(rowToUser(mapped));
      } else {
        // No profile row (new OAuth user) or 500 error — build from auth metadata
        if (error) console.warn("[auth] user_profiles fetch:", error.message);
        const user = this._metaToUser(session.user);
        writeCache(user);
        // Attempt to create a minimal profile row for this OAuth user
        if (event === "SIGNED_IN") {
          const m = session.user.user_metadata ?? {};
          const fullName =
            m.full_name ?? m.name ?? `${m.first_name ?? ""} ${m.last_name ?? ""}`.trim();
          await supabase
            .from("user_profiles")
            .upsert({
              id: session.user.id,
              email: session.user.email ?? "",
              full_name: fullName || null,
              updated_at: new Date().toISOString(),
            } as any)
            .then(({ error: e }) => {
              if (e) console.warn("[auth] profile upsert:", e.message);
            });
        }
      }

      // After OAuth redirect, reload the page without the hash so
      // all React components re-mount with the fresh auth state
      if (event === "SIGNED_IN" && window.location.hash.includes("access_token")) {
        window.location.replace(window.location.origin);
      }
    });
  }

  private _metaToUser(authUser: any): User {
    const m = authUser.user_metadata ?? {};
    // OAuth providers store the name differently:
    // GitHub → m.user_name, m.name
    // Google → m.full_name, m.name
    const fullName = m.full_name ?? m.name ?? "";
    const nameParts = fullName.split(" ");
    return {
      id: authUser.id,
      email: authUser.email ?? "",
      firstName: m.first_name ?? m.given_name ?? nameParts[0] ?? "",
      lastName: m.last_name ?? m.family_name ?? nameParts.slice(1).join(" ") ?? "",
      company: m.company ?? undefined,
      tier: "free",
      createdAt: authUser.created_at ?? new Date().toISOString(),
      accountType: "individual",
      profileCompleted: false,
      preferences: {
        defaultCurrency: "USD",
        defaultLocation: "United States",
        emailNotifications: true,
      },
    };
  }

  async signUp(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    company?: string,
    accountType: "individual" | "company" = "individual"
  ): Promise<AuthResponse> {
    try {
      if (!email || !password || !firstName || !lastName)
        return { success: false, error: "Please fill in all required fields" };

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { first_name: firstName, last_name: lastName, company, account_type: accountType },
        },
      });

      if (error) {
        if (error.message.toLowerCase().includes("already registered"))
          return { success: false, error: "An account with this email already exists" };
        return { success: false, error: error.message };
      }
      if (!data.user) return { success: false, error: "Signup failed. Please try again." };

      const profileRow = {
        id: data.user.id,
        email,
        first_name: firstName,
        last_name: lastName,
        company: company ?? null,
        tier: "free",
        account_type: accountType,
        profile_completed: false,
        preferences: {
          defaultCurrency: "USD",
          defaultLocation: "United States",
          emailNotifications: true,
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const { error: pe } = await supabase.from("user_profiles").upsert(profileRow as any);
      if (pe) console.warn("[auth] Profile row create failed (non-fatal):", pe.message);

      const user = rowToUser({ ...profileRow, id: data.user.id });
      writeCache(user);
      return { success: true, user };
    } catch (err: any) {
      console.error("[auth] signUp:", err);
      return { success: false, error: "Signup failed. Please try again." };
    }
  }

  async signIn(email: string, password: string): Promise<AuthResponse> {
    try {
      if (!email || !password) return { success: false, error: "Please enter email and password" };
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        if (error.message.toLowerCase().includes("invalid"))
          return { success: false, error: "Incorrect email or password" };
        return { success: false, error: error.message };
      }
      if (!data.user) return { success: false, error: "Login failed. Please try again." };
      const { data: pd } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", data.user.id)
        .single();
      const user = pd ? rowToUser(pd) : this._metaToUser(data.user);
      writeCache(user);
      return { success: true, user };
    } catch (err: any) {
      console.error("[auth] signIn:", err);
      return { success: false, error: "Login failed. Please try again." };
    }
  }

  async signInWithOAuth(provider: "google" | "github"): Promise<AuthResponse> {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin,
          queryParams:
            provider === "google" ? { access_type: "offline", prompt: "consent" } : undefined,
        },
      });
      if (error) return { success: false, error: error.message };
      // OAuth redirects — success handled by onAuthStateChange listener
      return { success: true };
    } catch (err: any) {
      console.error("[auth] OAuth:", err);
      return { success: false, error: `${provider} sign-in failed. Please try again.` };
    }
  }

  async signOut(): Promise<void> {
    await supabase.auth.signOut();
    writeCache(null);
  }

  getCurrentUser(): User | null {
    return readCache();
  }
  isAuthenticated(): boolean {
    return !!this.getCurrentUser();
  }

  async updateUserProfile(userId: string, updates: Partial<User>): Promise<AuthResponse> {
    try {
      const db: Record<string, any> = {};
      if (updates.firstName !== undefined) db.first_name = updates.firstName;
      if (updates.lastName !== undefined) db.last_name = updates.lastName;
      if (updates.company !== undefined) db.company = updates.company;
      if (updates.jobTitle !== undefined) db.job_title = updates.jobTitle;
      if (updates.tier !== undefined) db.tier = updates.tier;
      if (updates.bio !== undefined) db.bio = updates.bio;
      if (updates.phone !== undefined) db.phone = updates.phone;
      if (updates.linkedIn !== undefined) db.linkedin = updates.linkedIn;
      if (updates.companyWebsite !== undefined) db.company_website = updates.companyWebsite;
      if (updates.publicProfileSlug !== undefined)
        db.public_profile_slug = updates.publicProfileSlug;
      if (updates.profileVisibility !== undefined)
        db.profile_visibility = updates.profileVisibility;
      if (updates.preferences !== undefined) db.preferences = updates.preferences;
      if (updates.profileCompleted !== undefined) db.profile_completed = updates.profileCompleted;
      const { data, error } = await supabase
        .from("user_profiles")
        .update(db)
        .eq("id", userId)
        .select()
        .single();
      if (error) return { success: false, error: error.message };
      const user = rowToUser(data);
      if (readCache()?.id === userId) writeCache(user);
      return { success: true, user };
    } catch {
      return { success: false, error: "Failed to update profile" };
    }
  }

  async deleteAccount(_email: string): Promise<boolean> {
    try {
      await this.signOut();
      return true;
    } catch {
      return false;
    }
  }

  async resetPassword(email: string, _newPassword?: string): Promise<AuthResponse> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + "/reset-password",
      });
      if (error) return { success: false, error: error.message };
      return { success: true, error: "Password reset email sent" };
    } catch {
      return { success: false, error: "Password reset failed" };
    }
  }

  generateProfileSlug(firstName: string, lastName: string): string {
    const base = (firstName + "-" + lastName).toLowerCase().replace(/[^a-z0-9-]/g, "-");
    return base + "-" + Date.now().toString(36);
  }

  async getPublicProfile(slug: string): Promise<User | null> {
    try {
      const { data } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("public_profile_slug", slug)
        .eq("profile_visibility", "public")
        .single();
      if (!data) return null;
      return { ...rowToUser(data), email: "" };
    } catch {
      return null;
    }
  }

  async trackVisitor(profileSlug: string, source = "profile_share"): Promise<void> {
    console.log("[auth] profile view", { profileSlug, source });
  }

  getCompanyById(_id: string): Company | null {
    return null;
  }
  getCompanyMembers(_companyId: string): User[] {
    return [];
  }
  async inviteTeamMember(_c: string, _e: string) {
    return {
      success: false,
      error: "Team features coming soon",
      inviteCode: undefined as string | undefined,
    };
  }
  async joinCompanyWithInvite(_u: string, _i: string): Promise<AuthResponse> {
    return { success: false, error: "Team features coming soon" };
  }
  getAllAccounts() {
    const u = readCache();
    return u ? [{ email: u.email, firstName: u.firstName, lastName: u.lastName }] : [];
  }
}

// ── Singleton export ──────────────────────────────────────────────────────────

export const authService = new SupabaseAuthService();

if (typeof window !== "undefined" && import.meta.env.DEV) {
  (window as any).authDebug = {
    currentUser: () => authService.getCurrentUser(),
    signOut: () => authService.signOut(),
    isAuthenticated: () => authService.isAuthenticated(),
    clearCache: () => {
      localStorage.removeItem("current_user");
      console.log("Cache cleared");
    },
    help: () => console.log("authDebug: currentUser | signOut | isAuthenticated | clearCache"),
  };
  console.log("Auth debug tools loaded. Type authDebug.help() for commands.");
}
