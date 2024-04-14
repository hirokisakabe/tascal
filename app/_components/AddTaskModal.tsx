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
import { createTask } from "../_actions/createTask";
import { useCategories } from "../_hooks/useCategories";
import { Ymd } from "../_model/ymd";
import { SubmitButton } from "./SubmitButton";

type Props = {
	isOpen: boolean;
	onOpenChange: () => unknown;
	defaultTargetYmd?: Ymd;
};

export function AddTaskModal(props: Props) {
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
							タスクを追加
						</ModalHeader>
						<form action={createTask}>
							<ModalBody>
								<Input type="text" name="title" label="タイトル" />
								<Input
									type="date"
									name="targetDate"
									label="実施日"
									defaultValue={
										props.defaultTargetYmd
											? Ymd.convertYmdToStr(props.defaultTargetYmd)
											: undefined
									}
								/>
								<Select
									label="カテゴリを選択"
									name="category"
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
