export type Task = {
  id: string;
  title: string;
  description: string | null;
  date: string;
  status: "todo" | "done";
  categoryId: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
};
