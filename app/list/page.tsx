import { Checkbox } from "@nextui-org/react";
import AddTaskButton from "./_components/AddTaskButton";
import { TaskCard } from "./_components/TaskCard";
import { fetchTasks } from "./_lib/fetchTask";

export default async function Page() {
	const tasks = await fetchTasks();

	return (
		<div>
			<div className="flex justify-between py-3">
				<AddTaskButton />
				<Checkbox>完了済のタスクも表示する</Checkbox>
			</div>
			<div className="grid gap-0.5">
				{tasks.map((task) => (
					<TaskCard key={task.id} task={task} />
				))}
			</div>
		</div>
	);
}
