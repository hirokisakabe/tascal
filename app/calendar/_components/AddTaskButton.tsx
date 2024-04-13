"use client";

import type { Ymd } from "@/app/_model/ymd";
import { PlusIcon } from "@heroicons/react/24/solid";
import { Button } from "@nextui-org/react";
import { useDisclosure } from "@nextui-org/react";
import { AddTaskModal } from "../../_components/AddTaskModal";

type Props = {
	targetYmd: Ymd;
};

export function AddTaskButton(props: Props) {
	const { isOpen, onOpen, onOpenChange } = useDisclosure();

	return (
		<>
			<AddTaskModal
				isOpen={isOpen}
				onOpenChange={onOpenChange}
				defaultTargetYmd={props.targetYmd}
			/>
			<Button
				size="sm"
				isIconOnly
				variant="light"
				aria-label="タスクを追加"
				onClick={onOpen}
			>
				<PlusIcon />
			</Button>
		</>
	);
}
