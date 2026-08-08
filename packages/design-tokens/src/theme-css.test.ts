import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { semanticColors } from "./index";
import { createTailwindThemeCss } from "./theme-css";

describe("design tokens", () => {
  it("preserves the shared semantic palette", () => {
    expect(semanticColors).toEqual({
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
      surface: { base: "#f5f4f0", hover: "#eeedea" },
      text: {
        base: "#2d2a26",
        secondary: "#6b6560",
        muted: "#a09a94",
      },
      border: { base: "#cbc8c0", light: "#dddbd5" },
    });
  });

  it("keeps the generated Tailwind theme in sync", async () => {
    const generatedPath = new URL("../theme.css", import.meta.url);

    await expect(readFile(generatedPath, "utf8")).resolves.toBe(
      createTailwindThemeCss(),
    );
  });
});
