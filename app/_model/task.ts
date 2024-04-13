import { z } from "zod";
import { YmdSchema } from "./ymd";

const TaskSchema = z.object({
	id: z.string(),
	title: z.string(),
	isCompleted: z.boolean(),
	targetYmd: z.nullable(YmdSchema),
	category: z.nullable(
		z.object({
			id: z.string(),
			name: z.string(),
			color: z.string(),
		}),
	),
});

export type Task = z.infer<typeof TaskSchema>;

export function isTask(target: unknown) {
	return TaskSchema.safeParse(target);
}
