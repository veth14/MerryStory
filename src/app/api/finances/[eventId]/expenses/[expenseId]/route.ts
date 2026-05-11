import { NextRequest, NextResponse } from "next/server";
import { AuthGuardError, requireAuthenticatedUser } from "@/lib/auth/guards";
import { getMongoDb } from "@/lib/mongodb";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { ObjectId } from "mongodb";

const ALLOWED_PAYMENT_STATUSES = new Set(["pending", "half-paid", "paid"]);
const ALLOWED_PAYMENT_TYPES = new Set(["catering", "equipment", "decoration", "venue", "other"]);

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;
  return `${value >= 10 || exponent === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[exponent]}`;
}

async function uploadAttachment(file: File, eventId: string) {
  const supabase = getSupabaseServerClient();
  const extension = file.name.split(".").pop()?.toLowerCase() || "bin";
  const sanitizedBaseName = file.name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `expenses/${eventId}/${Date.now()}_${sanitizedBaseName}.${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage.from("user").upload(storagePath, buffer, {
    contentType: file.type || "application/octet-stream",
    upsert: true,
  });

  if (uploadError) {
    throw new Error(`Failed to upload attachment: ${uploadError.message}`);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("user").getPublicUrl(storagePath);

  return {
    attachmentUrl: publicUrl,
    attachmentName: file.name,
    attachmentType: file.type || null,
    documentSize: formatBytes(file.size),
    icon: file.type?.startsWith("image/") ? "image" : "file",
  };
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string; expenseId: string }> }
) {
  try {
    const user = await requireAuthenticatedUser(request);
    const db = await getMongoDb();

    const { eventId, expenseId } = await params;
    if (!ObjectId.isValid(eventId) || !ObjectId.isValid(expenseId)) {
      return NextResponse.json({ error: "Invalid event or expense ID" }, { status: 400 });
    }

    const formData = await request.formData();
    const vendor = String(formData.get("vendor") || "").trim();
    const description = String(formData.get("description") || "").trim();
    const amount = Number(formData.get("amount"));
    const dueDate = String(formData.get("dueDate") || "").trim();
    const statusInput = String(formData.get("status") || "half-paid").trim().toLowerCase();
    const paymentTypeInput = String(formData.get("paymentType") || "other").trim().toLowerCase();
    const status = ALLOWED_PAYMENT_STATUSES.has(statusInput) ? statusInput : "half-paid";
    const paymentType = ALLOWED_PAYMENT_TYPES.has(paymentTypeInput) ? paymentTypeInput : "other";
    const attachment = formData.get("attachment");

    if (!vendor || !description || !dueDate || !Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { error: "Missing or invalid required fields: vendor, description, amount, dueDate" },
        { status: 400 }
      );
    }

    const parsedDueDate = new Date(dueDate);
    if (Number.isNaN(parsedDueDate.getTime())) {
      return NextResponse.json({ error: "Due date is invalid." }, { status: 400 });
    }

    const expensesCollection = db.collection("expenses");
    const existingExpense = await expensesCollection.findOne({
      _id: new ObjectId(expenseId),
      eventId: new ObjectId(eventId),
    });

    if (!existingExpense) {
      return NextResponse.json({ error: "Expense not found." }, { status: 404 });
    }

    let attachmentMeta: Record<string, unknown> = {};
    if (attachment instanceof File && attachment.size > 0) {
      attachmentMeta = await uploadAttachment(attachment, eventId);
    }

    await expensesCollection.updateOne(
      { _id: new ObjectId(expenseId) },
      {
        $set: {
          vendor,
          description,
          amount,
          dueDate: parsedDueDate,
          status,
          paymentType,
          updatedAt: new Date(),
          updatedBy: user.uid,
          ...attachmentMeta,
        },
      }
    );

    const amountDelta = amount - Number(existingExpense.amount || 0);
    await db.collection("events").updateOne(
      { _id: new ObjectId(eventId) },
      { $inc: { "budget.utilized": amountDelta } }
    );

    const nextAttachmentUrl = (attachmentMeta.attachmentUrl as string | undefined) ?? existingExpense.attachmentUrl ?? null;
    const nextAttachmentName = (attachmentMeta.attachmentName as string | undefined) ?? existingExpense.attachmentName ?? null;
    const nextAttachmentType = (attachmentMeta.attachmentType as string | undefined) ?? existingExpense.attachmentType ?? null;

    await db.collection("documents").updateMany(
      { sourceExpenseId: new ObjectId(expenseId) },
      {
        $set: {
          name: nextAttachmentName || `${description || vendor} Expense Receipt`,
          status,
          date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
          attachmentUrl: nextAttachmentUrl,
          attachmentName: nextAttachmentName,
          attachmentType: nextAttachmentType,
          fileUrl: nextAttachmentUrl,
          icon: (attachmentMeta.icon as string | undefined) ?? (nextAttachmentType?.startsWith("image/") ? "image" : "file"),
          size: (attachmentMeta.documentSize as string | undefined) ?? undefined,
          updatedAt: new Date(),
        },
      }
    );

    const updatedExpense = await expensesCollection.findOne({ _id: new ObjectId(expenseId) });
    return NextResponse.json(updatedExpense);
  } catch (error) {
    if (error instanceof AuthGuardError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("Update expense error:", error);
    return NextResponse.json({ error: "Failed to update expense" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string; expenseId: string }> }
) {
  try {
    const user = await requireAuthenticatedUser(request);
    const db = await getMongoDb();

    const { eventId, expenseId } = await params;
    if (!ObjectId.isValid(eventId) || !ObjectId.isValid(expenseId)) {
      return NextResponse.json({ error: "Invalid event or expense ID" }, { status: 400 });
    }

    const expensesCollection = db.collection("expenses");
    const expense = await expensesCollection.findOne({
      _id: new ObjectId(expenseId),
      eventId: new ObjectId(eventId),
    });

    if (!expense) {
      return NextResponse.json({ error: "Expense not found." }, { status: 404 });
    }

    // Delete the expense
    await expensesCollection.deleteOne({ _id: new ObjectId(expenseId) });

    // Update event's utilized budget by subtracting the expense amount
    await db.collection("events").updateOne(
      { _id: new ObjectId(eventId) },
      { $inc: { "budget.utilized": -(expense.amount || 0) } }
    );

    // Delete related document entries
    await db.collection("documents").deleteMany({ sourceExpenseId: new ObjectId(expenseId) });

    return NextResponse.json({ message: "Expense deleted successfully" }, { status: 200 });
  } catch (error) {
    if (error instanceof AuthGuardError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("Delete expense error:", error);
    return NextResponse.json({ error: "Failed to delete expense" }, { status: 500 });
  }
}
