import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedUser, AuthGuardError } from "@/lib/auth/guards";
import { getMongoDb } from "@/lib/mongodb";
import { writeAuditLog } from "@/lib/audit";

export async function GET(request: NextRequest) {
  try {
    await requireAuthenticatedUser(request);
    const db = await getMongoDb();
    const vendorsCollection = db.collection("vendors");
    
    const vendors = await vendorsCollection.find({}).sort({ name: 1 }).toArray();
    
    return NextResponse.json(vendors, { status: 200 });
  } catch (error) {
    if (error instanceof AuthGuardError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("Error fetching vendors:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuthenticatedUser(request);
    const body = await request.json();
    
    const { name, category, contact, email, phone, status } = body;
    
    if (!name || !category || !email) {
      return NextResponse.json({ error: "Name, category, and email are required." }, { status: 400 });
    }

    const db = await getMongoDb();
    const vendorsCollection = db.collection("vendors");

    const newVendor = {
      name,
      category,
      contact,
      email,
      phone,
      status: status || 'Active',
      rating: 0,
      events: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await vendorsCollection.insertOne(newVendor);

    // Audit Log
    await writeAuditLog({
      request,
      category: "VENDOR_MANAGEMENT",
      action: "VENDOR_CREATED",
      message: `New vendor created: ${name} (${category})`,
      actor: {
        uid: user.uid,
        email: user.email,
        role: user.role
      },
      target: {
        type: "vendor",
        uid: result.insertedId.toString()
      },
      details: {
        vendorId: result.insertedId.toString(),
        vendorName: name,
        category
      }
    });

    return NextResponse.json({ success: true, vendorId: result.insertedId }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthGuardError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("Error creating vendor:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
