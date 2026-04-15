import * as SecureStore from "expo-secure-store";
import { API_BASE_URL } from "@/constants/api";
import type { Task } from "@/types/task";

const TOKEN_KEY = "auth_token";

async function authHeaders(): Promise<Record<string, string>> {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  if (!token) {
    throw new Error("認証トークンがありません");
  }
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

export async function fetchTasks(year: number, month: number): Promise<Task[]> {
  const headers = await authHeaders();
  const res = await fetch(
    `${API_BASE_URL}/api/tasks?year=${year}&month=${month}`,
    { headers },
  );
  if (!res.ok) {
    throw new Error("タスクの取得に失敗しました");
  }
  return res.json();
}

export async function fetchUnscheduledTasks(): Promise<Task[]> {
  const headers = await authHeaders();
  const res = await fetch(`${API_BASE_URL}/api/tasks/unscheduled`, {
    headers,
  });
  if (!res.ok) {
    throw new Error("未スケジュールタスクの取得に失敗しました");
  }
  return res.json();
}

export async function createTask(data: {
  title: string;
  description?: string | null;
  date?: string | null;
  status?: "todo" | "done";
}): Promise<Task> {
  const headers = await authHeaders();
  const res = await fetch(`${API_BASE_URL}/api/tasks`, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });
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
    date?: string | null;
    status?: "todo" | "done";
  },
): Promise<Task> {
  const headers = await authHeaders();
  const res = await fetch(`${API_BASE_URL}/api/tasks/${id}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error("タスクの更新に失敗しました");
  }
  return res.json();
}

export async function deleteTask(id: string): Promise<void> {
  const headers = await authHeaders();
  const res = await fetch(`${API_BASE_URL}/api/tasks/${id}`, {
    method: "DELETE",
    headers,
  });
  if (!res.ok) {
    throw new Error("タスクの削除に失敗しました");
  }
}
