import { useEffect, useState } from "react";
import type { Task } from "../types/task";
import { useCategories } from "../hooks/useCategories";
import { useUpdateTask, useDeleteTask } from "../hooks/useTasks";
import { ModalWrapper } from "./ModalWrapper";

type TaskDetailModalProps = {
  open: boolean;
  task: Task;
  year: number;
  month: number;
  onClose: () => void;
  onUpdated: () => void;
};

export function TaskDetailModal({
  open,
  task,
  year,
  month,
  onClose,
  onUpdated,
}: TaskDetailModalProps) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [date, setDate] = useState(task.date);
  const [categoryId, setCategoryId] = useState<string>(task.categoryId ?? "");
  const [error, setError] = useState<string | null>(null);

  const { data: categories = [] } = useCategories();
  const updateTaskMutation = useUpdateTask(year, month);
  const deleteTaskMutation = useDeleteTask(year, month);

  const saving = updateTaskMutation.isPending;
  const deleting = deleteTaskMutation.isPending;
  const busy = saving || deleting;

  useEffect(() => {
    if (!open) {
      setError(null);
    }
  }, [open]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setError(null);
    updateTaskMutation.mutate(
      {
        id: task.id,
        data: {
          title: title.trim(),
          description: description.trim() || null,
          date,
          categoryId: categoryId || null,
        },
      },
      {
        onSuccess: () => onUpdated(),
        onError: () => setError("タスクの更新に失敗しました"),
      },
    );
  };

  const handleDelete = () => {
    setError(null);
    deleteTaskMutation.mutate(task.id, {
      onSuccess: () => onUpdated(),
      onError: () => setError("タスクの削除に失敗しました"),
    });
  };

  return (
    <ModalWrapper open={open} onClose={onClose}>
      <h3 className="mb-4 text-lg font-bold text-on-surface">タスクの詳細</h3>
      {error && (
        <div className="mb-3 rounded-md bg-danger-light px-3 py-2 text-sm text-danger">
          {error}
        </div>
      )}
      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label
            htmlFor="detail-title"
            className="mb-1 block text-sm font-medium text-on-surface-secondary"
          >
            タイトル <span className="text-danger">*</span>
          </label>
          <input
            id="detail-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            required
          />
        </div>
        <div>
          <label
            htmlFor="detail-description"
            className="mb-1 block text-sm font-medium text-on-surface-secondary"
          >
            説明
          </label>
          <textarea
            id="detail-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div>
          <label
            htmlFor="detail-date"
            className="mb-1 block text-sm font-medium text-on-surface-secondary"
          >
            日付
          </label>
          <input
            id="detail-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            required
          />
        </div>
        {categories.length > 0 && (
          <div>
            <label
              htmlFor="detail-category"
              className="mb-1 block text-sm font-medium text-on-surface-secondary"
            >
              カテゴリ
            </label>
            <select
              id="detail-category"
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
        <div className="flex justify-between">
          <button
            type="button"
            onClick={handleDelete}
            disabled={busy}
            className="rounded-md bg-danger px-4 py-2 text-sm text-white hover:bg-danger-dark disabled:opacity-50"
          >
            {deleting ? "削除中..." : "削除"}
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-border bg-white px-4 py-2 text-sm text-on-surface-secondary hover:bg-surface-hover"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={busy || !title.trim()}
              className="rounded-md bg-primary px-4 py-2 text-sm text-white hover:bg-primary-dark disabled:opacity-50"
            >
              {saving ? "保存中..." : "保存"}
            </button>
          </div>
        </div>
      </form>
    </ModalWrapper>
  );
}
