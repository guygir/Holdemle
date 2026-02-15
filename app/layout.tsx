import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ChromePcZoom } from "@/components/chrome-pc-zoom";

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
      <body className="antialiased min-h-screen flex flex-col bg-white text-[#1a1a1b] text-sm sm:text-base lg:text-lg">
        <ChromePcZoom />
        <div className="app-content flex-1 flex flex-col min-h-0">
          {children}
        </div>
      </body>
    </html>
  );
}
