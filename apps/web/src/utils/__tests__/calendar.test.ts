import { describe, it, expect } from "vitest";
import { getCalendarDays } from "../calendar";

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

  it("各行が月〜日の順に並ぶ", () => {
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
