export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div 
      id="auth-layout-root"
      className="min-h-[calc(100dvh-4rem)] flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-3 sm:p-4 py-6 sm:py-8"
    >
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  );
}
