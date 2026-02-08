'use client';

import { useState, useEffect, use } from 'react';
import { useSession } from "next-auth/react";
import { ArrowLeft, Calendar, DollarSign, Percent, PieChart, Edit2, Save, X } from 'lucide-react';
import Link from 'next/link';
import { FinanceEngine } from '@/lib/finance';
import { showToast, showError } from '@/lib/sweetalert';

export default function EMIDetailPage({ params }) {
  const { id } = use(params);
  const { data: session } = useSession();
  const [emi, setEmi] = useState(null);
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    if (session && id) fetchEMIDetails();
  }, [session, id]);

  const fetchEMIDetails = async () => {
    try {
      const res = await fetch('/api/emi');
      if (res.ok) {
        const data = await res.json();
        const allEmis = Array.isArray(data) ? data : data.emis;
        // Fix: parse id to int for comparison
        const found = allEmis.find(e => e.id === parseInt(id));
        
        if (found) {
            if (!found.interestRate && found.monthlyAmount && found.totalAmount && found.totalMonths) {
                found.interestRate = FinanceEngine.calculateInterestRate(
                    found.totalAmount, 
                    found.monthlyAmount, 
                    found.totalMonths
                );
                found.isInferred = true;
            }

            setEmi(found);
            setEditForm({
              name: found.name,
              totalAmount: found.totalAmount,
              monthlyAmount: found.monthlyAmount,
              totalMonths: found.totalMonths,
              interestRate: found.interestRate || '',
              startDate: new Date(found.startDate).toISOString().split('T')[0],
              paidMonths: found.paidMonths || 0
            });
            
            const amortization = FinanceEngine.calculateAmortizationSchedule(
                found.totalAmount, 
                found.interestRate || 10, 
                found.totalMonths, 
                found.startDate,
                found.monthlyAmount 
            );
            setSchedule(amortization);
        }
      }
    } catch (e) { console.error(e); } 
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    try {
      const res = await fetch('/api/emi', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: parseInt(id), ...editForm }),
      });
      if (res.ok) {
        showToast('success', 'EMI updated successfully!');
        setIsEditing(false);
        fetchEMIDetails();
      } else {
        showError('Error', 'Failed to update EMI');
      }
    } catch (e) {
      showError('Error', 'Failed to update EMI');
    }
  };

  if (!session) return <div className="p-8">Please log in.</div>;
  if (loading) return <div className="p-8">Loading loan details...</div>;
  if (!emi) return <div className="p-8">Loan not found.</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8 px-1 sm:px-0 animate-in fade-in duration-500">
      <Link href="/emi" className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors">
        <ArrowLeft size={20} /> Back to Loans
      </Link>

      {/* Header Card with Edit Button */}
      <div className="glass-panel p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
            <PieChart size={120} className="text-blue-500" />
        </div>
        <div className="relative z-10">
            <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
              <div>
                {isEditing ? (
                  <input 
                    type="text" 
                    value={editForm.name} 
                    onChange={e => setEditForm({...editForm, name: e.target.value})}
                    className="text-2xl sm:text-3xl font-bold text-slate-800 bg-white border border-slate-300 rounded-lg px-3 py-1 w-full"
                  />
                ) : (
                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2">{emi.name}</h1>
                )}
              </div>
              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <button onClick={handleSave} className="btn-primary bg-green-600 hover:bg-green-700 flex items-center gap-2 text-sm">
                      <Save size={16} /> Save
                    </button>
                    <button onClick={() => setIsEditing(false)} className="btn-secondary flex items-center gap-2 text-sm">
                      <X size={16} /> Cancel
                    </button>
                  </>
                ) : (
                  <button onClick={() => setIsEditing(true)} className="btn-primary bg-blue-600 hover:bg-blue-700 flex items-center gap-2 text-sm">
                    <Edit2 size={16} /> Edit EMI
                  </button>
                )}
              </div>
            </div>

            {/* Editable Fields */}
            {isEditing ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Total Amount</label>
                  <input type="number" value={editForm.totalAmount} onChange={e => setEditForm({...editForm, totalAmount: e.target.value})} className="input-field" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Monthly EMI</label>
                  <input type="number" value={editForm.monthlyAmount} onChange={e => setEditForm({...editForm, monthlyAmount: e.target.value})} className="input-field" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Interest Rate %</label>
                  <input type="number" step="0.1" value={editForm.interestRate} onChange={e => setEditForm({...editForm, interestRate: e.target.value})} className="input-field" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Total Months</label>
                  <input type="number" value={editForm.totalMonths} onChange={e => setEditForm({...editForm, totalMonths: e.target.value})} className="input-field" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Paid Months</label>
                  <input type="number" value={editForm.paidMonths} onChange={e => setEditForm({...editForm, paidMonths: e.target.value})} className="input-field" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Start Date</label>
                  <input type="date" value={editForm.startDate} onChange={e => setEditForm({...editForm, startDate: e.target.value})} className="input-field" />
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-4 sm:gap-6 text-slate-600 mt-4">
                <div className="flex items-center gap-2">
                    <DollarSign size={18} className="text-green-500"/>
                    <span className="font-semibold">₹{emi.totalAmount.toLocaleString()}</span> Principal
                </div>
                <div className="flex items-center gap-2">
                    <Percent size={18} className="text-purple-500"/>
                    <span className="font-semibold">
                        {emi.interestRate || 'N/A'}%
                        {emi.isInferred && <span className="text-xs ml-1 text-slate-500 font-normal">(Implied)</span>}
                    </span> Interest Rate
                </div>
                <div className="flex items-center gap-2">
                    <Calendar size={18} className="text-orange-500"/>
                    <span className="font-semibold">{emi.totalMonths}</span> Months
                </div>
              </div>
            )}
        </div>
      </div>

      {/* Summary Stats */}
      {schedule && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <div className="glass-card p-4 sm:p-6 border-t-4 border-t-blue-500">
                <p className="text-xs font-bold text-slate-400 uppercase">Total Payment</p>
                <p className="text-xl sm:text-2xl font-bold text-slate-800 mt-1">
                    ₹{Math.round(schedule.totalPayment).toLocaleString()}
                </p>
                <p className="text-xs text-slate-400 mt-2">Principal + Interest</p>
            </div>
            <div className="glass-card p-4 sm:p-6 border-t-4 border-t-red-500">
                <p className="text-xs font-bold text-slate-400 uppercase">Total Interest</p>
                <p className="text-xl sm:text-2xl font-bold text-red-600 mt-1">
                    ₹{Math.round(schedule.totalInterest).toLocaleString()}
                </p>
                <p className="text-xs text-slate-400 mt-2">
                    {((schedule.totalInterest / schedule.totalPayment) * 100).toFixed(1)}% of total cost
                </p>
            </div>
            <div className="glass-card p-4 sm:p-6 border-t-4 border-t-green-500">
                <p className="text-xs font-bold text-slate-400 uppercase">Payoff Date</p>
                <p className="text-xl sm:text-2xl font-bold text-green-600 mt-1">
                    {schedule.schedule[schedule.schedule.length - 1]?.date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                </p>
                <p className="text-xs text-slate-400 mt-2"> Debt Free!</p>
            </div>
        </div>
      )}

      {/* Amortization Table */}
      <div className="glass-panel p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-bold text-slate-800 mb-4 sm:mb-6">Amortization Schedule</h2>
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-600">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                    <tr>
                        <th className="px-4 sm:px-6 py-3">Month</th>
                        <th className="px-4 sm:px-6 py-3">Payment</th>
                        <th className="px-4 sm:px-6 py-3">Principal</th>
                        <th className="px-4 sm:px-6 py-3">Interest</th>
                        <th className="px-4 sm:px-6 py-3">Balance</th>
                    </tr>
                </thead>
                <tbody>
                    {schedule?.schedule.map((row) => (
                        <tr key={row.month} className="border-b border-slate-100 hover:bg-slate-50/50">
                            <td className="px-4 sm:px-6 py-4 font-medium whitespace-nowrap">
                                {row.date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                            </td>
                            <td className="px-4 sm:px-6 py-4">₹{Math.round(row.emi).toLocaleString()}</td>
                            <td className="px-4 sm:px-6 py-4 text-green-600">₹{Math.round(row.principal).toLocaleString()}</td>
                            <td className="px-4 sm:px-6 py-4 text-red-500">₹{Math.round(row.interest).toLocaleString()}</td>
                            <td className="px-4 sm:px-6 py-4 font-bold">₹{Math.round(row.balance).toLocaleString()}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
}

