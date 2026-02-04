"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  /** Custom fallback component to render on error */
  fallback?: ReactNode;
  /** Callback when an error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Whether to show a retry button */
  showRetry?: boolean;
  /** Custom error message */
  message?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary - Catches JavaScript errors in child components
 * 
 * Features:
 * - Graceful fallback UI
 * - Retry functionality
 * - Error callback for logging/reporting
 * - Custom fallback support
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ErrorBoundary] Caught error:", error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    const { hasError, error } = this.state;
    const { 
      children, 
      fallback, 
      showRetry = true,
      message = "Something went wrong. Please try again."
    } = this.props;

    if (hasError) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback;
      }

      // Default error UI
      return (
        <div 
          id="error-boundary-fallback"
          className="flex flex-col items-center justify-center min-h-[200px] p-6 text-center bg-slate-50 rounded-xl border border-slate-200"
          role="alert"
        >
          <div className="flex items-center justify-center w-12 h-12 mb-4 bg-red-100 rounded-full">
            <AlertTriangle className="w-6 h-6 text-red-500" aria-hidden="true" />
          </div>
          
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            Oops!
          </h3>
          
          <p className="text-sm text-slate-600 mb-4 max-w-sm">
            {message}
          </p>

          {process.env.NODE_ENV === "development" && error && (
            <pre className="text-xs text-left bg-slate-100 p-3 rounded-md mb-4 max-w-full overflow-auto text-red-600">
              {error.message}
            </pre>
          )}

          {showRetry && (
            <Button
              id="error-boundary-retry-btn"
              variant="outline"
              onClick={this.handleRetry}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" aria-hidden="true" />
              Try Again
            </Button>
          )}
        </div>
      );
    }

    return children;
  }
}

export { ErrorBoundary };
