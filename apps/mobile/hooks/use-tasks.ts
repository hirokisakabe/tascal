import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createTask,
  deleteTask,
  fetchTasksRange,
  fetchUnscheduledTasks,
  updateTask,
} from "@/api/tasks";

export const taskQueryKeys = {
  all: ["tasks"] as const,
  range: (startDate: string, endDate: string) =>
    ["tasks", "range", startDate, endDate] as const,
  unscheduled: ["tasks", "unscheduled"] as const,
};

function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getTaskDateRange(year: number, month: number) {
  const firstDay = new Date(year, month - 1, 1);
  const mondayOffset = (firstDay.getDay() + 6) % 7;
  const start = new Date(year, month - 1, 1 - mondayOffset);
  const end = new Date(
    start.getFullYear(),
    start.getMonth(),
    start.getDate() + 41,
  );
  return { startDate: formatDateKey(start), endDate: formatDateKey(end) };
}

export function useTasks(year: number, month: number, enabled = true) {
  const { startDate, endDate } = getTaskDateRange(year, month);
  return useQuery({
    enabled,
    queryKey: taskQueryKeys.range(startDate, endDate),
    queryFn: ({ signal }) => fetchTasksRange(startDate, endDate, signal),
  });
}

export function useUnscheduledTasks(enabled = true) {
  return useQuery({
    enabled,
    queryKey: taskQueryKeys.unscheduled,
    queryFn: ({ signal }) => fetchUnscheduledTasks(signal),
  });
}

type TaskInput = {
  title: string;
  description?: string | null;
  date?: string | null;
  status?: "todo" | "done";
};

type TaskUpdate = Omit<Partial<TaskInput>, "title"> & {
  title?: string;
};

function useInvalidateTasks() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: taskQueryKeys.all });
}

export function useCreateTask() {
  const invalidateTasks = useInvalidateTasks();
  return useMutation({
    mutationFn: (data: TaskInput) => createTask(data),
    onSuccess: invalidateTasks,
  });
}

export function useUpdateTask() {
  const invalidateTasks = useInvalidateTasks();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: TaskUpdate }) =>
      updateTask(id, data),
    onSuccess: invalidateTasks,
  });
}

export function useDeleteTask() {
  const invalidateTasks = useInvalidateTasks();
  return useMutation({
    mutationFn: (id: string) => deleteTask(id),
    onSuccess: invalidateTasks,
  });
}
