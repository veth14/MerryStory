import { NextRequest, NextResponse } from "next/server";
import { AuthGuardError, requireAuthenticatedUser } from "@/lib/auth/guards";
import { getMongoDb } from "@/lib/mongodb";
import { buildSimplePdf } from "@/lib/simplePdf";
import { ObjectId } from "mongodb";

type RouteContext = {
  params: Promise<{ eventId: string; invoiceId: string }>;
};

function formatReadableDate(value: unknown) {
  if (!value) return "Not recorded";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    await requireAuthenticatedUser(request);
    const { eventId, invoiceId } = await context.params;

    if (!ObjectId.isValid(eventId) || !ObjectId.isValid(invoiceId)) {
      return NextResponse.json({ error: "Invalid invoice route." }, { status: 400 });
    }

    const db = await getMongoDb();
    const invoice = await db.collection("invoices").findOne({
      _id: new ObjectId(invoiceId),
      eventId: new ObjectId(eventId),
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
    }

    const event = await db.collection("events").findOne({ _id: new ObjectId(eventId) });
    const pdf = buildSimplePdf(invoice.invoiceNumber || "Invoice", [
      `Invoice Number: ${invoice.invoiceNumber || "N/A"}`,
      `Client: ${invoice.clientName || "Unknown Client"}`,
      `Event: ${event?.title || "Untitled Event"}`,
      `Amount: \u20B1${Number(invoice.amount || 0).toLocaleString()}`,
      `Issue Date: ${formatReadableDate(invoice.issueDate)}`,
      `Due Date: ${formatReadableDate(invoice.dueDate)}`,
      `Status: ${invoice.status || "Pending"}`,
      `Description: ${invoice.description || "No description provided"}`,
    ]);

    const isDownload = new URL(request.url).searchParams.get("download") === "1";
    const safeName = String(invoice.invoiceNumber || "invoice").replace(/[^a-z0-9._-]+/gi, "_");

    return new NextResponse(Buffer.from(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${isDownload ? "attachment" : "inline"}; filename="${safeName}.pdf"`,
      },
    });
  } catch (error) {
    if (error instanceof AuthGuardError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
