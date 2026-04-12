import { defineCommand } from "citty";
import { consola } from "consola";
import { requireAuth, apiRequest, handleApiError } from "../api.js";

interface Task {
  id: string;
  title: string;
  date: string;
}

export default defineCommand({
  meta: {
    name: "edit",
    description: "タスクを更新する",
  },
  args: {
    id: {
      type: "positional",
      description: "タスク ID",
      required: true,
    },
    title: {
      type: "string",
      description: "タスクのタイトル",
    },
    date: {
      type: "string",
      description: "日付 (YYYY-MM-DD)",
    },
    description: {
      type: "string",
      description: "タスクの説明",
    },
  },
  async run({ args }) {
    const ctx = await requireAuth();

    const body: Record<string, string> = {};
    if (args.title) body.title = args.title;
    if (args.date) body.date = args.date;
    if (args.description !== undefined) body.description = args.description;

    if (Object.keys(body).length === 0) {
      consola.error(
        "更新する項目を指定してください (--title, --date, --description)。",
      );
      process.exit(1);
    }

    const res = await apiRequest(ctx, "PATCH", `/api/tasks/${args.id}`, body);

    if (!res.ok) {
      await handleApiError(res, "タスクの更新に失敗しました。");
    }

    const task = (await res.json()) as Task;
    consola.success(`タスクを更新しました: ${task.title} (${task.id})`);
  },
});
