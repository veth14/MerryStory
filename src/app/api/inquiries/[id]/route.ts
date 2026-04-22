import { NextRequest, NextResponse } from "next/server";
import { requireRole, AuthGuardError } from "@/lib/auth/guards";
import { getMongoDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    await requireRole(request, ["admin", "coordinator"]);

    const { id } = await context.params;

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid inquiry ID." }, { status: 400 });
    }

    const body = await request.json();
    const updateData: any = {};

    if (body.status !== undefined) {
      updateData.status = body.status;
    }

    if (body.isArchived !== undefined) {
      updateData.isArchived = body.isArchived;
    }

    if (Object.keys(updateData).length === 0) {
       return NextResponse.json({ error: "No fields to update." }, { status: 400 });
    }

    const db = await getMongoDb();
    const inquiriesCollection = db.collection("inquiries");

    const result = await inquiriesCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Inquiry not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    if (error instanceof AuthGuardError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    console.error("Inquiries PUT error:", error);
    return NextResponse.json({ error: "Failed to update inquiry." }, { status: 500 });
  }
}
