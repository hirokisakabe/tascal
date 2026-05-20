import { useDroppable } from "@dnd-kit/core";
import type { Task } from "../types/task";
import type { Category } from "../types/category";
import { DraggableTask } from "./DraggableTask";

type UnscheduledTasksSidebarProps = {
  tasks: Task[];
  categoryMap: Map<string, Category>;
  isOpen: boolean;
  onClose: () => void;
  onTaskClick: (task: Task) => void;
  onToggleStatus: (task: Task) => void;
  onAddClick: () => void;
};

const DROPPABLE_ID = "unscheduled";

export { DROPPABLE_ID as UNSCHEDULED_DROPPABLE_ID };

export function UnscheduledTasksSidebar({
  tasks,
  categoryMap,
  isOpen,
  onClose,
  onTaskClick,
  onToggleStatus,
  onAddClick,
}: UnscheduledTasksSidebarProps) {
  const { setNodeRef, isOver } = useDroppable({ id: DROPPABLE_ID });

  const innerContent = (
    <div className="flex h-full w-64 flex-col overflow-hidden rounded-lg border border-border-light bg-white">
      <div className="border-b border-border-light px-3 py-1 text-sm font-medium text-on-surface">
        未スケジュール
        <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-on-surface-muted/20 px-1.5 text-xs font-medium text-on-surface-secondary">
          {tasks.length}
        </span>
      </div>
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
    </div>
  );

  return (
    <>
      {/* デスクトップ: サイドバー */}
      <div
        className="hidden shrink-0 self-stretch overflow-hidden transition-[width] duration-300 ease-in-out sm:block"
        style={{ width: isOpen ? "16rem" : "0px" }}
      >
        {innerContent}
      </div>

      {/* モバイル: オーバーレイ */}
      <div
        className={`fixed inset-0 z-40 sm:hidden ${isOpen ? "pointer-events-auto" : "pointer-events-none"}`}
      >
        <div
          className={`absolute inset-0 bg-black/30 transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0"}`}
          onClick={onClose}
        />
        <div
          className={`absolute top-0 bottom-0 left-0 w-64 shadow-xl transition-transform duration-300 ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
        >
          {innerContent}
        </div>
      </div>
    </>
  );
}
