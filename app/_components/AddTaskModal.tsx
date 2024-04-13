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
import { Ymd } from "../_model/ymd";

type Props = {
	isOpen: boolean;
	onOpenChange: () => unknown;
	defaultTargetYmd?: Ymd;
};

const categories = [
	{ categoryId: "1", label: "dummy_1" },
	{ categoryId: "2", label: "dummy_2" },
	{ categoryId: "3", label: "dummy_3" },
];

export function AddTaskModal(props: Props) {
	return (
		<Modal isOpen={props.isOpen} onOpenChange={props.onOpenChange}>
			<ModalContent>
				{(onClose) => (
					<>
						<ModalHeader className="flex flex-col gap-1">
							タスクを追加
						</ModalHeader>
						<ModalBody>
							<Input type="text" label="タイトル" />
							<Input
								type="date"
								label="実施日"
								defaultValue={
									props.defaultTargetYmd
										? Ymd.convertYmdToStr(props.defaultTargetYmd)
										: undefined
								}
							/>
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
							<Button color="primary" onPress={onClose}>
								追加
							</Button>
						</ModalFooter>
					</>
				)}
			</ModalContent>
		</Modal>
	);
}
