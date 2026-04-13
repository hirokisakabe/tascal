#!/usr/bin/env node
import { defineCommand, runMain } from "citty";

const main = defineCommand({
  meta: {
    name: "tascal",
    description: "tascal CLI — カレンダータスク管理",
  },
  subCommands: {
    login: () => import("./commands/login.js").then((m) => m.default),
    logout: () => import("./commands/logout.js").then((m) => m.default),
    list: () => import("./commands/list.js").then((m) => m.default),
    add: () => import("./commands/add.js").then((m) => m.default),
    edit: () => import("./commands/edit.js").then((m) => m.default),
    delete: () => import("./commands/delete.js").then((m) => m.default),
    done: () => import("./commands/done.js").then((m) => m.default),
    undo: () => import("./commands/undo.js").then((m) => m.default),
    category: () =>
      import("./commands/category/index.js").then((m) => m.default),
  },
});

void runMain(main);
