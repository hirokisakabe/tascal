export type Task = {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  date: string | null;
  status: "todo" | "done";
  categoryId: string | null;
  createdAt: string;
  updatedAt: string;
};
