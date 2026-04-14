import { defineCommand } from "citty";
import { consola } from "consola";
import { requireAuthClient, handleApiError } from "../../api.js";

export default defineCommand({
  meta: {
    name: "edit",
    description: "カテゴリを更新する",
  },
  args: {
    id: {
      type: "positional",
      description: "カテゴリ ID",
      required: true,
    },
    name: {
      type: "string",
      description: "カテゴリ名",
    },
    color: {
      type: "string",
      description: "色 (red, orange, yellow, green, teal, blue, purple, pink)",
    },
  },
  async run({ args }) {
    const client = await requireAuthClient();

    const json: {
      name?: string;
      color?:
        | "red"
        | "orange"
        | "yellow"
        | "green"
        | "teal"
        | "blue"
        | "purple"
        | "pink";
    } = {};
    if (args.name) json.name = args.name;
    if (args.color)
      json.color = args.color as
        | "red"
        | "orange"
        | "yellow"
        | "green"
        | "teal"
        | "blue"
        | "purple"
        | "pink";

    if (Object.keys(json).length === 0) {
      consola.error("更新する項目を指定してください (--name, --color)。");
      process.exit(1);
    }

    const res = await client.api.categories[":id"].$patch({
      param: { id: args.id },
      json,
    });

    if (!res.ok) {
      await handleApiError(res, "カテゴリの更新に失敗しました。");
    }

    const category = (await res.json()) as { id: string; name: string };
    consola.success(
      `カテゴリを更新しました: ${category.name} (${category.id})`,
    );
  },
});
