import { auth, signIn } from "@/app/auth";
import { Button } from "@nextui-org/react";
import { redirect } from "next/navigation";

export default async function Page() {
  const session = await auth();
  if (session) {
    redirect("/list");
  }

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center flex flex-col gap-4">
        <h1 className="text-2xl">tascal</h1>
        <form
          action={async () => {
            "use server";
            await signIn("google");
          }}
        >
          <Button variant="bordered" type="submit">
            Signin with Google
          </Button>
        </form>
      </div>
    </div>
  );
}
