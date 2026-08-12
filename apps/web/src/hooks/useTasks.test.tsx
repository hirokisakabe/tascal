import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { getCalendarDateRange } from "@tascal/shared/calendar";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Task } from "../types/task";
import { useUpdateTask } from "./useTasks";

const mockUpdateTask = vi.fn();

vi.mock("../api/tasks", () => ({
  fetchTasks: vi.fn(),
  fetchUnscheduledTasks: vi.fn(),
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
  let reject!: (error: Error) => void;
  const promise = new Promise<Task>((_resolve, rejectPromise) => {
    reject = rejectPromise;
  });
  mockUpdateTask.mockReturnValue(promise);
  return { reject };
}

describe("useUpdateTask", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
