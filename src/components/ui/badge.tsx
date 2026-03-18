import { cn } from "@/lib/utils";

export type BadgeVariant =
  | "green"
  | "purple"
  | "amber"
  | "blue"
  | "red"
  | "teal"
  | "coral"
  | "pink"
  | "gray";

export type BadgeSize = "default" | "sm" | "lg";

const variantStyles: Record<BadgeVariant, string> = {
  green:
    "border-[color:var(--green)] text-[color:var(--green)] bg-[var(--green-surface)]",
  purple:
    "border-[color:var(--purple)] text-[color:var(--purple)] bg-[var(--purple-surface)]",
  amber:
    "border-[color:var(--amber)] text-[color:var(--amber)] bg-[var(--amber-surface)]",
  blue:
    "border-[color:var(--blue)] text-[color:var(--blue)] bg-[var(--blue-surface)]",
  red:
    "border-[color:var(--red)] text-[color:var(--red)] bg-[var(--red-surface)]",
  teal:
    "border-[color:var(--teal)] text-[color:var(--teal)] bg-[var(--teal-surface)]",
  coral:
    "border-[color:var(--coral)] text-[color:var(--coral)] bg-[var(--coral-surface)]",
  pink:
    "border-[color:var(--pink)] text-[color:var(--pink)] bg-[var(--pink-surface)]",
  gray:
    "border-zinc-400 text-zinc-600 bg-zinc-50",
};

const dotStyles: Record<BadgeVariant, string> = {
  green: "bg-[var(--green)]",
  purple: "bg-[var(--purple)]",
  amber: "bg-[var(--amber)]",
  blue: "bg-[var(--blue)]",
  red: "bg-[var(--red)]",
  teal: "bg-[var(--teal)]",
  coral: "bg-[var(--coral)]",
  pink: "bg-[var(--pink)]",
  gray: "bg-zinc-400",
};

const sizeStyles: Record<BadgeSize, string> = {
  default: "px-2 py-[1px] text-[11px]",
  sm: "px-1.5 py-px text-[10px]",
  lg: "px-2.5 py-0.5 text-xs",
};

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
}

export function Badge({
  variant = "gray",
  size = "default",
  dot = false,
  className,
  children,
  ...props
}: BadgeProps) {
  const dotSize =
    size === "sm"
      ? "h-1 w-1"
      : "h-1.5 w-1.5";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-medium border transition-colors",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            "shrink-0 rounded-full",
            dotSize,
            dotStyles[variant]
          )}
        />
      )}
      {children}
    </span>
  );
}
