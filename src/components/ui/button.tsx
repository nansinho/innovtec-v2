import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1",
        "disabled:pointer-events-none disabled:opacity-50",
        {
          "bg-gradient-to-b from-amber-500 to-amber-600 text-white shadow-sm shadow-amber-600/20 hover:from-amber-600 hover:to-amber-700 hover:shadow-md hover:shadow-amber-600/25 active:scale-[0.98] focus:ring-amber-500":
            variant === "primary",
          "border border-zinc-200 bg-white text-[var(--text)] shadow-xs hover:bg-zinc-50 hover:border-zinc-300 active:scale-[0.98] focus:ring-zinc-300":
            variant === "secondary",
          "text-[var(--text-secondary)] hover:text-[var(--heading)] hover:bg-zinc-100 focus:ring-zinc-200":
            variant === "ghost",
          "border border-red-200 bg-white text-red-600 hover:bg-red-50 hover:border-red-300 active:scale-[0.98] focus:ring-red-400":
            variant === "danger",
        },
        {
          "h-8 px-3 text-xs": size === "sm",
          "h-9 px-4 text-sm": size === "md",
          "h-10 px-5 text-sm": size === "lg",
        },
        className
      )}
      disabled={disabled}
      {...props}
    />
  );
}
