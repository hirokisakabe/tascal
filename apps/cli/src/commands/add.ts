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
      description: "日付 (YYYY-MM-DD)",
      required: true,
    },
    description: {
      type: "string",
      description: "タスクの説明",
    },
  },
  async run({ args }) {
    const ctx = await requireAuth();

    const body: Record<string, string> = {
      title: args.title,
      date: args.date,
    };

    if (args.description) {
      body.description = args.description;
    }

    const res = await apiRequest(ctx, "POST", "/api/tasks", body);

    if (!res.ok) {
      await handleApiError(res, "タスクの作成に失敗しました。");
    }

    const task = (await res.json()) as Task;
    consola.success(`タスクを作成しました: ${task.title} (${task.id})`);
  },
});
