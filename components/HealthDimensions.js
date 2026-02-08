'use client';

/**
 * Health Dimensions Display v2
 * Shows 5-dimension health radar: Liquidity, Stability, Risk, Discipline, Growth
 */

export default function HealthDimensions({ dimensions, overallScore }) {
  if (!dimensions) return null;

  const dimensionList = [
    { key: 'liquidity', ...dimensions.liquidity },
    { key: 'stability', ...dimensions.stability },
    { key: 'risk', ...dimensions.risk },
    { key: 'discipline', ...dimensions.discipline },
    { key: 'growth', ...dimensions.growth },
  ];

  const getScoreColor = (score) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-blue-500';
    if (score >= 40) return 'bg-yellow-500';
    if (score >= 20) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getScoreTextColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    if (score >= 20) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-slate-700">Health Dimensions</h3>
        <div className={`text-sm font-bold px-3 py-1 rounded-full ${
          overallScore >= 70 ? 'bg-green-100 text-green-700' :
          overallScore >= 50 ? 'bg-yellow-100 text-yellow-700' :
          'bg-red-100 text-red-700'
        }`}>
          {overallScore}/100
        </div>
      </div>

      <div className="space-y-3">
        {dimensionList.map(dim => (
          <div key={dim.key} className="flex items-center gap-3">
            <span className="text-lg w-8">{dim.icon}</span>
            <div className="flex-1">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-600 font-medium">{dim.label}</span>
                <span className={`font-bold ${getScoreTextColor(dim.score)}`}>
                  {dim.score}%
                </span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${getScoreColor(dim.score)} transition-all duration-500 rounded-full`}
                  style={{ width: `${dim.score}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-3 border-t border-slate-100">
        <div className="flex flex-wrap gap-2 text-[10px] text-slate-500">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500"></span> Excellent
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span> Good
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-yellow-500"></span> Fair
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500"></span> Needs Attention
          </span>
        </div>
      </div>
    </div>
  );
}
