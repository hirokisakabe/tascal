import { defineCommand } from "citty";

export default defineCommand({
  meta: {
    name: "category",
    description: "カテゴリを管理する",
  },
  subCommands: {
    list: () => import("./list.js").then((m) => m.default),
    add: () => import("./add.js").then((m) => m.default),
    edit: () => import("./edit.js").then((m) => m.default),
    delete: () => import("./delete.js").then((m) => m.default),
  },
});
