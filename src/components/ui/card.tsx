import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function Card({ className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-[var(--radius)] border border-[var(--border-1)] bg-[var(--card)] shadow-sm transition-shadow duration-200",
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
        "flex items-center justify-between border-b border-[var(--border-1)] px-5 py-4",
        className
      )}
      {...props}
    >
      <span className="text-sm font-medium text-[var(--heading)]">{title}</span>
      {action}
    </div>
  );
}
