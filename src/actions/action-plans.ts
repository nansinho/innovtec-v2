"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type {
  ActionPlan,
  ActionPlanTask,
  ActionPlanStatus,
  ActionPlanType,
  SignalementPriority,
} from "@/lib/types/database";
import { createNotificationForUser } from "@/actions/notifications";

// ==========================================
// HELPERS
// ==========================================

function revalidateAll() {
  revalidatePath("/qse/plans");
  revalidatePath("/qse/signalements");
  revalidatePath("/qse");
}

async function getAuthProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .single();

  return profile;
}

function isQseManager(role: string) {
  return ["admin", "rh", "responsable_qse"].includes(role);
}

// ==========================================
// ACTION PLANS
// ==========================================

const PLAN_SELECT = `
  *,
  responsible:profiles!action_plans_responsible_id_fkey(first_name, last_name),
  creator:profiles!action_plans_created_by_fkey(first_name, last_name),
  tasks:action_plan_tasks(*)
`;

export async function getActionPlans(): Promise<ActionPlan[]> {
  const profile = await getAuthProfile();
  if (!profile) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("action_plans")
    .select(PLAN_SELECT)
    .order("created_at", { ascending: false });

  if (!data) return [];

  // For each plan, fetch linked signalements
  const plans = data as unknown as ActionPlan[];
  for (const plan of plans) {
    const { data: signalements } = await supabase
      .from("danger_reports")
      .select("id, title, status, priority")
      .eq("action_plan_id", plan.id);
    plan.signalements = (signalements as unknown as ActionPlan["signalements"]) ?? [];
    // Sort tasks by position
    if (plan.tasks) {
      plan.tasks.sort((a, b) => a.position - b.position);
    }
  }

  return plans;
}

export async function getActionPlan(id: string): Promise<ActionPlan | null> {
  const profile = await getAuthProfile();
  if (!profile) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("action_plans")
    .select(PLAN_SELECT)
    .eq("id", id)
    .single();

  if (!data) return null;

  const plan = data as unknown as ActionPlan;

  // Fetch linked signalements
  const { data: signalements } = await supabase
    .from("danger_reports")
    .select("id, title, status, priority, created_at, category:signalement_categories!danger_reports_category_id_fkey(name, color)")
    .eq("action_plan_id", plan.id);
  plan.signalements = (signalements as unknown as ActionPlan["signalements"]) ?? [];

  if (plan.tasks) {
    plan.tasks.sort((a, b) => a.position - b.position);
  }

  return plan;
}

export async function createActionPlan(planData: {
  title: string;
  description: string;
  type: ActionPlanType;
  priority: SignalementPriority;
  responsible_id: string | null;
  due_date: string | null;
  signalement_id?: string;
}): Promise<{ success: boolean; error?: string; id?: string }> {
  const profile = await getAuthProfile();
  if (!profile || !isQseManager(profile.role)) {
    return { success: false, error: "Non autorisé" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("action_plans")
    .insert({
      title: planData.title,
      description: planData.description,
      type: planData.type,
      priority: planData.priority,
      status: "a_faire" as ActionPlanStatus,
      responsible_id: planData.responsible_id,
      due_date: planData.due_date,
      created_by: profile.id,
    })
    .select("id")
    .single();

  if (error) return { success: false, error: error.message };

  // Link signalement if provided
  if (planData.signalement_id) {
    await supabase
      .from("danger_reports")
      .update({
        action_plan_id: data.id,
        status: "resolu",
        resolved_at: new Date().toISOString(),
      })
      .eq("id", planData.signalement_id);

    // Notify the reporter
    const { data: report } = await supabase
      .from("danger_reports")
      .select("reported_by, title")
      .eq("id", planData.signalement_id)
      .single();

    if (report?.reported_by) {
      await createNotificationForUser({
        user_id: report.reported_by,
        type: "action_plan",
        title: "Signalement résolu",
        message: `Votre signalement "${report.title}" a été lié à un plan d'action et est passé en résolu.`,
        link: `/qse/signalements/${planData.signalement_id}`,
        related_id: planData.signalement_id,
      });
    }
  }

  // Notify the responsible person
  if (planData.responsible_id && planData.responsible_id !== profile.id) {
    await createNotificationForUser({
      user_id: planData.responsible_id,
      type: "action_plan",
      title: "Plan d'action assigné",
      message: `Vous avez été assigné au plan d'action : ${planData.title}`,
      link: `/qse/plans/${data.id}`,
      related_id: data.id,
    });
  }

  revalidateAll();
  return { success: true, id: data.id };
}

export async function updateActionPlan(
  id: string,
  planData: {
    title?: string;
    description?: string;
    type?: ActionPlanType;
    priority?: SignalementPriority;
    status?: ActionPlanStatus;
    responsible_id?: string | null;
    due_date?: string | null;
  }
): Promise<{ success: boolean; error?: string }> {
  const profile = await getAuthProfile();
  if (!profile || !isQseManager(profile.role)) {
    return { success: false, error: "Non autorisé" };
  }

  const supabase = await createClient();

  const updateData: Record<string, unknown> = { ...planData };
  if (planData.status === "termine") {
    updateData.completed_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("action_plans")
    .update(updateData)
    .eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidateAll();
  return { success: true };
}

export async function deleteActionPlan(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const profile = await getAuthProfile();
  if (!profile || !isQseManager(profile.role)) {
    return { success: false, error: "Non autorisé" };
  }

  const supabase = await createClient();

  // Unlink signalements first
  await supabase
    .from("danger_reports")
    .update({ action_plan_id: null })
    .eq("action_plan_id", id);

  // Delete tasks
  await supabase
    .from("action_plan_tasks")
    .delete()
    .eq("action_plan_id", id);

  const { error } = await supabase
    .from("action_plans")
    .delete()
    .eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidateAll();
  return { success: true };
}

// ==========================================
// LINK SIGNALEMENT
// ==========================================

export async function linkSignalement(
  planId: string,
  signalementId: string
): Promise<{ success: boolean; error?: string }> {
  const profile = await getAuthProfile();
  if (!profile || !isQseManager(profile.role)) {
    return { success: false, error: "Non autorisé" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("danger_reports")
    .update({
      action_plan_id: planId,
      status: "resolu",
      resolved_at: new Date().toISOString(),
    })
    .eq("id", signalementId);

  if (error) return { success: false, error: error.message };

  // Notify reporter
  const { data: report } = await supabase
    .from("danger_reports")
    .select("reported_by, title")
    .eq("id", signalementId)
    .single();

  if (report?.reported_by) {
    await createNotificationForUser({
      user_id: report.reported_by,
      type: "action_plan",
      title: "Signalement résolu",
      message: `Votre signalement "${report.title}" a été lié à un plan d'action.`,
      link: `/qse/signalements/${signalementId}`,
      related_id: signalementId,
    });
  }

  revalidateAll();
  return { success: true };
}

export async function unlinkSignalement(
  signalementId: string
): Promise<{ success: boolean; error?: string }> {
  const profile = await getAuthProfile();
  if (!profile || !isQseManager(profile.role)) {
    return { success: false, error: "Non autorisé" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("danger_reports")
    .update({
      action_plan_id: null,
      status: "en_cours",
      resolved_at: null,
    })
    .eq("id", signalementId);

  if (error) return { success: false, error: error.message };

  revalidateAll();
  return { success: true };
}

// ==========================================
// TASKS (sous-tâches)
// ==========================================

export async function addActionPlanTask(
  planId: string,
  label: string
): Promise<{ success: boolean; error?: string }> {
  const profile = await getAuthProfile();
  if (!profile) return { success: false, error: "Non authentifié" };

  const supabase = await createClient();

  // Get next position
  const { data: last } = await supabase
    .from("action_plan_tasks")
    .select("position")
    .eq("action_plan_id", planId)
    .order("position", { ascending: false })
    .limit(1)
    .single();

  const position = (last?.position ?? 0) + 1;

  const { error } = await supabase.from("action_plan_tasks").insert({
    action_plan_id: planId,
    label,
    position,
  });

  if (error) return { success: false, error: error.message };

  revalidateAll();
  return { success: true };
}

export async function toggleActionPlanTask(
  taskId: string,
  isDone: boolean
): Promise<{ success: boolean; error?: string }> {
  const profile = await getAuthProfile();
  if (!profile) return { success: false, error: "Non authentifié" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("action_plan_tasks")
    .update({ is_done: isDone })
    .eq("id", taskId);

  if (error) return { success: false, error: error.message };

  revalidateAll();
  return { success: true };
}

export async function deleteActionPlanTask(
  taskId: string
): Promise<{ success: boolean; error?: string }> {
  const profile = await getAuthProfile();
  if (!profile) return { success: false, error: "Non authentifié" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("action_plan_tasks")
    .delete()
    .eq("id", taskId);

  if (error) return { success: false, error: error.message };

  revalidateAll();
  return { success: true };
}
