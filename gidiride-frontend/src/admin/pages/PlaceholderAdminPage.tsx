import { ShieldAlert, Wrench, HardHat } from 'lucide-react';

export function PlaceholderAdminPage({ title, kicker }: { title: string; kicker: string }) {
  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto h-[80vh] flex items-center justify-center">
      <div className="bg-gray-900 border border-gray-800 rounded-3xl p-12 w-full text-center shadow-2xl relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#00A859] via-yellow-500 to-[#00A859]" />
        <div className="absolute -left-12 -bottom-12 w-48 h-48 bg-[#00A859]/5 rounded-full blur-3xl" />
        <div className="absolute -right-12 -top-12 w-48 h-48 bg-yellow-500/5 rounded-full blur-3xl" />
        
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-24 h-24 bg-gray-950 border border-gray-800 rounded-2xl flex items-center justify-center mb-8 shadow-inner">
            <HardHat className="w-10 h-10 text-yellow-500" />
          </div>
          
          <p className="text-yellow-500 font-bold text-xs tracking-widest uppercase mb-3 flex items-center justify-center gap-2">
            <Wrench className="w-3 h-3" /> Coming after Phase 1
          </p>
          
          <h2 className="text-4xl font-black text-white tracking-tight mb-4">
            {title}
          </h2>
          
          <p className="text-gray-400 text-lg mb-10 max-w-lg mx-auto">
            {kicker}
          </p>
          
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-950 border border-gray-800 rounded-full">
            <ShieldAlert className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-400">GidiRide build lane is marked, not mixed.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
