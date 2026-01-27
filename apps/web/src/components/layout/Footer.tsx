import Link from "next/link";

interface FooterProps {
  className?: string;
}

export default function Footer({ className }: FooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer
      id="footer-01"
      className={`mt-10 border-t border-slate-200 bg-slate-50 ${className ?? ""}`.trim()}
    >
      <div
        id="footer-inner-01"
        className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-6 py-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between"
      >
        <span id="footer-copy-01">Copyright © {year} Boliyan</span>
        <div id="footer-links-01" className="flex flex-col gap-2 sm:flex-row sm:gap-6">
          <Link id="footer-terms-link-01" href="/terms-of-service" className="hover:text-slate-700">
            Terms of Service
          </Link>
          <Link id="footer-privacy-link-01" href="/privacy-policy" className="hover:text-slate-700">
            Privacy Policy
          </Link>
        </div>
      </div>
    </footer>
  );
}
