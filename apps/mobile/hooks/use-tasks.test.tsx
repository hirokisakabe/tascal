import { act, renderHook, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import {
  createTask,
  deleteTask,
  fetchTasksRange,
  fetchUnscheduledTasks,
  updateTask,
} from "@/api/tasks";
import {
  getTaskDateRange,
  taskQueryKeys,
  useCreateTask,
  useDeleteTask,
  useTasks,
  useUnscheduledTasks,
  useUpdateTask,
} from "@/hooks/use-tasks";
import type { Task } from "@/types/task";

jest.mock("@/api/tasks", () => ({
  createTask: jest.fn(),
  deleteTask: jest.fn(),
  fetchTasksRange: jest.fn(),
  fetchUnscheduledTasks: jest.fn(),
  updateTask: jest.fn(),
}));

const task: Task = {
  id: "task-1",
  userId: "user-1",
  title: "テストタスク",
  description: null,
  date: "2026-08-06",
  status: "todo",
  categoryId: null,
  createdAt: "2026-08-06T00:00:00.000Z",
  updatedAt: "2026-08-06T00:00:00.000Z",
};

const unscheduledTask: Task = {
  ...task,
  id: "task-unscheduled",
  title: "未スケジュール",
  date: null,
};

const otherTask: Task = {
  ...task,
  id: "task-2",
  title: "別タスク",
};

const { startDate, endDate } = getTaskDateRange(2026, 8);
const rangeKey = taskQueryKeys.range(startDate, endDate);

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      mutations: { gcTime: Infinity, retry: false },
      queries: { gcTime: Infinity, retry: false },
    },
  });
}

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, reject, resolve };
}

function setTaskCaches(
  queryClient: QueryClient,
  scheduled: Task[] = [],
  unscheduled: Task[] = [],
) {
  queryClient.setQueryData(rangeKey, scheduled);
  queryClient.setQueryData(taskQueryKeys.unscheduled, unscheduled);
}

describe("mobile task queries", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(fetchTasksRange).mockResolvedValue([]);
    jest.mocked(fetchUnscheduledTasks).mockResolvedValue([]);
  });

  it("月の6週表示範囲と未スケジュールのquery keyで取得する", async () => {
    const queryClient = createTestQueryClient();
    jest.mocked(fetchTasksRange).mockResolvedValue([task]);
    jest.mocked(fetchUnscheduledTasks).mockResolvedValue([unscheduledTask]);

    const { result } = renderHook(
      () => ({
        scheduled: useTasks(2026, 8),
        unscheduled: useUnscheduledTasks(),
      }),
      { wrapper: createWrapper(queryClient) },
    );

    await waitFor(() => {
      expect(result.current.scheduled.isSuccess).toBe(true);
      expect(result.current.unscheduled.isSuccess).toBe(true);
    });
    expect({ startDate, endDate }).toEqual({
      startDate: "2026-07-27",
      endDate: "2026-09-06",
    });
    expect(fetchTasksRange).toHaveBeenCalledWith(
      startDate,
      endDate,
      expect.anything(),
    );
    expect(queryClient.getQueryData(rangeKey)).toEqual([task]);
    expect(queryClient.getQueryData(taskQueryKeys.unscheduled)).toEqual([
      unscheduledTask,
    ]);
  });

  it("新規作成画面向けにtask queryを無効化できる", () => {
    const queryClient = createTestQueryClient();
    renderHook(
      () => {
        useTasks(2026, 8, false);
        useUnscheduledTasks(false);
      },
      { wrapper: createWrapper(queryClient) },
    );

    expect(fetchTasksRange).not.toHaveBeenCalled();
    expect(fetchUnscheduledTasks).not.toHaveBeenCalled();
  });
});

describe("mobile task optimistic mutations", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(fetchTasksRange).mockResolvedValue([]);
    jest.mocked(fetchUnscheduledTasks).mockResolvedValue([]);
  });

  it.each([
    ["日付あり", { title: "作成中", date: "2026-08-20" }, rangeKey],
    [
      "未スケジュール",
      { title: "作成中", date: null },
      taskQueryKeys.unscheduled,
    ],
  ] as const)(
    "%sタスクをAPI応答前に追加し、成功値で一意に置換する",
    async (_label, input, targetKey) => {
      const queryClient = createTestQueryClient();
      setTaskCaches(queryClient);
      const pending = deferred<Task>();
      jest.mocked(createTask).mockReturnValue(pending.promise);
      const { result } = renderHook(() => useCreateTask(2026, 8), {
        wrapper: createWrapper(queryClient),
      });

      act(() => result.current.mutate(input));

      await waitFor(() => {
        const optimistic = queryClient.getQueryData<Task[]>(targetKey);
        expect(optimistic).toHaveLength(1);
        expect(optimistic?.[0]).toMatchObject(input);
        expect(optimistic?.[0].id).toMatch(/^optimistic-/);
      });

      const confirmed = { ...task, ...input, id: `confirmed-${input.date}` };
      act(() => pending.resolve(confirmed));
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      const allTasks = [
        ...(queryClient.getQueryData<Task[]>(rangeKey) ?? []),
        ...(queryClient.getQueryData<Task[]>(taskQueryKeys.unscheduled) ?? []),
      ];
      expect(allTasks).toEqual([confirmed]);
      expect(
        allTasks.filter((value) => value.id === confirmed.id),
      ).toHaveLength(1);
      expect(allTasks.some((value) => value.id.startsWith("optimistic-"))).toBe(
        false,
      );
    },
  );

  it("表示範囲外の作成をcacheへ先行追加しない", async () => {
    const queryClient = createTestQueryClient();
    setTaskCaches(queryClient, [task], [unscheduledTask]);
    const pending = deferred<Task>();
    jest.mocked(createTask).mockReturnValue(pending.promise);
    const { result } = renderHook(() => useCreateTask(2026, 8), {
      wrapper: createWrapper(queryClient),
    });

    act(() => result.current.mutate({ title: "翌月", date: "2026-10-01" }));
    await waitFor(() => expect(createTask).toHaveBeenCalled());

    expect(queryClient.getQueryData(rangeKey)).toEqual([task]);
    expect(queryClient.getQueryData(taskQueryKeys.unscheduled)).toEqual([
      unscheduledTask,
    ]);
    act(() => pending.resolve({ ...task, id: "outside", date: "2026-10-01" }));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("作成失敗時に一時taskだけを除去し、未取得cacheを未取得へ戻す", async () => {
    const queryClient = createTestQueryClient();
    const pending = deferred<Task>();
    jest.mocked(createTask).mockReturnValue(pending.promise);
    const { result } = renderHook(() => useCreateTask(2026, 8), {
      wrapper: createWrapper(queryClient),
    });

    act(() => result.current.mutate({ title: "失敗", date: null }));
    await waitFor(() =>
      expect(
        queryClient.getQueryData<Task[]>(taskQueryKeys.unscheduled),
      ).toHaveLength(1),
    );
    act(() => pending.reject(new Error("create failed")));
    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(queryClient.getQueryData(taskQueryKeys.unscheduled)).toBeUndefined();
  });

  it("所属が変わらない更新をAPI応答前に反映する", async () => {
    const queryClient = createTestQueryClient();
    setTaskCaches(queryClient, [task, otherTask], [unscheduledTask]);
    const pending = deferred<Task>();
    jest.mocked(updateTask).mockReturnValue(pending.promise);
    const { result } = renderHook(() => useUpdateTask(2026, 8), {
      wrapper: createWrapper(queryClient),
    });
    const data = {
      title: "更新済み",
      description: "説明",
      status: "done" as const,
      categoryId: "category-1",
    };

    act(() => result.current.mutate({ id: task.id, data }));
    await waitFor(() =>
      expect(queryClient.getQueryData(rangeKey)).toEqual([
        { ...task, ...data },
        otherTask,
      ]),
    );
    expect(queryClient.getQueryData(taskQueryKeys.unscheduled)).toEqual([
      unscheduledTask,
    ]);

    act(() => pending.resolve({ ...task, ...data }));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it.each([
    [
      "日付ありから未スケジュール",
      task,
      { date: null },
      [],
      [{ ...task, date: null }],
    ],
    [
      "未スケジュールから表示範囲内",
      unscheduledTask,
      { date: "2026-08-20" },
      [{ ...unscheduledTask, date: "2026-08-20" }],
      [],
    ],
    ["表示範囲内から範囲外", task, { date: "2026-10-01" }, [], []],
  ] as const)(
    "%sへAPI応答前に正しく移動する",
    async (_label, source, data, expectedRange, expectedUnscheduled) => {
      const queryClient = createTestQueryClient();
      setTaskCaches(
        queryClient,
        source.date === null ? [] : [source],
        source.date === null ? [source] : [],
      );
      const pending = deferred<Task>();
      jest.mocked(updateTask).mockReturnValue(pending.promise);
      const { result } = renderHook(() => useUpdateTask(2026, 8), {
        wrapper: createWrapper(queryClient),
      });

      act(() => result.current.mutate({ id: source.id, data }));
      await waitFor(() => {
        expect(queryClient.getQueryData(rangeKey)).toEqual(expectedRange);
        expect(queryClient.getQueryData(taskQueryKeys.unscheduled)).toEqual(
          expectedUnscheduled,
        );
      });

      act(() => pending.resolve({ ...source, ...data }));
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
    },
  );

  it("更新失敗時に対象taskだけを戻し、別taskの並行変更を失わない", async () => {
    const queryClient = createTestQueryClient();
    setTaskCaches(queryClient, [task, otherTask]);
    const pending = deferred<Task>();
    jest.mocked(updateTask).mockReturnValue(pending.promise);
    const { result } = renderHook(() => useUpdateTask(2026, 8), {
      wrapper: createWrapper(queryClient),
    });

    act(() => result.current.mutate({ id: task.id, data: { date: null } }));
    await waitFor(() =>
      expect(queryClient.getQueryData(rangeKey)).toEqual([otherTask]),
    );
    const concurrentlyUpdated = { ...otherTask, title: "並行更新" };
    queryClient.setQueryData(rangeKey, [concurrentlyUpdated]);

    act(() => pending.reject(new Error("update failed")));
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(queryClient.getQueryData(rangeKey)).toEqual([
      task,
      concurrentlyUpdated,
    ]);
    expect(queryClient.getQueryData(taskQueryKeys.unscheduled)).toEqual([]);
  });

  it("異なるtaskの更新を並行実行し、一方のrollback後も他方を維持する", async () => {
    const queryClient = createTestQueryClient();
    setTaskCaches(queryClient, [task, otherTask]);
    const first = deferred<Task>();
    const second = deferred<Task>();
    jest
      .mocked(updateTask)
      .mockImplementation((id) =>
        id === task.id ? first.promise : second.promise,
      );
    const firstHook = renderHook(() => useUpdateTask(2026, 8), {
      wrapper: createWrapper(queryClient),
    });
    const secondHook = renderHook(() => useUpdateTask(2026, 8), {
      wrapper: createWrapper(queryClient),
    });

    act(() => {
      firstHook.result.current.mutate({ id: task.id, data: { date: null } });
      secondHook.result.current.mutate({
        id: otherTask.id,
        data: { title: "成功予定" },
      });
    });
    await waitFor(() => expect(updateTask).toHaveBeenCalledTimes(2));

    act(() => first.reject(new Error("first failed")));
    await waitFor(() => expect(firstHook.result.current.isError).toBe(true));
    expect(queryClient.getQueryData(rangeKey)).toEqual([
      task,
      { ...otherTask, title: "成功予定" },
    ]);

    act(() => second.resolve({ ...otherTask, title: "成功予定" }));
    await waitFor(() => expect(secondHook.result.current.isSuccess).toBe(true));
  });

  it("同一taskの連続更新を直列化し、先行失敗後に後続更新を反映する", async () => {
    const queryClient = createTestQueryClient();
    setTaskCaches(queryClient, [task]);
    const first = deferred<Task>();
    const second = deferred<Task>();
    jest
      .mocked(updateTask)
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);
    const firstHook = renderHook(() => useUpdateTask(2026, 8), {
      wrapper: createWrapper(queryClient),
    });
    const secondHook = renderHook(() => useUpdateTask(2026, 8), {
      wrapper: createWrapper(queryClient),
    });

    act(() => {
      firstHook.result.current.mutate({ id: task.id, data: { date: null } });
      secondHook.result.current.mutate({
        id: task.id,
        data: { title: "後続更新" },
      });
    });
    await waitFor(() => expect(updateTask).toHaveBeenCalledTimes(1));

    act(() => first.reject(new Error("first failed")));
    await waitFor(() => expect(updateTask).toHaveBeenCalledTimes(2));
    expect(queryClient.getQueryData(rangeKey)).toEqual([
      { ...task, title: "後続更新" },
    ]);

    act(() => second.resolve({ ...task, title: "後続更新" }));
    await waitFor(() => expect(secondHook.result.current.isSuccess).toBe(true));
  });

  it.each([task, unscheduledTask])(
    "削除を保持cacheへ即時反映し、失敗時に戻す: $id",
    async (deleted) => {
      const queryClient = createTestQueryClient();
      setTaskCaches(
        queryClient,
        deleted.date === null ? [otherTask] : [deleted, otherTask],
        deleted.date === null ? [deleted] : [unscheduledTask],
      );
      const pending = deferred<void>();
      jest.mocked(deleteTask).mockReturnValue(pending.promise);
      const { result } = renderHook(() => useDeleteTask(2026, 8), {
        wrapper: createWrapper(queryClient),
      });

      act(() => result.current.mutate(deleted.id));
      await waitFor(() => {
        expect(
          queryClient
            .getQueryData<Task[]>(rangeKey)
            ?.some(({ id }) => id === deleted.id),
        ).toBe(false);
        expect(
          queryClient
            .getQueryData<Task[]>(taskQueryKeys.unscheduled)
            ?.some(({ id }) => id === deleted.id),
        ).toBe(false);
      });

      act(() => pending.reject(new Error("delete failed")));
      await waitFor(() => expect(result.current.isError).toBe(true));
      const restored = [
        ...(queryClient.getQueryData<Task[]>(rangeKey) ?? []),
        ...(queryClient.getQueryData<Task[]>(taskQueryKeys.unscheduled) ?? []),
      ];
      expect(restored.filter(({ id }) => id === deleted.id)).toEqual([deleted]);
    },
  );

  it("進行中mutationがある間は再取得せず、全完了後に一度だけ同期する", async () => {
    const queryClient = createTestQueryClient();
    setTaskCaches(queryClient, [task, otherTask]);
    const invalidateQueries = jest.spyOn(queryClient, "invalidateQueries");
    const first = deferred<Task>();
    const second = deferred<void>();
    jest.mocked(updateTask).mockReturnValue(first.promise);
    jest.mocked(deleteTask).mockReturnValue(second.promise);
    const update = renderHook(() => useUpdateTask(2026, 8), {
      wrapper: createWrapper(queryClient),
    });
    const remove = renderHook(() => useDeleteTask(2026, 8), {
      wrapper: createWrapper(queryClient),
    });

    act(() => {
      update.result.current.mutate({
        id: task.id,
        data: { title: "更新中" },
      });
      remove.result.current.mutate(otherTask.id);
    });
    await waitFor(() => {
      expect(updateTask).toHaveBeenCalled();
      expect(deleteTask).toHaveBeenCalled();
    });

    act(() => first.resolve({ ...task, title: "更新中" }));
    await waitFor(() => expect(update.result.current.isSuccess).toBe(true));
    expect(invalidateQueries).not.toHaveBeenCalled();

    act(() => second.resolve());
    await waitFor(() => expect(remove.result.current.isSuccess).toBe(true));
    expect(invalidateQueries).toHaveBeenCalledTimes(1);
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: taskQueryKeys.all,
    });
  });

  it("onMutate例外でもlockを解放し、同一taskの後続更新を実行できる", async () => {
    const queryClient = createTestQueryClient();
    setTaskCaches(queryClient, [task]);
    const originalCancelQueries = queryClient.cancelQueries.bind(queryClient);
    jest
      .spyOn(queryClient, "cancelQueries")
      .mockRejectedValueOnce(new Error("cancel failed"))
      .mockImplementation((filters, options) =>
        originalCancelQueries(filters, options),
      );
    jest.mocked(updateTask).mockResolvedValue({ ...task, title: "回復" });
    const first = renderHook(() => useUpdateTask(2026, 8), {
      wrapper: createWrapper(queryClient),
    });
    const second = renderHook(() => useUpdateTask(2026, 8), {
      wrapper: createWrapper(queryClient),
    });

    await expect(
      first.result.current.mutateAsync({
        id: task.id,
        data: { title: "失敗" },
      }),
    ).rejects.toThrow("cancel failed");

    await act(async () => {
      await second.result.current.mutateAsync({
        id: task.id,
        data: { title: "回復" },
      });
    });
    expect(updateTask).toHaveBeenCalledTimes(1);
    expect(queryClient.getQueryData(rangeKey)).toEqual([
      { ...task, title: "回復" },
    ]);
  });

  it("成功後の再取得で一時taskを残さずサーバー確定値に同期する", async () => {
    const queryClient = createTestQueryClient();
    const confirmed = { ...task, id: "server-task", title: "確定値" };
    jest
      .mocked(fetchTasksRange)
      .mockResolvedValueOnce([])
      .mockResolvedValue([confirmed]);
    jest.mocked(fetchUnscheduledTasks).mockResolvedValue([]);
    jest.mocked(createTask).mockResolvedValue(confirmed);
    const { result } = renderHook(
      () => ({
        create: useCreateTask(2026, 8),
        scheduled: useTasks(2026, 8),
        unscheduled: useUnscheduledTasks(),
      }),
      { wrapper: createWrapper(queryClient) },
    );
    await waitFor(() => {
      expect(result.current.scheduled.isSuccess).toBe(true);
      expect(result.current.unscheduled.isSuccess).toBe(true);
    });

    await act(async () => {
      await result.current.create.mutateAsync({
        title: confirmed.title,
        date: confirmed.date,
      });
    });
    await waitFor(() => expect(fetchTasksRange).toHaveBeenCalledTimes(2));

    expect(queryClient.getQueryData(rangeKey)).toEqual([confirmed]);
    expect(
      queryClient
        .getQueryData<Task[]>(rangeKey)
        ?.filter(({ id }) => id === confirmed.id),
    ).toHaveLength(1);
  });
});
