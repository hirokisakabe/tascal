import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DraggableTask } from "./DraggableTask";
import type { Task } from "../types/task";
import type { Category } from "../types/category";
import { CATEGORY_COLORS } from "../constants/categoryColors";

vi.mock("@dnd-kit/core", () => ({
  useDraggable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    isDragging: false,
  }),
}));

const baseTask: Task = {
  id: "task-1",
  title: "テストタスク",
  description: null,
  date: "2026-04-15",
  status: "todo",
  categoryId: "cat-1",
  userId: "user-1",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const category: Category = {
  id: "cat-1",
  name: "仕事",
  color: "blue",
  userId: "user-1",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const noop = vi.fn();

describe("DraggableTask", () => {
  it("todo タスクにカテゴリ背景色が適用される", () => {
    render(
      <DraggableTask
        task={baseTask}
        category={category}
        onTaskClick={noop}
        onToggleStatus={noop}
      />,
    );

    const el = screen.getByText("テストタスク").closest("div[class]")!;
    expect(el).toHaveStyle({
      backgroundColor: CATEGORY_COLORS.blue.bg,
    });
  });

  it("done タスクにもカテゴリ背景色が適用される", () => {
    const doneTask: Task = { ...baseTask, status: "done" };
    render(
      <DraggableTask
        task={doneTask}
        category={category}
        onTaskClick={noop}
        onToggleStatus={noop}
      />,
    );

    const el = screen.getByText("テストタスク").closest("div[class]")!;
    expect(el).toHaveStyle({
      backgroundColor: CATEGORY_COLORS.blue.bg,
    });
    expect(el).toHaveClass("line-through");
  });

  it("タスク行クリックで onTaskClick が呼ばれる", async () => {
    const onTaskClick = vi.fn();
    const user = userEvent.setup();
    render(
      <DraggableTask
        task={baseTask}
        category={category}
        onTaskClick={onTaskClick}
        onToggleStatus={noop}
      />,
    );

    const row = screen.getByText("テストタスク").closest("div[class]")!;
    await user.click(row);

    expect(onTaskClick).toHaveBeenCalledWith(baseTask);
  });

  it("チェックボックスクリックで onTaskClick は呼ばれない", async () => {
    const onTaskClick = vi.fn();
    const onToggleStatus = vi.fn();
    const user = userEvent.setup();
    render(
      <DraggableTask
        task={baseTask}
        category={category}
        onTaskClick={onTaskClick}
        onToggleStatus={onToggleStatus}
      />,
    );

    const checkbox = screen.getByRole("checkbox");
    await user.click(checkbox);

    expect(onToggleStatus).toHaveBeenCalledWith(baseTask);
    expect(onTaskClick).not.toHaveBeenCalled();
  });

  it("カテゴリ未設定の done タスクは白背景", () => {
    const doneTaskNoCategory: Task = {
      ...baseTask,
      status: "done",
      categoryId: null,
    };
    render(
      <DraggableTask
        task={doneTaskNoCategory}
        category={null}
        onTaskClick={noop}
        onToggleStatus={noop}
      />,
    );

    const el = screen.getByText("テストタスク").closest("div[class]")!;
    expect(el).not.toHaveStyle({ backgroundColor: CATEGORY_COLORS.blue.bg });
    expect(el).toHaveClass("line-through");
    expect(el).toHaveClass("border");
  });
});
