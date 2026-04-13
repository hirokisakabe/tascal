import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import { authClient } from "../../auth-client";
import { CategoryForm } from "../../components/CategoryForm";
import { DeleteAccountModal } from "../../components/DeleteAccountModal";
import { CATEGORY_COLORS } from "../../constants/categoryColors";
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from "../../hooks/useCategories";
import type { Category, CategoryColor } from "../../types/category";

export const Route = createFileRoute("/app/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { data: session } = authClient.useSession();
  const {
    data: categories = [],
    isLoading,
    isError: isFetchError,
  } = useCategories();
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const deleteMutation = useDeleteCategory();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(
    null,
  );
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = (data: { name: string; color: CategoryColor }) => {
    setError(null);
    createMutation.mutate(data, {
      onSuccess: () => setShowCreateForm(false),
      onError: () => setError("カテゴリの作成に失敗しました"),
    });
  };

  const handleUpdate = (data: { name: string; color: CategoryColor }) => {
    if (!editingCategory) return;
    setError(null);
    updateMutation.mutate(
      { id: editingCategory.id, data },
      {
        onSuccess: () => setEditingCategory(null),
        onError: () => setError("カテゴリの更新に失敗しました"),
      },
    );
  };

  const handleDelete = () => {
    if (!deletingCategory) return;
    setError(null);
    deleteMutation.mutate(deletingCategory.id, {
      onSuccess: () => setDeletingCategory(null),
      onError: () => setError("カテゴリの削除に失敗しました"),
    });
  };

  const handleSignOut = () => {
    void authClient.signOut().then(() => {
      window.location.href = "/login";
    });
  };

  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-border-light bg-white px-4 py-1.5">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between">
          <h1 className="text-lg font-bold text-on-surface">
            <Link to="/app" className="no-underline text-inherit">
              tascal
            </Link>
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-on-surface-secondary">
              {session?.user?.name}
            </span>
            <Link
              to="/app"
              className="text-on-surface-secondary hover:text-on-surface"
              aria-label="カレンダーに戻る"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl p-4">
        <h2 className="mb-4 text-xl font-bold text-on-surface">カテゴリ管理</h2>

        {error && (
          <div className="mb-4 rounded-md bg-danger-light px-3 py-2 text-sm text-danger">
            {error}
          </div>
        )}

        {isLoading ? (
          <p className="text-sm text-on-surface-secondary">読み込み中...</p>
        ) : isFetchError ? (
          <div className="rounded-md bg-danger-light px-3 py-2 text-sm text-danger">
            カテゴリの取得に失敗しました。ページを再読み込みしてください。
          </div>
        ) : (
          <>
            {categories.length === 0 && !showCreateForm && (
              <p className="mb-4 text-sm text-on-surface-secondary">
                カテゴリがまだありません。作成してタスクを色分けしましょう。
              </p>
            )}

            <ul className="mb-4 space-y-2">
              {categories.map((category) =>
                editingCategory?.id === category.id ? (
                  <li
                    key={category.id}
                    className="rounded-lg border border-border bg-white p-4"
                  >
                    <CategoryForm
                      initialName={category.name}
                      initialColor={category.color}
                      onSubmit={handleUpdate}
                      onCancel={() => setEditingCategory(null)}
                      saving={updateMutation.isPending}
                    />
                  </li>
                ) : (
                  <li
                    key={category.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-white px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="inline-block h-5 w-5 shrink-0 rounded-full"
                        style={{
                          backgroundColor: CATEGORY_COLORS[category.color].bg,
                        }}
                      />
                      <span className="text-sm text-on-surface">
                        {category.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingCategory(category)}
                        className="rounded-md border border-border bg-white px-3 py-1 text-xs text-on-surface-secondary hover:bg-surface-hover"
                      >
                        編集
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingCategory(category)}
                        className="rounded-md border border-border bg-white px-3 py-1 text-xs text-danger hover:bg-danger-light"
                      >
                        削除
                      </button>
                    </div>
                  </li>
                ),
              )}
            </ul>

            {showCreateForm ? (
              <div className="rounded-lg border border-border bg-white p-4">
                <CategoryForm
                  onSubmit={handleCreate}
                  onCancel={() => setShowCreateForm(false)}
                  saving={createMutation.isPending}
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowCreateForm(true)}
                className="rounded-md bg-primary px-4 py-2 text-sm text-white hover:bg-primary-dark"
              >
                カテゴリを追加
              </button>
            )}
          </>
        )}
        <h2 className="mb-4 mt-8 text-xl font-bold text-on-surface">
          アカウント
        </h2>
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleSignOut}
            className="rounded-md border border-border bg-white px-4 py-2 text-sm text-on-surface-secondary hover:bg-surface-hover"
          >
            ログアウト
          </button>
          <div>
            <button
              type="button"
              onClick={() => setShowDeleteAccountModal(true)}
              className="rounded-md border border-danger bg-white px-4 py-2 text-sm text-danger hover:bg-danger-light"
            >
              アカウント削除
            </button>
          </div>
        </div>
      </main>

      <DeleteAccountModal
        open={showDeleteAccountModal}
        onClose={() => setShowDeleteAccountModal(false)}
      />

      {/* 削除確認ダイアログ */}
      <Dialog
        open={!!deletingCategory}
        onClose={() => setDeletingCategory(null)}
        className="relative z-50"
      >
        <DialogBackdrop
          transition
          className="fixed inset-0 bg-black/50 transition-opacity duration-200 ease-out data-[closed]:opacity-0"
        />
        <div className="fixed inset-0 flex items-center justify-center">
          <DialogPanel
            transition
            className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl transition duration-200 ease-out data-[closed]:scale-95 data-[closed]:opacity-0"
          >
            <DialogTitle className="mb-2 text-lg font-bold text-on-surface">
              カテゴリの削除
            </DialogTitle>
            <p className="mb-6 text-sm text-on-surface-secondary">
              「{deletingCategory?.name}
              」を削除しますか？このカテゴリが設定されたタスクはカテゴリなしになります。
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingCategory(null)}
                className="rounded-md border border-border bg-white px-4 py-2 text-sm text-on-surface-secondary hover:bg-surface-hover"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="rounded-md bg-danger px-4 py-2 text-sm text-white hover:bg-danger-dark disabled:opacity-50"
              >
                削除
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </div>
  );
}
