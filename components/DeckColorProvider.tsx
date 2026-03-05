"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { DECK_COLORS_KEY, type DeckColorScheme } from "@/lib/deck-colors";

type DeckColorContextValue = {
  scheme: DeckColorScheme;
  setScheme: (s: DeckColorScheme) => void;
  toggleScheme: () => void;
};

const DeckColorContext = createContext<DeckColorContextValue | null>(null);

export function useDeckColors() {
  const ctx = useContext(DeckColorContext);
  if (!ctx) throw new Error("useDeckColors must be used within DeckColorProvider");
  return ctx;
}

export function DeckColorProvider({ children }: { children: React.ReactNode }) {
  const [scheme, setSchemeState] = useState<DeckColorScheme>("2-color");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(DECK_COLORS_KEY) as DeckColorScheme | null;
    if (stored === "2-color" || stored === "4-color") {
      setSchemeState(stored);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem(DECK_COLORS_KEY, scheme);
  }, [mounted, scheme]);

  const setScheme = (s: DeckColorScheme) => setSchemeState(s);
  const toggleScheme = () =>
    setSchemeState((prev) => (prev === "4-color" ? "2-color" : "4-color"));

  return (
    <DeckColorContext.Provider value={{ scheme, setScheme, toggleScheme }}>
      {children}
    </DeckColorContext.Provider>
  );
}
