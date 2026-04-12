import type { CategoryColor } from "../types/category";
import {
  CATEGORY_COLORS,
  CATEGORY_COLOR_LABELS,
} from "../constants/categoryColors";

type ColorPickerProps = {
  value: CategoryColor | null;
  onChange: (color: CategoryColor) => void;
};

const COLOR_KEYS = Object.keys(CATEGORY_COLORS) as CategoryColor[];

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {COLOR_KEYS.map((color) => (
        <button
          key={color}
          type="button"
          title={CATEGORY_COLOR_LABELS[color]}
          onClick={() => onChange(color)}
          className={`h-8 w-8 rounded-full border-2 transition-transform ${
            value === color
              ? "scale-110 border-on-surface"
              : "border-transparent hover:scale-105"
          }`}
          style={{ backgroundColor: CATEGORY_COLORS[color].bg }}
        />
      ))}
    </div>
  );
}
