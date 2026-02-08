'use client';

import { AlertTriangle, AlertCircle, Info } from 'lucide-react';

/**
 * Stress Indicator v2
 * Shows financial stress level and signals
 */

export default function StressIndicator({ stressLevel, signals, isStressed }) {
  if (!stressLevel) return null;

  const stressConfig = {
    CALM: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-700',
      icon: '😌',
      label: 'Financially Calm',
    },
    LOW: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-700',
      icon: '🙂',
      label: 'Low Stress',
    },
    MODERATE: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-700',
      icon: '😐',
      label: 'Moderate Stress',
    },
    HIGH: {
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      text: 'text-orange-700',
      icon: '😟',
      label: 'High Stress',
    },
    CRITICAL: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-700',
      icon: '😰',
      label: 'Critical Stress',
    },
  };

  const config = stressConfig[stressLevel] || stressConfig.MODERATE;

  return (
    <div className={`rounded-2xl border ${config.border} ${config.bg} p-4`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{config.icon}</span>
          <div>
            <h3 className={`font-bold text-sm ${config.text}`}>{config.label}</h3>
            <p className="text-xs text-slate-500">Financial Stress Analysis</p>
          </div>
        </div>
        {isStressed && (
          <AlertTriangle className="text-orange-500 animate-pulse" size={20} />
        )}
      </div>

      {/* Signals */}
      {signals && signals.length > 0 && (
        <div className="space-y-2">
          {signals.slice(0, 3).map((signal, idx) => (
            <div
              key={idx}
              className={`p-2 rounded-lg text-xs ${
                signal.type === 'CRITICAL'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-orange-100 text-orange-700'
              }`}
            >
              <div className="flex items-start gap-2">
                {signal.type === 'CRITICAL' ? (
                  <AlertCircle size={14} className="mt-0.5 shrink-0" />
                ) : (
                  <Info size={14} className="mt-0.5 shrink-0" />
                )}
                <span>{signal.message}</span>
              </div>
            </div>
          ))}
          {signals.length > 3 && (
            <p className="text-xs text-slate-500 text-center">
              +{signals.length - 3} more signals
            </p>
          )}
        </div>
      )}

      {/* No stress message */}
      {(!signals || signals.length === 0) && (
        <p className="text-xs text-slate-500 text-center py-2">
          ✨ No financial stress signals detected
        </p>
      )}
    </div>
  );
}
