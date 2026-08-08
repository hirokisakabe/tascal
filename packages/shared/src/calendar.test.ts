import { afterEach, describe, expect, it, vi } from "vitest";
import {
  formatDateKey,
  getCalendarDateRange,
  getCalendarDays,
  isPast,
  isSameDay,
  isToday,
} from "./calendar";

describe("getCalendarDays", () => {
  it("月初を含む週の月曜日から常に42日を返す", () => {
    const days = getCalendarDays(2026, 4);

    expect(days).toHaveLength(42);
    expect(days[0]).toMatchObject({
      dateKey: "2026-03-30",
      isCurrentMonth: false,
    });
    expect(days[2]).toMatchObject({
      dateKey: "2026-04-01",
      isCurrentMonth: true,
    });
    expect(days[41].dateKey).toBe("2026-05-10");
  });

  it("年を跨ぐ月の境界を生成する", () => {
    const days = getCalendarDays(2026, 1);

    expect(days[0].dateKey).toBe("2025-12-29");
    expect(days.find((day) => day.dateKey === "2026-01-01")).toMatchObject({
      isCurrentMonth: true,
    });
    expect(days[41].dateKey).toBe("2026-02-08");
  });

  it("月曜始まりの月は前月パディングなしで始まる", () => {
    const days = getCalendarDays(2026, 6);

    expect(days[0]).toMatchObject({
      dateKey: "2026-06-01",
      isCurrentMonth: true,
    });
  });

  it("日曜始まりの月は前月パディングを6日含む", () => {
    const days = getCalendarDays(2026, 3);

    expect(days[0]).toMatchObject({
      dateKey: "2026-02-23",
      isCurrentMonth: false,
    });
    expect(days[6]).toMatchObject({
      dateKey: "2026-03-01",
      isCurrentMonth: true,
    });
  });

  it("各週を月曜日から日曜日の順で生成する", () => {
    const days = getCalendarDays(2026, 4);

    for (let row = 0; row < 6; row++) {
      expect(days[row * 7].date.getDay()).toBe(1);
      expect(days[row * 7 + 6].date.getDay()).toBe(0);
    }
  });

  it("うるう年の2月29日を当月として含める", () => {
    const leapDay = getCalendarDays(2028, 2).find(
      (day) => day.dateKey === "2028-02-29",
    );

    expect(leapDay).toMatchObject({ isCurrentMonth: true });
  });

  it.each([
    [2026, 6],
    [2026, 8],
    [2027, 2],
    [2028, 2],
  ])("%i年%i月も42セルを返す", (year, month) => {
    expect(getCalendarDays(year, month)).toHaveLength(42);
  });

  it("42日分のAPI取得範囲を返す", () => {
    expect(getCalendarDateRange(2026, 8)).toEqual({
      startDate: "2026-07-27",
      endDate: "2026-09-06",
    });
  });

  it.each([
    [99, 1, "year"],
    [2026.5, 1, "year"],
    [10_000, 1, "year"],
    [2026, 0, "month"],
    [2026, 1.5, "month"],
    [2026, 13, "month"],
  ])("不正な年・月 (%s, %s) を拒否する", (year, month, field) => {
    expect(() => getCalendarDays(year, month)).toThrow(
      new RangeError(
        field === "year"
          ? "year must be an integer between 100 and 9999"
          : "month must be an integer between 1 and 12",
      ),
    );
  });
});

describe("date helpers", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("ローカル日付をYYYY-MM-DDに変換する", () => {
    expect(formatDateKey(new Date(2026, 0, 2))).toBe("2026-01-02");
  });

  it("時刻を無視して同日を判定する", () => {
    expect(
      isSameDay(new Date(2026, 3, 13, 0, 0), new Date(2026, 3, 13, 23, 59)),
    ).toBe(true);
    expect(isSameDay(new Date(2026, 3, 13), new Date(2026, 3, 14))).toBe(false);
  });

  it("今日を判定する", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 3, 13, 12));

    expect(isToday(new Date(2026, 3, 13, 0))).toBe(true);
    expect(isToday(new Date(2026, 3, 12, 23, 59))).toBe(false);
  });

  it("今日を含めず過去日を判定する", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 3, 13, 0));

    expect(isPast(new Date(2026, 3, 12, 23, 59))).toBe(true);
    expect(isPast(new Date(2026, 3, 13, 0))).toBe(false);
    expect(isPast(new Date(2026, 3, 14, 0))).toBe(false);
  });
});
