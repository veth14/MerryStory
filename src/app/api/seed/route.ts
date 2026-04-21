import { NextRequest, NextResponse } from "next/server";
import { getMongoDb } from "@/lib/mongodb";

export async function GET(request: NextRequest) {
  try {
    const db = await getMongoDb();
    const usersCollection = db.collection("users");

    const allUsersInfo = await usersCollection.find({}).toArray();

    // The user's specific UID and email provided in instructions
    const result = await usersCollection.updateOne(
      { firebaseUid: "7DmjOdmWZihfLP2GeDqiTPRdWCL2" },
      { 
        $set: { 
          email: "merrystoryeventservices@gmail.com", 
          role: "admin", 
          name: "Merry Story Admin",
          baseRole: "admin",
          isActive: true
        } 
      },
      { upsert: true }
    );

    return NextResponse.json({ 
      success: true, 
      message: "Admin user seeded successfully.",
      result,
      debugAllUsers: allUsersInfo
    });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json({ error: "Failed to seed admin user." }, { status: 500 });
  }
}
