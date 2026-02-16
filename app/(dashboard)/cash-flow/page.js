'use client';

import { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import { ArrowRight, Wallet, TrendingUp, TrendingDown, Building2, ArrowDown } from 'lucide-react';

export default function CashFlowPage() {
  const { data: session } = useSession();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session) {
        fetch('/api/cash-flow')
            .then(res => res.json())
            .then(d => { setData(d); setLoading(false); })
            .catch(e => setLoading(false));
    }
  }, [session]);

  const StatCard = ({ title, amount, icon: Icon, color, bg }) => (
    <div className={`p-6 rounded-2xl border ${bg} flex items-center gap-4 shadow-sm`}>
        <div className={`p-4 rounded-xl ${color} bg-white/50 backdrop-blur-sm`}>
            <Icon size={24} />
        </div>
        <div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">{title}</p>
            <p className={`text-2xl font-bold ${color.replace('bg-', 'text-')}`}>
                ₹{amount?.toLocaleString() || '0'}
            </p>
        </div>
    </div>
  );

  if (loading) return <div className="p-8 text-center animate-pulse">Loading Financial Flow...</div>;
  if (!session) return <div className="p-8">Please log in.</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8 px-4 sm:px-0">
        <div>
           <h1 className="text-3xl font-bold text-slate-800">Unified Cash Flow</h1>
           <p className="text-slate-500">Visualizing how your money moves this month.</p>
        </div>

        {/* Top Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard title="Income" amount={data?.income} icon={TrendingUp} color="text-green-600" bg="bg-green-50 border-green-100" />
            <StatCard title="Net Balance" amount={data?.balance} icon={Wallet} color="text-blue-600" bg="bg-blue-50 border-blue-100" />
            <StatCard title="Expenses" amount={data?.expenses} icon={TrendingDown} color="text-red-600" bg="bg-red-50 border-red-100" />
            <StatCard title="EMI Paid" amount={data?.emi} icon={Building2} color="text-orange-600" bg="bg-orange-50 border-orange-100" />
        </div>

        {/* Visual Flow Diagram */}
        <div className="relative py-8">
            <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-slate-200 -z-10 transform -translate-x-1/2 hidden md:block"></div>

            <div className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-0">
                {/* 1. Income Source */}
                <div className="w-full md:w-1/3 flex flex-col items-center text-center">
                    <div className="glass-panel p-6 w-full relative group">
                        <div className="absolute -right-3 top-1/2 transform -translate-y-1/2 z-10 hidden md:block">
                            <ArrowRight size={24} className="text-slate-400" />
                        </div>
                        <h3 className="text-green-600 font-bold mb-1">INCOME +</h3>
                        <p className="text-2xl font-bold text-slate-800">₹{data?.income.toLocaleString()}</p>
                        <p className="text-xs text-slate-400 mt-2">Salary, Freelance, etc.</p>
                    </div>
                    <div className="block md:hidden my-2 text-slate-300"><ArrowDown /></div>
                </div>

                {/* 2. Central Hub (Accounts) */}
                <div className="w-full md:w-1/3 flex flex-col items-center z-20">
                     <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-2xl w-full text-center relative border-4 border-white">
                        <Wallet size={32} className="mx-auto mb-2 text-blue-400" />
                        <h3 className="text-blue-200 text-sm font-bold uppercase tracking-widest mb-1">Current Pool</h3>
                        <p className="text-4xl font-bold">₹{data?.balance.toLocaleString()}</p>
                        <p className="text-slate-400 text-xs mt-2">{data?.accounts.length} Linked Accounts</p>
                     </div>
                     <div className="block md:hidden my-2 text-slate-300"><ArrowDown /></div>
                </div>

                {/* 3. Outflow */}
                <div className="w-full md:w-1/3 space-y-4">
                    <div className="glass-panel p-5 w-full relative border-l-4 border-l-red-500">
                         <div className="absolute -left-3 top-1/2 transform -translate-y-1/2 z-10 hidden md:block">
                             <ArrowRight size={24} className="text-slate-400" />
                         </div>
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="text-red-500 font-bold text-sm">EXPENSES -</h3>
                                <p className="text-lg font-bold text-slate-800">₹{data?.expenses.toLocaleString()}</p>
                            </div>
                            <TrendingDown className="text-red-200" size={24} />
                        </div>
                    </div>

                    <div className="glass-panel p-5 w-full relative border-l-4 border-l-orange-500">
                        <div className="absolute -left-3 top-1/2 transform -translate-y-1/2 z-10 hidden md:block">
                            <ArrowRight size={24} className="text-slate-400" />
                        </div>
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="text-orange-500 font-bold text-sm">EMI -</h3>
                                <p className="text-lg font-bold text-slate-800">₹{data?.emi.toLocaleString()}</p>
                            </div>
                            <Building2 className="text-orange-200" size={24} />
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Detailed Accounts */}
        <div className="glass-panel p-6">
            <h3 className="font-bold text-lg text-slate-700 mb-4">Account Breakdown</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {data?.accounts.map((acc, i) => (
                    <div key={i} className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex justify-between items-center">
                        <div>
                            <p className="font-bold text-slate-700">{acc.name}</p>
                            <p className="text-xs text-slate-500 uppercase">{acc.type}</p>
                        </div>
                        <p className="font-bold text-slate-900">₹{acc.balance.toLocaleString()}</p>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
}
