import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ChromePcZoom } from "@/components/chrome-pc-zoom";
import { ThemeScript } from "@/components/ThemeScript";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { DeckColorProvider } from "@/components/DeckColorProvider";
import { DeckColorToggle } from "@/components/DeckColorToggle";

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
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased min-h-screen flex flex-col bg-white dark:bg-[#1a1a1b] text-[#1a1a1b] dark:text-gray-100 text-sm sm:text-base lg:text-lg transition-colors">
        <ThemeScript />
        <ThemeProvider>
          <DeckColorProvider>
            <ChromePcZoom />
            <div className="fixed top-3 right-3 z-40 flex flex-col items-end gap-2">
              <ThemeToggle />
              <DeckColorToggle />
            </div>
            <div className="app-content flex-1 flex flex-col min-h-0">
              {children}
            </div>
          </DeckColorProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
