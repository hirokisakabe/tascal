import { describe, it, expect, vi, afterEach } from "vitest";
import { getCalendarDays, isPast } from "./calendar";

describe("getCalendarDays (月曜始まり)", () => {
  it("2026年4月: 水曜始まり → 先頭2日が前月パディング", () => {
    // 2026-04-01 は水曜日
    const days = getCalendarDays(2026, 4);

    // 先頭は前月パディング（3/30 月曜, 3/31 火曜）
    expect(days[0].date.getDate()).toBe(30);
    expect(days[0].date.getMonth()).toBe(2); // 3月 = index 2
    expect(days[0].isCurrentMonth).toBe(false);

    expect(days[1].date.getDate()).toBe(31);
    expect(days[1].isCurrentMonth).toBe(false);

    // 3番目が4/1（水曜）
    expect(days[2].date.getDate()).toBe(1);
    expect(days[2].date.getMonth()).toBe(3); // 4月 = index 3
    expect(days[2].isCurrentMonth).toBe(true);
  });

  it("2026年6月: 月曜始まり → パディングなし", () => {
    // 2026-06-01 は月曜日
    const days = getCalendarDays(2026, 6);

    // 先頭が6/1（月曜）
    expect(days[0].date.getDate()).toBe(1);
    expect(days[0].date.getMonth()).toBe(5); // 6月 = index 5
    expect(days[0].isCurrentMonth).toBe(true);
  });

  it("2026年3月: 日曜始まり → 前月パディング6日", () => {
    // 2026-03-01 は日曜日 → 月曜始まりなので前に6日のパディング
    const days = getCalendarDays(2026, 3);

    // 先頭は2/23（月曜）
    expect(days[0].date.getDate()).toBe(23);
    expect(days[0].date.getMonth()).toBe(1); // 2月 = index 1
    expect(days[0].isCurrentMonth).toBe(false);

    // 7番目が3/1（日曜）
    expect(days[6].date.getDate()).toBe(1);
    expect(days[6].date.getMonth()).toBe(2); // 3月 = index 2
    expect(days[6].isCurrentMonth).toBe(true);
  });

  it("常に42セル（6行）を返す", () => {
    // 5週で収まる月（2026年6月: 月曜始まり, 30日）
    expect(getCalendarDays(2026, 6)).toHaveLength(42);

    // 6週必要な月（2026年8月: 土曜始まり, 31日）
    expect(getCalendarDays(2026, 8)).toHaveLength(42);

    // パディングなし + 28日（2027年2月: 月曜始まり）
    expect(getCalendarDays(2027, 2)).toHaveLength(42);
  });

  it("各行が月〜日の順に並ぶ (2026年4月)", () => {
    const days = getCalendarDays(2026, 4);

    // 各行（7日ずつ）の最初は月曜、最後は日曜
    for (let row = 0; row < days.length / 7; row++) {
      const firstOfRow = days[row * 7].date.getDay();
      const lastOfRow = days[row * 7 + 6].date.getDay();
      expect(firstOfRow).toBe(1); // 月曜
      expect(lastOfRow).toBe(0); // 日曜
    }
  });
});

describe("isPast", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("昨日は過去日と判定される", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 3, 13)); // 2026-04-13

    expect(isPast(new Date(2026, 3, 12))).toBe(true);
  });

  it("今日は過去日に含まれない", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 3, 13));

    expect(isPast(new Date(2026, 3, 13))).toBe(false);
  });

  it("明日は過去日に含まれない", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 3, 13));

    expect(isPast(new Date(2026, 3, 14))).toBe(false);
  });

  it("時刻に関係なく日付単位で比較する", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 3, 13, 0, 0, 0)); // 深夜0時

    // 前日の23:59でも過去日
    expect(isPast(new Date(2026, 3, 12, 23, 59, 59))).toBe(true);
  });
});
