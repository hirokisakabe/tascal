import { getPrismaClient } from "@/app/_lib/prisma";
import { auth } from "@/app/auth";
import { NextResponse } from "next/server";

export const GET = auth(async function GET(req) {
  if (!req.auth) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  if (!req.auth.user?.id) {
    return NextResponse.json({ message: "User not found" }, { status: 404 });
  }

  const categories = await getPrismaClient().category.findMany({
    orderBy: { name: "asc" },
    where: { userId: req.auth.user.id },
  });

  return Response.json({ items: categories });
});
