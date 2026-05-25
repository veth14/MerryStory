import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdminAuth } from "@/lib/firebase/admin";
import { requireRole, AuthGuardError } from "@/lib/auth/guards";
import { getMongoDb } from "@/lib/mongodb";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { writeAuditLog } from "@/lib/audit";
import { sendWelcomeActivationEmail } from "@/lib/email";
import { createSignedStorageUrl, extractStoragePathFromPublicUrl } from "@/lib/storage";

type AppRole = "admin" | "coordinator" | "staff";
type AccessRole = "ADMINISTRATOR" | "LEAD COORDINATOR" | "PRODUCTION STAFF";
type UserStatus = "Active" | "On-Site" | "Away" | "Invited";

const ACCESS_ROLE_TO_APP_ROLE: Record<AccessRole, AppRole> = {
  ADMINISTRATOR: "admin",
  "LEAD COORDINATOR": "coordinator",
  "PRODUCTION STAFF": "staff",
};

const VALID_ACCESS_ROLES: AccessRole[] = ["ADMINISTRATOR", "LEAD COORDINATOR", "PRODUCTION STAFF"];
const VALID_STATUSES: UserStatus[] = ["Active", "On-Site", "Away", "Invited"];

type UserDocument = {
  firebaseUid: string;
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  role?: AppRole;
  accessRole?: AccessRole;
  status?: UserStatus;
  avatarUrl?: string;
  avatarPath?: string;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  lastActiveAt?: Date;
};

type UserResponse = {
  uid: string;
  email: string;
  name: string;
  role: AccessRole;
  appRole: AppRole;
  status: UserStatus;
  avatarUrl: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  lastActiveAt: string | null;
};

function normalizeAccessRole(value: unknown, fallback?: AccessRole): AccessRole {
  if (typeof value === "string" && VALID_ACCESS_ROLES.includes(value as AccessRole)) {
    return value as AccessRole;
  }

  if (fallback) {
    return fallback;
  }

  return "PRODUCTION STAFF";
}

function normalizeStatus(value: unknown, fallback?: UserStatus): UserStatus {
  if (typeof value === "string" && VALID_STATUSES.includes(value as UserStatus)) {
    return value as UserStatus;
  }

  if (fallback) {
    return fallback;
  }

  return "Active";
}

function inferAccessRoleFromAppRole(role: unknown): AccessRole {
  if (role === "admin") {
    return "ADMINISTRATOR";
  }

  if (role === "coordinator") {
    return "LEAD COORDINATOR";
  }

  return "PRODUCTION STAFF";
}

function toIsoString(value: Date | string | undefined): string | null {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

async function toUserResponse(doc: UserDocument): Promise<UserResponse> {
  const accessRole = normalizeAccessRole(doc.accessRole, inferAccessRoleFromAppRole(doc.role));
  const resolvedPath = doc.avatarPath || (doc.avatarUrl ? extractStoragePathFromPublicUrl(doc.avatarUrl) : null);
  const signedAvatarUrl = resolvedPath ? await createSignedStorageUrl(resolvedPath) : null;

  return {
    uid: doc.firebaseUid,
    email: doc.email,
    name: doc.name || `${doc.firstName || ""} ${doc.lastName || ""}`.trim() || "Unnamed User",
    role: accessRole,
    appRole: ACCESS_ROLE_TO_APP_ROLE[accessRole],
    status: normalizeStatus(doc.status),
    avatarUrl: signedAvatarUrl || null,
    createdAt: toIsoString(doc.createdAt),
    updatedAt: toIsoString(doc.updatedAt),
    lastActiveAt: toIsoString(doc.lastActiveAt || doc.updatedAt || doc.createdAt),
  };
}

function getFileExtension(fileName: string, mimeType: string): string {
  const fromName = fileName.split(".").pop()?.toLowerCase();

  if (fromName) {
    return fromName;
  }

  if (mimeType === "image/png") {
    return "png";
  }

  if (mimeType === "image/webp") {
    return "webp";
  }

  if (mimeType === "image/gif") {
    return "gif";
  }

  return "jpg";
}

function resolveAvatarPath(value?: string | null): string | null {
  if (!value) {
    return null;
  }

  return extractStoragePathFromPublicUrl(value) || value;
}

async function uploadAvatar(file: File, targetUid: string): Promise<string> {
  const supabase = getSupabaseServerClient();
  const extension = getFileExtension(file.name, file.type);
  const storagePath = `users/${targetUid}/avatar_${Date.now()}.${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabase.storage.from("user").upload(storagePath, buffer, {
    contentType: file.type || "image/jpeg",
    upsert: true,
  });

  if (error) {
    throw new Error(`Avatar upload failed: ${error.message}`);
  }

  return storagePath;
}

async function deleteAvatarIfExists(avatarValue: string | undefined): Promise<void> {
  const path = resolveAvatarPath(avatarValue);

  if (!path) {
    return;
  }

  const supabase = getSupabaseServerClient();
  await supabase.storage.from("user").remove([path]);
}

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, ["admin"]);

    const db = await getMongoDb();
    const usersCollection = db.collection<UserDocument>("users");

    const users = await usersCollection.find({ firebaseUid: { $exists: true, $ne: "" } }).sort({ createdAt: -1 }).toArray();

    return NextResponse.json(
      {
        users: await Promise.all(users.map((user) => toUserResponse(user))),
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof AuthGuardError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    console.error("Users GET error:", error);
    return NextResponse.json({ error: "Failed to fetch users." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  let createdUid: string | null = null;
  let createdAvatarPath: string | null = null;

  try {
    const actor = await requireRole(request, ["admin"]);

    const form = await request.formData();
    const name = String(form.get("name") || "").trim();
    const email = String(form.get("email") || "").trim().toLowerCase();
    const password = String(form.get("password") || "").trim();
    const inputRole = String(form.get("role") || "").trim();
    const inputStatus = String(form.get("status") || "").trim();
    const avatar = form.get("avatar");

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email, and password are required." }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
    }

    const accessRole = normalizeAccessRole(inputRole || undefined);
    const appRole = ACCESS_ROLE_TO_APP_ROLE[accessRole];
    const status = normalizeStatus(inputStatus || undefined);

    const adminAuth = getFirebaseAdminAuth();

    const firebaseUser = await adminAuth.createUser({
      email,
      password,
      displayName: name,
    });

    createdUid = firebaseUser.uid;
    await adminAuth.setCustomUserClaims(firebaseUser.uid, { role: appRole });

    let avatarPath: string | undefined;

    if (avatar instanceof File && avatar.size > 0) {
      avatarPath = await uploadAvatar(avatar, firebaseUser.uid);
      createdAvatarPath = avatarPath;
    }

    const db = await getMongoDb();
    const usersCollection = db.collection<UserDocument>("users");

    const now = new Date();
    const userDoc: UserDocument = {
      firebaseUid: firebaseUser.uid,
      email,
      name,
      role: appRole,
      accessRole,
      status,
      avatarPath,
      avatarUrl: avatarPath ? await createSignedStorageUrl(avatarPath) : null,
      isActive: status === "Active" || status === "On-Site",
      createdAt: now,
      updatedAt: now,
      lastActiveAt: now,
    };

    await usersCollection.insertOne(userDoc);

    try {
      const activationLink = await adminAuth.generateEmailVerificationLink(email);
      await sendWelcomeActivationEmail({
        to: email,
        name,
        activationLink,
        role: accessRole,
      });
    } catch (emailError) {
      console.error("Failed to send activation email (user was still created):", emailError);
    }

    await writeAuditLog({
      request,
      category: "USER_MANAGEMENT",
      action: "USER_CREATED",
      message: `Created user ${email}.`,
      actor: {
        uid: actor.uid,
        email: actor.email,
        role: actor.role,
      },
      target: {
        uid: firebaseUser.uid,
        email,
        type: "user",
      },
      details: {
        assignedAccessRole: accessRole,
        assignedAppRole: appRole,
        status,
        hasAvatar: Boolean(avatarPath),
        activationEmailSent: true,
      },
    });

    return NextResponse.json({ success: true, user: await toUserResponse(userDoc) }, { status: 201 });
  } catch (error) {
    if (createdAvatarPath) {
      try {
        await deleteAvatarIfExists(createdAvatarPath);
      } catch (rollbackError) {
        console.error("Failed to rollback avatar after create error:", rollbackError);
      }
    }

    if (createdUid) {
      try {
        await getFirebaseAdminAuth().deleteUser(createdUid);
      } catch (rollbackError) {
        console.error("Failed to rollback Firebase user after create error:", rollbackError);
      }
    }

    if (error instanceof AuthGuardError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    const firebaseErrorCode = (error as { code?: string }).code;

    if (firebaseErrorCode === "auth/email-already-exists") {
      return NextResponse.json({ error: "A Firebase account with that email already exists." }, { status: 409 });
    }

    console.error("Users POST error:", error);
    return NextResponse.json({ error: "Failed to create user." }, { status: 500 });
  }
}

export {
  deleteAvatarIfExists,
  normalizeAccessRole,
  normalizeStatus,
  ACCESS_ROLE_TO_APP_ROLE,
  type AccessRole,
  type AppRole,
  type UserStatus,
  type UserDocument,
  type UserResponse,
  toUserResponse,
  uploadAvatar,
};
