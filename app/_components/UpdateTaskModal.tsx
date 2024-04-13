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
import { updateTask } from "../_actions/updateTask";
import { useCategories } from "../_hooks/useCategories";
import type { Task } from "../_model/task";
import { Ymd } from "../_model/ymd";
import { SubmitButton } from "./SubmitButton";

type Props = {
	isOpen: boolean;
	onOpenChange: () => unknown;
	task: Task;
};

export function UpdateTaskModal(props: Props) {
	const updateTaskWithTaskId = updateTask.bind(null, props.task.id);

	const categories = useCategories();

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
						<form action={updateTaskWithTaskId}>
							<ModalBody>
								<Input
									type="text"
									name="title"
									label="タイトル"
									defaultValue={props.task.title}
								/>
								<Input
									type="date"
									name="targetDate"
									label="実施日"
									defaultValue={
										props.task.targetYmd
											? Ymd.convertYmdToStr(props.task.targetYmd)
											: undefined
									}
								/>
								<Select
									label="カテゴリを選択"
									name="category"
									className="max-w-xs"
									items={categories.categories}
									defaultSelectedKeys={
										props.task.category ? [props.task.category.id] : undefined
									}
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
