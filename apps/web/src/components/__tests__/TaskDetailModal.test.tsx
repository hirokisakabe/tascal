import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TaskDetailModal } from "../TaskDetailModal";
import { renderWithQueryClient } from "../../test/helpers";

const mockUpdateTask = vi.fn();
const mockDeleteTask = vi.fn();

vi.mock("../../api/tasks", () => ({
  updateTask: (...args: unknown[]) => mockUpdateTask(...args) as unknown,
  deleteTask: (...args: unknown[]) => mockDeleteTask(...args) as unknown,
}));

const mockTask = {
  id: "task-1",
  title: "既存タスク",
  description: "既存の説明",
  date: "2026-03-15",
  status: "todo" as const,
  categoryId: null,
  userId: "user-1",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("TaskDetailModal", () => {
  const defaultProps = {
    open: true,
    task: mockTask,
    year: 2026,
    month: 3,
    onClose: vi.fn(),
    onUpdated: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("タスクの情報がフォームに表示される", () => {
    renderWithQueryClient(<TaskDetailModal {...defaultProps} />);

    expect(screen.getByText("タスクの詳細")).toBeInTheDocument();
    expect(screen.getByDisplayValue("既存タスク")).toBeInTheDocument();
    expect(screen.getByDisplayValue("既存の説明")).toBeInTheDocument();
    expect(screen.getByDisplayValue("2026-03-15")).toBeInTheDocument();
  });

  it("タイトルを変更して保存できる", async () => {
    mockUpdateTask.mockResolvedValue({ ...mockTask, title: "変更後" });
    const user = userEvent.setup();
    renderWithQueryClient(<TaskDetailModal {...defaultProps} />);

    const titleInput = screen.getByLabelText(/タイトル/);
    await user.clear(titleInput);
    await user.type(titleInput, "変更後");
    await user.click(screen.getByText("保存"));

    await waitFor(() => {
      expect(mockUpdateTask).toHaveBeenCalledWith(
        "task-1",
        expect.objectContaining({ title: "変更後" }),
      );
    });
    await waitFor(() => {
      expect(defaultProps.onUpdated).toHaveBeenCalled();
    });
  });

  it("削除ボタンで確認ダイアログが表示され、確認後に削除できる", async () => {
    mockDeleteTask.mockResolvedValue(undefined);

    const user = userEvent.setup();
    renderWithQueryClient(<TaskDetailModal {...defaultProps} />);

    await user.click(screen.getByText("削除"));

    expect(screen.getByText("タスクの削除")).toBeInTheDocument();
    expect(
      screen.getByText("このタスクを削除しますか？この操作は取り消せません。"),
    ).toBeInTheDocument();

    const confirmDialog = screen.getByRole("dialog", { name: "タスクの削除" });
    await user.click(
      within(confirmDialog).getByRole("button", { name: "削除" }),
    );

    await waitFor(() => {
      expect(mockDeleteTask).toHaveBeenCalledWith("task-1");
    });
    await waitFor(() => {
      expect(defaultProps.onUpdated).toHaveBeenCalled();
    });
  });

  it("削除確認ダイアログでキャンセルすると削除されない", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<TaskDetailModal {...defaultProps} />);

    await user.click(screen.getByText("削除"));

    expect(screen.getByText("タスクの削除")).toBeInTheDocument();

    const confirmDialog = screen.getByRole("dialog", { name: "タスクの削除" });
    await user.click(
      within(confirmDialog).getByRole("button", { name: "キャンセル" }),
    );

    await waitFor(() => {
      expect(screen.queryByText("タスクの削除")).not.toBeInTheDocument();
    });
    expect(mockDeleteTask).not.toHaveBeenCalled();
  });

  it("キャンセルで onClose が呼ばれる", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<TaskDetailModal {...defaultProps} />);

    await user.click(screen.getByText("キャンセル"));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it("更新失敗時にエラーメッセージを表示する", async () => {
    mockUpdateTask.mockRejectedValue(new Error("更新失敗"));
    const user = userEvent.setup();
    renderWithQueryClient(<TaskDetailModal {...defaultProps} />);

    await user.click(screen.getByText("保存"));

    await waitFor(() => {
      expect(
        screen.getByText("タスクの更新に失敗しました"),
      ).toBeInTheDocument();
    });
    expect(defaultProps.onUpdated).not.toHaveBeenCalled();
  });

  it("削除失敗時にエラーメッセージを表示する", async () => {
    mockDeleteTask.mockRejectedValue(new Error("削除失敗"));

    const user = userEvent.setup();
    renderWithQueryClient(<TaskDetailModal {...defaultProps} />);

    await user.click(screen.getByText("削除"));

    const confirmDialog = screen.getByRole("dialog", { name: "タスクの削除" });
    await user.click(
      within(confirmDialog).getByRole("button", { name: "削除" }),
    );

    await waitFor(() => {
      expect(
        screen.getByText("タスクの削除に失敗しました"),
      ).toBeInTheDocument();
    });
    expect(defaultProps.onUpdated).not.toHaveBeenCalled();
  });

  it("description が null のタスクでも正しく表示される", () => {
    renderWithQueryClient(
      <TaskDetailModal
        {...defaultProps}
        task={{ ...mockTask, description: null }}
      />,
    );

    expect(screen.getByLabelText(/説明/)).toHaveValue("");
  });
});
