/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from "react-native";

// Keep these semantic colors aligned with apps/web/src/index.css.
const primary = "#4a4181";
const primaryMuted = "#7a73a8";

export const Colors = {
  light: {
    text: "#2d2a26",
    background: "#fff",
    tint: primary,
    tintBackground: primary,
    onTint: "#fff",
    icon: "#6b6560",
    muted: "#a09a94",
    surface: "#f5f4f0",
    surfaceHover: "#eeedea",
    border: "#cbc8c0",
    borderLight: "#dddbd5",
    controlBorder: "#8b857f",
    danger: "#881337",
    tabIconDefault: "#6b6560",
    tabIconSelected: primary,
  },
  dark: {
    text: "#f5f4f0",
    background: "#17151a",
    tint: "#b8b2dc",
    tintBackground: "#8881b4",
    onTint: "#17151a",
    icon: "#c0bbb6",
    muted: "#8f8984",
    surface: "#211f23",
    surfaceHover: "#2b282e",
    border: "#69646e",
    borderLight: "#3b3740",
    controlBorder: "#69646e",
    danger: "#e89aae",
    tabIconDefault: "#c0bbb6",
    tabIconSelected: primaryMuted,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
