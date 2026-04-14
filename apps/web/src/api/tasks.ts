import type { InferResponseType } from "hono/client";
import { client } from "./client";

type Task = InferResponseType<typeof client.api.tasks.$get, 200>[number];

export type { Task };

export async function fetchTasks(
  year: number,
  month: number,
  signal?: AbortSignal,
): Promise<Task[]> {
  const res = await client.api.tasks.$get(
    { query: { year: String(year), month: String(month) } },
    { init: { signal } },
  );
  if (!res.ok) {
    throw new Error("タスクの取得に失敗しました");
  }
  return res.json();
}

export async function createTask(data: {
  title: string;
  description?: string | null;
  date: string;
  status?: "todo" | "done";
  categoryId?: string | null;
}): Promise<Task> {
  const res = await client.api.tasks.$post({ json: data });
  if (!res.ok) {
    throw new Error("タスクの作成に失敗しました");
  }
  return res.json();
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
  const res = await client.api.tasks[":id"].$patch({
    param: { id },
    json: data,
  });
  if (!res.ok) {
    throw new Error("タスクの更新に失敗しました");
  }
  return res.json();
}

export async function deleteTask(id: string): Promise<void> {
  const res = await client.api.tasks[":id"].$delete({ param: { id } });
  if (!res.ok) {
    throw new Error("タスクの削除に失敗しました");
  }
}
