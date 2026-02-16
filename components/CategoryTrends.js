'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

/**
 * Category Trends Display v2
 * Shows spending trends per category with arrows and percentages
 */

export default function CategoryTrends({ trends }) {
  if (!trends || trends.length === 0) return null;

  const getTrendIcon = (trend) => {
    if (trend === 'INCREASING') return <TrendingUp size={14} className="text-red-500" />;
    if (trend === 'DECREASING') return <TrendingDown size={14} className="text-green-500" />;
    return <Minus size={14} className="text-slate-400" />;
  };

  const getTrendBg = (trend, alert) => {
    if (alert) return 'bg-red-50 border-red-200';
    if (trend === 'INCREASING') return 'bg-orange-50 border-orange-100';
    if (trend === 'DECREASING') return 'bg-green-50 border-green-100';
    return 'bg-slate-50 border-slate-100';
  };

  return (
    <div className="glass-panel p-6">
      <h3 className="font-bold text-slate-800 mb-4 font-heading text-lg">Spending Trends</h3>

      <div className="space-y-2 max-h-48 overflow-y-auto">
        {trends.slice(0, 6).map((trend, idx) => (
          <div
            key={idx}
            className={`flex items-center justify-between p-2 rounded-lg border ${getTrendBg(trend.trend, trend.alert)}`}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">{trend.signal}</span>
              <span className="text-sm font-medium text-slate-700 truncate max-w-[100px]">
                {trend.category}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {getTrendIcon(trend.trend)}
              <span className={`text-xs font-bold ${
                trend.changePercent > 0 ? 'text-red-600' :
                trend.changePercent < 0 ? 'text-green-600' : 'text-slate-500'
              }`}>
                {trend.changePercent > 0 ? '+' : ''}{Math.round(trend.changePercent)}%
              </span>
            </div>
          </div>
        ))}
      </div>

      {trends.length === 0 && (
        <p className="text-xs text-slate-500 text-center py-4">
          Not enough data for trend analysis
        </p>
      )}
    </div>
  );
}
