import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  type DropAnimation,
} from "@dnd-kit/core";
import type { Task } from "../types/task";
import { useTasks, useUpdateTask } from "../hooks/useTasks";
import { getCalendarDays, formatDateKey } from "../utils/calendar";
import { CalendarDayCell } from "./CalendarDayCell";
import { TaskFormModal } from "./TaskFormModal";
import { TaskDetailModal } from "./TaskDetailModal";

const WEEKDAY_LABELS = ["月", "火", "水", "木", "金", "土", "日"];

const dropAnimationConfig: DropAnimation = {
  keyframes({ transform }) {
    return [
      {
        opacity: 1,
        transform: `translate(${transform.initial.x}px, ${transform.initial.y}px)`,
      },
      {
        opacity: 0,
        transform: `translate(${transform.initial.x}px, ${transform.initial.y}px)`,
      },
    ];
  },
  duration: 200,
  easing: "ease-out",
  sideEffects: () => () => {},
};

export function Calendar() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
  );

  // ドラッグ状態
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  // モーダル状態
  const [addDate, setAddDate] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  const {
    data: tasks = [],
    isLoading,
    error: queryError,
  } = useTasks(year, month);

  const updateTaskMutation = useUpdateTask(year, month);

  const [mutationError, setMutationError] = useState<string | null>(null);

  const days = useMemo(() => getCalendarDays(year, month), [year, month]);

  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const task of tasks) {
      const key = task.date;
      const list = map.get(key) ?? [];
      list.push(task);
      map.set(key, list);
    }
    return map;
  }, [tasks]);

  const goToPrevMonth = () => {
    if (month === 1) {
      setYear(year - 1);
      setMonth(12);
    } else {
      setMonth(month - 1);
    }
  };

  const goToNextMonth = () => {
    if (month === 12) {
      setYear(year + 1);
      setMonth(1);
    } else {
      setMonth(month + 1);
    }
  };

  const goToToday = () => {
    const today = new Date();
    setYear(today.getFullYear());
    setMonth(today.getMonth() + 1);
  };

  const handleToggleStatus = (task: Task) => {
    const newStatus = task.status === "done" ? "todo" : "done";
    setMutationError(null);
    updateTaskMutation.mutate(
      { id: task.id, data: { status: newStatus } },
      {
        onError: () => setMutationError("ステータスの更新に失敗しました"),
      },
    );
  };

  useEffect(() => {
    if (activeTask) {
      document.body.style.cursor = "grabbing";
      return () => {
        document.body.style.cursor = "";
      };
    }
  }, [activeTask]);

  const handleDragStart = (event: DragStartEvent) => {
    const task = event.active.data.current?.task as Task | undefined;
    setActiveTask(task ?? null);
  };

  const handleDragCancel = () => {
    setActiveTask(null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);

    const { active, over } = event;
    if (!over) return;

    const task = active.data.current?.task as Task | undefined;
    if (!task) return;

    const newDate = over.id as string;
    if (task.date === newDate) return;

    setMutationError(null);
    updateTaskMutation.mutate(
      { id: task.id, data: { date: newDate } },
      {
        onError: () => setMutationError("タスクの移動に失敗しました"),
      },
    );
  };

  const error = queryError ? "タスクの取得に失敗しました" : mutationError;

  return (
    <div className="mx-auto max-w-[1600px]">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-xl font-bold text-on-surface">
          {year}年{month}月
        </h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goToToday}
            className="rounded-md border border-border bg-white px-2 py-1 text-xs text-on-surface-secondary hover:bg-surface-hover"
          >
            今日
          </button>
          <button
            type="button"
            onClick={goToPrevMonth}
            className="rounded-md border border-border bg-white px-2 py-1 text-xs text-on-surface-secondary hover:bg-surface-hover"
          >
            ←
          </button>
          <button
            type="button"
            onClick={goToNextMonth}
            className="rounded-md border border-border bg-white px-2 py-1 text-xs text-on-surface-secondary hover:bg-surface-hover"
          >
            →
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-danger-light px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div
          className={`overflow-hidden rounded-lg border border-border-light ${isLoading ? "opacity-50" : ""}`}
        >
          <div className="grid grid-cols-7">
            {WEEKDAY_LABELS.map((label, i) => (
              <div
                key={label}
                className={`border-b border-border-light py-1 text-center text-sm font-medium ${
                  i === 5
                    ? "text-primary"
                    : i === 6
                      ? "text-danger"
                      : "text-on-surface-secondary"
                }`}
              >
                {label}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {days.map((day) => {
              const key = formatDateKey(day.date);
              return (
                <CalendarDayCell
                  key={key}
                  date={day.date}
                  isCurrentMonth={day.isCurrentMonth}
                  tasks={tasksByDate.get(key) ?? []}
                  isExpanded={expandedDate === key}
                  onAddClick={setAddDate}
                  onTaskClick={setSelectedTask}
                  onToggleStatus={handleToggleStatus}
                  onShowMore={setExpandedDate}
                  onCollapse={() => setExpandedDate(null)}
                />
              );
            })}
          </div>
        </div>
        <DragOverlay dropAnimation={dropAnimationConfig}>
          {activeTask && (
            <div
              className={`flex items-center gap-1 rounded px-1 py-0.5 text-sm shadow-lg scale-105 ${
                activeTask.status === "done"
                  ? "bg-white text-on-surface-muted line-through"
                  : "bg-primary-light text-primary"
              }`}
            >
              <input
                type="checkbox"
                checked={activeTask.status === "done"}
                readOnly
                className="h-3.5 w-3.5 shrink-0"
              />
              <span className="break-all">{activeTask.title}</span>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {addDate && (
        <TaskFormModal
          open
          date={addDate}
          year={year}
          month={month}
          onClose={() => setAddDate(null)}
          onCreated={() => {
            setAddDate(null);
          }}
        />
      )}

      {selectedTask && (
        <TaskDetailModal
          open
          task={selectedTask}
          year={year}
          month={month}
          onClose={() => setSelectedTask(null)}
          onUpdated={() => {
            setSelectedTask(null);
          }}
        />
      )}
    </div>
  );
}
