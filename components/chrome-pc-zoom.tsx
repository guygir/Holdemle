"use client";

import { useEffect } from "react";

export function ChromePcZoom() {
  useEffect(() => {
    const ua = navigator.userAgent;
    const isChrome =
      ua.includes("Chrome") && !ua.includes("Edg") && !ua.includes("OPR");

    const update = () => {
      const isPc = window.innerWidth >= 1024;
      const isLandscape = window.innerWidth > window.innerHeight;
      if (isChrome && isPc && isLandscape) {
        document.body.classList.add("chrome-pc-zoom");
      } else {
        document.body.classList.remove("chrome-pc-zoom");
      }
    };

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return null;
}
