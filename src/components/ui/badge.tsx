import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "yellow" | "blue" | "green" | "red" | "purple";
  dot?: boolean;
}

const variantStyles = {
  default: {
    badge: "bg-zinc-100 text-zinc-700 ring-1 ring-zinc-300/50",
    dot: "bg-zinc-500",
  },
  yellow: {
    badge: "bg-amber-50 text-amber-700 ring-1 ring-amber-300/50",
    dot: "bg-amber-500",
  },
  blue: {
    badge: "bg-blue-50 text-blue-700 ring-1 ring-blue-300/50",
    dot: "bg-blue-500",
  },
  green: {
    badge: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-300/50",
    dot: "bg-emerald-500",
  },
  red: {
    badge: "bg-red-50 text-red-700 ring-1 ring-red-300/50",
    dot: "bg-red-500",
  },
  purple: {
    badge: "bg-purple-50 text-purple-700 ring-1 ring-purple-300/50",
    dot: "bg-purple-500",
  },
};

export function Badge({ variant = "default", dot = true, className, children, ...props }: BadgeProps) {
  const styles = variantStyles[variant];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide",
        styles.badge,
        className
      )}
      {...props}
    >
      {dot && <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", styles.dot)} />}
      {children}
    </span>
  );
}
