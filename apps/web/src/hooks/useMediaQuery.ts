import { useEffect, useState } from "react";

const canUseMatchMedia =
  typeof window !== "undefined" && "matchMedia" in window;

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    canUseMatchMedia ? window.matchMedia(query).matches : false,
  );

  useEffect(() => {
    if (!canUseMatchMedia) return;
    const mql = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [query]);

  return matches;
}
