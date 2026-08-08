import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  CategoryCreateInput,
  CategoryUpdateInput,
} from "@tascal/shared/api-contract";
import {
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../api/categories";

const categoriesQueryKey = ["categories"] as const;

export function useCategories() {
  return useQuery({
    queryKey: categoriesQueryKey,
    queryFn: fetchCategories,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CategoryCreateInput) => createCategory(data),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: categoriesQueryKey });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CategoryUpdateInput }) =>
      updateCategory(id, data),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: categoriesQueryKey });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: categoriesQueryKey });
      // カテゴリ削除時、タスクの categoryId が null になるのでタスクキャッシュも無効化
      void queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}
