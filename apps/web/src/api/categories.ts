import type { Category, CategoryColor } from "../types/category";

export async function fetchCategories(): Promise<Category[]> {
  const res = await fetch("/api/categories");
  if (!res.ok) {
    throw new Error("カテゴリの取得に失敗しました");
  }
  return res.json() as Promise<Category[]>;
}

export async function createCategory(data: {
  name: string;
  color: CategoryColor;
}): Promise<Category> {
  const res = await fetch("/api/categories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error("カテゴリの作成に失敗しました");
  }
  return res.json() as Promise<Category>;
}

export async function updateCategory(
  id: string,
  data: {
    name?: string;
    color?: CategoryColor;
  },
): Promise<Category> {
  const res = await fetch(`/api/categories/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error("カテゴリの更新に失敗しました");
  }
  return res.json() as Promise<Category>;
}

export async function deleteCategory(id: string): Promise<void> {
  const res = await fetch(`/api/categories/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    throw new Error("カテゴリの削除に失敗しました");
  }
}
