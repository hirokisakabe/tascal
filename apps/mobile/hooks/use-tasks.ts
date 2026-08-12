import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { getCalendarDateRange } from "@tascal/shared/calendar";
import type {
  Task,
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

type TaskSnapshot = {
  hadData: boolean;
  index: number;
  task: Task | undefined;
};

type MutationCoordinator = {
  activeCount: number;
  locks: Map<string, Promise<void>>;
};

type MutationRegistration = {
  coordinator: MutationCoordinator;
  lockKey: string;
  releaseLock: () => void;
  released: boolean;
  tail: Promise<void>;
};

const mutationCoordinators = new WeakMap<QueryClient, MutationCoordinator>();
const OPTIMISTIC_TASK_ID_PREFIX = "optimistic-";
let optimisticTaskSequence = 0;

export function isOptimisticTaskId(id: string) {
  return id.startsWith(OPTIMISTIC_TASK_ID_PREFIX);
}

function registerMutation(
  queryClient: QueryClient,
  lockKey: string,
): { previous: Promise<void>; registration: MutationRegistration } {
  const coordinator = mutationCoordinators.get(queryClient) ?? {
    activeCount: 0,
    locks: new Map<string, Promise<void>>(),
  };
  coordinator.activeCount += 1;
  mutationCoordinators.set(queryClient, coordinator);

  const previous = coordinator.locks.get(lockKey) ?? Promise.resolve();
  let releaseLock!: () => void;
  const current = new Promise<void>((resolve) => {
    releaseLock = resolve;
  });
  const tail = previous.then(() => current);
  coordinator.locks.set(lockKey, tail);

  return {
    previous,
    registration: {
      coordinator,
      lockKey,
      releaseLock,
      released: false,
      tail,
    },
  };
}

function releaseMutation(
  queryClient: QueryClient,
  registration: MutationRegistration,
) {
  if (registration.released) return;
  registration.released = true;
  registration.releaseLock();

  const { coordinator, lockKey, tail } = registration;
  if (coordinator.locks.get(lockKey) === tail) {
    coordinator.locks.delete(lockKey);
  }
  coordinator.activeCount -= 1;

  if (coordinator.activeCount === 0) {
    mutationCoordinators.delete(queryClient);
    return queryClient.invalidateQueries({ queryKey: taskQueryKeys.all });
  }
}

function snapshotTask(tasks: Task[] | undefined, id: string): TaskSnapshot {
  const index = tasks?.findIndex((task) => task.id === id) ?? -1;
  return {
    hadData: tasks !== undefined,
    index,
    task: index >= 0 ? tasks?.[index] : undefined,
  };
}

function restoreTask(
  queryClient: QueryClient,
  queryKey: readonly string[],
  id: string,
  snapshot: TaskSnapshot,
) {
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
}

function restoreTaskCaches(
  queryClient: QueryClient,
  rangeKey: readonly string[],
  id: string,
  rangeSnapshot: TaskSnapshot,
  unscheduledSnapshot: TaskSnapshot,
) {
  try {
    restoreTask(queryClient, rangeKey, id, rangeSnapshot);
  } catch {
    // Preserve the mutation error and continue restoring the other cache.
  }
  try {
    restoreTask(
      queryClient,
      taskQueryKeys.unscheduled,
      id,
      unscheduledSnapshot,
    );
  } catch {
    // Rollback is best effort so the original mutation error is retained.
  }
}

function removeTask(tasks: Task[] | undefined, id: string) {
  return (tasks ?? []).filter((task) => task.id !== id);
}

function placeTask(
  queryClient: QueryClient,
  rangeKey: readonly string[],
  isInCurrentRange: (date: string | null) => boolean,
  task: Task,
  replacedId = task.id,
) {
  const placeInCache = (current: Task[] | undefined, belongs: boolean) => {
    const currentTasks = current ?? [];
    const replacedIndex = currentTasks.findIndex(
      (candidate) => candidate.id === replacedId || candidate.id === task.id,
    );
    const tasks = currentTasks.filter(
      (candidate) => candidate.id !== replacedId && candidate.id !== task.id,
    );
    if (!belongs) return tasks;

    const index = replacedIndex < 0 ? tasks.length : replacedIndex;
    return [...tasks.slice(0, index), task, ...tasks.slice(index)];
  };

  queryClient.setQueryData<Task[]>(rangeKey, (current) => {
    return placeInCache(current, isInCurrentRange(task.date));
  });
  queryClient.setQueryData<Task[]>(taskQueryKeys.unscheduled, (current) => {
    return placeInCache(current, task.date === null);
  });
}

function useTaskMutationScope(year: number, month: number) {
  const queryClient = useQueryClient();
  const { startDate, endDate } = getCalendarDateRange(year, month);
  return {
    queryClient,
    rangeKey: taskQueryKeys.range(startDate, endDate),
    isInCurrentRange: (date: string | null) =>
      date !== null && startDate <= date && date <= endDate,
  };
}

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

export function useCreateTask(year: number, month: number) {
  const { queryClient, rangeKey, isInCurrentRange } = useTaskMutationScope(
    year,
    month,
  );

  return useMutation({
    mutationFn: (data: TaskCreateInput) => createTask(data),
    onMutate: async (data) => {
      const optimisticId = `${OPTIMISTIC_TASK_ID_PREFIX}${Date.now()}-${optimisticTaskSequence++}`;
      const { previous, registration } = registerMutation(
        queryClient,
        optimisticId,
      );
      const optimisticDate = data.date ?? null;
      const targetKey =
        optimisticDate === null ? taskQueryKeys.unscheduled : rangeKey;
      let snapshot: TaskSnapshot | undefined;

      try {
        await previous;
        await queryClient.cancelQueries({ queryKey: targetKey });
        snapshot = snapshotTask(
          queryClient.getQueryData<Task[]>(targetKey),
          optimisticId,
        );

        const now = new Date().toISOString();
        const optimisticTask: Task = {
          id: optimisticId,
          userId: "",
          title: data.title,
          description: data.description ?? null,
          date: optimisticDate,
          status: data.status ?? "todo",
          categoryId: data.categoryId ?? null,
          createdAt: now,
          updatedAt: now,
        };
        if (
          optimisticTask.date === null ||
          isInCurrentRange(optimisticTask.date)
        ) {
          queryClient.setQueryData<Task[]>(targetKey, (current) => [
            ...(current ?? []),
            optimisticTask,
          ]);
        }

        return { optimisticId, registration, snapshot, targetKey };
      } catch (error) {
        if (snapshot) {
          try {
            restoreTask(queryClient, targetKey, optimisticId, snapshot);
          } catch {
            // Preserve the original onMutate error.
          }
        }
        try {
          await releaseMutation(queryClient, registration);
        } catch {
          // Preserve the original onMutate error if invalidation fails.
        }
        throw error;
      }
    },
    onSuccess: (task, _variables, context) => {
      if (context) {
        placeTask(
          queryClient,
          rangeKey,
          isInCurrentRange,
          task,
          context.optimisticId,
        );
      }
    },
    onError: (_error, _variables, context) => {
      if (context) {
        restoreTask(
          queryClient,
          context.targetKey,
          context.optimisticId,
          context.snapshot,
        );
      }
    },
    onSettled: (_data, _error, _variables, context) =>
      context ? releaseMutation(queryClient, context.registration) : undefined,
  });
}

export function useUpdateTask(year: number, month: number) {
  const { queryClient, rangeKey, isInCurrentRange } = useTaskMutationScope(
    year,
    month,
  );

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: TaskUpdateInput }) =>
      updateTask(id, data),
    onMutate: async ({ id, data }) => {
      const { previous, registration } = registerMutation(queryClient, id);
      let rangeSnapshot: TaskSnapshot | undefined;
      let unscheduledSnapshot: TaskSnapshot | undefined;

      try {
        await previous;
        await Promise.all([
          queryClient.cancelQueries({ queryKey: rangeKey }),
          queryClient.cancelQueries({ queryKey: taskQueryKeys.unscheduled }),
        ]);
        const rangeTasks = queryClient.getQueryData<Task[]>(rangeKey);
        const unscheduledTasks = queryClient.getQueryData<Task[]>(
          taskQueryKeys.unscheduled,
        );
        rangeSnapshot = snapshotTask(rangeTasks, id);
        unscheduledSnapshot = snapshotTask(unscheduledTasks, id);
        const task = [...(rangeTasks ?? []), ...(unscheduledTasks ?? [])].find(
          (candidate) => candidate.id === id,
        );

        if (task) {
          placeTask(queryClient, rangeKey, isInCurrentRange, {
            ...task,
            ...data,
          });
        }

        return { rangeSnapshot, registration, unscheduledSnapshot };
      } catch (error) {
        if (rangeSnapshot && unscheduledSnapshot) {
          restoreTaskCaches(
            queryClient,
            rangeKey,
            id,
            rangeSnapshot,
            unscheduledSnapshot,
          );
        }
        try {
          await releaseMutation(queryClient, registration);
        } catch {
          // Preserve the original onMutate error if invalidation fails.
        }
        throw error;
      }
    },
    onSuccess: (task) => {
      placeTask(queryClient, rangeKey, isInCurrentRange, task);
    },
    onError: (_error, { id }, context) => {
      if (context) {
        restoreTaskCaches(
          queryClient,
          rangeKey,
          id,
          context.rangeSnapshot,
          context.unscheduledSnapshot,
        );
      }
    },
    onSettled: (_data, _error, _variables, context) =>
      context ? releaseMutation(queryClient, context.registration) : undefined,
  });
}

export function useDeleteTask(year: number, month: number) {
  const { queryClient, rangeKey } = useTaskMutationScope(year, month);

  return useMutation({
    mutationFn: (id: string) => deleteTask(id),
    onMutate: async (id) => {
      const { previous, registration } = registerMutation(queryClient, id);
      let rangeSnapshot: TaskSnapshot | undefined;
      let unscheduledSnapshot: TaskSnapshot | undefined;

      try {
        await previous;
        await Promise.all([
          queryClient.cancelQueries({ queryKey: rangeKey }),
          queryClient.cancelQueries({ queryKey: taskQueryKeys.unscheduled }),
        ]);
        rangeSnapshot = snapshotTask(
          queryClient.getQueryData<Task[]>(rangeKey),
          id,
        );
        unscheduledSnapshot = snapshotTask(
          queryClient.getQueryData<Task[]>(taskQueryKeys.unscheduled),
          id,
        );
        queryClient.setQueryData<Task[]>(rangeKey, (current) =>
          current ? removeTask(current, id) : current,
        );
        queryClient.setQueryData<Task[]>(
          taskQueryKeys.unscheduled,
          (current) => (current ? removeTask(current, id) : current),
        );

        return { rangeSnapshot, registration, unscheduledSnapshot };
      } catch (error) {
        if (rangeSnapshot && unscheduledSnapshot) {
          restoreTaskCaches(
            queryClient,
            rangeKey,
            id,
            rangeSnapshot,
            unscheduledSnapshot,
          );
        }
        try {
          await releaseMutation(queryClient, registration);
        } catch {
          // Preserve the original onMutate error if invalidation fails.
        }
        throw error;
      }
    },
    onError: (_error, id, context) => {
      if (context) {
        restoreTaskCaches(
          queryClient,
          rangeKey,
          id,
          context.rangeSnapshot,
          context.unscheduledSnapshot,
        );
      }
    },
    onSettled: (_data, _error, _variables, context) =>
      context ? releaseMutation(queryClient, context.registration) : undefined,
  });
}
