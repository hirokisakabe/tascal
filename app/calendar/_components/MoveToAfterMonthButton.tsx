import { ChevronRightIcon } from "@heroicons/react/24/solid";
import { Button } from "@nextui-org/react";

type Props = {
	moveToAfter: () => unknown;
};

export function MoveToAfterMonthButton(props: Props) {
	return (
		<Button
			size="sm"
			isIconOnly
			variant="light"
			aria-label="次月に移動"
			onClick={props.moveToAfter}
		>
			<ChevronRightIcon />
		</Button>
	);
}
