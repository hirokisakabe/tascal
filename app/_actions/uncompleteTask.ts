"use server";

import { revalidatePath } from "next/cache";
import { getPrismaClient } from "../_lib/prisma";

export async function uncompleteTask(taskId: string) {
	await getPrismaClient().task.update({
		where: {
			id: taskId,
		},
		data: {
			completed: false,
		},
	});

	revalidatePath("/");
}
