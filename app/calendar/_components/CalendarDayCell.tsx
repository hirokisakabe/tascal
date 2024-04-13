"use client";

import type { Task } from "@/app/_model/task";
import { Ymd } from "@/app/_model/ymd";
import { createNumberSequence } from "@/app/_utils/createNumberSequence";
import { format } from "date-fns";
import { useState } from "react";
import { Typography } from "../../_components/Typography";
import { AddTaskButton } from "./AddTaskButton";
import { CalendarDayCellDayLabel } from "./CalendarDayCellDayLabel";
import { CalendarDayCellShowMoreOrLessButton } from "./CalendarDayCellShowMoreOrLessButton";
import { TaskCard } from "./TaskCard";

export function CalendarDayCell({ ymd, tasks }: { ymd: Ymd; tasks: Task[] }) {
	const [showAll, setShowAll] = useState(false);

	const DEFAULT_NUMBER_OF_TASKS_TO_SHOW = 3;

	const needShowMore = tasks.length > DEFAULT_NUMBER_OF_TASKS_TO_SHOW;

	const tasksToShow = (() => {
		if (showAll) {
			return tasks;
		}
		return needShowMore
			? tasks.slice(0, DEFAULT_NUMBER_OF_TASKS_TO_SHOW)
			: tasks;
	})();

	const numberOfDummyTasks = needShowMore
		? 0
		: DEFAULT_NUMBER_OF_TASKS_TO_SHOW - tasks.length;

	const isToday = Ymd.convertYmdToStr(ymd) === format(new Date(), "yyyy-MM-dd");

	return (
		<div className="border-l border-t p-1">
			<div className=" flex items-center justify-between ">
				<CalendarDayCellDayLabel day={ymd.day} isToday={isToday} />
				<AddTaskButton targetYmd={ymd} />
			</div>
			<div className="space-y-0.5">
				{tasksToShow.map((task) => (
					<div className="px-1" key={task.id}>
						<TaskCard task={task} />
					</div>
				))}
			</div>
			{createNumberSequence(numberOfDummyTasks).map((i) => (
				<div key={i} className="invisible">
					<Typography>____</Typography>
				</div>
			))}
			{needShowMore ? (
				<CalendarDayCellShowMoreOrLessButton
					showAll={showAll}
					onShowLessButtonClick={() => setShowAll(false)}
					onShowMoreButtonClick={() => setShowAll(true)}
				/>
			) : (
				<div className="invisible">
					<Typography>____</Typography>
				</div>
			)}
		</div>
	);
}
