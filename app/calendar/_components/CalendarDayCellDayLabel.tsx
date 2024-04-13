type Props = {
	day: number;
	isToday: boolean;
};

export function CalendarDayCellDayLabel(props: Props) {
	return props.isToday ? (
		<div className="text-sm font-semibold text-blue-500">{props.day} 日</div>
	) : (
		<div className="text-sm text-slate-500">{props.day} 日</div>
	);
}
