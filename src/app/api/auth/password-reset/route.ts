import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdminAuth } from "@/lib/firebase/admin";
import { sendPasswordResetEmail } from "@/lib/email";

type PasswordResetRequestBody = {
  email?: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as PasswordResetRequestBody;
    const email = body.email?.trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ error: "Email address is required." }, { status: 400 });
    }

    const resetLink = await getFirebaseAdminAuth().generatePasswordResetLink(email, {
      url: `${request.nextUrl.origin}/sign-in`,
      handleCodeInApp: true,
    });

    await sendPasswordResetEmail({
      to: email,
      resetLink,
    });

    return NextResponse.json(
      {
        message: "If that email exists in our portal, a reset link has been sent.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Password reset API error:", error);

    const message = error instanceof Error && error.message.includes("EMAIL_NOT_FOUND")
      ? "If that email exists in our portal, a reset link has been sent."
      : "Unable to send a reset email right now. Please try again.";

    if (message.startsWith("If that email exists")) {
      return NextResponse.json({ message }, { status: 200 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}