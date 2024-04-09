import { DayOfNumber } from "@/app/_model/dayOfNumber";
import type { Task } from "@/app/_model/task";
import type { Ymd } from "@/app/_model/ymd";
import { createNumberSequence } from "@/app/_utils/createNumberSequence";
import { CalendarBeforeMonthDayCell } from "./CalendarBeforeMonthDayCell";
import { CalendarDayCell } from "./CalendarDayCell";
import { CalendarDayNameCell } from "./CalendarDayNameCell";
import { MoveToAfterMonthButton } from "./MoveToAfterMonthButton";
import { MoveToBeforeMonthButton } from "./MoveToBeforeMonthButton";

type Props = {
	title: string;
	data: {
		ymd: Ymd;
		tasks: Task[];
	}[];
	moveToBefore: () => unknown;
	moveToAfter: () => unknown;
	firstDayOfNumber: DayOfNumber;
	lastDayOfNumber: DayOfNumber;
};

export function TaskCalendar(props: Props) {
	const {
		title,
		data,
		moveToBefore,
		moveToAfter,
		firstDayOfNumber,
		lastDayOfNumber,
	} = props;

	return (
		<div className="w-full py-3">
			<div className="flex justify-between py-1">
				<div>
					<MoveToBeforeMonthButton moveToBefore={moveToBefore} />
				</div>
				<div>
					<div>{title}</div>
				</div>
				<div>
					<MoveToAfterMonthButton moveToAfter={moveToAfter} />
				</div>
			</div>
			<div className="py-1 grid grid-cols-7 border-b border-r">
				{createNumberSequence(7).map((i) => {
					const dayOfNumber = DayOfNumber.isDayOfNumber(i);
					return dayOfNumber.success ? (
						<CalendarDayNameCell key={i} dayNumber={dayOfNumber.data} />
					) : null;
				})}
				{createNumberSequence(firstDayOfNumber).map((i) => (
					<CalendarBeforeMonthDayCell key={i} />
				))}
				{data.map(({ ymd, tasks }) => (
					<CalendarDayCell key={ymd.day} ymd={ymd} tasks={tasks} />
				))}
				{createNumberSequence(6 - lastDayOfNumber).map((i) => (
					<CalendarBeforeMonthDayCell key={i} />
				))}
			</div>
		</div>
	);
}
