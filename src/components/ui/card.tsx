import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function Card({ className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl bg-white/92 shadow-[0_1px_4px_rgba(0,0,0,0.04)] ring-1 ring-black/[0.03] backdrop-blur-xl transition-all duration-300 ease-out hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] hover:translate-y-[-1px]",
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
        "flex items-center justify-between px-5 py-3.5",
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-2.5">
        {Icon && <Icon className="h-4 w-4 text-[var(--text-muted)]" />}
        <h3 className="text-[13px] font-semibold tracking-tight text-[var(--heading)]">{title}</h3>
      </div>
      {action}
    </div>
  );
}
