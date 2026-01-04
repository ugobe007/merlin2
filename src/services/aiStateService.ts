// AI State Management Service
// Provides persistent state tracking for AI optimization across sessions

export type AIState = "never-used" | "unselected" | "active" | "applied" | "analyzing";

export interface AISessionData {
  state: AIState;
  lastUsed?: number; // timestamp
  appliedConfig?: string;
  sessionId?: string;
  usageCount: number;
}

class AIStateService {
  private readonly STORAGE_KEY = "merlin_ai_state";
  private readonly SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  // Get current AI state
  getAIState(): AISessionData {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const data: AISessionData = JSON.parse(stored);

        // Check if session is still valid (within 24 hours)
        const now = Date.now();
        if (data.lastUsed && now - data.lastUsed > this.SESSION_DURATION) {
          // Session expired, reset to never-used but keep usage count
          return {
            state: "never-used",
            usageCount: data.usageCount || 0,
          };
        }

        return data;
      }
    } catch (error) {
      console.warn("Failed to load AI state from localStorage:", error);
    }

    // Default state for new users
    return {
      state: "never-used",
      usageCount: 0,
    };
  }

  // Update AI state
  setAIState(state: AIState, additionalData?: Partial<AISessionData>): void {
    try {
      const currentData = this.getAIState();
      const newData: AISessionData = {
        ...currentData,
        state,
        lastUsed: Date.now(),
        ...additionalData,
      };

      // Increment usage count when AI is applied
      if (state === "applied") {
        newData.usageCount = (currentData.usageCount || 0) + 1;
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(newData));
    } catch (error) {
      console.warn("Failed to save AI state to localStorage:", error);
    }
  }

  // Check if user has used AI before
  hasUsedAIBefore(): boolean {
    const data = this.getAIState();
    return data.usageCount > 0;
  }

  // Get usage count
  getUsageCount(): number {
    const data = this.getAIState();
    return data.usageCount || 0;
  }

  // Clear AI state (for testing or reset)
  clearAIState(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear AI state from localStorage:', error);
    }
  }

  // Reset AI state for new wizard session (preserve usage count for analytics)
  resetForNewSession(): void {
    try {
      const currentData = this.getAIState();
      const resetData: AISessionData = {
        state: "never-used",
        usageCount: currentData.usageCount || 0, // Preserve usage count for user experience
        lastUsed: undefined,
        appliedConfig: undefined,
        sessionId: undefined,
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(resetData));
    } catch (error) {
      console.warn('Failed to reset AI state in localStorage:', error);
    }
  }

  // Get state-based button styling
  getButtonStyling(currentState?: AIState): {
    className: string;
    text: string;
    icon: string;
    description: string;
  } {
    const state = currentState || this.getAIState().state;
    const usageCount = this.getUsageCount();

    switch (state) {
      case "never-used":
      case "unselected":
        return {
          className:
            usageCount > 0
              ? "bg-white text-purple-600 border-2 border-purple-300 hover:bg-purple-50 hover:border-purple-400"
              : "bg-gradient-to-r from-purple-600 to-blue-600 text-white border-2 border-transparent hover:from-purple-700 hover:to-blue-700",
          text: usageCount > 0 ? "Use AI Again" : "Try AI Optimization",
          icon: "🤖",
          description:
            usageCount > 0 ? "Get additional AI insights" : "Let AI analyze your configuration",
        };

      case "analyzing":
        return {
          className:
            "bg-gradient-to-r from-blue-600 to-purple-600 text-white border-2 border-blue-300 ring-4 ring-blue-200",
          text: "AI Analyzing...",
          icon: "🔍",
          description: "AI is analyzing your configuration",
        };

      case "active":
        return {
          className:
            "bg-gradient-to-r from-blue-600 to-purple-600 text-white border-2 border-blue-300 ring-4 ring-blue-200",
          text: "AI Analysis Ready",
          icon: "⚡",
          description: "AI has suggestions ready to apply",
        };

      case "applied":
        return {
          className:
            "bg-gradient-to-r from-green-600 to-emerald-600 text-white border-2 border-green-300 ring-4 ring-green-200",
          text: "✅ AI Applied",
          icon: "✅",
          description: "AI optimization has been applied",
        };

      default:
        return {
          className:
            "bg-gradient-to-r from-purple-600 to-blue-600 text-white border-2 border-transparent hover:from-purple-700 hover:to-blue-700",
          text: "Try AI Optimization",
          icon: "🤖",
          description: "Let AI analyze your configuration",
        };
    }
  }

  // Get contextual messaging based on usage history
  getContextualMessage(): string {
    const usageCount = this.getUsageCount();
    const state = this.getAIState().state;

    if (usageCount === 0) {
      return "Let our AI analyze your configuration and suggest optimizations based on industry best practices.";
    } else if (usageCount === 1) {
      return "Want additional insights? Our AI can provide alternative configurations or refinements.";
    } else {
      return `You've used AI optimization ${usageCount} times. Each analysis can reveal new insights as your requirements evolve.`;
    }
  }
}

// Export singleton instance
export const aiStateService = new AIStateService();
