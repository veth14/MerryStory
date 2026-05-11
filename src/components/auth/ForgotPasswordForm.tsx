"use client";

import { useState } from "react";
import Link from "next/link";

function toFriendlyPasswordResetMessage(error: unknown): string {
  const fallbackMessage = "Unable to send a reset email right now. Please try again.";

  if (!(error instanceof Error)) {
    return fallbackMessage;
  }

  const authCode = (error as Error & { code?: string }).code;

  switch (authCode) {
    case "auth/invalid-email":
      return "Enter a valid email address.";
    case "auth/missing-continue-uri":
    case "auth/unauthorized-continue-uri":
      return "Password reset is not configured for this domain.";
    case "auth/user-not-found":
      return "If that email exists, a reset link has been sent.";
    case "auth/too-many-requests":
      return "Too many reset attempts. Please wait and try again.";
    default:
      return error.message || fallbackMessage;
  }
}

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);
    setStatusMessage(null);
    setIsSuccess(false);

    try {
      const response = await fetch("/api/auth/password-reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      const payload = (await response.json().catch(() => ({}))) as { message?: string; error?: string };

      if (!response.ok) {
        throw new Error(payload.error || "Unable to send a reset email right now. Please try again.");
      }

      setIsSuccess(true);
      setStatusMessage(payload.message || "If that email exists in our portal, a reset link has been sent.");
      setEmail("");
    } catch (error) {
      setIsSuccess(false);
      setStatusMessage(toFriendlyPasswordResetMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[10px] font-bold uppercase tracking-[0.25em] text-gray-500 mb-2">
          Reset Access
        </h2>
        <p className="text-[12px] leading-relaxed text-gray-500 max-w-[320px]">
          Enter the email address linked to your portal account and we will send password reset instructions.
        </p>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div>
          <label className="text-[8px] font-bold uppercase tracking-[0.2em] text-gray-400 block mb-2">
            EMAIL ADDRESS
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="DIRECTOR@STUDIO.COM"
            className="w-full border-b border-gray-200 pb-2 text-[13px] focus:outline-none focus:border-brand-yellow text-gray-900 placeholder:text-gray-300 transition-colors bg-transparent"
          />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-brand-yellow hover:bg-yellow-500 disabled:bg-gray-200 disabled:text-gray-400 text-white py-4 flex justify-center items-center transition-all duration-200 rounded-[2px]"
          >
            <span className="font-bold text-[10px] uppercase tracking-[0.25em]">
              {isLoading ? "SENDING RESET EMAIL..." : "SEND RESET LINK"}
            </span>
          </button>

          {statusMessage && (
            <p className={`mt-3 text-[10px] font-semibold tracking-[0.08em] uppercase leading-relaxed ${isSuccess ? "text-emerald-600" : "text-red-500"}`}>
              {statusMessage}
            </p>
          )}
        </div>
      </form>

      <div className="pt-2 text-center">
        <Link href="/sign-in" className="text-[8px] font-bold tracking-[0.12em] text-gray-400 hover:text-brand-yellow transition-colors uppercase">
          Back to Sign In
        </Link>
      </div>
    </div>
  );
}