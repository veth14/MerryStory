import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedUser, AuthGuardError } from "@/lib/auth/guards";
import { getMongoDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    await requireAuthenticatedUser(request);

    const { id } = await context.params;

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid event ID." }, { status: 400 });
    }

    const db = await getMongoDb();
    const eventsCollection = db.collection("events");

    const event = await eventsCollection.findOne({ _id: new ObjectId(id) });

    if (!event) {
      return NextResponse.json({ error: "Event not found." }, { status: 404 });
    }

    // Fetch lead and team profiles to get avatars
    const usersCollection = db.collection("users");
    
    // Resolve lead profile
    const leadProfile = await usersCollection.findOne({ name: event.leadAssigned });
    
    // Resolve team profiles
    let teamWithProfiles = [];
    if (event.team && Array.isArray(event.team)) {
      teamWithProfiles = await Promise.all(event.team.map(async (m: any) => {
        const profile = await usersCollection.findOne({ name: m.name });
        return { ...m, avatarUrl: profile?.avatarUrl || m.avatarUrl };
      }));
    }

    const enrichedEvent = {
      ...event,
      leadAvatarUrl: leadProfile?.avatarUrl || null,
      team: teamWithProfiles
    };

    return NextResponse.json(enrichedEvent, { status: 200 });
  } catch (error) {
    if (error instanceof AuthGuardError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    console.error("Event Detail GET error:", error);
    return NextResponse.json({ error: "Failed to fetch event details." }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    await requireAuthenticatedUser(request);

    const { id } = await context.params;
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid event ID." }, { status: 400 });
    }

    const body = await request.json();
    const db = await getMongoDb();
    const eventsCollection = db.collection("events");

    // Remove _id from update body if present
    const { _id, ...updateData } = body;

    const result = await eventsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...updateData, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Event not found." }, { status: 404 });
    }

    return NextResponse.json({ message: "Event updated successfully" }, { status: 200 });
  } catch (error) {
    if (error instanceof AuthGuardError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("Event Detail PUT error:", error);
    return NextResponse.json({ error: "Failed to update event." }, { status: 500 });
  }
}
