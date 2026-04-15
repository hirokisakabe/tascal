import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import type { Task } from "../types/task";
import type { Category } from "../types/category";
import { DraggableTask } from "./DraggableTask";

type UnscheduledTasksSidebarProps = {
  tasks: Task[];
  categoryMap: Map<string, Category>;
  onTaskClick: (task: Task) => void;
  onToggleStatus: (task: Task) => void;
  onAddClick: () => void;
};

const DROPPABLE_ID = "unscheduled";

export { DROPPABLE_ID as UNSCHEDULED_DROPPABLE_ID };

export function UnscheduledTasksSidebar({
  tasks,
  categoryMap,
  onTaskClick,
  onToggleStatus,
  onAddClick,
}: UnscheduledTasksSidebarProps) {
  const [isOpen, setIsOpen] = useState(true);
  const { setNodeRef, isOver } = useDroppable({ id: DROPPABLE_ID });

  return (
    <div className="flex h-full w-64 shrink-0 flex-col border-r border-border-light bg-white">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between border-b border-border-light px-3 py-2 text-sm font-medium text-on-surface hover:bg-surface-hover"
      >
        <span className="flex items-center gap-2">
          未スケジュール
          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-on-surface-muted/20 px-1.5 text-xs font-medium text-on-surface-secondary">
            {tasks.length}
          </span>
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`h-4 w-4 text-on-surface-muted transition-transform ${isOpen ? "rotate-180" : ""}`}
        >
          <path
            fillRule="evenodd"
            d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      {isOpen && (
        <div
          ref={setNodeRef}
          className={`flex-1 overflow-y-auto p-2 ${isOver ? "bg-primary-lighter ring-2 ring-primary-muted ring-inset" : ""}`}
        >
          <div className="space-y-1">
            {tasks.map((task) => (
              <DraggableTask
                key={task.id}
                task={task}
                category={
                  task.categoryId
                    ? (categoryMap.get(task.categoryId) ?? null)
                    : null
                }
                onTaskClick={onTaskClick}
                onToggleStatus={onToggleStatus}
              />
            ))}
            {tasks.length === 0 && (
              <p className="px-1 py-2 text-center text-xs text-on-surface-muted">
                未スケジュールタスクはありません
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onAddClick}
            className="mt-2 w-full rounded-md border border-dashed border-border px-2 py-1.5 text-xs text-on-surface-muted hover:border-primary hover:text-primary"
          >
            + タスクを追加
          </button>
        </div>
      )}
    </div>
  );
}
