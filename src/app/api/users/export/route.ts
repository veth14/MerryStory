import { NextRequest, NextResponse } from "next/server";
import { AuthGuardError, requireRole } from "@/lib/auth/guards";
import { getMongoDb } from "@/lib/mongodb";
import { writeAuditLog } from "@/lib/audit";
import { type UserDocument } from "../route";

function escapeCsv(value: unknown): string {
  const raw = String(value ?? "");

  if (/[",\n\r]/.test(raw)) {
    return `"${raw.replace(/"/g, '""')}"`;
  }

  return raw;
}

function toCsv(users: UserDocument[]): string {
  const header = [
    "UID",
    "Name",
    "Email",
    "AccessRole",
    "AppRole",
    "Status",
    "IsActive",
    "CreatedAt",
    "UpdatedAt",
    "LastActiveAt",
  ];

  const rows = users.map((entry) => {
    const name = entry.name || `${entry.firstName || ""} ${entry.lastName || ""}`.trim();

    return [
      entry.firebaseUid,
      name,
      entry.email,
      entry.accessRole || "",
      entry.role || "",
      entry.status || "",
      entry.isActive ? "true" : "false",
      entry.createdAt instanceof Date ? entry.createdAt.toISOString() : entry.createdAt || "",
      entry.updatedAt instanceof Date ? entry.updatedAt.toISOString() : entry.updatedAt || "",
      entry.lastActiveAt instanceof Date ? entry.lastActiveAt.toISOString() : entry.lastActiveAt || "",
    ]
      .map(escapeCsv)
      .join(",");
  });

  return [header.join(","), ...rows].join("\n");
}

export async function GET(request: NextRequest) {
  try {
    const actor = await requireRole(request, ["admin"]);

    const db = await getMongoDb();
    const usersCollection = db.collection<UserDocument>("users");
    const users = await usersCollection.find({ firebaseUid: { $exists: true, $ne: "" } }).sort({ createdAt: -1 }).toArray();

    const csv = `\uFEFF${toCsv(users)}`;
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const fileName = `users-directory-${timestamp}.csv`;

    await writeAuditLog({
      request,
      category: "USER_MANAGEMENT",
      action: "USERS_EXPORTED",
      message: `Exported users directory (${users.length} entries).`,
      actor: {
        uid: actor.uid,
        email: actor.email,
        role: actor.role,
      },
      details: {
        exportCount: users.length,
      },
    });

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename=\"${fileName}\"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    if (error instanceof AuthGuardError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    console.error("Users export error:", error);
    return NextResponse.json({ error: "Failed to export users directory." }, { status: 500 });
  }
}
