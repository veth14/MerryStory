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

    const resetLink = await getFirebaseAdminAuth().generatePasswordResetLink(email);

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

    const message = error instanceof Error ? error.message.toLowerCase() : "";

    if (message.includes("missing email_user") || message.includes("missing email_pass")) {
      return NextResponse.json(
        { error: "Email sending is not configured yet. Add EMAIL_USER and EMAIL_PASS in production and restart the server." },
        { status: 500 }
      );
    }

    if (message.includes("invalid login") || message.includes("username and password not accepted") || message.includes("auth")) {
      return NextResponse.json(
        { error: "The email account rejected the login. Check EMAIL_USER and EMAIL_PASS." },
        { status: 500 }
      );
    }

    if (message.includes("unauthorized-continue-uri") || message.includes("invalid-continue-uri")) {
      return NextResponse.json(
        { error: "Password reset is not configured for this domain in Firebase." },
        { status: 500 }
      );
    }

    const fallbackMessage = error instanceof Error && error.message.includes("EMAIL_NOT_FOUND")
      ? "If that email exists in our portal, a reset link has been sent."
      : "Unable to send a reset email right now. Please try again.";

    if (fallbackMessage.startsWith("If that email exists")) {
      return NextResponse.json({ message: fallbackMessage }, { status: 200 });
    }

    return NextResponse.json({ error: fallbackMessage }, { status: 500 });
  }
}