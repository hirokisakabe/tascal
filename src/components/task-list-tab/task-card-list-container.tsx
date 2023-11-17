import { TaskCardList } from "./task-card-list";
import { fetchTaskList } from "@/lib";

export async function TaskCardListContainer() {
  const taskList = await fetchTaskList();

  if (!taskList.success) {
    return <>Failed to fetch</>;
  }

  return <TaskCardList taskList={taskList.value} />;
}
