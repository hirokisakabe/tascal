import { z } from "zod";

const DayOfNumberSchema = z.union([
  z.literal(0),
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
  z.literal(6),
]);

export type DayOfNumber = z.infer<typeof DayOfNumberSchema>;

export const DayOfNumber = {
  isDayOfNumber,
  convertDayOfNumberToDayName,
};

function isDayOfNumber(target: unknown) {
  return DayOfNumberSchema.safeParse(target);
}

function convertDayOfNumberToDayName(dayOfNumber: DayOfNumber) {
  const dayName = (() => {
    switch (dayOfNumber) {
      case 0:
        return "日";
      case 1:
        return "月";
      case 2:
        return "火";
      case 3:
        return "水";
      case 4:
        return "木";
      case 5:
        return "金";
      case 6:
        return "土";
    }
  })();

  return dayName;
}
