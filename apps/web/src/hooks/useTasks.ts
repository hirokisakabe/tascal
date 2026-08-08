import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCalendarDateRange } from "@tascal/shared/calendar";
import type {
  TaskCreateInput,
  TaskUpdateInput,
} from "@tascal/shared/api-contract";
import { toast } from "sonner";
import type { Task } from "../types/task";
import {
  fetchTasks,
  fetchUnscheduledTasks,
  createTask,
  updateTask,
  deleteTask,
} from "../api/tasks";

function tasksQueryKey(startDate: string, endDate: string) {
  return ["tasks", "range", startDate, endDate] as const;
}

const unscheduledTasksQueryKey = ["tasks", "unscheduled"] as const;

export function useTasks(year: number, month: number) {
  const { startDate, endDate } = getCalendarDateRange(year, month);

  return useQuery({
    queryKey: tasksQueryKey(startDate, endDate),
    queryFn: ({ signal }) => fetchTasks(startDate, endDate, signal),
  });
}

export function useUnscheduledTasks() {
  return useQuery({
    queryKey: unscheduledTasksQueryKey,
    queryFn: ({ signal }) => fetchUnscheduledTasks(signal),
  });
}

export function useCreateTask(year: number, month: number) {
  const queryClient = useQueryClient();
  const { startDate, endDate } = getCalendarDateRange(year, month);
  const key = tasksQueryKey(startDate, endDate);

  return useMutation({
    mutationFn: (data: TaskCreateInput) => createTask(data),
    onMutate: async (newTask) => {
      const targetKey = newTask.date ? key : unscheduledTasksQueryKey;
      await queryClient.cancelQueries({ queryKey: targetKey });
      const previous = queryClient.getQueryData<Task[]>(targetKey);

      queryClient.setQueryData<Task[]>(targetKey, (old) => [
        ...(old ?? []),
        {
          id: `temp-${Date.now()}`,
          title: newTask.title,
          description: newTask.description ?? null,
          date: newTask.date ?? null,
          status: newTask.status ?? "todo",
          categoryId: newTask.categoryId ?? null,
          userId: "",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]);

      return { previous, targetKey };
    },
    onError: (_err, _variables, context) => {
      if (context) {
        queryClient.setQueryData(context.targetKey, context.previous);
      }
      toast.error("タスクの作成に失敗しました");
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useUpdateTask(year: number, month: number) {
  const queryClient = useQueryClient();
  const { startDate, endDate } = getCalendarDateRange(year, month);
  const key = tasksQueryKey(startDate, endDate);

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: TaskUpdateInput }) =>
      updateTask(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Task[]>(key);

      queryClient.setQueryData<Task[]>(key, (old) =>
        (old ?? []).map((task) =>
          task.id === id ? { ...task, ...data } : task,
        ),
      );

      return { previous };
    },
    onError: (_err, _variables, context) => {
      if (context) {
        queryClient.setQueryData(key, context.previous);
      }
      toast.error("タスクの更新に失敗しました");
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useDeleteTask(year: number, month: number) {
  const queryClient = useQueryClient();
  const { startDate, endDate } = getCalendarDateRange(year, month);
  const key = tasksQueryKey(startDate, endDate);

  return useMutation({
    mutationFn: (id: string) => deleteTask(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Task[]>(key);
      const deletedTask = previous?.find((task) => task.id === id);

      queryClient.setQueryData<Task[]>(key, (old) =>
        (old ?? []).filter((task) => task.id !== id),
      );

      return { previous, deletedTask };
    },
    onSuccess: (_data, _id, context) => {
      if (context?.deletedTask) {
        const { deletedTask } = context;
        let undone = false;
        toast("タスクを削除しました", {
          action: {
            label: "元に戻す",
            onClick: () => {
              if (undone) return;
              undone = true;
              createTask({
                title: deletedTask.title,
                description: deletedTask.description,
                date: deletedTask.date,
                status: deletedTask.status,
                categoryId: deletedTask.categoryId,
              })
                .then(() => {
                  void queryClient.invalidateQueries({
                    queryKey: ["tasks"],
                  });
                })
                .catch(() => {
                  toast.error("タスクの復元に失敗しました");
                });
            },
          },
          duration: 5000,
        });
      }
    },
    onError: (_err, _variables, context) => {
      if (context) {
        queryClient.setQueryData(key, context.previous);
      }
      toast.error("タスクの削除に失敗しました");
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}
