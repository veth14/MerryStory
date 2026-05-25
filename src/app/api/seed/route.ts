import { NextRequest, NextResponse } from "next/server";
import { getMongoDb } from "@/lib/mongodb";
import { AuthGuardError, requireRole } from "@/lib/auth/guards";

export async function GET(request: NextRequest) {
  try {
    if (process.env.ALLOW_SEED !== "true") {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }

    await requireRole(request, ["admin"]);
    const db = await getMongoDb();
    const usersCollection = db.collection("users");

    // The user's specific UID and email provided in instructions
    const result = await usersCollection.updateOne(
      { firebaseUid: "7DmjOdmWZihfLP2GeDqiTPRdWCL2" },
      { 
        $set: { 
          email: "merrystoryeventservices@gmail.com", 
          role: "admin", 
          name: "Merry Story Admin",
          baseRole: "admin",
          isActive: true
        } 
      },
      { upsert: true }
    );

    return NextResponse.json({ 
      success: true, 
      message: "Admin user seeded successfully.",
      result
    });
  } catch (error) {
    if (error instanceof AuthGuardError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("Seed error:", error);
    return NextResponse.json({ error: "Failed to seed admin user." }, { status: 500 });
  }
}
