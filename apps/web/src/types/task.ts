export type Task = {
  id: string;
  title: string;
  description: string | null;
  date: string;
  status: "todo" | "done";
  userId: string;
  createdAt: string;
  updatedAt: string;
};
