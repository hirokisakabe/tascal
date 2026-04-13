import { createAuthMiddleware } from "better-auth/api";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { bearer } from "better-auth/plugins";
import { getDb } from "./db/index.js";
import * as schema from "./db/schema.js";
import logger from "./logger.js";

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "***";
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}***@${domain}`;
}

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
    plugins: [bearer()],
    trustedOrigins: process.env.TRUSTED_ORIGINS
      ? process.env.TRUSTED_ORIGINS.split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : ["http://localhost:5173"],
    hooks: {
      // eslint-disable-next-line @typescript-eslint/require-await
      after: createAuthMiddleware(async (ctx) => {
        if (ctx.path.startsWith("/sign-in")) {
          const session = ctx.context.newSession;
          if (session) {
            logger.info(
              {
                userId: session.user.id,
                email: maskEmail(session.user.email),
              },
              "Sign-in successful",
            );
          } else {
            const rawEmail =
              ctx.body && typeof ctx.body === "object" && "email" in ctx.body
                ? (ctx.body as { email?: string }).email
                : undefined;
            logger.warn(
              { email: rawEmail ? maskEmail(rawEmail) : undefined },
              "Sign-in failed",
            );
          }
        }

        if (ctx.path.startsWith("/sign-up")) {
          const session = ctx.context.newSession;
          if (session) {
            logger.info(
              {
                userId: session.user.id,
                email: maskEmail(session.user.email),
              },
              "Sign-up successful",
            );
          }
        }
      }),
    },
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
