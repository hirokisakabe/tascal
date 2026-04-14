import type { InferResponseType } from "hono/client";
import { client } from "./client";

type Category = InferResponseType<
  typeof client.api.categories.$get,
  200
>[number];

export type { Category };

export async function fetchCategories(): Promise<Category[]> {
  const res = await client.api.categories.$get();
  if (!res.ok) {
    throw new Error("カテゴリの取得に失敗しました");
  }
  return res.json();
}

export async function createCategory(data: {
  name: string;
  color: Category["color"];
}): Promise<Category> {
  const res = await client.api.categories.$post({ json: data });
  if (!res.ok) {
    throw new Error("カテゴリの作成に失敗しました");
  }
  return res.json();
}

export async function updateCategory(
  id: string,
  data: {
    name?: string;
    color?: Category["color"];
  },
): Promise<Category> {
  const res = await client.api.categories[":id"].$patch({
    param: { id },
    json: data,
  });
  if (!res.ok) {
    throw new Error("カテゴリの更新に失敗しました");
  }
  return res.json();
}

export async function deleteCategory(id: string): Promise<void> {
  const res = await client.api.categories[":id"].$delete({ param: { id } });
  if (!res.ok) {
    throw new Error("カテゴリの削除に失敗しました");
  }
}
