import { hc } from "hono/client";
import type { AppType } from "@tascal/api/app-type";

export const client = hc<AppType>("");
