"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

export function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate authentication delay
    setTimeout(() => {
      setIsLoading(false);
    }, 1500);
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
      </div>

      <div className="pt-2 text-center">
        <p className="text-[8px] text-gray-400 uppercase tracking-[0.1em] max-w-[250px] mx-auto leading-relaxed">
          Access restricted to assigned production members and administrative staff.
        </p>
      </div>
    </form>
  );
}