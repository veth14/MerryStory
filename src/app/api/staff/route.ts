import { NextRequest, NextResponse } from "next/server";
import { AuthGuardError, requireAuthenticatedUser } from "@/lib/auth/guards";
import { getMongoDb } from "@/lib/mongodb";

type StaffUserDocument = {
  firebaseUid?: string;
  email?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  accessRole?: string;
  avatarUrl?: string;
};

const resolveName = (doc: StaffUserDocument) => doc.name || `${doc.firstName || ""} ${doc.lastName || ""}`.trim() || "Unnamed User";
const resolveRole = (doc: StaffUserDocument) => doc.accessRole || doc.role || "PRODUCTION STAFF";
const resolveAppRole = (doc: StaffUserDocument) => {
  if (doc.role === "admin" || doc.role === "coordinator" || doc.role === "staff") {
    return doc.role;
  }

  if (doc.accessRole === "ADMINISTRATOR") return "admin";
  if (doc.accessRole === "LEAD COORDINATOR") return "coordinator";
  return "staff";
};

export async function GET(request: NextRequest) {
  try {
    await requireAuthenticatedUser(request);

    const db = await getMongoDb();
    const usersCollection = db.collection<StaffUserDocument>("users");
    const users = await usersCollection
      .find({ firebaseUid: { $exists: true, $ne: "" } })
      .sort({ name: 1, firstName: 1, lastName: 1 })
      .toArray();

    return NextResponse.json(
      {
        users: users.map((user) => ({
          uid: user.firebaseUid || "",
          name: resolveName(user),
          role: resolveRole(user),
          appRole: resolveAppRole(user),
          avatarUrl: user.avatarUrl || null,
          email: user.email || null,
        })),
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof AuthGuardError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    console.error("Staff GET error:", error);
    return NextResponse.json({ error: "Failed to fetch staff." }, { status: 500 });
  }
}
