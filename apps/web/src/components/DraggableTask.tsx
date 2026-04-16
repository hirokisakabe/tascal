import { useDraggable } from "@dnd-kit/core";
import type { Task } from "../types/task";
import type { Category } from "../types/category";
import { CATEGORY_COLORS } from "../constants/categoryColors";

type DraggableTaskProps = {
  task: Task;
  category: Category | null;
  onTaskClick: (task: Task) => void;
  onToggleStatus: (task: Task) => void;
};

export function DraggableTask({
  task,
  category,
  onTaskClick,
  onToggleStatus,
}: DraggableTaskProps) {
  const categoryBg = category ? CATEGORY_COLORS[category.color].bg : null;
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
    data: { task },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={(e) => {
        e.stopPropagation();
        onTaskClick(task);
      }}
      className={`flex items-center gap-1 rounded px-1 py-0 text-xs leading-tight h-[2rem] touch-none ${isDragging ? "cursor-grabbing" : "cursor-pointer"} ${
        isDragging
          ? "border border-dashed border-border bg-surface text-transparent [&_input]:invisible"
          : task.status === "done"
            ? categoryBg
              ? "text-on-surface/60 line-through"
              : "border border-border text-on-surface-muted line-through"
            : categoryBg
              ? "text-on-surface"
              : "border border-border bg-white text-on-surface"
      }`}
      style={
        !isDragging && categoryBg ? { backgroundColor: categoryBg } : undefined
      }
    >
      <input
        type="checkbox"
        checked={task.status === "done"}
        onChange={() => onToggleStatus(task)}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        className="h-3.5 w-3.5 shrink-0 cursor-pointer"
      />
      <span className="break-all line-clamp-2">{task.title}</span>
    </div>
  );
}
