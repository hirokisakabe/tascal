import { Ymd } from "@/app/_model/ymd";
import { PrismaClient } from "@prisma/client";

function convertDateToYmd(date: Date) {
	const ymd = Ymd.convertDateToYmd(date);

	if (!ymd.success) {
		return null;
	}
	return ymd.data;
}

export async function fetchTasks() {
	const prisma = new PrismaClient();

	const tasks = await prisma.task.findMany({
		include: { category: true },
		orderBy: { targetDate: "desc" },
	});

	return tasks.map((task) => ({
		...task,
		isCompleted: task.completed,
		targetYmd: task.targetDate ? convertDateToYmd(task.targetDate) : null,
	}));
}
