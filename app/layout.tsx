import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ViewportSwap } from "@/components/ViewportSwap";

export const metadata: Metadata = {
  title: "Hold'emle - Texas Hold'em Daily Puzzle",
  description: "Guess the pre-flop odds daily! A daily poker puzzle game inspired by Wordle.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-white text-[#1a1a1b] text-sm sm:text-base lg:text-lg">
        <ViewportSwap>{children}</ViewportSwap>
      </body>
    </html>
  );
}
