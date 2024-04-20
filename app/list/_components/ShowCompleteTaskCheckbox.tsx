"use client";

import { Checkbox } from "@nextui-org/react";
import { useRouter } from "next/navigation";

export default function ShowCompleteTaskCheckbox() {
	const router = useRouter();

	return (
		<Checkbox
			onValueChange={(isSelected) => {
				if (isSelected) {
					router.push("/?showCompleteTask=true");
				} else {
					router.push("/");
				}
			}}
		>
			完了済のタスクも表示する
		</Checkbox>
	);
}
