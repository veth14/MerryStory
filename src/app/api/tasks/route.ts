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

    const serializedTasks = tasks.map((task) => ({
      ...task,
      _id: task._id?.toString?.() || task._id,
      eventId: task.eventId?.toString?.() || task.eventId,
    }));

    console.info("[Tasks API] Returned", serializedTasks.length, "tasks");

    return NextResponse.json(serializedTasks, { status: 200 });
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

export async function PATCH(request: NextRequest) {
  try {
    await requireAuthenticatedUser(request);
    const body = await request.json();

    const taskObjectId = typeof body?.taskObjectId === "string" ? body.taskObjectId.trim() : "";
    const taskId = typeof body?.taskId === "string" ? body.taskId.trim() : "";
    const status = typeof body?.status === "string" ? body.status.trim() : "";
    const assignee = typeof body?.assignee === "string" ? body.assignee.trim() : "";
    const vendor = typeof body?.vendor === "string" ? body.vendor.trim() : "";

    if (!taskObjectId && !taskId) {
      return NextResponse.json({ error: "Missing taskId." }, { status: 400 });
    }

    if (!status) {
      if (!assignee && !vendor) {
        return NextResponse.json({ error: "No updates provided." }, { status: 400 });
      }
    }

    const updates: Record<string, unknown> = { updatedAt: new Date() };

    if (status) {
      updates.status = status;
    }

    if (assignee) {
      updates.assignee = { name: assignee };
    }

    if (vendor) {
      updates.vendor = { name: vendor };
    }

    const db = await getMongoDb();
    const tasksCollection = db.collection("event_tasks");

  let result: any = null;

    if (taskObjectId && ObjectId.isValid(taskObjectId)) {
      result = await tasksCollection.findOneAndUpdate(
        { _id: new ObjectId(taskObjectId) },
        { $set: updates },
        { returnDocument: "after" }
      );
    }

    const getUpdatedDoc = (updateResult: any) => {
      if (!updateResult) return null;
      if (typeof updateResult === "object" && "value" in updateResult) {
        return updateResult.value;
      }
      return updateResult;
    };

    if (!getUpdatedDoc(result) && taskId) {
      result = await tasksCollection.findOneAndUpdate(
        { taskId },
        { $set: updates },
        { returnDocument: "after" }
      );
    }

    const updatedTask = getUpdatedDoc(result);

    if (!updatedTask) {
      return NextResponse.json({ error: "Task not found." }, { status: 404 });
    }

    return NextResponse.json(
      {
        ...updatedTask,
        _id: updatedTask._id?.toString?.() || updatedTask._id,
        eventId: updatedTask.eventId?.toString?.() || updatedTask.eventId,
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof AuthGuardError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("Error updating task:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
