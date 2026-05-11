import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { AuthGuardError, requireRole } from "@/lib/auth/guards";
import { getMongoDb } from "@/lib/mongodb";

type RawTask = {
  _id: ObjectId;
  eventId?: ObjectId;
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  due?: {
    date?: string;
    time?: string;
  };
  assignee?: {
    name?: string;
  };
  assignees?: Array<{
    name?: string;
  }>;
};

const normalizeTaskStatus = (value?: string) => {
  const normalized = String(value || "").toUpperCase().replace(/[_-]/g, " ").trim();
  if (normalized === "DONE" || normalized === "COMPLETE" || normalized === "COMPLETED") return "COMPLETED";
  if (normalized === "TODO") return "TO DO";
  if (normalized === "INPROGRESS") return "IN PROGRESS";
  return normalized || "TO DO";
};

const matchesAssignee = (task: RawTask, assigneeName: string) => {
  const normalized = assigneeName.trim().toLowerCase();
  if (!normalized) return false;

  const assigneeNames = [
    ...(Array.isArray(task.assignees) ? task.assignees.map((entry) => entry?.name || "") : []),
    task.assignee?.name || "",
  ]
    .map((name) => name.trim().toLowerCase())
    .filter(Boolean);

  return assigneeNames.includes(normalized);
};

const sortTasksByDue = (tasks: any[]) =>
  tasks.sort((first, second) => {
    const firstKey = `${first?.due?.date || ""} ${first?.due?.time || ""}`;
    const secondKey = `${second?.due?.date || ""} ${second?.due?.time || ""}`;
    return firstKey.localeCompare(secondKey);
  });

export async function GET(request: NextRequest) {
  try {
    const user = await requireRole(request, ["coordinator", "staff", "admin"]);
    const { searchParams } = new URL(request.url);
    const requestedEventId = searchParams.get("eventId")?.trim() || "";

    if (requestedEventId && !ObjectId.isValid(requestedEventId)) {
      return NextResponse.json({ error: "Invalid eventId." }, { status: 400 });
    }

    const db = await getMongoDb();
    const usersCollection = db.collection<{ firebaseUid?: string; email?: string; name?: string; firstName?: string; lastName?: string }>("users");
    const profile = await usersCollection.findOne({
      $or: [{ firebaseUid: user.uid }, ...(user.email ? [{ email: user.email }] : [])],
    });

    const assigneeName =
      profile?.name?.trim() ||
      `${profile?.firstName || ""} ${profile?.lastName || ""}`.trim() ||
      user.token.name?.trim() ||
      "";

    console.log("[TASK-HUB] Coordinator name:", assigneeName);
    console.log("[TASK-HUB] User profile:", { name: profile?.name, firstName: profile?.firstName, lastName: profile?.lastName });

    if (!assigneeName) {
      return NextResponse.json(
        {
          eventTasks: [],
          productionTasks: [],
          combinedTasks: [],
          counts: {
            eventTotal: 0,
            eventCompleted: 0,
            productionTotal: 0,
            productionCompleted: 0,
            total: 0,
            completed: 0,
          },
        },
        { status: 200 }
      );
    }

    const eventFilter = requestedEventId ? { eventId: new ObjectId(requestedEventId) } : {};
    const [rawEventTasks, rawProductionTasks] = await Promise.all([
      db.collection<RawTask>("event_tasks").find(eventFilter).toArray(),
      db.collection<RawTask>("prod_tasks").find(eventFilter).toArray(),
    ]);

    const assignedEventTasks = rawEventTasks.filter((task) => matchesAssignee(task, assigneeName));
    const assignedProductionTasks = rawProductionTasks.filter((task) => matchesAssignee(task, assigneeName));

    console.log("[TASK-HUB] Total event tasks fetched:", rawEventTasks.length);
    console.log("[TASK-HUB] Total production tasks fetched:", rawProductionTasks.length);
    console.log("[TASK-HUB] Assigned event tasks:", assignedEventTasks.length);
    console.log("[TASK-HUB] Assigned production tasks:", assignedProductionTasks.length);
    console.log("[TASK-HUB] Sample production task assignees:", rawProductionTasks[0]?.assignees);

    const eventIds = Array.from(
      new Set(
        [...assignedEventTasks, ...assignedProductionTasks]
          .map((task) => task.eventId)
          .filter((value): value is ObjectId => Boolean(value))
          .map((value) => value.toString())
      )
    ).map((value) => new ObjectId(value));

    const eventDocs = await db
      .collection("events")
      .find({ _id: { $in: eventIds } }, { projection: { title: 1, type: 1, location: 1 } })
      .toArray();

    const eventLookup = new Map(
      eventDocs.map((eventDoc: any) => [
        eventDoc._id.toString(),
        {
          eventTitle: eventDoc.title || "Unknown Event",
          eventType: eventDoc.type || "",
          eventLocation: eventDoc.location || "",
        },
      ])
    );

    const mapTask = (task: RawTask, taskType: "event" | "production") => {
      const eventMeta = task.eventId ? eventLookup.get(task.eventId.toString()) : null;
      return {
        _id: task._id.toString(),
        eventId: task.eventId?.toString() || "",
        eventTitle: eventMeta?.eventTitle || "Unknown Event",
        eventType: eventMeta?.eventType || "",
        eventLocation: eventMeta?.eventLocation || "",
        title: task.title || "Untitled Task",
        description: task.description || "",
        status: task.status || "TO DO",
        normalizedStatus: normalizeTaskStatus(task.status),
        priority: task.priority || "MEDIUM",
        due: {
          date: task.due?.date || "",
          time: task.due?.time || "",
        },
        assignee: task.assignee,
        assignees: task.assignees || [],
        taskType,
        taskTypeLabel: taskType === "production" ? "Production" : "Directive",
      };
    };

    const eventTasks = sortTasksByDue(assignedEventTasks.map((task) => mapTask(task, "event")));
    const productionTasks = sortTasksByDue(assignedProductionTasks.map((task) => mapTask(task, "production")));
    const combinedTasks = sortTasksByDue([...eventTasks, ...productionTasks]);

    const eventCompleted = eventTasks.filter((task) => task.normalizedStatus === "COMPLETED").length;
    const productionCompleted = productionTasks.filter((task) => task.normalizedStatus === "COMPLETED").length;

    return NextResponse.json(
      {
        eventTasks,
        productionTasks,
        combinedTasks,
        counts: {
          eventTotal: eventTasks.length,
          eventCompleted,
          productionTotal: productionTasks.length,
          productionCompleted,
          total: combinedTasks.length,
          completed: eventCompleted + productionCompleted,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof AuthGuardError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    console.error("COORDINATOR TASK HUB GET ERROR:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
