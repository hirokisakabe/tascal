import { useState } from "react";
import type { Task } from "../types/task";
import { useUpdateTask, useDeleteTask } from "../hooks/useTasks";

type TaskDetailModalProps = {
  task: Task;
  year: number;
  month: number;
  onClose: () => void;
  onUpdated: () => void;
};

export function TaskDetailModal({
  task,
  year,
  month,
  onClose,
  onUpdated,
}: TaskDetailModalProps) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [date, setDate] = useState(task.date);
  const [error, setError] = useState<string | null>(null);

  const updateTaskMutation = useUpdateTask(year, month);
  const deleteTaskMutation = useDeleteTask(year, month);

  const saving = updateTaskMutation.isPending;
  const deleting = deleteTaskMutation.isPending;
  const busy = saving || deleting;

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
        },
      },
      {
        onSuccess: () => onUpdated(),
        onError: () => setError("タスクの更新に失敗しました"),
      },
    );
  };

  const handleDelete = () => {
    if (!window.confirm("このタスクを削除しますか？")) return;

    setError(null);
    deleteTaskMutation.mutate(task.id, {
      onSuccess: () => onUpdated(),
      onError: () => setError("タスクの削除に失敗しました"),
    });
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
        <h3 className="mb-4 text-lg font-bold text-gray-900">タスクの詳細</h3>
        {error && (
          <div className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label
              htmlFor="detail-title"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              タイトル <span className="text-red-500">*</span>
            </label>
            <input
              id="detail-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label
              htmlFor="detail-description"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              説明
            </label>
            <textarea
              id="detail-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label
              htmlFor="detail-date"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              日付
            </label>
            <input
              id="detail-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>
          <div className="flex justify-between">
            <button
              type="button"
              onClick={handleDelete}
              disabled={busy}
              className="rounded-md bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50"
            >
              {deleting ? "削除中..." : "削除"}
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={busy || !title.trim()}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? "保存中..." : "保存"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
