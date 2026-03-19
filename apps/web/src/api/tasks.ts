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
