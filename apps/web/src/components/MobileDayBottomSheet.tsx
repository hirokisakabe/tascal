import { useRef } from "react";
import type { Task } from "../types/task";
import type { Category } from "../types/category";
import { CATEGORY_COLORS } from "../constants/categoryColors";

type Props = {
  date: string | null;
  tasks: Task[];
  categoryMap: Map<string, Category>;
  isOpen: boolean;
  onClose: () => void;
  onTaskClick: (task: Task) => void;
  onToggleStatus: (task: Task) => void;
  onAddClick: (date: string) => void;
};

export function MobileDayBottomSheet({
  date,
  tasks,
  categoryMap,
  isOpen,
  onClose,
  onTaskClick,
  onToggleStatus,
  onAddClick,
}: Props) {
  const touchStartY = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const diff = e.touches[0].clientY - touchStartY.current;
    if (diff > 80) {
      onClose();
    }
  };

  if (!date) return null;

  const displayDate = new Date(`${date}T00:00:00`);
  const monthDay = `${displayDate.getMonth() + 1}月${displayDate.getDate()}日`;

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/30 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />
      <div
        className={`fixed right-0 bottom-0 left-0 z-50 rounded-t-2xl bg-white shadow-xl transition-transform duration-300 ${
          isOpen ? "translate-y-0" : "translate-y-full"
        }`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="bg-border h-1 w-10 rounded-full" />
        </div>
        <div className="border-border-light flex items-center justify-between border-b px-4 py-2">
          <h2 className="text-on-surface text-base font-semibold">
            {monthDay}
          </h2>
          <button
            type="button"
            onClick={() => onAddClick(date)}
            className="bg-primary flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium text-white"
          >
            + タスクを追加
          </button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto px-4 py-3">
          {tasks.length === 0 ? (
            <p className="text-on-surface-muted py-8 text-center text-sm">
              この日のタスクはありません
            </p>
          ) : (
            <div className="space-y-2">
              {tasks.map((task) => {
                const cat = task.categoryId
                  ? (categoryMap.get(task.categoryId) ?? null)
                  : null;
                const bgColor = cat ? CATEGORY_COLORS[cat.color].bg : undefined;
                return (
                  <div
                    key={task.id}
                    className={`flex items-center gap-3 rounded-lg p-3 ${
                      task.status === "done"
                        ? "bg-surface text-on-surface-muted"
                        : bgColor
                          ? "text-on-surface"
                          : "bg-surface text-on-surface"
                    }`}
                    style={
                      task.status !== "done" && bgColor
                        ? { backgroundColor: bgColor }
                        : undefined
                    }
                  >
                    <input
                      type="checkbox"
                      checked={task.status === "done"}
                      onChange={() => onToggleStatus(task)}
                      className="h-4 w-4 shrink-0 cursor-pointer"
                    />
                    <button
                      type="button"
                      onClick={() => onTaskClick(task)}
                      className={`flex-1 text-left text-sm ${task.status === "done" ? "line-through" : ""}`}
                    >
                      {task.title}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="pb-6" />
      </div>
    </>
  );
}
