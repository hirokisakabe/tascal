import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createTailwindThemeCss } from "../src/theme-css";

const outputPath = fileURLToPath(new URL("../theme.css", import.meta.url));
const expected = createTailwindThemeCss();

if (process.argv.includes("--check")) {
  const actual = await readFile(outputPath, "utf8").catch(() => "");

  if (actual !== expected) {
    console.error(
      "packages/design-tokens/theme.css is stale. Run `pnpm --filter @tascal/design-tokens generate`.",
    );
    process.exitCode = 1;
  }
} else {
  await writeFile(outputPath, expected);
}
