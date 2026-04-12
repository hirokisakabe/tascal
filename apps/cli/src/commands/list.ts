import { defineCommand } from "citty";
import { consola } from "consola";
import { requireAuth, apiRequest, handleApiError } from "../api.js";

interface Task {
  id: string;
  title: string;
  description: string | null;
  date: string;
  status: "todo" | "done";
}

export default defineCommand({
  meta: {
    name: "list",
    description: "タスク一覧を表示する",
  },
  args: {
    year: {
      type: "string",
      description: "年 (デフォルト: 今年)",
    },
    month: {
      type: "string",
      description: "月 (デフォルト: 今月)",
    },
  },
  async run({ args }) {
    const ctx = await requireAuth();

    const now = new Date();
    const year = args.year ? Number(args.year) : now.getFullYear();
    const month = args.month ? Number(args.month) : now.getMonth() + 1;

    const res = await apiRequest(
      ctx,
      "GET",
      `/api/tasks?year=${year}&month=${month}`,
    );

    if (!res.ok) {
      await handleApiError(res, "タスクの取得に失敗しました。");
    }

    const tasks = (await res.json()) as Task[];

    if (tasks.length === 0) {
      consola.info(`${year}年${month}月のタスクはありません。`);
      return;
    }

    consola.info(`${year}年${month}月のタスク (${tasks.length}件):\n`);

    const sorted = tasks.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    for (const task of sorted) {
      const status = task.status === "done" ? "✔" : "○";
      const desc = task.description ? `  ${task.description}` : "";
      console.log(`  ${status} [${task.date}] ${task.title} (${task.id})`);
      if (desc) {
        console.log(`    ${task.description}`);
      }
    }
  },
});
