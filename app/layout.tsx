import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Press_Start_2P } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const pixelFont = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-press-start-2p",
  display: "swap",
});

export const metadata: Metadata = {
  title: "8-Bit Golf Stats",
  description: "Upload a photo, get an 8-bit avatar, build your tournament stat card.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={pixelFont.variable}>
      <body className="min-h-screen bg-page font-sans text-ink antialiased">
        <header className="border-b border-hairline px-4 py-4">
          <Link href="/" className="font-pixel text-[10px] text-accent sm:text-xs">
            8-BIT GOLF STATS
          </Link>
        </header>
        <main className="px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
