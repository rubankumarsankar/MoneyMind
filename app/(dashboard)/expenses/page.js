'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Calendar, Tag, FileText, CreditCard, Wallet, Banknote } from 'lucide-react';
import { useSession } from "next-auth/react";
import { showError, showDeleteConfirm, showToast } from '@/lib/sweetalert';

export default function ExpensesPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState('daily'); // 'daily' or 'fixed'
  
  // Data States
  const [dailyExpenses, setDailyExpenses] = useState([]);
  const [fixedExpenses, setFixedExpenses] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [creditCards, setCreditCards] = useState([]);
  const [loading, setLoading] = useState(true);

  // Forms
  const [dailyForm, setDailyForm] = useState({ 
      category: '', 
      amount: '', 
      date: new Date().toISOString().split('T')[0], 
      note: '',
      paymentMethod: 'CASH', // CASH, ACCOUNT, CREDIT_CARD
      accountId: '',
      creditCardId: ''
  });
  const [fixedForm, setFixedForm] = useState({ title: '', amount: '', dayOfMonth: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dailyRes, fixedRes, accRes, ccRes] = await Promise.all([
          fetch('/api/daily-expenses'),
          fetch('/api/fixed-expenses'),
          fetch('/api/accounts'),
          fetch('/api/credit-cards')
      ]);

      if (dailyRes.ok) setDailyExpenses(await dailyRes.json());
      if (fixedRes.ok) setFixedExpenses(await fixedRes.json());
      if (accRes.ok) setAccounts(await accRes.json());
      if (ccRes.ok) setCreditCards(await ccRes.json());

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) fetchData();
  }, [session]);

  const handleDailySubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/daily-expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dailyForm),
      });
      if (res.ok) {
        setDailyForm({ ...dailyForm, amount: '', note: '' });
        fetchData();
        showToast('success', 'Expense added!');
      } else {
        showError('Error', 'Failed to add expense');
      }
    } catch(e) {
      showError('Error', 'Failed to add expense');
    }
  };

  const handleFixedSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/fixed-expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fixedForm),
      });
      if (res.ok) {
        setFixedForm({ title: '', amount: '', dayOfMonth: '' });
        fetchData();
        showToast('success', 'Fixed expense added!');
      } else {
        showError('Error', 'Failed to add fixed expense');
      }
    } catch(e) {
      showError('Error', 'Failed to add fixed expense');
    }
  };

  const handleDelete = async (endpoint, id) => {
    const result = await showDeleteConfirm('Delete Expense?', 'This will revert any balance deductions.');
    if (!result.isConfirmed) return;
    try {
      await fetch(`${endpoint}?id=${id}`, { method: 'DELETE' });
      fetchData();
      showToast('success', 'Expense deleted!');
    } catch(e) {
      showError('Error', 'Failed to delete expense');
    }
  };

  if (!session) return <div className="p-8">Please log in.</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8 px-1 sm:px-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold bg-clip-text text-transparent bg-linear-to-r from-red-600 to-orange-500">
          Expense Tracker
        </h1>
        
        {/* Tabs */}
        <div className="flex bg-white/50 p-1 rounded-xl border border-white/20 shadow-sm w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('daily')}
            className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'daily' ? 'bg-white text-blue-600 shadow-md' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Daily
          </button>
          <button
            onClick={() => setActiveTab('fixed')}
            className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'fixed' ? 'bg-white text-blue-600 shadow-md' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Fixed
          </button>
        </div>
      </div>

      {activeTab === 'daily' ? (
        <div className="space-y-4 sm:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
           {/* Daily Input */}
           <div className="glass-panel p-4 sm:p-6">
             <h2 className="text-base sm:text-lg font-bold mb-4 flex items-center gap-2 text-slate-700">
                <Plus size={20} className="text-red-500"/> Add Daily Spend
             </h2>
             <form onSubmit={handleDailySubmit} className="space-y-4">
               <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                    <div>
                        <label className="block text-xs font-semibold uppercase text-slate-500 mb-1 pl-1">Category</label>
                        <select 
                            className="input-field" 
                            required
                            value={dailyForm.category}
                            onChange={e => setDailyForm({...dailyForm, category: e.target.value})}
                        >
                        <option value="">Select...</option>
                        <option value="Food">Food & Dining</option>
                        <option value="Travel">Travel</option>
                        <option value="Shopping">Shopping</option>
                        <option value="Medical">Medical</option>
                        <option value="Groceries">Groceries</option>
                        <option value="Entertainment">Entertainment</option>
                        <option value="Other">Other</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold uppercase text-slate-500 mb-1 pl-1">Date</label>
                        <input type="date" required className="input-field" value={dailyForm.date} onChange={e => setDailyForm({...dailyForm, date: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold uppercase text-slate-500 mb-1 pl-1">Amount</label>
                        <input type="number" required placeholder="0.00" className="input-field" value={dailyForm.amount} onChange={e => setDailyForm({...dailyForm, amount: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold uppercase text-slate-500 mb-1 pl-1">Note (Optional)</label>
                        <input type="text" placeholder="Description" className="input-field" value={dailyForm.note} onChange={e => setDailyForm({...dailyForm, note: e.target.value})} />
                    </div>
               </div>
               
               {/* Payment Method Selection */}
               <div className="pt-2 border-t border-slate-100">
                   <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Payment Method</label>
                   <div className="flex flex-wrap gap-2 mb-3">
                       <button 
                           type="button" 
                           onClick={() => setDailyForm({ ...dailyForm, paymentMethod: 'CASH', accountId: '', creditCardId: '' })}
                           className={`px-4 py-2 text-sm font-bold rounded-lg border flex items-center gap-2 ${dailyForm.paymentMethod === 'CASH' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-white border-slate-200 text-slate-600'}`}
                       >
                           <Banknote size={16}/> Cash / Manual
                       </button>
                       <button 
                           type="button" 
                           onClick={() => setDailyForm({ ...dailyForm, paymentMethod: 'ACCOUNT', creditCardId: '' })}
                           className={`px-4 py-2 text-sm font-bold rounded-lg border flex items-center gap-2 ${dailyForm.paymentMethod === 'ACCOUNT' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-white border-slate-200 text-slate-600'}`}
                       >
                           <Wallet size={16}/> Account / UPI
                       </button>
                       <button 
                           type="button" 
                           onClick={() => setDailyForm({ ...dailyForm, paymentMethod: 'CREDIT_CARD', accountId: '' })}
                           className={`px-4 py-2 text-sm font-bold rounded-lg border flex items-center gap-2 ${dailyForm.paymentMethod === 'CREDIT_CARD' ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-white border-slate-200 text-slate-600'}`}
                       >
                           <CreditCard size={16}/> Credit Card
                       </button>
                   </div>

                   {/* Dynamic Selector based on Payment Method */}
                   {dailyForm.paymentMethod === 'ACCOUNT' && (
                       <div className="animate-in fade-in slide-in-from-top-2">
                           <select 
                                required 
                                className="input-field max-w-md"
                                value={dailyForm.accountId}
                                onChange={e => setDailyForm({...dailyForm, accountId: e.target.value})}
                           >
                               <option value="">Select Account...</option>
                               {accounts.map(acc => (
                                   <option key={acc.id} value={acc.id}>{acc.name} (Balance: ₹{acc.balance})</option>
                               ))}
                           </select>
                       </div>
                   )}
                   {dailyForm.paymentMethod === 'CREDIT_CARD' && (
                       <div className="animate-in fade-in slide-in-from-top-2">
                            <select 
                                required 
                                className="input-field max-w-md"
                                value={dailyForm.creditCardId}
                                onChange={e => setDailyForm({...dailyForm, creditCardId: e.target.value})}
                           >
                               <option value="">Select Credit Card...</option>
                               {creditCards.map(cc => (
                                   <option key={cc.id} value={cc.id}>{cc.name}</option>
                               ))}
                           </select>
                       </div>
                   )}
               </div>

               <button type="submit" className="btn-primary h-12 w-full flex items-center justify-center font-bold text-base">Add Expense & Deduct Balance</button>
             </form>
           </div>
           
           {/* Daily List */}
           <div className="glass-panel p-6">
              <h3 className="font-bold text-slate-700 mb-4">Recent Transactions</h3>
              <div className="space-y-3">
                 {dailyExpenses.length === 0 && <p className="text-slate-400 text-sm">No expenses yet.</p>}
                 {dailyExpenses.map(item => (
                   <div key={item.id} className="flex items-center justify-between p-3 hover:bg-white/40 rounded-lg group transition-colors border border-transparent hover:border-slate-100">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold text-xs uppercase">
                          {item.category.substring(0,2)}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">{item.category}</p>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                              <span>{new Date(item.date).toLocaleDateString()}</span>
                              {item.paymentMethod !== 'CASH' && (
                                  <span className={`px-1.5 py-0.5 rounded-md font-bold text-[10px] ${
                                      item.paymentMethod === 'CREDIT_CARD' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                                  }`}>
                                      {item.paymentMethod} 
                                      {item.account && ` (${item.account.name})`}
                                      {item.creditCard && ` (${item.creditCard.name})`}
                                  </span>
                              )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-bold text-slate-700">-₹{item.amount.toLocaleString()}</span>
                        <button onClick={() => handleDelete('/api/daily-expenses', item.id)} className="opacity-0 group-hover:opacity-100 p-2 text-red-400 hover:text-red-600 transition-all">
                          <Trash2 size={16} />
                        </button>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
           {/* Fixed Input */}
           <div className="glass-panel p-6 border-l-4 border-blue-500">
             <div className="mb-4">
               <h2 className="text-lg font-bold flex items-center gap-2 text-slate-700">
                  <Calendar size={20} className="text-blue-500"/> Fixed Monthly Expenses
               </h2>
               <p className="text-sm text-slate-500">Expenses that happen automatically every month (Rent, Gym, etc.)</p>
             </div>
             
             <form onSubmit={handleFixedSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
               <div className="md:col-span-1">
                 <label className="block text-xs font-semibold uppercase text-slate-500 mb-1 pl-1">Title</label>
                 <input type="text" required placeholder="Rent, Internet..." className="input-field" value={fixedForm.title} onChange={e => setFixedForm({...fixedForm, title: e.target.value})} />
               </div>
               <div className="md:col-span-1">
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1 pl-1">Day of Month</label>
                  <input type="number" min="1" max="31" required placeholder="1-31" className="input-field" value={fixedForm.dayOfMonth} onChange={e => setFixedForm({...fixedForm, dayOfMonth: e.target.value})} />
               </div>
               <div className="md:col-span-1">
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1 pl-1">Amount</label>
                  <input type="number" required placeholder="0.00" className="input-field" value={fixedForm.amount} onChange={e => setFixedForm({...fixedForm, amount: e.target.value})} />
               </div>
               <button type="submit" className="btn-primary h-10 w-full flex items-center justify-center bg-blue-600 hover:bg-blue-700">Set Fixed</button>
             </form>
           </div>
           
           {/* Fixed List */}
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {fixedExpenses.map(item => (
                <div key={item.id} className="glass-card p-4 flex flex-col justify-between h-32 relative group">
                  <button onClick={() => handleDelete('/api/fixed-expenses', item.id)} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-all">
                    <Trash2 size={16} />
                  </button>
                  <div>
                    <h4 className="font-bold text-slate-700">{item.title}</h4>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <Calendar size={12} /> Day {item.dayOfMonth} of every month
                    </p>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">
                    ₹{item.amount.toLocaleString()}
                  </div>
                </div>
              ))}
              {fixedExpenses.length === 0 && (
                <div className="col-span-full text-center py-10 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                  No fixed expenses set.
                </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
}
