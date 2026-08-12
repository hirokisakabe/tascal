import { createAuthMiddleware } from "better-auth/api";
import { betterAuth, type BetterAuthPlugin } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { bearer, customSession } from "better-auth/plugins";
import { getDb } from "./db/index.js";
import * as schema from "./db/schema.js";
import logger from "./logger.js";

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "***";
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}***@${domain}`;
}

export function createPublicSessionPlugin() {
  return customSession(({ user, session }, ctx) => {
    ctx.setHeader("Cache-Control", "private, no-store");

    return Promise.resolve({
      user,
      session: {
        id: session.id,
        userId: session.userId,
        expiresAt: session.expiresAt,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
      },
    });
  });
}

const publicSessionFields = [
  "id",
  "userId",
  "expiresAt",
  "createdAt",
  "updatedAt",
  "ipAddress",
  "userAgent",
] as const;

async function getSessionList(returned: unknown): Promise<unknown[] | null> {
  if (returned instanceof Response) {
    if (!returned.ok) return null;

    const body: unknown = await returned.clone().json();
    return Array.isArray(body) ? body : null;
  }

  return Array.isArray(returned) ? returned : null;
}

export function createPublicSessionListPlugin() {
  return {
    id: "public-session-list",
    hooks: {
      after: [
        {
          matcher: (ctx) => ctx.path === "/list-sessions",
          handler: createAuthMiddleware(async (ctx) => {
            const sessions = await getSessionList(ctx.context.returned);
            if (!sessions) return;

            ctx.setHeader("Cache-Control", "private, no-store");

            return ctx.json(
              sessions.map((session) => {
                const source = session as Record<string, unknown>;

                return Object.fromEntries(
                  publicSessionFields.map((field) => [field, source[field]]),
                );
              }),
            );
          }),
        },
      ],
    },
  } satisfies BetterAuthPlugin;
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
    plugins: [
      bearer(),
      createPublicSessionPlugin(),
      createPublicSessionListPlugin(),
    ],
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
