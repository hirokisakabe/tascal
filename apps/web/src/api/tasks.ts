import type {
  Task,
  TaskCreateInput,
  TaskUpdateInput,
} from "@tascal/shared/api-contract";
import { client } from "./client";

export type { Task };

export async function fetchTasks(
  startDate: string,
  endDate: string,
  signal?: AbortSignal,
): Promise<Task[]> {
  const res = await client.api.tasks.range.$get(
    { query: { startDate, endDate } },
    { init: { signal } },
  );
  if (!res.ok) {
    throw new Error("タスクの取得に失敗しました");
  }
  return res.json();
}

export async function fetchUnscheduledTasks(
  signal?: AbortSignal,
): Promise<Task[]> {
  const res = await client.api.tasks.unscheduled.$get({}, { init: { signal } });
  if (!res.ok) {
    throw new Error("未スケジュールタスクの取得に失敗しました");
  }
  return res.json();
}

export async function createTask(data: TaskCreateInput): Promise<Task> {
  const res = await client.api.tasks.$post({ json: data });
  if (!res.ok) {
    throw new Error("タスクの作成に失敗しました");
  }
  return res.json();
}

export async function updateTask(
  id: string,
  data: TaskUpdateInput,
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
