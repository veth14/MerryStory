import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth/guards";
import { getMongoDb } from "@/lib/mongodb";

export async function GET(request: NextRequest) {
  try {
    await requireAuthenticatedUser(request);
    
    const db = await getMongoDb();
    
    const inquiries = await db.collection("inquiries")
      .find({ isArchived: { $ne: true } })
      .sort({ submitted: -1 })
      .limit(5)
      .toArray();

    const contractNotifications = await db.collection("notifications")
      .find({ isArchived: { $ne: true } })
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();

    const inquiryNotifications = inquiries.map(inq => ({
      id: inq._id.toString(),
      type: inq.type === 'consultation' ? 'consultation' : 'inquiry',
      title: inq.type === 'consultation' ? `Consultation request from ${inq.client}` : `New inquiry from ${inq.client}`,
      time: inq.submitted,
      isRead: false,
      event: inq.eventType
    }));

    const contractItems = contractNotifications.map((item) => ({
      id: item._id.toString(),
      type: String(item.type || "contract"),
      title: String(item.title || "Contract update received"),
      time: item.createdAt || item.time || new Date(),
      isRead: Boolean(item.isRead),
      event: item.eventName || "",
      href:
        item.type === "contract-revision"
          ? `/admin/documents?tab=contracts&contractId=${item.contractId?.toString?.() || ""}&contractView=edit`
          : item.type === "contract-signature"
            ? `/admin/documents?tab=contracts&contractId=${item.contractId?.toString?.() || ""}&contractView=preview`
            : "/admin/documents?tab=contracts",
    }));

    const notifications = [
      ...contractItems,
      ...inquiryNotifications.map((notification) => ({
        ...notification,
        href: "/admin/inquiries",
      })),
    ]
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 10);

    return NextResponse.json({ notifications }, { status: 200 });
  } catch (error) {
    console.error("Notifications API Error:", error);
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}
