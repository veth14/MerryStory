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
    
    // Fetch event details
    const event = await db.collection("events").findOne({ _id: eventObjectId });
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    
    // Fetch all expenses for this event
    const expenses = await db.collection("expenses")
      .find({ eventId: eventObjectId })
      .toArray();
    
    // Fetch all invoices for this event
    const invoices = await db.collection("invoices")
      .find({ eventId: eventObjectId })
      .toArray();
    
    // Calculate totals
    const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    const totalInvoiced = invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
    const totalReceived = invoices
      .filter(inv => inv.status === "Paid")
      .reduce((sum, inv) => sum + (inv.amount || 0), 0);
    const outstanding = totalInvoiced - totalReceived;
    
    const budgetTotal = event.budget?.total || 0;
    const utilization = budgetTotal > 0 ? Math.round((totalExpenses / budgetTotal) * 100) : 0;
    const remaining = budgetTotal - totalExpenses;
    
    // Format expenses
    const recentExpenses = expenses
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)
      .map(exp => ({
        id: exp._id.toString(),
        date: new Date(exp.createdAt).toLocaleDateString(),
        desc: exp.description || "Payment",
        subtitle: exp.vendor || "Unknown Vendor",
        category: exp.paymentType || "Payment",
        amount: `₱${exp.amount.toLocaleString()}`,
        status: exp.status || "Pending"
      }));
    
    // Format invoices
    const formattedInvoices = invoices
      .sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime())
      .map(inv => ({
        id: inv._id.toString(),
        invoiceNumber: inv.invoiceNumber,
        client: inv.clientName || "Unknown Client",
        issue: new Date(inv.issueDate).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }),
        due: new Date(inv.dueDate).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }),
        amount: `₱${inv.amount.toLocaleString()}`,
        status: inv.status || "Pending"
      }));
    
    // Find upcoming payments (expenses due soon)
    const upcomingPayments = expenses
      .filter(exp => new Date(exp.dueDate) > new Date() && exp.status !== "Cleared")
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 5)
      .map(exp => {
        const daysUntilDue = Math.ceil((new Date(exp.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        return {
          entity: exp.vendor || "Unknown",
          type: exp.paymentType || "Payment",
          amount: `₱${exp.amount.toLocaleString()}`,
          due: new Date(exp.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          days: `${daysUntilDue} days`
        };
      });
    
    // Calculate category breakdown
    const categoryBreakdown = expenses.reduce((acc: Record<string, number>, exp) => {
      const category = exp.paymentType || "Other";
      acc[category] = (acc[category] || 0) + (exp.amount || 0);
      return acc;
    }, {});
    
    const categoryBreakdownArray = Object.entries(categoryBreakdown).map(([category, amount]) => ({
      category,
      amount,
      percentage: totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0
    }));
    
    const financialOverview = {
      eventName: event.title,
      eventId: event._id.toString(),
      totalBudget: `₱${budgetTotal.toLocaleString()}`,
      totalExpenses: `₱${totalExpenses.toLocaleString()}`,
      utilization: `${utilization}%`,
      remaining: `₱${remaining.toLocaleString()}`,
      totalInvoiced: `₱${totalInvoiced.toLocaleString()}`,
      totalReceived: `₱${totalReceived.toLocaleString()}`,
      outstanding: `₱${outstanding.toLocaleString()}`,
      upcomingPayments,
      recentExpenses,
      invoices: formattedInvoices,
      categoryBreakdown: categoryBreakdownArray
    };
    
    return NextResponse.json(financialOverview);
  } catch (error) {
    if (error instanceof AuthGuardError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("Financial overview error:", error);
    return NextResponse.json({ error: "Failed to fetch financial overview" }, { status: 500 });
  }
}
