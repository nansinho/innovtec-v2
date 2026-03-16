import { cn } from "@/lib/utils";

export type BadgeVariant =
  | "default"
  | "yellow"
  | "blue"
  | "green"
  | "red"
  | "purple"
  | "orange"
  | "indigo"
  | "pink";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  dot?: boolean;
}

const variantStyles = {
  default: {
    badge: "bg-zinc-500/10 text-zinc-600 border border-zinc-500/20",
    dot: "bg-zinc-500",
  },
  yellow: {
    badge: "bg-amber-500/10 text-amber-600 border border-amber-500/20",
    dot: "bg-amber-500",
  },
  blue: {
    badge: "bg-blue-500/10 text-blue-600 border border-blue-500/20",
    dot: "bg-blue-500",
  },
  green: {
    badge: "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20",
    dot: "bg-emerald-500",
  },
  red: {
    badge: "bg-red-500/10 text-red-600 border border-red-500/20",
    dot: "bg-red-500",
  },
  purple: {
    badge: "bg-purple-500/10 text-purple-600 border border-purple-500/20",
    dot: "bg-purple-500",
  },
  orange: {
    badge: "bg-orange-500/10 text-orange-600 border border-orange-500/20",
    dot: "bg-orange-500",
  },
  indigo: {
    badge: "bg-indigo-500/10 text-indigo-600 border border-indigo-500/20",
    dot: "bg-indigo-500",
  },
  pink: {
    badge: "bg-pink-500/10 text-pink-600 border border-pink-500/20",
    dot: "bg-pink-500",
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
