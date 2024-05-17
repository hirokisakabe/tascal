import { redirect } from "next/navigation";
import { auth } from "../../auth";
import AddTaskButton from "./_components/AddTaskButton";
import ShowCompleteTaskCheckbox from "./_components/ShowCompleteTaskCheckbox";
import { TaskCard } from "./_components/TaskCard";
import { fetchTasks } from "./_lib/fetchTask";

export default async function Page({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  const showCompleteTask = searchParams?.showCompleteTask === "true";

  const tasks = await fetchTasks({ includeCompleted: showCompleteTask });

  return (
    <div>
      <div className="flex justify-between py-3">
        <AddTaskButton />
        <ShowCompleteTaskCheckbox />
      </div>
      <div className="grid gap-0.5">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
}
