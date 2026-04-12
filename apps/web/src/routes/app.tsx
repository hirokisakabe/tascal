import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { authClient } from "../auth-client";

export const Route = createFileRoute("/app")({
  beforeLoad: async () => {
    const { data: session } = await authClient.getSession();
    if (!session) {
      // eslint-disable-next-line @typescript-eslint/only-throw-error -- TanStack Router requires throwing redirect()
      throw redirect({ to: "/login" });
    }
    return { session };
  },
  component: () => <Outlet />,
});
