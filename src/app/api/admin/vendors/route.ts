import { NextRequest, NextResponse } from "next/server";
import { requireRole, AuthGuardError } from "@/lib/auth/guards";
import { getMongoDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, ["admin"]);
    
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');

    if (!eventId || !ObjectId.isValid(eventId)) {
      return NextResponse.json({ error: "Invalid event ID" }, { status: 400 });
    }

    const db = await getMongoDb();
    const vendorsCollection = db.collection("eventVendors");

    const vendors = await vendorsCollection
      .find({ eventId: new ObjectId(eventId) })
      .toArray();

    return NextResponse.json(vendors, { status: 200 });
  } catch (error) {
    if (error instanceof AuthGuardError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("Vendor GET error:", error);
    return NextResponse.json({ error: "Failed to fetch vendors" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole(request, ["admin"]);
    
    const body = await request.json();
    const { eventId, vendorName, serviceCategory, email, phone, contractAmount, contractDate, status } = body;

    if (!eventId || !ObjectId.isValid(eventId)) {
      return NextResponse.json({ error: "Invalid event ID" }, { status: 400 });
    }

    if (!vendorName || !serviceCategory) {
      return NextResponse.json({ error: "Vendor name and category are required" }, { status: 400 });
    }

    const db = await getMongoDb();
    const vendorsCollection = db.collection("eventVendors");

    const newVendor = {
      eventId: new ObjectId(eventId),
      vendorName,
      serviceCategory,
      email: email || null,
      phone: phone || null,
      contractAmount: contractAmount || 0,
      contractDate: contractDate || null,
      status: status || 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await vendorsCollection.insertOne(newVendor);

    // Update event vendor count
    const eventsCollection = db.collection("events");
    await eventsCollection.updateOne(
      { _id: new ObjectId(eventId) },
      {
        $set: {
          'vendors.total': (await vendorsCollection.countDocuments({ eventId: new ObjectId(eventId) }))
        }
      }
    );

    return NextResponse.json({ _id: result.insertedId, ...newVendor }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthGuardError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("Vendor POST error:", error);
    return NextResponse.json({ error: "Failed to create vendor" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requireRole(request, ["admin"]);
    
    const body = await request.json();
    const { vendorId, eventId, status } = body;

    if (!vendorId || !ObjectId.isValid(vendorId)) {
      return NextResponse.json({ error: "Invalid vendor ID" }, { status: 400 });
    }

    if (!eventId || !ObjectId.isValid(eventId)) {
      return NextResponse.json({ error: "Invalid event ID" }, { status: 400 });
    }

    const db = await getMongoDb();
    const vendorsCollection = db.collection("eventVendors");

    // Get existing vendor to check if it was already confirmed
    const existingVendor = await vendorsCollection.findOne({ _id: new ObjectId(vendorId) });
    
    if (!existingVendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    const wasConfirmed = existingVendor.status === 'confirmed';
    const isNowConfirmed = status === 'confirmed';

    // Update vendor status
    const result = await vendorsCollection.updateOne(
      { _id: new ObjectId(vendorId) },
      {
        $set: {
          status,
          updatedAt: new Date(),
        }
      }
    );

    // Update event vendor secured count if status changed to confirmed
    if (!wasConfirmed && isNowConfirmed) {
      const eventsCollection = db.collection("events");
      await eventsCollection.updateOne(
        { _id: new ObjectId(eventId) },
        { $inc: { 'vendors.secured': 1 } }
      );
    }

    return NextResponse.json({ message: "Vendor updated successfully" }, { status: 200 });
  } catch (error) {
    if (error instanceof AuthGuardError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("Vendor PATCH error:", error);
    return NextResponse.json({ error: "Failed to update vendor" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireRole(request, ["admin"]);
    
    const body = await request.json();
    const { vendorId, eventId } = body;

    if (!vendorId || !ObjectId.isValid(vendorId)) {
      return NextResponse.json({ error: "Invalid vendor ID" }, { status: 400 });
    }

    if (!eventId || !ObjectId.isValid(eventId)) {
      return NextResponse.json({ error: "Invalid event ID" }, { status: 400 });
    }

    const db = await getMongoDb();
    const vendorsCollection = db.collection("eventVendors");

    // Get vendor before deletion to check status
    const vendor = await vendorsCollection.findOne({ _id: new ObjectId(vendorId) });
    
    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    // Delete vendor
    await vendorsCollection.deleteOne({ _id: new ObjectId(vendorId) });

    // Update event vendor counts
    const eventsCollection = db.collection("events");
    const updateQuery: any = {};
    updateQuery['$inc'] = { 'vendors.total': -1 };
    
    if (vendor.status === 'confirmed') {
      updateQuery['$inc']['vendors.secured'] = -1;
    }

    await eventsCollection.updateOne(
      { _id: new ObjectId(eventId) },
      updateQuery
    );

    return NextResponse.json({ message: "Vendor deleted successfully" }, { status: 200 });
  } catch (error) {
    if (error instanceof AuthGuardError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("Vendor DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete vendor" }, { status: 500 });
  }
}
