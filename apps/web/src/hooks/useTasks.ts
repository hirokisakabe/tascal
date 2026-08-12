import {
  keepPreviousData,
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import type { QueryClient } from "@tanstack/react-query";
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
type TaskUpdateCoordinator = {
  activeCount: number;
  locks: Map<string, Promise<void>>;
};
type TaskUpdateRegistration = {
  coordinator: TaskUpdateCoordinator;
  id: string;
  releaseLock: () => void;
  released: boolean;
  tail: Promise<void>;
};
type TaskSnapshot = {
  hadData: boolean;
  index: number;
  task: Task | undefined;
};
const taskUpdateCoordinators = new WeakMap<
  QueryClient,
  TaskUpdateCoordinator
>();

function releaseTaskUpdate(
  queryClient: QueryClient,
  registration: TaskUpdateRegistration,
) {
  if (registration.released) return;
  registration.released = true;
  registration.releaseLock();

  const { coordinator, id, tail } = registration;
  if (coordinator.locks.get(id) === tail) {
    coordinator.locks.delete(id);
  }
  coordinator.activeCount -= 1;

  if (coordinator.activeCount === 0) {
    taskUpdateCoordinators.delete(queryClient);
    return queryClient.invalidateQueries({ queryKey: ["tasks"] });
  }
}

export function useTasks(year: number, month: number) {
  const { startDate, endDate } = getCalendarDateRange(year, month);

  return useQuery({
    queryKey: tasksQueryKey(startDate, endDate),
    queryFn: ({ signal }) => fetchTasks(startDate, endDate, signal),
    placeholderData: keepPreviousData,
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

  const isInCurrentRange = (date: string | null) =>
    date !== null && startDate <= date && date <= endDate;

  const snapshotTask = (tasks: Task[] | undefined, id: string) => {
    const index = tasks?.findIndex((task) => task.id === id) ?? -1;
    return {
      hadData: tasks !== undefined,
      index,
      task: index >= 0 ? tasks?.[index] : undefined,
    };
  };

  const restoreTask = (
    queryKey: readonly string[],
    id: string,
    snapshot: TaskSnapshot,
  ) => {
    queryClient.setQueryData<Task[]>(queryKey, (current) => {
      const tasks = (current ?? []).filter((task) => task.id !== id);
      if (!snapshot.task) return tasks;

      const index = Math.min(snapshot.index, tasks.length);
      return [...tasks.slice(0, index), snapshot.task, ...tasks.slice(index)];
    });

    if (
      !snapshot.hadData &&
      queryClient.getQueryData<Task[]>(queryKey)?.length === 0
    ) {
      queryClient.removeQueries({ queryKey, exact: true });
    }
  };

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: TaskUpdateInput }) =>
      updateTask(id, data),
    onMutate: async ({ id, data }) => {
      const coordinator = taskUpdateCoordinators.get(queryClient) ?? {
        activeCount: 0,
        locks: new Map<string, Promise<void>>(),
      };
      coordinator.activeCount += 1;
      taskUpdateCoordinators.set(queryClient, coordinator);

      const previous = coordinator.locks.get(id) ?? Promise.resolve();
      let release!: () => void;
      const current = new Promise<void>((resolve) => {
        release = resolve;
      });
      const tail = previous.then(() => current);
      coordinator.locks.set(id, tail);
      const registration: TaskUpdateRegistration = {
        coordinator,
        id,
        releaseLock: release,
        released: false,
        tail,
      };
      let previousTask: TaskSnapshot | undefined;
      let previousUnscheduledTask: TaskSnapshot | undefined;

      try {
        await previous;
        await Promise.all([
          queryClient.cancelQueries({ queryKey: key }),
          queryClient.cancelQueries({ queryKey: unscheduledTasksQueryKey }),
        ]);

        const previousTasks = queryClient.getQueryData<Task[]>(key);
        const previousUnscheduledTasks = queryClient.getQueryData<Task[]>(
          unscheduledTasksQueryKey,
        );
        const task = [
          ...(previousTasks ?? []),
          ...(previousUnscheduledTasks ?? []),
        ].find((candidate) => candidate.id === id);
        previousTask = snapshotTask(previousTasks, id);
        previousUnscheduledTask = snapshotTask(previousUnscheduledTasks, id);

        if (task && data.date !== undefined) {
          const updatedTask = { ...task, ...data };
          const removeUpdatedTask = (tasks: Task[] | undefined) =>
            (tasks ?? []).filter((candidate) => candidate.id !== id);

          queryClient.setQueryData<Task[]>(key, (old) => {
            const tasks = removeUpdatedTask(old);
            return isInCurrentRange(updatedTask.date)
              ? [...tasks, updatedTask]
              : tasks;
          });
          queryClient.setQueryData<Task[]>(unscheduledTasksQueryKey, (old) => {
            const tasks = removeUpdatedTask(old);
            return updatedTask.date ? tasks : [...tasks, updatedTask];
          });
        } else {
          const applyUpdate = (tasks: Task[] | undefined) =>
            tasks?.map((candidate) =>
              candidate.id === id ? { ...candidate, ...data } : candidate,
            ) ?? tasks;

          queryClient.setQueryData<Task[]>(key, applyUpdate);
          queryClient.setQueryData<Task[]>(
            unscheduledTasksQueryKey,
            applyUpdate,
          );
        }

        return { previousTask, previousUnscheduledTask, registration };
      } catch (error) {
        if (previousTask && previousUnscheduledTask) {
          try {
            restoreTask(key, id, previousTask);
          } catch {
            // Continue restoring the other cache and preserve the original error.
          }
          try {
            restoreTask(unscheduledTasksQueryKey, id, previousUnscheduledTask);
          } catch {
            // Preserve the original onMutate error after best-effort rollback.
          }
        }
        try {
          await releaseTaskUpdate(queryClient, registration);
        } catch {
          // Preserve the original onMutate error if final invalidation fails.
        }
        throw error;
      }
    },
    onError: (_err, { id }, context) => {
      if (context) {
        try {
          restoreTask(key, id, context.previousTask);
        } catch {
          // Keep the mutation error and continue restoring the other cache.
        }
        try {
          restoreTask(
            unscheduledTasksQueryKey,
            id,
            context.previousUnscheduledTask,
          );
        } catch {
          // Keep the mutation error so onSettled can release the coordinator.
        }
      }
      toast.error("タスクの更新に失敗しました");
    },
    onSettled: (_data, _error, _variables, context) =>
      context
        ? releaseTaskUpdate(queryClient, context.registration)
        : undefined,
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
