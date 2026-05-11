import { NextRequest, NextResponse } from "next/server";
import { requireRole, AuthGuardError } from "@/lib/auth/guards";
import { getMongoDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const user = await requireRole(request, ["admin"]);

    const { id } = await context.params;
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid event ID." }, { status: 400 });
    }

    const body = await request.json();
    const action = body?.action as string;

    const db = await getMongoDb();
    const eventsCollection = db.collection("events");

    const event = await eventsCollection.findOne({ _id: new ObjectId(id) });
    if (!event) {
      return NextResponse.json({ error: "Event not found." }, { status: 404 });
    }

    if (action === 'restore') {
      await eventsCollection.updateOne({ _id: event._id }, { $set: { archived: false }, $unset: { archivedAt: "" } });

      const { writeAuditLog } = await import("@/lib/audit");
      await writeAuditLog({
        request,
        category: "EVENT_MANAGEMENT",
        action: "EVENT_RESTORED",
        message: `Event restored from archive: ${event.title}`,
        actor: { uid: user.uid, email: user.email, role: user.role },
        target: { type: 'event', uid: id },
        details: { eventTitle: event.title }
      });

      return NextResponse.json({ success: true, message: 'Event restored' }, { status: 200 });
    }

    if (action === 'archive') {
      // archive an active/completed event again
      const now = new Date();
      await eventsCollection.updateOne({ _id: event._id }, { $set: { archived: true, archivedAt: now } });

      const { writeAuditLog } = await import("@/lib/audit");
      await writeAuditLog({
        request,
        category: "EVENT_MANAGEMENT",
        action: "EVENT_ARCHIVED",
        message: `Event archived by admin: ${event.title}`,
        actor: { uid: user.uid, email: user.email, role: user.role },
        target: { type: 'event', uid: id },
        details: { eventTitle: event.title }
      });

      return NextResponse.json({ success: true, message: 'Event archived' }, { status: 200 });
    }

    if (action === 'delete') {
      await eventsCollection.deleteOne({ _id: event._id });

      const { writeAuditLog } = await import("@/lib/audit");
      await writeAuditLog({
        request,
        category: "EVENT_MANAGEMENT",
        action: "EVENT_DELETED",
        message: `Event permanently deleted from archive: ${event.title}`,
        actor: { uid: user.uid, email: user.email, role: user.role },
        target: { type: 'event', uid: id },
        details: { eventTitle: event.title }
      });

      return NextResponse.json({ success: true, message: 'Event deleted' }, { status: 200 });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    if (error instanceof AuthGuardError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('Archive action error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
