import { createFileRoute } from "@tanstack/react-router";
import { authClient } from "../../auth-client";
import { Calendar } from "../../components/Calendar";

export const Route = createFileRoute("/app/")({
  component: HomePage,
});

function HomePage() {
  const { data: session } = authClient.useSession();

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
            <button
              type="button"
              onClick={handleSignOut}
              className="rounded-md border border-border bg-white px-3 py-1.5 text-sm text-on-surface-secondary hover:bg-surface-hover"
            >
              ログアウト
            </button>
          </div>
        </div>
      </header>
      <main className="p-4">
        <Calendar />
      </main>
    </div>
  );
}
