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
  tier: 'free' | 'professional' | 'enterprise_pro' | 'business';
  createdAt: string;
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
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
};

class LocalStorageAuthService {
  private USERS_KEY = 'merlin_users';
  private PASSWORDS_KEY = 'merlin_passwords';
  private TOKEN_KEY = 'auth_token';
  private CURRENT_USER_KEY = 'current_user';
  private SESSION_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days

  async signUp(email: string, password: string, firstName: string, lastName: string, company?: string): Promise<AuthResponse> {
    try {
      // Validate
      if (!email || !password || !firstName || !lastName) {
        return { success: false, error: 'Please fill in all required fields' };
      }

      // Check if user exists
      const existingUsers = this.getUsers();
      if (existingUsers.find(u => u.email === email)) {
        return { success: false, error: 'An account with this email already exists' };
      }

      // Create user
      const user: User = {
        id: Date.now().toString(),
        email,
        firstName,
        lastName,
        company,
        tier: 'free',
        createdAt: new Date().toISOString()
      };

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
      console.error('Signup error:', error);
      return { success: false, error: 'Signup failed. Please try again.' };
    }
  }

  async signIn(email: string, password: string): Promise<AuthResponse> {
    try {
      if (!email || !password) {
        return { success: false, error: 'Please enter email and password' };
      }

      const users = this.getUsers();
      const user = users.find(u => u.email === email);

      if (!user) {
        return { success: false, error: 'No account found with this email' };
      }

      // Check password
      const passwords = this.getPasswords();
      if (passwords[email] !== simpleHash(password)) {
        return { success: false, error: 'Incorrect password' };
      }

      // Create session
      this.createSession(user);

      return { success: true, user };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Login failed. Please try again.' };
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
      const updatedUsers = users.filter(u => u.email !== email);
      localStorage.setItem(this.USERS_KEY, JSON.stringify(updatedUsers));

      const passwords = this.getPasswords();
      delete passwords[email];
      localStorage.setItem(this.PASSWORDS_KEY, JSON.stringify(passwords));

      return true;
    } catch (error) {
      console.error('Delete account error:', error);
      return false;
    }
  }

  // Reset password (for debugging/development)
  async resetPassword(email: string, newPassword: string): Promise<AuthResponse> {
    try {
      const users = this.getUsers();
      const user = users.find(u => u.email === email);

      if (!user) {
        return { success: false, error: 'No account found with this email' };
      }

      const passwords = this.getPasswords();
      passwords[email] = simpleHash(newPassword);
      localStorage.setItem(this.PASSWORDS_KEY, JSON.stringify(passwords));

      return { success: true, user, error: 'Password reset successfully' };
    } catch (error) {
      console.error('Password reset error:', error);
      return { success: false, error: 'Password reset failed' };
    }
  }

  // Debug: View all accounts (for development)
  getAllAccounts(): { email: string; firstName: string; lastName: string }[] {
    return this.getUsers().map(u => ({
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName
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
      return JSON.parse(localStorage.getItem(this.USERS_KEY) || '[]');
    } catch {
      return [];
    }
  }

  private getPasswords(): Record<string, string> {
    try {
      return JSON.parse(localStorage.getItem(this.PASSWORDS_KEY) || '{}');
    } catch {
      return {};
    }
  }
}

// Export singleton instance
export const authService = new LocalStorageAuthService();

// Debug helper: Make auth utilities available in browser console
if (typeof window !== 'undefined') {
  (window as any).authDebug = {
    // List all accounts
    listAccounts: () => {
      const accounts = authService.getAllAccounts();
      console.table(accounts);
      return accounts;
    },
    
    // Delete an account by email
    deleteAccount: async (email: string) => {
      const result = await authService.deleteAccount(email);
      console.log(result ? `✅ Deleted account: ${email}` : `❌ Failed to delete: ${email}`);
      return result;
    },
    
    // Reset password
    resetPassword: async (email: string, newPassword: string) => {
      const result = await authService.resetPassword(email, newPassword);
      console.log(result.success ? `✅ Password reset for: ${email}` : `❌ ${result.error}`);
      return result;
    },
    
    // Clear all auth data (nuclear option)
    clearAll: () => {
      localStorage.removeItem('merlin_users');
      localStorage.removeItem('merlin_passwords');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('current_user');
      console.log('✅ All auth data cleared. Refresh the page.');
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
    }
  };
  
  console.log('🔧 Auth debug tools loaded. Type authDebug.help() for commands.');
}

// Note: When Supabase is ready, we'll create SupabaseAuthService
// and swap it here without changing any component code!
