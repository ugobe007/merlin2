/**
 * Authentication Service
 *
 * Abstract layer for authentication that can use either:
 * - localStorage (current implementation)
 * - Supabase (future implementation)
 *
 * This makes it easy to swap auth providers without changing component code.
 */

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  company?: string;
  jobTitle?: string;
  tier: "starter" | "pro" | "advanced" | "business";
  createdAt: string;

  // Account type
  accountType: "individual" | "company";

  // Company-specific fields
  companyId?: string; // Links to company record
  companyRole?: "owner" | "admin" | "member";

  // Profile completion
  profileCompleted: boolean;

  // Extended profile fields
  bio?: string; // About me section
  profilePhoto?: string; // Base64 image or URL
  companyWebsite?: string; // Company website URL
  linkedIn?: string; // LinkedIn profile
  phone?: string; // Phone number
  publicProfileSlug?: string; // e.g., "john-doe-energy"
  profileVisibility?: "public" | "private"; // Public profiles can be shared

  // User preferences
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
  tier: "starter" | "pro" | "advanced" | "business";
  seatLimit: number; // 5 for starter, more for paid
  seatsUsed: number;
  memberIds: string[];
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  error?: string;
}

// Simple password hashing (in production, Supabase will handle this properly)
const simpleHash = (password: string): string => {
  // This is a simple hash for localStorage only
  // Supabase will handle proper bcrypt hashing on the backend
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return hash.toString(36);
};

class LocalStorageAuthService {
  private USERS_KEY = "merlin_users";
  private PASSWORDS_KEY = "merlin_passwords";
  private COMPANIES_KEY = "merlin_companies";
  private TOKEN_KEY = "auth_token";
  private CURRENT_USER_KEY = "current_user";
  private SESSION_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days

  async signUp(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    company?: string,
    accountType: "individual" | "company" = "individual"
  ): Promise<AuthResponse> {
    try {
      // Validate
      if (!email || !password || !firstName || !lastName) {
        return { success: false, error: "Please fill in all required fields" };
      }

      // Check if user exists
      const existingUsers = this.getUsers();
      if (existingUsers.find((u) => u.email === email)) {
        return { success: false, error: "An account with this email already exists" };
      }

      // Create user
      const user: User = {
        id: Date.now().toString(),
        email,
        firstName,
        lastName,
        company,
        tier: "starter",
        createdAt: new Date().toISOString(),
        accountType,
        profileCompleted: false,
        preferences: {
          defaultCurrency: "USD",
          defaultLocation: "United States",
          emailNotifications: true,
        },
      };

      // If company account, create company record
      if (accountType === "company" && company) {
        const companyRecord: Company = {
          id: `company_${Date.now()}`,
          name: company,
          ownerId: user.id,
          createdAt: new Date().toISOString(),
          tier: "starter",
          seatLimit: 5, // Free tier gets 5 seats
          seatsUsed: 1,
          memberIds: [user.id],
        };

        user.companyId = companyRecord.id;
        user.companyRole = "owner";

        // Save company
        const companies = this.getCompanies();
        companies.push(companyRecord);
        localStorage.setItem(this.COMPANIES_KEY, JSON.stringify(companies));
      }

      // Save user
      existingUsers.push(user);
      localStorage.setItem(this.USERS_KEY, JSON.stringify(existingUsers));

      // Save hashed password
      const passwords = this.getPasswords();
      passwords[email] = simpleHash(password);
      localStorage.setItem(this.PASSWORDS_KEY, JSON.stringify(passwords));

      // Create session
      this.createSession(user);

      return { success: true, user };
    } catch (error) {
      console.error("Signup error:", error);
      return { success: false, error: "Signup failed. Please try again." };
    }
  }

  async signIn(email: string, password: string): Promise<AuthResponse> {
    try {
      if (!email || !password) {
        return { success: false, error: "Please enter email and password" };
      }

      const users = this.getUsers();
      const user = users.find((u) => u.email === email);

      if (!user) {
        return { success: false, error: "No account found with this email" };
      }

      // Check password
      const passwords = this.getPasswords();
      if (passwords[email] !== simpleHash(password)) {
        return { success: false, error: "Incorrect password" };
      }

      // Create session
      this.createSession(user);

      return { success: true, user };
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, error: "Login failed. Please try again." };
    }
  }

  async signOut(): Promise<void> {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.CURRENT_USER_KEY);
  }

  // Delete account (useful for cleaning up broken accounts)
  async deleteAccount(email: string): Promise<boolean> {
    try {
      const users = this.getUsers();
      const updatedUsers = users.filter((u) => u.email !== email);
      localStorage.setItem(this.USERS_KEY, JSON.stringify(updatedUsers));

      const passwords = this.getPasswords();
      delete passwords[email];
      localStorage.setItem(this.PASSWORDS_KEY, JSON.stringify(passwords));

      return true;
    } catch (error) {
      return false;
    }
  }

  // Reset password (for debugging/development)
  async resetPassword(email: string, newPassword: string): Promise<AuthResponse> {
    try {
      const users = this.getUsers();
      const user = users.find((u) => u.email === email);

      if (!user) {
        return { success: false, error: "No account found with this email" };
      }

      const passwords = this.getPasswords();
      passwords[email] = simpleHash(newPassword);
      localStorage.setItem(this.PASSWORDS_KEY, JSON.stringify(passwords));

      return { success: true, user, error: "Password reset successfully" };
    } catch (error) {
      return { success: false, error: "Password reset failed" };
    }
  }

  // Debug: View all accounts (for development)
  getAllAccounts(): { email: string; firstName: string; lastName: string }[] {
    return this.getUsers().map((u) => ({
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
    }));
  }

  getCurrentUser(): User | null {
    try {
      const userJson = localStorage.getItem(this.CURRENT_USER_KEY);
      if (!userJson) return null;

      const userData = JSON.parse(userJson);

      // Check session expiry
      if (userData.sessionExpiry && new Date(userData.sessionExpiry) < new Date()) {
        this.signOut();
        return null;
      }

      return userData.user;
    } catch {
      return null;
    }
  }

  isAuthenticated(): boolean {
    return !!this.getCurrentUser();
  }

  private createSession(user: User): void {
    const sessionExpiry = new Date(Date.now() + this.SESSION_DURATION).toISOString();
    const sessionData = { user, sessionExpiry };

    localStorage.setItem(this.TOKEN_KEY, user.id);
    localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(sessionData));
  }

  private getUsers(): User[] {
    try {
      return JSON.parse(localStorage.getItem(this.USERS_KEY) || "[]");
    } catch {
      return [];
    }
  }

  private getPasswords(): Record<string, string> {
    try {
      return JSON.parse(localStorage.getItem(this.PASSWORDS_KEY) || "{}");
    } catch {
      return {};
    }
  }

  private getCompanies(): Company[] {
    try {
      return JSON.parse(localStorage.getItem(this.COMPANIES_KEY) || "[]");
    } catch {
      return [];
    }
  }

  // Company management methods
  getCompanyById(companyId: string): Company | null {
    const companies = this.getCompanies();
    return companies.find((c) => c.id === companyId) || null;
  }

  async updateUserProfile(userId: string, updates: Partial<User>): Promise<AuthResponse> {
    try {
      const users = this.getUsers();
      const userIndex = users.findIndex((u) => u.id === userId);

      if (userIndex === -1) {
        return { success: false, error: "User not found" };
      }

      users[userIndex] = { ...users[userIndex], ...updates };
      localStorage.setItem(this.USERS_KEY, JSON.stringify(users));

      // Update current session if this is the current user
      const currentUser = this.getCurrentUser();
      if (currentUser && currentUser.id === userId) {
        this.createSession(users[userIndex]);
      }

      return { success: true, user: users[userIndex] };
    } catch (error) {
      return { success: false, error: "Failed to update profile" };
    }
  }

  async inviteTeamMember(
    companyId: string,
    inviterEmail: string
  ): Promise<{ success: boolean; inviteCode?: string; error?: string }> {
    try {
      const company = this.getCompanyById(companyId);
      if (!company) {
        return { success: false, error: "Company not found" };
      }

      // Check seat limit
      if (company.seatsUsed >= company.seatLimit) {
        return {
          success: false,
          error: `Seat limit reached (${company.seatLimit} seats). Upgrade to add more team members.`,
        };
      }

      // Generate invite code
      const inviteCode = `MERLIN-${company.id.slice(-6)}-${Date.now().toString(36).toUpperCase()}`;

      // Store invite code (in production, this would have expiry, etc.)
      const invites = JSON.parse(localStorage.getItem("merlin_invites") || "{}");
      invites[inviteCode] = {
        companyId,
        inviterEmail,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      };
      localStorage.setItem("merlin_invites", JSON.stringify(invites));

      return { success: true, inviteCode };
    } catch (error) {
      return { success: false, error: "Failed to create invite" };
    }
  }

  async joinCompanyWithInvite(userId: string, inviteCode: string): Promise<AuthResponse> {
    try {
      const invites = JSON.parse(localStorage.getItem("merlin_invites") || "{}");
      const invite = invites[inviteCode];

      if (!invite) {
        return { success: false, error: "Invalid invite code" };
      }

      // Check expiry
      if (new Date(invite.expiresAt) < new Date()) {
        return { success: false, error: "Invite code expired" };
      }

      const company = this.getCompanyById(invite.companyId);
      if (!company) {
        return { success: false, error: "Company not found" };
      }

      // Check seat limit
      if (company.seatsUsed >= company.seatLimit) {
        return { success: false, error: "Company seat limit reached" };
      }

      // Update user
      const users = this.getUsers();
      const userIndex = users.findIndex((u) => u.id === userId);
      if (userIndex === -1) {
        return { success: false, error: "User not found" };
      }

      users[userIndex].companyId = company.id;
      users[userIndex].companyRole = "member";
      users[userIndex].accountType = "company";
      users[userIndex].company = company.name;
      localStorage.setItem(this.USERS_KEY, JSON.stringify(users));

      // Update company
      const companies = this.getCompanies();
      const companyIndex = companies.findIndex((c) => c.id === company.id);
      companies[companyIndex].memberIds.push(userId);
      companies[companyIndex].seatsUsed++;
      localStorage.setItem(this.COMPANIES_KEY, JSON.stringify(companies));

      // Delete used invite
      delete invites[inviteCode];
      localStorage.setItem("merlin_invites", JSON.stringify(invites));

      return { success: true, user: users[userIndex] };
    } catch (error) {
      return { success: false, error: "Failed to join company" };
    }
  }

  getCompanyMembers(companyId: string): User[] {
    const users = this.getUsers();
    return users.filter((u) => u.companyId === companyId);
  }

  // Generate unique profile slug
  generateProfileSlug(firstName: string, lastName: string): string {
    const baseSlug = `${firstName}-${lastName}`.toLowerCase().replace(/[^a-z0-9-]/g, "-");
    const users = this.getUsers();
    let slug = baseSlug;
    let counter = 1;

    while (users.some((u) => u.publicProfileSlug === slug)) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  }

  // Get public profile by slug (for sharing)
  async getPublicProfile(slug: string): Promise<User | null> {
    const users = this.getUsers();
    const user = users.find(
      (u) => u.publicProfileSlug === slug && u.profileVisibility === "public"
    );

    if (!user) return null;

    // Return sanitized user data (no sensitive info)
    const { email, ...publicData } = user;
    return { ...publicData, email: "" } as User;
  }

  // Track visitor (non-user visiting a shared profile)
  async trackVisitor(profileSlug: string, source: string = "profile_share"): Promise<void> {
    const visitors = JSON.parse(localStorage.getItem("merlin_visitors") || "[]");
    visitors.push({
      profileSlug,
      source,
      timestamp: new Date().toISOString(),
      sessionId: Date.now().toString(),
    });
    localStorage.setItem("merlin_visitors", JSON.stringify(visitors));
  }
}

// Export singleton instance
export const authService = new LocalStorageAuthService();

// Debug helper: Make auth utilities available in browser console (DEV only)
if (typeof window !== "undefined" && import.meta.env.DEV) {
  (window as any).authDebug = {
    // List all accounts
    listAccounts: () => {
      const accounts = authService.getAllAccounts();
      return accounts;
    },

    // Delete an account by email
    deleteAccount: async (email: string) => {
      const result = await authService.deleteAccount(email);
      return result;
    },

    // Reset password
    resetPassword: async (email: string, newPassword: string) => {
      const result = await authService.resetPassword(email, newPassword);
      return result;
    },

    // Clear all auth data (nuclear option)
    clearAll: () => {
      localStorage.removeItem("merlin_users");
      localStorage.removeItem("merlin_passwords");
      localStorage.removeItem("auth_token");
      localStorage.removeItem("current_user");
    },

    help: () => {
      console.log(`
🔧 Auth Debug Commands:
  authDebug.listAccounts()              - Show all registered accounts
  authDebug.deleteAccount("email")      - Delete a specific account
  authDebug.resetPassword("email", "pw") - Reset password for account
  authDebug.clearAll()                  - Clear ALL auth data (nuclear)
  authDebug.help()                      - Show this help
      `);
    },
  };

  console.log("🔧 Auth debug tools loaded. Type authDebug.help() for commands.");
}

// Note: When Supabase is ready, we'll create SupabaseAuthService
// and swap it here without changing any component code!
