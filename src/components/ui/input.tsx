import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className, id, ...props }: InputProps) {
  return (
    <div>
      {label && (
        <label
          htmlFor={id}
          className="mb-1.5 block text-sm font-medium text-[var(--heading)]"
        >
          {label}
        </label>
      )}
      <input
        id={id}
        className={cn(
          "h-10 w-full rounded-[var(--radius)] border border-zinc-300 bg-white px-3 text-sm text-[var(--heading)] outline-none transition-colors placeholder:text-[var(--text-muted)] focus:border-[var(--yellow)] focus:ring-2 focus:ring-[var(--yellow-surface)]",
          error && "border-red-300 focus:border-red-500 focus:ring-red-100",
          className
        )}
        {...props}
      />
      {error && (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}
