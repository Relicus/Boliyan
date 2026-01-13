import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import { AppProvider } from "@/lib/store";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-50`}
      >
        <AppProvider>
          <Navbar />
          <div className="flex">
            <Sidebar />
            <main className="flex-1 min-h-[calc(100vh-64px)]">
              {children}
            </main>
          </div>
        </AppProvider>
      </body>
    </html>
  );
}
