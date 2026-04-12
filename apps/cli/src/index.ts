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
  },
});

void runMain(main);
