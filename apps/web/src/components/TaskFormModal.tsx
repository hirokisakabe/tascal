import { useState } from "react";
import { useCategories } from "../hooks/useCategories";
import { useCreateTask } from "../hooks/useTasks";
import { ModalWrapper } from "./ModalWrapper";

type TaskFormModalProps = {
  open: boolean;
  date: string;
  year: number;
  month: number;
  onClose: () => void;
  onCreated: () => void;
};

export function TaskFormModal({
  open,
  date,
  year,
  month,
  onClose,
  onCreated,
}: TaskFormModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");

  const { data: categories = [] } = useCategories();
  const createTaskMutation = useCreateTask(year, month);
  const saving = createTaskMutation.isPending;
  const error = createTaskMutation.error ? "タスクの作成に失敗しました" : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    createTaskMutation.mutate(
      {
        title: title.trim(),
        description: description.trim() || null,
        date,
        categoryId: categoryId || null,
      },
      {
        onSuccess: () => onCreated(),
      },
    );
  };

  return (
    <ModalWrapper open={open} onClose={onClose}>
      <h3 className="mb-4 text-lg font-bold text-on-surface">
        タスクを追加（{date}）
      </h3>
      {error && (
        <div className="mb-3 rounded-md bg-danger-light px-3 py-2 text-sm text-danger">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="task-title"
            className="mb-1 block text-sm font-medium text-on-surface-secondary"
          >
            タイトル <span className="text-danger">*</span>
          </label>
          <input
            id="task-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            autoFocus
            required
          />
        </div>
        <div>
          <label
            htmlFor="task-description"
            className="mb-1 block text-sm font-medium text-on-surface-secondary"
          >
            説明
          </label>
          <textarea
            id="task-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        {categories.length > 0 && (
          <div>
            <label
              htmlFor="task-category"
              className="mb-1 block text-sm font-medium text-on-surface-secondary"
            >
              カテゴリ
            </label>
            <select
              id="task-category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">カテゴリなし</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-border bg-white px-4 py-2 text-sm text-on-surface-secondary hover:bg-surface-hover"
          >
            キャンセル
          </button>
          <button
            type="submit"
            disabled={saving || !title.trim()}
            className="rounded-md bg-primary px-4 py-2 text-sm text-white hover:bg-primary-dark disabled:opacity-50"
          >
            {saving ? "保存中..." : "追加"}
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
}
