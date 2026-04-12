import { useId, useState } from "react";
import type { CategoryColor } from "../types/category";
import { ColorPicker } from "./ColorPicker";

type CategoryFormProps = {
  initialName?: string;
  initialColor?: CategoryColor;
  onSubmit: (data: { name: string; color: CategoryColor }) => void;
  onCancel: () => void;
  saving: boolean;
};

export function CategoryForm({
  initialName = "",
  initialColor = "blue",
  onSubmit,
  onCancel,
  saving,
}: CategoryFormProps) {
  const nameId = useId();
  const [name, setName] = useState(initialName);
  const [color, setColor] = useState<CategoryColor>(initialColor);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({ name: name.trim(), color });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label
          htmlFor={nameId}
          className="mb-1 block text-sm font-medium text-on-surface-secondary"
        >
          カテゴリ名
        </label>
        <input
          id={nameId}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={255}
          className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder="例: 仕事、プライベート"
        />
      </div>
      <div>
        <span className="mb-1 block text-sm font-medium text-on-surface-secondary">
          カラー
        </span>
        <ColorPicker value={color} onChange={setColor} />
      </div>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-border bg-white px-4 py-2 text-sm text-on-surface-secondary hover:bg-surface-hover"
        >
          キャンセル
        </button>
        <button
          type="submit"
          disabled={saving || !name.trim()}
          className="rounded-md bg-primary px-4 py-2 text-sm text-white hover:bg-primary-dark disabled:opacity-50"
        >
          保存
        </button>
      </div>
    </form>
  );
}
