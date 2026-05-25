import { NextRequest, NextResponse } from "next/server";
import { AuthGuardError, requireAuthenticatedUser } from "@/lib/auth/guards";
import { getMongoDb } from "@/lib/mongodb";
import { getFirebaseAdminAuth } from "@/lib/firebase/admin";
import { writeAuditLog } from "@/lib/audit";
import { resolveSignedUrl } from "@/lib/storage";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuthenticatedUser(request);
    const db = await getMongoDb();
    const usersCollection = db.collection("users");

    const profile = await usersCollection.findOne({
      $or: [{ firebaseUid: user.uid }, { email: user.email }],
    });

    return NextResponse.json(
      {
        uid: user.uid,
        email: user.email,
        role: user.role,
        name: profile?.name || "",
        phone: profile?.phone || "",
        avatarUrl: await resolveSignedUrl(profile?.avatarPath || profile?.avatarUrl) || null,
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof AuthGuardError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    console.error("Profile GET error:", error);
    return NextResponse.json({ error: "Failed to fetch profile." }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuthenticatedUser(request);
    const body = await request.json();
    const { name, phone, password } = body;

    const db = await getMongoDb();
    const usersCollection = db.collection("users");

    const query = user.email ? { $or: [{ firebaseUid: user.uid }, { email: user.email }] } : { firebaseUid: user.uid };
    
    // Check if user exists first to safely update or upsert
    const existing = await usersCollection.findOne(query);

    if (existing) {
      await usersCollection.updateOne(
        { _id: existing._id },
        { 
          $set: { 
            name: name || "", 
            phone: phone || "",
            firebaseUid: user.uid,
            email: user.email
          } 
        }
      );
    } else {
      await usersCollection.insertOne({
        firebaseUid: user.uid,
        email: user.email,
        name: name || "",
        phone: phone || "",
        role: "staff" // default role if not set
      });
    }

    // Update Firebase Password if provided
    if (password && password.trim().length > 0) {
      const adminAuth = getFirebaseAdminAuth();
      await adminAuth.updateUser(user.uid, { password: password.trim() });
    }

    await writeAuditLog({
      request,
      category: "PROFILE",
      action: "PROFILE_UPDATED",
      message: `Updated profile for ${user.email || user.uid}.`,
      actor: {
        uid: user.uid,
        email: user.email,
        role: user.role,
      },
      target: {
        uid: user.uid,
        email: user.email,
        type: "user",
      },
      details: {
        nameUpdated: Boolean(name),
        phoneUpdated: Boolean(phone),
        passwordUpdated: Boolean(password && password.trim().length > 0),
      },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    if (error instanceof AuthGuardError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    console.error("Profile PUT error:", error);
    return NextResponse.json({ error: "Failed to update profile." }, { status: 500 });
  }
}
