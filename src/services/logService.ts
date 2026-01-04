/**
 * Centralized Logging Service
 *
 * Provides structured logging with multiple log levels and optional remote logging.
 * Replaces scattered console.log statements with a consistent logging interface.
 *
 * Features:
 * - Multiple log levels (debug, info, warn, error)
 * - Automatic environment detection (DEV vs PROD)
 * - Structured log entries with metadata
 * - Console output formatting with colors/emojis
 * - Optional remote logging integration
 * - Performance metrics tracking
 *
 * Usage:
 * ```typescript
 * import { logger } from '@/services/logService';
 *
 * logger.info('User logged in', { userId: '123', method: 'email' });
 * logger.warn('API response slow', { endpoint: '/api/data', duration: 5000 });
 * logger.error('Database connection failed', error);
 * ```
 */

import type { LogEntry } from "@/types";

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  component?: string;
  function?: string;
  userId?: string;
  sessionId?: string;
  [key: string]: any;
}

interface LogServiceConfig {
  minLevel: LogLevel;
  enableConsole: boolean;
  enableRemote: boolean;
  remoteEndpoint?: string;
  maxBufferSize: number;
}

class LogService {
  private config: LogServiceConfig;
  private logBuffer: LogEntry[] = [];
  private sessionId: string;

  constructor() {
    // Default configuration
    this.config = {
      minLevel: import.meta.env.DEV ? "debug" : "info",
      enableConsole: true,
      enableRemote: import.meta.env.PROD || false,
      remoteEndpoint: import.meta.env.VITE_LOG_ENDPOINT,
      maxBufferSize: 100,
    };

    // Generate session ID
    this.sessionId = this.generateSessionId();

    if (import.meta.env.DEV) {
      console.log("🔧 LogService initialized (DEV mode)");
    }
  }

  /**
   * Configure the logging service
   */
  public configure(config: Partial<LogServiceConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Log a debug message (only in development)
   */
  public debug(message: string, context?: LogContext): void {
    this.log("debug", message, context);
  }

  /**
   * Log an informational message
   */
  public info(message: string, context?: LogContext): void {
    this.log("info", message, context);
  }

  /**
   * Log a warning message
   */
  public warn(message: string, context?: LogContext): void {
    this.log("warn", message, context);
  }

  /**
   * Log an error message
   */
  public error(message: string, error?: Error | any, context?: LogContext): void {
    const errorContext =
      error instanceof Error
        ? {
            ...context,
            error: {
              name: error.name,
              message: error.message,
              stack: error.stack,
            },
          }
        : { ...context, error };

    this.log("error", message, errorContext);
  }

  /**
   * Log performance metrics
   */
  public performance(operation: string, duration: number, context?: LogContext): void {
    this.info(`⚡ Performance: ${operation}`, {
      ...context,
      duration: `${duration}ms`,
      type: "performance",
    });
  }

  /**
   * Start a performance timer
   */
  public startTimer(label: string): () => void {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      this.performance(label, Math.round(duration));
    };
  }

  /**
   * Get recent logs (for debugging)
   */
  public getRecentLogs(count = 50): LogEntry[] {
    return this.logBuffer.slice(-count);
  }

  /**
   * Clear log buffer
   */
  public clearLogs(): void {
    this.logBuffer = [];
  }

  /**
   * Export logs for debugging
   */
  public exportLogs(): string {
    return JSON.stringify(this.logBuffer, null, 2);
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private log(level: LogLevel, message: string, context?: LogContext): void {
    // Check if level should be logged
    if (!this.shouldLog(level)) {
      return;
    }

    // Create log entry
    const logEntry: LogEntry = {
      id: this.generateLogId(),
      timestamp: new Date().toISOString(),
      level,
      message,
      context: context?.component,
      data: context,
      sessionId: this.sessionId,
    };

    // Add to buffer
    this.addToBuffer(logEntry);

    // Console output (with formatting)
    if (this.config.enableConsole) {
      this.logToConsole(logEntry);
    }

    // Remote logging (if enabled)
    if (this.config.enableRemote) {
      this.sendToRemote(logEntry);
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ["debug", "info", "warn", "error"];
    const minLevelIndex = levels.indexOf(this.config.minLevel);
    const currentLevelIndex = levels.indexOf(level);
    return currentLevelIndex >= minLevelIndex;
  }

  private logToConsole(entry: LogEntry): void {
    const { level, message, data } = entry;
    const timestamp = new Date(entry.timestamp).toLocaleTimeString();
    const prefix = this.getLogPrefix(level);

    // Format message with context
    const contextStr = entry.context ? `[${entry.context}]` : "";
    const fullMessage = `${prefix} ${timestamp} ${contextStr} ${message}`;

    // Log based on level
    switch (level) {
      case "debug":
        console.log(fullMessage, data || "");
        break;
      case "info":
        console.info(fullMessage, data || "");
        break;
      case "warn":
        console.warn(fullMessage, data || "");
        break;
      case "error":
        console.error(fullMessage, data || "");
        break;
    }
  }

  private getLogPrefix(level: LogLevel): string {
    switch (level) {
      case "debug":
        return "🔍";
      case "info":
        return "ℹ️";
      case "warn":
        return "⚠️";
      case "error":
        return "❌";
      default:
        return "📝";
    }
  }

  private addToBuffer(entry: LogEntry): void {
    this.logBuffer.push(entry);

    // Trim buffer if too large
    if (this.logBuffer.length > this.config.maxBufferSize) {
      this.logBuffer = this.logBuffer.slice(-this.config.maxBufferSize);
    }
  }

  private async sendToRemote(entry: LogEntry): Promise<void> {
    if (!this.config.remoteEndpoint) {
      return;
    }

    try {
      // Send log to remote endpoint (non-blocking)
      fetch(this.config.remoteEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(entry),
        // Don't wait for response
        keepalive: true,
      }).catch((error) => {
        // Silent fail for remote logging
        if (import.meta.env.DEV) {
          console.warn("Failed to send log to remote:", error);
        }
      });
    } catch (error) {
      // Silently fail remote logging
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateLogId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const logger = new LogService();

// Convenience functions for backward compatibility
export const log = {
  debug: (message: string, context?: LogContext) => logger.debug(message, context),
  info: (message: string, context?: LogContext) => logger.info(message, context),
  warn: (message: string, context?: LogContext) => logger.warn(message, context),
  error: (message: string, error?: Error | any, context?: LogContext) =>
    logger.error(message, error, context),
  performance: (operation: string, duration: number, context?: LogContext) =>
    logger.performance(operation, duration, context),
  startTimer: (label: string) => logger.startTimer(label),
};

// Make logger available in window for debugging (DEV only)
if (typeof window !== "undefined" && import.meta.env.DEV) {
  (window as any).logger = logger;
  console.log("🔧 Logger available at window.logger");
}
