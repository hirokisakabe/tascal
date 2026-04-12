import type { CategoryColor } from "../types/category";

export const CATEGORY_COLORS: Record<CategoryColor, { bg: string }> = {
  red: { bg: "#fde8e8" },
  orange: { bg: "#fff1e6" },
  yellow: { bg: "#fef9c3" },
  green: { bg: "#dcfce7" },
  teal: { bg: "#ccfbf1" },
  blue: { bg: "#dbeafe" },
  purple: { bg: "#f3e8ff" },
  pink: { bg: "#fce7f3" },
};

export const CATEGORY_COLOR_LABELS: Record<CategoryColor, string> = {
  red: "レッド",
  orange: "オレンジ",
  yellow: "イエロー",
  green: "グリーン",
  teal: "ティール",
  blue: "ブルー",
  purple: "パープル",
  pink: "ピンク",
};
