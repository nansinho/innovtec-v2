import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-[var(--radius-sm)] font-medium transition-colors",
        {
          "bg-[var(--yellow)] text-white hover:bg-[var(--yellow-hover)]":
            variant === "primary",
          "border border-[var(--border-1)] bg-[var(--card)] text-[var(--text)] hover:bg-[var(--hover)]":
            variant === "secondary",
          "text-[var(--text-secondary)] hover:text-[var(--heading)]":
            variant === "ghost",
        },
        {
          "px-3 py-1 text-[10px]": size === "sm",
          "px-4 py-2 text-xs": size === "md",
          "px-5 py-2.5 text-sm": size === "lg",
        },
        className
      )}
      {...props}
    />
  );
}
