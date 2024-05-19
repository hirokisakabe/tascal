"use server";

import { revalidateTag } from "next/cache";
import { getPrismaClient } from "../../_lib/prisma";
import { getUserId } from "../../_lib/auth";
import { parseWithZod } from "@conform-to/zod";
import { createTaskSchema } from "./schema";
import { SubmissionResult } from "@conform-to/dom";

export async function createTask(
  prevState: unknown,
  formData: FormData
): Promise<SubmissionResult<string[]>> {
  const submission = parseWithZod(formData, { schema: createTaskSchema });

  if (submission.status !== "success") {
    return submission.reply();
  }

  const userId = await getUserId();

  await getPrismaClient().task.create({
    data: {
      title: submission.value.title,
      targetDate: new Date(submission.value.targetDate),
      categoryId: submission.value.categoryId,
      authorId: userId,
    },
  });

  revalidateTag("tasks");

  return { status: "success" };
}
