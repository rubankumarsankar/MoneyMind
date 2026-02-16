"use client";
import { Wallet, AlertTriangle, Check } from "lucide-react";

export default function SafeSpendCard({ amount, status }) {
  // V3: Status-aware color schemes
  const getStyle = () => {
    switch (status) {
      case 'CRITICAL':
        return {
          bg: 'from-red-500 to-rose-600',
          icon: AlertTriangle,
          label: 'Budget Critical!',
        };
      case 'TIGHT':
        return {
          bg: 'from-orange-500 to-amber-600',
          icon: AlertTriangle,
          label: 'Budget Tight',
        };
      case 'OVERSPENT':
        return {
          bg: 'from-red-600 to-red-700',
          icon: AlertTriangle,
          label: 'Over Budget!',
        };
      default:
        return {
          bg: 'from-indigo-500 to-purple-600',
          icon: Wallet,
          label: 'Safe to Spend Daily',
        };
    }
  };

  const style = getStyle();
  const Icon = style.icon;

  return (
    <div className={`bg-linear-to-br ${style.bg} rounded-3xl p-6 text-white shadow-xl shadow-slate-200/50 relative overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl`}>
      <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
              <Icon size={20} className="opacity-80" />
              <span className="text-sm font-medium opacity-90">{style.label}</span>
          </div>
          <div className="text-4xl font-bold">
            ₹{amount ? amount.toLocaleString() : '0'}
          </div>
          <p className="text-xs opacity-75 mt-1">
            {status === 'HEALTHY' ? 'You\'re on track! 🎉' : 
             status === 'TIGHT' ? 'Slow down spending' :
             status === 'CRITICAL' ? 'Reduce spending immediately' :
             status === 'OVERSPENT' ? 'No budget remaining' :
             'based on remaining income'}
          </p>
      </div>
      
      {/* Status indicator */}
      {status === 'HEALTHY' && (
        <div className="absolute top-3 right-3 bg-white/20 rounded-full p-1">
          <Check size={16} />
        </div>
      )}
      
      {/* Decorative Circles */}
      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 rounded-full bg-white opacity-10"></div>
      <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-16 h-16 rounded-full bg-white opacity-10"></div>
    </div>
  );
}

