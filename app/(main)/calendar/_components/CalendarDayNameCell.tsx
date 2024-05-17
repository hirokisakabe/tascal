import { DayOfNumber } from "@/app/_model/dayOfNumber";

export function CalendarDayNameCell({ dayNumber }: { dayNumber: DayOfNumber }) {
  return (
    <div className="border-l border-t pl-2">
      <div className="text-sm text-slate-500">
        {DayOfNumber.convertDayOfNumberToDayName(dayNumber)}
      </div>
    </div>
  );
}
