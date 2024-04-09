import * as DateFns from "date-fns";
import { z } from "zod";
import { DayOfNumber } from "./dayOfNumber";

const YmSchema = z.object({
	year: z.number(),
	month: z.number(), // 1-12
});

export type Ym = z.infer<typeof YmSchema>;

export const Ym = {
	getThisYm,
	convertYmToDate,
	convertDateToYm,
	getFirstDayOfNumber,
	getLastDayOfNumber,
	getBeforeYm,
	getAfterYm,
	getDaysInMonth,
};

export function isYm(target: unknown) {
	return YmSchema.safeParse(target);
}

function convertYmToDate(ym: Ym) {
	return new Date(`${ym.year}-${ym.month}-01`);
}

function convertDateToYm(date: Date) {
	const month = DateFns.getMonth(date) + 1;
	const year = DateFns.getYear(date);

	const ym = { year, month };

	return isYm(ym);
}

function getThisYm() {
	const today = new Date();

	const ym = convertDateToYm(today);

	if (!ym.success) {
		throw new Error("Failed to get this year and month.");
	}

	return ym.data;
}

function getFirstDayOfNumber(ym: Ym) {
	const date = convertYmToDate(ym);

	const maybeDayOfNumber = DateFns.getDay(date);

	const dayOfNumber = DayOfNumber.isDayOfNumber(maybeDayOfNumber);

	if (!dayOfNumber.success) {
		throw new Error("Failed to get the first day of the number.");
	}

	return dayOfNumber.data;
}

function getLastDayOfNumber(ym: Ym) {
	const date = convertYmToDate(ym);

	const maybeLastDayOfNumber = DateFns.getDay(DateFns.lastDayOfMonth(date));

	const lastDayOfNumber = DayOfNumber.isDayOfNumber(maybeLastDayOfNumber);

	if (!lastDayOfNumber.success) {
		throw new Error("Failed to get the last day of the number.");
	}

	return lastDayOfNumber.data;
}

function getBeforeYm(ym: Ym) {
	if (ym.month !== 1) {
		return { year: ym.year, month: ym.month - 1 };
	}

	return { year: ym.year - 1, month: 12 };
}
function getAfterYm(ym: Ym) {
	if (ym.month !== 12) {
		return { year: ym.year, month: ym.month + 1 };
	}

	return { year: ym.year + 1, month: ym.month };
}
function getDaysInMonth(ym: Ym) {
	const monthFirstDate = convertYmToDate(ym);

	return DateFns.getDaysInMonth(monthFirstDate);
}
