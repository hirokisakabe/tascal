import { defineCommand } from "citty";
import { consola } from "consola";
import { requireAuthClient, handleApiError } from "../../api.js";

export default defineCommand({
  meta: {
    name: "list",
    description: "カテゴリ一覧を表示する",
  },
  async run() {
    const client = await requireAuthClient();

    const res = await client.api.categories.$get();

    if (!res.ok) {
      await handleApiError(res, "カテゴリの取得に失敗しました。");
    }

    const categories = await res.json();

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
