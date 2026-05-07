import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | MerryStory Productions",
  description:
    "Learn how MerryStory Productions collects, uses, and protects your personal information.",
};

const sections = [
  {
    title: "Information We Collect",
    content: [
      "When you inquire about or book our services, we collect personal information such as your full name, email address, phone number, and event details (date, type, and location). We may also collect billing and payment information as required to process deposits and payments.",
      "We collect this information directly from you via our contact form, email correspondence, or in-person meetings. We do not collect information from third-party sources without your explicit consent.",
    ],
  },
  {
    title: "How We Use Your Information",
    content: [
      "We use your personal information solely to deliver our event production and photography services. Specifically, we use it to: respond to your inquiries, prepare proposals and contracts, coordinate event logistics, process payments, and communicate updates about your event.",
      "With your prior written consent, we may also use photos and videos captured at your event for our portfolio, website, and social media marketing. You always have the right to opt out of this use at any time.",
    ],
  },
  {
    title: "Data Sharing & Disclosure",
    content: [
      "We do not sell, trade, or rent your personal information to third parties. We may share your information only with trusted vendors and subcontractors (e.g., photographers, videographers, coordinators) who are directly involved in delivering your event services and are bound by confidentiality obligations.",
      "We may also disclose your information if required by law, court order, or governmental regulation, or to protect the rights and safety of MerryStory Productions and its clients.",
    ],
  },
  {
    title: "Data Retention",
    content: [
      "We retain your personal data for as long as necessary to fulfill the purposes outlined in this policy, maintain accurate business records, and comply with legal obligations. Contract and payment records are typically retained for seven (7) years in accordance with standard accounting practices.",
      "Photographic and video content captured at your event may be retained in our archive indefinitely unless you request its deletion in writing.",
    ],
  },
  {
    title: "Your Rights",
    content: [
      "You have the right to access, correct, or request deletion of the personal data we hold about you. To exercise these rights, please contact us at the email address below. We will respond to all requests within 30 days.",
      "You also have the right to withdraw your consent for marketing use of your event media at any time, without affecting the lawfulness of any prior use.",
    ],
  },
  {
    title: "Security",
    content: [
      "We implement reasonable technical and organizational measures to protect your personal information from unauthorized access, alteration, disclosure, or destruction. All digital files and client data are stored on secured systems with restricted access.",
      "While we strive to protect your data, no method of transmission over the Internet or electronic storage is 100% secure. We encourage you to contact us directly if you have security concerns.",
    ],
  },
  {
    title: "Contact Us",
    content: [
      "If you have any questions or concerns about this Privacy Policy or the way we handle your personal data, please reach out to us at concierge@merrystory.com. We are committed to addressing your concerns promptly and transparently.",
    ],
  },
];

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero Banner */}
      <div className="pt-40 pb-16 bg-white overflow-hidden relative">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-10 2xl:px-16 w-full text-center">
          <span className="text-brand-yellow font-bold tracking-[0.2em] uppercase text-xs mb-4 block">
            Legal & Compliance
          </span>
          <h1 className="text-5xl md:text-6xl lg:text-[5.5rem] font-extrabold text-gray-900 leading-[1.05] tracking-tight mb-6">
            Privacy <span className="text-brand-yellow font-light italic font-serif">Policy</span>
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
            MerryStory Productions (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;) is committed to protecting your
            privacy. This Privacy Policy explains how we collect, use, disclose,
            and safeguard your information when you engage with our services or
            visit our website. Please read this policy carefully.
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
            <Link href="/terms-of-service" className="text-gray-500 hover:text-brand-yellow transition-colors">
              Terms of Service
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
