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
import { createTask } from "../_actions/createTask/action";
import { createTaskSchema } from "../_actions/createTask/schema";
import { useCategories } from "../_hooks/useCategories";
import { Ymd } from "../_model/ymd";
import { SubmitButton } from "./SubmitButton";
import { useForm } from "@conform-to/react";
import { parseWithZod } from "@conform-to/zod";
import { useFormState } from "react-dom";

type Props = {
  isOpen: boolean;
  onOpenChange: () => unknown;
  defaultTargetYmd?: Ymd;
};

export function AddTaskModal(props: Props) {
  const categories = useCategories();

  const [lastResult, action] = useFormState(createTask, {});
  const [form, fields] = useForm({
    lastResult,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: createTaskSchema });
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
              タスクを追加
            </ModalHeader>
            <form
              id={form.id}
              onSubmit={form.onSubmit}
              action={action}
              noValidate
            >
              <ModalBody>
                <Input type="text" name={fields.title.name} label="タイトル" />
                <Input
                  type="date"
                  name={fields.targetDate.name}
                  label="実施日"
                  defaultValue={
                    props.defaultTargetYmd
                      ? Ymd.convertYmdToStr(props.defaultTargetYmd)
                      : undefined
                  }
                />
                <Select
                  label="カテゴリを選択"
                  name={fields.categoryId.name}
                  className="max-w-xs"
                  items={categories.categories}
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
                  追加
                </SubmitButton>
              </ModalFooter>
            </form>
          </>
        )}
      </ModalContent>
      )
    </Modal>
  );
}
