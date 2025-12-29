/**
 * ERROR BOUNDARY FOR WIZARD STEPS
 * ===============================
 * Catches errors in wizard step components and displays user-friendly error messages
 * Prevents entire wizard from crashing on step-level errors
 */

import React, { Component } from 'react';
import type { ErrorInfo } from 'react';
import type { ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  stepName?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class WizardErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    if (import.meta.env.DEV) {
      console.error('🚨 Wizard Step Error:', error);
      console.error('Error Info:', errorInfo);
    }

    // TODO: Send to error tracking service in production
    // errorTrackingService.captureException(error, { extra: errorInfo });

    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
          <div className="max-w-md w-full bg-gradient-to-br from-red-900/20 to-orange-900/20 rounded-2xl p-8 border-2 border-red-500/30">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-8 h-8 text-red-400" />
              <h2 className="text-xl font-bold text-white">
                Oops! Something went wrong
              </h2>
            </div>
            
            {this.props.stepName && (
              <p className="text-white/70 mb-4">
                An error occurred in <strong>{this.props.stepName}</strong>
              </p>
            )}
            
            <p className="text-white/60 text-sm mb-6">
              Don't worry, your progress is saved. You can try again or go back to the previous step.
            </p>

            {import.meta.env.DEV && this.state.error && (
              <details className="mb-6">
                <summary className="text-white/50 text-sm cursor-pointer mb-2">
                  Error Details (Dev Only)
                </summary>
                <pre className="text-xs text-red-300 bg-black/30 p-3 rounded overflow-auto max-h-40">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <div className="flex gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" />
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

