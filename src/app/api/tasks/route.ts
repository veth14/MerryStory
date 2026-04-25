import { NextRequest, NextResponse } from "next/server";
import { AuthGuardError, requireAuthenticatedUser } from "@/lib/auth/guards";
import { getMongoDb } from "@/lib/mongodb";

export async function GET(request: NextRequest) {
  try {
    await requireAuthenticatedUser(request);

    const { searchParams } = new URL(request.url);
    const eventSlug = searchParams.get("eventSlug");
    const taskStatus = searchParams.get("status");

    const filter: Record<string, unknown> = {};
    const eventSlugValue = eventSlug?.trim();

    if (eventSlugValue) {
      filter.eventSlug = eventSlugValue;
    }

    if (taskStatus) {
      filter.status = taskStatus;
    }

  console.info("[Tasks API] Query params", { eventSlug: eventSlugValue, taskStatus });
    console.info("[Tasks API] Filter", filter);

    const db = await getMongoDb();
    const tasksCollection = db.collection("event_tasks");

  const tasks = await tasksCollection.find(filter).sort({ createdAt: -1 }).toArray();

  console.info("[Tasks API] Returned", tasks.length, "tasks");

    return NextResponse.json(tasks, { status: 200 });
  } catch (error) {
    if (error instanceof AuthGuardError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("Error fetching tasks:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
