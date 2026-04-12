import { defineCommand } from "citty";
import { consola } from "consola";
import { requireAuth, apiRequest, handleApiError } from "../api.js";

interface Task {
  id: string;
  title: string;
}

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
    const ctx = await requireAuth();

    const res = await apiRequest(ctx, "PATCH", `/api/tasks/${args.id}`, {
      status: "todo",
    });

    if (!res.ok) {
      await handleApiError(res, "タスクの更新に失敗しました。");
    }

    const task = (await res.json()) as Task;
    consola.success(`タスクを未完了に戻しました: ${task.title}`);
  },
});
