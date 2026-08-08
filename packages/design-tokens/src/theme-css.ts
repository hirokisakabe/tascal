import { semanticColors } from "./index";

const tailwindThemeColors = [
  ["primary", semanticColors.primary.base],
  ["primary-dark", semanticColors.primary.dark],
  ["primary-light", semanticColors.primary.light],
  ["primary-lighter", semanticColors.primary.lighter],
  ["primary-muted", semanticColors.primary.muted],
  ["danger", semanticColors.danger.base],
  ["danger-dark", semanticColors.danger.dark],
  ["danger-light", semanticColors.danger.light],
  ["surface", semanticColors.surface.base],
  ["surface-hover", semanticColors.surface.hover],
  ["on-surface", semanticColors.text.base],
  ["on-surface-secondary", semanticColors.text.secondary],
  ["on-surface-muted", semanticColors.text.muted],
  ["border", semanticColors.border.base],
  ["border-light", semanticColors.border.light],
] as const;

export function createTailwindThemeCss(): string {
  const variables = tailwindThemeColors
    .map(([name, value]) => `  --color-${name}: ${value};`)
    .join("\n");

  return `/* Generated from src/index.ts by pnpm generate. Do not edit. */\n@theme {\n${variables}\n}\n`;
}
