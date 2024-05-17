import { auth } from "../auth";

export async function getUserId() {
  const session = await auth();

  const userId = session?.user?.id;

  if (!userId) {
    throw new Error("User is not logged in");
  }

  return userId;
}
