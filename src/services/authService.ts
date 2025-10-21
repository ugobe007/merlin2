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

// Note: When Supabase is ready, we'll create SupabaseAuthService
// and swap it here without changing any component code!
