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
      mutations: { gcTime: Infinity },
      queries: { gcTime: Infinity, retry: false },
    },
  });
}

describe("mobile task queries", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("月の6週表示範囲から安定したquery keyを作る", async () => {
    const queryClient = createTestQueryClient();
    jest.mocked(fetchTasksRange).mockResolvedValue([task]);

    const { result, unmount } = renderHook(() => useTasks(2026, 8), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const range = getTaskDateRange(2026, 8);
    expect(range).toEqual({
      startDate: "2026-07-27",
      endDate: "2026-09-06",
    });
    expect(fetchTasksRange).toHaveBeenCalledWith(
      range.startDate,
      range.endDate,
      expect.anything(),
    );
    expect(
      queryClient.getQueryData(
        taskQueryKeys.range(range.startDate, range.endDate),
      ),
    ).toEqual([task]);
    unmount();
    queryClient.clear();
  });

  it("未スケジュールタスクを専用query keyで取得する", async () => {
    const queryClient = createTestQueryClient();
    jest.mocked(fetchUnscheduledTasks).mockResolvedValue([task]);

    const { result, unmount } = renderHook(() => useUnscheduledTasks(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(queryClient.getQueryData(taskQueryKeys.unscheduled)).toEqual([task]);
    unmount();
    queryClient.clear();
  });

  it("新規作成画面向けにtask queryを無効化できる", () => {
    const queryClient = createTestQueryClient();
    const { unmount } = renderHook(
      () => {
        useTasks(2026, 8, false);
        useUnscheduledTasks(false);
      },
      { wrapper: createWrapper(queryClient) },
    );

    expect(fetchTasksRange).not.toHaveBeenCalled();
    expect(fetchUnscheduledTasks).not.toHaveBeenCalled();
    unmount();
    queryClient.clear();
  });

  it("作成・更新・削除の成功後にtask queryをinvalidationする", async () => {
    const queryClient = createTestQueryClient();
    const invalidateQueries = jest.spyOn(queryClient, "invalidateQueries");
    jest.mocked(createTask).mockResolvedValue(task);
    jest.mocked(updateTask).mockResolvedValue({ ...task, status: "done" });
    jest.mocked(deleteTask).mockResolvedValue(undefined);

    const create = renderHook(() => useCreateTask(), {
      wrapper: createWrapper(queryClient),
    });
    const update = renderHook(() => useUpdateTask(), {
      wrapper: createWrapper(queryClient),
    });
    const remove = renderHook(() => useDeleteTask(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await create.result.current.mutateAsync({ title: task.title });
      await update.result.current.mutateAsync({
        id: task.id,
        data: { status: "done" },
      });
      await remove.result.current.mutateAsync(task.id);
    });

    await waitFor(() => {
      expect(create.result.current.isSuccess).toBe(true);
      expect(update.result.current.isSuccess).toBe(true);
      expect(remove.result.current.isSuccess).toBe(true);
    });

    expect(createTask).toHaveBeenCalledWith({ title: task.title });
    expect(updateTask).toHaveBeenCalledWith(task.id, { status: "done" });
    expect(deleteTask).toHaveBeenCalledWith(task.id);
    expect(invalidateQueries).toHaveBeenCalledTimes(3);
    expect(invalidateQueries).toHaveBeenNthCalledWith(1, {
      queryKey: taskQueryKeys.all,
    });
    create.unmount();
    update.unmount();
    remove.unmount();
    queryClient.clear();
  });
});
