import type {
  Category,
  CategoryCreateInput,
  CategoryUpdateInput,
} from "@tascal/shared/api-contract";
import { client } from "./client";

export async function fetchCategories(): Promise<Category[]> {
  const res = await client.api.categories.$get();
  if (!res.ok) {
    throw new Error("カテゴリの取得に失敗しました");
  }
  return res.json();
}

export async function createCategory(
  data: CategoryCreateInput,
): Promise<Category> {
  const res = await client.api.categories.$post({ json: data });
  if (!res.ok) {
    throw new Error("カテゴリの作成に失敗しました");
  }
  return res.json();
}

export async function updateCategory(
  id: string,
  data: CategoryUpdateInput,
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
