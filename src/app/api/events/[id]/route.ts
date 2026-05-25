import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedUser, AuthGuardError } from "@/lib/auth/guards";
import { getMongoDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { resolveSignedUrl, createSignedStorageUrl } from "@/lib/storage";

const isEventDatePassed = (eventDate?: string | Date | null) => {
  if (!eventDate) return false;
  const parsedDate = new Date(eventDate);
  if (Number.isNaN(parsedDate.getTime())) return false;
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  return parsedDate.getTime() < startOfToday.getTime();
};

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

    if (event.archived !== true && event.status !== 'Completed' && isEventDatePassed(event.date)) {
      await eventsCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { status: 'Completed', updatedAt: new Date() } }
      );
      event.status = 'Completed';
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
      coverImageUrl: await resolveSignedUrl(event.coverImagePath || event.coverImageUrl),
      leadAvatarUrl: leadProfile?.avatarUrl ? await resolveSignedUrl(leadProfile.avatarPath || leadProfile.avatarUrl) : null,
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

    const formData = await request.formData();
    const db = await getMongoDb();
    const eventsCollection = db.collection("events");

    // Fetch existing event to keep some fields if needed
    const existingEvent = await eventsCollection.findOne({ _id: new ObjectId(id) });
    if (!existingEvent) {
      return NextResponse.json({ error: "Event not found." }, { status: 404 });
    }

    const title = formData.get("title") as string;
    const type = formData.get("type") as string;
    const date = formData.get("date") as string;
    const location = formData.get("location") as string;
    const leadAssigned = formData.get("leadAssigned") as string;
    const status = formData.get("status") as string;
    const health = parseInt(formData.get("health") as string) || 0;
    const budgetTotal = parseFloat(formData.get("budgetTotal") as string) || 0;
    const vendorTarget = parseInt(formData.get("vendorTarget") as string) || 0;
    const guestCapacity = parseInt(formData.get("guestCapacity") as string) || 0;
    const clientName = formData.get("clientName") as string;
    const clientEmail = formData.get("clientEmail") as string;
    const clientPhone = formData.get("clientPhone") as string;
    const clientRole = formData.get("clientRole") as string;
    const initialAlert = formData.get("initialAlert") as string;
    const team = JSON.parse(formData.get("team") as string || "[]");
    
    const file = formData.get("coverImage") as File | null;
    let coverImageUrl = existingEvent.coverImageUrl;
    let coverImagePath = existingEvent.coverImagePath || null;

    if (file && file.size > 0) {
      const { getSupabaseServerClient } = await import("@/lib/supabase/server");
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const timeStamp = Date.now();
      const fileName = `cover_${timeStamp}.${fileExt}`;
      const storagePath = `events/${fileName}`;
      
      const supabase = getSupabaseServerClient();
      const buffer = Buffer.from(await file.arrayBuffer());
      
      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from("user")
        .upload(storagePath, buffer, {
          contentType: file.type || "image/jpeg",
          upsert: true
        });
        
      if (!uploadError) {
        coverImagePath = storagePath;
        coverImageUrl = await createSignedStorageUrl(storagePath);
      }
    }

    if (status === 'Completed' && !isEventDatePassed(date) && existingEvent.status !== 'Completed') {
      return NextResponse.json(
        { error: 'Production can only be marked Completed after the production date has passed.' },
        { status: 400 }
      );
    }

    const updateData: any = {
      title,
      type,
      date,
      location,
      leadAssigned,
      status,
      health,
      budget: { 
        ...existingEvent.budget, 
        total: budgetTotal 
      },
      vendors: { 
        ...existingEvent.vendors, 
        total: vendorTarget 
      },
      guests: { 
        ...existingEvent.guests, 
        invited: guestCapacity 
      },
      client: {
        name: clientName,
        email: clientEmail,
        phone: clientPhone,
        role: clientRole
      },
      team,
      initialAlert,
      coverImagePath,
      coverImageUrl,
      updatedAt: new Date()
    };

    // If status moved to Completed and not marked doNotPurge, mark as archived
    const shouldArchive = status === 'Completed' && !existingEvent?.archived && !existingEvent?.doNotPurge;
    if (shouldArchive) {
      updateData.archived = true;
      updateData.archivedAt = new Date();
    }

    const result = await eventsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    // Log event update
    const { writeAuditLog } = await import("@/lib/audit");
    const user = await requireAuthenticatedUser(request);
    
    let changes = [];
    if (existingEvent.status !== status) changes.push(`status: ${existingEvent.status} → ${status}`);
    if (existingEvent.health !== health) changes.push(`health: ${existingEvent.health}% → ${health}%`);
    if (existingEvent.title !== title) changes.push(`title updated`);
    
    await writeAuditLog({
      request,
      category: "EVENT_MANAGEMENT",
      action: "EVENT_UPDATED",
      message: `Event updated: ${title}${changes.length ? ` (${changes.join(', ')})` : ''}`,
      actor: {
        uid: user.uid,
        email: user.email,
        role: user.role
      },
      target: {
        type: "event",
        uid: id
      },
      details: {
        eventTitle: title,
        changes: changes
      }
    });

    if (shouldArchive) {
      await writeAuditLog({
        request,
        category: "EVENT_MANAGEMENT",
        action: "EVENT_ARCHIVED",
        message: `Event archived due to status Completed: ${title}`,
        actor: { uid: user.uid, email: user.email, role: user.role },
        target: { type: 'event', uid: id },
        details: { eventTitle: title }
      });
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
