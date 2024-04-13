import { CalendarContainer } from "./_components/CalendarContainer";
import { fetchTasks } from "./_lib/fetchTask";

export default async function Page() {
	const tasks = await fetchTasks();

	return <CalendarContainer tasks={tasks} />;
}
