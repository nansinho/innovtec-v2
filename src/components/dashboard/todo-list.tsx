"use client";

import { useState, useEffect, useTransition } from "react";
import { Check } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getUserTodos, toggleTodo } from "@/actions/todos";
import type { Todo } from "@/lib/types/database";

export default function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    getUserTodos().then((data) => {
      setTodos(data as Todo[]);
      setLoading(false);
    });
  }, []);

  function toggle(id: string) {
    setTodos((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, status: t.status === "done" ? "pending" : "done" }
          : t
      )
    );
    startTransition(() => {
      toggleTodo(id);
    });
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
      {loading ? (
        <div className="px-5 py-4 text-center text-[12px] text-[var(--text-muted)]">
          Chargement...
        </div>
      ) : todos.length === 0 ? (
        <div className="px-5 py-4 text-center text-[12px] text-[var(--text-muted)]">
          Aucune tâche pour le moment
        </div>
      ) : (
        todos.map((todo) => (
          <div
            key={todo.id}
            onClick={() => toggle(todo.id)}
            className="flex cursor-pointer items-center gap-2.5 px-5 py-2.5 transition-colors hover:bg-[var(--hover)]"
          >
            <div
              className={cn(
                "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-[1.5px] transition-colors",
                todo.status === "done"
                  ? "border-[var(--yellow)] bg-[var(--yellow)]"
                  : "border-[var(--border-2)]"
              )}
            >
              {todo.status === "done" && (
                <Check className="h-[9px] w-[9px] text-white" />
              )}
            </div>
            <span
              className={cn(
                "text-[12.5px]",
                todo.status === "done"
                  ? "text-[var(--text-muted)] line-through"
                  : "text-[var(--text)]"
              )}
            >
              {todo.label}
            </span>
          </div>
        ))
      )}
    </Card>
  );
}
