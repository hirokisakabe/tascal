import { useState } from "react";
import { useCreateTask } from "../hooks/useTasks";

type TaskFormModalProps = {
  date: string;
  year: number;
  month: number;
  onClose: () => void;
  onCreated: () => void;
};

export function TaskFormModal({
  date,
  year,
  month,
  onClose,
  onCreated,
}: TaskFormModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

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
      },
      {
        onSuccess: () => onCreated(),
      },
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-4 text-lg font-bold text-gray-900">
          タスクを追加（{date}）
        </h3>
        {error && (
          <div className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="task-title"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              タイトル <span className="text-red-500">*</span>
            </label>
            <input
              id="task-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              autoFocus
              required
            />
          </div>
          <div>
            <label
              htmlFor="task-description"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              説明
            </label>
            <textarea
              id="task-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={saving || !title.trim()}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "保存中..." : "追加"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
