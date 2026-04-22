import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth/guards";
import { getMongoDb } from "@/lib/mongodb";

export async function GET(request: NextRequest) {
  try {
    await requireAuthenticatedUser(request);
    
    const db = await getMongoDb();
    
    // Fetch recent inquiries to act as notifications
    const inquiries = await db.collection("inquiries")
      .find({ isArchived: { $ne: true } })
      .sort({ submitted: -1 })
      .limit(5)
      .toArray();
      
    const notifications = inquiries.map(inq => ({
      id: inq._id.toString(),
      type: inq.type === 'consultation' ? 'consultation' : 'inquiry',
      title: inq.type === 'consultation' ? `Consultation request from ${inq.client}` : `New inquiry from ${inq.client}`,
      time: inq.submitted,
      isRead: false,
      event: inq.eventType
    }));

    return NextResponse.json({ notifications }, { status: 200 });
  } catch (error) {
    console.error("Notifications API Error:", error);
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}
