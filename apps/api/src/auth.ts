import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { getDb } from "./db/index.js";
import * as schema from "./db/schema.js";

function createAuth() {
  return betterAuth({
    database: drizzleAdapter(getDb(), {
      provider: "pg",
      schema,
      usePlural: true,
    }),
    emailAndPassword: {
      enabled: true,
    },
    trustedOrigins: ["http://localhost:5173"],
  });
}

export type Auth = ReturnType<typeof createAuth>;

let _auth: Auth | null = null;

export function getAuth(): Auth {
  if (!_auth) {
    _auth = createAuth();
  }
  return _auth;
}
