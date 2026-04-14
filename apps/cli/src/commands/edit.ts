import { defineCommand } from "citty";
import { consola } from "consola";
import { requireAuthClient, handleApiError } from "../api.js";

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
    category: {
      type: "string",
      description: "カテゴリ ID",
    },
  },
  async run({ args }) {
    const client = await requireAuthClient();

    const json: Record<string, string> = {};
    if (args.title) json.title = args.title;
    if (args.date) json.date = args.date;
    if (args.description !== undefined) json.description = args.description;
    if (args.category) json.categoryId = args.category;

    if (Object.keys(json).length === 0) {
      consola.error(
        "更新する項目を指定してください (--title, --date, --description, --category)。",
      );
      process.exit(1);
    }

    const res = await client.api.tasks[":id"].$patch({
      param: { id: args.id },
      json,
    });

    if (!res.ok) {
      await handleApiError(res, "タスクの更新に失敗しました。");
    }

    const task = (await res.json()) as { id: string; title: string };
    consola.success(`タスクを更新しました: ${task.title} (${task.id})`);
  },
});
