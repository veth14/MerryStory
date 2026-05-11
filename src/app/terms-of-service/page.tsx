import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service | MerryStory Productions",
  description:
    "Read the terms and conditions that govern the use of MerryStory Productions services.",
};

const sections = [
  {
    title: "Acceptance of Terms",
    content: [
      "By booking our services, signing a contract, or submitting an inquiry through our website, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service. If you do not agree with any part of these terms, please do not proceed with booking.",
      "These Terms apply to all clients, visitors, and others who access or use MerryStory Productions' services.",
    ],
  },
  {
    title: "Services Provided",
    content: [
      "MerryStory Productions offers event production and photography services including, but not limited to, wedding coverage, debut and birthday celebrations, corporate events, product launches, and graduation ceremonies.",
      "The specific scope of services, inclusions, deliverables, and timeline will be detailed in your individual service contract. In the event of any conflict between these Terms and a signed contract, the signed contract shall govern.",
    ],
  },
  {
    title: "Booking & Payment",
    content: [
      "A booking is confirmed only upon receipt of a signed contract and the required deposit (typically 50% of the total package price). The remaining balance is due no later than seven (7) days prior to the event date unless otherwise stated in your contract.",
      "We accept payment via bank transfer, GCash, Maya, and other methods specified on your invoice. All prices are quoted in Philippine Peso (PHP) unless otherwise agreed upon in writing.",
    ],
  },
  {
    title: "Client Responsibilities",
    content: [
      "The client is responsible for providing accurate event details (venue, schedule, guest list size, key moments) to ensure proper coverage. Any significant changes to event details must be communicated to us in writing at least fourteen (14) days in advance.",
      "The client agrees to ensure that MerryStory Productions personnel have reasonable access to the venue and all event areas required for coverage. We are not liable for missed shots or content resulting from restricted access.",
    ],
  },
  {
    title: "Deliverables & Timeline",
    content: [
      "Edited photos and/or video deliverables will be provided within the timeframe specified in your contract. Standard delivery timelines are 30–60 days for photos and 45–90 days for video, depending on the package.",
      "Deliverables are provided in digital format via a secure online gallery or download link unless physical media is included in your package. Raw, unedited files are not provided.",
    ],
  },
  {
    title: "Intellectual Property",
    content: [
      "MerryStory Productions retains full copyright ownership of all photographs, videos, and creative works produced during the event. Upon full payment, clients are granted a non-exclusive, non-transferable personal license to use the delivered media for personal, non-commercial purposes.",
      "Clients may share their event media on personal social media accounts with credit to MerryStory Productions. Commercial use, resale, or licensing of event media to third parties requires our prior written consent.",
    ],
  },
  {
    title: "Limitation of Liability",
    content: [
      "In the unlikely event of equipment failure, unforeseen circumstances, or other factors beyond our control, our maximum liability is limited to a refund of the amounts paid to MerryStory Productions.",
      "We are not liable for any indirect, incidental, special, or consequential damages arising from the use or inability to use our services. We strongly recommend clients obtain separate event insurance for additional protection.",
    ],
  },
  {
    title: "Force Majeure",
    content: [
      "Neither party shall be held liable for failure to perform obligations resulting from events beyond their reasonable control, including but not limited to natural disasters, government-imposed restrictions, pandemics, or extreme weather conditions.",
      "In such cases, both parties will work in good faith to reschedule the event at no additional rescheduling fee.",
    ],
  },
  {
    title: "Governing Law",
    content: [
      "These Terms of Service shall be governed by and construed in accordance with the laws of the Republic of the Philippines. Any disputes arising from these terms shall be resolved through good-faith negotiation and, if necessary, through appropriate legal channels.",
    ],
  },
  {
    title: "Contact & Amendments",
    content: [
      "MerryStory Productions reserves the right to update these Terms of Service at any time. Changes will be posted on our website with a revised effective date. Continued use of our services after changes are posted constitutes your acceptance of the revised terms.",
      "For questions regarding these Terms, please contact us at concierge@merrystory.com.",
    ],
  },
];

export default function TermsOfServicePage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero Banner */}
      <div className="pt-40 pb-16 bg-white overflow-hidden relative">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-10 2xl:px-16 w-full text-center">
          <span className="text-brand-yellow font-bold tracking-[0.2em] uppercase text-xs mb-4 block">
            Legal & Compliance
          </span>
          <h1 className="text-5xl md:text-6xl lg:text-[5.5rem] font-extrabold text-gray-900 leading-[1.05] tracking-tight mb-6">
            Terms of <span className="text-brand-yellow font-light italic font-serif">Service</span>
          </h1>
          <p className="text-[15px] text-gray-500 max-w-xl mx-auto leading-relaxed">
            Effective Date: January 1, 2025 &nbsp;·&nbsp; Last Updated: May 7, 2026
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 pb-32">
        {/* Intro */}
        <div className="mb-16 p-8 rounded-[4px] bg-gray-50 border border-gray-100 shadow-sm text-center">
          <p className="text-[16px] text-gray-600 leading-relaxed max-w-2xl mx-auto">
            Welcome to MerryStory Productions. These Terms of Service govern your
            relationship with us and outline the rights and responsibilities of
            both parties when you use our services. Please read them carefully
            before proceeding with a booking.
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-16">
          {sections.map((section, index) => (
            <div key={index}>
              <div className="flex items-center gap-4 mb-6 border-b border-gray-100 pb-4">
                <span className="text-brand-yellow font-light italic font-serif text-3xl">{(index + 1).toString().padStart(2, '0')}.</span>
                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{section.title}</h2>
              </div>
              <div className="space-y-5 pl-0 md:pl-12">
                {section.content.map((para, i) => (
                  <p key={i} className="text-[16px] text-gray-600 leading-relaxed">
                    {para}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer nav */}
        <div className="mt-24 pt-10 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-6">
          <Link
            href="/"
            className="text-[11px] tracking-[0.15em] uppercase font-bold text-gray-500 hover:text-brand-yellow transition-colors"
          >
            ← Back to Home
          </Link>
          <div className="flex items-center gap-8 text-[11px] tracking-[0.15em] uppercase font-bold">
            <Link href="/privacy-policy" className="text-gray-500 hover:text-brand-yellow transition-colors">
              Privacy Policy
            </Link>
            <Link href="/refund-policy" className="text-gray-500 hover:text-brand-yellow transition-colors">
              Refund Policy
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
