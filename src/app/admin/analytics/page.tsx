import { ArrowRight } from 'lucide-react';

export default function AnalyticsAdminPage() {
  return (
    <div className="w-full max-w-none text-[#1d1d1f] pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 pt-2">
        <div>
          <p className="text-[#a1a1aa] text-[10px] font-extrabold tracking-widest uppercase mb-3 flex items-center gap-2">
            Metrics <ArrowRight size={10} /> <span className="text-[#1d1d1f]">Performance Data</span>
          </p>
          <h1 className="text-5xl font-black text-[#1d1d1f] tracking-tight">
            Data <span className="text-[#eebf43] italic pr-2">Analytics</span>
          </h1>
          <p className="text-[#71717a] text-sm mt-4 max-w-md leading-relaxed font-medium">
            Monitor comprehensive client growth metrics. Visualize traffic and campaign engagement scores.
          </p>
        </div>
      </div>
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center min-h-[300px] gap-4">
        <h2 className="text-xl font-bold text-[#1d1d1f]">Under Construction</h2>
        <p className="text-[#71717a] font-medium">Advanced tracking features are being finalized.</p>
      </div>
    </div>
  );
}
