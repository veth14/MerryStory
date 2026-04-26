import { NextRequest, NextResponse } from "next/server";
import { AuthGuardError, requireAuthenticatedUser } from "@/lib/auth/guards";
import { getMongoDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuthenticatedUser(request);
    
    const db = await getMongoDb();
    const eventsCollection = db.collection("events");
    
    // Get all events with basic financial summary
    const events = await eventsCollection
      .find({})
      .project({
        _id: 1,
        title: 1,
        date: 1,
        location: 1,
        status: 1,
        budget: 1,
        client: 1
      })
      .toArray();
    
    const eventsWithFinancials = events.map(event => ({
      id: event._id.toString(),
      name: event.title,
      date: event.date,
      location: event.location,
      status: event.status,
      budget: event.budget?.total || 0,
      expenses: event.budget?.utilized || 0,
      utilization: event.budget?.total ? Math.round((event.budget.utilized / event.budget.total) * 100) : 0,
      remaining: (event.budget?.total || 0) - (event.budget?.utilized || 0)
    }));
    
    return NextResponse.json(eventsWithFinancials);
  } catch (error) {
    if (error instanceof AuthGuardError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("Finance list error:", error);
    return NextResponse.json({ error: "Failed to fetch finances" }, { status: 500 });
  }
}
