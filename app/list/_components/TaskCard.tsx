"use client";

import type { Task } from "@/app/_model/task";
import { Ymd } from "@/app/_model/ymd";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import { Button, Card, CardBody, useDisclosure } from "@nextui-org/react";
import { UpdateTaskModal } from "../../_components/UpdateTaskModal";

type Props = {
	task: Task;
};

export function TaskCard(props: Props) {
	const { isOpen, onOpen, onOpenChange } = useDisclosure();
	return (
		<>
			<UpdateTaskModal
				isOpen={isOpen}
				onOpenChange={onOpenChange}
				task={props.task}
			/>
			<button type="button" onClick={onOpen}>
				<Card>
					<CardBody>
						<div className="flex  items-center px-3">
							<div className="basis-1/2">{props.task.title}</div>
							<div className="basis-1/4">
								<div className="flex justify-end">
									{props.task.targetYmd
										? Ymd.convertYmdToStr(props.task.targetYmd)
										: null}
								</div>
							</div>
							<div className="basis-1/4">
								<div className="flex justify-end">
									<Button isIconOnly variant="light" aria-label="Check">
										<CheckCircleIcon />
									</Button>
								</div>
							</div>
						</div>
					</CardBody>
				</Card>
			</button>
		</>
	);
}
