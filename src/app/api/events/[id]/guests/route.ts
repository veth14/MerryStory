import { NextResponse } from "next/server";
import { getMongoDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { requireAuthenticatedUser, AuthGuardError } from "@/lib/auth/guards";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuthenticatedUser(request);
    const { id } = await params;
    const db = await getMongoDb();
    
    const guests = await db.collection("rsvp")
      .find({ eventId: new ObjectId(id) })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json(guests, { status: 200 });
  } catch (error) {
    if (error instanceof AuthGuardError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("GET GUESTS ERROR:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuthenticatedUser(request);
    const { id } = await params;
    const body = await request.json();
    const db = await getMongoDb();

    const newGuest = {
      eventId: new ObjectId(id),
      name: body.name,
      email: body.email || "",
      phone: body.phone || "",
      status: body.status || "Pending",
      tableNo: body.tableNo || "TBD",
      plusOne: !!body.plusOne,
      checkedIn: false,
      createdAt: new Date()
    };

    const result = await db.collection("rsvp").insertOne(newGuest);
    
    // Update event summary count
    if (body.status === "Confirmed") {
      await db.collection("events").updateOne(
        { _id: new ObjectId(id) },
        { $inc: { "guests.rsvp": 1 } }
      );
    }

    return NextResponse.json({ ...newGuest, _id: result.insertedId }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthGuardError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("POST GUEST ERROR:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
