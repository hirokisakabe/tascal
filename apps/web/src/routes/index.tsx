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

        <section className="bg-white px-4 py-24">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-4 text-3xl font-bold text-on-surface">
              ターミナルからも、タスク管理。
            </h2>
            <p className="mb-10 text-lg text-on-surface-secondary">
              CLI ツールを使えば、ターミナルから直接タスクを操作できます。
            </p>

            <div className="mx-auto max-w-xl overflow-hidden rounded-lg border border-border-light bg-gray-900 text-left shadow-lg">
              <div className="flex items-center gap-1.5 border-b border-gray-700 px-4 py-2.5">
                <span className="h-3 w-3 rounded-full bg-red-500" />
                <span className="h-3 w-3 rounded-full bg-yellow-500" />
                <span className="h-3 w-3 rounded-full bg-green-500" />
                <span className="ml-2 text-xs text-gray-400">Terminal</span>
              </div>
              <div className="space-y-3 p-5 font-mono text-sm leading-relaxed text-gray-300">
                <p>
                  <span className="text-green-400">$</span> npm install -g
                  tascal-cli
                </p>
                <p>
                  <span className="text-green-400">$</span> tascal add --title
                  &quot;レビュー対応&quot; --date 2026-04-14
                </p>
                <p>
                  <span className="text-green-400">$</span> tascal list
                </p>
                <p>
                  <span className="text-green-400">$</span> tascal done
                  &lt;task-id&gt;
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border-light px-4 py-6 text-center text-sm text-on-surface-secondary">
        &copy; 2026 tascal
      </footer>
    </div>
  );
}
