import { faker } from "@faker-js/faker/locale/ja";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const userId = "dummy_user_id_1";

  await prisma.user.deleteMany({});

  await prisma.user.create({
    data: {
      id: userId,
      name: "Alice",
      email: "alice@prisma.io",
    },
  });

  await prisma.category.createMany({
    data: [
      { id: "dummy_category_id_1", name: "Work", color: "#FF0000", userId },
      { id: "dummy_category_id_2", name: "Personal", color: "#00FF00", userId },
      { id: "dummy_category_id_3", name: "Hobbies", color: "#0000FF", userId },
    ],
  });

  await prisma.task.createMany({
    data: [...Array(100)].map(() => ({
      title: faker.word.words(),
      targetDate: faker.date.between({
        from: "2024-01-01T00:00:00.000Z",
        to: "2025-01-01T00:00:00.000Z",
      }),
      categoryId: "dummy_category_id_1",
      authorId: userId,
    })),
  });

  const allUsers = await prisma.user.findMany({
    include: {
      tasks: true,
    },
  });
  console.dir(allUsers, { depth: null });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
