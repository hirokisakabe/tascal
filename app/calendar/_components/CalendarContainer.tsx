"use client";

import type { Task } from "@/app/_model/task";
import { useTaskCalendar } from "../_hooks/useTaskCalendar";
import { TaskCalendar } from "./Calendar";

type Props = {
  tasks: Task[];
};

export function CalendarContainer(props: Props) {
  const {
    title,
    data,
    moveToBefore,
    moveToAfter,
    firstDayOfNumber,
    lastDayOfNumber,
  } = useTaskCalendar({ tasks: props.tasks });

  return (
    <div className="flex justify-between py-3">
      <TaskCalendar
        title={title}
        data={data}
        moveToBefore={moveToBefore}
        moveToAfter={moveToAfter}
        firstDayOfNumber={firstDayOfNumber}
        lastDayOfNumber={lastDayOfNumber}
      />
    </div>
  );
}
