import { getMongoDb } from "@/lib/mongodb";

export type AuditCategory = 
  | "USER_MANAGEMENT" 
  | "PROFILE" 
  | "SECURITY" 
  | "AUTH" 
  | "SYSTEM" 
  | "TASK_MANAGEMENT"
  | "CONTRACT_MANAGEMENT"
  | "EVENT_MANAGEMENT"
  | "EXPENSE_MANAGEMENT"
  | "VENDOR_MANAGEMENT"
  | "INQUIRY_MANAGEMENT";

export type AuditSeverity = "info" | "warning" | "critical";

export type AuditAction =
  | "USER_CREATED"
  | "USER_UPDATED"
  | "USER_DELETED"
  | "USERS_EXPORTED"
  | "PROFILE_UPDATED"
  | "PROFILE_AVATAR_UPDATED"
  | "PROFILE_AVATAR_REMOVED"
  | "EVENT_CREATED"
  | "EVENT_UPDATED"
  | "TASK_ASSIGNED"
  | "TASK_STATUS_UPDATED"
  | "CONTRACT_SIGNED"
  | "CONTRACT_REVISION_REQUESTED"
  | "EXPENSE_CREATED"
  | "VENDOR_CREATED"
  | "INQUIRY_STATUS";

export type AuditLogDocument = {
  category: AuditCategory;
  action: AuditAction;
  severity: AuditSeverity;
  message: string;
  details?: Record<string, unknown>;
  actorUid?: string | null;
  actorEmail?: string | null;
  actorRole?: string | null;
  targetUid?: string | null;
  targetEmail?: string | null;
  targetType?: "user" | "system" | "resource" | "contract" | "event" | "expense" | "vendor";
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: Date;
};

type AuditActor = {
  uid?: string | null;
  email?: string | null;
  role?: string | null;
};

type AuditTarget = {
  uid?: string | null;
  email?: string | null;
  type?: "user" | "system" | "resource" | "contract" | "event" | "expense" | "vendor";
};

type CreateAuditLogInput = {
  request: Request;
  category: AuditCategory;
  action: AuditAction;
  message: string;
  actor?: AuditActor;
  target?: AuditTarget;
  details?: Record<string, unknown>;
  severity?: AuditSeverity;
};

function getRequestIp(request: Request): string | null {
  const xForwardedFor = request.headers.get("x-forwarded-for");

  if (xForwardedFor) {
    const first = xForwardedFor.split(",")[0]?.trim();
    if (first) {
      return first;
    }
  }

  const xRealIp = request.headers.get("x-real-ip");

  if (xRealIp) {
    return xRealIp.trim();
  }

  return null;
}

export async function writeAuditLog(input: CreateAuditLogInput): Promise<void> {
  try {
    const db = await getMongoDb();
    const logsCollection = db.collection<AuditLogDocument>("audit_logs");

    const log: AuditLogDocument = {
      category: input.category,
      action: input.action,
      severity: input.severity || "info",
      message: input.message,
      details: input.details,
      actorUid: input.actor?.uid || null,
      actorEmail: input.actor?.email || null,
      actorRole: input.actor?.role || null,
      targetUid: input.target?.uid || null,
      targetEmail: input.target?.email || null,
      targetType: input.target?.type || "user",
      ipAddress: getRequestIp(input.request),
      userAgent: input.request.headers.get("user-agent"),
      createdAt: new Date(),
    };

    await logsCollection.insertOne(log);
  } catch (error) {
    console.error("Audit log write failed:", error);
  }
}
