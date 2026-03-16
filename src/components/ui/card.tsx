import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function Card({ className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-gray-200/60 bg-white shadow-sm",
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
        "flex items-center justify-between px-6 py-4",
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-2.5">
        {Icon && <Icon className="h-4 w-4 text-gray-400" />}
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      </div>
      {action}
    </div>
  );
}
