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
    
    const invoices = await db.collection("invoices")
      .find({ eventId: eventObjectId })
      .sort({ issueDate: -1 })
      .toArray();
    
    const formattedInvoices = invoices.map(inv => ({
      id: inv._id.toString(),
      invoiceNumber: inv.invoiceNumber,
      clientName: inv.clientName,
      amount: inv.amount,
      issueDate: inv.issueDate,
      dueDate: inv.dueDate,
      status: inv.status,
      description: inv.description,
      createdAt: inv.createdAt
    }));
    
    return NextResponse.json(formattedInvoices);
  } catch (error) {
    if (error instanceof AuthGuardError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("Fetch invoices error:", error);
    return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 });
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
    const { invoiceNumber, clientName, amount, issueDate, dueDate, status = "Pending", description = "" } = body;
    
    if (!invoiceNumber || !clientName || !amount || !issueDate || !dueDate) {
      return NextResponse.json(
        { error: "Missing required fields: invoiceNumber, clientName, amount, issueDate, dueDate" },
        { status: 400 }
      );
    }
    
    const invoicesCollection = db.collection("invoices");
    const newInvoice = {
      eventId: eventObjectId,
      invoiceNumber,
      clientName,
      amount: Number(amount),
      issueDate: new Date(issueDate),
      dueDate: new Date(dueDate),
      status,
      description,
      createdAt: new Date(),
      createdBy: user.uid
    };
    
    const result = await invoicesCollection.insertOne(newInvoice);
    
    // TODO: Add audit log for invoice creation
    
    return NextResponse.json(
      {
        id: result.insertedId.toString(),
        ...newInvoice
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof AuthGuardError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("Create invoice error:", error);
    return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 });
  }
}
