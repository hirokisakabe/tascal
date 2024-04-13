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
import { deleteTask, updateTask } from "../_lib/actions";

type Props = {
	isOpen: boolean;
	onOpenChange: () => unknown;
};

const categories = [
	{ categoryId: "1", label: "dummy_1" },
	{ categoryId: "2", label: "dummy_2" },
	{ categoryId: "3", label: "dummy_3" },
];

export function UpdateTaskModal(props: Props) {
	return (
		<Modal isOpen={props.isOpen} onOpenChange={props.onOpenChange}>
			<ModalContent>
				{(onClose) => (
					<>
						<ModalHeader className="flex flex-col gap-1">
							タスクを編集
						</ModalHeader>
						<form action={updateTask}>
							<ModalBody>
								<Input type="text" label="タイトル" />
								<Input type="date" label="実施日" />
								<Select label="カテゴリを選択" className="max-w-xs">
									{categories.map((category) => (
										<SelectItem
											key={category.categoryId}
											value={category.categoryId}
										>
											{category.label}
										</SelectItem>
									))}
								</Select>
							</ModalBody>
							<ModalFooter>
								<Button color="danger" variant="light" onPress={onClose}>
									キャンセル
								</Button>
								<Button color="primary" type="submit" onPress={onClose}>
									完了
								</Button>
							</ModalFooter>
						</form>
						<ModalFooter>
							<div className="w-full grid place-content-center">
								<Button
									size="sm"
									color="danger"
									variant="light"
									onPress={async () => {
										await deleteTask();
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
		</Modal>
	);
}
