import { defineCommand } from "citty";
import { consola } from "consola";
import { requireAuthClient, handleApiError } from "../api.js";

export default defineCommand({
  meta: {
    name: "delete",
    description: "タスクを削除する",
  },
  args: {
    id: {
      type: "positional",
      description: "タスク ID",
      required: true,
    },
  },
  async run({ args }) {
    const client = await requireAuthClient();

    const res = await client.api.tasks[":id"].$delete({
      param: { id: args.id },
    });

    if (!res.ok) {
      await handleApiError(res, "タスクの削除に失敗しました。");
    }

    consola.success("タスクを削除しました。");
  },
});
