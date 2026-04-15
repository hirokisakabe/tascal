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
import type { Category } from "../types/category";
import { useCategories } from "../hooks/useCategories";
import {
  useTasks,
  useUnscheduledTasks,
  useUpdateTask,
} from "../hooks/useTasks";
import { CATEGORY_COLORS } from "../constants/categoryColors";
import { getCalendarDays, formatDateKey } from "../utils/calendar";
import { CalendarDayCell } from "./CalendarDayCell";
import { TaskFormModal } from "./TaskFormModal";
import { TaskDetailModal } from "./TaskDetailModal";
import {
  UnscheduledTasksSidebar,
  UNSCHEDULED_DROPPABLE_ID,
} from "./UnscheduledTasksSidebar";

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

  // サイドバー状態
  const [showSidebar, setShowSidebar] = useState(false);

  // モーダル状態
  const [addDate, setAddDate] = useState<string | null>(null);
  const [addUnscheduled, setAddUnscheduled] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  const {
    data: tasks = [],
    isLoading,
    error: queryError,
  } = useTasks(year, month);

  const { data: unscheduledTasks = [], error: unscheduledError } =
    useUnscheduledTasks();

  const { data: categories = [] } = useCategories();
  const updateTaskMutation = useUpdateTask(year, month);

  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>();
    for (const cat of categories) {
      map.set(cat.id, cat);
    }
    return map;
  }, [categories]);

  const [mutationError, setMutationError] = useState<string | null>(null);

  const days = useMemo(() => getCalendarDays(year, month), [year, month]);

  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const task of tasks) {
      if (!task.date) continue;
      const list = map.get(task.date) ?? [];
      list.push(task);
      map.set(task.date, list);
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

    const targetId = over.id as string;

    if (targetId === UNSCHEDULED_DROPPABLE_ID) {
      if (task.date === null) return;
      setMutationError(null);
      updateTaskMutation.mutate(
        { id: task.id, data: { date: null } },
        {
          onError: () => setMutationError("タスクの移動に失敗しました"),
        },
      );
      return;
    }

    if (task.date === targetId) return;

    setMutationError(null);
    updateTaskMutation.mutate(
      { id: task.id, data: { date: targetId } },
      {
        onError: () => setMutationError("タスクの移動に失敗しました"),
      },
    );
  };

  const error =
    queryError || unscheduledError
      ? "タスクの取得に失敗しました"
      : mutationError;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="mx-auto max-w-[1600px]">
        {error && (
          <div className="mb-4 rounded-md bg-danger-light px-4 py-3 text-sm text-danger">
            {error}
          </div>
        )}

        <div className="mb-2 flex items-center gap-4">
          <div
            className="shrink-0 overflow-hidden transition-[width] duration-300 ease-in-out"
            style={{ width: showSidebar ? "16rem" : "0px" }}
          />
          <div className="flex min-w-0 flex-1 items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowSidebar(!showSidebar)}
                className="relative rounded-md border border-border bg-white p-1.5 text-on-surface-secondary hover:bg-surface-hover"
                aria-label="未スケジュールタスク"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-4 w-4"
                >
                  <path
                    fillRule="evenodd"
                    d="M6 4.75A.75.75 0 0 1 6.75 4h10.5a.75.75 0 0 1 0 1.5H6.75A.75.75 0 0 1 6 4.75ZM6 10a.75.75 0 0 1 .75-.75h10.5a.75.75 0 0 1 0 1.5H6.75A.75.75 0 0 1 6 10Zm0 5.25a.75.75 0 0 1 .75-.75h10.5a.75.75 0 0 1 0 1.5H6.75a.75.75 0 0 1-.75-.75ZM1.99 4.75a1 1 0 0 1 1-1H3a1 1 0 0 1 1 1v.01a1 1 0 0 1-1 1h-.01a1 1 0 0 1-1-1v-.01ZM1.99 15.25a1 1 0 0 1 1-1H3a1 1 0 0 1 1 1v.01a1 1 0 0 1-1 1h-.01a1 1 0 0 1-1-1v-.01ZM1.99 10a1 1 0 0 1 1-1H3a1 1 0 0 1 1 1v.01a1 1 0 0 1-1 1h-.01a1 1 0 0 1-1-1V10Z"
                    clipRule="evenodd"
                  />
                </svg>
                {unscheduledTasks.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
                    {unscheduledTasks.length}
                  </span>
                )}
              </button>
              <h2 className="text-xl font-bold text-on-surface">
                {year}年{month}月
              </h2>
            </div>
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
        </div>

        <div className="flex items-stretch gap-4">
          <UnscheduledTasksSidebar
            tasks={unscheduledTasks}
            categoryMap={categoryMap}
            isOpen={showSidebar}
            onTaskClick={setSelectedTask}
            onToggleStatus={handleToggleStatus}
            onAddClick={() => setAddUnscheduled(true)}
          />
          <div
            className={`min-w-0 flex-1 overflow-hidden rounded-lg border border-border-light ${isLoading ? "opacity-50" : ""}`}
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
                    categoryMap={categoryMap}
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
        </div>
      </div>
      <DragOverlay dropAnimation={dropAnimationConfig}>
        {activeTask &&
          (() => {
            const cat = activeTask.categoryId
              ? categoryMap.get(activeTask.categoryId)
              : null;
            const bgColor = cat ? CATEGORY_COLORS[cat.color].bg : undefined;
            return (
              <div
                className={`flex items-center gap-1 rounded px-1 py-0.5 text-sm shadow-lg scale-105 ${
                  activeTask.status === "done"
                    ? bgColor
                      ? "text-on-surface/60 line-through"
                      : "bg-white text-on-surface-muted line-through"
                    : bgColor
                      ? "text-on-surface"
                      : "bg-white text-on-surface"
                }`}
                style={bgColor ? { backgroundColor: bgColor } : undefined}
              >
                <input
                  type="checkbox"
                  checked={activeTask.status === "done"}
                  readOnly
                  className="h-3.5 w-3.5 shrink-0"
                />
                <span className="break-all">{activeTask.title}</span>
              </div>
            );
          })()}
      </DragOverlay>

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

      {addUnscheduled && (
        <TaskFormModal
          open
          date={null}
          year={year}
          month={month}
          onClose={() => setAddUnscheduled(false)}
          onCreated={() => {
            setAddUnscheduled(false);
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
    </DndContext>
  );
}
