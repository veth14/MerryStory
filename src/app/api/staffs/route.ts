import { NextRequest, NextResponse } from "next/server";
import { requireRole, AuthGuardError } from "@/lib/auth/guards";
import { getMongoDb } from "@/lib/mongodb";

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, ["admin", "coordinator"]);
    const db = await getMongoDb();
    const staffsCollection = db.collection("staffs");

    const staffs = await staffsCollection.find({}).sort({ name: 1 }).toArray();

    return NextResponse.json(staffs, { status: 200 });
  } catch (error) {
    if (error instanceof AuthGuardError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("Error fetching staffs:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
