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

      <footer className="border-t border-border-light px-4 py-6">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-2">
          <div className="flex gap-4 text-sm">
            <Link
              to="/terms"
              className="text-on-surface-secondary hover:text-on-surface hover:underline"
            >
              利用規約
            </Link>
            <Link
              to="/privacy"
              className="text-on-surface-secondary hover:text-on-surface hover:underline"
            >
              プライバシーポリシー
            </Link>
            <a
              href="https://github.com/hirokisakabe/tascal"
              target="_blank"
              rel="noopener noreferrer"
              className="text-on-surface-secondary hover:text-on-surface"
              aria-label="GitHub"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-5 w-5"
              >
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
              </svg>
            </a>
          </div>
          <p className="text-sm text-on-surface-secondary">
            &copy; 2026 tascal
          </p>
        </div>
      </footer>
    </div>
  );
}
