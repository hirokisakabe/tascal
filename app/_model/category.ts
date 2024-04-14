import { z } from "zod";

const CategorySchema = z.object({
	id: z.string(),
	name: z.string(),
	color: z.string(),
});

export type Category = z.infer<typeof CategorySchema>;

export const Category = {
	isCategory,
};

function isCategory(target: unknown) {
	return CategorySchema.safeParse(target);
}
