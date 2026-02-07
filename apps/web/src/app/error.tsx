"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <div
      id="error-page-01"
      className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center"
    >
      <div
        id="error-icon-01"
        className="flex items-center justify-center w-16 h-16 mb-6 bg-red-100 rounded-2xl"
      >
        <AlertTriangle className="w-8 h-8 text-red-500" aria-hidden="true" />
      </div>

      <h1
        id="error-title-01"
        className="text-2xl font-semibold text-slate-900 mb-2 font-[family-name:var(--font-outfit)]"
      >
        Something went wrong
      </h1>

      <p id="error-message-01" className="text-sm text-slate-500 mb-8 max-w-md">
        An unexpected error occurred. Please try again — if the problem persists,
        head back to the marketplace.
      </p>

      {process.env.NODE_ENV === "development" && error?.message && (
        <pre
          id="error-devinfo-01"
          className="text-xs text-left bg-slate-100 p-3 rounded-lg mb-6 max-w-full overflow-auto text-red-600"
        >
          {error.message}
        </pre>
      )}

      <div id="error-actions-01" className="flex gap-3">
        <button
          id="error-retry-btn-01"
          onClick={reset}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-slate-800 transition-colors"
        >
          <RefreshCw className="w-4 h-4" aria-hidden="true" />
          Try Again
        </button>

        <Link
          id="error-home-link-01"
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors"
        >
          <Home className="w-4 h-4" aria-hidden="true" />
          Marketplace
        </Link>
      </div>
    </div>
  );
}
