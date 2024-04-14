"use client";

import { Button } from "@nextui-org/react";
import type { ComponentProps } from "react";
import { useFormStatus } from "react-dom";

type Props = ComponentProps<typeof Button>;

export function SubmitButton({
	children,
	...props
}: { children: React.ReactNode } & Props) {
	const { pending } = useFormStatus();

	return (
		<Button {...props} type="submit" disabled={pending}>
			{children}
		</Button>
	);
}
