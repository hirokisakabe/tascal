type Props = { children: string; size?: "text-xl" | "text-2xl" };

export function Typography({ children, size }: Props) {
  return <div className={`font-sans ${size}`}>{children}</div>;
}
