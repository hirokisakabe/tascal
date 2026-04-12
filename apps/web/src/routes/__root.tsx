import { createRootRoute, Link, Outlet } from "@tanstack/react-router";

function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-6 text-center shadow-xl">
        <h1 className="mb-2 text-6xl font-bold text-on-surface">404</h1>
        <p className="mb-6 text-sm text-on-surface-secondary">
          お探しのページが見つかりませんでした
        </p>
        <Link
          to="/"
          className="inline-block rounded-md bg-primary px-4 py-2 text-sm text-white hover:bg-primary-dark"
        >
          トップページへ戻る
        </Link>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  component: () => <Outlet />,
  notFoundComponent: NotFoundPage,
});
