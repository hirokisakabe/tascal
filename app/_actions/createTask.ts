"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { getPrismaClient } from "../_lib/prisma";
import { getUserId } from "../_lib/auth";

const schema = z.object({
  title: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.string({ required_error: "title is required" }),
  ),
  targetDate: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.string({ required_error: "targetDate is required" }),
  ),
  categoryId: z.nullable(z.string()),
});

export async function createTask(formData: FormData) {
  const validatedFields = schema.safeParse({
    title: formData.get("title"),
    targetDate: formData.get("targetDate"),
    categoryId: formData.get("category"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const userId = await getUserId();

  await getPrismaClient().task.create({
    data: {
      title: validatedFields.data.title,
      targetDate: new Date(validatedFields.data.targetDate),
      categoryId: validatedFields.data.categoryId || undefined,
      authorId: userId,
    },
  });

  revalidateTag("tasks");
}
