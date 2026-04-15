import { defineCommand } from "citty";
import { consola } from "consola";
import { requireAuthClient, handleApiError } from "../api.js";

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
    const client = await requireAuthClient();

    const now = new Date();
    const year = args.year ? Number(args.year) : now.getFullYear();
    const month = args.month ? Number(args.month) : now.getMonth() + 1;

    const [tasksRes, categoriesRes] = await Promise.all([
      client.api.tasks.$get({
        query: { year: String(year), month: String(month) },
      }),
      client.api.categories.$get(),
    ]);

    if (!tasksRes.ok) {
      await handleApiError(tasksRes, "タスクの取得に失敗しました。");
    }

    const tasks = await tasksRes.json();
    let categories: { id: string; name: string }[] = [];
    if (categoriesRes.ok) {
      categories = await categoriesRes.json();
    }
    const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

    if (tasks.length === 0) {
      consola.info(`${year}年${month}月のタスクはありません。`);
      return;
    }

    consola.info(`${year}年${month}月のタスク (${tasks.length}件):\n`);

    const sorted = [...tasks].sort((a, b) => {
      if (!a.date && !b.date) return 0;
      if (!a.date) return 1;
      if (!b.date) return -1;
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

    for (const task of sorted) {
      const status = task.status === "done" ? "✔" : "○";
      const categoryName = task.categoryId
        ? categoryMap.get(task.categoryId)
        : null;
      const categoryLabel = categoryName ? ` [${categoryName}]` : "";
      const dateLabel = task.date ?? "未定";
      console.log(
        `  ${status} [${dateLabel}] ${task.title}${categoryLabel} (${task.id})`,
      );
      if (task.description) {
        console.log(`    ${task.description}`);
      }
    }
  },
});
