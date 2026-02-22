import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "yellow" | "blue" | "green" | "red" | "purple";
}

export function Badge({ variant = "default", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-block rounded-full px-2.5 py-0.5 text-[10px] font-medium",
        {
          "bg-[var(--bg)] text-[var(--text-secondary)]": variant === "default",
          "bg-[var(--yellow-surface)] text-[#b07800]": variant === "yellow",
          "bg-[var(--blue-surface)] text-[var(--blue)]": variant === "blue",
          "bg-[var(--green-surface)] text-[var(--green)]": variant === "green",
          "bg-[var(--red-surface)] text-[var(--red)]": variant === "red",
          "bg-[var(--purple-surface)] text-[var(--purple)]": variant === "purple",
        },
        className
      )}
      {...props}
    />
  );
}
