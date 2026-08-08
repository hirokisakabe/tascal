/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { semanticColors } from "@tascal/design-tokens";
import { Platform } from "react-native";

export const Colors = {
  light: {
    text: semanticColors.text.base,
    background: "#fff",
    tint: semanticColors.primary.base,
    tintBackground: semanticColors.primary.base,
    onTint: "#fff",
    icon: semanticColors.text.secondary,
    muted: semanticColors.text.muted,
    surface: semanticColors.surface.base,
    glassTint: "rgba(245, 244, 240, 0.72)",
    surfaceHover: semanticColors.surface.hover,
    border: semanticColors.border.base,
    borderLight: semanticColors.border.light,
    controlBorder: "#8b857f",
    danger: semanticColors.danger.base,
    tabIconDefault: semanticColors.text.secondary,
    tabIconSelected: semanticColors.primary.base,
  },
  dark: {
    text: semanticColors.surface.base,
    background: "#17151a",
    tint: "#b8b2dc",
    tintBackground: "#8881b4",
    onTint: "#17151a",
    icon: "#c0bbb6",
    muted: "#8f8984",
    surface: "#211f23",
    glassTint: "rgba(33, 31, 35, 0.8)",
    surfaceHover: "#2b282e",
    border: "#69646e",
    borderLight: "#3b3740",
    controlBorder: "#706b75",
    danger: "#e89aae",
    tabIconDefault: "#c0bbb6",
    tabIconSelected: semanticColors.primary.muted,
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
