import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import { AppProvider } from "@/lib/store";

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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${outfit.variable} ${notoUrdu.variable} antialiased bg-slate-50`}
      >
        <AppProvider>
          <Navbar />
          <div className="flex">
            <Sidebar />
            <main className="flex-1 flex flex-col w-full min-w-0 min-h-[calc(100vh-64px)] pb-16 md:pb-0">
              {children}
            </main>
          </div>
          <BottomNav />
        </AppProvider>
      </body>
    </html>
  );
}
