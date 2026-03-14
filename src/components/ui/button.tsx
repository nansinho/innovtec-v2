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
        "inline-flex items-center justify-center gap-2 rounded-[var(--radius)] font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1",
        "disabled:pointer-events-none disabled:opacity-50",
        {
          "bg-[var(--yellow)] text-white shadow-xs hover:bg-[var(--yellow-hover)] focus:ring-[var(--yellow)]":
            variant === "primary",
          "border border-[var(--border-2)] bg-[var(--card)] text-[var(--text)] shadow-xs hover:bg-[var(--hover)] focus:ring-[var(--border-2)]":
            variant === "secondary",
          "text-[var(--text-secondary)] hover:text-[var(--heading)] hover:bg-[var(--hover)] focus:ring-[var(--border-1)]":
            variant === "ghost",
          "border border-red-200 bg-white text-[var(--red)] hover:bg-red-50 focus:ring-[var(--red)]":
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
