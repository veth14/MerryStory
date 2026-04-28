import { NextRequest, NextResponse } from "next/server";
import { AuthGuardError, requireAuthenticatedUser } from "@/lib/auth/guards";
import { getMongoDb } from "@/lib/mongodb";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { writeAuditLog } from "@/lib/audit";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuthenticatedUser(request);
    
    const formData = await request.formData();
    
    const title = formData.get("title") as string;
    const type = formData.get("type") as string;
    const date = formData.get("date") as string;
    const location = formData.get("location") as string;
    const budgetTotal = Number(formData.get("budgetTotal"));
    const vendorTarget = Number(formData.get("vendorTarget"));
    const guestCapacity = Number(formData.get("guestCapacity"));
    const leadAssigned = formData.get("leadAssigned") as string;
    const initialAlert = formData.get("initialAlert") as string;
    
    const clientName = formData.get("clientName") as string;
    const clientEmail = formData.get("clientEmail") as string;
    const clientPhone = formData.get("clientPhone") as string;
    const clientRole = formData.get("clientRole") as string;
    
    const file = formData.get("coverImage") as File | null;

    // Backend Validation
    if (!title || !leadAssigned || !file) {
      return NextResponse.json({ error: "Title, Lead, and Cover Image are required." }, { status: 400 });
    }
    
    let coverImageUrl = null;
    
    if (file) {
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
        
      if (uploadError) {
        console.error("Supabase upload error:", uploadError);
        return NextResponse.json({ error: "Failed to upload cover image." }, { status: 500 });
      }
      
      const { data: publicUrlData } = supabase.storage.from("user").getPublicUrl(storagePath);
      coverImageUrl = publicUrlData.publicUrl;
    }
    
    const db = await getMongoDb();
    const eventsCollection = db.collection("events");
    
    const newEvent = {
      title,
      type,
      date,
      location,
      budget: { total: budgetTotal, utilized: 0 },
      vendors: { total: vendorTarget, secured: 0 },
      guests: { invited: guestCapacity, rsvp: 0, checkedIn: 0 },
      health: 100,
      status: "Active Production",
      leadAssigned,
      initialAlert,
      client: {
        name: clientName,
        email: clientEmail,
        phone: clientPhone,
        role: clientRole
      },
      coverImageUrl,
      createdAt: new Date(),
      createdBy: user.uid
    };
    
    const result = await eventsCollection.insertOne(newEvent);
    
    await writeAuditLog({
      request,
      category: "SYSTEM",
      action: "EVENT_CREATED",
      message: `Created new event: ${title}`,
      actor: {
        uid: user.uid,
        email: user.email,
        role: user.role
      },
      details: {
        eventId: result.insertedId,
        eventTitle: title,
        eventType: type
      }
    });
    
    return NextResponse.json({ success: true, eventId: result.insertedId }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthGuardError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("Error creating event:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    await requireAuthenticatedUser(request);
    const db = await getMongoDb();
    const eventsCollection = db.collection("events");
    
    const events = await eventsCollection.find({}).sort({ createdAt: -1 }).toArray();
    
    return NextResponse.json(events, { status: 200 });
  } catch (error) {
    if (error instanceof AuthGuardError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("Error fetching events:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
