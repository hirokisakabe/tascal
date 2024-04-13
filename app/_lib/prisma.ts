import { PrismaClient } from "@prisma/client";

const prismaClient = new PrismaClient();

export function getPrismaClient() {
	return prismaClient;
}
