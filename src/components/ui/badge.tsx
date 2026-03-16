import { cva, type VariantProps } from "class-variance-authority";
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

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full font-medium tracking-wide border-[1.5px] bg-transparent transition-colors",
  {
    variants: {
      variant: {
        green:
          "border-green-500 text-green-700 dark:border-green-400 dark:text-green-300",
        purple:
          "border-purple-400 text-purple-700 dark:border-purple-300 dark:text-purple-200",
        amber:
          "border-amber-500 text-amber-700 dark:border-amber-400 dark:text-amber-300",
        blue:
          "border-blue-500 text-blue-700 dark:border-blue-400 dark:text-blue-300",
        red:
          "border-red-500 text-red-700 dark:border-red-400 dark:text-red-300",
        teal:
          "border-teal-500 text-teal-700 dark:border-teal-400 dark:text-teal-300",
        coral:
          "border-orange-500 text-orange-700 dark:border-orange-400 dark:text-orange-300",
        pink:
          "border-pink-500 text-pink-700 dark:border-pink-400 dark:text-pink-300",
        gray:
          "border-zinc-400 text-zinc-600 dark:border-zinc-500 dark:text-zinc-400",
      },
      size: {
        default: "px-2.5 py-0.5 text-xs",
        sm: "px-2 py-[1px] text-[11px]",
        lg: "px-3 py-1 text-[13px]",
      },
    },
    defaultVariants: {
      variant: "gray",
      size: "default",
    },
  }
);

const dotVariants: Record<BadgeVariant, string> = {
  green: "bg-green-500 dark:bg-green-400",
  purple: "bg-purple-400 dark:bg-purple-300",
  amber: "bg-amber-500 dark:bg-amber-400",
  blue: "bg-blue-500 dark:bg-blue-400",
  red: "bg-red-500 dark:bg-red-400",
  teal: "bg-teal-500 dark:bg-teal-400",
  coral: "bg-orange-500 dark:bg-orange-400",
  pink: "bg-pink-500 dark:bg-pink-400",
  gray: "bg-zinc-400 dark:bg-zinc-500",
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
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            "shrink-0 rounded-full",
            dotSize,
            dotVariants[variant]
          )}
        />
      )}
      {children}
    </span>
  );
}
