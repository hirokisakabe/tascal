"use server";

import { revalidateTag } from "next/cache";
import { getPrismaClient } from "../_lib/prisma";

export async function completeTask(taskId: string) {
	await getPrismaClient().task.update({
		where: {
			id: taskId,
		},
		data: {
			completed: true,
		},
	});

	revalidateTag("tasks");
}
