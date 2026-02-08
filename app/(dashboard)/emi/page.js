'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, PieChart } from 'lucide-react';
import { useSession } from "next-auth/react";
import Link from 'next/link';
import { showError, showDeleteConfirm, showToast } from '@/lib/sweetalert';

export default function EMIPage() {
  const { data: session } = useSession();
  const [emis, setEmis] = useState([]);
  const [optimization, setOptimization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ 
    name: '', 
    totalAmount: '', 
    monthlyAmount: '', 
    totalMonths: '', 
    interestRate: '',
    startDate: new Date().toISOString().split('T')[0] 
  });

  const fetchEmis = async () => {
    try {
      const res = await fetch('/api/emi');
      if (res.ok) {
        const data = await res.json();
        // Handle both old array format (fallback) and new object format
        if (Array.isArray(data)) {
            setEmis(data);
        } else {
            setEmis(data.emis || []);
            setOptimization(data.optimization);
        }
      }
    } catch (e) { console.error(e); } 
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (session) fetchEmis();
  }, [session]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/emi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setForm({ name: '', totalAmount: '', monthlyAmount: '', totalMonths: '', interestRate: '', startDate:  new Date().toISOString().split('T')[0] });
        fetchEmis();
        showToast('success', 'EMI added!');
      } else {
        showError('Error', 'Failed to add EMI');
      }
    } catch(e) {
      showError('Error', 'Failed to add EMI');
    }
  };

  const handleDelete = async (id) => {
    const result = await showDeleteConfirm('Delete EMI?', 'This action cannot be undone.');
    if (!result.isConfirmed) return;
    try {
      await fetch(`/api/emi?id=${id}`, { method: 'DELETE' });
      fetchEmis();
      showToast('success', 'EMI deleted!');
    } catch(e) {
      showError('Error', 'Failed to delete EMI');
    }
  };

  if (!session) return <div className="p-8">Please log in.</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8 px-1 sm:px-0">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
           <h1 className="text-2xl sm:text-3xl font-bold bg-clip-text text-transparent bg-linear-to-r from-orange-600 to-amber-500">
             Loan & EMI Manager
           </h1>
           <p className="text-slate-500 text-sm sm:text-base">EMI is long-term financial pressure. Track it carefully.</p>
        </div>
        <div className="p-3 sm:p-4 bg-orange-50 rounded-xl border border-orange-200">
           <p className="text-xs sm:text-sm text-orange-600 font-medium">Total Monthly EMI</p>
           <p className="text-xl sm:text-2xl font-bold text-orange-700">
             ₹{emis.reduce((acc, curr) => acc + curr.monthlyAmount, 0).toLocaleString()}
           </p>
        </div>
      </div>

      {/* Optimization Panel */}
      {optimization && (
        <div className="glass-panel p-4 sm:p-6 border-l-4 border-l-green-500 animate-in slide-in-from-top-4">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-2">
                <span className="text-2xl">💡</span> Smart Prepayment Strategy
            </h2>
            <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className="flex-1">
                    <p className="text-slate-600 mb-2">
                        We recommend prepaying <strong>{optimization.name}</strong> first.
                    </p>
                    <p className="text-sm text-slate-500 italic">
                        &quot;{optimization.reason}&quot;
                    </p>
                </div>
                <div className="bg-green-50 p-4 rounded-xl border border-green-100 min-w-[200px]">
                    <p className="text-xs text-green-700 uppercase font-bold">Potential Savings</p>
                    <p className="text-xl font-bold text-green-700">
                        {optimization.recommendedId ? `Save Interest` : 'Reduce Burden'}
                    </p>
                </div>
            </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Form */}
         <div className="lg:col-span-1 glass-panel p-6 h-fit">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-700">
               <Plus size={20} className="text-orange-500"/> Add New Loan
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1 pl-1">Loan Name</label>
                <input type="text" required placeholder="e.g. Home Loan" className="input-field" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1 pl-1">Total Loan Amount</label>
                <input type="number" required placeholder="0.00" className="input-field" value={form.totalAmount} onChange={e => setForm({...form, totalAmount: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-xs font-semibold uppercase text-slate-500 mb-1 pl-1">Monthly EMI</label>
                    <input type="number" placeholder="Auto-calc if empty" className="input-field" value={form.monthlyAmount} onChange={e => setForm({...form, monthlyAmount: e.target.value})} />
                 </div>
                 <div>
                    <label className="block text-xs font-semibold uppercase text-slate-500 mb-1 pl-1">Interest Rate %</label>
                    <input type="number" step="0.1" placeholder="e.g. 8.5" className="input-field" value={form.interestRate} onChange={e => setForm({...form, interestRate: e.target.value})} />
                 </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-xs font-semibold uppercase text-slate-500 mb-1 pl-1">Tot. Months</label>
                    <input type="number" required placeholder="12" className="input-field" value={form.totalMonths} onChange={e => setForm({...form, totalMonths: e.target.value})} />
                 </div>
                 <div>
                    <label className="block text-xs font-semibold uppercase text-slate-500 mb-1 pl-1">Start Date</label>
                    <input type="date" required className="input-field" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} />
                 </div>
              </div>
              
              <div className="text-xs text-slate-500 bg-blue-50 p-3 rounded-lg border border-blue-100 italic">
                💡 Leave <strong>Monthly EMI</strong> empty to auto-calculate it based on Amount, Rate & Months.
              </div>

              <button type="submit" className="btn-primary w-full bg-orange-500 hover:bg-orange-600 shadow-orange-500/30">
                Track EMI
              </button>
            </form>
         </div>

         {/* List */}
         <div className="lg:col-span-2 space-y-4">
            {emis.length === 0 && (
                <div className="glass-panel p-10 text-center text-slate-400">
                   No active EMIs found.
                </div>
            )}
            {emis.map(emi => {
               const paidAmount = emi.paidMonths * emi.monthlyAmount;
               const remainingAmount = emi.totalAmount - paidAmount;
               const progress = Math.min((emi.paidMonths / emi.totalMonths) * 100, 100);
               const isOptimized = optimization?.recommendedId === emi.id;

               return (
                 <div key={emi.id} className={`glass-card p-6 relative group border-l-4 ${isOptimized ? 'border-l-green-500 ring-2 ring-green-500/20' : 'border-l-transparent'}`}>
                    <button onClick={() => handleDelete(emi.id)} className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500">
                       <Trash2 size={18} />
                    </button>

                     <Link href={`/emi/${emi.id}`} className="block">
                        <div className="flex justify-between items-start mb-4">
                           <div className="flex items-center gap-3">
                              <div className={`p-3 rounded-lg ${isOptimized ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                                 <PieChart size={24} />
                              </div>
                              <div>
                                 <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                                    {emi.name}
                                    {isOptimized && <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full uppercase font-bold">Recommended</span>}
                                 </h3>
                                 <p className="text-sm text-slate-500">
                                    {emi.interestRate ? `${emi.interestRate}% Interest • ` : ''} 
                                    Started {new Date(emi.startDate).toLocaleDateString()}
                                 </p>
                              </div>
                           </div>
                           <div className="text-right">
                              <p className="text-xs text-slate-500 uppercase font-bold">Monthly Pay</p>
                              <p className="text-xl font-bold text-orange-600">₹{emi.monthlyAmount.toLocaleString()}</p>
                           </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mb-4">
                           <div className="flex justify-between text-sm mb-1">
                              <span className="text-slate-600 font-medium">Progress ({emi.paidMonths}/{emi.totalMonths} months)</span>
                              <span className="text-slate-600 font-bold">{progress.toFixed(1)}%</span>
                           </div>
                           <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                              <div className={`h-full ${isOptimized ? 'bg-green-500' : 'bg-orange-500'}`} style={{ width: `${progress}%` }}></div>
                           </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                           <div>
                              <p className="text-xs text-slate-400 uppercase">Paid So Far</p>
                              <p className="font-semibold text-green-600">₹{paidAmount.toLocaleString()}</p>
                           </div>
                           <div>
                              <p className="text-xs text-slate-400 uppercase">Remaining</p>
                              <p className="font-semibold text-slate-700">₹{remainingAmount.toLocaleString()}</p>
                           </div>
                        </div>
                     </Link>
                 </div>
               );
            })}
         </div>
      </div>
    </div>
  );
}
