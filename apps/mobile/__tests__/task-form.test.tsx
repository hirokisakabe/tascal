import TaskFormScreen from "@/app/task-form";
import { renderRouter, screen, waitFor } from "@/test-utils/router";
import type { Task } from "@/types/task";

const mockUseTasks = jest.fn();
const mockUseUnscheduledTasks = jest.fn();
const mockMutateAsync = jest.fn();

jest.mock("@/hooks/use-color-scheme", () => ({
  useColorScheme: () => "light",
}));

jest.mock("@/hooks/use-tasks", () => ({
  useCreateTask: () => ({ isPending: false, mutateAsync: mockMutateAsync }),
  useDeleteTask: () => ({ isPending: false, mutateAsync: mockMutateAsync }),
  useTasks: (...args: unknown[]) => mockUseTasks(...args),
  useUnscheduledTasks: (...args: unknown[]) => mockUseUnscheduledTasks(...args),
  useUpdateTask: () => ({ isPending: false, mutateAsync: mockMutateAsync }),
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

const refetch = jest.fn();

function queryResult({
  data,
  isError = false,
  isPending = false,
}: {
  data?: Task[];
  isError?: boolean;
  isPending?: boolean;
}) {
  return { data, isError, isPending, refetch };
}

function renderTaskForm() {
  return renderRouter(
    { "task-form": TaskFormScreen },
    {
      initialUrl: "/task-form?taskId=task-1&year=2026&month=8",
    },
  );
}

describe("TaskFormScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("取得完了後に対象taskが存在しなければ戻る導線を表示する", () => {
    mockUseTasks.mockReturnValue(queryResult({ data: [] }));
    mockUseUnscheduledTasks.mockReturnValue(queryResult({ data: [] }));

    renderTaskForm();

    expect(screen.getByText("タスクが見つかりません")).toBeOnTheScreen();
    expect(screen.getByRole("button", { name: "戻る" })).toBeOnTheScreen();
    expect(screen.queryByText("保存")).not.toBeOnTheScreen();
  });

  it("task取得済みならもう片方のqueryが失敗しても編集フォームを維持する", async () => {
    mockUseTasks.mockReturnValue(queryResult({ data: [task] }));
    mockUseUnscheduledTasks.mockReturnValue(queryResult({ isError: true }));

    renderTaskForm();

    await waitFor(() => {
      expect(screen.getByDisplayValue(task.title)).toBeOnTheScreen();
    });
    expect(
      screen.queryByText("タスクの取得に失敗しました"),
    ).not.toBeOnTheScreen();
    expect(screen.getByText("保存")).toBeOnTheScreen();
  });
});
