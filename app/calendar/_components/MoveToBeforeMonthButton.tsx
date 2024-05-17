import { ChevronLeftIcon } from "@heroicons/react/24/solid";
import { Button } from "@nextui-org/react";

type Props = {
  moveToBefore: () => unknown;
};

export function MoveToBeforeMonthButton(props: Props) {
  return (
    <Button
      size="sm"
      isIconOnly
      variant="light"
      aria-label="前月に移動"
      onClick={props.moveToBefore}
    >
      <ChevronLeftIcon />
    </Button>
  );
}
