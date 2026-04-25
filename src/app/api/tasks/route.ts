import { NextRequest, NextResponse } from "next/server";
import { AuthGuardError, requireAuthenticatedUser } from "@/lib/auth/guards";
import { getMongoDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(request: NextRequest) {
  try {
    await requireAuthenticatedUser(request);

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");
    const taskStatus = searchParams.get("status");

    const filter: Record<string, unknown> = {};
    const eventIdValue = eventId?.trim();

    if (eventIdValue) {
      if (!ObjectId.isValid(eventIdValue)) {
        return NextResponse.json({ error: "Invalid eventId." }, { status: 400 });
      }
      filter.eventId = new ObjectId(eventIdValue);
    }

    if (taskStatus) {
      filter.status = taskStatus;
    }

    console.info("[Tasks API] Query params", { eventId: eventIdValue, taskStatus });
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

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuthenticatedUser(request);
    const body = await request.json();

    const eventId = typeof body?.eventId === "string" ? body.eventId.trim() : "";

    if (!eventId || !ObjectId.isValid(eventId)) {
      return NextResponse.json({ error: "Invalid eventId." }, { status: 400 });
    }

    const db = await getMongoDb();
    const tasksCollection = db.collection("event_tasks");

    const newTask = {
      taskId: body?.taskId || `TSK-${Date.now()}`,
      eventId: new ObjectId(eventId),
      title: body?.title || "Untitled Task",
      description: body?.description || "",
      status: body?.status || "TO DO",
      priority: body?.priority || "MEDIUM",
      due: {
        date: body?.dueDate || "",
        time: body?.dueTime || "",
      },
      assignee: {
        name: body?.assignee || "Unassigned",
      },
      vendor: {
        name: body?.vendor || "None",
      },
      createdAt: new Date(),
      createdBy: user.uid,
    };

    const result = await tasksCollection.insertOne(newTask);

    return NextResponse.json({ ...newTask, _id: result.insertedId }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthGuardError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("Error creating task:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
