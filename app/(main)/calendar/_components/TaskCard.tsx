"use client";

import type { Task } from "@/app/_model/task";
import { useDisclosure } from "@nextui-org/react";
import { UpdateTaskModal } from "../../../_components/UpdateTaskModal";

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
        <span>{props.task.title}</span>
      </button>
    </>
  );
}
