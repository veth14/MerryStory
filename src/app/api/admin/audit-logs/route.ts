import { NextRequest, NextResponse } from "next/server";
import { AuthGuardError, requireRole } from "@/lib/auth/guards";
import { getMongoDb } from "@/lib/mongodb";
import { type AuditCategory, type AuditLogDocument } from "@/lib/audit";

const ALLOWED_CATEGORIES: AuditCategory[] = ["USER_MANAGEMENT", "PROFILE", "SECURITY", "AUTH", "SYSTEM"];

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, ["admin"]);

    const url = new URL(request.url);
    const category = url.searchParams.get("category");
    const search = (url.searchParams.get("search") || "").trim();
    const limitParam = Number(url.searchParams.get("limit") || "100");
    const limit = Number.isFinite(limitParam) ? Math.max(1, Math.min(limitParam, 500)) : 100;

    const query: Record<string, unknown> = {};

    if (category && category !== "ALL" && ALLOWED_CATEGORIES.includes(category as AuditCategory)) {
      query.category = category;
    }

    if (search) {
      const regex = { $regex: escapeRegExp(search), $options: "i" };
      query.$or = [{ message: regex }, { action: regex }, { actorEmail: regex }, { targetEmail: regex }];
    }

    const db = await getMongoDb();
    const logsCollection = db.collection<AuditLogDocument>("audit_logs");

    const logs = await logsCollection.find(query).sort({ createdAt: -1 }).limit(limit).toArray();

    return NextResponse.json(
      {
        logs: logs.map((entry) => ({
          id: String((entry as { _id?: unknown })._id || ""),
          category: entry.category,
          action: entry.action,
          severity: entry.severity,
          message: entry.message,
          details: entry.details || {},
          actorUid: entry.actorUid || null,
          actorEmail: entry.actorEmail || null,
          actorRole: entry.actorRole || null,
          targetUid: entry.targetUid || null,
          targetEmail: entry.targetEmail || null,
          targetType: entry.targetType || null,
          ipAddress: entry.ipAddress || null,
          userAgent: entry.userAgent || null,
          createdAt: entry.createdAt instanceof Date ? entry.createdAt.toISOString() : new Date(entry.createdAt).toISOString(),
        })),
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof AuthGuardError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    console.error("Audit logs GET error:", error);
    return NextResponse.json({ error: "Failed to fetch audit logs." }, { status: 500 });
  }
}
