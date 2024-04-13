import * as DateFns from "date-fns";
import { z } from "zod";

export const YmdSchema = z.object({
	year: z.number(),
	month: z.number(),
	day: z.number(), // 1~31
});

export type Ymd = z.infer<typeof YmdSchema>;

export const Ymd = { isYmd, convertYmdToStr, convertDateToYmd, getDate };

function isYmd(target: unknown) {
	return YmdSchema.safeParse(target);
}

function convertYmdToStr(ymd: Ymd) {
	const y = ymd.year;
	const m = `${ymd.month}`.padStart(2, "0");
	const d = `${ymd.day}`.padStart(2, "0");
	return `${y}-${m}-${d}` as const;
}

function convertDateToYmd(date: Date) {
	const month = DateFns.getMonth(date) + 1;
	const year = DateFns.getYear(date);
	const day = DateFns.getDate(date);

	const ym = { year, month, day };

	return isYmd(ym);
}

function getDate(ymd: Ymd) {
	return ymd.day;
}
