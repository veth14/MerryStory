import { HeroSection } from "@/components/sections/HeroSection";
import { PackagesSection } from "@/components/sections/PackagesSection";
import { DifferenceSection } from "@/components/sections/DifferenceSection";
import { ExpertiseSection } from "@/components/sections/ExpertiseSection";
import { TestimonialsSection } from "@/components/sections/TestimonialsSection";
import { ContactSection } from "@/components/sections/ContactSection";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-white">
      <HeroSection />
      <PackagesSection />
      <DifferenceSection />
      <ExpertiseSection />
      <TestimonialsSection />
      <ContactSection />
    </main>
  );
}