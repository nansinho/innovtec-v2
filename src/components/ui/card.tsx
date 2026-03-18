import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// ─── Card ───

const cardVariants = cva("overflow-hidden transition-all duration-300 ease-out", {
  variants: {
    variant: {
      default:
        "rounded-xl bg-white/92 border border-[var(--border-1)] shadow-sm backdrop-blur-xl hover:shadow-md hover:translate-y-[-1px]",
      stat:
        "rounded-lg bg-[var(--hover)] p-4 border border-[var(--border-1)]",
      flat:
        "rounded-xl bg-transparent p-4",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: "default" | "stat" | "flat";
  hover?: boolean;
}

export function Card({
  variant = "default",
  hover,
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        cardVariants({ variant }),
        hover && "cursor-pointer hover:ring-[var(--border-2)] hover:shadow-sm active:scale-[0.995]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// ─── CardHeader (original) ───

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  action?: React.ReactNode;
}

export function CardHeader({
  title,
  icon: Icon,
  action,
  className,
  ...props
}: CardHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between px-4 py-3",
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-2.5">
        {Icon && <Icon className="h-4 w-4 text-[var(--text-muted)]" />}
        <h3 className="text-[13px] font-semibold tracking-tight text-[var(--heading)]">
          {title}
        </h3>
      </div>
      {action}
    </div>
  );
}

// ─── CardHeaderWithBadge ───

interface CardHeaderWithBadgeProps
  extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  badges?: React.ReactNode;
}

export function CardHeaderWithBadge({
  title,
  subtitle,
  badges,
  className,
  ...props
}: CardHeaderWithBadgeProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 px-4 py-3",
        className
      )}
      {...props}
    >
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-[13px] font-semibold tracking-tight text-[var(--heading)]">
          {title}
        </h3>
        {subtitle && (
          <p className="truncate text-xs text-[var(--text-muted)]">
            {subtitle}
          </p>
        )}
      </div>
      {badges && (
        <div className="flex shrink-0 items-center gap-1.5">{badges}</div>
      )}
    </div>
  );
}

// ─── StatValue ───

interface StatValueProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function StatValue({ className, children, ...props }: StatValueProps) {
  return (
    <div
      className={cn("text-2xl font-medium text-[var(--heading)]", className)}
      {...props}
    >
      {children}
    </div>
  );
}

// ─── StatLabel ───

interface StatLabelProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function StatLabel({ className, children, ...props }: StatLabelProps) {
  return (
    <div
      className={cn("text-[13px] text-[var(--text-muted)]", className)}
      {...props}
    >
      {children}
    </div>
  );
}
