import { Search, Home } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div
      id="not-found-page-01"
      className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center"
    >
      <div
        id="not-found-icon-01"
        className="flex items-center justify-center w-16 h-16 mb-6 bg-slate-100 rounded-2xl"
      >
        <Search className="w-8 h-8 text-slate-400" aria-hidden="true" />
      </div>

      <h1
        id="not-found-title-01"
        className="text-2xl font-semibold text-slate-900 mb-2 font-[family-name:var(--font-outfit)]"
      >
        Page not found
      </h1>

      <p id="not-found-message-01" className="text-sm text-slate-500 mb-8 max-w-md">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>

      <Link
        id="not-found-home-link-01"
        href="/"
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-slate-800 transition-colors"
      >
        <Home className="w-4 h-4" aria-hidden="true" />
        Back to Marketplace
      </Link>
    </div>
  );
}
