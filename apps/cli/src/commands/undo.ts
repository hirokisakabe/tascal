import { defineCommand } from "citty";
import { consola } from "consola";
import { requireAuthClient, handleApiError } from "../api.js";

export default defineCommand({
  meta: {
    name: "undo",
    description: "タスクのステータスを todo に戻す",
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

    const res = await client.api.tasks[":id"].$patch({
      param: { id: args.id },
      json: { status: "todo" },
    });

    if (!res.ok) {
      await handleApiError(res, "タスクの更新に失敗しました。");
    }

    const task = (await res.json()) as { id: string; title: string };
    consola.success(`タスクを未完了に戻しました: ${task.title}`);
  },
});
