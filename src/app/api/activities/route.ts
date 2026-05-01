import { NextRequest, NextResponse } from "next/server";
import { AuthGuardError, requireAuthenticatedUser } from "@/lib/auth/guards";
import { getMongoDb } from "@/lib/mongodb";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuthenticatedUser(request);
    const { searchParams } = new URL(request.url);
    const targetUid = searchParams.get("uid");
    
    const db = await getMongoDb();
    const logsCollection = db.collection("audit_logs");

    let query: any = {
      $or: [
        { category: "TASK_MANAGEMENT" },
        { category: "INQUIRY_MANAGEMENT" }
      ]
    };

    if (targetUid && (user as any).role === "admin") {
      // Admin requesting a specific member's activity
      query.actorUid = targetUid;
    } else {
      // Regular user or admin requesting their own activity
      const userName = (user as any).displayName || "";
      query.$or = [
        { 
          $and: [
            { actorUid: user.uid },
            { $or: [
              { category: "TASK_MANAGEMENT" },
              { category: "INQUIRY_MANAGEMENT" }
            ]}
          ]
        },
        { 
          $and: [
            { message: { $regex: userName, $options: "i" } },
            { $or: [
              { category: "TASK_MANAGEMENT" },
              { category: "INQUIRY_MANAGEMENT" }
            ]}
          ]
        },
        { 
          $and: [
            { "details.assignee": userName },
            { $or: [
              { category: "TASK_MANAGEMENT" },
              { category: "INQUIRY_MANAGEMENT" }
            ]}
          ]
        }
      ];
    }

    const logs = await logsCollection
      .find(query)
      .sort({ createdAt: -1 })
      .limit(15)
      .toArray();

    const activities = logs.map(log => ({
      id: log._id.toString(),
      action: log.action,
      message: log.message,
      time: log.createdAt,
      actor: log.actorEmail === user.email ? "You" : (log.actorEmail || "System"),
      type: log.category === "INQUIRY_MANAGEMENT" ? "inquiry" : "task",
      details: log.details
    }));

    return NextResponse.json(activities, { status: 200 });
  } catch (error) {
    if (error instanceof AuthGuardError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("Activities API Error:", error);
    return NextResponse.json({ error: "Failed to fetch activities" }, { status: 500 });
  }
}