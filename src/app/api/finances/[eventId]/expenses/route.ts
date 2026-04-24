import { NextRequest, NextResponse } from "next/server";
import { AuthGuardError, requireAuthenticatedUser } from "@/lib/auth/guards";
import { getMongoDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const user = await requireAuthenticatedUser(request);
    const db = await getMongoDb();
    
    const { eventId } = await params;
    let eventObjectId: ObjectId;
    try {
      eventObjectId = new ObjectId(eventId);
    } catch {
      return NextResponse.json({ error: "Invalid event ID" }, { status: 400 });
    }
    
    const expenses = await db.collection("expenses")
      .find({ eventId: eventObjectId })
      .sort({ createdAt: -1 })
      .toArray();
    
    const formattedExpenses = expenses.map(exp => ({
      id: exp._id.toString(),
      vendor: exp.vendor,
      description: exp.description,
      amount: exp.amount,
      dueDate: exp.dueDate,
      status: exp.status,
      paymentType: exp.paymentType,
      createdAt: exp.createdAt
    }));
    
    return NextResponse.json(formattedExpenses);
  } catch (error) {
    if (error instanceof AuthGuardError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("Fetch expenses error:", error);
    return NextResponse.json({ error: "Failed to fetch expenses" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const user = await requireAuthenticatedUser(request);
    const db = await getMongoDb();
    
    const { eventId } = await params;
    let eventObjectId: ObjectId;
    try {
      eventObjectId = new ObjectId(eventId);
    } catch {
      return NextResponse.json({ error: "Invalid event ID" }, { status: 400 });
    }
    
    const body = await request.json();
    const { vendor, description, amount, dueDate, status = "Pending", paymentType = "Payment" } = body;
    
    if (!vendor || !amount || !dueDate) {
      return NextResponse.json(
        { error: "Missing required fields: vendor, amount, dueDate" },
        { status: 400 }
      );
    }
    
    const expensesCollection = db.collection("expenses");
    const newExpense = {
      eventId: eventObjectId,
      vendor,
      description,
      amount: Number(amount),
      dueDate: new Date(dueDate),
      status,
      paymentType,
      createdAt: new Date(),
      createdBy: user.uid
    };
    
    const result = await expensesCollection.insertOne(newExpense);
    
    // Update event's utilized budget
    const eventsCollection = db.collection("events");
    const event = await eventsCollection.findOne({ _id: eventObjectId });
    const currentUtilized = event?.budget?.utilized || 0;
    
    await eventsCollection.updateOne(
      { _id: eventObjectId },
      { $set: { "budget.utilized": currentUtilized + Number(amount) } }
    );
    
    // TODO: Add audit log for expense creation
    
    return NextResponse.json(
      {
        id: result.insertedId.toString(),
        ...newExpense
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof AuthGuardError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("Create expense error:", error);
    return NextResponse.json({ error: "Failed to create expense" }, { status: 500 });
  }
}
