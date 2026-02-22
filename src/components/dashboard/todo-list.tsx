"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface TodoItem {
  id: string;
  label: string;
  done: boolean;
}

const initialTodos: TodoItem[] = [
  { id: "1", label: "Valider plan chantier Voltaire", done: false },
  { id: "2", label: "Réunion sécurité équipe B", done: false },
  { id: "3", label: "Rapport hebdo SSE", done: true },
];

export default function TodoList() {
  const [todos, setTodos] = useState(initialTodos);

  function toggle(id: string) {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  }

  return (
    <Card>
      <CardHeader
        title="To-do List"
        action={
          <button className="rounded-[var(--radius-xs)] border border-[var(--yellow-border)] bg-[var(--yellow-surface)] px-3 py-1 text-[10px] font-medium text-[#b07800] transition-colors hover:border-[var(--yellow)] hover:bg-[var(--yellow)] hover:text-white">
            Ajouter
          </button>
        }
      />
      {todos.map((todo) => (
        <div
          key={todo.id}
          onClick={() => toggle(todo.id)}
          className="flex cursor-pointer items-center gap-2.5 px-5 py-2.5 transition-colors hover:bg-[var(--hover)]"
        >
          <div
            className={cn(
              "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-[1.5px] transition-colors",
              todo.done
                ? "border-[var(--yellow)] bg-[var(--yellow)]"
                : "border-[var(--border-2)]"
            )}
          >
            {todo.done && <Check className="h-[9px] w-[9px] text-white" />}
          </div>
          <span
            className={cn(
              "text-[12.5px]",
              todo.done
                ? "text-[var(--text-muted)] line-through"
                : "text-[var(--text)]"
            )}
          >
            {todo.label}
          </span>
        </div>
      ))}
    </Card>
  );
}
