"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { auditLog } from "@/lib/audit-logger";
import { revalidatePath } from "next/cache";
import type { TeamMemberRole, TeamWithMembers } from "@/lib/types/database";

// ==========================================
// HELPERS
// ==========================================

export interface Team {
  id: string;
  label: string;
}

async function getCallerProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return profile ? { ...profile, authId: user.id } : null;
}

function isAdminOrRh(role: string) {
  return ["admin", "rh"].includes(role);
}

function revalidateAll() {
  revalidatePath("/equipe/equipes");
  revalidatePath("/admin/users");
}

// ==========================================
// READ (original)
// ==========================================

export async function getTeams(): Promise<Team[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("teams")
    .select("id, label")
    .order("label", { ascending: true });

  return (data as Team[]) ?? [];
}

// ==========================================
// READ (new)
// ==========================================

export async function getTeamsWithMembers(): Promise<TeamWithMembers[]> {
  const supabaseAdmin = createAdminClient();

  // Fetch all teams (try with description, fallback without)
  let { data: teams, error: teamsError } = await supabaseAdmin
    .from("teams")
    .select("id, label, description, department_id, created_at")
    .order("label", { ascending: true });

  if (teamsError && teamsError.message?.includes("description")) {
    ({ data: teams, error: teamsError } = await supabaseAdmin
      .from("teams")
      .select("id, label, department_id, created_at")
      .order("label", { ascending: true }));
  }

  if (teamsError || !teams) return [];

  // Fetch all team_members with profile data
  const { data: members, error: membersError } = await supabaseAdmin
    .from("team_members")
    .select("id, team_id, user_id, role, created_at, profile:profiles!team_members_user_id_fkey(id, first_name, last_name, email, avatar_url, job_title, role)");

  if (membersError) {
    console.error("[getTeamsWithMembers] Members error:", membersError.message);
  }

  const membersByTeam = new Map<string, typeof members>();
  for (const member of members ?? []) {
    const list = membersByTeam.get(member.team_id) ?? [];
    list.push(member);
    membersByTeam.set(member.team_id, list);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return teams.map((team: any) => ({
    id: team.id,
    label: team.label,
    description: team.description ?? "",
    department_id: team.department_id ?? null,
    created_at: team.created_at,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    members: (membersByTeam.get(team.id) ?? []).map((m: any) => ({
      id: m.id,
      team_id: m.team_id,
      user_id: m.user_id,
      role: m.role as TeamMemberRole,
      created_at: m.created_at,
      profile: m.profile as unknown as TeamWithMembers["members"][number]["profile"],
    })),
  }));
}

export async function getTeamById(teamId: string): Promise<TeamWithMembers | null> {
  const supabaseAdmin = createAdminClient();

  let { data: team, error: teamError } = await supabaseAdmin
    .from("teams")
    .select("id, label, description, department_id, created_at")
    .eq("id", teamId)
    .single();

  if (teamError && teamError.message?.includes("description")) {
    ({ data: team, error: teamError } = await supabaseAdmin
      .from("teams")
      .select("id, label, department_id, created_at")
      .eq("id", teamId)
      .single());
  }

  if (teamError || !team) return null;

  const { data: members } = await supabaseAdmin
    .from("team_members")
    .select("id, team_id, user_id, role, created_at, profile:profiles!team_members_user_id_fkey(id, first_name, last_name, email, avatar_url, job_title, role)")
    .eq("team_id", teamId);

  return {
    id: team.id,
    label: team.label,
    description: team.description ?? "",
    department_id: team.department_id ?? null,
    created_at: team.created_at,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    members: (members ?? []).map((m: any) => ({
      id: m.id,
      team_id: m.team_id,
      user_id: m.user_id,
      role: m.role as TeamMemberRole,
      created_at: m.created_at,
      profile: m.profile as unknown as TeamWithMembers["members"][number]["profile"],
    })),
  };
}

export async function getUserTeams(
  userId: string
): Promise<{ team_id: string; team_label: string; role: TeamMemberRole }[]> {
  const supabaseAdmin = createAdminClient();

  const { data, error } = await supabaseAdmin
    .from("team_members")
    .select("team_id, role, team:teams!team_members_team_id_fkey(label)")
    .eq("user_id", userId);

  if (error || !data) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data.map((row: any) => ({
    team_id: row.team_id,
    team_label: (row.team as unknown as { label: string })?.label ?? "",
    role: row.role as TeamMemberRole,
  }));
}

// ==========================================
// CREATE (original, kept)
// ==========================================

export async function addTeam(
  label: string
): Promise<{ success: boolean; team?: Team; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Non authentifié" };

  const { data: callerProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!callerProfile || !["admin", "rh"].includes(callerProfile.role)) {
    return { success: false, error: "Accès refusé" };
  }

  const supabaseAdmin = createAdminClient();
  const { data, error } = await supabaseAdmin
    .from("teams")
    .insert({ label: label.trim() })
    .select("id, label")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { success: false, error: "Cette équipe existe déjà" };
    }
    return { success: false, error: error.message };
  }

  await auditLog(user.id, "create", "team", data?.id ?? null, { label: label.trim() });
  revalidateAll();
  return { success: true, team: data as Team };
}

// ==========================================
// CREATE (new, with description)
// ==========================================

export async function createTeam(
  label: string,
  description?: string
): Promise<{ success: boolean; team?: Team; error?: string }> {
  const caller = await getCallerProfile();
  if (!caller || !isAdminOrRh(caller.role)) {
    return { success: false, error: "Accès refusé" };
  }

  const supabaseAdmin = createAdminClient();

  // Try with description first, fallback without if column doesn't exist
  const insertData: Record<string, string> = { label: label.trim() };
  if (description?.trim()) insertData.description = description.trim();

  let result = await supabaseAdmin
    .from("teams")
    .insert(insertData)
    .select("id, label")
    .single();

  // If description column doesn't exist, retry without it
  if (result.error && result.error.message?.includes("description")) {
    result = await supabaseAdmin
      .from("teams")
      .insert({ label: label.trim() })
      .select("id, label")
      .single();
  }

  if (result.error) {
    if (result.error.code === "23505") {
      return { success: false, error: "Cette équipe existe déjà" };
    }
    return { success: false, error: result.error.message };
  }

  await auditLog(caller.authId, "create", "team", result.data?.id ?? null, {
    label: label.trim(),
    description: description?.trim() ?? "",
  });
  revalidateAll();
  return { success: true, team: result.data as Team };
}

// ==========================================
// UPDATE
// ==========================================

export async function updateTeam(
  teamId: string,
  data: { label?: string; description?: string }
): Promise<{ success: boolean; error?: string }> {
  const caller = await getCallerProfile();
  if (!caller || !isAdminOrRh(caller.role)) {
    return { success: false, error: "Accès refusé" };
  }

  const supabaseAdmin = createAdminClient();

  const updateData: Record<string, string> = {};
  if (data.label !== undefined) updateData.label = data.label.trim();
  if (data.description !== undefined) updateData.description = data.description.trim();

  let { error } = await supabaseAdmin
    .from("teams")
    .update(updateData)
    .eq("id", teamId);

  // If description column doesn't exist, retry without it
  if (error && error.message?.includes("description") && updateData.description !== undefined) {
    const { description: _desc, ...rest } = updateData;
    ({ error } = await supabaseAdmin
      .from("teams")
      .update(rest)
      .eq("id", teamId));
  }

  if (error) {
    if (error.code === "23505") {
      return { success: false, error: "Une équipe avec ce nom existe déjà" };
    }
    return { success: false, error: error.message };
  }

  await auditLog(caller.authId, "update", "team", teamId, updateData);
  revalidateAll();
  return { success: true };
}

// ==========================================
// DELETE (original, kept)
// ==========================================

export async function deleteTeam(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Non authentifié" };

  const { data: callerProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!callerProfile || !["admin", "rh"].includes(callerProfile.role)) {
    return { success: false, error: "Accès refusé" };
  }

  const supabaseAdmin = createAdminClient();
  const { error } = await supabaseAdmin
    .from("teams")
    .delete()
    .eq("id", id);

  if (error) return { success: false, error: error.message };

  await auditLog(user.id, "delete", "team", id, {});
  revalidateAll();
  return { success: true };
}

// ==========================================
// TEAM MEMBERS
// ==========================================

export async function addTeamMember(
  teamId: string,
  userId: string,
  role: TeamMemberRole
): Promise<{ success: boolean; error?: string }> {
  const caller = await getCallerProfile();
  if (!caller || !isAdminOrRh(caller.role)) {
    return { success: false, error: "Accès refusé" };
  }

  const supabaseAdmin = createAdminClient();

  // If role is manager, ensure no other manager exists (or update existing)
  if (role === "manager") {
    // Remove existing manager
    await supabaseAdmin
      .from("team_members")
      .update({ role: "member" })
      .eq("team_id", teamId)
      .eq("role", "manager");
  }

  const { error } = await supabaseAdmin
    .from("team_members")
    .upsert(
      { team_id: teamId, user_id: userId, role },
      { onConflict: "team_id,user_id" }
    );

  if (error) {
    if (error.code === "23505") {
      return { success: false, error: "Ce membre fait déjà partie de l'équipe" };
    }
    return { success: false, error: error.message };
  }

  // Sync profiles.team with the team label
  const { data: teamData } = await supabaseAdmin
    .from("teams")
    .select("label")
    .eq("id", teamId)
    .single();
  if (teamData) {
    await supabaseAdmin
      .from("profiles")
      .update({ team: teamData.label })
      .eq("id", userId);
  }

  await auditLog(caller.authId, "add_member", "team", teamId, { userId, role });
  revalidateAll();
  return { success: true };
}

export async function removeTeamMember(
  teamId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const caller = await getCallerProfile();
  if (!caller || !isAdminOrRh(caller.role)) {
    return { success: false, error: "Accès refusé" };
  }

  const supabaseAdmin = createAdminClient();
  const { error } = await supabaseAdmin
    .from("team_members")
    .delete()
    .eq("team_id", teamId)
    .eq("user_id", userId);

  if (error) return { success: false, error: error.message };

  // Sync profiles.team: check if user still has other teams
  const { data: remainingTeams } = await supabaseAdmin
    .from("team_members")
    .select("team_id, team:teams!team_members_team_id_fkey(label)")
    .eq("user_id", userId)
    .limit(1);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const firstTeamLabel = remainingTeams?.[0] ? (remainingTeams[0].team as any)?.label ?? "" : "";
  await supabaseAdmin
    .from("profiles")
    .update({ team: firstTeamLabel })
    .eq("id", userId);

  await auditLog(caller.authId, "remove_member", "team", teamId, { userId });
  revalidateAll();
  return { success: true };
}

export async function updateTeamMemberRole(
  teamId: string,
  userId: string,
  role: TeamMemberRole
): Promise<{ success: boolean; error?: string }> {
  const caller = await getCallerProfile();
  if (!caller || !isAdminOrRh(caller.role)) {
    return { success: false, error: "Accès refusé" };
  }

  const supabaseAdmin = createAdminClient();

  // If promoting to manager, demote existing manager
  if (role === "manager") {
    await supabaseAdmin
      .from("team_members")
      .update({ role: "member" })
      .eq("team_id", teamId)
      .eq("role", "manager");
  }

  const { error } = await supabaseAdmin
    .from("team_members")
    .update({ role })
    .eq("team_id", teamId)
    .eq("user_id", userId);

  if (error) return { success: false, error: error.message };

  await auditLog(caller.authId, "update_member_role", "team", teamId, { userId, role });
  revalidateAll();
  return { success: true };
}
