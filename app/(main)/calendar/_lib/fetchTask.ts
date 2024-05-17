import { Ymd } from "@/app/_model/ymd";
import { PrismaClient } from "@prisma/client";
import { unstable_cache } from "next/cache";

function convertDateToYmd(date: Date) {
  const ymd = Ymd.convertDateToYmd(date);

  if (!ymd.success) {
    return null;
  }
  return ymd.data;
}

async function _fetchTasks() {
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

export const fetchTasks = unstable_cache(_fetchTasks, ["tasks"], {
  tags: ["tasks"],
});
