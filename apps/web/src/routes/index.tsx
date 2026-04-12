import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-border-light bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <span className="text-lg font-bold text-on-surface">tascal</span>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="rounded-md border border-border bg-white px-4 py-2 text-sm text-on-surface-secondary hover:bg-surface-hover"
            >
              ログイン
            </Link>
            <Link
              to="/signup"
              className="rounded-md bg-primary px-4 py-2 text-sm text-white hover:bg-primary-dark"
            >
              サインアップ
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="px-4 py-24 text-center">
          <h1 className="mb-4 text-4xl font-bold text-on-surface">
            タスク管理を、カレンダーから。
          </h1>
          <p className="mx-auto mb-8 max-w-xl text-lg text-on-surface-secondary">
            カレンダービューでタスクを直感的に管理。ドラッグ&ドロップで手軽にスケジュールを調整できます。
          </p>
          <Link
            to="/signup"
            className="inline-block rounded-md bg-primary px-6 py-3 text-base font-medium text-white hover:bg-primary-dark"
          >
            無料で始める
          </Link>
        </section>

        <section className="px-4 pb-24">
          <div className="mx-auto max-w-4xl overflow-hidden rounded-lg border border-border-light shadow-lg">
            <img
              src="/screenshot.png"
              alt="tascal のカレンダービュー"
              className="w-full"
            />
          </div>
        </section>
      </main>

      <footer className="border-t border-border-light px-4 py-6 text-center text-sm text-on-surface-secondary">
        &copy; 2026 tascal
      </footer>
    </div>
  );
}
