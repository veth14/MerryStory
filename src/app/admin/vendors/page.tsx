import { ArrowRight } from 'lucide-react';

export default function VendorsAdminPage() {
  return (
    <div className="w-full max-w-none text-[#1d1d1f] pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 pt-2">
        <div>
          <p className="text-[#a1a1aa] text-[10px] font-extrabold tracking-widest uppercase mb-3 flex items-center gap-2">
            Network <ArrowRight size={10} /> <span className="text-[#1d1d1f]">Supplier Roster</span>
          </p>
          <h1 className="text-5xl font-black text-[#1d1d1f] tracking-tight">
            Vendor <span className="text-[#eebf43] italic pr-2">Directory</span>
          </h1>
          <p className="text-[#71717a] text-sm mt-4 max-w-md leading-relaxed font-medium">
            Browse reliable partners. Review ratings, availability schedules, and direct contact protocols.
          </p>
        </div>
      </div>
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center min-h-[300px] gap-4">
        <h2 className="text-xl font-bold text-[#1d1d1f]">Under Construction</h2>
        <p className="text-[#71717a] font-medium">Directory migration is ongoing.</p>
      </div>
    </div>
  );
}
