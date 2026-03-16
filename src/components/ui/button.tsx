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
        "inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/20",
        "disabled:pointer-events-none disabled:opacity-50",
        {
          "bg-orange-600 text-white hover:bg-orange-700 rounded-lg":
            variant === "primary",
          "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 rounded-lg":
            variant === "secondary",
          "text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-lg":
            variant === "ghost",
          "bg-red-600 text-white hover:bg-red-700 rounded-lg":
            variant === "danger",
        },
        {
          "h-8 px-3 text-xs rounded-md gap-1.5": size === "sm",
          "h-9 px-4 text-sm rounded-lg gap-2": size === "md",
          "h-10 px-5 text-sm rounded-lg gap-2": size === "lg",
        },
        className
      )}
      disabled={disabled}
      {...props}
    />
  );
}
