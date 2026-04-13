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
    name: "add",
    description: "カテゴリを作成する",
  },
  args: {
    name: {
      type: "string",
      description: "カテゴリ名",
      required: true,
    },
    color: {
      type: "string",
      description: "色 (red, orange, yellow, green, teal, blue, purple, pink)",
      required: true,
    },
  },
  async run({ args }) {
    const ctx = await requireAuth();

    const res = await apiRequest(ctx, "POST", "/api/categories", {
      name: args.name,
      color: args.color,
    });

    if (!res.ok) {
      await handleApiError(res, "カテゴリの作成に失敗しました。");
    }

    const category = (await res.json()) as Category;
    consola.success(
      `カテゴリを作成しました: ${category.name} (${category.id})`,
    );
  },
});
