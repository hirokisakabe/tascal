import { createFileRoute } from "@tanstack/react-router";
import { authClient } from "../../auth-client";

export const Route = createFileRoute("/_authenticated/")({
  component: HomePage,
});

function HomePage() {
  const { data: session } = authClient.useSession();

  const handleSignOut = async () => {
    await authClient.signOut();
    window.location.href = "/login";
  };

  return (
    <div>
      <h1>tascal</h1>
      <p>{session?.user?.name} としてログイン中</p>
      <button type="button" onClick={handleSignOut}>
        ログアウト
      </button>
    </div>
  );
}
