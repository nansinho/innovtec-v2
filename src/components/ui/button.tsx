import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
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
        "inline-flex items-center justify-center rounded-[var(--radius-sm)] font-medium transition-all duration-200",
        {
          "bg-[var(--yellow)] text-white shadow-xs hover:bg-[var(--yellow-hover)] hover:shadow-sm":
            variant === "primary",
          "border border-[var(--border-1)] bg-[var(--card)] text-[var(--text)] shadow-xs hover:bg-[var(--hover)] hover:shadow-sm":
            variant === "secondary",
          "text-[var(--text-secondary)] hover:text-[var(--heading)] hover:bg-[var(--hover)]":
            variant === "ghost",
          "bg-[var(--red)] text-white shadow-xs hover:bg-red-700 hover:shadow-sm":
            variant === "danger",
        },
        {
          "px-3 py-1.5 text-[11px]": size === "sm",
          "px-4 py-2 text-xs": size === "md",
          "px-5 py-2.5 text-sm": size === "lg",
        },
        className
      )}
      {...props}
    />
  );
}
