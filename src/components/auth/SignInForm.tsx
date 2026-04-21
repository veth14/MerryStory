"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { getFirebaseClientAuth } from "@/lib/firebase/client";

type AuthProfileResponse = {
  uid: string;
  email: string | null;
  role: "admin" | "coordinator" | "client" | null;
};

function toFriendlyAuthErrorMessage(error: unknown): string {
  const fallbackMessage = "Unable to sign in right now. Please verify your credentials and try again.";

  if (!(error instanceof Error)) {
    return fallbackMessage;
  }

  const authCode = (error as Error & { code?: string }).code;

  switch (authCode) {
    case "auth/invalid-email":
      return "The email format is invalid.";
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Invalid email or password.";
    case "auth/too-many-requests":
      return "Too many login attempts. Please wait and try again.";
    default:
      return error.message || fallbackMessage;
  }
}

export function SignInForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setAuthError(null);
    setIsLoading(true);

    try {
      const firebaseAuth = getFirebaseClientAuth();
      const credentials = await signInWithEmailAndPassword(firebaseAuth, email.trim(), password);
      const idToken = await credentials.user.getIdToken();

      const profileResponse = await fetch("/api/auth/me", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
        cache: "no-store",
      });

      const profilePayload = (await profileResponse.json().catch(() => ({}))) as Partial<AuthProfileResponse> & {
        error?: string;
      };

      if (!profileResponse.ok) {
        throw new Error(profilePayload.error || "Failed to validate account access.");
      }

      if (profilePayload.role === "admin") {
        router.push("/admin");
        router.refresh();
        return;
      }

      if (profilePayload.role === "coordinator") {
        router.push("/coordinator");
        router.refresh();
        return;
      }

      await signOut(firebaseAuth);
      throw new Error("This account is authenticated but has no dashboard role assigned yet.");
    } catch (error) {
      setAuthError(toFriendlyAuthErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
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

      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="text-[8px] font-bold uppercase tracking-[0.2em] text-gray-400 block">
            PASSWORD
          </label>
          <Link href="/forgot-password" className="text-[8px] font-bold tracking-[0.1em] text-gray-400 hover:text-brand-yellow transition-colors uppercase">
            Forgot Password?
          </Link>
        </div>
        <input 
          type="password" 
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••" 
          className="w-full border-b border-gray-200 pb-2 text-[13px] focus:outline-none focus:border-brand-yellow text-gray-900 placeholder:text-gray-300 transition-colors bg-transparent tracking-widest"
        />
      </div>

      <div className="pt-4">
        <button 
          type="submit"
          disabled={isLoading}
          className="w-full bg-brand-yellow hover:bg-yellow-500 disabled:bg-gray-200 disabled:text-gray-400 text-white py-4 flex justify-center items-center transition-all duration-200 rounded-[2px]"
        >
          <span className="font-bold text-[10px] uppercase tracking-[0.25em]">
            {isLoading ? 'AUTHENTICATING...' : 'SECURE LOGIN'}
          </span>
        </button>

        {authError && (
          <p className="mt-3 text-[10px] font-semibold tracking-[0.08em] text-red-500 uppercase leading-relaxed">
            {authError}
          </p>
        )}
      </div>

      <div className="pt-2 text-center">
        <p className="text-[8px] text-gray-400 uppercase tracking-[0.1em] max-w-[250px] mx-auto leading-relaxed">
          Access restricted to assigned production members and administrative staff.
        </p>
      </div>
    </form>
  );
}