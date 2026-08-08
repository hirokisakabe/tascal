const SWIPE_ACTIVATION_DISTANCE = 12;
const SWIPE_DISTANCE_RATIO = 0.2;
const SWIPE_VELOCITY_THRESHOLD = 0.55;

type CalendarMonth = {
  month: number;
  year: number;
};

export type MonthSwipeDirection = "next" | "previous";

export function shiftCalendarMonth(
  { month, year }: CalendarMonth,
  offset: -1 | 1,
): CalendarMonth {
  const shifted = new Date(year, month - 1 + offset, 1);
  return {
    month: shifted.getMonth() + 1,
    year: shifted.getFullYear(),
  };
}

export function shouldActivateMonthSwipe(
  distanceX: number,
  distanceY: number,
): boolean {
  const horizontalDistance = Math.abs(distanceX);
  return (
    horizontalDistance >= SWIPE_ACTIVATION_DISTANCE &&
    horizontalDistance > Math.abs(distanceY) * 1.5
  );
}

export function resolveMonthSwipe(
  distanceX: number,
  velocityX: number,
  calendarWidth: number,
): MonthSwipeDirection | null {
  if (calendarWidth <= 0) return null;

  const distanceThreshold = calendarWidth * SWIPE_DISTANCE_RATIO;
  const completedByDistance = Math.abs(distanceX) >= distanceThreshold;
  const completedByVelocity =
    Math.abs(distanceX) >= SWIPE_ACTIVATION_DISTANCE &&
    Math.abs(velocityX) >= SWIPE_VELOCITY_THRESHOLD;

  if (!completedByDistance && !completedByVelocity) return null;
  return distanceX < 0 ? "next" : "previous";
}
