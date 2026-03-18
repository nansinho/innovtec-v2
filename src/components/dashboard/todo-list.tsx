"use client";

import { useState, useEffect, useTransition, useRef } from "react";
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
  const busyIdsRef = useRef(new Set<string>());

  useEffect(() => {
    getUserTodos().then((data) => {
      setTodos(data as Todo[]);
      setLoading(false);
    });
  }, []);

  function toggle(id: string) {
    if (busyIdsRef.current.has(id)) return;
    busyIdsRef.current.add(id);
    setTodos((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, status: t.status === "done" ? "pending" : "done" }
          : t
      )
    );
    startTransition(async () => {
      try {
        await toggleTodo(id);
      } finally {
        busyIdsRef.current.delete(id);
      }
    });
  }

  function handleAdd() {
    if (!newLabel.trim() || isPending) return;
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
    if (busyIdsRef.current.has(id)) return;
    busyIdsRef.current.add(id);
    setTodos((prev) => prev.filter((t) => t.id !== id));
    startTransition(async () => {
      try {
        await deleteTodo(id);
      } finally {
        busyIdsRef.current.delete(id);
      }
    });
  }

  return (
    <Card>
      <CardHeader title="To-do List" icon={ListTodo} />

      {loading ? (
        <div className="space-y-3 px-5 py-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-5 w-full" />
          ))}
        </div>
      ) : (
        <>
          {todos.length === 0 && (
            <div className="flex flex-col items-center py-10 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100">
                <ListTodo className="h-6 w-6 text-zinc-400" />
              </div>
              <p className="text-sm font-medium text-[var(--text-muted)]">
                Aucune tâche pour le moment
              </p>
              <p className="mt-0.5 text-xs text-zinc-400">Ajoutez votre première tâche ci-dessous</p>
            </div>
          )}

          {todos.map((todo) => (
            <div
              key={todo.id}
              className="group flex items-center gap-3 px-5 py-2.5 transition-colors hover:bg-amber-50/30"
            >
              <button
                onClick={() => toggle(todo.id)}
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-[1.5px] transition-all duration-200",
                  todo.status === "done"
                    ? "border-amber-500 bg-amber-500 shadow-sm shadow-amber-500/20"
                    : "border-zinc-300 hover:border-amber-400 hover:bg-amber-50"
                )}
              >
                {todo.status === "done" && (
                  <Check className="h-3 w-3 text-white" />
                )}
              </button>
              <span
                className={cn(
                  "flex-1 text-sm transition-all duration-200",
                  todo.status === "done"
                    ? "text-zinc-400 line-through"
                    : "text-[var(--text)]"
                )}
              >
                {todo.label}
              </span>
              <button
                onClick={() => handleDelete(todo.id)}
                className="rounded-md p-1 text-zinc-400 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                aria-label="Supprimer"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}

          {/* Inline add */}
          <div className="flex items-center gap-3 border-t border-zinc-100 px-5 py-3">
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-[1.5px] border-dashed border-zinc-300">
              <Plus className="h-3 w-3 text-zinc-400" />
            </div>
            <input
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              placeholder="Ajouter une tâche..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-zinc-400"
            />
          </div>
        </>
      )}
    </Card>
  );
}
