import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "yellow" | "blue" | "green" | "red" | "purple";
}

export function Badge({ variant = "default", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide",
        {
          "bg-zinc-100 text-zinc-700 ring-1 ring-zinc-200/60": variant === "default",
          "bg-amber-50 text-amber-600 ring-1 ring-amber-200/60": variant === "yellow",
          "bg-blue-50 text-blue-600 ring-1 ring-blue-200/60": variant === "blue",
          "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200/60": variant === "green",
          "bg-red-50 text-red-600 ring-1 ring-red-200/60": variant === "red",
          "bg-purple-50 text-purple-600 ring-1 ring-purple-200/60": variant === "purple",
        },
        className
      )}
      {...props}
    />
  );
}
