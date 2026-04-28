import { NextRequest, NextResponse } from "next/server";
import { AuthGuardError, requireAuthenticatedUser } from "@/lib/auth/guards";
import { getMongoDb } from "@/lib/mongodb";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { ObjectId } from "mongodb";

const PESO_SYMBOL = "\u20B1";

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;
  return `${value >= 10 || exponent === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[exponent]}`;
}

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
      createdAt: exp.createdAt,
      attachmentUrl: exp.attachmentUrl || null,
      attachmentName: exp.attachmentName || null,
      attachmentType: exp.attachmentType || null
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
    
    const formData = await request.formData();
    const vendor = String(formData.get("vendor") || "").trim();
    const description = String(formData.get("description") || "").trim();
    const amount = Number(formData.get("amount"));
    const dueDate = String(formData.get("dueDate") || "").trim();
    const status = String(formData.get("status") || "Pending").trim() || "Pending";
    const paymentType = String(formData.get("paymentType") || "Payment").trim() || "Payment";
    const attachment = formData.get("attachment");
    
    if (!vendor || !amount || !dueDate) {
      return NextResponse.json(
        { error: "Missing required fields: vendor, amount, dueDate" },
        { status: 400 }
      );
    }
    
    let attachmentUrl: string | null = null;
    let attachmentName: string | null = null;
    let attachmentType: string | null = null;

    if (attachment instanceof File && attachment.size > 0) {
      const supabase = getSupabaseServerClient();
      const extension = attachment.name.split(".").pop()?.toLowerCase() || "bin";
      const sanitizedBaseName = attachment.name
        .replace(/\.[^/.]+$/, "")
        .replace(/[^a-zA-Z0-9._-]/g, "_");
      const storagePath = `expenses/${eventId}/${Date.now()}_${sanitizedBaseName}.${extension}`;
      const buffer = Buffer.from(await attachment.arrayBuffer());

      const { error: uploadError } = await supabase.storage.from("user").upload(storagePath, buffer, {
        contentType: attachment.type || "application/octet-stream",
        upsert: true,
      });

      if (uploadError) {
        return NextResponse.json({ error: `Failed to upload attachment: ${uploadError.message}` }, { status: 500 });
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("user").getPublicUrl(storagePath);

      attachmentUrl = publicUrl;
      attachmentName = attachment.name;
      attachmentType = attachment.type || null;
    }

    const expensesCollection = db.collection("expenses");
    const newExpense = {
      eventId: eventObjectId,
      vendor,
      description,
      amount,
      dueDate: new Date(dueDate),
      status,
      paymentType,
      attachmentUrl,
      attachmentName,
      attachmentType,
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
      { $set: { "budget.utilized": currentUtilized + amount } }
    );

    const documentsCollection = db.collection("documents");
    const eventTitle = event?.title || "Untitled Event";
    const receiptName = attachmentName || `${description || vendor} Expense Receipt`;

    await documentsCollection.insertOne({
      name: receiptName,
      type: attachmentName?.split(".").pop()?.toUpperCase() || "EXPENSE",
      size: attachment instanceof File && attachment.size > 0 ? formatBytes(attachment.size) : `${PESO_SYMBOL}${amount.toLocaleString()}`,
      eventId: eventObjectId,
      event: eventTitle,
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      status,
      category: "expenses",
      icon: attachmentType?.startsWith("image/") ? "image" : "file",
      fileUrl: attachmentUrl,
      attachmentUrl,
      attachmentName,
      attachmentType,
      sourceKind: "expense",
      sourceExpenseId: result.insertedId,
      createdBy: user.uid,
      createdAt: new Date()
    });
    
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
