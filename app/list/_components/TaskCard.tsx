"use client";

import { completeTask } from "@/app/_actions/completeTask";
import { uncompleteTask } from "@/app/_actions/uncompleteTask";
import type { Task } from "@/app/_model/task";
import { Ymd } from "@/app/_model/ymd";
import { CheckIcon } from "@heroicons/react/24/solid";
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
      <Card className={props.task.isCompleted ? "bg-zinc-50" : ""}>
        <CardBody>
          <div className="flex  items-center px-3">
            <button className="grow flex" type="button" onClick={onOpen}>
              <div className="basis-3/4 flex justify-start">
                {props.task.isCompleted ? (
                  <div className="line-through text-zinc-500">
                    {props.task.title}
                  </div>
                ) : (
                  <div>{props.task.title}</div>
                )}
              </div>
              <div className="basis-1/4 flex justify-start">
                {props.task.targetYmd
                  ? Ymd.convertYmdToStr(props.task.targetYmd)
                  : null}
              </div>
            </button>
            <div className="flex justify-end">
              {props.task.isCompleted ? (
                <Button
                  size="sm"
                  isIconOnly
                  variant="faded"
                  aria-label="Check"
                  onClick={() => uncompleteTask(props.task.id)}
                >
                  <CheckIcon />
                </Button>
              ) : (
                <Button
                  size="sm"
                  isIconOnly
                  variant="light"
                  aria-label="Check"
                  onClick={() => completeTask(props.task.id)}
                >
                  <CheckIcon />
                </Button>
              )}
            </div>
          </div>
        </CardBody>
      </Card>
    </>
  );
}
