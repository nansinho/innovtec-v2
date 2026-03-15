import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "yellow" | "blue" | "green" | "red" | "purple";
}

export function Badge({ variant = "default", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide shadow-sm",
        {
          "bg-zinc-100 text-zinc-700 ring-1 ring-zinc-200/60": variant === "default",
          "bg-gradient-to-b from-amber-400 to-amber-500 text-white": variant === "yellow",
          "bg-gradient-to-b from-blue-500 to-blue-600 text-white": variant === "blue",
          "bg-gradient-to-b from-emerald-500 to-emerald-600 text-white": variant === "green",
          "bg-gradient-to-b from-red-500 to-red-600 text-white": variant === "red",
          "bg-gradient-to-b from-purple-500 to-purple-600 text-white": variant === "purple",
        },
        className
      )}
      {...props}
    />
  );
}
