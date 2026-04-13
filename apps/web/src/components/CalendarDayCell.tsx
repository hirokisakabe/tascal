import { useDroppable } from "@dnd-kit/core";
import type { Task } from "../types/task";
import type { Category } from "../types/category";
import { isToday, isPast, formatDateKey } from "../utils/calendar";
import { DraggableTask } from "./DraggableTask";

const MAX_VISIBLE_TASKS = 4;

type CalendarDayCellProps = {
  date: Date;
  isCurrentMonth: boolean;
  tasks: Task[];
  categoryMap: Map<string, Category>;
  isExpanded: boolean;
  onAddClick: (dateKey: string) => void;
  onTaskClick: (task: Task) => void;
  onToggleStatus: (task: Task) => void;
  onShowMore: (dateKey: string) => void;
  onCollapse: () => void;
};

export function CalendarDayCell({
  date,
  isCurrentMonth,
  tasks,
  categoryMap,
  isExpanded,
  onAddClick,
  onTaskClick,
  onToggleStatus,
  onShowMore,
  onCollapse,
}: CalendarDayCellProps) {
  const today = isToday(date);
  const past = isCurrentMonth && isPast(date);
  const dateKey = formatDateKey(date);
  const visibleTasks = isExpanded ? tasks : tasks.slice(0, MAX_VISIBLE_TASKS);
  const remainingCount = tasks.length - MAX_VISIBLE_TASKS;
  const { setNodeRef, isOver } = useDroppable({ id: dateKey });

  return (
    <div
      ref={setNodeRef}
      role="button"
      tabIndex={0}
      onClick={() => onAddClick(dateKey)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onAddClick(dateKey);
        }
      }}
      aria-label={`${dateKey}にタスクを追加`}
      className={`group relative min-h-40 cursor-pointer border-[0.5px] border-border-light p-1.5 ${
        !isCurrentMonth ? "bg-surface" : "bg-white"
      } ${isOver ? "bg-primary-lighter ring-2 ring-primary-muted ring-inset" : isExpanded ? "" : ""}`}
    >
      <div className="mb-1 flex items-center">
        <span
          className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm ${
            today
              ? "bg-primary font-bold text-white"
              : !isCurrentMonth
                ? "text-on-surface-muted"
                : past
                  ? "text-on-surface-muted"
                  : "text-on-surface"
          }`}
        >
          {date.getDate()}
        </span>
      </div>
      <div className="space-y-1">
        {visibleTasks.map((task) => (
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
        {!isExpanded && remainingCount > 0 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onShowMore(dateKey);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.stopPropagation();
              }
            }}
            className="w-full cursor-pointer rounded px-1 text-left text-xs text-on-surface-muted hover:bg-surface-hover hover:text-on-surface-secondary"
          >
            +{remainingCount} 件
          </button>
        )}
        {isExpanded && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onCollapse();
            }}
            className="w-full cursor-pointer rounded px-1 text-center text-xs text-on-surface-muted hover:bg-surface-hover hover:text-on-surface-secondary"
          >
            折りたたむ
          </button>
        )}
      </div>
    </div>
  );
}
