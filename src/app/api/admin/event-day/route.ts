import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { AuthGuardError, requireRole } from "@/lib/auth/guards";
import { writeAuditLog } from "@/lib/audit";
import { getMongoDb } from "@/lib/mongodb";

const normalizeAssigneeNames = (input: unknown): string[] => {
  if (Array.isArray(input)) {
    return Array.from(
      new Set(
        input
          .map((value) => (typeof value === "string" ? value.trim() : ""))
          .filter(Boolean)
      )
    );
  }

  if (typeof input === "string" && input.trim()) {
    return [input.trim()];
  }

  return [];
};

const isValidDateValue = (value: unknown) =>
  typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);

const isValidTimeValue = (value: unknown) =>
  typeof value === "string" && /^\d{2}:\d{2}$/.test(value);

const validateDueDateTime = (dueDate: unknown, dueTime: unknown) => {
  if (!isValidDateValue(dueDate) || !isValidTimeValue(dueTime)) {
    throw new Error("A valid production date and due time are required.");
  }

  const dueAt = new Date(`${dueDate}T${dueTime}:00`);
  if (!Number.isNaN(dueAt.getTime()) && dueAt.getTime() < Date.now()) {
    throw new Error("Past due date and time cannot be selected.");
  }
};

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, ["admin"]);

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId")?.trim() || "";

    if (!eventId || !ObjectId.isValid(eventId)) {
      return NextResponse.json({ error: "Invalid eventId." }, { status: 400 });
    }

    const db = await getMongoDb();
    const prodTasksCollection = db.collection("prod_tasks");

    const tasks = await prodTasksCollection
      .find({ eventId: new ObjectId(eventId) })
      .sort({ "due.date": 1, "due.time": 1, createdAt: 1 })
      .toArray();

    return NextResponse.json(
      tasks.map((task) => ({
        ...task,
        _id: task._id?.toString?.() || task._id,
        eventId: task.eventId?.toString?.() || task.eventId,
      })),
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof AuthGuardError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    console.error("Error fetching production tasks:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(request, ["admin"]);
    const body = await request.json();

    const eventId = typeof body?.eventId === "string" ? body.eventId.trim() : "";
    const dueDate = typeof body?.dueDate === "string" ? body.dueDate.trim() : "";
    const dueTime = typeof body?.dueTime === "string" ? body.dueTime.trim() : "";

    if (!eventId || !ObjectId.isValid(eventId)) {
      return NextResponse.json({ error: "Invalid eventId." }, { status: 400 });
    }

    validateDueDateTime(dueDate, dueTime);

    const assigneeNames = normalizeAssigneeNames(body?.assignees ?? body?.assignee);
    const primaryAssignee = assigneeNames[0] || "Unassigned";

    const newTask = {
      taskId: body?.taskId || `PROD-${Date.now()}`,
      eventId: new ObjectId(eventId),
      title: typeof body?.title === "string" && body.title.trim() ? body.title.trim() : "Untitled Schedule",
      description: typeof body?.description === "string" ? body.description.trim() : "",
      status: typeof body?.status === "string" && body.status.trim() ? body.status.trim() : "TO DO",
      priority: typeof body?.priority === "string" && body.priority.trim() ? body.priority.trim() : "MEDIUM",
      due: {
        date: dueDate,
        time: dueTime,
      },
      assignee: {
        name: primaryAssignee,
      },
      assignees: assigneeNames.map((name) => ({ name })),
      vendor: {
        name: typeof body?.vendor === "string" && body.vendor.trim() ? body.vendor.trim() : "None",
      },
      createdAt: new Date(),
      createdBy: user.uid,
      updatedAt: new Date(),
    };

    const db = await getMongoDb();
    const prodTasksCollection = db.collection("prod_tasks");
    const result = await prodTasksCollection.insertOne(newTask);

    await writeAuditLog({
      request,
      category: "TASK_MANAGEMENT",
      action: "TASK_ASSIGNED",
      message: `Production schedule "${newTask.title}" created`,
      actor: {
        uid: user.uid,
        email: user.email,
        role: (user as any).role,
      },
      target: {
        type: "resource",
        uid: result.insertedId.toString(),
      },
      details: {
        taskTitle: newTask.title,
        assignee: assigneeNames.length ? assigneeNames.join(", ") : "Unassigned",
        eventId,
        collection: "prod_tasks",
      },
    });

    return NextResponse.json({ ...newTask, _id: result.insertedId.toString(), eventId }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthGuardError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    if (
      error instanceof Error &&
      (error.message === "Past due date and time cannot be selected." ||
        error.message === "A valid production date and due time are required.")
    ) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("Error creating production task:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireRole(request, ["admin"]);
    const body = await request.json();

    const taskObjectId = typeof body?.taskObjectId === "string" ? body.taskObjectId.trim() : "";
    const taskId = typeof body?.taskId === "string" ? body.taskId.trim() : "";

    if (!taskObjectId && !taskId) {
      return NextResponse.json({ error: "Missing taskId." }, { status: 400 });
    }

    const updates: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (typeof body?.title === "string" && body.title.trim()) {
      updates.title = body.title.trim();
    }

    if (typeof body?.description === "string") {
      updates.description = body.description.trim();
    }

    if (typeof body?.status === "string" && body.status.trim()) {
      updates.status = body.status.trim();
    }

    if (typeof body?.priority === "string" && body.priority.trim()) {
      updates.priority = body.priority.trim();
    }

    if (typeof body?.vendor === "string") {
      updates.vendor = { name: body.vendor.trim() || "None" };
    }

    if (Array.isArray(body?.assignees)) {
      const assigneeNames = normalizeAssigneeNames(body.assignees);
      updates.assignees = assigneeNames.map((name) => ({ name }));
      updates.assignee = { name: assigneeNames[0] || "Unassigned" };
    }

    const hasDueDate = typeof body?.dueDate === "string";
    const hasDueTime = typeof body?.dueTime === "string";

    if (hasDueDate || hasDueTime) {
      const dueDate = hasDueDate ? body.dueDate?.trim?.() : undefined;
      const dueTime = hasDueTime ? body.dueTime?.trim?.() : undefined;

      if (!dueDate || !dueTime) {
        return NextResponse.json({ error: "A valid production date and due time are required." }, { status: 400 });
      }

      validateDueDateTime(dueDate, dueTime);
      updates.due = { date: dueDate, time: dueTime };
    }

    if (Object.keys(updates).length === 1) {
      return NextResponse.json({ error: "No updates provided." }, { status: 400 });
    }

    const db = await getMongoDb();
    const prodTasksCollection = db.collection("prod_tasks");

    const filter =
      taskObjectId && ObjectId.isValid(taskObjectId)
        ? { _id: new ObjectId(taskObjectId) }
        : { taskId };

    const result = await prodTasksCollection.findOneAndUpdate(
      filter,
      { $set: updates },
      { returnDocument: "after" }
    );

    const updatedTask = result && typeof result === "object" && "value" in result ? result.value : result;

    if (!updatedTask) {
      return NextResponse.json({ error: "Production task not found." }, { status: 404 });
    }

    await writeAuditLog({
      request,
      category: "TASK_MANAGEMENT",
      action: "TASK_STATUS_UPDATED",
      message: `Production schedule "${updatedTask.title}" updated`,
      actor: {
        uid: user.uid,
        email: user.email,
        role: (user as any).role,
      },
      target: {
        type: "resource",
        uid: updatedTask._id.toString(),
      },
      details: {
        eventId: updatedTask.eventId?.toString?.() || "",
        collection: "prod_tasks",
      },
    });

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

    if (
      error instanceof Error &&
      (error.message === "Past due date and time cannot be selected." ||
        error.message === "A valid production date and due time are required.")
    ) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("Error updating production task:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
