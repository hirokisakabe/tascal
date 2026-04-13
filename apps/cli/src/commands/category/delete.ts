import { defineCommand } from "citty";
import { consola } from "consola";
import { requireAuth, apiRequest, handleApiError } from "../../api.js";

export default defineCommand({
  meta: {
    name: "delete",
    description: "カテゴリを削除する",
  },
  args: {
    id: {
      type: "positional",
      description: "カテゴリ ID",
      required: true,
    },
  },
  async run({ args }) {
    const ctx = await requireAuth();

    const res = await apiRequest(ctx, "DELETE", `/api/categories/${args.id}`);

    if (!res.ok) {
      await handleApiError(res, "カテゴリの削除に失敗しました。");
    }

    consola.success("カテゴリを削除しました。");
  },
});
