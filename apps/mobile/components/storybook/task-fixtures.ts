import type { Task } from "@/types/task";

const baseTask: Task = {
  id: "task-1",
  userId: "storybook-user",
  title: "買い物リストを確認する",
  description: null,
  date: "2026-08-08",
  status: "todo",
  categoryId: null,
  createdAt: "2026-08-08T00:00:00.000Z",
  updatedAt: "2026-08-08T00:00:00.000Z",
};

export function createTask(overrides: Partial<Task> = {}): Task {
  return { ...baseTask, ...overrides };
}

export const representativeTasks: Task[] = [
  baseTask,
  createTask({
    id: "task-2",
    status: "done",
    title: "完了したタスク",
  }),
  createTask({
    id: "task-3",
    title:
      "複数行になった場合の省略表示を確認するための、とても長いタスクタイトル",
  }),
];
