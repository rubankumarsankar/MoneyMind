"use client";
import { AlertCircle, CheckCircle, Info, Lightbulb, ChevronRight } from "lucide-react";

export default function SmartSuggestions({ suggestions }) {
  if (!suggestions || suggestions.length === 0) {
    return (
      <div className="text-center py-4 text-slate-400 text-sm">
        No suggestions at this time. Great job! 🎉
      </div>
    );
  }

  const getIcon = (type) => {
    switch (type) {
      case 'CRITICAL': return <AlertCircle size={18} />;
      case 'WARNING': return <AlertCircle size={18} />;
      case 'SUCCESS': return <CheckCircle size={18} />;
      default: return <Lightbulb size={18} />;
    }
  };

  const getStyle = (type) => {
    switch (type) {
      case 'CRITICAL': return 'bg-red-50 border-red-500 text-red-700';
      case 'WARNING': return 'bg-orange-50 border-orange-500 text-orange-700';
      case 'SUCCESS': return 'bg-green-50 border-green-500 text-green-700';
      default: return 'bg-blue-50 border-blue-500 text-blue-700';
    }
  };

  return (
    <div className="space-y-3">
      {suggestions.slice(0, 5).map((s, i) => (
        <div 
          key={i} 
          className={`p-3 rounded-lg border-l-4 shadow-sm ${getStyle(s.type)}`}
        >
            <div className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0">
                    {s.icon || getIcon(s.type)}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{s.message}</p>
                    {s.action && (
                      <p className="text-xs mt-1 opacity-80 flex items-center gap-1">
                        <ChevronRight size={12} />
                        {s.action}
                      </p>
                    )}
                </div>
            </div>
        </div>
      ))}
    </div>
  );
}

