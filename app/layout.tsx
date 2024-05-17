import { Button, Divider, User } from "@nextui-org/react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "tascal",
  description: "Simple todo list app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <div className="container mx-auto px-3">
            <div className="flex justify-between items-center py-3">
              <h1 className="text-2xl">
                <Link href="/">tascal</Link>
              </h1>
              <div>
                <User
                  name="Jane Doe"
                  description="Product Designer"
                  avatarProps={{
                    src: "https://i.pravatar.cc/150?u=a04258114e29026702d",
                  }}
                />
              </div>
            </div>
            <div className="flex gap-3 py-1">
              <div className="border-2 border-solid rounded-lg bg-slate-50 p-1">
                <Link href="/list">一覧</Link>
              </div>
              <div className="border-2 border-solid rounded-lg bg-slate-50 p-1">
                <Link href="/calendar">カレンダー</Link>
              </div>
            </div>
            <Divider />
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
