import { defineCommand } from "citty";
import { consola } from "consola";
import { requireAuth, apiRequest, handleApiError } from "../api.js";

interface Task {
  id: string;
  title: string;
}

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
    const ctx = await requireAuth();

    const res = await apiRequest(ctx, "PATCH", `/api/tasks/${args.id}`, {
      status: "done",
    });

    if (!res.ok) {
      await handleApiError(res, "タスクの更新に失敗しました。");
    }

    const task = (await res.json()) as Task;
    consola.success(`タスクを完了にしました: ${task.title}`);
  },
});
