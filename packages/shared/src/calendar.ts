type CalendarDay = {
  date: Date;
  dateKey: string;
  isCurrentMonth: boolean;
};

function assertValidCalendarMonth(year: number, month: number): void {
  if (!Number.isInteger(year) || year < 100 || year > 9999) {
    throw new RangeError("year must be an integer between 100 and 9999");
  }
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new RangeError("month must be an integer between 1 and 12");
  }
}

export function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function isSameDay(first: Date, second: Date): boolean {
  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  );
}

export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

export function isPast(date: Date): boolean {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return target.getTime() < today.getTime();
}

export function getCalendarDays(year: number, month: number): CalendarDay[] {
  assertValidCalendarMonth(year, month);

  const firstDay = new Date(year, month - 1, 1);
  const mondayOffset = (firstDay.getDay() + 6) % 7;
  const calendarStart = new Date(year, month - 1, 1 - mondayOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(
      calendarStart.getFullYear(),
      calendarStart.getMonth(),
      calendarStart.getDate() + index,
    );
    return {
      date,
      dateKey: formatDateKey(date),
      isCurrentMonth:
        date.getFullYear() === year && date.getMonth() === month - 1,
    };
  });
}

export function getCalendarDateRange(
  year: number,
  month: number,
): {
  startDate: string;
  endDate: string;
} {
  const days = getCalendarDays(year, month);
  return {
    startDate: days[0].dateKey,
    endDate: days[days.length - 1].dateKey,
  };
}
