export type CalendarDay = {
  date: Date;
  isCurrentMonth: boolean;
};

export function getCalendarDays(year: number, month: number): CalendarDay[] {
  const firstDay = new Date(year, month - 1, 1);
  const startDayOfWeek = firstDay.getDay(); // 0 = Sunday

  const days: CalendarDay[] = [];

  // 前月のパディング
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    days.push({
      date: new Date(year, month - 1, -i),
      isCurrentMonth: false,
    });
  }

  // 当月の日付
  const daysInMonth = new Date(year, month, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    days.push({
      date: new Date(year, month - 1, d),
      isCurrentMonth: true,
    });
  }

  // 翌月のパディング (6行 = 42セルまで埋める)
  const totalCells = days.length <= 35 ? 35 : 42;
  const remaining = totalCells - days.length;
  for (let i = 1; i <= remaining; i++) {
    days.push({
      date: new Date(year, month, i),
      isCurrentMonth: false,
    });
  }

  return days;
}

export function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function isToday(date: Date): boolean {
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}
