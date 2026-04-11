import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Calendar } from "../Calendar";
import { renderWithQueryClient } from "../../test/helpers";

// API モック
const mockFetchTasks = vi.fn();
const mockCreateTask = vi.fn();
const mockUpdateTask = vi.fn();
const mockDeleteTask = vi.fn();

vi.mock("../../api/tasks", () => ({
  fetchTasks: (...args: unknown[]) => mockFetchTasks(...args) as unknown,
  createTask: (...args: unknown[]) => mockCreateTask(...args) as unknown,
  updateTask: (...args: unknown[]) => mockUpdateTask(...args) as unknown,
  deleteTask: (...args: unknown[]) => mockDeleteTask(...args) as unknown,
}));

// dnd-kit モック - onDragEnd をキャプチャして手動発火可能にする
let capturedOnDragEnd: ((event: unknown) => void) | null = null;

vi.mock("@dnd-kit/core", () => ({
  DndContext: ({
    children,
    onDragEnd,
  }: {
    children: React.ReactNode;
    onDragEnd?: (event: unknown) => void;
  }) => {
    capturedOnDragEnd = onDragEnd ?? null;
    return <div>{children}</div>;
  },
  useDraggable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    isDragging: false,
  }),
  useDroppable: () => ({
    setNodeRef: vi.fn(),
    isOver: false,
  }),
}));

const mockTask = {
  id: "task-1",
  title: "テストタスク",
  description: "テスト説明",
  date: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-15`,
  status: "todo" as const,
  userId: "user-1",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("Calendar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchTasks.mockResolvedValue([]);
  });

  it("年月ヘッダーと曜日ラベルが表示される", async () => {
    renderWithQueryClient(<Calendar />);

    const now = new Date();
    await waitFor(() => {
      expect(
        screen.getByText(`${now.getFullYear()}年${now.getMonth() + 1}月`),
      ).toBeInTheDocument();
    });

    for (const label of ["日", "月", "火", "水", "木", "金", "土"]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it("マウント時にタスクを取得して表示する", async () => {
    mockFetchTasks.mockResolvedValue([mockTask]);
    renderWithQueryClient(<Calendar />);

    await waitFor(() => {
      expect(screen.getByText("テストタスク")).toBeInTheDocument();
    });

    expect(mockFetchTasks).toHaveBeenCalledWith(
      expect.any(Number),
      expect.any(Number),
      expect.any(AbortSignal),
    );
  });

  it("前月・次月ボタンで月を切り替えられる", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<Calendar />);

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    await waitFor(() => {
      expect(
        screen.getByText(`${currentYear}年${currentMonth}月`),
      ).toBeInTheDocument();
    });

    // 次月
    await user.click(screen.getByText("→"));

    const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
    const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear;
    await waitFor(() => {
      expect(
        screen.getByText(`${nextYear}年${nextMonth}月`),
      ).toBeInTheDocument();
    });

    // 前月（元に戻る）
    await user.click(screen.getByText("←"));
    await waitFor(() => {
      expect(
        screen.getByText(`${currentYear}年${currentMonth}月`),
      ).toBeInTheDocument();
    });
  });

  it("「今日」ボタンで今月に戻れる", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<Calendar />);

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    await waitFor(() => {
      expect(
        screen.getByText(`${currentYear}年${currentMonth}月`),
      ).toBeInTheDocument();
    });

    // 別の月に移動
    await user.click(screen.getByText("→"));
    await user.click(screen.getByText("→"));

    // 今日ボタンで戻る
    await user.click(screen.getByText("今日"));
    await waitFor(() => {
      expect(
        screen.getByText(`${currentYear}年${currentMonth}月`),
      ).toBeInTheDocument();
    });
  });

  it("タスク取得失敗時にエラーメッセージを表示する", async () => {
    mockFetchTasks.mockRejectedValue(new Error("API error"));
    renderWithQueryClient(<Calendar />);

    await waitFor(() => {
      expect(
        screen.getByText("タスクの取得に失敗しました"),
      ).toBeInTheDocument();
    });
  });

  it("＋ボタンからタスク作成モーダルを開いて作成できる", async () => {
    mockFetchTasks.mockResolvedValue([]);
    mockCreateTask.mockResolvedValue(mockTask);

    const user = userEvent.setup();
    renderWithQueryClient(<Calendar />);

    await waitFor(() => {
      expect(mockFetchTasks).toHaveBeenCalled();
    });

    // 日付セルの + ボタンをクリック
    const addButtons = screen.getAllByRole("button", {
      name: /にタスクを追加/,
    });
    await user.click(addButtons[0]);

    // モーダルが表示される
    expect(screen.getByText(/タスクを追加/)).toBeInTheDocument();

    // タイトルを入力して送信
    const titleInput = screen.getByLabelText(/タイトル/);
    await user.type(titleInput, "新しいタスク");
    await user.click(screen.getByText("追加"));

    await waitFor(() => {
      expect(mockCreateTask).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "新しいタスク",
        }),
      );
    });
  });

  it("タスクをクリックして詳細モーダルを開き編集できる", async () => {
    mockFetchTasks.mockResolvedValue([mockTask]);
    mockUpdateTask.mockResolvedValue({ ...mockTask, title: "更新後タスク" });

    const user = userEvent.setup();
    renderWithQueryClient(<Calendar />);

    // タスクが表示されるのを待つ
    await waitFor(() => {
      expect(screen.getByText("テストタスク")).toBeInTheDocument();
    });

    // タスク名をクリック
    await user.click(screen.getByText("テストタスク"));

    // 詳細モーダルが表示される
    expect(screen.getByText("タスクの詳細")).toBeInTheDocument();

    // タイトルを変更して保存
    const titleInput = screen.getByLabelText(/タイトル/);
    await user.clear(titleInput);
    await user.type(titleInput, "更新後タスク");
    await user.click(screen.getByText("保存"));

    await waitFor(() => {
      expect(mockUpdateTask).toHaveBeenCalledWith(
        mockTask.id,
        expect.objectContaining({
          title: "更新後タスク",
        }),
      );
    });
  });

  it("詳細モーダルからタスクを削除できる", async () => {
    mockFetchTasks.mockResolvedValue([mockTask]);
    mockDeleteTask.mockResolvedValue(undefined);
    vi.spyOn(window, "confirm").mockReturnValue(true);

    const user = userEvent.setup();
    renderWithQueryClient(<Calendar />);

    await waitFor(() => {
      expect(screen.getByText("テストタスク")).toBeInTheDocument();
    });

    await user.click(screen.getByText("テストタスク"));
    expect(screen.getByText("タスクの詳細")).toBeInTheDocument();

    await user.click(screen.getByText("削除"));

    await waitFor(() => {
      expect(mockDeleteTask).toHaveBeenCalledWith(mockTask.id);
    });
  });

  it("タスク作成モーダルのキャンセルで閉じる", async () => {
    mockFetchTasks.mockResolvedValue([]);

    const user = userEvent.setup();
    renderWithQueryClient(<Calendar />);

    await waitFor(() => {
      expect(mockFetchTasks).toHaveBeenCalled();
    });

    const addButtons = screen.getAllByRole("button", {
      name: /にタスクを追加/,
    });
    await user.click(addButtons[0]);
    expect(screen.getByText(/タスクを追加/)).toBeInTheDocument();

    await user.click(screen.getByText("キャンセル"));

    await waitFor(() => {
      expect(screen.queryByText(/タスクを追加/)).not.toBeInTheDocument();
    });
  });

  it("ドラッグ&ドロップでタスクの日付を更新できる", async () => {
    mockFetchTasks.mockResolvedValue([mockTask]);
    mockUpdateTask.mockResolvedValue({ ...mockTask, date: "2026-03-20" });

    renderWithQueryClient(<Calendar />);

    await waitFor(() => {
      expect(screen.getByText("テストタスク")).toBeInTheDocument();
    });

    // DndContext の onDragEnd を手動発火
    expect(capturedOnDragEnd).not.toBeNull();
    capturedOnDragEnd!({
      active: { id: mockTask.id, data: { current: { task: mockTask } } },
      over: { id: "2026-03-20" },
    });

    await waitFor(() => {
      expect(mockUpdateTask).toHaveBeenCalledWith(mockTask.id, {
        date: "2026-03-20",
      });
    });
  });

  it("同じ日付へのドロップでは更新しない", async () => {
    mockFetchTasks.mockResolvedValue([mockTask]);

    renderWithQueryClient(<Calendar />);

    await waitFor(() => {
      expect(screen.getByText("テストタスク")).toBeInTheDocument();
    });

    capturedOnDragEnd!({
      active: { id: mockTask.id, data: { current: { task: mockTask } } },
      over: { id: mockTask.date },
    });

    expect(mockUpdateTask).not.toHaveBeenCalled();
  });

  it("ドロップ先がない場合は更新しない", async () => {
    mockFetchTasks.mockResolvedValue([mockTask]);

    renderWithQueryClient(<Calendar />);

    await waitFor(() => {
      expect(screen.getByText("テストタスク")).toBeInTheDocument();
    });

    capturedOnDragEnd!({
      active: { id: mockTask.id, data: { current: { task: mockTask } } },
      over: null,
    });

    expect(mockUpdateTask).not.toHaveBeenCalled();
  });

  it("チェックボックスでタスクのステータスを切り替えられる", async () => {
    mockFetchTasks.mockResolvedValue([mockTask]);
    mockUpdateTask.mockResolvedValue({ ...mockTask, status: "done" });

    const user = userEvent.setup();
    renderWithQueryClient(<Calendar />);

    await waitFor(() => {
      expect(screen.getByText("テストタスク")).toBeInTheDocument();
    });

    const checkbox = screen.getByRole("checkbox");
    await user.click(checkbox);

    await waitFor(() => {
      expect(mockUpdateTask).toHaveBeenCalledWith(mockTask.id, {
        status: "done",
      });
    });
  });
});
