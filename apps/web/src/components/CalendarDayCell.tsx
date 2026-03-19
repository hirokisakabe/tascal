import type { Task } from "../types/task";
import { isToday } from "../utils/calendar";

const MAX_VISIBLE_TASKS = 3;

type CalendarDayCellProps = {
  date: Date;
  isCurrentMonth: boolean;
  tasks: Task[];
};

export function CalendarDayCell({
  date,
  isCurrentMonth,
  tasks,
}: CalendarDayCellProps) {
  const today = isToday(date);
  const visibleTasks = tasks.slice(0, MAX_VISIBLE_TASKS);
  const remainingCount = tasks.length - MAX_VISIBLE_TASKS;

  return (
    <div
      className={`min-h-24 border border-gray-200 p-1 ${
        !isCurrentMonth ? "bg-gray-50" : "bg-white"
      }`}
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
          <div
            key={task.id}
            className={`truncate rounded px-1 text-xs ${
              task.status === "done"
                ? "text-gray-400 line-through"
                : "bg-blue-100 text-blue-800"
            }`}
          >
            {task.title}
          </div>
        ))}
        {remainingCount > 0 && (
          <div className="px-1 text-xs text-gray-500">+{remainingCount} 件</div>
        )}
      </div>
    </div>
  );
}
