import { defineCommand } from "citty";
import { consola } from "consola";
import { requireAuthClient, handleApiError } from "../../api.js";

export default defineCommand({
  meta: {
    name: "add",
    description: "カテゴリを作成する",
  },
  args: {
    name: {
      type: "string",
      description: "カテゴリ名",
      required: true,
    },
    color: {
      type: "string",
      description: "色 (red, orange, yellow, green, teal, blue, purple, pink)",
      required: true,
    },
  },
  async run({ args }) {
    const client = await requireAuthClient();

    const res = await client.api.categories.$post({
      json: {
        name: args.name,
        color: args.color as
          | "red"
          | "orange"
          | "yellow"
          | "green"
          | "teal"
          | "blue"
          | "purple"
          | "pink",
      },
    });

    if (!res.ok) {
      await handleApiError(res, "カテゴリの作成に失敗しました。");
    }

    const category = (await res.json()) as { id: string; name: string };
    consola.success(
      `カテゴリを作成しました: ${category.name} (${category.id})`,
    );
  },
});
