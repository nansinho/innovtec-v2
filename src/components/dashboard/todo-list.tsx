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
      <CardHeader title="To-do List" icon={ListTodo} />

      {loading ? (
        <div className="space-y-3 px-6 py-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-5 w-full" />
          ))}
        </div>
      ) : (
        <>
          {todos.length === 0 && (
            <div className="flex flex-col items-center py-10 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100">
                <ListTodo className="h-6 w-6 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-900">
                Aucune tâche pour le moment
              </p>
              <p className="mt-0.5 text-xs text-gray-500">Ajoutez votre première tâche ci-dessous</p>
            </div>
          )}

          {todos.map((todo) => (
            <div
              key={todo.id}
              className="group flex items-center gap-3 px-6 py-2.5 transition-colors hover:bg-gray-50"
            >
              <button
                onClick={() => toggle(todo.id)}
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-[1.5px] transition-all duration-200",
                  todo.status === "done"
                    ? "border-orange-500 bg-orange-500"
                    : "border-gray-300 hover:border-orange-400 hover:bg-orange-50"
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
                    ? "text-gray-400 line-through"
                    : "text-gray-700"
                )}
              >
                {todo.label}
              </span>
              <button
                onClick={() => handleDelete(todo.id)}
                className="rounded-md p-1 text-gray-400 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                aria-label="Supprimer"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}

          {/* Inline add */}
          <div className="flex items-center gap-3 border-t border-gray-100 px-6 py-3">
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-[1.5px] border-dashed border-gray-300">
              <Plus className="h-3 w-3 text-gray-400" />
            </div>
            <input
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              placeholder="Ajouter une tâche..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
            />
          </div>
        </>
      )}
    </Card>
  );
}
