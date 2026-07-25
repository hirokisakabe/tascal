import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { formatDateKey } from "../utils/calendar";
import { DatePicker } from "./DatePicker";

function DatePickerHarness({ initialValue = "" }: { initialValue?: string }) {
  const [value, setValue] = useState(initialValue);
  return <DatePicker id="date" value={value} onChange={setValue} />;
}

describe("DatePicker", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("曜日を月曜始まりで表示する", async () => {
    const user = userEvent.setup();
    render(<DatePickerHarness initialValue="2026-03-15" />);

    await user.click(screen.getByRole("button", { name: "日付を選択" }));

    const weekdayLabels = ["月", "火", "水", "木", "金", "土", "日"];
    const grid = screen.getByRole("grid", { name: "2026年3月" });
    const labels = grid.previousElementSibling;
    expect(labels?.textContent).toBe(weekdayLabels.join(""));
  });

  it("前月と翌月へ移動できる", async () => {
    const user = userEvent.setup();
    render(<DatePickerHarness initialValue="2026-03-15" />);

    await user.click(screen.getByRole("button", { name: "日付を選択" }));
    await user.click(screen.getByRole("button", { name: "前月" }));
    expect(screen.getByRole("grid", { name: "2026年2月" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "翌月" }));
    await user.click(screen.getByRole("button", { name: "翌月" }));
    expect(screen.getByRole("grid", { name: "2026年4月" })).toBeInTheDocument();
  });

  it("選択した日付を YYYY-MM-DD 形式で反映する", async () => {
    const user = userEvent.setup();
    render(<DatePickerHarness initialValue="2026-03-15" />);

    await user.click(screen.getByRole("button", { name: "日付を選択" }));
    await user.click(screen.getByRole("gridcell", { name: "2026-03-20" }));

    expect(
      screen.getByRole("button", { name: "日付を選択" }),
    ).toHaveTextContent("2026-03-20");
  });

  it("日付を未設定に戻せる", async () => {
    const user = userEvent.setup();
    render(<DatePickerHarness initialValue="2026-03-15" />);

    await user.click(screen.getByRole("button", { name: "日付を選択" }));
    await user.click(screen.getByRole("button", { name: "未設定に戻す" }));

    expect(
      screen.getByRole("button", { name: "日付を選択" }),
    ).toHaveTextContent("日付を選択");
  });

  it("選択中の日付と今日を視覚的に区別する", async () => {
    const today = new Date();
    const selectedDate = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() === 1 ? 2 : 1,
    );
    const todayKey = formatDateKey(today);
    const selectedKey = formatDateKey(selectedDate);
    const user = userEvent.setup();
    render(<DatePickerHarness initialValue={selectedKey} />);

    await user.click(screen.getByRole("button", { name: "日付を選択" }));

    expect(screen.getByRole("gridcell", { name: selectedKey })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("gridcell", { name: selectedKey })).toHaveClass(
      "bg-primary",
    );
    expect(screen.getByRole("gridcell", { name: todayKey })).toHaveClass(
      "ring-primary",
    );
  });

  it("キーボードで日付を移動・選択し、閉じるとトリガーへフォーカスを戻す", async () => {
    const user = userEvent.setup();
    render(<DatePickerHarness initialValue="2026-03-15" />);

    const trigger = screen.getByRole("button", { name: "日付を選択" });
    await user.click(trigger);

    const selectedDay = screen.getByRole("gridcell", { name: "2026-03-15" });
    expect(selectedDay).toHaveFocus();

    await user.keyboard("{ArrowRight}{Enter}");

    expect(trigger).toHaveTextContent("2026-03-16");
    expect(trigger).toHaveFocus();
    await waitFor(() => {
      expect(screen.queryByRole("grid")).not.toBeInTheDocument();
    });
  });

  it("PageDown で翌月の同じ日へ移動できる", async () => {
    const user = userEvent.setup();
    render(<DatePickerHarness initialValue="2026-03-15" />);

    await user.click(screen.getByRole("button", { name: "日付を選択" }));
    await user.keyboard("{PageDown}");

    const grid = screen.getByRole("grid", { name: "2026年4月" });
    expect(
      within(grid).getByRole("gridcell", { name: "2026-04-15" }),
    ).toHaveFocus();
  });
});
