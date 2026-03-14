"use client";

import { useState, useEffect, useTransition } from "react";
import { Check, Trash2, Plus, ListTodo } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { getUserTodos, toggleTodo, createTodo, deleteTodo } from "@/actions/todos";
import type { Todo } from "@/lib/types/database";

export default function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [newLabel, setNewLabel] = useState("");

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

  function handleAdd() {
    if (!newLabel.trim()) return;
    const label = newLabel.trim();
    setNewLabel("");
    const tempId = `temp-${Date.now()}`;
    setTodos((prev) => [
      ...prev,
      { id: tempId, label, status: "pending" } as Todo,
    ]);
    startTransition(async () => {
      await createTodo(label);
      const data = await getUserTodos();
      setTodos(data as Todo[]);
    });
  }

  function handleDelete(id: string) {
    setTodos((prev) => prev.filter((t) => t.id !== id));
    startTransition(() => {
      deleteTodo(id);
    });
  }

  return (
    <Card>
      <CardHeader title="To-do List" />

      {loading ? (
        <div className="space-y-2 px-5 py-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-5 w-full" />
          ))}
        </div>
      ) : (
        <>
          {todos.length === 0 && (
            <div className="flex flex-col items-center py-8 text-center">
              <ListTodo className="mb-2 h-8 w-8 text-zinc-300" />
              <p className="text-sm text-[var(--text-muted)]">
                Aucune t\u00e2che pour le moment
              </p>
            </div>
          )}

          {todos.map((todo) => (
            <div
              key={todo.id}
              className="group flex items-center gap-2.5 px-5 py-2.5 transition-colors hover:bg-zinc-50"
            >
              <button
                onClick={() => toggle(todo.id)}
                className={cn(
                  "flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[var(--radius-xs)] border-[1.5px] transition-colors",
                  todo.status === "done"
                    ? "border-[var(--yellow)] bg-[var(--yellow)]"
                    : "border-zinc-300 hover:border-[var(--yellow)]"
                )}
              >
                {todo.status === "done" && (
                  <Check className="h-3 w-3 text-white" />
                )}
              </button>
              <span
                className={cn(
                  "flex-1 text-sm",
                  todo.status === "done"
                    ? "text-[var(--text-muted)] line-through"
                    : "text-[var(--text)]"
                )}
              >
                {todo.label}
              </span>
              <button
                onClick={() => handleDelete(todo.id)}
                className="hidden text-zinc-400 transition-colors hover:text-red-500 group-hover:block"
                aria-label="Supprimer"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}

          {/* Inline add */}
          <div className="flex items-center gap-2 border-t border-[var(--border-1)] px-5 py-3">
            <Plus className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
            <input
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              placeholder="Ajouter une t\u00e2che..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--text-muted)]"
            />
          </div>
        </>
      )}
    </Card>
  );
}
