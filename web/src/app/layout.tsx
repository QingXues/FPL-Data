import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "FPL Analytics",
  description: "Fantasy Premier League data and statistics",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-[#1a1a2e]">
        <header className="border-b border-gray-200 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-4">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center bg-[#37003c] text-xs font-bold text-white">
                FPL
              </div>
              <span className="text-lg font-bold tracking-tight text-[#37003c]">
                Analytics
              </span>
            </Link>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
