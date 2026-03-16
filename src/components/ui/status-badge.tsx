import { Badge, type BadgeVariant } from "@/components/ui/badge";
import {
  resolveStatus,
  resolveCategory,
  resolveType,
  PRIORITY_MAP,
  ROLE_MAP,
  PRESENCE_MAP,
  type StatusModule,
  type CategoryModule,
  type TypeModule,
  type StatusEntry,
} from "@/lib/status-config";
import { cn } from "@/lib/utils";

// ─── StatusBadge ───
// Résout automatiquement label + couleur depuis la config centralisée
// Affiche TOUJOURS un dot

interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  module: StatusModule;
  status: string;
  size?: "default" | "sm" | "lg";
}

export function StatusBadge({
  module,
  status,
  size = "sm",
  className,
  children,
  ...props
}: StatusBadgeProps) {
  const entry = resolveStatus(module, status);
  return (
    <Badge
      variant={entry.variant}
      size={size}
      dot
      className={className}
      {...props}
    >
      {children ?? entry.label}
    </Badge>
  );
}

// ─── CategoryBadge ───
// Pour les catégories/types (articles, formations, bonnes pratiques, albums, etc.)
// PAS de dot, taille sm

interface CategoryBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  module: CategoryModule;
  category: string;
  size?: "default" | "sm" | "lg";
}

export function CategoryBadge({
  module,
  category,
  size = "sm",
  className,
  children,
  ...props
}: CategoryBadgeProps) {
  const entry = resolveCategory(module, category);
  return (
    <Badge
      variant={entry.variant}
      size={size}
      dot={false}
      className={className}
      {...props}
    >
      {children ?? entry.label}
    </Badge>
  );
}

// ─── PriorityBadge ───
// Avec dot, taille sm

interface PriorityBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  priority: string;
  size?: "default" | "sm" | "lg";
}

export function PriorityBadge({
  priority,
  size = "sm",
  className,
  children,
  ...props
}: PriorityBadgeProps) {
  const entry: StatusEntry = PRIORITY_MAP[priority] ?? {
    label: priority,
    variant: "gray" as BadgeVariant,
  };
  return (
    <Badge
      variant={entry.variant}
      size={size}
      dot
      className={className}
      {...props}
    >
      {children ?? entry.label}
    </Badge>
  );
}

// ─── TypeBadge ───
// Pour les types d'événements, congés, contrats, dépenses, etc.
// PAS de dot, taille sm

interface TypeBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  module: TypeModule;
  type: string;
  size?: "default" | "sm" | "lg";
}

export function TypeBadge({
  module,
  type,
  size = "sm",
  className,
  children,
  ...props
}: TypeBadgeProps) {
  const entry = resolveType(module, type);
  return (
    <Badge
      variant={entry.variant}
      size={size}
      dot={false}
      className={className}
      {...props}
    >
      {children ?? entry.label}
    </Badge>
  );
}

// ─── RoleBadge ───
// Pour les rôles dans le trombinoscope / organigramme
// PAS de dot, taille sm

interface RoleBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  role: string;
  size?: "default" | "sm" | "lg";
}

export function RoleBadge({
  role,
  size = "sm",
  className,
  children,
  ...props
}: RoleBadgeProps) {
  const entry: StatusEntry = ROLE_MAP[role] ?? {
    label: role,
    variant: "gray" as BadgeVariant,
  };
  return (
    <Badge
      variant={entry.variant}
      size={size}
      dot={false}
      className={className}
      {...props}
    >
      {children ?? entry.label}
    </Badge>
  );
}

// ─── PresenceBadge ───
// Pour le statut en ligne dans le trombinoscope
// Avec dot (indicateur de présence), taille sm

interface PresenceBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: string;
  size?: "default" | "sm" | "lg";
}

export function PresenceBadge({
  status,
  size = "sm",
  className,
  children,
  ...props
}: PresenceBadgeProps) {
  const entry: StatusEntry = PRESENCE_MAP[status] ?? {
    label: status,
    variant: "gray" as BadgeVariant,
  };
  return (
    <Badge
      variant={entry.variant}
      size={size}
      dot
      className={className}
      {...props}
    >
      {children ?? entry.label}
    </Badge>
  );
}
