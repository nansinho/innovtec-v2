import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "yellow" | "blue" | "green" | "red" | "purple";
}

export function Badge({ variant = "default", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[var(--radius-xs)] px-2 py-0.5 text-[11px] font-medium",
        {
          "bg-zinc-500/10 text-zinc-600": variant === "default",
          "bg-amber-500/10 text-amber-700": variant === "yellow",
          "bg-blue-500/10 text-blue-700": variant === "blue",
          "bg-emerald-500/10 text-emerald-700": variant === "green",
          "bg-red-500/10 text-red-700": variant === "red",
          "bg-purple-500/10 text-purple-700": variant === "purple",
        },
        className
      )}
      {...props}
    />
  );
}
