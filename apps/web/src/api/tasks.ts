import type { Task } from "../types/task";

export async function fetchTasks(
  year: number,
  month: number,
  signal?: AbortSignal,
): Promise<Task[]> {
  const res = await fetch(`/api/tasks?year=${year}&month=${month}`, { signal });
  if (!res.ok) {
    throw new Error("タスクの取得に失敗しました");
  }
  return res.json() as Promise<Task[]>;
}

export async function createTask(data: {
  title: string;
  description?: string | null;
  date: string;
  status?: "todo" | "done";
  categoryId?: string | null;
}): Promise<Task> {
  const res = await fetch("/api/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error("タスクの作成に失敗しました");
  }
  return res.json() as Promise<Task>;
}

export async function updateTask(
  id: string,
  data: {
    title?: string;
    description?: string | null;
    date?: string;
    status?: "todo" | "done";
    categoryId?: string | null;
  },
): Promise<Task> {
  const res = await fetch(`/api/tasks/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error("タスクの更新に失敗しました");
  }
  return res.json() as Promise<Task>;
}

export async function deleteTask(id: string): Promise<void> {
  const res = await fetch(`/api/tasks/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    throw new Error("タスクの削除に失敗しました");
  }
}
