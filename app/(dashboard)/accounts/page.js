'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Wallet, CreditCard, Banknote, Building2, Briefcase, PiggyBank, ShoppingBag, CircleDot } from 'lucide-react';
import { useSession } from "next-auth/react";
import { showSuccess, showError, showDeleteConfirm, showToast } from '@/lib/sweetalert';

const accountPurposes = [
  { key: 'SALARY', label: 'Salary Account', icon: Briefcase, color: 'blue', description: 'Where you receive salary' },
  { key: 'SAVINGS', label: 'Savings Account', icon: PiggyBank, color: 'green', description: 'Long-term savings' },
  { key: 'SPENDING', label: 'Spending Account', icon: ShoppingBag, color: 'purple', description: 'Daily expenses' },
  { key: 'GENERAL', label: 'General', icon: CircleDot, color: 'slate', description: 'Multi-purpose account' },
];

export default function AccountsPage() {
  const { data: session } = useSession();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    type: 'BANK',
    purpose: 'GENERAL',
    balance: ''
  });

  const fetchAccounts = async () => {
    try {
      const res = await fetch('/api/accounts');
      if (res.ok) {
        setAccounts(await res.json());
      }
    } catch (error) {
      console.error("Failed to fetch accounts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) fetchAccounts();
  }, [session]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const method = editingId ? 'PUT' : 'POST';
      const body = editingId ? { ...formData, id: editingId } : formData;

      const res = await fetch('/api/accounts', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setFormData({ name: '', type: 'BANK', purpose: 'GENERAL', balance: '' });
        setEditingId(null);
        fetchAccounts();
        showToast('success', editingId ? 'Account updated!' : 'Account added!');
      } else {
        showError('Error', 'Failed to save account');
      }
    } catch (error) {
      showError('Error', 'Failed to save account');
    }
  };

  const handleEdit = (account) => {
    setFormData({
      name: account.name,
      type: account.type,
      purpose: account.purpose || 'GENERAL',
      balance: account.balance
    });
    setEditingId(account.id);
  };

  const deleteAccount = async (id) => {
    const result = await showDeleteConfirm('Delete Account?', 'This action cannot be undone.');
    if (!result.isConfirmed) return;
    try {
       await fetch(`/api/accounts?id=${id}`, { method: 'DELETE' });
       fetchAccounts();
       showToast('success', 'Account deleted!');
    } catch (error) {
       showError('Error', 'Failed to delete account');
    }
  };

  const getIcon = (type) => {
     switch(type) {
         case 'CASH': return <Banknote size={24} className="text-green-600"/>;
         case 'UPI': return <Wallet size={24} className="text-blue-600"/>;
         case 'WALLET': return <Wallet size={24} className="text-purple-600"/>;
         default: return <Building2 size={24} className="text-slate-600"/>;
     }
  };

  const getPurposeInfo = (purpose) => {
    return accountPurposes.find(p => p.key === purpose) || accountPurposes[3];
  };

  const getGradient = (type, purpose) => {
    // Use purpose-based colors if set
    if (purpose === 'SALARY') return 'bg-linear-to-br from-blue-50 to-indigo-100 border-blue-200';
    if (purpose === 'SAVINGS') return 'bg-linear-to-br from-green-50 to-emerald-100 border-green-200';
    if (purpose === 'SPENDING') return 'bg-linear-to-br from-purple-50 to-fuchsia-100 border-purple-200';
    
    // Fallback to type-based
    switch(type) {
        case 'CASH': return 'bg-linear-to-br from-green-50 to-emerald-100 border-green-200';
        case 'UPI': return 'bg-linear-to-br from-blue-50 to-indigo-100 border-blue-200';
        case 'WALLET': return 'bg-linear-to-br from-purple-50 to-fuchsia-100 border-purple-200';
        default: return 'bg-linear-to-br from-slate-50 to-gray-100 border-slate-200';
    }
 };

  if (!session) return <div className="p-8">Please log in.</div>;

  const totalLiquidAssets = accounts.reduce((acc, curr) => acc + curr.balance, 0);

  // Group accounts by purpose
  const groupedAccounts = accountPurposes.map(purpose => ({
    ...purpose,
    accounts: accounts.filter(a => (a.purpose || 'GENERAL') === purpose.key)
  })).filter(g => g.accounts.length > 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8 px-1 sm:px-0">
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4"> 
        <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-clip-text text-transparent bg-linear-to-r from-blue-600 to-cyan-500">
                💼 Accounts & Assets
            </h1>
            <p className="text-slate-500 mt-1 sm:mt-2 text-sm sm:text-base">Organize your accounts by purpose.</p>
        </div>
        <div className="sm:text-right">
            <p className="text-xs sm:text-sm font-medium text-slate-500">Total Liquid Assets</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">₹{totalLiquidAssets.toLocaleString()}</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Form Section */}
        <div className="lg:col-span-1">
            <div className="glass-panel p-6 sticky top-8">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Plus size={20} className="text-blue-600"/> {editingId ? 'Edit Account' : 'Add Account'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-xs font-semibold uppercase text-slate-500 mb-1 pl-1">Account Name</label>
                    <input
                    type="text"
                    required
                    placeholder="e.g. HDFC Main, Pocket Cash"
                    className="input-field"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                </div>
                
                <div>
                    <label className="block text-xs font-semibold uppercase text-slate-500 mb-1 pl-1">Account Purpose</label>
                    <div className="grid grid-cols-2 gap-2">
                        {accountPurposes.map(purpose => {
                            const Icon = purpose.icon;
                            const isSelected = formData.purpose === purpose.key;
                            return (
                                <button
                                    key={purpose.key}
                                    type="button"
                                    onClick={() => setFormData({...formData, purpose: purpose.key})}
                                    className={`p-3 rounded-xl text-left transition-all border ${
                                        isSelected 
                                        ? 'bg-blue-600 text-white border-blue-600 shadow-lg' 
                                        : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300'
                                    }`}
                                >
                                    <Icon size={18} className={isSelected ? 'text-white' : `text-${purpose.color}-500`} />
                                    <p className="text-xs font-bold mt-1">{purpose.label}</p>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-semibold uppercase text-slate-500 mb-1 pl-1">Type</label>
                    <div className="grid grid-cols-3 gap-2">
                        {['BANK', 'CASH', 'WALLET'].map(type => (
                            <button
                                key={type}
                                type="button"
                                onClick={() => setFormData({...formData, type})}
                                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                                    formData.type === type 
                                    ? 'bg-slate-800 text-white shadow-lg' 
                                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                                }`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-semibold uppercase text-slate-500 mb-1 pl-1">Current Balance</label>
                    <input
                    type="number"
                    required
                    placeholder="0.00"
                    className="input-field"
                    value={formData.balance}
                    onChange={e => setFormData({...formData, balance: e.target.value})}
                    />
                </div>
                <div className="flex gap-2 pt-2">
                    <button type="submit" className="flex-1 btn-primary">
                        {editingId ? 'Update' : 'Add Account'}
                    </button>
                    {editingId && (
                    <button 
                        type="button" 
                        onClick={() => {
                        setEditingId(null);
                        setFormData({ name: '', type: 'BANK', purpose: 'GENERAL', balance: '' });
                        }}
                        className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl transition-colors"
                    >
                        Cancel
                    </button>
                    )}
                </div>
                </form>
            </div>
        </div>

        {/* List Section - Grouped by Purpose */}
        <div className="lg:col-span-2 space-y-6">
             {groupedAccounts.map(group => {
                const GroupIcon = group.icon;
                return (
                    <div key={group.key}>
                        <div className="flex items-center gap-2 mb-3">
                            <GroupIcon size={18} className={`text-${group.color}-500`} />
                            <h3 className="font-bold text-slate-700">{group.label}</h3>
                            <span className="text-xs text-slate-400">({group.accounts.length})</span>
                        </div>
                        <div className="space-y-3">
                            {group.accounts.map(account => {
                                const purposeInfo = getPurposeInfo(account.purpose);
                                return (
                                    <div key={account.id} className={`glass-card p-5 flex items-center justify-between group ${getGradient(account.type, account.purpose)}`}>
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-white rounded-xl shadow-sm">
                                                {getIcon(account.type)}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-800">{account.name}</h3>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs font-bold tracking-wider text-slate-500 bg-white/50 px-2 py-0.5 rounded-sm">{account.type}</span>
                                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-${purposeInfo.color}-100 text-${purposeInfo.color}-700`}>
                                                        {purposeInfo.label}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-bold text-slate-800">₹{account.balance.toLocaleString()}</p>
                                            <div className="flex justify-end gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleEdit(account)} className="p-1.5 bg-white text-blue-600 rounded-lg hover:bg-blue-50"><Edit2 size={14}/></button>
                                                <button onClick={() => deleteAccount(account.id)} className="p-1.5 bg-white text-red-500 rounded-lg hover:bg-red-50"><Trash2 size={14}/></button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
             })}
             
             {accounts.length === 0 && !loading && (
                 <div className="text-center py-12 text-slate-400">
                     <PiggyBank size={48} className="mx-auto mb-4 text-slate-300" />
                     <p className="font-bold">No accounts added yet.</p>
                     <p className="text-sm">Add your first account to start tracking!</p>
                 </div>
             )}
             
             {loading && <p className="text-center py-8 text-slate-400">Loading accounts...</p>}
        </div>
      </div>
    </div>
  );
}
