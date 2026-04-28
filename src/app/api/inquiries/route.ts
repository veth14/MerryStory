import { NextRequest, NextResponse } from "next/server";
import { requireRole, AuthGuardError } from "@/lib/auth/guards";
import { getMongoDb } from "@/lib/mongodb";

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, ["admin", "coordinator", "staff"]);

    const db = await getMongoDb();
    const inquiriesCollection = db.collection("inquiries");

    const inquiries = await inquiriesCollection.find({}).sort({ submitted: -1 }).toArray();

    return NextResponse.json(
      {
        inquiries: inquiries.map(inq => ({
          id: inq._id.toString(),
          client: inq.client,
          email: inq.email,
          eventType: inq.eventType,
          needs: inq.needs,
          status: inq.status || "New",
          submitted: inq.submitted,
          isArchived: inq.isArchived || false,
        })),
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof AuthGuardError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    console.error("Inquiries GET error:", error);
    return NextResponse.json({ error: "Failed to fetch inquiries." }, { status: 500 });
  }
}
