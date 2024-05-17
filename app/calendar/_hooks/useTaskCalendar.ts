import type { Task } from "@/app/_model/task";
import { Ym } from "@/app/_model/ym";
import { createNumberSequence } from "@/app/_utils/createNumberSequence";
import { useCallback, useMemo, useState } from "react";

type Props = {
  tasks: Task[];
};

export function useTaskCalendar(props: Props) {
  const [ym, setYm] = useState(Ym.getThisYm());

  const moveToBefore = useCallback(() => {
    setYm((ym) => Ym.getBeforeYm(ym));
  }, []);

  const moveToAfter = useCallback(() => {
    setYm((ym) => Ym.getAfterYm(ym));
  }, []);

  const title = `${ym.year} / ${ym.month}`;

  const data = useMemo(() => {
    const monthDays = Ym.getDaysInMonth(ym);

    return createNumberSequence(monthDays).map((index) => {
      const day = index + 1;

      const ymd = {
        year: ym.year,
        month: ym.month,
        day,
      };

      const tasks: Task[] = [];

      for (const task of props.tasks) {
        if (!task.targetYmd) {
          continue;
        }

        if (
          task.targetYmd.year !== ym.year ||
          task.targetYmd.month !== ym.month ||
          task.targetYmd.day !== day
        ) {
          continue;
        }

        tasks.push(task);
      }

      return { ymd, tasks };
    });
  }, [ym, props.tasks]);

  const firstDayOfNumber = Ym.getFirstDayOfNumber(ym);
  const lastDayOfNumber = Ym.getLastDayOfNumber(ym);

  return {
    title,
    data,
    moveToBefore,
    moveToAfter,
    firstDayOfNumber,
    lastDayOfNumber,
  };
}
