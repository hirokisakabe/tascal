import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { SignInButton } from "../signin-button";
import { nextAuth } from "@/lib/next-auth";

export async function IndexPage() {
  const session = await getServerSession(nextAuth.authOptions);

  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <SignInButton />
    </main>
  );
}
