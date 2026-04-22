import { NextResponse } from "next/server";
import { getMongoDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { requireAuthenticatedUser, AuthGuardError } from "@/lib/auth/guards";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string, guestId: string }> }
) {
  try {
    await requireAuthenticatedUser(request);
    const { id, guestId } = await params;
    const body = await request.json();
    const db = await getMongoDb();

    // Get old guest data to adjust counts if status changed
    const oldGuest = await db.collection("event_guests").findOne({ _id: new ObjectId(guestId) });
    
    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.tableNo !== undefined) updateData.tableNo = body.tableNo;
    if (body.plusOne !== undefined) updateData.plusOne = body.plusOne;
    if (body.checkedIn !== undefined) updateData.checkedIn = body.checkedIn;

    await db.collection("event_guests").updateOne(
      { _id: new ObjectId(guestId) },
      { $set: updateData }
    );

    // Sync counts in the main event document
    if (oldGuest && body.status !== undefined && oldGuest.status !== body.status) {
      let rsvpChange = 0;
      if (oldGuest.status === "Confirmed") rsvpChange--;
      if (body.status === "Confirmed") rsvpChange++;
      
      if (rsvpChange !== 0) {
        await db.collection("events").updateOne(
          { _id: new ObjectId(id) },
          { $inc: { "guests.rsvp": rsvpChange } }
        );
      }
    }

    if (oldGuest && body.checkedIn !== undefined && oldGuest.checkedIn !== body.checkedIn) {
      await db.collection("events").updateOne(
        { _id: new ObjectId(id) },
        { $inc: { "guests.checkedIn": body.checkedIn ? 1 : -1 } }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    if (error instanceof AuthGuardError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("PUT GUEST ERROR:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string, guestId: string }> }
) {
  try {
    await requireAuthenticatedUser(request);
    const { id, guestId } = await params;
    const db = await getMongoDb();

    const guest = await db.collection("event_guests").findOne({ _id: new ObjectId(guestId) });
    if (!guest) return NextResponse.json({ error: "Guest not found" }, { status: 404 });

    await db.collection("event_guests").deleteOne({ _id: new ObjectId(guestId) });

    // Sync counts
    let rsvpDec = guest.status === "Confirmed" ? -1 : 0;
    let checkDec = guest.checkedIn ? -1 : 0;
    
    if (rsvpDec !== 0 || checkDec !== 0) {
      const incObj: any = {};
      if (rsvpDec !== 0) incObj["guests.rsvp"] = rsvpDec;
      if (checkDec !== 0) incObj["guests.checkedIn"] = checkDec;
      
      await db.collection("events").updateOne(
        { _id: new ObjectId(id) },
        { $inc: incObj }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    if (error instanceof AuthGuardError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
