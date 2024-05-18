import { z } from "zod";

export const updateTaskSchema = z.object({
  title: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.string({ required_error: "タイトルは必須です" }),
  ),
  targetDate: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.string({ required_error: "実施日は必須です" }),
  ),
  categoryId: z.string().optional(),
});
