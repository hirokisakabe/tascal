import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { semanticColors } from "./index";
import { createTailwindThemeCss } from "./theme-css";

describe("design tokens", () => {
  it("exposes the shared semantic token structure", () => {
    expect(Object.keys(semanticColors)).toEqual([
      "primary",
      "danger",
      "surface",
      "text",
      "border",
    ]);
    expect(
      Object.fromEntries(
        Object.entries(semanticColors).map(([group, tokens]) => [
          group,
          Object.keys(tokens),
        ]),
      ),
    ).toEqual({
      primary: ["base", "dark", "light", "lighter", "muted"],
      danger: ["base", "dark", "light"],
      surface: ["base", "hover"],
      text: ["base", "secondary", "muted"],
      border: ["base", "light"],
    });
  });

  it("keeps the generated Tailwind theme in sync", async () => {
    const generatedPath = new URL("../theme.css", import.meta.url);

    await expect(readFile(generatedPath, "utf8")).resolves.toBe(
      createTailwindThemeCss(),
    );
  });
});
