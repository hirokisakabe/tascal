import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
} from "@nextui-org/react";
import { deleteTask } from "../_actions/deleteTask";
import { updateTask } from "../_actions/updateTask/action";
import { updateTaskSchema } from "../_actions/updateTask/schema";
import { useCategories } from "../_hooks/useCategories";
import type { Task } from "../_model/task";
import { Ymd } from "../_model/ymd";
import { SubmitButton } from "./SubmitButton";
import { useForm } from "@conform-to/react";
import { parseWithZod } from "@conform-to/zod";
import { useFormState } from "react-dom";

type Props = {
  isOpen: boolean;
  onOpenChange: () => unknown;
  task: Task;
};

export function UpdateTaskModal(props: Props) {
  const updateTaskWithTaskId = updateTask.bind(null, props.task.id);

  const categories = useCategories();

  const [lastResult, action] = useFormState(updateTaskWithTaskId, {});
  const [form, fields] = useForm({
    lastResult,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: updateTaskSchema });
    },
    shouldValidate: "onBlur",
  });

  if (categories.state === "loading") {
    return (
      <Modal isOpen={props.isOpen} onOpenChange={props.onOpenChange}>
        <ModalContent>Loading</ModalContent>
      </Modal>
    );
  }

  if (categories.state === "error") {
    return (
      <Modal isOpen={props.isOpen} onOpenChange={props.onOpenChange}>
        <ModalContent>Error</ModalContent>
      </Modal>
    );
  }

  return (
    <Modal isOpen={props.isOpen} onOpenChange={props.onOpenChange}>
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              タスクを編集
            </ModalHeader>
            <form
              id={form.id}
              onSubmit={form.onSubmit}
              action={action}
              noValidate
            >
              <ModalBody>
                <Input
                  type="text"
                  name={fields.title.name}
                  label="タイトル"
                  defaultValue={props.task.title}
                  errorMessage={fields.title.errors}
                />
                <Input
                  type="date"
                  name={fields.targetDate.name}
                  label="実施日"
                  defaultValue={
                    props.task.targetYmd
                      ? Ymd.convertYmdToStr(props.task.targetYmd)
                      : undefined
                  }
                  errorMessage={fields.targetDate.errors}
                />
                <Select
                  label="カテゴリを選択"
                  name={fields.categoryId.name}
                  className="max-w-xs"
                  items={categories.categories}
                  defaultSelectedKeys={
                    props.task.category ? [props.task.category.id] : undefined
                  }
                  errorMessage={fields.categoryId.errors}
                >
                  {(category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  )}
                </Select>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  キャンセル
                </Button>
                <SubmitButton color="primary" onPress={onClose}>
                  完了
                </SubmitButton>
              </ModalFooter>
            </form>
            <ModalFooter>
              <div className="w-full grid place-content-center">
                <Button
                  size="sm"
                  color="danger"
                  variant="light"
                  onPress={async () => {
                    await deleteTask(props.task.id);
                    onClose();
                  }}
                >
                  タスクを削除
                </Button>
              </div>
            </ModalFooter>
          </>
        )}
      </ModalContent>
      )
    </Modal>
  );
}
