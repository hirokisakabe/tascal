import {
  resolveMonthSwipe,
  shiftCalendarMonth,
  shouldActivateMonthSwipe,
} from "@/utils/month-swipe";

describe("month swipe", () => {
  describe("shiftCalendarMonth", () => {
    it("12月から翌年1月へ進む", () => {
      expect(shiftCalendarMonth({ year: 2026, month: 12 }, 1)).toEqual({
        year: 2027,
        month: 1,
      });
    });

    it("1月から前年12月へ戻る", () => {
      expect(shiftCalendarMonth({ year: 2026, month: 1 }, -1)).toEqual({
        year: 2025,
        month: 12,
      });
    });
  });

  describe("gesture intent", () => {
    it("横方向へ十分に動いた場合だけスワイプを開始する", () => {
      expect(shouldActivateMonthSwipe(18, 3)).toBe(true);
      expect(shouldActivateMonthSwipe(8, 1)).toBe(false);
      expect(shouldActivateMonthSwipe(18, 16)).toBe(false);
    });

    it("左スワイプで翌月、右スワイプで前月へ移動する", () => {
      expect(resolveMonthSwipe(-80, -0.2, 320)).toBe("next");
      expect(resolveMonthSwipe(80, 0.2, 320)).toBe("previous");
    });

    it("短く遅いスワイプはキャンセルする", () => {
      expect(resolveMonthSwipe(-40, -0.2, 320)).toBeNull();
      expect(resolveMonthSwipe(40, 0.2, 320)).toBeNull();
    });

    it("短くても勢いのあるスワイプは移動を完了する", () => {
      expect(resolveMonthSwipe(-24, -0.8, 320)).toBe("next");
      expect(resolveMonthSwipe(24, 0.8, 320)).toBe("previous");
    });

    it("レイアウト幅が未確定の間は月を移動しない", () => {
      expect(resolveMonthSwipe(-24, -0.8, 0)).toBeNull();
    });
  });
});
