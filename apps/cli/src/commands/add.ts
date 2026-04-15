import { defineCommand } from "citty";
import { consola } from "consola";
import { requireAuthClient, handleApiError } from "../api.js";

export default defineCommand({
  meta: {
    name: "add",
    description: "タスクを作成する",
  },
  args: {
    title: {
      type: "string",
      description: "タスクのタイトル",
      required: true,
    },
    date: {
      type: "string",
      description: "日付 (YYYY-MM-DD)。省略時は未スケジュールタスクとして作成",
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

    const json: {
      title: string;
      date?: string;
      description?: string;
      categoryId?: string;
    } = {
      title: args.title,
    };

    if (args.date) {
      json.date = args.date;
    }

    if (args.description) {
      json.description = args.description;
    }

    if (args.category) {
      json.categoryId = args.category;
    }

    const res = await client.api.tasks.$post({ json });

    if (!res.ok) {
      await handleApiError(res, "タスクの作成に失敗しました。");
    }

    const task = (await res.json()) as { id: string; title: string };
    consola.success(`タスクを作成しました: ${task.title} (${task.id})`);
  },
});
