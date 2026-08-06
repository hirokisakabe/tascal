import { fireEvent, render, screen } from "@testing-library/react-native";

import { DayTaskBottomSheet } from "@/components/day-task-bottom-sheet";
import type { Task } from "@/types/task";

jest.mock("@/hooks/use-color-scheme", () => ({
  useColorScheme: () => "light",
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ bottom: 0, left: 0, right: 0, top: 0 }),
}));

jest.mock("react-native-reanimated", () => ({
  useReducedMotion: () => false,
}));

jest.mock("@/components/sheet-surface", () => {
  const { View: MockView } = jest.requireActual("react-native");
  return {
    SheetSurface: ({ children }: { children: React.ReactNode }) => (
      <MockView>{children}</MockView>
    ),
  };
});

const completedTask: Task = {
  id: "task-1",
  userId: "user-1",
  title: "完了済みタスク",
  description: null,
  date: "2026-08-06",
  status: "done",
  categoryId: null,
  createdAt: "2026-08-06T00:00:00.000Z",
  updatedAt: "2026-08-06T00:00:00.000Z",
};

describe("DayTaskBottomSheet", () => {
  it("明示的な閉じるボタンとタスク操作を提供する", () => {
    const onClose = jest.fn();
    const onOpenTask = jest.fn();
    const onToggleTask = jest.fn();

    render(
      <DayTaskBottomSheet
        date="2026-08-06"
        onClose={onClose}
        onOpenTask={onOpenTask}
        onToggleTask={onToggleTask}
        tasks={[completedTask]}
        title="8月6日（木）"
        visible
      />,
    );

    const closeButtons = screen.getAllByRole("button", { name: "閉じる" });
    expect(closeButtons).toHaveLength(2);
    fireEvent.press(closeButtons[1]);
    expect(onClose).toHaveBeenCalledTimes(1);

    const taskTitle = screen.getByText("完了済みタスク");
    expect(taskTitle).toHaveStyle({
      color: "#6b6560",
      textDecorationLine: "line-through",
    });

    fireEvent.press(
      screen.getByRole("checkbox", { name: "完了済みタスクを未完了に戻す" }),
    );
    expect(onToggleTask).toHaveBeenCalledWith(completedTask);

    fireEvent.press(taskTitle);
    expect(onOpenTask).toHaveBeenCalledWith(completedTask);
  });
});
