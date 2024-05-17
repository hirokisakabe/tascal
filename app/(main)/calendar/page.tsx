import { redirect } from "next/navigation";
import { auth } from "../../auth";
import { CalendarContainer } from "./_components/CalendarContainer";
import { fetchTasks } from "./_lib/fetchTask";

export default async function Page() {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  const tasks = await fetchTasks();

  return <CalendarContainer tasks={tasks} />;
}
