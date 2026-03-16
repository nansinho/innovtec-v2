import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 text-center", className)}>
      <Icon className="mb-3 h-12 w-12 text-zinc-300" />
      <h3 className="mb-1 text-sm font-medium text-[var(--heading)]">{title}</h3>
      <p className="max-w-xs text-sm text-[var(--text-muted)]">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
