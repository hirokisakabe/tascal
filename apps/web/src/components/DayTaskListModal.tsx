import type { Task } from "../types/task";

type DayTaskListModalProps = {
  dateKey: string;
  tasks: Task[];
  onClose: () => void;
  onTaskClick: (task: Task) => void;
  onToggleStatus: (task: Task) => void;
  onAddClick: (dateKey: string) => void;
};

export function DayTaskListModal({
  dateKey,
  tasks,
  onClose,
  onTaskClick,
  onToggleStatus,
  onAddClick,
}: DayTaskListModalProps) {
  const displayDate = dateKey.replace(/-/g, "/");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">
            {displayDate} のタスク
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="閉じる"
          >
            ✕
          </button>
        </div>

        <div className="max-h-80 space-y-1 overflow-y-auto">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`flex items-center gap-2 rounded px-2 py-1.5 text-sm ${
                task.status === "done"
                  ? "text-gray-400 line-through"
                  : "bg-blue-50 text-blue-800"
              }`}
            >
              <input
                type="checkbox"
                checked={task.status === "done"}
                onChange={() => onToggleStatus(task)}
                className="h-3.5 w-3.5 shrink-0 cursor-pointer"
              />
              <span
                className="cursor-pointer truncate"
                onClick={() => {
                  onClose();
                  onTaskClick(task);
                }}
              >
                {task.title}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={() => {
              onClose();
              onAddClick(dateKey);
            }}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          >
            タスクを追加
          </button>
        </div>
      </div>
    </div>
  );
}
