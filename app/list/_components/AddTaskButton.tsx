"use client";

import { Button } from "@nextui-org/react";
import { useDisclosure } from "@nextui-org/react";
import { AddTaskModal } from "../../_components/AddTaskModal";

export default function AddTaskButton() {
	const { isOpen, onOpen, onOpenChange } = useDisclosure();

	return (
		<>
			<AddTaskModal isOpen={isOpen} onOpenChange={onOpenChange} />
			<Button radius="sm" onClick={onOpen}>
				タスクを追加
			</Button>
		</>
	);
}
