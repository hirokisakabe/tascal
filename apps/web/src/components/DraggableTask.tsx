import { useDraggable } from "@dnd-kit/core";
import type { Task } from "../types/task";

type DraggableTaskProps = {
  task: Task;
  onTaskClick: (task: Task) => void;
  onToggleStatus: (task: Task) => void;
};

export function DraggableTask({
  task,
  onTaskClick,
  onToggleStatus,
}: DraggableTaskProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
    data: { task },
  });

  return (
    <div
      ref={setNodeRef}
      className={`flex items-center gap-1 rounded px-1 text-xs ${
        task.status === "done"
          ? "text-gray-400 line-through"
          : "bg-blue-100 text-blue-800"
      } ${isDragging ? "opacity-50" : ""}`}
    >
      <input
        type="checkbox"
        checked={task.status === "done"}
        onChange={() => onToggleStatus(task)}
        onClick={(e) => e.stopPropagation()}
        className="h-3 w-3 shrink-0 cursor-pointer"
      />
      <span
        className="cursor-pointer truncate"
        onClick={() => onTaskClick(task)}
      >
        {task.title}
      </span>
      <span
        className="ml-auto shrink-0 cursor-grab touch-none text-gray-400"
        {...listeners}
        {...attributes}
        aria-label="ドラッグして移動"
      >
        ⠿
      </span>
    </div>
  );
}
