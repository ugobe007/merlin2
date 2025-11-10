// Enhanced Admin Authentication Service
// Supports environment variables and Supabase integration

export interface AdminCredentials {
  email: string;
  password: string;
}

export interface AdminUser {
  email: string;
  role: 'admin' | 'super_admin';
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
        email: 'admin@merlin.energy',
        password: 'merlin2025'
      }
    ];

    // Try to load from environment variables
    const envEmail = import.meta.env.VITE_ADMIN_EMAIL;
    const envPassword = import.meta.env.VITE_ADMIN_PASSWORD;

    if (envEmail && envPassword) {
      return [
        { email: envEmail, password: envPassword },
        ...defaultCredentials // Keep default as fallback
      ];
    }

    // Support multiple admin accounts from environment
    const adminAccounts = import.meta.env.VITE_ADMIN_ACCOUNTS;
    if (adminAccounts) {
      try {
        const accounts = JSON.parse(adminAccounts) as AdminCredentials[];
        return [...accounts, ...defaultCredentials];
      } catch (error) {
        console.warn('Invalid VITE_ADMIN_ACCOUNTS format, using defaults');
      }
    }

    return defaultCredentials;
  }

  // Authenticate admin user
  authenticate(email: string, password: string): boolean {
    const validCredentials = this.getAdminCredentials();
    
    const matchingCredential = validCredentials.find(
      cred => cred.email === email && cred.password === password
    );

    if (matchingCredential) {
      this.currentAdmin = {
        email: matchingCredential.email,
        role: matchingCredential.email.includes('super') ? 'super_admin' : 'admin',
        lastLogin: new Date().toISOString(),
        permissions: this.getPermissions(matchingCredential.email)
      };

      // Store session
      sessionStorage.setItem('admin_session', JSON.stringify({
        email: this.currentAdmin.email,
        loginTime: this.currentAdmin.lastLogin,
        expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString() // 8 hours
      }));

      return true;
    }

    return false;
  }

  // Get permissions based on admin email
  private getPermissions(email: string): string[] {
    const basePermissions = [
      'view_pricing',
      'edit_pricing',
      'view_validation',
      'run_validation',
      'view_database',
      'sync_database'
    ];

    const superAdminPermissions = [
      ...basePermissions,
      'manage_users',
      'system_config',
      'delete_data',
      'export_data'
    ];

    return email.includes('super') ? superAdminPermissions : basePermissions;
  }

  // Check if user has permission
  hasPermission(permission: string): boolean {
    return this.currentAdmin?.permissions.includes(permission) || false;
  }

  // Check if session is valid
  isSessionValid(): boolean {
    const sessionData = sessionStorage.getItem('admin_session');
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
    sessionStorage.removeItem('admin_session');
  }

  // Get admin panel access methods
  static getAccessMethods(): { method: string; description: string; instructions: string }[] {
    return [
      {
        method: 'Floating Button',
        description: 'Purple gear icon in bottom-right corner',
        instructions: 'Click the ⚙️ button with pulse animation'
      },
      {
        method: 'Keyboard Shortcut',
        description: 'Quick access via keyboard',
        instructions: 'Press Ctrl+Shift+A (Windows) or Cmd+Shift+A (Mac)'
      },
      {
        method: 'Direct URL',
        description: 'URL parameter access',
        instructions: 'Add ?admin=true to any URL (still requires authentication)'
      }
    ];
  }

  // Get current credentials for display (without passwords)
  static getCredentialInfo(): { email: string; source: string }[] {
    const service = AdminAuthService.getInstance();
    const credentials = service.getAdminCredentials();
    
    return credentials.map(cred => ({
      email: cred.email,
      source: cred.email === 'admin@merlin.energy' ? 'Default' : 'Environment'
    }));
  }
}

// Export singleton instance
export const adminAuthService = AdminAuthService.getInstance();