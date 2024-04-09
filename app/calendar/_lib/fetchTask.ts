import { Ymd } from "@/app/_model/ymd";

const dummyTasks = [
	{
		id: "0",
		title: "Task 1",
		isCompleted: false,
		targetDate: new Date("2024-01-01"),
		category: { id: "0", name: "Category 1", color: "red" },
	},
	{
		id: "1",
		title: "Task 2",
		isCompleted: false,
		targetDate: new Date("2024-04-02"),
		category: { id: "1", name: "Category 2", color: "blue" },
	},
	{
		id: "2",
		title: "Task 3",
		isCompleted: true,
		targetDate: new Date("2024-04-03"),
		category: { id: "2", name: "Category 3", color: "green" },
	},
];

function convertDateToYmd(date: Date) {
	const ymd = Ymd.convertDateToYmd(date);

	if (!ymd.success) {
		return null;
	}
	return ymd.data;
}

export function fetchTasks() {
	return dummyTasks.map((task) => ({
		...task,
		targetYmd: task.targetDate ? convertDateToYmd(task.targetDate) : null,
	}));
}
