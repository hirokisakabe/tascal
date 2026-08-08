import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getCalendarDateRange } from "@tascal/shared/calendar";
import type {
  TaskCreateInput,
  TaskUpdateInput,
} from "@tascal/shared/api-contract";

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

export { getCalendarDateRange as getTaskDateRange };

export function useTasks(year: number, month: number, enabled = true) {
  const { startDate, endDate } = getCalendarDateRange(year, month);
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

function useInvalidateTasks() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: taskQueryKeys.all });
}

export function useCreateTask() {
  const invalidateTasks = useInvalidateTasks();
  return useMutation({
    mutationFn: (data: TaskCreateInput) => createTask(data),
    onSuccess: invalidateTasks,
  });
}

export function useUpdateTask() {
  const invalidateTasks = useInvalidateTasks();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: TaskUpdateInput }) =>
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
