import { useEffect, useRef } from "react";
import { useDroppable } from "@dnd-kit/core";
import type { Task } from "../types/task";
import { isToday, formatDateKey } from "../utils/calendar";
import { DraggableTask } from "./DraggableTask";

const MAX_VISIBLE_TASKS = 4;

type CalendarDayCellProps = {
  date: Date;
  isCurrentMonth: boolean;
  tasks: Task[];
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
  isExpanded,
  onAddClick,
  onTaskClick,
  onToggleStatus,
  onShowMore,
  onCollapse,
}: CalendarDayCellProps) {
  const today = isToday(date);
  const dateKey = formatDateKey(date);
  const visibleTasks = isExpanded ? tasks : tasks.slice(0, MAX_VISIBLE_TASKS);
  const remainingCount = tasks.length - MAX_VISIBLE_TASKS;
  const cellRef = useRef<HTMLDivElement>(null);

  const { setNodeRef, isOver } = useDroppable({ id: dateKey });

  useEffect(() => {
    if (!isExpanded) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (cellRef.current && !cellRef.current.contains(e.target as Node)) {
        onCollapse();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isExpanded, onCollapse]);

  const setRefs = (node: HTMLDivElement | null) => {
    setNodeRef(node);
    (cellRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
  };

  return (
    <div
      ref={setRefs}
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
      className={`group relative min-h-40 cursor-pointer border-[0.5px] border-gray-200 p-1.5 ${
        !isCurrentMonth ? "bg-gray-50" : "bg-white"
      } ${isOver ? "bg-blue-50 ring-2 ring-blue-400 ring-inset" : isExpanded ? "z-10 shadow-lg ring-2 ring-blue-300" : ""}`}
    >
      <div className="mb-1 flex items-center">
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
      <div className="space-y-1">
        {visibleTasks.map((task) => (
          <DraggableTask
            key={task.id}
            task={task}
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
            className="w-full cursor-pointer rounded px-1 text-left text-xs text-gray-500 hover:bg-gray-100 hover:text-gray-700"
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
            className="w-full cursor-pointer rounded px-1 text-center text-xs text-gray-500 hover:bg-gray-100 hover:text-gray-700"
          >
            折りたたむ
          </button>
        )}
      </div>
    </div>
  );
}
