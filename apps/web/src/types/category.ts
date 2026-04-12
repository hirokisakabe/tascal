export type CategoryColor =
  | "red"
  | "orange"
  | "yellow"
  | "green"
  | "teal"
  | "blue"
  | "purple"
  | "pink";

export type Category = {
  id: string;
  name: string;
  color: CategoryColor;
  userId: string;
  createdAt: string;
  updatedAt: string;
};
