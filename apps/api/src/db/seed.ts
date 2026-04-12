import { eq } from "drizzle-orm";
import { getDb } from "./index.js";
import { getAuth } from "../auth.js";
import { tasks, users } from "./schema.js";

const SEED_USER = {
  name: "Test User",
  email: "test@example.com",
  password: "password123",
};

function formatDate(year: number, month: number, day: number): string {
  const m = String(month + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
}

function getSampleTasks(userId: string) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  return [
    {
      title: "企画書の作成",
      description: "来月のプロジェクト企画書を作成する",
      date: formatDate(year, month, 5),
      status: "done" as const,
      userId,
    },
    {
      title: "チームミーティング",
      description: "週次の進捗共有ミーティング",
      date: formatDate(year, month, 10),
      status: "todo" as const,
      userId,
    },
    {
      title: "コードレビュー",
      description: null,
      date: formatDate(year, month, 15),
      status: "todo" as const,
      userId,
    },
    {
      title: "デザインレビュー",
      description: "新機能のUIデザインを確認する",
      date: formatDate(year, month, 15),
      status: "todo" as const,
      userId,
    },
    {
      title: "リリース準備",
      description: "本番環境へのデプロイ準備",
      date: formatDate(year, month, 20),
      status: "todo" as const,
      userId,
    },
  ];
}

async function seed() {
  console.log("🌱 Seeding database...");

  const db = getDb();
  const auth = getAuth();

  // Check if seed user already exists
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.email, SEED_USER.email))
    .limit(1);

  let userId: string;

  if (existing.length > 0) {
    userId = existing[0].id;
    console.log(`✅ Seed user already exists (id: ${userId})`);
  } else {
    // Create user via better-auth API to ensure correct password hashing
    const result = await auth.api.signUpEmail({
      body: {
        name: SEED_USER.name,
        email: SEED_USER.email,
        password: SEED_USER.password,
      },
    });
    userId = result.user.id;
    console.log(`✅ Created seed user (id: ${userId})`);
  }

  // Insert sample tasks (skip if tasks already exist for this user)
  const existingTasks = await db
    .select()
    .from(tasks)
    .where(eq(tasks.userId, userId))
    .limit(1);

  if (existingTasks.length > 0) {
    console.log("✅ Sample tasks already exist, skipping");
  } else {
    const sampleTasks = getSampleTasks(userId);
    await db.insert(tasks).values(sampleTasks);
    console.log(`✅ Inserted ${sampleTasks.length} sample tasks`);
  }

  console.log("🌱 Seeding complete!");
  console.log(`\n📧 Email: ${SEED_USER.email}`);
  console.log(`🔑 Password: ${SEED_USER.password}`);

  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
