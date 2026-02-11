import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Poker Wordle - Daily Poker Puzzle",
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
      <body className="antialiased min-h-screen bg-white text-[#1a1a1b]">
        {children}
      </body>
    </html>
  );
}
