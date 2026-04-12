import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Task } from "../types/task";
import { fetchTasks, createTask, updateTask, deleteTask } from "../api/tasks";

function tasksQueryKey(year: number, month: number) {
  return ["tasks", year, month] as const;
}

export function useTasks(year: number, month: number) {
  return useQuery({
    queryKey: tasksQueryKey(year, month),
    queryFn: ({ signal }) => fetchTasks(year, month, signal),
  });
}

export function useCreateTask(year: number, month: number) {
  const queryClient = useQueryClient();
  const key = tasksQueryKey(year, month);

  return useMutation({
    mutationFn: (data: {
      title: string;
      description?: string | null;
      date: string;
      status?: "todo" | "done";
      categoryId?: string | null;
    }) => createTask(data),
    onMutate: async (newTask) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Task[]>(key);

      queryClient.setQueryData<Task[]>(key, (old) => [
        ...(old ?? []),
        {
          id: `temp-${Date.now()}`,
          title: newTask.title,
          description: newTask.description ?? null,
          date: newTask.date,
          status: newTask.status ?? "todo",
          categoryId: newTask.categoryId ?? null,
          userId: "",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]);

      return { previous };
    },
    onError: (_err, _variables, context) => {
      if (context) {
        queryClient.setQueryData(key, context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: key });
    },
  });
}

export function useUpdateTask(year: number, month: number) {
  const queryClient = useQueryClient();
  const key = tasksQueryKey(year, month);

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: {
        title?: string;
        description?: string | null;
        date?: string;
        status?: "todo" | "done";
        categoryId?: string | null;
      };
    }) => updateTask(id, data),
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
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: key });
    },
  });
}

export function useDeleteTask(year: number, month: number) {
  const queryClient = useQueryClient();
  const key = tasksQueryKey(year, month);

  return useMutation({
    mutationFn: (id: string) => deleteTask(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Task[]>(key);

      queryClient.setQueryData<Task[]>(key, (old) =>
        (old ?? []).filter((task) => task.id !== id),
      );

      return { previous };
    },
    onError: (_err, _variables, context) => {
      if (context) {
        queryClient.setQueryData(key, context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: key });
    },
  });
}
