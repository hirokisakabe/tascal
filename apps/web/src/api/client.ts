import { hc } from "hono/client";
import type { AppType } from "@tascal/api/src/app.js";

export const client = hc<AppType>("");
