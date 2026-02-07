import { DollarSign, Target } from "lucide-react";

interface SalesTargetCardProps {
  currentYearRevenue: number;
  targetAmount?: number;
}

function formatNumber(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M";
  if (n >= 1_000) return n.toLocaleString("en-MY");
  return n.toFixed(2);
}

export function SalesTargetCard({ currentYearRevenue, targetAmount = 1_000_000 }: SalesTargetCardProps) {
  const remaining = Math.max(0, targetAmount - currentYearRevenue);
  const progress = Math.min(100, (currentYearRevenue / targetAmount) * 100);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-600 to-rose-700 p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      {/* Decorations */}
      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 rounded-full bg-white/10" />
      <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-32 h-32 rounded-full bg-white/5" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-white/90">🎯 Target Jualan 2026</p>
          <div className="p-2 rounded-lg bg-white/20">
            <Target className="h-5 w-5 text-white" />
          </div>
        </div>
        
        <p className="text-2xl font-bold tracking-tight mb-1">
          RM{formatNumber(targetAmount)}
        </p>
        
        {/* Progress Bar */}
        <div className="w-full bg-white/20 rounded-full h-2.5 mb-3">
          <div 
            className="bg-white rounded-full h-2.5 transition-all duration-500" 
            style={{ width: `${progress}%` }}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/10 rounded-lg p-2">
            <p className="text-[10px] text-white/70 mb-0.5">Jualan Semasa</p>
            <p className="text-sm font-bold">RM{formatNumber(currentYearRevenue)}</p>
          </div>
          <div className="bg-white/10 rounded-lg p-2">
            <p className="text-[10px] text-white/70 mb-0.5">Baki Perlu Kejar</p>
            <p className="text-sm font-bold">RM{formatNumber(remaining)}</p>
          </div>
        </div>
        
        <p className="text-xs text-white/60 mt-2 text-center">
          {progress.toFixed(1)}% tercapai
        </p>
      </div>
    </div>
  );
}
