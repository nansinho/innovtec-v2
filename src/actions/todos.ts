"use server";

import { createClient } from "@/lib/supabase/server";

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

export async function toggleTodo(id: string) {
  const supabase = await createClient();
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
}
