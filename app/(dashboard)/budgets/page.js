'use client';

import { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import { Wallet, Plus, Trash2, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';
import { showError, showDeleteConfirm, showToast } from '@/lib/sweetalert';

const CATEGORIES = [
  'Food', 'Travel', 'Entertainment', 'Shopping', 'Health', 'Utilities', 
  'Education', 'Personal', 'Groceries', 'Fuel', 'Subscriptions', 'Other'
];

export default function BudgetPage() {
  const { data: session } = useSession();
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ category: '', monthlyLimit: '', alertAt: '80' });

  useEffect(() => {
    if (session) fetchBudgets();
  }, [session]);

  const fetchBudgets = async () => {
    try {
      const res = await fetch('/api/budgets');
      if (res.ok) {
        const data = await res.json();
        setBudgets(data);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setForm({ category: '', monthlyLimit: '', alertAt: '80' });
        setShowForm(false);
        fetchBudgets();
        showToast('success', 'Budget created!');
      } else {
        showError('Error', 'Failed to create budget');
      }
    } catch (e) { 
      showError('Error', 'Failed to create budget');
    }
  };

  const handleDelete = async (id) => {
    const result = await showDeleteConfirm('Remove Budget?', 'This action cannot be undone.');
    if (!result.isConfirmed) return;
    await fetch(`/api/budgets?id=${id}`, { method: 'DELETE' });
    fetchBudgets();
    showToast('success', 'Budget removed!');
  };

  const getStatusColor = (status) => {
    if (status === 'EXCEEDED') return 'bg-red-500';
    if (status === 'WARNING') return 'bg-amber-500';
    return 'bg-green-500';
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= 80) return 'bg-amber-500';
    if (percentage >= 50) return 'bg-blue-500';
    return 'bg-green-500';
  };

  if (!session) return <div className="p-8">Please log in.</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8 px-1 sm:px-0 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Budget Manager</h1>
          <p className="text-slate-500 text-sm sm:text-base">Set spending limits for each category</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 shadow-purple-500/30 w-full sm:w-auto"
        >
          <Plus size={20} /> Add Budget
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="glass-panel p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Category</label>
              <select
                required
                className="input-field"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                <option value="">Select Category</option>
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Monthly Limit (₹)</label>
              <input
                type="number"
                required
                placeholder="5000"
                className="input-field"
                value={form.monthlyLimit}
                onChange={(e) => setForm({ ...form, monthlyLimit: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Alert at (%)</label>
              <input
                type="number"
                placeholder="80"
                className="input-field"
                value={form.alertAt}
                onChange={(e) => setForm({ ...form, alertAt: e.target.value })}
              />
            </div>
          </div>
          <button type="submit" className="btn-primary bg-purple-600 hover:bg-purple-700">
            Save Budget
          </button>
        </form>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 border-t-4 border-t-purple-500">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-xl">
              <Wallet className="text-purple-600" size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase">Total Budget</p>
              <p className="text-2xl font-bold text-slate-800">
                ₹{budgets.reduce((sum, b) => sum + b.monthlyLimit, 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        <div className="glass-card p-6 border-t-4 border-t-blue-500">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-xl">
              <TrendingUp className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase">Total Spent</p>
              <p className="text-2xl font-bold text-slate-800">
                ₹{budgets.reduce((sum, b) => sum + b.spent, 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        <div className="glass-card p-6 border-t-4 border-t-amber-500">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-100 rounded-xl">
              <AlertTriangle className="text-amber-600" size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase">Over Budget</p>
              <p className="text-2xl font-bold text-red-600">
                {budgets.filter(b => b.status === 'EXCEEDED').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Budget List */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading budgets...</div>
      ) : budgets.length === 0 ? (
        <div className="glass-panel p-12 text-center">
          <Wallet size={48} className="mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500">No budgets set yet. Add your first category budget!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {budgets.map(budget => (
            <div
              key={budget.id}
              className={`glass-card p-6 relative group border-l-4 ${
                budget.status === 'EXCEEDED' ? 'border-l-red-500' :
                budget.status === 'WARNING' ? 'border-l-amber-500' : 'border-l-green-500'
              }`}
            >
              {/* Delete Button */}
              <button
                onClick={() => handleDelete(budget.id)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
              >
                <Trash2 size={18} />
              </button>

              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-800">{budget.category}</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${getStatusColor(budget.status)}`}>
                  {budget.status === 'EXCEEDED' ? '⚠ Over Budget' : 
                   budget.status === 'WARNING' ? '⚡ Near Limit' : '✓ On Track'}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>₹{budget.spent.toLocaleString()} spent</span>
                  <span>₹{budget.monthlyLimit.toLocaleString()} limit</span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getProgressColor(budget.percentage)} transition-all duration-500`}
                    style={{ width: `${Math.min(100, budget.percentage)}%` }}
                  ></div>
                </div>
                <p className="text-right text-xs text-slate-400 mt-1">{budget.percentage}%</p>
              </div>

              {/* Remaining */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Remaining</span>
                <span className={`font-bold ${budget.remaining > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ₹{budget.remaining.toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
