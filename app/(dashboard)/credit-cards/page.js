'use client';

import { useState, useEffect } from 'react';
import { CreditCard, Plus, AlertTriangle, Trash2, Edit2, X, Calendar, DollarSign, FileText, Wallet, CheckCircle2 } from 'lucide-react';
import { useSession } from "next-auth/react";
import { showError, showDeleteConfirm, showToast } from '@/lib/sweetalert';

export default function CreditCardsPage() {
  const { data: session } = useSession();
  const [cards, setCards] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // States
  const [editingCardId, setEditingCardId] = useState(null);
  const [showTransactionsFor, setShowTransactionsFor] = useState(null);
  const [editingSpendId, setEditingSpendId] = useState(null);

  // Forms
  const [cardForm, setCardForm] = useState({ name: '', limit: '', billingDay: '' });
  const [spendForm, setSpendForm] = useState({ 
      cardId: '', 
      amount: '', 
      description: '', 
      date: new Date().toISOString().split('T')[0], 
      type: 'SPEND',
      accountId: '' // New: Account to pay from
  });

  const fetchData = async () => {
    try {
      const [cardsRes, accRes] = await Promise.all([
          fetch('/api/credit-cards'),
          fetch('/api/accounts')
      ]);
      
      if (cardsRes.ok) setCards(await cardsRes.json());
      if (accRes.ok) setAccounts(await accRes.json());
    } catch(e) {
        console.error("Failed to fetch data", e);
    } 
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (session) fetchData();
  }, [session]);

  const handleCardSubmit = async (e) => {
    e.preventDefault();
    try {
      const method = editingCardId ? 'PUT' : 'POST';
      const body = editingCardId ? { ...cardForm, id: editingCardId } : cardForm;

      await fetch('/api/credit-cards', { method, body: JSON.stringify(body) });
      
      setCardForm({ name: '', limit: '', billingDay: '' });
      setEditingCardId(null);
      fetchData();
    } catch(e) {}
  };

  const handleEditCard = (card) => {
    setCardForm({ name: card.name, limit: card.limit, billingDay: card.billingDay });
    setEditingCardId(card.id);
  };

  const handleSpendSubmit = async (e) => {
    e.preventDefault();
    try {
      const method = editingSpendId ? 'PUT' : 'POST';
      const body = editingSpendId ? { ...spendForm, id: editingSpendId } : spendForm;

      await fetch('/api/credit-spends', { method, body: JSON.stringify(body) });
      
      if (!editingSpendId) {
         setSpendForm({ ...spendForm, amount: '', description: '', type: 'SPEND', accountId: '' });
         if(spendForm.type === 'PAYMENT') showToast('success', 'Payment recorded!');
         else showToast('success', 'Spend recorded!');
      } else {
         setEditingSpendId(null);
         setSpendForm({ cardId: '', amount: '', description: '', date: new Date().toISOString().split('T')[0], type: 'SPEND', accountId: '' });
         showToast('success', 'Transaction updated!');
      }
      fetchData();
    } catch(e) {
      showError('Error', 'Failed to save transaction');
    }
  };

  const handleEditSpend = (spend) => {
    setSpendForm({
        cardId: spend.cardId,
        amount: spend.amount,
        description: spend.description,
        date: new Date(spend.date).toISOString().split('T')[0],
        type: spend.type || 'SPEND',
        accountId: '' // Editing legacy payments won't show the account, acceptable for now
    });
    setEditingSpendId(spend.id);
  };

  const deleteCard = async (id) => {
     const result = await showDeleteConfirm('Delete Card?', 'This will delete all transactions too!');
     if (!result.isConfirmed) return;
     await fetch(`/api/credit-cards?id=${id}`, { method: 'DELETE' });
     fetchData();
     showToast('success', 'Card deleted!');
  };

  const deleteSpend = async (id) => {
    const result = await showDeleteConfirm('Delete Transaction?', 'Account balance will NOT be reverted.');
    if (!result.isConfirmed) return;
    await fetch(`/api/credit-spends?id=${id}`, { method: 'DELETE' });
    fetchData();
    showToast('success', 'Transaction deleted!');
  };

  if(!session) return <div className="p-8">Please log in.</div>;

  // Selected Card for Transactions Modal
  const selectedCard = showTransactionsFor ? cards.find(c => c.id === showTransactionsFor) : null;

  return (
    <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8 px-1 sm:px-0 relative">
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-clip-text text-transparent bg-linear-to-r from-purple-600 to-pink-500">
                Credit Manager
            </h1>
            <p className="text-slate-500 text-sm sm:text-base">Simulate payments and track debt ratio.</p>
          </div>
          <div className="sm:text-right">
              <p className="text-xs font-bold text-slate-400 uppercase">Total Debt</p>
              <p className="text-xl sm:text-2xl font-bold text-slate-700">
                  ₹{cards.reduce((acc, c) => acc + (c.currentBalance || 0), 0).toLocaleString()}
              </p>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Add/Edit Card Form */}
        <div className="glass-panel p-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-700">
            <Plus size={20} className="text-purple-500"/> {editingCardId ? 'Edit Card' : 'Add New Card'}
          </h2>
          <form onSubmit={handleCardSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1 pl-1">Card Name</label>
                  <input type="text" required placeholder="HDFC Regalia" className="input-field" value={cardForm.name} onChange={e => setCardForm({...cardForm, name: e.target.value})} />
               </div>
               <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1 pl-1">Limit</label>
                  <input type="number" required placeholder="50000" className="input-field" value={cardForm.limit} onChange={e => setCardForm({...cardForm, limit: e.target.value})} />
               </div>
            </div>
            <div>
               <label className="block text-xs font-semibold uppercase text-slate-500 mb-1 pl-1">Billing Day</label>
               <input type="number" min="1" max="31" required placeholder="Day of month (e.g. 5)" className="input-field" value={cardForm.billingDay} onChange={e => setCardForm({...cardForm, billingDay: e.target.value})} />
            </div>
            <div className="flex gap-2">
                <button type="submit" className="flex-1 btn-primary bg-purple-600 hover:bg-purple-700 shadow-purple-500/30">
                    {editingCardId ? 'Update Card' : 'Add Card'}
                </button>
                {editingCardId && <button type="button" onClick={() => { setEditingCardId(null); setCardForm({ name: '', limit: '', billingDay: '' }); }} className="px-3 rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300">Cancel</button>}
            </div>
          </form>
        </div>

        {/* Add/Edit Transaction Form (Main View) */}
        {!showTransactionsFor && (
        <div className="glass-panel p-6 border-l-4 border-l-pink-500">
           <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-700">
             <CreditCard size={20} className="text-pink-500"/> {editingSpendId ? 'Edit Transaction' : 'Quick Action'}
           </h2>
           <form onSubmit={handleSpendSubmit} className="space-y-4">
             <div className="flex bg-slate-100 p-1 rounded-xl mb-4">
                <button type="button" onClick={() => setSpendForm({...spendForm, type: 'SPEND'})} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${spendForm.type === 'SPEND' ? 'bg-white text-pink-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>New Spend</button>
                <button type="button" onClick={() => setSpendForm({...spendForm, type: 'PAYMENT'})} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${spendForm.type === 'PAYMENT' ? 'bg-white text-green-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Pay Bill</button>
             </div>

             <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-semibold uppercase text-slate-500 mb-1 pl-1">Select Card</label>
                    <select required className="input-field" value={spendForm.cardId} onChange={e => setSpendForm({...spendForm, cardId: e.target.value})}>
                      <option value="">Choose Card...</option>
                      {cards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
                <div>
                   <label className="block text-xs font-semibold uppercase text-slate-500 mb-1 pl-1">Amount</label>
                   <input type="number" required placeholder="0.00" className="input-field font-bold text-slate-700" value={spendForm.amount} onChange={e => setSpendForm({...spendForm, amount: e.target.value})} />
                </div>
             </div>

             {spendForm.type === 'PAYMENT' && (
                 <div className="bg-green-50 p-3 rounded-xl border border-green-100 animate-in fade-in slide-in-from-top-2">
                    <label className="block text-xs font-semibold uppercase text-green-700 mb-1 pl-1 flex items-center gap-1">
                        <Wallet size={12}/> Pay From Account
                    </label>
                    <select 
                        className="input-field bg-white border-green-200 focus:border-green-400 focus:ring-green-400/20" 
                        value={spendForm.accountId} 
                        onChange={e => setSpendForm({...spendForm, accountId: e.target.value})}
                    >
                        <option value="">Manual / Cash (No Deduction)</option>
                        {accounts.map(acc => (
                            <option key={acc.id} value={acc.id}>{acc.name} (₹{acc.balance.toLocaleString()})</option>
                        ))}
                    </select>
                    <p className="text-[10px] text-green-600 mt-1 pl-1">Select an account to automatically deduct this payment.</p>
                 </div>
             )}

             <div className="grid grid-cols-2 gap-4">
               <div>
                   <label className="block text-xs font-semibold uppercase text-slate-500 mb-1 pl-1">Date</label>
                   <input type="date" required className="input-field" value={spendForm.date} onChange={e => setSpendForm({...spendForm, date: e.target.value})} />
               </div>
               <div>
                 <label className="block text-xs font-semibold uppercase text-slate-500 mb-1 pl-1">Description</label>
                 <input type="text" placeholder={spendForm.type === 'PAYMENT' ? 'e.g. Bill Payment' : 'e.g. Netflix'} className="input-field" value={spendForm.description} onChange={e => setSpendForm({...spendForm, description: e.target.value})} />
               </div>
             </div>
             
             <div className="flex gap-2 pt-2">
                 <button type="submit" disabled={!spendForm.cardId} className={`flex-1 btn-primary h-12 flex items-center justify-center gap-2 font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95 transition-all ${spendForm.type === 'PAYMENT' ? 'bg-green-600 hover:bg-green-700 shadow-green-500/30' : 'bg-pink-600 hover:bg-pink-700 shadow-pink-500/30'}`}>
                    {editingSpendId ? 'Update Transaction' : (spendForm.type === 'PAYMENT' ? 'Confirm Payment' : 'Record Check-in')}
                 </button>
                 {editingSpendId && <button type="button" onClick={() => { setEditingSpendId(null); setSpendForm({ cardId: '', amount: '', description: '', date: new Date().toISOString().split('T')[0], type: 'SPEND', accountId: '' }); }} className="px-3 rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300">Cancel</button>}
             </div>
           </form>
        </div>
        )}
      </div>

      {/* Cards List */}
      <div>
        <h2 className="text-xl font-bold text-slate-700 mb-4 flex items-center gap-2">Your Cards <span className="bg-slate-100 text-slate-500 text-xs px-2 py-1 rounded-full">{cards.length}</span></h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cards.map(card => {
            const balance = card.currentBalance || 0;
            const usage = (balance / card.limit) * 100;
            const isDanger = usage > 80;
            const isWarning = usage > 50 && usage <= 80;

            return (
                <div key={card.id} className="glass-card p-6 relative overflow-hidden group hover:shadow-xl transition-all duration-300">
                    {/* Visual Background */}
                    <div className={`absolute -right-10 -top-10 w-40 h-40 rounded-full blur-3xl transition-all opacity-20 ${
                        card.riskAnalysis?.status === 'DANGEROUS' ? 'bg-red-500' :
                        card.riskAnalysis?.status === 'HIGH' ? 'bg-orange-500' :
                        card.riskAnalysis?.status === 'CAUTION' ? 'bg-yellow-500' :
                        'bg-green-500'
                    }`}></div>
                    
                    <div className="flex justify-between items-start mb-6 relative z-10">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-1 rounded-xs">CREDIT CARD</span>
                            {card.riskAnalysis && (
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    card.riskAnalysis.status === 'SAFE' ? 'bg-green-100 text-green-700' :
                                    card.riskAnalysis.status === 'CAUTION' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-red-100 text-red-700'
                                }`}>
                                    {card.riskAnalysis.status}
                                </span>
                            )}
                        </div>
                        <h3 className="text-xl font-bold text-slate-800">{card.name}</h3>
                    </div>
                    <div className="flex gap-2">
                            <button onClick={() => setShowTransactionsFor(card.id)} className="p-2 bg-white/80 hover:bg-white rounded-xl text-slate-600 shadow-xs hover:shadow-md transition-all" title="View Transactions">
                                <FileText size={18} />
                            </button>
                            <button onClick={() => handleEditCard(card)} className="p-2 bg-white/80 hover:bg-white rounded-xl text-blue-600 shadow-xs hover:shadow-md transition-all" title="Edit Card">
                                <Edit2 size={18} />
                            </button>
                    </div>
                    </div>

                    <div className="space-y-4 relative z-10">
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-500 font-medium">Limit</span>
                        <span className="text-slate-700 font-bold">₹{card.limit.toLocaleString()}</span>
                    </div>
                    
                    <div>
                        <div className="flex justify-between mb-1">
                           <span className={`text-xs font-bold ${
                                card.riskAnalysis?.color === 'red' ? 'text-red-600' :
                                card.riskAnalysis?.color === 'orange' ? 'text-orange-600' :
                                card.riskAnalysis?.color === 'yellow' ? 'text-yellow-600' :
                                'text-blue-600'
                            }`}>
                            Balance: ₹{balance.toLocaleString()} ({card.riskAnalysis?.usagePercentage || usage.toFixed(1)}%)
                            </span>
                            {card.riskAnalysis?.status !== 'SAFE' && <AlertTriangle size={14} className="text-orange-500" />}
                        </div>
                        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden relative">
                             {/* 30% Marker */}
                            <div className="absolute left-[30%] top-0 bottom-0 w-0.5 bg-green-500 z-20" title="Optimal 30% Usage"></div>
                            
                            <div 
                                className={`h-full transition-all duration-500 ${
                                    card.riskAnalysis?.color === 'red' ? 'bg-red-500' :
                                    card.riskAnalysis?.color === 'orange' ? 'bg-orange-500' :
                                    card.riskAnalysis?.color === 'yellow' ? 'bg-yellow-400' :
                                    'bg-green-500'
                                }`} 
                                style={{ width: `${Math.min(Math.max(0, usage), 100)}%` }}
                            ></div>
                        </div>
                        
                        {/* Recommendations */}
                        {card.riskAnalysis?.recommendations?.length > 0 && (
                            <div className="mt-3 bg-white/50 rounded-lg p-2 text-xs text-slate-600 space-y-1 border border-slate-100">
                                {card.riskAnalysis.recommendations.map((rec, idx) => (
                                    <p key={idx} className="flex gap-1.5 items-start">
                                        <span className="text-blue-500 mt-0.5"><CheckCircle2 size={10}/></span>
                                        {rec}
                                    </p>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="pt-4 flex justify-between items-center border-t border-slate-100">
                        <span className="text-xs text-slate-400 font-medium">Bill Date: <span className="text-slate-600">{card.billingDay}th</span></span>
                        <button onClick={() => deleteCard(card.id)} className="text-xs text-red-400 hover:text-red-600 hover:underline">Remove Card</button>
                    </div>
                    </div>
                </div>
            );
            })}
        </div>
      </div>

        {/* Transactions Modal */}
        {selectedCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm transition-all">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-4 border-b flex justify-between items-center bg-slate-50/50 backdrop-blur-md">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                             {selectedCard.name}
                             <span className="text-xs font-normal bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">Transaction History</span>
                        </h3>
                    </div>
                    <button onClick={() => setShowTransactionsFor(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={20}/></button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {selectedCard.spends && selectedCard.spends.length > 0 ? (
                        selectedCard.spends.sort((a,b) => new Date(b.date) - new Date(a.date)).map(spend => (
                            <div key={spend.id} className="flex justify-between items-center p-3 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors group">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-full ${spend.type === 'PAYMENT' ? 'bg-green-100 text-green-600' : 'bg-pink-100 text-pink-500'}`}>
                                        {spend.type === 'PAYMENT' ? <DollarSign size={16}/> : <CreditCard size={16}/>}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-700">{spend.description || (spend.type === 'PAYMENT' ? 'Bill Payment' : 'Spend')}</p>
                                        <p className="text-xs text-slate-400">{new Date(spend.date).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="text-right flex items-center gap-4">
                                    <span className={`font-bold ${spend.type === 'PAYMENT' ? 'text-green-600' : 'text-slate-700'}`}>
                                        {spend.type === 'PAYMENT' ? '-' : '+'}₹{spend.amount.toLocaleString()}
                                    </span>
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                            <button onClick={() => { handleEditSpend(spend); setShowTransactionsFor(null); }} className="p-1.5 hover:bg-blue-100 text-blue-500 rounded-md"><Edit2 size={14}/></button>
                                            <button onClick={() => deleteSpend(spend.id)} className="p-1.5 hover:bg-red-100 text-red-500 rounded-md"><Trash2 size={14}/></button>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-400 opacity-60">
                            <CreditCard size={48} className="mb-2" />
                            <p>No transactions found.</p>
                        </div>
                    )}
                </div>
                <div className="p-4 border-t bg-slate-50 text-right">
                    <button onClick={() => setShowTransactionsFor(null)} className="px-6 py-2 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition-colors">Close</button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
}
