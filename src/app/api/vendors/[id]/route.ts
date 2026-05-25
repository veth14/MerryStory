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
      return NextResponse.json({ error: "Invalid vendor ID." }, { status: 400 });
    }

    const body = await request.json();
    const { name, category, contact, email, phone, status, rating } = body;

    const db = await getMongoDb();
    const vendorsCollection = db.collection("vendors");

    const updateData: any = {
      name, 
      category, 
      contact, 
      email, 
      phone, 
      status,
      updatedAt: new Date()
    };

    if (rating !== undefined) {
      updateData.rating = rating;
    }

    const result = await vendorsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Vendor not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    if (error instanceof AuthGuardError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("Error updating vendor:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    await requireRole(request, ["admin", "coordinator"]);
    const { id } = await context.params;

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid vendor ID." }, { status: 400 });
    }

    const db = await getMongoDb();
    const vendorsCollection = db.collection("vendors");

    const result = await vendorsCollection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Vendor not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    if (error instanceof AuthGuardError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("Error deleting vendor:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
