"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export default function PublicLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isDashboardRoute = pathname?.startsWith("/admin") || pathname?.startsWith("/coordinator");

  if (isDashboardRoute) {
    return <>{children}</>;
  }

  return (
    <>
      <Header />
      <div className="pt-20">{children}</div>
      <Footer />
    </>
  );
}