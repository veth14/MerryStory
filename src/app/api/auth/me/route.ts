import { NextRequest, NextResponse } from "next/server";
import { AuthGuardError, requireAuthenticatedUser } from "@/lib/auth/guards";
import { getMongoDb } from "@/lib/mongodb";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuthenticatedUser(request);

    // Update lastActiveAt non-blocking — don't fail auth if DB update fails
    getMongoDb()
      .then((db) =>
        db.collection("users").updateOne(
          { firebaseUid: user.uid },
          { $set: { lastActiveAt: new Date() } }
        )
      )
      .catch((err) => console.error("Failed to update lastActiveAt:", err));

    return NextResponse.json(
      {
        uid: user.uid,
        email: user.email,
        role: user.role,
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof AuthGuardError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    console.error("Auth profile lookup error in /api/auth/me:", error);
    return NextResponse.json({ error: "Failed to validate authenticated user." }, { status: 500 });
  }
}
