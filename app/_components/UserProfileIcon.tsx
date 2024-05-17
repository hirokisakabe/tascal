import { User } from "@nextui-org/react";
import { auth } from "../auth";

export async function UserProfileIcon() {
  const session = await auth();

  if (!session || !session.user) {
    return null;
  }

  return (
    <User
      name={session.user.name}
      description="Product Designer"
      avatarProps={{
        src: session.user.image || undefined,
      }}
    />
  );
}
