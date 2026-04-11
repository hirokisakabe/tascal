import { createRootRoute, Link, Outlet } from "@tanstack/react-router";

function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-6 text-center shadow-xl">
        <h1 className="mb-2 text-6xl font-bold text-gray-900">404</h1>
        <p className="mb-6 text-sm text-gray-600">
          お探しのページが見つかりませんでした
        </p>
        <Link
          to="/"
          className="inline-block rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
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
