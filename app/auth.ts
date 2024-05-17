import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { getPrismaClient } from "./_lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  adapter: PrismaAdapter(getPrismaClient()),
});
