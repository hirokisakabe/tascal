import {
  collection,
  addDoc,
  updateDoc,
  doc,
  where,
  query,
  QueryFieldFilterConstraint,
  orderBy,
  deleteDoc,
} from "firebase/firestore";
import { useCollection } from "react-firebase-hooks/firestore";
import { getUserId, useAuth } from "./auth";
import { useCategories } from "./category";
import { firestore } from "@/config";
import { Task, isTask } from "@/model";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { Result } from "result-type-ts";
import { nextAuth } from "@/lib/nextAuth";

export async function createTask({
  title,
  targetDate,
}: {
  title: string;
  targetDate?: string;
}) {
  const userId = getUserId();

  if (!userId) {
    console.error("Failed to get userId");
    return;
  }

  const targetMonth = targetDate && targetDate.slice(0, 7); // 2020-01-02 -> 2022-01

  const docRef = await addDoc(collection(firestore, "users", userId, "tasks"), {
    title,
    isCompleted: false,
    userId,
    targetDate: targetDate || null, // 空文字はnullに変換する
    targetMonth: targetMonth || null,
  });

  console.log("Document written with ID: ", docRef.id);
}

export async function updateTask({
  id,
  title,
  targetDate,
  categoryId,
}: {
  id: string;
  title?: string;
  targetDate: string | undefined | null;
  categoryId: string | undefined | null;
}) {
  const userId = getUserId();

  if (!userId) {
    console.error("Failed to get userId");
    return;
  }

  const data = (() => {
    if (targetDate === undefined) {
      // targetDateとtargetMonthは更新しない
      return { title };
    }

    const targetMonth = targetDate && targetDate.slice(0, 7); // 2020-01-02 -> 2022-01

    return {
      title,
      targetDate: targetDate || null, // 空文字はnullに変換する
      targetMonth: targetMonth || null,
      categoryId,
    };
  })();

  await updateDoc(doc(firestore, "users", userId, "tasks", id), data);
}

export async function completeTask({ id }: { id: string }) {
  "use server";

  const session = await getServerSession(nextAuth.authOptions);

  if (!session) {
    return Result.failure("Failed to get session.");
  }


  // @ts-ignore
  const userId = session?.user?.id; 

  const prisma = new PrismaClient();

  await prisma.task.update({
    where: { id, userId },
    data: { isCompleted: true },
  });
}

export async function deleteTask({ id }: { id: string }) {
  const userId = getUserId();

  if (!userId) {
    console.error("Failed to get userId");
    return;
  }

  await deleteDoc(doc(firestore, "users", userId, "tasks", id));
}

export async function fetchTaskList() {
  const prisma = new PrismaClient();

  const session = await getServerSession(nextAuth.authOptions);

  if (!session) {
    return Result.failure("Failed to get session.");
  }

  // @ts-ignore
  const userId = session?.user?.id;

  if (typeof userId !== "string") {
    return Result.failure("Failed to get userId.");
  }

  const tasks = await prisma.task.findMany({ where: { userId } });

  return Result.success(tasks);
}

export function useTaskList(options?: {
  month?: string;
  isCompleted?: boolean;
}) {
  const month = options?.month;
  const isCompleted = options?.isCompleted;

  const auth = useAuth();
  const uid = auth.status === "authenticated" ? auth.user.uid : undefined;

  const ref = collection(firestore, `users/${uid}/tasks`);

  const targetMonthFilter =
    month !== undefined ? where("targetMonth", "==", month) : undefined;
  const isCompletedFilter =
    isCompleted !== undefined
      ? where("isCompleted", "==", isCompleted)
      : undefined;

  const filter: QueryFieldFilterConstraint[] = [];
  if (targetMonthFilter) {
    filter.push(targetMonthFilter);
  }
  if (isCompletedFilter) {
    filter.push(isCompletedFilter);
  }

  const q =
    filter.length > 0
      ? query(ref, orderBy("targetDate"), ...filter)
      : query(ref, orderBy("targetDate"));

  const [value, loading, error] = useCollection(q);

  const categories = useCategories();

  if (loading) {
    return null;
  }

  if (error) {
    console.error({ error });
    return null;
  }

  const result: Task[] = [];

  value?.docs.forEach((doc) => {
    const maybeTask = { id: doc.id, ...doc.data() };

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const category = categories?.find((v) => v.id === maybeTask.categoryId);

    const parsedTask = isTask(
      category ? { ...maybeTask, category } : { ...maybeTask, category: null },
    );
    if (parsedTask.success) {
      result.push(parsedTask.data);

      return;
    }

    console.error("Invalid task : " + JSON.stringify(maybeTask));
  });

  return result;
}
