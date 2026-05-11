import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedUser, AuthGuardError } from "@/lib/auth/guards";
import { getMongoDb } from "@/lib/mongodb";

export async function GET(request: NextRequest) {
  try {
    await requireAuthenticatedUser(request);
    const db = await getMongoDb();
    const eventsCollection = db.collection("events");

    const events = await eventsCollection.find({ archived: true }).sort({ archivedAt: -1 }).toArray();

    return NextResponse.json(events, { status: 200 });
  } catch (error) {
    if (error instanceof AuthGuardError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("Error fetching archived events:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
