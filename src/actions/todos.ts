"use server";

import { createClient } from "@/lib/supabase/server";
import { auditLog } from "@/lib/audit-logger";

export async function getUserTodos() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data } = await supabase
    .from("todos")
    .select("*")
    .eq("user_id", user.id)
    .order("position", { ascending: true });
  return data ?? [];
}

export async function createTodo(label: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const { data: existing } = await supabase
    .from("todos")
    .select("position")
    .eq("user_id", user.id)
    .order("position", { ascending: false })
    .limit(1);

  const nextPosition = (existing?.[0]?.position ?? 0) + 1;

  await supabase.from("todos").insert({
    user_id: user.id,
    label,
    status: "pending",
    position: nextPosition,
  });

  await auditLog(user.id, "create", "todo", null, { label });
}

export async function deleteTodo(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  await supabase.from("todos").delete().eq("id", id);

  if (user) await auditLog(user.id, "delete", "todo", id, {});
}

export async function toggleTodo(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: todo } = await supabase
    .from("todos")
    .select("status")
    .eq("id", id)
    .single();

  if (!todo) return;

  await supabase
    .from("todos")
    .update({ status: todo.status === "done" ? "pending" : "done" })
    .eq("id", id);

  if (user) await auditLog(user.id, "update", "todo", id, { new_status: todo.status === "done" ? "pending" : "done" });
}
