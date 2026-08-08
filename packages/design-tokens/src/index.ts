/**
 * Platform-independent semantic colors shared by Web and Mobile.
 *
 * Keep platform theme mappings in each app. This object is the single source
 * for values that have the same meaning and appearance on both platforms.
 */
export const semanticColors = {
  primary: {
    base: "#4a4181",
    dark: "#3d366d",
    light: "#edecf3",
    lighter: "#f3f2f8",
    muted: "#7a73a8",
  },
  danger: {
    base: "#881337",
    dark: "#6e0f2d",
    light: "#f5e6eb",
  },
  surface: {
    base: "#f5f4f0",
    hover: "#eeedea",
  },
  text: {
    base: "#2d2a26",
    secondary: "#6b6560",
    muted: "#a09a94",
  },
  border: {
    base: "#cbc8c0",
    light: "#dddbd5",
  },
} as const;

export type SemanticColors = typeof semanticColors;
