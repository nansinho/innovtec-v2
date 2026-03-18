import { createAdminClient } from "@/lib/supabase/admin";

// ─── Types ───

export type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "view"
  | "download"
  | "export"
  | "status_change"
  | "login"
  | "logout"
  | "password_change"
  | "password_reset"
  | "upload"
  | "batch_delete"
  | "publish"
  | "archive"
  | "assign"
  | "like"
  | "comment"
  | "send"
  | "mark_read"
  | "start"
  | "stop"
  | "complete"
  | "consume"
  | "promote_to_admin"
  | "change_role"
  | "deactivate"
  | "reactivate"
  | "send_wish";

export type AuditTargetType =
  | "user"
  | "document"
  | "news"
  | "signalement"
  | "action_plan"
  | "rex"
  | "formation"
  | "conge"
  | "event"
  | "best_practice"
  | "sse_dashboard"
  | "gallery"
  | "feed_post"
  | "feed_comment"
  | "notification"
  | "settings"
  | "todo"
  | "message"
  | "birthday"
  | "department"
  | "team"
  | "job_title"
  | "ai_credit"
  | "timebit"
  | "qse_policy"
  | "danger_report";

interface AuditDetails {
  [key: string]: unknown;
}

// ─── Main audit function ───

/**
 * Log an activity in the audit trail.
 * Never throws — silently catches errors to avoid blocking the main flow.
 */
export async function auditLog(
  userId: string | null,
  action: AuditAction,
  targetType: AuditTargetType,
  targetId: string | null,
  details: AuditDetails = {}
): Promise<void> {
  try {
    const supabaseAdmin = createAdminClient();
    await supabaseAdmin.from("activity_logs").insert({
      user_id: userId,
      action,
      target_type: targetType,
      target_id: targetId,
      details,
    });
  } catch (e) {
    console.error("[auditLog] Failed to log activity:", e);
  }
}
