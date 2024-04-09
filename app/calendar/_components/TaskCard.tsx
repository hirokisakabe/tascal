"use client";

import type { Task } from "@/app/_model/task";
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
			<UpdateTaskModal isOpen={isOpen} onOpenChange={onOpenChange} />
			<button type="button" onClick={onOpen}>
				<div>{props.task.title}</div>
			</button>
		</>
	);
}
