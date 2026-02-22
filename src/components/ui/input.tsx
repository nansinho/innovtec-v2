import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Input({ label, className, id, ...props }: InputProps) {
  return (
    <div>
      {label && (
        <label
          htmlFor={id}
          className="mb-1 block text-xs font-medium text-[var(--text-secondary)]"
        >
          {label}
        </label>
      )}
      <input
        id={id}
        className={cn(
          "w-full rounded-[var(--radius-sm)] border border-[var(--border-1)] bg-[var(--card)] px-3 py-2.5 text-sm text-[var(--heading)] outline-none transition-colors placeholder:text-[var(--text-muted)] focus:border-[var(--yellow)] focus:ring-2 focus:ring-[var(--yellow-surface)]",
          className
        )}
        {...props}
      />
    </div>
  );
}
