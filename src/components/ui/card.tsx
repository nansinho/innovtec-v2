import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function Card({ className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-zinc-950/[0.04] transition-shadow hover:shadow-md",
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
  icon?: React.ComponentType<{ className?: string }>;
  action?: React.ReactNode;
}

export function CardHeader({ title, icon: Icon, action, className, ...props }: CardHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between bg-zinc-50/70 px-5 py-3",
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4 text-[var(--text-muted)]" />}
        <h3 className="text-sm font-semibold text-[var(--heading)]">{title}</h3>
      </div>
      {action}
    </div>
  );
}
