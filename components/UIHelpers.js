'use client';

export function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  action, 
  actionLabel 
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {Icon && (
        <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <Icon size={40} className="text-slate-400" />
        </div>
      )}
      <h3 className="text-lg font-bold text-slate-700 mb-2">{title}</h3>
      <p className="text-sm text-slate-500 max-w-sm mb-6">{description}</p>
      {action && (
        <button 
          onClick={action}
          className="btn-primary px-6 py-3 font-bold"
        >
          {actionLabel || 'Get Started'}
        </button>
      )}
    </div>
  );
}

export function LoadingSpinner({ text = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-sm text-slate-500">{text}</p>
    </div>
  );
}

export function LoadingSkeleton({ lines = 3 }) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-4 bg-slate-200 rounded-lg" style={{ width: `${100 - (i * 10)}%` }}></div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="glass-card p-6 animate-pulse">
      <div className="h-4 bg-slate-200 rounded w-24 mb-4"></div>
      <div className="h-8 bg-slate-200 rounded w-32 mb-2"></div>
      <div className="h-3 bg-slate-200 rounded w-20"></div>
    </div>
  );
}

export function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  trendValue,
  color = 'blue' 
}) {
  const colors = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', icon: 'bg-blue-100' },
    green: { bg: 'bg-green-50', text: 'text-green-600', icon: 'bg-green-100' },
    red: { bg: 'bg-red-50', text: 'text-red-600', icon: 'bg-red-100' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', icon: 'bg-purple-100' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600', icon: 'bg-amber-100' },
  };
  const c = colors[color] || colors.blue;

  return (
    <div className="glass-card p-5 flex items-start gap-4 hover:shadow-lg transition-shadow">
      {Icon && (
        <div className={`p-3 rounded-xl ${c.icon} ${c.text}`}>
          <Icon size={22} />
        </div>
      )}
      <div className="flex-1">
        <p className="text-xs font-bold uppercase text-slate-400 mb-1">{title}</p>
        <p className={`text-2xl font-bold text-slate-800`}>{value}</p>
        {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
        {trend && (
          <div className={`text-xs mt-2 flex items-center gap-1 ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
            {trend === 'up' ? '↑' : '↓'} {trendValue}
          </div>
        )}
      </div>
    </div>
  );
}

export function ProgressBar({ value, max, color = 'blue', showLabel = true }) {
  const percentage = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const colors = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
    amber: 'bg-amber-500',
    purple: 'bg-purple-500',
  };

  return (
    <div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div 
          className={`h-full ${colors[color] || colors.blue} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <div className="flex justify-between text-xs text-slate-500 mt-1">
          <span>{value.toLocaleString()}</span>
          <span>{max.toLocaleString()}</span>
        </div>
      )}
    </div>
  );
}

export function Tooltip({ children, text }) {
  return (
    <div className="relative group inline-block">
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
        {text}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
      </div>
    </div>
  );
}

export function Badge({ children, variant = 'default' }) {
  const variants = {
    default: 'bg-slate-100 text-slate-700',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-amber-100 text-amber-700',
    danger: 'bg-red-100 text-red-700',
    info: 'bg-blue-100 text-blue-700',
  };

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${variants[variant] || variants.default}`}>
      {children}
    </span>
  );
}

export function HelpText({ children }) {
  return (
    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
      <span className="text-blue-400">ℹ</span> {children}
    </p>
  );
}
