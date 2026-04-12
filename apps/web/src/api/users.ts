export async function deleteAccount(): Promise<void> {
  const res = await fetch("/api/users/me", {
    method: "DELETE",
  });
  if (!res.ok) {
    throw new Error("アカウントの削除に失敗しました");
  }
}
