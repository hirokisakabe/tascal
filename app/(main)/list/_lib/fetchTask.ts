import { getUserId } from "@/app/_lib/auth";
import { getPrismaClient } from "@/app/_lib/prisma";
import { Ymd } from "@/app/_model/ymd";
import { unstable_cache } from "next/cache";

function convertDateToYmd(date: Date) {
  const ymd = Ymd.convertDateToYmd(date);

  if (!ymd.success) {
    return null;
  }
  return ymd.data;
}

async function _fetchTasks({
  includeCompleted,
}: {
  includeCompleted?: boolean;
}) {
  const prisma = getPrismaClient();
  const userId = await getUserId();

  const tasks = await prisma.task.findMany({
    include: { category: true },
    orderBy: { targetDate: "asc" },
    where: {
      authorId: userId,
      completed: includeCompleted ? undefined : false,
    },
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
