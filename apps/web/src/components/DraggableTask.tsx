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
      {...listeners}
      {...attributes}
      onClick={(e) => e.stopPropagation()}
      className={`flex items-center gap-1 rounded px-1 py-0.5 text-sm touch-none ${isDragging ? "cursor-grabbing" : "cursor-grab"} ${
        isDragging
          ? "border border-dashed border-gray-300 bg-gray-100 text-transparent [&_input]:invisible"
          : task.status === "done"
            ? "text-gray-400 line-through"
            : "bg-blue-100 text-blue-800"
      }`}
    >
      <input
        type="checkbox"
        checked={task.status === "done"}
        onChange={() => onToggleStatus(task)}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        className="h-3.5 w-3.5 shrink-0 cursor-pointer"
      />
      <span
        className="cursor-pointer truncate"
        onClick={() => onTaskClick(task)}
      >
        {task.title}
      </span>
    </div>
  );
}
