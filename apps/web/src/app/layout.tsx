import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import localFont from "next/font/local";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import ScrollToTop from "@/components/layout/ScrollToTop";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { AppProvider } from "@/lib/store";
import { Toaster } from "@/components/ui/sonner";

const geistSans = localFont({
  src: "../../public/fonts/geist-sans.woff2",
  variable: "--font-geist-sans",
});

const geistMono = localFont({
  src: "../../public/fonts/geist-mono.woff2",
  variable: "--font-geist-mono",
});

const outfit = localFont({
  src: [
    {
      path: "../../public/fonts/outfit-400.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/outfit-500.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/fonts/outfit-600.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../public/fonts/outfit-700.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-outfit",
});

const notoUrdu = localFont({
  src: [
    {
      path: "../../public/fonts/noto-sans-arabic-400.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/noto-sans-arabic-700.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-noto-urdu",
});


export const metadata: Metadata = {
  title: "Boliyan - Speak Your Price",
  description: "Bid smart, sell faster. The no-nonsense marketplace.",
  icons: {
    icon: "/logo.svg",
    apple: "/logo.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  interactiveWidget: "resizes-content",
};



import { NotificationProvider } from "@/context/NotificationContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import GlobalSonic from "@/components/common/GlobalSonic";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        id="root-body-01"
        className={`${geistSans.variable} ${geistMono.variable} ${outfit.variable} ${notoUrdu.variable} antialiased bg-slate-50`}
      >
        <AppProvider>
          <GlobalSonic />
          <NotificationProvider>
            <TooltipProvider>
              <Suspense fallback={<div className="h-16 border-b bg-white" />}>
                <Navbar />
              </Suspense>
              <div id="layout-wrapper-02" className="flex pt-16 min-h-[100dvh]">
                <Sidebar />
                <main id="main-content-03" className="flex-1 flex flex-col w-full min-w-0 min-h-[calc(100dvh-4rem)] pb-16 md:pb-0">
                  {children}
                </main>
              </div>
              <Suspense fallback={null}>
                <BottomNav />
              </Suspense>
              <ScrollToTop />
            </TooltipProvider>
          </NotificationProvider>
          <Suspense fallback={null}>
            <AuthDialog />
          </Suspense>
        </AppProvider>
        <Toaster />
      </body>
    </html>
  );
}
