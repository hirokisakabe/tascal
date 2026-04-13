import { defineCommand } from "citty";
import { consola } from "consola";
import { requireAuth, apiRequest, handleApiError } from "../../api.js";

interface Category {
  id: string;
  name: string;
  color: string;
}

export default defineCommand({
  meta: {
    name: "list",
    description: "カテゴリ一覧を表示する",
  },
  async run() {
    const ctx = await requireAuth();

    const res = await apiRequest(ctx, "GET", "/api/categories");

    if (!res.ok) {
      await handleApiError(res, "カテゴリの取得に失敗しました。");
    }

    const categories = (await res.json()) as Category[];

    if (categories.length === 0) {
      consola.info("カテゴリはありません。");
      return;
    }

    consola.info(`カテゴリ (${categories.length}件):\n`);

    for (const category of categories) {
      console.log(`  ${category.name} [${category.color}] (${category.id})`);
    }
  },
});
