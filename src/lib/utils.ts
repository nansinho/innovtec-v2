import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, pattern = "d MMM yyyy") {
  return format(new Date(date), pattern, { locale: fr });
}

export function formatRelative(date: string | Date) {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: fr });
}

/**
 * Crée une map d'identifiants métier pour une liste d'éléments.
 * Les éléments sont triés par date de création (ancien → récent = 1 → N).
 * Ex: createReferenceMap(items, "REX") → { "uuid1": "REX-0000001", "uuid2": "REX-0000002" }
 */
export function createReferenceMap<T extends { id: string; created_at: string }>(
  items: T[],
  prefix: string,
): Map<string, string> {
  const sorted = [...items].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );
  return new Map(
    sorted.map((item, index) => [
      item.id,
      `${prefix}-${String(index + 1).padStart(7, "0")}`,
    ]),
  );
}
