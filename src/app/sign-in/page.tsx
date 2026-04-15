import { Metadata } from 'next';
import { SignInForm } from '@/components/auth/SignInForm';

export const metadata: Metadata = {
  title: 'Sign In | MerryStory Productions',
  description: 'Access the production portal.',
};

export default function SignInPage() {
  return (
    <main className="h-[calc(100vh-80px)] bg-[#FDFDFD] flex items-center justify-center px-4 relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-gray-100 via-transparent to-transparent -z-10" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-brand-yellow/5 rounded-full blur-[120px] -z-10 pointer-events-none" />

      {/* Centered Minimalist Card */}
      <div className="w-full max-w-[420px] bg-white px-10 py-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 backdrop-blur-xl mb-12">
        <div className="mb-12">
          <h1 className="text-3xl font-bold tracking-tight mb-2 text-gray-900 font-serif">
            Merry Story 
            <span className="text-brand-yellow block mt-1 text-[2.5rem] leading-none">Portal.</span>
          </h1>
          <p className="text-gray-400 text-[11px] tracking-[0.15em] uppercase mt-6 border-l-2 border-brand-yellow pl-4 py-1">
            Production Management <br/> & Access
          </p>
        </div>

        <SignInForm />
      </div>
    </main>
  );
}