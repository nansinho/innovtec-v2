import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function Card({ className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-[var(--radius)] border border-[var(--border-1)] bg-white shadow-xs",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  action?: React.ReactNode;
}

export function CardHeader({ title, action, className, ...props }: CardHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between border-b border-[var(--border-1)] px-5 py-3.5",
        className
      )}
      {...props}
    >
      <h3 className="text-sm font-semibold text-[var(--heading)]">{title}</h3>
      {action}
    </div>
  );
}
