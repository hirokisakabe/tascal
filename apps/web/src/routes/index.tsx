import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <span className="text-lg font-bold text-gray-900">tascal</span>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              ログイン
            </Link>
            <Link
              to="/signup"
              className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
            >
              サインアップ
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="px-4 py-24 text-center">
          <h1 className="mb-4 text-4xl font-bold text-gray-900">
            タスク管理を、カレンダーから。
          </h1>
          <p className="mx-auto mb-8 max-w-xl text-lg text-gray-600">
            カレンダービューでタスクを直感的に管理。ドラッグ&ドロップで手軽にスケジュールを調整できます。
          </p>
          <Link
            to="/signup"
            className="inline-block rounded-md bg-blue-600 px-6 py-3 text-base font-medium text-white hover:bg-blue-700"
          >
            無料で始める
          </Link>
        </section>

        <section className="px-4 pb-24">
          <div className="mx-auto max-w-4xl overflow-hidden rounded-lg border border-gray-200 shadow-lg">
            <img
              src="/screenshot.png"
              alt="tascal のカレンダービュー"
              className="w-full"
            />
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-200 px-4 py-6 text-center text-sm text-gray-500">
        &copy; 2026 tascal
      </footer>
    </div>
  );
}
