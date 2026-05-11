import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Refund & Cancellation Policy | MerryStory Productions",
  description:
    "Understand MerryStory Productions' refund, cancellation, and rescheduling policy before booking your event.",
};

const sections = [
  {
    title: "Deposit & Booking Fee",
    content: [
      "A non-refundable booking deposit of fifty percent (50%) of the total package price is required to secure your event date. This deposit reserves our team exclusively for your event and covers early planning, preparation, and scheduling costs.",
      "The deposit is non-refundable under all circumstances, including client-initiated cancellations. It may, however, be applied toward a rescheduled event date under the conditions described in Section 3.",
    ],
  },
  {
    title: "Cancellation by the Client",
    content: [
      "All cancellation requests must be submitted in writing via email to concierge@merrystory.com. Verbal cancellations are not accepted. The cancellation is effective only upon written acknowledgment from MerryStory Productions.",
      "The following cancellation schedule applies to the remaining balance (excluding the non-refundable deposit):",
    ],
    table: [
      { when: "61+ days before event", refund: "Full refund of remaining balance" },
      { when: "31–60 days before event", refund: "50% refund of remaining balance" },
      { when: "15–30 days before event", refund: "25% refund of remaining balance" },
      { when: "14 days or fewer before event", refund: "No refund of remaining balance" },
    ],
  },
  {
    title: "Rescheduling",
    content: [
      "Clients may request to reschedule their event date at no additional rescheduling fee, provided the request is made at least thirty (30) days before the original event date and is subject to MerryStory Productions' availability.",
      "Your booking deposit will be fully transferred to the new event date. Rescheduling requests made fewer than 30 days before the event are subject to a rescheduling fee of 15% of the total package price and are subject to our availability.",
      "Each booking is entitled to one (1) complimentary reschedule. Additional rescheduling requests will incur a fee.",
    ],
  },
  {
    title: "Cancellation by MerryStory Productions",
    content: [
      "In the rare event that MerryStory Productions must cancel a confirmed booking due to circumstances within our control (e.g., team emergency, equipment failure with no viable replacement), we will notify you immediately and issue a full refund of all amounts paid, including the deposit.",
      "We will also make every reasonable effort to refer you to a trusted partner studio to minimize disruption to your event.",
    ],
  },
  {
    title: "Force Majeure",
    content: [
      "Events beyond the control of either party — including but not limited to natural disasters, typhoons, government-imposed lockdowns, pandemics, or national emergencies — will not be treated as standard cancellations.",
      "In such cases, your deposit will be converted into a booking credit valid for twelve (12) months from the original event date, and no rescheduling fee will apply. We are committed to working with you in good faith during extraordinary circumstances.",
    ],
  },
  {
    title: "Partial Service Refunds",
    content: [
      "If MerryStory Productions is only able to partially deliver the agreed services due to circumstances within our control (e.g., significant delay, equipment malfunction resulting in incomplete coverage), we will assess the situation on a case-by-case basis and issue a proportional partial refund.",
      "Partial refund requests must be submitted in writing within fourteen (14) days of the event date. Requests submitted after this window may not be honored.",
    ],
  },
  {
    title: "Refund Processing",
    content: [
      "Approved refunds will be processed within fourteen (14) to thirty (30) business days from the date of cancellation confirmation. Refunds are issued via the same payment method used for the original transaction unless otherwise agreed.",
      "MerryStory Productions is not responsible for delays caused by banking institutions or payment processors.",
    ],
  },
  {
    title: "Package Downgrades",
    content: [
      "Clients may request to downgrade their package up to thirty (30) days before the event date. The difference in price (excluding the original deposit) will be refunded according to the schedule in Section 2.",
      "Package upgrades are welcome at any time before the event, subject to availability and payment of the additional amount.",
    ],
  },
  {
    title: "Contact Us",
    content: [
      "For all cancellation, rescheduling, or refund inquiries, please contact us at concierge@merrystory.com. We are committed to handling all requests with fairness, transparency, and genuine care for your experience.",
    ],
  },
];

export default function RefundPolicyPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero Banner */}
      <div className="pt-40 pb-16 bg-white overflow-hidden relative">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-10 2xl:px-16 w-full text-center">
          <span className="text-brand-yellow font-bold tracking-[0.2em] uppercase text-xs mb-4 block">
            Legal & Compliance
          </span>
          <h1 className="text-5xl md:text-6xl lg:text-[5.5rem] font-extrabold text-gray-900 leading-[1.05] tracking-tight mb-6">
            Refund & Cancellation <br />
            <span className="text-brand-yellow font-light italic font-serif inline-block mt-2">Policy</span>
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
            At MerryStory Productions, we understand that plans can change. This
            policy outlines our terms for cancellations, rescheduling, and
            refunds. We ask that all clients read and understand this policy
            before confirming a booking. By signing a contract with us, you
            agree to the terms below.
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

                {/* Refund Schedule Table */}
                {section.table && (
                  <div className="mt-8 overflow-hidden rounded-[4px] border border-gray-100 shadow-sm">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 text-gray-900 border-b border-gray-200">
                          <th className="px-6 py-4 text-left font-bold tracking-wide uppercase text-xs">
                            Cancellation Timing
                          </th>
                          <th className="px-6 py-4 text-left font-bold tracking-wide uppercase text-xs">
                            Refund Entitlement
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {section.table.map((row, i) => (
                          <tr
                            key={i}
                            className={`border-t border-gray-100 transition-colors ${i % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                              }`}
                          >
                            <td className="px-6 py-4 text-gray-800 font-semibold">
                              {row.when}
                            </td>
                            <td className="px-6 py-4 text-gray-600">
                              {row.refund}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Highlight Box */}
        <div className="mt-20 p-8 rounded-[4px] bg-white border border-brand-yellow/30 shadow-lg text-center">
          <h3 className="font-bold text-xl text-gray-900 mb-3 tracking-tight">Questions about your booking?</h3>
          <p className="text-gray-600 text-[15px] leading-relaxed max-w-xl mx-auto">
            We&apos;re always happy to discuss your specific situation. Reach out to us
            directly at{" "}
            <a
              href="mailto:merrystoryeventservices@gmail.com"
              className="text-brand-yellow font-bold hover:text-yellow-600 transition-colors"
            >
              merrystoryeventservices@gmail.com
            </a>{" "}
            and we&apos;ll work with you personally.
          </p>
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
            <Link href="/terms-of-service" className="text-gray-500 hover:text-brand-yellow transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
