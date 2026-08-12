import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { getCalendarDateRange } from "@tascal/shared/calendar";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Task } from "../types/task";
import { useTasks, useUnscheduledTasks, useUpdateTask } from "./useTasks";

const mockFetchTasks = vi.fn();
const mockFetchUnscheduledTasks = vi.fn();
const mockUpdateTask = vi.fn();

vi.mock("../api/tasks", () => ({
  fetchTasks: (...args: unknown[]) => mockFetchTasks(...args) as unknown,
  fetchUnscheduledTasks: (...args: unknown[]) =>
    mockFetchUnscheduledTasks(...args) as unknown,
  createTask: vi.fn(),
  updateTask: (...args: unknown[]) => mockUpdateTask(...args) as unknown,
  deleteTask: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), { error: vi.fn() }),
}));

const scheduledTask: Task = {
  id: "scheduled-task",
  userId: "user-1",
  title: "予定あり",
  description: null,
  date: "2026-08-12",
  status: "todo",
  categoryId: null,
  createdAt: "2026-08-01T00:00:00.000Z",
  updatedAt: "2026-08-01T00:00:00.000Z",
};

const unscheduledTask: Task = {
  ...scheduledTask,
  id: "unscheduled-task",
  title: "未スケジュール",
  date: null,
};

const { startDate, endDate } = getCalendarDateRange(2026, 8);
const rangeKey = ["tasks", "range", startDate, endDate] as const;
const unscheduledKey = ["tasks", "unscheduled"] as const;

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { gcTime: Infinity, retry: false },
      mutations: { gcTime: Infinity, retry: false },
    },
  });
}

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

function createPendingUpdate() {
  let resolve!: (task: Task) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<Task>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  mockUpdateTask.mockReturnValue(promise);
  return { promise, reject, resolve };
}

function createDeferredUpdate() {
  let resolve!: (task: Task) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<Task>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, reject, resolve };
}

describe("useUpdateTask", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchTasks.mockResolvedValue([]);
    mockFetchUnscheduledTasks.mockResolvedValue([]);
  });

  it("API応答前にカレンダーから未スケジュールへ移し、失敗時に両cacheを戻す", async () => {
    const queryClient = createQueryClient();
    queryClient.setQueryData(rangeKey, [scheduledTask]);
    queryClient.setQueryData(unscheduledKey, [unscheduledTask]);
    const pendingUpdate = createPendingUpdate();
    const { result } = renderHook(() => useUpdateTask(2026, 8), {
      wrapper: createWrapper(queryClient),
    });

    act(() => {
      result.current.mutate({
        id: scheduledTask.id,
        data: { date: null },
      });
    });

    await waitFor(() => {
      expect(queryClient.getQueryData(rangeKey)).toEqual([]);
      expect(queryClient.getQueryData(unscheduledKey)).toEqual([
        unscheduledTask,
        { ...scheduledTask, date: null },
      ]);
    });

    pendingUpdate.reject(new Error("update failed"));

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(queryClient.getQueryData(rangeKey)).toEqual([scheduledTask]);
    expect(queryClient.getQueryData(unscheduledKey)).toEqual([unscheduledTask]);
  });

  it("API応答前に未スケジュールからカレンダーへ移し、失敗時に両cacheを戻す", async () => {
    const queryClient = createQueryClient();
    queryClient.setQueryData(rangeKey, [scheduledTask]);
    queryClient.setQueryData(unscheduledKey, [unscheduledTask]);
    const pendingUpdate = createPendingUpdate();
    const { result } = renderHook(() => useUpdateTask(2026, 8), {
      wrapper: createWrapper(queryClient),
    });
    const targetDate = "2026-08-20";

    act(() => {
      result.current.mutate({
        id: unscheduledTask.id,
        data: { date: targetDate },
      });
    });

    await waitFor(() => {
      expect(queryClient.getQueryData(rangeKey)).toEqual([
        scheduledTask,
        { ...unscheduledTask, date: targetDate },
      ]);
      expect(queryClient.getQueryData(unscheduledKey)).toEqual([]);
    });

    pendingUpdate.reject(new Error("update failed"));

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(queryClient.getQueryData(rangeKey)).toEqual([scheduledTask]);
    expect(queryClient.getQueryData(unscheduledKey)).toEqual([unscheduledTask]);
  });

  it.each([
    ["表示範囲の開始日", startDate, true],
    ["表示範囲の終了日", endDate, true],
    ["表示範囲より前", "2026-07-26", false],
    ["表示範囲より後", "2026-09-07", false],
  ])("%sへの移動でrange cache所属を判定する", async (_label, date, inRange) => {
    const queryClient = createQueryClient();
    queryClient.setQueryData(rangeKey, []);
    queryClient.setQueryData(unscheduledKey, [unscheduledTask]);
    mockUpdateTask.mockResolvedValue({ ...unscheduledTask, date });
    const { result } = renderHook(() => useUpdateTask(2026, 8), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({
        id: unscheduledTask.id,
        data: { date },
      });
    });

    expect(queryClient.getQueryData(rangeKey)).toEqual(
      inRange ? [{ ...unscheduledTask, date }] : [],
    );
    expect(queryClient.getQueryData(unscheduledKey)).toEqual([]);
  });

  it("失敗時に対象IDだけを戻し、別taskの並行cache更新を維持する", async () => {
    const otherTask = {
      ...scheduledTask,
      id: "other-task",
      title: "別タスク",
    };
    const queryClient = createQueryClient();
    queryClient.setQueryData(rangeKey, [scheduledTask, otherTask]);
    queryClient.setQueryData(unscheduledKey, [unscheduledTask]);
    const pendingUpdate = createPendingUpdate();
    const { result } = renderHook(() => useUpdateTask(2026, 8), {
      wrapper: createWrapper(queryClient),
    });

    act(() => {
      result.current.mutate({
        id: scheduledTask.id,
        data: { date: null },
      });
    });
    await waitFor(() =>
      expect(queryClient.getQueryData(rangeKey)).toEqual([otherTask]),
    );

    const externallyUpdatedTask = { ...otherTask, title: "並行更新済み" };
    queryClient.setQueryData(rangeKey, [externallyUpdatedTask]);
    pendingUpdate.reject(new Error("update failed"));

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(queryClient.getQueryData(rangeKey)).toEqual([
      scheduledTask,
      externallyUpdatedTask,
    ]);
    expect(queryClient.getQueryData(unscheduledKey)).toEqual([unscheduledTask]);
  });

  it("異なるIDのmutationは並行実行し、一方のrollbackでも他方を維持する", async () => {
    const otherTask = {
      ...scheduledTask,
      id: "other-task",
      title: "別タスク",
    };
    const queryClient = createQueryClient();
    queryClient.setQueryData(rangeKey, [scheduledTask, otherTask]);
    queryClient.setQueryData(unscheduledKey, []);
    const failedUpdate = createDeferredUpdate();
    const successfulUpdate = createDeferredUpdate();
    mockUpdateTask.mockImplementation((id: string) =>
      id === scheduledTask.id ? failedUpdate.promise : successfulUpdate.promise,
    );
    const first = renderHook(() => useUpdateTask(2026, 8), {
      wrapper: createWrapper(queryClient),
    });
    const second = renderHook(() => useUpdateTask(2026, 8), {
      wrapper: createWrapper(queryClient),
    });

    act(() => {
      first.result.current.mutate({
        id: scheduledTask.id,
        data: { date: null },
      });
      second.result.current.mutate({
        id: otherTask.id,
        data: { title: "別タスク更新済み" },
      });
    });

    await waitFor(() => expect(mockUpdateTask).toHaveBeenCalledTimes(2));
    failedUpdate.reject(new Error("first update failed"));
    await waitFor(() => expect(first.result.current.isError).toBe(true));

    expect(queryClient.getQueryData(rangeKey)).toEqual([
      scheduledTask,
      { ...otherTask, title: "別タスク更新済み" },
    ]);
    expect(queryClient.getQueryData(unscheduledKey)).toEqual([]);

    successfulUpdate.resolve({ ...otherTask, title: "別タスク更新済み" });
    await waitFor(() => expect(second.result.current.isSuccess).toBe(true));
  });

  it("同一IDの先行移動失敗後に後続更新を正しい所属へ反映する", async () => {
    const queryClient = createQueryClient();
    queryClient.setQueryData(rangeKey, [scheduledTask]);
    queryClient.setQueryData(unscheduledKey, []);
    const firstUpdate = createDeferredUpdate();
    const secondUpdate = createDeferredUpdate();
    mockUpdateTask
      .mockReturnValueOnce(firstUpdate.promise)
      .mockReturnValueOnce(secondUpdate.promise);
    const first = renderHook(() => useUpdateTask(2026, 8), {
      wrapper: createWrapper(queryClient),
    });
    const second = renderHook(() => useUpdateTask(2026, 8), {
      wrapper: createWrapper(queryClient),
    });

    act(() => {
      first.result.current.mutate({
        id: scheduledTask.id,
        data: { date: null },
      });
      second.result.current.mutate({
        id: scheduledTask.id,
        data: { title: "後続更新" },
      });
    });

    await waitFor(() => expect(mockUpdateTask).toHaveBeenCalledTimes(1));
    firstUpdate.reject(new Error("first update failed"));
    await waitFor(() => expect(mockUpdateTask).toHaveBeenCalledTimes(2));

    expect(queryClient.getQueryData(rangeKey)).toEqual([
      { ...scheduledTask, title: "後続更新" },
    ]);
    expect(queryClient.getQueryData(unscheduledKey)).toEqual([]);

    secondUpdate.resolve({ ...scheduledTask, title: "後続更新" });
    await waitFor(() => expect(second.result.current.isSuccess).toBe(true));
    expect(queryClient.getQueryData(rangeKey)).toEqual([
      { ...scheduledTask, title: "後続更新" },
    ]);
    expect(queryClient.getQueryData(unscheduledKey)).toEqual([]);
  });

  it("同一IDの先行移動と後続更新が両方失敗した場合に元の所属へ戻す", async () => {
    const queryClient = createQueryClient();
    queryClient.setQueryData(rangeKey, [scheduledTask]);
    queryClient.setQueryData(unscheduledKey, []);
    const firstUpdate = createDeferredUpdate();
    const secondUpdate = createDeferredUpdate();
    mockUpdateTask
      .mockReturnValueOnce(firstUpdate.promise)
      .mockReturnValueOnce(secondUpdate.promise);
    const first = renderHook(() => useUpdateTask(2026, 8), {
      wrapper: createWrapper(queryClient),
    });
    const second = renderHook(() => useUpdateTask(2026, 8), {
      wrapper: createWrapper(queryClient),
    });

    act(() => {
      first.result.current.mutate({
        id: scheduledTask.id,
        data: { date: null },
      });
      second.result.current.mutate({
        id: scheduledTask.id,
        data: { title: "後続更新" },
      });
    });

    await waitFor(() => expect(mockUpdateTask).toHaveBeenCalledTimes(1));
    firstUpdate.reject(new Error("first update failed"));
    await waitFor(() => expect(mockUpdateTask).toHaveBeenCalledTimes(2));
    secondUpdate.reject(new Error("second update failed"));
    await waitFor(() => expect(second.result.current.isError).toBe(true));

    expect(queryClient.getQueryData(rangeKey)).toEqual([scheduledTask]);
    expect(queryClient.getQueryData(unscheduledKey)).toEqual([]);
  });

  it("失敗時に元がundefinedだったcacheを未取得状態へ戻す", async () => {
    const queryClient = createQueryClient();
    queryClient.setQueryData(rangeKey, [scheduledTask]);
    expect(queryClient.getQueryData(unscheduledKey)).toBeUndefined();
    const pendingUpdate = createPendingUpdate();
    const { result } = renderHook(() => useUpdateTask(2026, 8), {
      wrapper: createWrapper(queryClient),
    });

    act(() => {
      result.current.mutate({
        id: scheduledTask.id,
        data: { date: null },
      });
    });
    await waitFor(() =>
      expect(queryClient.getQueryData(unscheduledKey)).toEqual([
        { ...scheduledTask, date: null },
      ]),
    );

    pendingUpdate.reject(new Error("update failed"));

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(queryClient.getQueryData(rangeKey)).toEqual([scheduledTask]);
    expect(queryClient.getQueryData(unscheduledKey)).toBeUndefined();
  });

  it("onMutate内部例外後も部分更新を戻し同一IDの後続mutationを完了できる", async () => {
    const queryClient = createQueryClient();
    queryClient.setQueryData(rangeKey, [scheduledTask]);
    queryClient.setQueryData(unscheduledKey, []);
    const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
    const originalSetQueryData = queryClient.setQueryData.bind(queryClient);
    vi.spyOn(queryClient, "setQueryData")
      .mockImplementationOnce(originalSetQueryData)
      .mockImplementationOnce(() => {
        throw new Error("optimistic cache update failed");
      });
    const first = renderHook(() => useUpdateTask(2026, 8), {
      wrapper: createWrapper(queryClient),
    });

    act(() => {
      first.result.current.mutate({
        id: scheduledTask.id,
        data: { date: null },
      });
    });

    await waitFor(() => expect(first.result.current.isError).toBe(true));
    expect(mockUpdateTask).not.toHaveBeenCalled();
    expect(queryClient.getQueryData(rangeKey)).toEqual([scheduledTask]);
    expect(queryClient.getQueryData(unscheduledKey)).toEqual([]);
    expect(invalidateQueries).toHaveBeenCalledTimes(1);

    const updatedTask = { ...scheduledTask, title: "例外後の更新" };
    mockUpdateTask.mockResolvedValue(updatedTask);
    const second = renderHook(() => useUpdateTask(2026, 8), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await second.result.current.mutateAsync({
        id: scheduledTask.id,
        data: { title: updatedTask.title },
      });
    });

    expect(mockUpdateTask).toHaveBeenCalledWith(scheduledTask.id, {
      title: updatedTask.title,
    });
    await waitFor(() => expect(second.result.current.isSuccess).toBe(true));
    expect(queryClient.getQueryData(rangeKey)).toEqual([updatedTask]);
    expect(queryClient.getQueryData(unscheduledKey)).toEqual([]);
    expect(invalidateQueries).toHaveBeenCalledTimes(2);
  });

  it("active queryで異なるIDの一方settle後も他方のoptimistic値を維持する", async () => {
    const otherTask = {
      ...scheduledTask,
      id: "other-task",
      title: "別タスク",
    };
    const updatedOtherTask = { ...otherTask, title: "別タスク更新済み" };
    const movedTask = { ...scheduledTask, date: null };
    mockFetchTasks
      .mockResolvedValueOnce([scheduledTask, otherTask])
      .mockResolvedValue([updatedOtherTask]);
    mockFetchUnscheduledTasks
      .mockResolvedValueOnce([])
      .mockResolvedValue([movedTask]);
    const firstUpdate = createDeferredUpdate();
    const secondUpdate = createDeferredUpdate();
    mockUpdateTask.mockImplementation((id: string) =>
      id === scheduledTask.id ? firstUpdate.promise : secondUpdate.promise,
    );
    const queryClient = createQueryClient();
    const { result } = renderHook(
      () => ({
        tasks: useTasks(2026, 8),
        unscheduledTasks: useUnscheduledTasks(),
        first: useUpdateTask(2026, 8),
        second: useUpdateTask(2026, 8),
      }),
      { wrapper: createWrapper(queryClient) },
    );

    await waitFor(() => {
      expect(result.current.tasks.isSuccess).toBe(true);
      expect(result.current.unscheduledTasks.isSuccess).toBe(true);
    });
    act(() => {
      result.current.first.mutate({
        id: scheduledTask.id,
        data: { date: null },
      });
      result.current.second.mutate({
        id: otherTask.id,
        data: { title: updatedOtherTask.title },
      });
    });
    await waitFor(() => expect(mockUpdateTask).toHaveBeenCalledTimes(2));

    firstUpdate.resolve(movedTask);
    await waitFor(() => expect(result.current.first.isSuccess).toBe(true));

    expect(mockFetchTasks).toHaveBeenCalledTimes(1);
    expect(mockFetchUnscheduledTasks).toHaveBeenCalledTimes(1);
    expect(result.current.tasks.data).toEqual([updatedOtherTask]);
    expect(result.current.unscheduledTasks.data).toEqual([movedTask]);

    secondUpdate.resolve(updatedOtherTask);
    await waitFor(() => {
      expect(result.current.second.isSuccess).toBe(true);
      expect(mockFetchTasks).toHaveBeenCalledTimes(2);
      expect(mockFetchUnscheduledTasks).toHaveBeenCalledTimes(2);
    });
    expect(result.current.tasks.data).toEqual([updatedOtherTask]);
    expect(result.current.unscheduledTasks.data).toEqual([movedTask]);
  });

  it("active queryで同一IDの後続値を先行settle中のrefetchで上書きしない", async () => {
    const movedTask = { ...scheduledTask, date: null };
    const finalTask = { ...movedTask, title: "後続更新" };
    mockFetchTasks.mockResolvedValueOnce([scheduledTask]).mockResolvedValue([]);
    mockFetchUnscheduledTasks
      .mockResolvedValueOnce([])
      .mockResolvedValue([finalTask]);
    const firstUpdate = createDeferredUpdate();
    const secondUpdate = createDeferredUpdate();
    mockUpdateTask
      .mockReturnValueOnce(firstUpdate.promise)
      .mockReturnValueOnce(secondUpdate.promise);
    const queryClient = createQueryClient();
    const { result } = renderHook(
      () => ({
        tasks: useTasks(2026, 8),
        unscheduledTasks: useUnscheduledTasks(),
        first: useUpdateTask(2026, 8),
        second: useUpdateTask(2026, 8),
      }),
      { wrapper: createWrapper(queryClient) },
    );

    await waitFor(() => {
      expect(result.current.tasks.isSuccess).toBe(true);
      expect(result.current.unscheduledTasks.isSuccess).toBe(true);
    });
    act(() => {
      result.current.first.mutate({
        id: scheduledTask.id,
        data: { date: null },
      });
      result.current.second.mutate({
        id: scheduledTask.id,
        data: { title: finalTask.title },
      });
    });
    await waitFor(() => expect(mockUpdateTask).toHaveBeenCalledTimes(1));

    firstUpdate.resolve(movedTask);
    await waitFor(() => expect(mockUpdateTask).toHaveBeenCalledTimes(2));

    expect(mockFetchTasks).toHaveBeenCalledTimes(1);
    expect(mockFetchUnscheduledTasks).toHaveBeenCalledTimes(1);
    expect(result.current.tasks.data).toEqual([]);
    expect(result.current.unscheduledTasks.data).toEqual([finalTask]);

    secondUpdate.resolve(finalTask);
    await waitFor(() => {
      expect(result.current.second.isSuccess).toBe(true);
      expect(mockFetchTasks).toHaveBeenCalledTimes(2);
      expect(mockFetchUnscheduledTasks).toHaveBeenCalledTimes(2);
    });
    expect(result.current.tasks.data).toEqual([]);
    expect(result.current.unscheduledTasks.data).toEqual([finalTask]);
  });

  it("成功時は購読queryの再取得完了を待ちserver確定値を一意に反映する", async () => {
    const confirmedTask = {
      ...scheduledTask,
      title: "サーバー確定値",
      date: null,
    };
    mockFetchTasks.mockResolvedValueOnce([scheduledTask]).mockResolvedValue([]);
    mockFetchUnscheduledTasks
      .mockResolvedValueOnce([])
      .mockResolvedValue([confirmedTask]);
    mockUpdateTask.mockResolvedValue(confirmedTask);
    const queryClient = createQueryClient();
    const { result } = renderHook(
      () => ({
        tasks: useTasks(2026, 8),
        unscheduledTasks: useUnscheduledTasks(),
        updateTask: useUpdateTask(2026, 8),
      }),
      { wrapper: createWrapper(queryClient) },
    );

    await waitFor(() => {
      expect(result.current.tasks.isSuccess).toBe(true);
      expect(result.current.unscheduledTasks.isSuccess).toBe(true);
    });

    await act(async () => {
      await result.current.updateTask.mutateAsync({
        id: scheduledTask.id,
        data: { date: null },
      });
    });

    expect(mockFetchTasks).toHaveBeenCalledTimes(2);
    expect(mockFetchUnscheduledTasks).toHaveBeenCalledTimes(2);
    expect(queryClient.getQueryData(rangeKey)).toEqual([]);
    expect(queryClient.getQueryData(unscheduledKey)).toEqual([confirmedTask]);
    await waitFor(() => {
      expect(result.current.tasks.data).toEqual([]);
      expect(result.current.unscheduledTasks.data).toEqual([confirmedTask]);
    });
    expect(
      [
        ...(result.current.tasks.data ?? []),
        ...(result.current.unscheduledTasks.data ?? []),
      ].filter((task) => task.id === scheduledTask.id),
    ).toHaveLength(1);
  });

  it("日付を変えない更新では所属を維持して対象cacheの内容を更新する", async () => {
    const queryClient = createQueryClient();
    queryClient.setQueryData(rangeKey, [scheduledTask]);
    queryClient.setQueryData(unscheduledKey, [unscheduledTask]);
    mockUpdateTask.mockResolvedValue({
      ...scheduledTask,
      title: "更新済み",
      description: "説明",
      status: "done",
      categoryId: "11111111-1111-4111-8111-111111111111",
    });
    const { result } = renderHook(() => useUpdateTask(2026, 8), {
      wrapper: createWrapper(queryClient),
    });
    const data = {
      title: "更新済み",
      description: "説明",
      status: "done" as const,
      categoryId: "11111111-1111-4111-8111-111111111111",
    };

    await act(async () => {
      await result.current.mutateAsync({ id: scheduledTask.id, data });
    });

    expect(queryClient.getQueryData(rangeKey)).toEqual([
      { ...scheduledTask, ...data },
    ]);
    expect(queryClient.getQueryData(unscheduledKey)).toEqual([unscheduledTask]);
  });
});
