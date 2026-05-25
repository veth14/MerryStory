import { NextRequest, NextResponse } from "next/server";
import { AuthGuardError, requireAuthenticatedUser } from "@/lib/auth/guards";
import { getMongoDb } from "@/lib/mongodb";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { writeAuditLog } from "@/lib/audit";
import { validateUpload } from "@/lib/upload-validation";
import { createSignedStorageUrl, extractStoragePathFromPublicUrl } from "@/lib/storage";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuthenticatedUser(request);
    
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }

    let validated;

    try {
      validated = validateUpload(file, {
        allowedExtensions: ["jpg", "jpeg", "png", "webp", "gif"],
        allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
        maxBytes: 2 * 1024 * 1024,
      });
    } catch (validationError) {
      return NextResponse.json(
        { error: validationError instanceof Error ? validationError.message : "Invalid file." },
        { status: 400 }
      );
    }

    const timeStamp = Date.now();
    const fileName = `profile_${timeStamp}.${validated.extension}`;
    // Folder structure: avatars/uid/filename
    const folderPath = `avatars/${user.uid}`;
    const storagePath = `${folderPath}/${fileName}`;

    const db = await getMongoDb();
    const usersCollection = db.collection("users");
    const query = { firebaseUid: user.uid };
    
    // Check if user already exists
    const existingUser = await usersCollection.findOne(query);

    // If user has an existing avatar, delete it to save space
    const supabase = getSupabaseServerClient();
    
    const existingAvatarPath =
      existingUser?.avatarPath ||
      (existingUser?.avatarUrl ? extractStoragePathFromPublicUrl(existingUser.avatarUrl) : null);

    if (existingAvatarPath) {
       // Extract the path from the URL.
       // Supabase public URL looks like: https://[projectId].supabase.co/storage/v1/object/public/user/avatars/...
       try {
         await supabase.storage.from("user").remove([existingAvatarPath]);
       } catch (err) {
         console.warn("Could not parse/delete old avatar URL automatically", err);
       }
    }

    // Convert File to ArrayBuffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload to Supabase bucket 'user'
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from("user")
      .upload(storagePath, buffer, {
        contentType: validated.mimeType,
        upsert: true
      });

    if (uploadError) {
      throw uploadError;
    }

    // Get public URL
    const signedAvatarUrl = await createSignedStorageUrl(storagePath, { bucket: "user", expiresIn: 60 * 10 });

    // Update MongoDB
    if (existingUser) {
      await usersCollection.updateOne(
        { _id: existingUser._id },
        { $set: { avatarPath: storagePath, avatarUrl: signedAvatarUrl } }
      );
    } else {
      await usersCollection.insertOne({
        firebaseUid: user.uid,
        email: user.email,
        role: user.role,
        avatarPath: storagePath,
        avatarUrl: signedAvatarUrl,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    await writeAuditLog({
      request,
      category: "PROFILE",
      action: "PROFILE_AVATAR_UPDATED",
      message: `Updated profile avatar for ${user.email || user.uid}.`,
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
        storagePath,
      },
    });

    return NextResponse.json({ 
      success: true, 
      avatarUrl: signedAvatarUrl 
    }, { status: 200 });

  } catch (error) {
    if (error instanceof AuthGuardError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    console.error("Avatar upload error:", error);
    return NextResponse.json({ error: "Failed to upload avatar." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuthenticatedUser(request);
    
    // Connect to DB and find user
    const db = await getMongoDb();
    const usersCollection = db.collection("users");
    const existingUser = await usersCollection.findOne({ firebaseUid: user.uid });
    
    const existingAvatarPath =
      existingUser?.avatarPath ||
      (existingUser?.avatarUrl ? extractStoragePathFromPublicUrl(existingUser.avatarUrl) : null);

    if (existingAvatarPath) {
      const supabase = getSupabaseServerClient();
      try {
         await supabase.storage.from("user").remove([existingAvatarPath]);
       } catch (err) {
         console.warn("Could not delete old avatar URL automatically", err);
       }
       
       await usersCollection.updateOne(
         { _id: existingUser._id },
         { $unset: { avatarUrl: "", avatarPath: "" } }
       );
    }

    await writeAuditLog({
      request,
      category: "PROFILE",
      action: "PROFILE_AVATAR_REMOVED",
      message: `Removed profile avatar for ${user.email || user.uid}.`,
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
    });
    
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    if (error instanceof AuthGuardError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: "Failed to remove avatar." }, { status: 500 });
  }
}
