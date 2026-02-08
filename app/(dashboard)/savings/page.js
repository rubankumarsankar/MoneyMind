'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Target, TrendingUp } from 'lucide-react';
import { useSession } from "next-auth/react";
import { showError, showDeleteConfirm, showToast } from '@/lib/sweetalert';

export default function SavingsPage() {
  const { data: session } = useSession();
  const [savings, setSavings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    targetAmount: '',
    currentAmount: '',
    targetDate: ''
  });

  const fetchSavings = async () => {
    try {
      const res = await fetch('/api/savings');
      if (res.ok) {
        setSavings(await res.json());
      }
    } catch (error) {
      console.error("Failed to fetch savings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) fetchSavings();
  }, [session]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const method = editingId ? 'PUT' : 'POST';
      const body = editingId ? { ...formData, id: editingId } : formData;

      const res = await fetch('/api/savings', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setFormData({ name: '', targetAmount: '', currentAmount: '', targetDate: '' });
        setEditingId(null);
        fetchSavings();
        showToast('success', editingId ? 'Goal updated!' : 'Goal created!');
      } else {
        showError('Error', 'Failed to save goal');
      }
    } catch (error) {
      showError('Error', 'Failed to save goal');
    }
  };

  const handleEdit = (saving) => {
    setFormData({
      name: saving.name,
      targetAmount: saving.targetAmount,
      currentAmount: saving.currentAmount,
      targetDate: saving.targetDate ? new Date(saving.targetDate).toISOString().split('T')[0] : ''
    });
    setEditingId(saving.id);
  };

  const deleteSaving = async (id) => {
    const result = await showDeleteConfirm('Delete Goal?', 'This action cannot be undone.');
    if (!result.isConfirmed) return;
    try {
       await fetch(`/api/savings?id=${id}`, { method: 'DELETE' });
       fetchSavings();
       showToast('success', 'Goal deleted!');
    } catch (error) {
       showError('Error', 'Failed to delete goal');
    }
  };

  if (!session) return <div className="p-8">Please log in.</div>;

  const totalSaved = savings.reduce((acc, curr) => acc + curr.currentAmount, 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8 px-1 sm:px-0">
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4"> 
        <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-clip-text text-transparent bg-linear-to-r from-pink-600 to-rose-400">
                Savings & Goals
            </h1>
            <p className="text-slate-500 text-sm sm:text-base">Visualize your dreams and track progress.</p>
        </div>
        <div className="sm:text-right">
            <p className="text-xs sm:text-sm font-medium text-slate-500">Total Saved</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">₹{totalSaved.toLocaleString()}</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Form Section */}
        <div className="lg:col-span-1">
            <div className="glass-panel p-4 sm:p-6 sticky top-8">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Plus size={20} className="text-pink-600"/> {editingId ? 'Edit Goal' : 'New Goal'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-xs font-semibold uppercase text-slate-500 mb-1 pl-1">Goal Name</label>
                    <input
                    type="text"
                    required
                    placeholder="e.g. New Macbook, Europe Trip"
                    className="input-field"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                </div>
                <div>
                    <label className="block text-xs font-semibold uppercase text-slate-500 mb-1 pl-1">Target Amount (₹)</label>
                    <input
                    type="number"
                    required
                    placeholder="100000"
                    className="input-field"
                    value={formData.targetAmount}
                    onChange={e => setFormData({...formData, targetAmount: e.target.value})}
                    />
                </div>
                <div>
                    <label className="block text-xs font-semibold uppercase text-slate-500 mb-1 pl-1">Current Saved (₹)</label>
                    <input
                    type="number"
                    required
                    placeholder="25000"
                    className="input-field"
                    value={formData.currentAmount}
                    onChange={e => setFormData({...formData, currentAmount: e.target.value})}
                    />
                </div>
                <div>
                    <label className="block text-xs font-semibold uppercase text-slate-500 mb-1 pl-1">Target Date (Optional)</label>
                    <input
                    type="date"
                    className="input-field"
                    value={formData.targetDate}
                    onChange={e => setFormData({...formData, targetDate: e.target.value})}
                    />
                </div>
                <div className="flex gap-2 pt-2">
                    <button type="submit" className="flex-1 btn-primary bg-pink-600 hover:bg-pink-700 shadow-pink-500/30">
                        {editingId ? 'Update Goal' : 'Start Saving'}
                    </button>
                    {editingId && (
                    <button 
                        type="button" 
                        onClick={() => {
                        setEditingId(null);
                        setFormData({ name: '', targetAmount: '', currentAmount: '', targetDate: '' });
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

        {/* List Section */}
        <div className="lg:col-span-2 space-y-4">
             {loading ? <p>Loading...</p> : savings.map(goal => {
                 const percentage = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
                 
                 // Metric Calculation
                 let metric = null;
                 if (goal.targetDate) {
                    const today = new Date();
                    const target = new Date(goal.targetDate);
                    const diffTime = target - today;
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    const monthsLeft = diffDays / 30;
                    const remainingAmount = goal.targetAmount - goal.currentAmount;
                    
                    if (diffDays > 0) {
                        const monthlyRequired = monthsLeft > 0 ? remainingAmount / monthsLeft : remainingAmount;
                        metric = {
                            daysLeft: diffDays,
                            monthlyRequired: Math.round(monthlyRequired)
                        };
                    } else {
                        metric = { expired: true };
                    }
                 }

                 return (
                    <div key={goal.id} className="glass-card p-6 group relative overflow-hidden">
                        {/* Background Progress Bar */}
                        <div 
                             className="absolute bottom-0 left-0 h-1 bg-pink-500 transition-all duration-1000" 
                             style={{ width: `${percentage}%` }}
                        ></div>
                        
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-pink-50 text-pink-600 rounded-xl">
                                    <Target size={24}/>
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-slate-800">{goal.name}</h3>
                                    <div className="flex gap-2 items-center text-xs text-slate-500">
                                        <span>Target: ₹{goal.targetAmount.toLocaleString()}</span>
                                        {goal.targetDate && (
                                            <span>• By {new Date(goal.targetDate).toLocaleDateString()}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleEdit(goal)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600"><Edit2 size={16}/></button>
                                <button onClick={() => deleteSaving(goal.id)} className="p-2 hover:bg-red-50 rounded-lg text-red-500"><Trash2 size={16}/></button>
                            </div>
                        </div>

                        <div className="space-y-4">
                             <div>
                                <div className="flex justify-between text-sm font-bold mb-1">
                                    <span className="text-slate-600">Progress</span>
                                    <span className="text-pink-600">{percentage}%</span>
                                </div>
                                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                                    <div 
                                    className="h-full bg-linear-to-r from-pink-500 to-rose-400 rounded-full transition-all duration-1000 relative"
                                    style={{ width: `${percentage}%` }}
                                    >
                                    <div className="absolute top-0 left-0 w-full h-full bg-white/20 animate-pulse"></div>
                                    </div>
                                </div>
                                <div className="flex justify-between text-xs text-slate-400 mt-1">
                                    <span>₹{goal.currentAmount.toLocaleString()} Saved</span>
                                    <span>₹{(goal.targetAmount - goal.currentAmount).toLocaleString()} To Go</span>
                                </div>
                             </div>

                             {/* Smart Insights */}
                             {metric && !metric.expired && metric.daysLeft > 0 && percentage < 100 && (
                                <div className="bg-pink-50/50 rounded-lg p-3 flex items-center justify-between border border-pink-100/50">
                                    <div className="flex items-center gap-2">
                                        <TrendingUp size={16} className="text-pink-500"/>
                                        <span className="text-xs font-medium text-slate-600">
                                            Save <strong>₹{metric.monthlyRequired.toLocaleString()}</strong> / month
                                        </span>
                                    </div>
                                    <span className="text-xs font-bold text-pink-500 bg-pink-100 px-2 py-1 rounded-full">
                                        {metric.daysLeft} days left
                                    </span>
                                </div>
                             )}
                             {metric && metric.expired && percentage < 100 && (
                                 <div className="bg-red-50/50 rounded-lg p-3 text-xs text-red-500 border border-red-100">
                                     Target date passed!
                                 </div>
                             )}
                        </div>
                    </div>
                 );
             })}
             {savings.length === 0 && !loading && (
                 <div className="text-center py-12 text-slate-400">
                     <p>No savings goals yet. Start dreaming!</p>
                 </div>
             )}
        </div>
      </div>
    </div>
  );
}
