'use client';

import { useState, useEffect } from 'react';
import { Calendar, Plus, RefreshCcw, Bell, CreditCard, CheckCircle, Trash2 } from 'lucide-react';
import { showSuccess, showError, showToast, showConfirm } from '@/lib/sweetalert';

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [candidates, setCandidates] = useState([]);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/recurring-expenses');
      if (res.ok) {
        setSubscriptions(await res.json());
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const scanForSubscriptions = async () => {
    setScanning(true);
    setShowScanner(true);
    try {
      const res = await fetch('/api/recurring-expenses/detect', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setCandidates(data);
      }
    } catch (error) {
      showError('Scan Failed', 'Could not detect subscriptions.');
    } finally {
      setScanning(false);
    }
  };

  const addSubscription = async (candidate) => {
    try {
        // Calculate next due date (simple: next month same day)
        const day = new Date(candidate.lastDate).getDate();
        const nextDue = new Date();
        if (day > nextDue.getDate()) {
            nextDue.setDate(day);
        } else {
            nextDue.setMonth(nextDue.getMonth() + 1);
            nextDue.setDate(day);
        }

        const res = await fetch('/api/recurring-expenses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: candidate.name,
                amount: candidate.amount,
                frequency: candidate.frequency,
                dayOfMonth: day,
                category: candidate.category,
                nextDue: nextDue.toISOString()
            })
        });

        if (res.ok) {
            showToast('success', 'Subscription Added');
            fetchSubscriptions(); // Refresh list
            setCandidates(candidates.filter(c => c.name !== candidate.name)); // Remove from candidates
        }
    } catch (error) {
        console.error(error);
    }
  };

  const deleteSubscription = async (id) => {
      const result = await showConfirm('Delete Subscription?', 'Stop tracking this recurring expense?');
      if (result.isConfirmed) {
          try {
              await fetch(`/api/recurring-expenses?id=${id}`, { method: 'DELETE' });
              setSubscriptions(subscriptions.filter(s => s.id !== id));
              showToast('success', 'Deleted');
          } catch (error) {
              showError('Error', 'Failed to delete');
          }
      }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Smart Subscriptions</h1>
          <p className="text-slate-500">Track repeating bills and membership fees.</p>
        </div>
        <button 
          onClick={scanForSubscriptions}
          disabled={scanning}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-200"
        >
          <RefreshCcw size={18} className={scanning ? "animate-spin" : ""} />
          {scanning ? 'Scanning History...' : 'Scan for Subscriptions'}
        </button>
      </div>

      {/* Scanner Result */}
      {showScanner && candidates.length > 0 && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 animate-in slide-in-from-top-4">
              <h2 className="font-bold text-indigo-900 flex items-center gap-2 mb-4">
                  <CheckCircle size={20} />
                  Found {candidates.length} Potential Subscriptions
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {candidates.map((cand, idx) => (
                      <div key={idx} className="bg-white p-4 rounded-xl shadow-xs border border-indigo-100 flex flex-col justify-between">
                          <div>
                              <p className="font-bold text-slate-800">{cand.name}</p>
                              <p className="text-xs text-slate-500">{cand.occurrences} payments found</p>
                              <p className="text-indigo-600 font-bold mt-2">₹{cand.amount.toLocaleString()}/mo</p>
                          </div>
                          <button 
                             onClick={() => addSubscription(cand)}
                             className="mt-3 w-full py-1.5 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold hover:bg-indigo-200 transition"
                          >
                              Track This
                          </button>
                      </div>
                  ))}
              </div>
          </div>
      )}
      
      {showScanner && !scanning && candidates.length === 0 && (
          <div className="p-4 bg-slate-50 text-slate-500 text-center rounded-xl text-sm">
              No new recurring patterns found in your recent history.
          </div>
      )}

      {/* Subscription List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Add New Card (Manual) */}
          <div className="border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center p-6 text-slate-400 hover:border-indigo-300 hover:bg-slate-50 transition cursor-pointer group h-full min-h-[160px]">
              <div className="p-3 bg-slate-100 rounded-full group-hover:bg-indigo-100 transition mb-2">
                  <Plus size={24} className="text-slate-400 group-hover:text-indigo-600" />
              </div>
              <p className="font-medium text-sm">Add Manually</p>
          </div>

          {loading ? (
              [1,2,3].map(i => <div key={i} className="h-40 bg-slate-50 rounded-2xl animate-pulse"></div>)
          ) : subscriptions.map(sub => (
              <div key={sub.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition relative group">
                  <div className="flex justify-between items-start mb-4">
                      <div className="p-2 bg-purple-50 rounded-xl">
                          <CreditCard size={20} className="text-purple-600" />
                      </div>
                      <div className="text-right">
                          <p className="text-xs text-slate-400 font-semibold uppercase">Frequency</p>
                          <p className="text-xs font-bold text-slate-600">{sub.frequency}</p>
                      </div>
                  </div>
                  
                  <h3 className="font-bold text-lg text-slate-800 mb-1">{sub.name}</h3>
                  <p className="text-2xl font-bold text-slate-900">₹{sub.amount.toLocaleString()}</p>
                  
                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1.5 text-slate-500">
                          <Calendar size={14} />
                          <span>Due {new Date(sub.nextDue).toLocaleDateString()}</span>
                      </div>
                      {!sub.isActive && <span className="text-red-500 text-xs font-bold">Inactive</span>}
                  </div>

                  <button 
                    onClick={() => deleteSubscription(sub.id)}
                    className="absolute top-4 right-4 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                  >
                      <Trash2 size={18} />
                  </button>
              </div>
          ))}
      </div>
    </div>
  );
}
