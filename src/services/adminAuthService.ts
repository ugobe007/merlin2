// Enhanced Admin Authentication Service
// Supports environment variables and Supabase integration

export interface AdminCredentials {
  email: string;
  password: string;
}

export type AdminRole = "super_admin" | "admin" | "limited_admin";

export interface AdminUser {
  email: string;
  role: AdminRole;
  lastLogin?: string;
  permissions: string[];
}

export class AdminAuthService {
  private static instance: AdminAuthService;
  private currentAdmin: AdminUser | null = null;

  private constructor() {}

  static getInstance(): AdminAuthService {
    if (!AdminAuthService.instance) {
      AdminAuthService.instance = new AdminAuthService();
    }
    return AdminAuthService.instance;
  }

  // Get admin credentials from environment or fallback to defaults
  private getAdminCredentials(): AdminCredentials[] {
    const defaultCredentials: AdminCredentials[] = [
      {
        email: "admin@merlinenergy.net",
        password: "merlin2025",
      },
      {
        email: "viewer@merlinenergy.net",
        password: "viewer2025",
      },
    ];

    // Try to load from environment variables
    const envEmail = import.meta.env.VITE_ADMIN_EMAIL;
    const envPassword = import.meta.env.VITE_ADMIN_PASSWORD;

    if (envEmail && envPassword) {
      return [
        { email: envEmail, password: envPassword },
        ...defaultCredentials, // Keep default as fallback
      ];
    }

    // Support multiple admin accounts from environment
    const adminAccounts = import.meta.env.VITE_ADMIN_ACCOUNTS;
    if (adminAccounts) {
      try {
        const accounts = JSON.parse(adminAccounts) as AdminCredentials[];
        return [...accounts, ...defaultCredentials];
      } catch (error) {
        console.warn("Invalid VITE_ADMIN_ACCOUNTS format, using defaults");
      }
    }

    return defaultCredentials;
  }

  // Authenticate admin user
  authenticate(email: string, password: string): boolean {
    const validCredentials = this.getAdminCredentials();

    const matchingCredential = validCredentials.find(
      (cred) => cred.email === email && cred.password === password
    );

    if (matchingCredential) {
      const role = this.determineRoleFromEmail(matchingCredential.email);
      this.currentAdmin = {
        email: matchingCredential.email,
        role: role,
        lastLogin: new Date().toISOString(),
        permissions: this.getPermissions(matchingCredential.email, role),
      };

      // Store session
      sessionStorage.setItem(
        "admin_session",
        JSON.stringify({
          email: this.currentAdmin.email,
          loginTime: this.currentAdmin.lastLogin,
          expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(), // 8 hours
        })
      );

      return true;
    }

    return false;
  }

  // Get role based on email pattern
  private determineRoleFromEmail(email: string): AdminRole {
    if (email.includes("super") || email === "admin@merlinenergy.net") {
      return "super_admin";
    } else if (
      email.includes("viewer") ||
      email.includes("limited") ||
      email === "viewer@merlinenergy.net"
    ) {
      return "limited_admin";
    }
    return "admin";
  }

  // Get permissions based on admin email and role
  private getPermissions(email: string, role?: AdminRole): string[] {
    const adminRole = role || this.determineRoleFromEmail(email);
    // Limited admin permissions (view-only, no destructive actions)
    const limitedAdminPermissions = [
      "view_pricing",
      "view_validation",
      "run_validation",
      "view_database",
      "export_config", // Can export but not import
    ];

    // Regular admin permissions (can edit but not system-level changes)
    const adminPermissions = [
      ...limitedAdminPermissions,
      "edit_pricing",
      "save_pricing",
      "sync_database",
    ];

    // Super admin permissions (full access)
    const superAdminPermissions = [
      ...adminPermissions,
      "reset_to_defaults",
      "import_config",
      "manage_users",
      "system_config",
      "delete_data",
      "export_data",
    ];

    switch (adminRole) {
      case "limited_admin":
        return limitedAdminPermissions;
      case "super_admin":
        return superAdminPermissions;
      case "admin":
      default:
        return adminPermissions;
    }
  }

  // Check if user has permission
  hasPermission(permission: string): boolean {
    return this.currentAdmin?.permissions.includes(permission) || false;
  }

  // Check if session is valid
  isSessionValid(): boolean {
    const sessionData = sessionStorage.getItem("admin_session");
    if (!sessionData) return false;

    try {
      const session = JSON.parse(sessionData);
      const expiresAt = new Date(session.expiresAt);
      return expiresAt > new Date();
    } catch {
      return false;
    }
  }

  // Get current admin user
  getCurrentAdmin(): AdminUser | null {
    if (!this.isSessionValid()) {
      this.logout();
      return null;
    }
    return this.currentAdmin;
  }

  // Logout admin user
  logout(): void {
    this.currentAdmin = null;
    sessionStorage.removeItem("admin_session");
  }

  // Get admin panel access methods
  static getAccessMethods(): { method: string; description: string; instructions: string }[] {
    return [
      {
        method: "Floating Button",
        description: "Purple gear icon in bottom-right corner",
        instructions: "Click the ⚙️ button with pulse animation",
      },
      {
        method: "Keyboard Shortcut",
        description: "Quick access via keyboard",
        instructions: "Press Ctrl+Shift+A (Windows) or Cmd+Shift+A (Mac)",
      },
      {
        method: "Direct URL",
        description: "URL parameter access",
        instructions: "Add ?admin=true to any URL (still requires authentication)",
      },
    ];
  }

  // Get current credentials for display (without passwords)
  static getCredentialInfo(): { email: string; source: string; role: AdminRole }[] {
    const service = AdminAuthService.getInstance();
    const credentials = service.getAdminCredentials();

    return credentials.map((cred) => ({
      email: cred.email,
      source:
        cred.email === "admin@merlinenergy.net" || cred.email === "viewer@merlinenergy.net"
          ? "Default"
          : "Environment",
      role: service.determineRoleFromEmail(cred.email),
    }));
  }

  // Get current admin role (public method)
  getCurrentRole(): AdminRole | null {
    return this.currentAdmin?.role || null;
  }
}

// Export singleton instance
export const adminAuthService = AdminAuthService.getInstance();
