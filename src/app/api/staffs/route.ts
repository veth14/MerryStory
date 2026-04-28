import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedUser, AuthGuardError } from "@/lib/auth/guards";
import { getMongoDb } from "@/lib/mongodb";

type UserDocument = {
  _id?: unknown;
  name?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  accessRole?: string;
  status?: string;
  avatarUrl?: string;
  firebaseUid?: string;
};

export async function GET(request: NextRequest) {
  try {
    await requireAuthenticatedUser(request);

    const db = await getMongoDb();
    const usersCollection = db.collection<UserDocument>("users");
    const users = await usersCollection
      .find({ firebaseUid: { $exists: true, $ne: "" } })
      .sort({ name: 1, firstName: 1, lastName: 1 })
      .toArray();

    return NextResponse.json(
      users.map((user) => ({
        _id: user._id?.toString?.() || user._id,
        name: user.name || `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Unnamed User",
        role: user.accessRole || user.role || "PRODUCTION STAFF",
        status: user.status || "Active",
        avatarUrl: user.avatarUrl || null,
      })),
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof AuthGuardError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    console.error("Error fetching staffs:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
