import { CalendarContainer } from "./_components/CalendarContainer";
import { fetchTasks } from "./_lib/fetchTask";

export default function Page() {
	const tasks = fetchTasks();

	return <CalendarContainer tasks={tasks} />;
}
