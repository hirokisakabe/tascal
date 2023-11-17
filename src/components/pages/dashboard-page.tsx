import { redirect } from "next/navigation";
import { Tab } from "@headlessui/react";
import { getServerSession } from "next-auth";
import { Header } from "../header";
import { TaskCalenderTab } from "../task-calender-tab";
import { TaskListTab } from "../task-list-tab";
import { Typography } from "../parts";
import { nextAuth } from "@/lib/next-auth";

export async function DashboardPage() {
  const session = await getServerSession(nextAuth.authOptions);

  if (!session) {
    redirect("/");
  }

  return (
    <div>
      <div className="px-3 py-1">
        <Header />
      </div>
      <main className="px-3 py-1">
        <Tab.Group>
          <Tab.List className="flex w-max space-x-3 px-3">
            <Tab
              className={({ selected }) =>
                classNames(
                  "px-2 py-2.5 text-sm font-medium leading-5",
                  selected
                    ? "text-blue-700 underline decoration-sky-500 underline-offset-8"
                    : "text-black",
                )
              }
            >
              <Typography>タスク一覧</Typography>
            </Tab>
            <Tab
              className={({ selected }) =>
                classNames(
                  "px-2 py-2.5 text-sm font-medium leading-5",
                  selected
                    ? "text-blue-700 underline decoration-sky-500 underline-offset-8"
                    : "text-black",
                )
              }
            >
              <Typography>カレンダー</Typography>
            </Tab>
          </Tab.List>
          <Tab.Panels className="mt-2">
            <Tab.Panel
              className={classNames(
                "rounded-xl bg-white p-3",
                "ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2",
              )}
            >
              <TaskListTab />
            </Tab.Panel>
            <Tab.Panel
              className={classNames(
                "rounded-xl bg-white p-3",
                "ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2",
              )}
            >
              <TaskCalenderTab />
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </main>
    </div>
  );
}

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}
