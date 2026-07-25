import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { useEffect, useRef, useState } from "react";
import { formatDateKey, getCalendarDays, isToday } from "../utils/calendar";

const WEEKDAY_LABELS = ["月", "火", "水", "木", "金", "土", "日"];

type DatePickerProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
};

function parseDateKey(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const date = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
  );
  return formatDateKey(date) === value ? date : null;
}

function getDateInAdjacentMonth(date: Date, offset: number): Date {
  const year = date.getFullYear();
  const month = date.getMonth() + offset;
  const lastDay = new Date(year, month + 1, 0).getDate();
  return new Date(year, month, Math.min(date.getDate(), lastDay));
}

export function DatePicker({ id, value, onChange }: DatePickerProps) {
  const selectedDate = parseDateKey(value);
  const initialDate = selectedDate ?? new Date();
  const [visibleMonth, setVisibleMonth] = useState(
    () => new Date(initialDate.getFullYear(), initialDate.getMonth(), 1),
  );
  const [focusedDateKey, setFocusedDateKey] = useState(() =>
    formatDateKey(initialDate),
  );
  const dayButtonRefs = useRef(new Map<string, HTMLButtonElement>());
  const shouldFocusDay = useRef(false);

  useEffect(() => {
    const nextSelectedDate = parseDateKey(value);
    if (!nextSelectedDate) return;

    setVisibleMonth(
      new Date(nextSelectedDate.getFullYear(), nextSelectedDate.getMonth(), 1),
    );
    setFocusedDateKey(value);
  }, [value]);

  const focusDayAfterRender = () => {
    shouldFocusDay.current = true;
  };

  const moveMonth = (offset: number) => {
    const nextMonth = new Date(
      visibleMonth.getFullYear(),
      visibleMonth.getMonth() + offset,
      1,
    );
    const focusedDate = parseDateKey(focusedDateKey) ?? nextMonth;
    const nextFocusedDate = new Date(
      nextMonth.getFullYear(),
      nextMonth.getMonth(),
      Math.min(
        focusedDate.getDate(),
        new Date(
          nextMonth.getFullYear(),
          nextMonth.getMonth() + 1,
          0,
        ).getDate(),
      ),
    );

    setVisibleMonth(nextMonth);
    setFocusedDateKey(formatDateKey(nextFocusedDate));
  };

  const handleDayKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    date: Date,
  ) => {
    let nextDate: Date | null = null;

    switch (event.key) {
      case "ArrowLeft":
        nextDate = new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate() - 1,
        );
        break;
      case "ArrowRight":
        nextDate = new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate() + 1,
        );
        break;
      case "ArrowUp":
        nextDate = new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate() - 7,
        );
        break;
      case "ArrowDown":
        nextDate = new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate() + 7,
        );
        break;
      case "Home": {
        const mondayBasedDay = (date.getDay() + 6) % 7;
        nextDate = new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate() - mondayBasedDay,
        );
        break;
      }
      case "End": {
        const mondayBasedDay = (date.getDay() + 6) % 7;
        nextDate = new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate() + (6 - mondayBasedDay),
        );
        break;
      }
      case "PageUp":
        nextDate = getDateInAdjacentMonth(date, -1);
        break;
      case "PageDown":
        nextDate = getDateInAdjacentMonth(date, 1);
        break;
      default:
        return;
    }

    event.preventDefault();
    const nextKey = formatDateKey(nextDate);
    focusDayAfterRender();
    setFocusedDateKey(nextKey);
    if (
      nextDate.getFullYear() !== visibleMonth.getFullYear() ||
      nextDate.getMonth() !== visibleMonth.getMonth()
    ) {
      setVisibleMonth(new Date(nextDate.getFullYear(), nextDate.getMonth(), 1));
    }
  };

  const days = getCalendarDays(
    visibleMonth.getFullYear(),
    visibleMonth.getMonth() + 1,
  );

  return (
    <Popover className="relative">
      {({ open, close }) => (
        <>
          <PopoverButton
            id={id}
            onClick={() => {
              if (!open) {
                const dateToFocus = selectedDate ?? new Date();
                setVisibleMonth(
                  new Date(
                    dateToFocus.getFullYear(),
                    dateToFocus.getMonth(),
                    1,
                  ),
                );
                setFocusedDateKey(formatDateKey(dateToFocus));
                focusDayAfterRender();
              }
            }}
            className="flex w-full items-center justify-between rounded-md border border-border px-3 py-2 text-left text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            aria-label="日付を選択"
          >
            <span
              className={value ? "text-on-surface" : "text-on-surface-muted"}
            >
              {value || "日付を選択"}
            </span>
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 w-4 text-on-surface-muted"
            >
              <path
                fillRule="evenodd"
                d="M6 1.75a.75.75 0 0 1 .75.75V3h6.5v-.5a.75.75 0 0 1 1.5 0V3h.75A2.5 2.5 0 0 1 18 5.5v10a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 2 15.5v-10A2.5 2.5 0 0 1 4.5 3h.75v-.5A.75.75 0 0 1 6 1.75ZM3.5 7v8.5a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1V7h-13Z"
                clipRule="evenodd"
              />
            </svg>
          </PopoverButton>

          <PopoverPanel
            transition
            className="absolute z-10 mt-2 w-72 rounded-lg border border-border bg-white p-3 shadow-xl transition duration-100 ease-out data-[closed]:scale-95 data-[closed]:opacity-0"
          >
            <div className="mb-3 flex items-center justify-between">
              <button
                type="button"
                onClick={() => moveMonth(-1)}
                className="rounded-md p-1.5 text-on-surface-secondary hover:bg-surface-hover focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label="前月"
              >
                ←
              </button>
              <div
                className="text-sm font-bold text-on-surface"
                aria-live="polite"
              >
                {visibleMonth.getFullYear()}年{visibleMonth.getMonth() + 1}月
              </div>
              <button
                type="button"
                onClick={() => moveMonth(1)}
                className="rounded-md p-1.5 text-on-surface-secondary hover:bg-surface-hover focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label="翌月"
              >
                →
              </button>
            </div>

            <div className="grid grid-cols-7" aria-label="曜日">
              {WEEKDAY_LABELS.map((label) => (
                <div
                  key={label}
                  className="pb-1 text-center text-xs font-medium text-on-surface-muted"
                >
                  {label}
                </div>
              ))}
            </div>

            <div
              role="grid"
              aria-label={`${visibleMonth.getFullYear()}年${visibleMonth.getMonth() + 1}月`}
              className="grid grid-cols-7"
            >
              {days.map(({ date, isCurrentMonth }) => {
                const dateKey = formatDateKey(date);
                const selected = dateKey === value;
                const today = isToday(date);

                return (
                  <button
                    key={dateKey}
                    ref={(element) => {
                      if (element) {
                        dayButtonRefs.current.set(dateKey, element);
                        if (
                          shouldFocusDay.current &&
                          dateKey === focusedDateKey
                        ) {
                          element.focus();
                          shouldFocusDay.current = false;
                        }
                      } else {
                        dayButtonRefs.current.delete(dateKey);
                      }
                    }}
                    type="button"
                    role="gridcell"
                    aria-label={dateKey}
                    aria-selected={selected}
                    tabIndex={dateKey === focusedDateKey ? 0 : -1}
                    onFocus={() => setFocusedDateKey(dateKey)}
                    onKeyDown={(event) => handleDayKeyDown(event, date)}
                    onClick={() => {
                      onChange(dateKey);
                      close();
                    }}
                    className={`m-0.5 flex h-8 w-8 items-center justify-center rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 ${
                      selected
                        ? "bg-primary font-bold text-white hover:bg-primary-dark"
                        : today
                          ? "font-bold text-primary ring-1 ring-primary"
                          : isCurrentMonth
                            ? "text-on-surface hover:bg-surface-hover"
                            : "text-on-surface-muted hover:bg-surface-hover"
                    }`}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => {
                onChange("");
                close();
              }}
              disabled={!value}
              className="mt-2 w-full rounded-md border border-border px-3 py-1.5 text-sm text-on-surface-secondary hover:bg-surface-hover focus:outline-none focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-40"
            >
              未設定に戻す
            </button>
          </PopoverPanel>
        </>
      )}
    </Popover>
  );
}
