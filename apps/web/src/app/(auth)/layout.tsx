export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div 
      id="auth-layout-root"
      className="min-h-[calc(100dvh-4rem)] flex items-start sm:items-center justify-center bg-white sm:bg-gradient-to-br sm:from-slate-50 sm:via-blue-50 sm:to-slate-100 px-0 sm:px-4 pt-4 sm:py-8 overscroll-none"
    >
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  );
}
