"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { getPrismaClient } from "../_lib/prisma";
import { getUserId } from "../_lib/auth";

export async function deleteTask(taskId: string) {
  const userId = await getUserId();

  await getPrismaClient().task.delete({
    where: {
      id: taskId,
      authorId: userId,
    },
  });

  revalidateTag("tasks");
}
