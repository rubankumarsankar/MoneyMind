'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Wallet } from 'lucide-react';
import { useSession } from "next-auth/react";
import { showError, showDeleteConfirm, showToast } from '@/lib/sweetalert';

export default function IncomePage() {
  const { data: session } = useSession();
  const [incomes, setIncomes] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    amount: '',
    source: '',
    date: new Date().toISOString().split('T')[0],
    accountId: ''
  });

  const fetchData = async () => {
    try {
      const [incRes, accRes] = await Promise.all([
          fetch('/api/income'),
          fetch('/api/accounts')
      ]);
      
      if (incRes.ok) setIncomes(await incRes.json());
      if (accRes.ok) setAccounts(await accRes.json());
    } catch (error) {
      console.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) fetchData();
  }, [session]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const method = editingId ? 'PUT' : 'POST';
      const body = editingId ? { ...formData, id: editingId } : formData;

      const res = await fetch('/api/income', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setFormData({ amount: '', source: '', date: new Date().toISOString().split('T')[0], accountId: '' });
        setEditingId(null);
        fetchData();
        showToast('success', editingId ? 'Income updated!' : 'Income added!');
      } else {
        showError('Error', 'Failed to save income');
      }
    } catch (error) {
      showError('Error', 'Failed to save income');
    }
  };

  const handleEdit = (income) => {
    setFormData({
      amount: income.amount,
      source: income.source,
      date: new Date(income.date).toISOString().split('T')[0],
      accountId: income.accountId || ''
    });
    setEditingId(income.id);
  };

  const deleteIncome = async (id) => {
    const result = await showDeleteConfirm('Delete Income?', 'If linked to an account, this will revert the balance.');
    if (!result.isConfirmed) return;
    try {
       await fetch(`/api/income?id=${id}`, { method: 'DELETE' });
       fetchData();
       showToast('success', 'Income deleted!');
    } catch (error) {
       showError('Error', 'Failed to delete income');
    }
  };

  if (!session) return <div className="p-8">Please log in to manage income.</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 px-1 sm:px-0">
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
        <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-clip-text text-transparent bg-linear-to-r from-green-600 to-teal-500">
            Income Source
            </h1>
            <p className="text-slate-500 text-sm sm:text-base">Track your earnings and deposits.</p>
        </div>
        <div className="p-3 sm:p-4 bg-green-50 rounded-xl border border-green-200 sm:text-right">
           <p className="text-xs text-green-600 font-bold uppercase tracking-wider">Total Income</p>
           <p className="text-2xl sm:text-3xl font-bold text-green-700">
             ₹{incomes.reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}
           </p>
        </div>
      </div>

      {/* Add/Edit Income Form */}
      <div className="glass-panel p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-bold mb-4 flex items-center gap-2">
          <Plus size={20} className="text-green-600"/> {editingId ? 'Edit Income' : 'Add New Income'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1 pl-1">Source Name</label>
                <input
                type="text"
                required
                placeholder="e.g. Salary, Freelance"
                className="input-field"
                value={formData.source}
                onChange={e => setFormData({...formData, source: e.target.value})}
                />
            </div>
            <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1 pl-1">Amount</label>
                <input
                type="number"
                required
                placeholder="0.00"
                className="input-field"
                value={formData.amount}
                onChange={e => setFormData({...formData, amount: e.target.value})}
                />
            </div>
            <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1 pl-1">Date</label>
                <input
                type="date"
                required
                className="input-field"
                value={formData.date}
                onChange={e => setFormData({...formData, date: e.target.value})}
                />
            </div>
            <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1 pl-1">Deposit To (Optional)</label>
                <select 
                    className="input-field" 
                    value={formData.accountId}
                    onChange={e => setFormData({...formData, accountId: e.target.value})}
                >
                    <option value="">No Deposit (Track Only)</option>
                    {accounts.map(acc => (
                        <option key={acc.id} value={acc.id}>{acc.name} (₹{acc.balance.toLocaleString()})</option>
                    ))}
                </select>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button type="submit" className="flex-1 btn-primary h-12 flex items-center justify-center gap-2 font-bold text-base bg-green-600 hover:bg-green-700 shadow-green-500/30">
               {editingId ? 'Update Income' : 'Add Income & Update Balance'}
            </button>
            {editingId && (
              <button 
                type="button" 
                onClick={() => {
                  setEditingId(null);
                  setFormData({ amount: '', source: '', date: new Date().toISOString().split('T')[0], accountId: '' });
                }}
                className="px-6 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Income List */}
      <div className="glass-panel p-6">
        <h2 className="text-lg font-bold mb-4 text-slate-700">Recent Income</h2>
        {loading ? (
          <p>Loading...</p>
        ) : incomes.length === 0 ? (
          <p className="text-slate-500 text-center py-8">No income records found.</p>
        ) : (
          <div className="space-y-3">
             {incomes.map(income => (
                 <div key={income.id} className="flex items-center justify-between p-4 bg-white/40 hover:bg-white/80 rounded-xl transition-all border border-transparent hover:border-green-100 group">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-lg">
                            {income.source.substring(0,1).toUpperCase()}
                        </div>
                        <div>
                            <p className="font-bold text-slate-800">{income.source}</p>
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                <span>{new Date(income.date).toLocaleDateString()}</span>
                                {income.account && (
                                    <span className="flex items-center gap-1 bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md font-bold">
                                        <Wallet size={12}/> {income.account.name}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-xl font-bold text-green-600">+₹{income.amount.toLocaleString()}</p>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex justify-end gap-2 mt-1">
                             <button onClick={() => deleteIncome(income.id)} className="text-xs text-red-500 hover:underline">Delete</button>
                        </div>
                    </div>
                 </div>
             ))}
          </div>
        )}
      </div>
    </div>
  );
}
