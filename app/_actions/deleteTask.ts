"use server";

import { revalidatePath } from "next/cache";
import { getPrismaClient } from "../_lib/prisma";

export async function deleteTask(taskId: string) {
	await getPrismaClient().task.delete({
		where: {
			id: taskId,
		},
	});

	revalidatePath("/");
}
