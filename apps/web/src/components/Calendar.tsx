import { useCallback, useEffect, useMemo, useState } from "react";
import { DndContext, type DragEndEvent } from "@dnd-kit/core";
import type { Task } from "../types/task";
import { fetchTasks, updateTask } from "../api/tasks";
import { getCalendarDays, formatDateKey } from "../utils/calendar";
import { CalendarDayCell } from "./CalendarDayCell";
import { TaskFormModal } from "./TaskFormModal";
import { TaskDetailModal } from "./TaskDetailModal";

const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

export function Calendar() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // モーダル状態
  const [addDate, setAddDate] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const refreshTasks = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetchTasks(year, month, controller.signal)
      .then((data) => {
        setTasks(data);
      })
      .catch((e: unknown) => {
        if (e instanceof DOMException && e.name === "AbortError") return;
        setTasks([]);
        setError("タスクの取得に失敗しました");
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [year, month, refreshKey]);

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
    void updateTask(task.id, { status: newStatus })
      .then(() => refreshTasks())
      .catch(() => setError("ステータスの更新に失敗しました"));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const task = active.data.current?.task as Task | undefined;
    if (!task) return;

    const newDate = over.id as string;
    if (task.date === newDate) return;

    void updateTask(task.id, { date: newDate })
      .then(() => refreshTasks())
      .catch(() => setError("タスクの移動に失敗しました"));
  };

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">
          {year}年{month}月
        </h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goToToday}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            今日
          </button>
          <button
            type="button"
            onClick={goToPrevMonth}
            className="rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            ←
          </button>
          <button
            type="button"
            onClick={goToNextMonth}
            className="rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            →
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <DndContext onDragEnd={handleDragEnd}>
        <div
          className={`overflow-hidden rounded-lg border border-gray-200 ${loading ? "opacity-50" : ""}`}
        >
          <div className="grid grid-cols-7">
            {WEEKDAY_LABELS.map((label, i) => (
              <div
                key={label}
                className={`border-b border-gray-200 py-2 text-center text-sm font-medium ${
                  i === 0
                    ? "text-red-500"
                    : i === 6
                      ? "text-blue-500"
                      : "text-gray-600"
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
                  onAddClick={setAddDate}
                  onTaskClick={setSelectedTask}
                  onToggleStatus={handleToggleStatus}
                />
              );
            })}
          </div>
        </div>
      </DndContext>

      {addDate && (
        <TaskFormModal
          date={addDate}
          onClose={() => setAddDate(null)}
          onCreated={() => {
            setAddDate(null);
            refreshTasks();
          }}
        />
      )}

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdated={() => {
            setSelectedTask(null);
            refreshTasks();
          }}
        />
      )}
    </div>
  );
}
