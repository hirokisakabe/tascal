import { Button, Divider } from "@nextui-org/react";
import Link from "next/link";
import { signOut } from "../auth";
import { UserProfileIcon } from "../_components/UserProfileIcon";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="container mx-auto px-3">
      <div className="flex justify-between items-center py-3">
        <h1 className="text-2xl">
          <Link href="/">tascal</Link>
        </h1>
        <div className="flex gap-6">
          <UserProfileIcon />
          <div>
            <form
              action={async () => {
                "use server";
                await signOut();
              }}
            >
              <Button type="submit" variant="bordered">
                Sign Out
              </Button>
            </form>
          </div>
        </div>
      </div>
      <div className="flex py-1">
        <div className="text-sm border bg-slate-50 p-1">
          <Link href="/list">一覧</Link>
        </div>
        <div className="text-sm border bg-slate-50 p-1">
          <Link href="/calendar">カレンダー</Link>
        </div>
      </div>
      <Divider />
      {children}
    </div>
  );
}
