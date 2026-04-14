import { defineCommand } from "citty";
import { consola } from "consola";
import { requireAuthClient, handleApiError } from "../api.js";

export default defineCommand({
  meta: {
    name: "done",
    description: "タスクのステータスを done に変更する",
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
      json: { status: "done" },
    });

    if (!res.ok) {
      await handleApiError(res, "タスクの更新に失敗しました。");
    }

    const task = (await res.json()) as { id: string; title: string };
    consola.success(`タスクを完了にしました: ${task.title}`);
  },
});
