'use client';

import { useState, useEffect } from 'react';
import { Calendar, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

export default function FinancialProjection() {
    const [projection, setProjection] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/financial-projection')
            .then(res => res.json())
            .then(data => {
                if (data.projection) setProjection(data.projection);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    if (loading) return <div className="glass-panel p-6 animate-pulse h-64"></div>;
    if (!projection.length) return null;

    const getPriorityStyle = (priority) => {
        switch (priority) {
            case 'CRITICAL': return 'bg-red-50 text-red-700 border-red-100';
            case 'IMPORTANT': return 'bg-amber-50 text-amber-700 border-amber-100';
            default: return 'bg-slate-50 text-slate-600 border-slate-100';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900 font-heading">Upcoming Obligations</h2>
                <div className="flex gap-2 text-xs font-bold">
                    <span className="px-2 py-1 bg-red-50 text-red-600 rounded-lg border border-red-100">Critical</span>
                    <span className="px-2 py-1 bg-amber-50 text-amber-600 rounded-lg border border-amber-100">Important</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {projection.map((month, idx) => (
                    <div key={idx} className="glass-panel p-0 overflow-hidden flex flex-col h-full">
                        {/* Header */}
                        <div className={`p-4 border-b border-slate-100 ${idx === 0 ? 'bg-blue-50/50' : 'bg-slate-50/50'}`}>
                            <h3 className="font-bold text-lg text-slate-800 capitalize flex items-center gap-2">
                                <Calendar size={18} className={idx === 0 ? "text-blue-600" : "text-slate-400"} />
                                {month.month}
                            </h3>
                            <p className="text-sm text-slate-500 mt-1 font-medium">
                                Total Due: <span className="text-slate-900 font-bold">₹{month.totalAmount.toLocaleString()}</span>
                            </p>
                        </div>

                        {/* Payments List */}
                        <div className="p-4 space-y-3 flex-1 overflow-y-auto max-h-[400px] custom-scrollbar">
                            {month.payments.length > 0 ? (
                                month.payments.map((pay) => (
                                    <div key={pay.id} className={`p-3 rounded-xl border flex justify-between items-start group hover:shadow-md transition-all ${getPriorityStyle(pay.priority)}`}>
                                        <div>
                                            <p className="font-bold text-sm line-clamp-1">{pay.name}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-xs opacity-80 flex items-center gap-1">
                                                     <Clock size={10} />
                                                     Due {new Date(pay.date).getDate()}th
                                                </span>
                                                {pay.priority === 'CRITICAL' && (
                                                    <span className="text-[10px] bg-white/50 px-1.5 py-0.5 rounded-full font-bold border border-red-200">
                                                        MUST PAY
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-sm">₹{pay.amount.toLocaleString()}</p>
                                            <span className="text-[10px] opacity-70 uppercase tracking-wide">{pay.type}</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-slate-400 text-sm">
                                    No scheduled payments.
                                </div>
                            )}
                        </div>
                        
                        {/* Footer Summary */}
                        {month.payments.length > 0 && (
                             <div className="p-3 bg-slate-50/30 border-t border-slate-100 text-xs text-center text-slate-500 font-medium">
                                 {month.payments.filter(p => p.priority === 'CRITICAL').length} Critical Items
                             </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
