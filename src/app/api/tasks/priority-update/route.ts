import { NextRequest, NextResponse } from "next/server";
import { AuthGuardError, requireAuthenticatedUser } from "@/lib/auth/guards";
import { getMongoDb } from "@/lib/mongodb";
import {
  getComputedPriorityForTask,
  shouldUpgradePriority,
} from "@/app/api/tasks/priority-update";

export async function POST(request: NextRequest) {
  try {
    await requireAuthenticatedUser(request);

    const { searchParams } = new URL(request.url);
    const assignee = searchParams.get("assignee")?.trim();

    const filter: Record<string, unknown> = {};

    if (assignee) {
      filter.$or = [{ "assignee.name": assignee }, { "assignees.name": assignee }];
    }

    const db = await getMongoDb();
    const tasksCollection = db.collection("event_tasks");
    const now = new Date();

    const tasks = await tasksCollection.find(filter).toArray();
    const updates = tasks
      .map((task) => {
        const nextPriority = getComputedPriorityForTask(task, now);
        if (!nextPriority) return null;
        if (!shouldUpgradePriority(typeof task.priority === "string" ? task.priority : null, nextPriority)) {
          return null;
        }

        return {
          updateOne: {
            filter: { _id: task._id },
            update: {
              $set: {
                priority: nextPriority,
                updatedAt: now,
              },
            },
          },
        };
      })
      .filter(Boolean);

    if (updates.length > 0) {
      await tasksCollection.bulkWrite(updates);
    }

    return NextResponse.json(
      {
        scanned: tasks.length,
        updated: updates.length,
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof AuthGuardError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    console.error("Priority update API error:", error);
    return NextResponse.json({ error: "Failed to update task priorities." }, { status: 500 });
  }
}
