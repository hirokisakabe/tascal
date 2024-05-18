"use server";

import { revalidateTag } from "next/cache";
import { getPrismaClient } from "../../_lib/prisma";
import { getUserId } from "../../_lib/auth";
import { parseWithZod } from "@conform-to/zod";
import { updateTaskSchema } from "./schema";

export async function updateTask(
  taskId: string,
  prevState: unknown,
  formData: FormData,
) {
  const submission = parseWithZod(formData, { schema: updateTaskSchema });

  if (submission.status !== "success") {
    return submission.reply();
  }

  const userId = await getUserId();

  await getPrismaClient().task.update({
    where: {
      id: taskId,
      authorId: userId,
    },
    data: {
      title: submission.value.title,
      targetDate: new Date(submission.value.targetDate),
      categoryId: submission.value.categoryId,
      authorId: userId,
    },
  });

  revalidateTag("tasks");
}
