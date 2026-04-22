import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdminAuth } from "@/lib/firebase/admin";
import { requireRole, AuthGuardError } from "@/lib/auth/guards";
import { getMongoDb } from "@/lib/mongodb";
import { writeAuditLog } from "@/lib/audit";
import {
  ACCESS_ROLE_TO_APP_ROLE,
  deleteAvatarIfExists,
  normalizeAccessRole,
  normalizeStatus,
  toUserResponse,
  uploadAvatar,
  type UserDocument,
} from "../route";

type RouteContext = {
  params: Promise<{ uid: string }>;
};

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const actor = await requireRole(request, ["admin"]);

    const { uid } = await context.params;

    if (!uid) {
      return NextResponse.json({ error: "Missing user id." }, { status: 400 });
    }

    const form = await request.formData();
    const name = String(form.get("name") || "").trim();
    const email = String(form.get("email") || "").trim().toLowerCase();
    const password = String(form.get("password") || "").trim();
    const roleInput = String(form.get("role") || "").trim();
    const statusInput = String(form.get("status") || "").trim();
    const removeAvatar = String(form.get("removeAvatar") || "false") === "true";
    const avatar = form.get("avatar");

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required." }, { status: 400 });
    }

    if (password && password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
    }

    const accessRole = normalizeAccessRole(roleInput || undefined);
    const appRole = ACCESS_ROLE_TO_APP_ROLE[accessRole];
    const status = normalizeStatus(statusInput || undefined);

    const db = await getMongoDb();
    const usersCollection = db.collection<UserDocument>("users");

    const existing = await usersCollection.findOne({ firebaseUid: uid });

    if (!existing) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const adminAuth = getFirebaseAdminAuth();

    await adminAuth.updateUser(uid, {
      email,
      displayName: name,
      ...(password ? { password } : {}),
    });

    await adminAuth.setCustomUserClaims(uid, { role: appRole });

    let avatarUrl = existing.avatarUrl;

    if (removeAvatar) {
      await deleteAvatarIfExists(existing.avatarUrl);
      avatarUrl = undefined;
    }

    if (avatar instanceof File && avatar.size > 0) {
      await deleteAvatarIfExists(existing.avatarUrl);
      avatarUrl = await uploadAvatar(avatar, uid);
    }

    const now = new Date();

    await usersCollection.updateOne(
      { firebaseUid: uid },
      {
        $set: {
          name,
          email,
          role: appRole,
          accessRole,
          status,
          avatarUrl,
          isActive: status === "Active" || status === "On-Site",
          updatedAt: now,
        },
      }
    );

    const updated = await usersCollection.findOne({ firebaseUid: uid });

    if (!updated) {
      return NextResponse.json({ error: "User update failed." }, { status: 500 });
    }

    await writeAuditLog({
      request,
      category: "USER_MANAGEMENT",
      action: "USER_UPDATED",
      message: `Updated user ${updated.email}.`,
      actor: {
        uid: actor.uid,
        email: actor.email,
        role: actor.role,
      },
      target: {
        uid,
        email: updated.email,
        type: "user",
      },
      details: {
        accessRole,
        appRole,
        status,
        passwordUpdated: Boolean(password),
        avatarUpdated: avatar instanceof File && avatar.size > 0,
        avatarRemoved: removeAvatar,
      },
    });

    return NextResponse.json({ success: true, user: toUserResponse(updated) }, { status: 200 });
  } catch (error) {
    if (error instanceof AuthGuardError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    const firebaseErrorCode = (error as { code?: string }).code;

    if (firebaseErrorCode === "auth/email-already-exists") {
      return NextResponse.json({ error: "A Firebase account with that email already exists." }, { status: 409 });
    }

    console.error("Users PUT error:", error);
    return NextResponse.json({ error: "Failed to update user." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const actor = await requireRole(request, ["admin"]);
    const { uid } = await context.params;

    if (!uid) {
      return NextResponse.json({ error: "Missing user id." }, { status: 400 });
    }

    if (actor.uid === uid) {
      return NextResponse.json({ error: "You cannot delete your own admin account." }, { status: 400 });
    }

    const db = await getMongoDb();
    const usersCollection = db.collection<UserDocument>("users");
    const existing = await usersCollection.findOne({ firebaseUid: uid });

    if (!existing) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    await deleteAvatarIfExists(existing.avatarUrl);

    await getFirebaseAdminAuth().deleteUser(uid);
    await usersCollection.deleteOne({ firebaseUid: uid });

    await writeAuditLog({
      request,
      category: "USER_MANAGEMENT",
      action: "USER_DELETED",
      message: `Deleted user ${existing.email}.`,
      actor: {
        uid: actor.uid,
        email: actor.email,
        role: actor.role,
      },
      target: {
        uid,
        email: existing.email,
        type: "user",
      },
      details: {
        deletedRole: existing.accessRole || existing.role || null,
        deletedStatus: existing.status || null,
      },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    if (error instanceof AuthGuardError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    const firebaseErrorCode = (error as { code?: string }).code;

    if (firebaseErrorCode === "auth/user-not-found") {
      return NextResponse.json({ error: "Firebase user not found." }, { status: 404 });
    }

    console.error("Users DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete user." }, { status: 500 });
  }
}
