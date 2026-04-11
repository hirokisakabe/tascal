import { createFileRoute } from "@tanstack/react-router";
import { authClient } from "../../auth-client";
import { Calendar } from "../../components/Calendar";

export const Route = createFileRoute("/_authenticated/")({
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
    <div className="min-h-screen bg-gray-100">
      <header className="border-b border-gray-200 bg-white px-4 py-3">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <h1 className="text-lg font-bold text-gray-900">tascal</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{session?.user?.name}</span>
            <button
              type="button"
              onClick={handleSignOut}
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
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
