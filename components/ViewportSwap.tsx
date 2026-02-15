"use client";

import { useState, useEffect } from "react";

const isChrome =
  typeof navigator !== "undefined" &&
  /Chrome/.test(navigator.userAgent) &&
  !/Edg/.test(navigator.userAgent);

const DESKTOP_MIN_WIDTH = 1024;

/**
 * When width > height (PC/landscape), treats the viewport as y:x (portrait)
 * by constraining layout to use height as width. Chrome on PC gets 50% zoom to match Safari.
 * Mobile Chrome/Safari work fine; zoom fix is desktop-only.
 */
export function ViewportSwap({ children }: { children: React.ReactNode }) {
  const [maxWidth, setMaxWidth] = useState<number | undefined>(undefined);
  const [desktopLandscape, setDesktopLandscape] = useState(false);

  useEffect(() => {
    const check = () => {
      if (typeof window === "undefined") return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      setMaxWidth(w > h ? h : undefined);
      setDesktopLandscape(w > h && w >= DESKTOP_MIN_WIDTH);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const baseStyle =
    maxWidth !== undefined
      ? {
          width: "100%" as const,
          maxWidth: `${maxWidth}px`,
          marginLeft: "auto" as const,
          marginRight: "auto" as const,
        }
      : undefined;

  // zoom: 0.5 shrinks layout; minHeight 200vh makes scaled content fill 100vh, anchoring footer to bottom
  const chromeZoom = isChrome && desktopLandscape;

  return (
    <div
      className={`viewport-swap-wrapper flex flex-col${chromeZoom ? " chrome-zoom-active" : ""}`}
      data-chrome-zoom={chromeZoom ? "0.5" : undefined}
      style={{
        ...baseStyle,
        minHeight: chromeZoom ? "200vh" : "100vh",
        ...(chromeZoom && { zoom: 0.5 }),
      }}
    >
      {children}
    </div>
  );
}
