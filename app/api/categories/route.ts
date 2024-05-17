import { getPrismaClient } from "@/app/_lib/prisma";

export async function GET() {
  const categories = await getPrismaClient().category.findMany({
    orderBy: { name: "asc" },
  });

  return Response.json({ items: categories });
}
