"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { getPrismaClient } from "../_lib/prisma";
import { getUserId } from "../_lib/auth";

export async function uncompleteTask(taskId: string) {
  const userId = await getUserId();

  await getPrismaClient().task.update({
    where: {
      id: taskId,
      authorId: userId,
    },
    data: {
      completed: false,
    },
  });

  revalidateTag("tasks");
}
