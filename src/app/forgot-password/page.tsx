import { Metadata } from "next";
import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Forgot Password | MerryStory Productions",
  description: "Request a password reset link for the production portal.",
};

export default function ForgotPasswordPage() {
  return (
    <main className="min-h-[calc(100vh-80px)] bg-[#FDFDFD] flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-gray-100 via-transparent to-transparent -z-10" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-brand-yellow/5 rounded-full blur-[120px] -z-10 pointer-events-none" />

      <div className="w-full max-w-[420px] bg-white px-10 py-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 backdrop-blur-xl mb-12">
        <div className="mb-12">
          <h1 className="text-3xl font-bold tracking-tight mb-2 text-gray-900 font-serif">
            Account Recovery
            <span className="text-brand-yellow block mt-1 text-[2.5rem] leading-none">Portal.</span>
          </h1>
          <p className="text-gray-400 text-[11px] tracking-[0.15em] uppercase mt-6 border-l-2 border-brand-yellow pl-4 py-1">
            Reset Access <br /> & Sign In
          </p>
        </div>

        <ForgotPasswordForm />

        <div className="pt-8 text-center">
          <Link href="/sign-in" className="text-[8px] font-bold tracking-[0.12em] text-gray-400 hover:text-brand-yellow transition-colors uppercase">
            Return to Login
          </Link>
        </div>
      </div>
    </main>
  );
}