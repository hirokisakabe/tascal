import { useDroppable } from "@dnd-kit/core";
import type { Task } from "../types/task";
import { isToday, formatDateKey } from "../utils/calendar";
import { DraggableTask } from "./DraggableTask";

const MAX_VISIBLE_TASKS = 3;

type CalendarDayCellProps = {
  date: Date;
  isCurrentMonth: boolean;
  tasks: Task[];
  onAddClick: (dateKey: string) => void;
  onTaskClick: (task: Task) => void;
  onToggleStatus: (task: Task) => void;
  onShowMore: (dateKey: string) => void;
};

export function CalendarDayCell({
  date,
  isCurrentMonth,
  tasks,
  onAddClick,
  onTaskClick,
  onToggleStatus,
  onShowMore,
}: CalendarDayCellProps) {
  const today = isToday(date);
  const dateKey = formatDateKey(date);
  const visibleTasks = tasks.slice(0, MAX_VISIBLE_TASKS);
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
      className={`group relative min-h-32 cursor-pointer border border-gray-200 p-1.5 ${
        !isCurrentMonth ? "bg-gray-50" : "bg-white"
      } ${isOver ? "bg-blue-50" : ""}`}
    >
      <div className="mb-1 flex items-center justify-center">
        <span
          className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm ${
            today
              ? "bg-blue-600 font-bold text-white"
              : isCurrentMonth
                ? "text-gray-900"
                : "text-gray-400"
          }`}
        >
          {date.getDate()}
        </span>
      </div>
      <div className="space-y-0.5">
        {visibleTasks.map((task) => (
          <DraggableTask
            key={task.id}
            task={task}
            onTaskClick={onTaskClick}
            onToggleStatus={onToggleStatus}
          />
        ))}
        {remainingCount > 0 && (
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
            className="w-full cursor-pointer rounded px-1 text-left text-xs text-gray-500 hover:bg-gray-100 hover:text-gray-700"
          >
            +{remainingCount} 件
          </button>
        )}
      </div>
    </div>
  );
}
