import useSWR from "swr";
import { fetcher } from "../_lib/fetcher";
import { Category } from "../_model/category";

type Result =
	| {
			state: "loading";
	  }
	| {
			state: "error";
			error: unknown;
	  }
	| {
			state: "success";
			categories: Category[];
	  };

export function useCategories(): Result {
	const { data, error, isLoading } = useSWR("/api/categories", fetcher);

	if (isLoading) {
		return { state: "loading" };
	}

	if (error) {
		return { state: "error", error };
	}

	const categories: Category[] = [];

	for (const item of data.items) {
		const category = Category.isCategory(item);

		if (!category.success) {
			console.debug(category.error);
			continue;
		}

		categories.push(category.data);
	}

	return { state: "success", categories };
}
