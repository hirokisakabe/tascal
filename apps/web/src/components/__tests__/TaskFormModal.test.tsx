import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TaskFormModal } from "../TaskFormModal";

const mockCreateTask = vi.fn();

vi.mock("../../api/tasks", () => ({
  createTask: (...args: unknown[]) => mockCreateTask(...args) as unknown,
}));

describe("TaskFormModal", () => {
  const defaultProps = {
    date: "2026-03-15",
    onClose: vi.fn(),
    onCreated: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("日付付きのタイトルが表示される", () => {
    render(<TaskFormModal {...defaultProps} />);
    expect(screen.getByText("タスクを追加（2026-03-15）")).toBeInTheDocument();
  });

  it("タイトルと説明を入力してタスクを作成できる", async () => {
    mockCreateTask.mockResolvedValue({});
    const user = userEvent.setup();
    render(<TaskFormModal {...defaultProps} />);

    await user.type(screen.getByLabelText(/タイトル/), "新規タスク");
    await user.type(screen.getByLabelText(/説明/), "タスクの説明文");
    await user.click(screen.getByText("追加"));

    await waitFor(() => {
      expect(mockCreateTask).toHaveBeenCalledWith({
        title: "新規タスク",
        description: "タスクの説明文",
        date: "2026-03-15",
      });
    });
    expect(defaultProps.onCreated).toHaveBeenCalled();
  });

  it("タイトル未入力では追加ボタンが無効化される", () => {
    render(<TaskFormModal {...defaultProps} />);
    expect(screen.getByText("追加")).toBeDisabled();
  });

  it("説明が空の場合 null が送信される", async () => {
    mockCreateTask.mockResolvedValue({});
    const user = userEvent.setup();
    render(<TaskFormModal {...defaultProps} />);

    await user.type(screen.getByLabelText(/タイトル/), "タスク");
    await user.click(screen.getByText("追加"));

    await waitFor(() => {
      expect(mockCreateTask).toHaveBeenCalledWith({
        title: "タスク",
        description: null,
        date: "2026-03-15",
      });
    });
  });

  it("キャンセルで onClose が呼ばれる", async () => {
    const user = userEvent.setup();
    render(<TaskFormModal {...defaultProps} />);

    await user.click(screen.getByText("キャンセル"));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it("作成失敗時にエラーメッセージを表示する", async () => {
    mockCreateTask.mockRejectedValue(new Error("作成失敗"));
    const user = userEvent.setup();
    render(<TaskFormModal {...defaultProps} />);

    await user.type(screen.getByLabelText(/タイトル/), "タスク");
    await user.click(screen.getByText("追加"));

    await waitFor(() => {
      expect(
        screen.getByText("タスクの作成に失敗しました"),
      ).toBeInTheDocument();
    });
    expect(defaultProps.onCreated).not.toHaveBeenCalled();
  });
});
