import { z } from "zod";

export const createTaskSchema = z.object({
  title: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.string({ required_error: "title is required" }),
  ),
  targetDate: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.string({ required_error: "targetDate is required" }),
  ),
  categoryId: z.string().optional(),
});
