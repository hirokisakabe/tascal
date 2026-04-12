import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { authClient } from "../../auth-client";
import { Calendar } from "../../components/Calendar";
import { DeleteAccountModal } from "../../components/DeleteAccountModal";

export const Route = createFileRoute("/app/")({
  component: HomePage,
});

function HomePage() {
  const { data: session } = authClient.useSession();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleSignOut = () => {
    void authClient.signOut().then(() => {
      window.location.href = "/login";
    });
  };

  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-border-light bg-white px-4 py-1.5">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between">
          <h1 className="text-lg font-bold text-on-surface">tascal</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-on-surface-secondary">
              {session?.user?.name}
            </span>
            <Link
              to="/app/settings"
              className="text-on-surface-secondary hover:text-on-surface"
              aria-label="設定"
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
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              className="rounded-md border border-border bg-white px-3 py-1.5 text-sm text-on-surface-secondary hover:bg-surface-hover"
            >
              ログアウト
            </button>
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="rounded-md border border-danger bg-white px-3 py-1.5 text-sm text-danger hover:bg-danger-light"
            >
              アカウント削除
            </button>
          </div>
        </div>
      </header>
      <main className="p-4">
        <Calendar />
      </main>
      <DeleteAccountModal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
      />
    </div>
  );
}
