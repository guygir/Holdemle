"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="antialiased min-h-screen flex flex-col items-center justify-center p-6 bg-white text-[#1a1a1b]">
        <h2 className="text-xl font-bold mb-4">Something went wrong</h2>
        <button
          onClick={() => reset()}
          className="py-3 px-6 bg-[#6aaa64] text-white font-semibold rounded-lg hover:bg-[#5a9a54] transition-colors"
        >
          Try again
        </button>
      </body>
    </html>
  );
}
