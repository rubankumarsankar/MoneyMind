'use client';

import { useState, useEffect, useCallback } from 'react';
import { ArrowLeftRight, Check, X } from 'lucide-react';
import { useSession } from "next-auth/react";
import { showToast, showError } from '@/lib/sweetalert';

export default function BorrowPage() {
  const { data: session } = useSession();
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ type: 'GAVE', personName: '', amount: '' });

  const fetchItems = useCallback(async () => {
    const res = await fetch('/api/borrow');
    if (res.ok) setItems(await res.json());
  }, []);

  useEffect(() => {
    if (session) fetchItems();
  }, [session, fetchItems]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await fetch('/api/borrow', {
          method: 'POST',
          body: JSON.stringify(form)
      });
      setForm({ ...form, personName: '', amount: '' });
      fetchItems();
      showToast('success', 'Record added!');
    } catch(e) {
      showError('Error', 'Failed to add record');
    }
  };

  const markPaid = async (id) => {
    try {
      await fetch('/api/borrow', {
          method: 'PATCH',
          body: JSON.stringify({ id, status: 'PAID' })
      });
      fetchItems();
      showToast('success', 'Marked as settled!');
    } catch(e) {
      showError('Error', 'Failed to update');
    }
  };

  if(!session) return <div className="p-8">Please log in.</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 px-1 sm:px-0">
       <h1 className="text-2xl sm:text-3xl font-bold bg-clip-text text-transparent bg-linear-to-r from-indigo-600 to-violet-500">
         Borrow & Lend Tracker
       </h1>
       <p className="text-slate-500 text-sm sm:text-base">Informal loans are usually forgotten. Log them here.</p>

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {/* Form */}
          <div className="glass-panel p-4 sm:p-6 h-fit">
             <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-700">
                <ArrowLeftRight size={20} className="text-indigo-500"/> New Record
             </h2>
             <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex bg-slate-100 p-1 rounded-lg">
                   <button type="button" onClick={() => setForm({...form, type: 'GAVE'})} className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${form.type === 'GAVE' ? 'bg-green-500 text-white shadow-md' : 'text-slate-500'}`}>I GAVE (Lent)</button>
                   <button type="button" onClick={() => setForm({...form, type: 'TOOK'})} className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${form.type === 'TOOK' ? 'bg-red-500 text-white shadow-md' : 'text-slate-500'}`}>I TOOK (Borrowed)</button>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1 pl-1">Person Name</label>
                  <input type="text" required placeholder="Name" className="input-field" value={form.personName} onChange={e => setForm({...form, personName: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1 pl-1">Amount</label>
                  <input type="number" required placeholder="0.00" className="input-field" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} />
                </div>
                <button type="submit" className="btn-primary w-full bg-indigo-600 hover:bg-indigo-700">Add Record</button>
             </form>
          </div>

          {/* List */}
          <div className="space-y-4">
             {items.length === 0 && <p className="text-slate-400 text-center py-10">No records found.</p>}
             {items.map(item => (
                <div key={item.id} className={`glass-card p-4 border-l-4 ${item.type === 'GAVE' ? 'border-green-500' : 'border-red-500'} ${item.status === 'PAID' ? 'opacity-60' : ''}`}>
                   <div className="flex justify-between items-center">
                      <div>
                         <p className={`text-xs font-bold uppercase ${item.type === 'GAVE' ? 'text-green-600' : 'text-red-500'}`}>
                            {item.type === 'GAVE' ? 'You Lent To' : 'You Borrowed From'}
                         </p>
                         <h3 className="font-bold text-lg text-slate-800">{item.personName}</h3>
                         <p className="text-xs text-slate-400">{new Date(item.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                         <p className="text-xl font-bold text-slate-700">₹{item.amount.toLocaleString()}</p>
                         {item.status === 'PENDING' ? (
                            <button onClick={() => markPaid(item.id)} className="mt-2 text-xs flex items-center gap-1 bg-green-50 text-green-600 px-2 py-1 rounded-full border border-green-200 hover:bg-green-100">
                               <Check size={12} /> Mark Settled
                            </button>
                         ) : (
                            <span className="mt-2 text-xs flex items-center justify-end gap-1 text-slate-400 font-medium">
                               <Check size={12} /> Settled
                            </span>
                         )}
                      </div>
                   </div>
                </div>
             ))}
          </div>
       </div>
    </div>
  );
}
