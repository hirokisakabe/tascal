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
    name: "edit",
    description: "カテゴリを更新する",
  },
  args: {
    id: {
      type: "positional",
      description: "カテゴリ ID",
      required: true,
    },
    name: {
      type: "string",
      description: "カテゴリ名",
    },
    color: {
      type: "string",
      description: "色 (red, orange, yellow, green, teal, blue, purple, pink)",
    },
  },
  async run({ args }) {
    const ctx = await requireAuth();

    const body: Record<string, string> = {};
    if (args.name) body.name = args.name;
    if (args.color) body.color = args.color;

    if (Object.keys(body).length === 0) {
      consola.error("更新する項目を指定してください (--name, --color)。");
      process.exit(1);
    }

    const res = await apiRequest(
      ctx,
      "PATCH",
      `/api/categories/${args.id}`,
      body,
    );

    if (!res.ok) {
      await handleApiError(res, "カテゴリの更新に失敗しました。");
    }

    const category = (await res.json()) as Category;
    consola.success(
      `カテゴリを更新しました: ${category.name} (${category.id})`,
    );
  },
});
